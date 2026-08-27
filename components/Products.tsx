"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ShoppingCart01Icon,
  ShoppingBasket01Icon,
  FavouriteIcon,
  EyeIcon,
  Alert01Icon,
  InformationCircleIcon,
  Upload01Icon,
  Leaf01Icon,
  PackageIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
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
      // refresh every cart badge on screen straight away
      await queryClient.invalidateQueries({ queryKey: ["cart"] });

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

  const productCount = filteredProducts.length;

  return (
    <div className="space-y-5">
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Products</h1>
            <p className="mt-1 text-sm text-slate-600">
              {status === "pending"
                ? "Loading the catalogue..."
                : `${productCount} ${productCount === 1 ? "product" : "products"} available to order`}
            </p>
          </div>

          {user && (
            <Link
              href="/employee-dashboard/cart"
              className="flex h-9 items-center gap-2 rounded-sm border border-slate-300 px-3 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
            >
              <HugeiconsIcon icon={ShoppingCart01Icon} size={16} strokeWidth={1.8} />
              Cart
              {itemCount > 0 && (
                <span className="rounded-sm bg-brand-700 px-1.5 text-[11px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Compliance and role notices */}
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

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border border-slate-200 bg-white p-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} />
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products"
              className="h-9 w-full rounded-sm border border-slate-300 pl-9 pr-3 text-[13px] outline-none focus:border-brand-600"
            />
          </div>

          <select
            value={perishableFilter}
            onChange={(e) => setPerishableFilter(e.target.value)}
            className="h-9 rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
          >
            <option value="all">All types</option>
            <option value="perishable">Fresh produce</option>
            <option value="non-perishable">Pantry staples</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="h-9 rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Cheapest first</option>
            <option value="price-desc">Most expensive</option>
          </select>
        </div>

        {status === "pending" ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border border-slate-200 bg-white">
                <div className="aspect-square w-full animate-pulse bg-slate-100" />
                <div className="space-y-2 p-3">
                  <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-9 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : status === "error" ? (
          <div className="border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-800">We could not load the catalogue</p>
            <p className="mt-1 text-[13px] text-slate-500">{error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
            >
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="border border-slate-200 bg-white px-6 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <HugeiconsIcon icon={Search01Icon} size={24} strokeWidth={1.5} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-800">No products found</p>
            <p className="mt-1 text-[13px] text-slate-500">
              Try a different search term or filter.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {filteredProducts.map((product: Product) => (
                <article
                  key={product.id}
                  className="flex flex-col border border-slate-200 bg-white transition-colors hover:border-brand-600"
                >
                  <div className="relative aspect-square w-full">
                    <Link href={`/employee-dashboard/products/${product.id}`} className="block h-full w-full">
                      {product.product_image ? (
                        <Image
                          src={product.product_image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-contain p-3"
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                          <HugeiconsIcon icon={ShoppingBasket01Icon} size={30} strokeWidth={1.3} />
                        </span>
                      )}
                    </Link>

                    {!isAdmin && (
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        disabled={isWishlistLoading || isAdmin}
                        title="Save for later"
                        className={cn(
                          "absolute right-2 top-2 rounded-full bg-white/90 p-1.5 disabled:opacity-40",
                          wishlistItems.includes(product.id)
                            ? "text-red-600"
                            : "text-slate-400 hover:text-red-600"
                        )}
                      >
                        <HugeiconsIcon icon={FavouriteIcon} size={17} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col border-t border-slate-100 p-3">
                    <Link
                      href={`/employee-dashboard/products/${product.id}`}
                      className="line-clamp-2 min-h-10 text-[13px] leading-5 text-slate-700 hover:text-brand-700"
                    >
                      {product.name}
                    </Link>

                    <p className="mt-1.5 text-base font-semibold text-slate-900">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: product.currency || "NGN",
                        currencyDisplay: "narrowSymbol",
                        maximumFractionDigits: 0,
                      }).format(product.basePrice)}
                    </p>

                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                      <HugeiconsIcon
                        icon={product.isPerishable ? Leaf01Icon : PackageIcon}
                        size={12}
                        strokeWidth={2}
                      />
                      {product.isPerishable ? "Fresh" : "Pantry"}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1">
                            <button
                              onClick={() => addToCart(product)}
                              disabled={!isCartActionAllowed() || isAddingToCart || isAdmin}
                              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-brand-700 text-[13px] font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              <HugeiconsIcon icon={ShoppingCart01Icon} size={16} strokeWidth={1.8} />
                              {isAddingToCart ? "Adding..." : "Add to cart"}
                            </button>
                          </div>
                        </TooltipTrigger>
                        {(!isCartActionAllowed() || isAdmin) && (
                          <TooltipContent side="top" className="max-w-xs">
                            {getComplianceStatusMessage()}
                          </TooltipContent>
                        )}
                      </Tooltip>

                      <Link
                        href={`/employee-dashboard/products/${product.id}`}
                        title="View details"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700"
                      >
                        <HugeiconsIcon icon={EyeIcon} size={17} strokeWidth={1.8} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredProducts.length > 0 &&
              perishableFilter === "all" &&
              searchQuery === "" && (
                <div ref={ref} className="flex justify-center py-2">
                  {isFetchingNextPage ? (
                    <span className="flex items-center gap-2 text-[13px] text-slate-500">
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        size={15}
                        strokeWidth={2}
                        className="animate-spin"
                      />
                      Loading more products
                    </span>
                  ) : hasNextPage ? (
                    <button
                      onClick={() => fetchNextPage()}
                      className="h-9 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
                    >
                      Show more products
                    </button>
                  ) : (
                    <p className="text-[13px] text-slate-500">That is the whole catalogue.</p>
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
            returnUrl="/employee-dashboard/products"
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
                <dt>Item added</dt>
                <dd className="font-medium">{extensionConfirm.productName}</dd>
              </div>
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
