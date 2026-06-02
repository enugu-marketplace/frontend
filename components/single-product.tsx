"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Heart,
  HeartOff,
  AlertCircle,
  Info,
  ShoppingCart,
  Upload,
  Star,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ConsentUpload from "./ConsentUpload";
import {
  evaluateCartExtensionDecision,
  removeLatestCartItemByProductId,
  fetchCreditSnapshot,
} from "@/lib/credit-feedback";

interface ExtensionConfirmState {
  open: boolean;
  loanUnit: number;
  extensionRemaining: number;
  cartTotal: number;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  product_image: string;
  basePrice: number;
  currency: string;
  isPerishable: boolean;
  active: boolean;
  variants: any[];
  rating?: number;
  reviewCount?: number;
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: clientSession, status } = useSession();
  const [serverUser, setServerUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [extensionConfirm, setExtensionConfirm] = useState<ExtensionConfirmState>({
    open: false,
    loanUnit: 0,
    extensionRemaining: 0,
    cartTotal: 0,
  });
  const [isRevertingCartItem, setIsRevertingCartItem] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setServerUser(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Session error:", err);
        setIsLoading(false);
      });
  }, []);

  const user = clientSession?.user || serverUser;
  const isAdmin = user?.role === "super_admin";

  // React Query for compliance data
  const { data: complianceData, isLoading: isComplianceLoading } = useQuery({
    queryKey: ["compliance", user?.token],
    queryFn: async () => {
      if (!user?.token || isAdmin) return null;
      
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/get-compliance`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        return response.data.data;
      } catch (error) {
        console.error("Failed to fetch compliance data:", error);
        return null;
      }
    },
    enabled: !!user?.token && !isAdmin,
  });

  // React Query for wishlist data
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist", user?.token],
    queryFn: async () => {
      if (!user?.token || isAdmin) return [];
      
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        return response.data.data;
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        return [];
      }
    },
    enabled: !!user?.token && !isAdmin,
  });

  // Update wishlist status based on fetched data
  useEffect(() => {
    if (wishlistData) {
      const isWishlisted = wishlistData.some(
        (item: any) => item.productId === params.id
      );
      setIsInWishlist(isWishlisted);
    }
  }, [wishlistData, params.id]);

  // React Query for product data
  const { data: product } = useQuery({
    queryKey: ["product", params.id],
    queryFn: async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/product?product_id=${params.id}`
      );
      const productWithRating = {
        ...res.data.data,
        rating: 5,
        reviewCount: 2,
      };
      return productWithRating as ProductDetails;
    },
  });

  const getComplianceStatusMessage = () => {
    if (isAdmin) return "Admin users cannot add items to cart";
    if (!user) return "Please login to access this feature";
    if (!complianceData) return "Submit compliance form to enable cart features";
    if (complianceData?.status === "PENDING") return "Compliance pending admin approval";
    if (complianceData?.status === "DENIED") return "Your compliance form was rejected. Please submit a new one.";
    return "";
  };

  const isCartActionAllowed = () => {
    if (isAdmin) return false;
    if (!user) return false;
    if (!complianceData) return false;
    if (complianceData?.status === "PENDING") return false;
    if (complianceData?.status === "DENIED") return false;
    return complianceData?.status === "APPROVED";
  };

  const handleAddToCart = async () => {
    if (isAdmin) {
      toast.info("Admin users cannot add items to cart");
      return;
    }

    if (!user) {
      toast.error("Please login to add items to cart");
      router.push(
        `/employee-login?returnUrl=${encodeURIComponent(
          window.location.pathname
        )}`
      );
      return;
    }

    if (user.role !== "user") {
      toast.error("Only employees can add products to cart");
      return;
    }

    if (!complianceData) {
      setShowComplianceDialog(true);
      toast.error("Please submit your compliance form first");
      return;
    }

    if (complianceData?.status === "DENIED") {
      setShowComplianceDialog(true);
      toast.error("Your compliance form was rejected. Please submit a new one.");
      return;
    }

    if (complianceData?.status === "PENDING") {
      toast.error("Your compliance form is pending admin approval");
      return;
    }

    const payload = { productId: params.id, quantity };

    try {
      setIsAddingToCart(true);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart/add-to-cart`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const decision = await evaluateCartExtensionDecision(user.token);

        if (decision?.insufficientCredit) {
          toast.error("Your cart total exceeds your available credit.", {
            description: "Please reduce your cart value before checkout.",
          });
          return;
        }

        if (decision?.requiresExtension) {
          setExtensionConfirm({
            open: true,
            loanUnit: decision.loanUnit,
            extensionRemaining: decision.extensionRemaining,
            cartTotal: decision.cartTotal,
          });
          return;
        }

        const creditSnapshot = await fetchCreditSnapshot(user.token);
        toast.success("Item added to cart!", {
          description: creditSnapshot?.message,
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const toggleWishlist = async () => {
    if (isAdmin) {
      toast.info("Admin users cannot add items to wishlist");
      return;
    }

    if (!user) {
      toast.error("Please login to manage wishlist");
      router.push(
        `/employee-login?returnUrl=${encodeURIComponent(
          window.location.pathname
        )}`
      );
      return;
    }

    if (complianceData?.status === "DENIED") {
      setShowComplianceDialog(true);
      toast.error("Your compliance form was rejected. Please submit a new one.");
      return;
    }

    if (complianceData?.status === "PENDING") {
      toast.error("Your compliance form is pending admin approval");
      return;
    }

    try {
      const payload = {
        productId: isInWishlist ? null : params.id,
        variantId: null,
      };

      if (isInWishlist) {
        const wishlistRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const itemToRemove = wishlistRes.data.data.find(
          (item: any) => item.productId === params.id
        );

        if (itemToRemove) {
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist/remove-from-wishlist/${itemToRemove.id}`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
        }
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist/add-to-wishlist`,
          payload,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      }

      setIsInWishlist(!isInWishlist);
      toast.success(
        isInWishlist ? "Removed from wishlist" : "Added to wishlist!"
      );
      
      // Invalidate wishlist query to refetch
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleComplianceUploadSuccess = () => {
    setShowComplianceDialog(false);
    toast.success("Compliance form submitted successfully!");
    
    // CRITICAL FIX: Immediately update the UI to show pending status
    // This prevents the "DENIED" banner from showing while waiting for API refetch
    // queryClient.setQueryData(["compliance", user?.token], { 
    //   status: "PENDING", 
    //   is_compliance_submitted: true 
    // });
    
    // Then trigger a refetch to get the actual server state
    queryClient.invalidateQueries({ queryKey: ["compliance"] });
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }
        />
      ));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  const handleContinueWithExtension = () => {
    setExtensionConfirm((prev) => ({ ...prev, open: false }));
    router.push("/employee-dashboard/cart");
  };

  const handleCancelExtensionUsage = async () => {
    if (!user?.token) {
      setExtensionConfirm((prev) => ({ ...prev, open: false }));
      return;
    }

    try {
      setIsRevertingCartItem(true);
      const removed = await removeLatestCartItemByProductId(user.token, params.id);
      if (removed) {
        toast.success("Item removed from cart.");
      } else {
        toast.error("Could not remove item automatically. Please remove it from cart manually.");
      }
      await queryClient.invalidateQueries({ queryKey: ["cart", user.token] });
    } finally {
      setIsRevertingCartItem(false);
      setExtensionConfirm((prev) => ({ ...prev, open: false }));
    }
  };

  if (status === "loading" || isComplianceLoading)
    return <div className="container py-8">Loading...</div>;

  return (
    <div className="container py-8">
      <TooltipProvider>
        {/* Admin notice banner */}
        {isAdmin && (
          <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              <p>Admin view: Cart and wishlist features are disabled.</p>
            </div>
          </div>
        )}

        {/* Compliance Status Banners */}
        {!isAdmin && user && (!complianceData || complianceData?.is_compliance_submitted === false) && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>Please submit your compliance form to add items to cart.</p>
              <Button
                onClick={() => setShowComplianceDialog(true)}
                className="ml-4 bg-yellow-600 hover:bg-yellow-700"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit Compliance
              </Button>
            </div>
          </div>
        )}

        {!isAdmin && user && complianceData?.status === "PENDING" && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>
                Your compliance form is pending admin approval. You cannot add
                items until approved.
              </p>
            </div>
          </div>
        )}

        {!isAdmin && user && complianceData?.status === "DENIED" && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <div>
                <p className="font-semibold">Compliance Form Rejected</p>
                <p>Your compliance form was rejected. Please submit a new one.</p>
                <Button
                  onClick={() => setShowComplianceDialog(true)}
                  className="mt-2 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit New Compliance
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative">
            <div className="relative h-96 w-full rounded-lg overflow-hidden">
              <Image
                src={product?.product_image || "/placeholder-product.jpg"}
                alt={product?.name || "Product image"}
                fill
                className="object-contain"
                priority
              />
              {product?.active && (
                <div className="absolute top-3 left-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  In Stock
                </div>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{product?.name}</h1>

            <div className="flex items-center mb-3">
              <div className="flex mr-1">
                {renderStars(product?.rating || 5)}
              </div>
              <span className="text-xs text-gray-600">
                ({product?.reviewCount || 2})
              </span>
            </div>

            <p className="text-gray-600 mb-6">{product?.description}</p>

            <div className="mb-6">
              <span
                className={`text-sm px-3 py-1 rounded ${
                  product?.isPerishable
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {product?.isPerishable ? "Perishable" : "Non-Perishable"}
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Price</h2>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: product?.currency || "NGN",
                }).format(product?.basePrice || 0)}
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Quantity</h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementQuantity}
                >
                  -
                </Button>
                <span className="text-lg font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementQuantity}
                >
                  +
                </Button>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    size="lg"
                    className="w-full bg-green-700 hover:bg-green-600 text-white"
                    onClick={handleAddToCart}
                    disabled={
                      isAddingToCart || !isCartActionAllowed() || isAdmin
                    }
                  >
                    {isAddingToCart ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {(!isCartActionAllowed() || isAdmin) && (
                <TooltipContent side="top" className="max-w-xs">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-yellow-500" />
                    <p>{getComplianceStatusMessage()}</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full mt-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={toggleWishlist}
                    disabled={!isCartActionAllowed() || isAdmin}
                  >
                    {isInWishlist ? (
                      <>
                        <HeartOff className="mr-2 h-4 w-4" />
                        Remove from Wishlist
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Add to Wishlist
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {(!isCartActionAllowed() || isAdmin) && (
                <TooltipContent side="top" className="max-w-xs">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-yellow-500" />
                    <p>{getComplianceStatusMessage()}</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>

            {(!isCartActionAllowed() || isAdmin) && user && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-sm mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-500" />
                  {isAdmin ? "Admin Status" : "Compliance Status"}
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {isAdmin ? (
                    <li>• Admin users cannot add items to cart or wishlist</li>
                  ) : (
                    <>
                      <li>
                        • Compliance Submitted: {complianceData ? "Yes" : "No"}
                      </li>
                      {complianceData && (
                        <li>
                          • Approval Status:{" "}
                          {complianceData.status || "Checking..."}
                        </li>
                      )}
                    </>
                  )}
                </ul>
                {!isAdmin && complianceData?.status === "DENIED" && (
                  <Button
                    onClick={() => setShowComplianceDialog(true)}
                    className="mt-2 w-full"
                    variant="destructive"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Submit New Compliance
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {!isAdmin && (
          <ConsentUpload
            isOpen={showComplianceDialog}
            onClose={() => setShowComplianceDialog(false)}
            onUploadSuccess={handleComplianceUploadSuccess}
            token={user?.token || ""}
          />
        )}

        <Dialog
          open={extensionConfirm.open}
          onOpenChange={(open) => {
            if (!open && !isRevertingCartItem) {
              handleCancelExtensionUsage();
            }
          }}
        >
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Use Extension Buffer To Complete This Purchase?</DialogTitle>
              <DialogDescription>
                Your purchasing unit cannot fully cover this cart total. Continue with extension buffer (10% of salary)?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-lg border bg-amber-50 p-4">
              <p className="text-sm text-amber-900"><span className="font-semibold">Purchasing unit remaining:</span> {formatCurrency(extensionConfirm.loanUnit)}</p>
              <p className="text-sm text-amber-900"><span className="font-semibold">Extension buffer available:</span> {formatCurrency(extensionConfirm.extensionRemaining)}</p>
              <p className="text-sm text-amber-900"><span className="font-semibold">Current cart total:</span> {formatCurrency(extensionConfirm.cartTotal)}</p>
              <p className="text-sm text-amber-800">If you continue, the extension amount used will be deducted from your next salary cycle.</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelExtensionUsage} disabled={isRevertingCartItem}>
                {isRevertingCartItem ? "Removing item..." : "Cancel And Remove Item"}
              </Button>
              <Button className="bg-orange-700 hover:bg-orange-600" onClick={handleContinueWithExtension}>
                Continue To Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
}