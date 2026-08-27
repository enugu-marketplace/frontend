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
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  Alert01Icon,
  InformationCircleIcon,
  ShoppingCart01Icon,
  ShoppingBasket01Icon,
  Upload01Icon,
  MinusSignIcon,
  PlusSignIcon,
  ArrowLeft01Icon,
  Leaf01Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
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
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
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

  if (status === "loading" || isComplianceLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="aspect-square w-full animate-pulse border border-slate-200 bg-slate-100" />
        <div className="space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
          <div className="h-11 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  const complianceBlocked = !isCartActionAllowed() || isAdmin;

  return (
    <div className="space-y-5">
      <TooltipProvider delayDuration={200}>
        <Link
          href="/employee-dashboard/products"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-brand-700"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
          Back to products
        </Link>

        {/* Role and compliance notices */}
        <div className="space-y-2">
          {isAdmin && (
            <p className="flex items-center gap-2 border-l-4 border-violet-500 bg-violet-50 px-3 py-2.5 text-sm text-violet-900">
              <HugeiconsIcon icon={InformationCircleIcon} size={17} strokeWidth={1.8} />
              Admin view. Cart and wishlist are disabled.
            </p>
          )}

          {!isAdmin && user && (!complianceData || complianceData?.is_compliance_submitted === false) && (
            <div className="flex flex-wrap items-center gap-3 border-l-4 border-amber-500 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <HugeiconsIcon icon={Alert01Icon} size={17} strokeWidth={1.8} />
              Submit your compliance form before you can add items to your cart.
              <button
                onClick={() => setShowComplianceDialog(true)}
                className="ml-auto flex items-center gap-1.5 rounded-sm bg-amber-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-amber-700"
              >
                <HugeiconsIcon icon={Upload01Icon} size={15} strokeWidth={1.8} />
                Submit form
              </button>
            </div>
          )}

          {!isAdmin && user && complianceData?.status === "PENDING" && (
            <p className="flex items-center gap-2 border-l-4 border-sky-500 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
              <HugeiconsIcon icon={Alert01Icon} size={17} strokeWidth={1.8} />
              Your compliance form is awaiting approval. You can browse, but not order yet.
            </p>
          )}

          {!isAdmin && user && complianceData?.status === "DENIED" && (
            <div className="flex flex-wrap items-center gap-3 border-l-4 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-900">
              <HugeiconsIcon icon={Alert01Icon} size={17} strokeWidth={1.8} />
              Your compliance form was rejected. Please submit a new one.
              <button
                onClick={() => setShowComplianceDialog(true)}
                className="ml-auto flex items-center gap-1.5 rounded-sm bg-red-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-red-700"
              >
                <HugeiconsIcon icon={Upload01Icon} size={15} strokeWidth={1.8} />
                Submit new form
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="relative aspect-square w-full border border-slate-200 bg-white">
            {product?.product_image ? (
              <Image
                src={product.product_image}
                alt={product?.name || "Product image"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6"
                priority
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                <HugeiconsIcon icon={ShoppingBasket01Icon} size={44} strokeWidth={1.2} />
              </span>
            )}

            {product?.active && (
              <span className="absolute left-3 top-3 rounded-sm bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-800 ring-1 ring-brand-200">
                In stock
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{product?.name}</h1>

            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-slate-500">
              <HugeiconsIcon
                icon={product?.isPerishable ? Leaf01Icon : PackageIcon}
                size={14}
                strokeWidth={1.8}
              />
              {product?.isPerishable ? "Fresh produce" : "Pantry staple"}
            </p>

            <p className="mt-4 text-3xl font-semibold text-slate-900">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: product?.currency || "NGN",
                maximumFractionDigits: 0,
              }).format(product?.basePrice || 0)}
            </p>

            {product?.description && (
              <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>
            )}

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-[13px] font-medium text-slate-700">Quantity</p>
              <div className="mt-2 flex h-10 w-fit items-center rounded-sm border border-slate-300">
                <button
                  onClick={decrementQuantity}
                  className="flex h-full w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                  aria-label="Decrease quantity"
                >
                  <HugeiconsIcon icon={MinusSignIcon} size={15} strokeWidth={2} />
                </button>
                <span className="flex h-full w-12 items-center justify-center border-x border-slate-300 text-sm font-medium">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="flex h-full w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                  aria-label="Increase quantity"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || complianceBlocked}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-brand-700 text-sm font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      <HugeiconsIcon icon={ShoppingCart01Icon} size={17} strokeWidth={1.8} />
                      {isAddingToCart ? "Adding..." : "Add to cart"}
                    </button>
                  </div>
                </TooltipTrigger>
                {complianceBlocked && (
                  <TooltipContent side="top" className="max-w-xs">
                    {getComplianceStatusMessage()}
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="sm:w-44">
                    <button
                      onClick={toggleWishlist}
                      disabled={complianceBlocked}
                      className={cn(
                        "flex h-11 w-full items-center justify-center gap-2 rounded-sm border text-sm font-medium disabled:border-slate-200 disabled:text-slate-400",
                        isInWishlist
                          ? "border-brand-600 text-brand-700"
                          : "border-slate-300 text-slate-700 hover:border-brand-600 hover:text-brand-700"
                      )}
                    >
                      <HugeiconsIcon icon={FavouriteIcon} size={17} strokeWidth={1.8} />
                      {isInWishlist ? "Saved" : "Save"}
                    </button>
                  </div>
                </TooltipTrigger>
                {complianceBlocked && (
                  <TooltipContent side="top" className="max-w-xs">
                    {getComplianceStatusMessage()}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>

            {complianceBlocked && user && (
              <div className="mt-5 border border-slate-200 bg-white p-4">
                <p className="text-[13px] font-medium text-slate-800">
                  {isAdmin ? "Admin account" : "Compliance status"}
                </p>
                <ul className="mt-2 space-y-1 text-[13px] text-slate-600">
                  {isAdmin ? (
                    <li>Admin users cannot add items to cart or wishlist.</li>
                  ) : (
                    <>
                      <li>Form submitted: {complianceData ? "Yes" : "No"}</li>
                      {complianceData && (
                        <li>Approval status: {complianceData.status || "Checking..."}</li>
                      )}
                    </>
                  )}
                </ul>

                {!isAdmin && complianceData?.status === "DENIED" && (
                  <button
                    onClick={() => setShowComplianceDialog(true)}
                    className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-red-600 text-[13px] font-medium text-white hover:bg-red-700"
                  >
                    <HugeiconsIcon icon={Upload01Icon} size={15} strokeWidth={1.8} />
                    Submit new form
                  </button>
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
              <DialogTitle>Use your extension buffer?</DialogTitle>
              <DialogDescription>
                Your purchasing unit does not cover this cart total. You can continue using the
                extension buffer (10% of salary).
              </DialogDescription>
            </DialogHeader>

            <dl className="space-y-1.5 border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex justify-between gap-4">
                <dt>Purchasing unit left</dt>
                <dd className="font-medium">{formatCurrency(extensionConfirm.loanUnit)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Extension buffer</dt>
                <dd className="font-medium">{formatCurrency(extensionConfirm.extensionRemaining)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Cart total</dt>
                <dd className="font-medium">{formatCurrency(extensionConfirm.cartTotal)}</dd>
              </div>
              <p className="pt-1 text-[13px]">
                Anything taken from the buffer is deducted from your next salary cycle.
              </p>
            </dl>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelExtensionUsage}
                disabled={isRevertingCartItem}
              >
                {isRevertingCartItem ? "Removing item..." : "Cancel and remove item"}
              </Button>
              <Button
                className="bg-brand-700 hover:bg-brand-800"
                onClick={handleContinueWithExtension}
              >
                Continue to cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
}
