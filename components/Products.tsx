"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Heart, HeartOff, Star, ShoppingCart, AlertCircle, Info, Upload } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ConsentUpload from "@/components/ConsentUpload";
import {
  evaluateCartExtensionDecision,
  fetchCreditSnapshot,
  removeLatestCartItemByProductId,
} from "@/lib/credit-feedback";

interface Product {
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

interface ExtensionConfirmState {
  open: boolean;
  productId: string;
  productName: string;
  loanUnit: number;
  extensionRemaining: number;
  cartTotal: number;
}

function useCart(token?: string) {
  const { data: cartResponse, error, refetch } = useQuery({
    queryKey: ["cart", token],
    queryFn: async () => {
      if (!token) return { data: [] };
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (error) {
        console.error("Cart fetch error:", error);
        return { data: [] };
      }
    },
    enabled: !!token,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  const items = cartResponse?.data || [];
  const itemCount = items.reduce(
    (sum: number, item: { quantity: number }) => sum + (item.quantity || 0),
    0
  );

  return { items, itemCount, error, refetch };
}

function CartPreview({ token }: { token?: string }) {
  const router = useRouter();
  const { itemCount, error, refetch } = useCart(token);

  return (
    <div className="relative">
      <Button
        onClick={() => {
          refetch();
          router.push("/employee-dashboard/cart");
        }}
        className="bg-orange-600 hover:bg-orange-700 relative"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Cart
        {itemCount > 0 && (
          <span className="ml-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
            {itemCount}
          </span>
        )}
      </Button>
      {error && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
          !
        </span>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [perishableFilter, setPerishableFilter] = useState<string>("all");
  const { data: clientSession } = useSession();
  const [serverUser, setServerUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("name-asc");
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [extensionConfirm, setExtensionConfirm] = useState<ExtensionConfirmState>({
    open: false,
    productId: "",
    productName: "",
    loanUnit: 0,
    extensionRemaining: 0,
    cartTotal: 0,
  });
  const [isRevertingCartItem, setIsRevertingCartItem] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const { ref, inView } = useInView();
  const router = useRouter();
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
  const { itemCount } = useCart(user?.token); 

  

  

 



  // React Query for compliance data
  const { data: complianceData } = useQuery({
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

  // React Query for products (infinite scroll)
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["products", searchQuery, perishableFilter, sortOption],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`,
        {
          params: {
            page: pageParam,
            limit: 12,
            search: searchQuery || undefined,
            isPerishable: perishableFilter !== "all" ? perishableFilter === "perishable" : undefined,
            sort: sortOption,
          },
        }
      );

      const productsWithRatings = res.data.data.map((product: Product) => ({
        ...product,
        rating: 5,
        reviewCount: 2,
      }));

      return { 
        ...res.data, 
        data: productsWithRatings,
        currentPage: pageParam,
        hasMore: res.data.data.length === 12
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.currentPage + 1 : undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  useEffect(() => {
    if (user?.token) {
      // Fetch wishlist
      const fetchWishlist = async () => {
        try {
          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          const items = res.data.data.map((item: any) => item.productId);
          setWishlistItems(items);
        } catch (error) {
          console.error("Failed to fetch wishlist", error);
        }
      };

      fetchWishlist();
    }
  }, [user, isAdmin]);

  const allProducts = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (perishableFilter !== "all") {
      const isPerishable = perishableFilter === "perishable";
      result = result.filter(
        (product) => product.isPerishable === isPerishable
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.basePrice.toString().includes(query)
      );
    }

    switch (sortOption) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        result.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case "price-desc":
        result.sort((a, b) => b.basePrice - a.basePrice);
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, perishableFilter, searchQuery, sortOption]);

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

  const toggleDescription = (productId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleWishlist = async (productId: string) => {
    if (isAdmin) {
      toast.info("Admin users cannot add items to wishlist");
      return;
    }

    if (!user?.token) {
      toast.error("Please login to manage your wishlist");
      router.push(
        `/employee-login?returnUrl=${encodeURIComponent(
          window.location.pathname
        )}`
      );
      return;
    }

    if (!complianceData) {
      setShowComplianceDialog(true);
      toast.error("Please submit your compliance form first");
      return;
    }

    if (complianceData?.status === "PENDING") {
      toast.error("Your compliance form is pending admin approval");
      return;
    }

    if (complianceData?.status === "DENIED") {
      setShowComplianceDialog(true);
      toast.error("Your compliance form was rejected. Please submit a new one.");
      return;
    }

    try {
      setIsWishlistLoading(true);
      const isCurrentlyInWishlist = wishlistItems.includes(productId);

      const payload = {
        productId: isCurrentlyInWishlist ? null : productId,
        variantId: null,
      };

      if (isCurrentlyInWishlist) {
        const wishlistRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        const itemToRemove = wishlistRes.data.data.find(
          (item: any) => item.productId === productId
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

      setWishlistItems((prev) =>
        isCurrentlyInWishlist
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );

      toast.success(
        isCurrentlyInWishlist ? "Removed from wishlist" : "Added to wishlist!"
      );
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setIsWishlistLoading(false);
    }
  };

 const addToCart = async (product: Product) => {
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

  if (complianceData?.status === "PENDING") {
    toast.error("Your compliance form is pending admin approval");
    return;
  }

  if (complianceData?.status === "DENIED") {
    setShowComplianceDialog(true);
    toast.error("Your compliance form was rejected. Please submit a new one.");
    return;
  }

  const payload = { productId: product.id, quantity: 1 };
  let toastId: string | number | undefined;

  try {
    setIsAddingToCart(true);
    toastId = toast.loading("Adding to cart...");

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart/add-to-cart`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.status === 200 || response.status === 201) {
      // Force a complete refetch of the cart
      await queryClient.refetchQueries({ 
        queryKey: ['cart', user.token],
        exact: true,
      });

      const decision = await evaluateCartExtensionDecision(user.token);

      if (decision?.insufficientCredit) {
        toast.error("Your cart total exceeds your available credit.", {
          id: toastId,
          description: "Please remove some items before checking out.",
        });
        return;
      }

      if (decision?.requiresExtension) {
        toast.dismiss(toastId);
        setExtensionConfirm({
          open: true,
          productId: product.id,
          productName: product.name,
          loanUnit: decision.loanUnit,
          extensionRemaining: decision.extensionRemaining,
          cartTotal: decision.cartTotal,
        });
        return;
      }

      const creditSnapshot = await fetchCreditSnapshot(user.token);
      
      toast.success("Item added to cart!", {
        id: toastId,
        description: creditSnapshot?.message,
        action: {
          label: "View Cart",
          onClick: () => router.push("/employee-dashboard/cart"),
        },
      });
    } else {
      // Handle other successful status codes if needed
      toast.error("Unexpected response from server", {
        id: toastId,
      });
    }
  } catch (error: any) {
    console.error("Add to cart error:", error);
    
    // More specific error handling
    if (error.response) {
      // Server responded with error status
      toast.error(error.response.data?.message || `Server error: ${error.response.status}`, {
        id: toastId,
      });
    } else if (error.request) {
      // Request was made but no response received
      toast.error("Network error - please check your connection", {
        id: toastId,
      });
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      toast.error("Request timeout - please try again", {
        id: toastId,
      });
    } else {
      // Other errors
      toast.error(error.message || "Failed to add to cart", {
        id: toastId,
      });
    }
  } finally {
    setIsAddingToCart(false);
  }
};

  const handleComplianceUploadSuccess = () => {
    setShowComplianceDialog(false);
    queryClient.invalidateQueries({ queryKey: ["compliance"] });
  };

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

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = "/placeholder-product.jpg";
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
    if (!user?.token || !extensionConfirm.productId) {
      setExtensionConfirm((prev) => ({ ...prev, open: false }));
      return;
    }

    try {
      setIsRevertingCartItem(true);
      const removed = await removeLatestCartItemByProductId(user.token, extensionConfirm.productId);
      if (removed) {
        toast.success(`${extensionConfirm.productName} removed from cart.`);
      } else {
        toast.error("Could not remove item automatically. Please remove it manually in cart.");
      }
      await queryClient.invalidateQueries({ queryKey: ["cart", user.token] });
    } finally {
      setIsRevertingCartItem(false);
      setExtensionConfirm((prev) => ({ ...prev, open: false }));
    }
  };

  return (
    <div className="container py-8">
      <TooltipProvider>
        {/* Fixed Cart Icon */}
      
{user && (
  <div className="fixed bottom-6 right-6 z-50">
    <button
      onClick={() => router.push("/employee-dashboard/cart")}
      className="relative bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg"
    >
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
          {itemCount}
        </span>
      )}
    </button>
  </div>
)}


        {/* Header with Cart Button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">All Products</h1>
          <CartPreview token={user?.token} />
        </div>

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

        {isAdmin && (
          <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              <p>Admin view: Cart and wishlist features are disabled.</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            placeholder="Search by product name, description, or price..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />

          <Select onValueChange={setPerishableFilter} value={perishableFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="perishable">Perishable</SelectItem>
              <SelectItem value="non-perishable">Non Perishable</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setSortOption} value={sortOption}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status === "pending" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-full border-0 shadow-md">
                <CardHeader className="p-0">
                  <div className="relative h-60 w-full bg-gray-200 animate-pulse" />
                </CardHeader>
                <CardContent className="pt-4 space-y-2 p-5">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : status === "error" ? (
          <div className="text-center py-12">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded max-w-md mx-auto">
              <p className="font-bold">Error loading products</p>
              <p className="text-sm">{error.message}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-600 hover:bg-red-700"
                size="sm"
              >
                Reload Page
              </Button>
            </div>
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No products found matching your filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: Product) => {
                  const isDescriptionExpanded = expandedDescriptions.has(product.id);
                  const truncatedDescription = product.description.length > 100 
                    ? product.description.substring(0, 100) + '...' 
                    : product.description;

                  return (
                    <Card
                      key={product.id}
                      className="h-full flex flex-col overflow-hidden border-0 shadow-md"
                    >
                      <CardHeader className="p-0 relative">
                        <div className="relative h-60 w-full">
                          <Image
                            src={
                              product.product_image || "/placeholder-product.jpg"
                            }
                            alt={product.name}
                            fill
                            className="object-contain w-full h-full p-4 bg-white"
                            onError={handleImageError}
                            style={{ objectFit: "contain" }}
                          />
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
                            aria-label="Add to wishlist"
                            disabled={isWishlistLoading || isAdmin}
                          >
                            {wishlistItems.includes(product.id) ? (
                              <HeartOff size={20} className="text-red-500" />
                            ) : (
                              <Heart size={20} className="text-gray-600" />
                            )}
                          </button>

                          {product.active && (
                            <div className="absolute top-3 left-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              In Stock
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 flex flex-col flex-grow p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{product.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              product.isPerishable
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {product.isPerishable
                              ? "Perishable"
                              : "Non-Perishable"}
                          </span>
                        </div>

                        <div className="flex items-center mb-3">
                          <div className="flex mr-1">
                            {renderStars(product.rating || 5)}
                          </div>
                          <span className="text-xs text-gray-600">
                            ({product.reviewCount || 2})
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 flex-grow">
                          {isDescriptionExpanded ? product.description : truncatedDescription}
                          {product.description.length > 100 && (
                            <button
                              onClick={() => toggleDescription(product.id)}
                              className="text-orange-600 hover:text-orange-700 ml-1 text-sm font-medium"
                            >
                              {isDescriptionExpanded ? "View less" : "View more"}
                            </button>
                          )}
                        </p>

                        <div className="mt-auto">
                          <div className="mb-4">
                            <span className="font-bold text-lg">
                              {new Intl.NumberFormat("en-NG", {
                                style: "currency",
                                currency: product.currency,
                                currencyDisplay: "narrowSymbol",
                              }).format(product.basePrice)}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  className="w-full bg-orange-700 hover:bg-orange-600 h-11 font-bold"
                                  onClick={() => addToCart(product)}
                                  disabled={!isCartActionAllowed() || isAddingToCart || isAdmin}
                                >
                                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                                </Button>
                              </TooltipTrigger>
                              {(!isCartActionAllowed() || isAdmin) && (
                                <TooltipContent side="top" className="max-w-xs">
                                  <p>{getComplianceStatusMessage()}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>

                            <Button
                              asChild
                              variant="outline"
                              className="w-full h-11"
                            >
                              <Link href={`/employee-dashboard/products/${product.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredProducts.length > 0 &&
              perishableFilter === "all" &&
              searchQuery === "" && (
                <div
                  ref={ref}
                  className="h-10 flex items-center justify-center mt-8"
                >
                  {isFetchingNextPage ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary rounded-full animate-spin" />
                      <span>Loading more products...</span>
                    </div>
                  ) : hasNextPage ? (
                    <Button variant="outline" onClick={() => fetchNextPage()}>
                      Load More
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No more products to load
                    </p>
                  )}
                </div>
              )}
          </>
        )}

        {/* Compliance Upload Dialog */}
        {!isAdmin && (
          <ConsentUpload
            isOpen={showComplianceDialog}
            onClose={() => setShowComplianceDialog(false)}
            onUploadSuccess={handleComplianceUploadSuccess}
            token={user?.token || ""}
            returnUrl={window.location.pathname}
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
              <DialogDescription className="text-sm">
                Your purchasing unit cannot fully cover this cart total. You can continue using your extension buffer (10% of salary).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-lg border bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Item added:</span> {extensionConfirm.productName}
              </p>
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Purchasing unit remaining:</span> {formatCurrency(extensionConfirm.loanUnit)}
              </p>
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Extension buffer available:</span> {formatCurrency(extensionConfirm.extensionRemaining)}
              </p>
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Current cart total:</span> {formatCurrency(extensionConfirm.cartTotal)}
              </p>
              <p className="text-sm text-amber-800">
                If you continue, the extension amount used will be deducted from your next salary cycle.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelExtensionUsage}
                disabled={isRevertingCartItem}
              >
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