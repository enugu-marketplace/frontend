"use client";

import { useState, useEffect, useMemo } from "react";
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
import Link from "next/link";
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
  Cancel01Icon,
  ShuffleIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import ConsentUpload from "@/components/ConsentUpload";
import { cn } from "@/lib/utils";
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
  /** API returns a category object; `categoryName` is the flattened label we render */
  category?: { id: string; name: string; slug: string } | string | null;
  categoryName?: string;
  unit?: string;
  packageType?: string;
  createdAt?: string;
}

interface ExtensionConfirmState {
  open: boolean;
  productId: string;
  productName: string;
  loanUnit: number;
  extensionRemaining: number;
  cartTotal: number;
}

// Stable pseudo-random ordering: the same seed always produces the same shuffle,
// so the grid does not jump around while you type in the search box.
function shuffleRank(id: string, seed: number) {
  let hash = seed;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return hash;
}

const ELIGIBILITY_NOTICE_KEY = "enugu-market:eligibility-notice";

const formatNaira = (amount: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);

/* --------------------------------------------------------------- product card */

type ProductCardProps = {
  product: Product;
  isRegularUser: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isSignedIn: boolean;
  isWishlisted: boolean;
  isWishlistLoading: boolean;
  isAddingToCart: boolean;
  cartAllowed: boolean;
  complianceMessage: string;
  onToggleWishlist: (productId: string, productName: string) => void;
  onAddToCart: (product: Product) => void;
};

function ProductThumb({ product }: { product: Product }) {
  const [broken, setBroken] = useState(false);

  if (!product.product_image || broken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
        <HugeiconsIcon icon={ShoppingBasket01Icon} size={34} strokeWidth={1.3} />
      </div>
    );
  }

  return (
    <Image
      src={product.product_image}
      alt={product.name}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
      className="object-contain p-3"
      onError={() => setBroken(true)}
    />
  );
}

function ProductCard({
  product,
  isRegularUser,
  isAdmin,
  isAgent,
  isSignedIn,
  isWishlisted,
  isWishlistLoading,
  isAddingToCart,
  cartAllowed,
  complianceMessage,
  onToggleWishlist,
  onAddToCart,
}: ProductCardProps) {
  const detailsHref = `/employee-dashboard/products/${product.id}`;

  return (
    <article className="relative flex flex-col border border-slate-200 bg-white transition-colors hover:border-brand-600">
      <div className="relative aspect-square w-full">
        <ProductThumb product={product} />

        {isRegularUser && (
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id, product.name)}
            disabled={isWishlistLoading || !cartAllowed}
            title={cartAllowed ? "Save for later" : complianceMessage}
            className={cn(
              "absolute right-2 top-2 rounded-full bg-white/90 p-1.5 disabled:opacity-40",
              isWishlisted ? "text-red-600" : "text-slate-400 hover:text-red-600"
            )}
          >
            <HugeiconsIcon icon={FavouriteIcon} size={17} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col border-t border-slate-100 p-3">
        <h3 className="line-clamp-2 min-h-10 text-[13px] leading-5 text-slate-700">
          {product.name}
        </h3>

        <p className="mt-1.5 text-base font-semibold text-slate-900">
          {formatNaira(product.basePrice, product.currency)}
        </p>

        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
          {product.unit && <span>per {product.unit.toLowerCase()}</span>}
          {product.unit && <span aria-hidden>·</span>}
          <HugeiconsIcon
            icon={product.isPerishable ? Leaf01Icon : PackageIcon}
            size={12}
            strokeWidth={2}
          />
          {product.isPerishable ? "Fresh" : "Pantry"}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {isRegularUser && (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={!cartAllowed || isAddingToCart}
              title={cartAllowed ? undefined : complianceMessage}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm bg-brand-700 text-[13px] font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
            >
              <HugeiconsIcon icon={ShoppingCart01Icon} size={16} strokeWidth={1.8} />
              {isAddingToCart ? "Adding..." : "Add to cart"}
            </button>
          )}

          {!isSignedIn && (
            <Link
              href="/employee-login"
              className="flex h-9 flex-1 items-center justify-center rounded-sm bg-brand-700 text-[13px] font-medium text-white hover:bg-brand-800"
            >
              Sign in to buy
            </Link>
          )}

          {(isAdmin || isAgent) && (
            <span className="flex h-9 flex-1 items-center justify-center rounded-sm bg-slate-100 text-[13px] text-slate-500">
              {isAdmin ? "Admin view" : "Agent view"}
            </span>
          )}

          {isRegularUser && (
            <Link
              href={detailsHref}
              title="View details"
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700"
            >
              <HugeiconsIcon icon={EyeIcon} size={17} strokeWidth={1.8} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="aspect-square w-full animate-pulse bg-slate-100" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-4/5 animate-pulse bg-slate-100" />
        <div className="h-3 w-2/5 animate-pulse bg-slate-100" />
        <div className="h-9 w-full animate-pulse bg-slate-100" />
      </div>
    </div>
  );
}

const ProductInstance = () => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { data: clientSession } = useSession();
  const [serverUser, setServerUser] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
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
  const [returnUrl, setReturnUrl] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [perishableFilter, setPerishableFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("random");
  const [shuffleSeed, setShuffleSeed] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(24);
  const [showEligibilityNotice, setShowEligibilityNotice] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // The header search box and nav links drive the grid through the URL
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setPerishableFilter(searchParams.get("type") || "all");
    setVisibleCount(24);
  }, [searchParams]);

  // Fetch user session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setServerUser(data))
      .catch((err) => console.error("Session error:", err));
  }, []);

  const user = clientSession?.user || serverUser?.user;

  const isAdmin = user?.role === "super_admin";
  const isAgent = user?.role === "fulfillment_officer";
  const isRegularUser = user?.role === "user";

  useEffect(() => {
    setReturnUrl(window.location.pathname);
    setShuffleSeed(Math.floor(Math.random() * 100000));

    try {
      setShowEligibilityNotice(localStorage.getItem(ELIGIBILITY_NOTICE_KEY) !== "dismissed");
    } catch {
      // private browsing or storage disabled - just show it
      setShowEligibilityNotice(true);
    }
  }, []);

  const dismissEligibilityNotice = () => {
    setShowEligibilityNotice(false);
    try {
      localStorage.setItem(ELIGIBILITY_NOTICE_KEY, "dismissed");
    } catch {
      // nothing to persist to; it will show again next visit
    }
  };

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const primaryBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const fallbackBaseUrl = "https://backend-api.enugufoodmarket.com/api/v1";
      const allowProdFallback = process.env.NEXT_PUBLIC_ALLOW_PROD_FALLBACK === "true";

      try {
        let response;

        try {
          response = await axios.get(`${primaryBaseUrl}/products?limit=50`);
        } catch (primaryError: unknown) {
          const httpStatus = axios.isAxiosError(primaryError) ? primaryError.response?.status : undefined;
          const errMsg = axios.isAxiosError(primaryError) ? primaryError.message : String(primaryError);
          console.error(`[Products] Primary failed — status: ${httpStatus ?? "network error"}, message: ${errMsg}`);

          const shouldFallback =
            allowProdFallback &&
            httpStatus === 500 &&
            primaryBaseUrl.includes("backend-staging.enugufoodmarket.com");

          if (!shouldFallback) {
            throw primaryError;
          }

          response = await axios.get(`${fallbackBaseUrl}/products?limit=50`);
          toast.warning("Staging products endpoint is unavailable. Showing production product feed.");
        }

        const raw = (response.data.data as Product[]) || [];
        return raw.map((product) => ({
          ...product,
          categoryName:
            typeof product.category === "string"
              ? product.category
              : product.category?.name || undefined,
        }));
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products");
        return [] as Product[];
      }
    },
  });

  // Only real categories from the API, minus the ones the freshness filters already cover
  const categories = useMemo(() => {
    const fromApi = Array.from(
      new Set((products || []).map((p) => p.categoryName).filter(Boolean) as string[])
    );
    // The freshness chips already cover the perishable/non-perishable split
    return fromApi
      .filter((name) => !/perishable/i.test(name))
      .sort((a, b) => a.localeCompare(b));
  }, [products]);

  const countFor = (predicate: (p: Product) => boolean) =>
    (products || []).filter(predicate).length;

  const filteredProducts = useMemo(() => {
    const list = (products || []).filter((product) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);

      const matchesPerishable =
        perishableFilter === "all" ||
        (perishableFilter === "perishable" && product.isPerishable) ||
        (perishableFilter === "non-perishable" && !product.isPerishable);

      const matchesCategory =
        selectedCategory === "all" || product.categoryName === selectedCategory;

      return matchesSearch && matchesPerishable && matchesCategory;
    });

    return [...list].sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.basePrice - b.basePrice;
        case "price-desc":
          return b.basePrice - a.basePrice;
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "random":
          return shuffleRank(a.id, shuffleSeed) - shuffleRank(b.id, shuffleSeed);
        default:
          return 0;
      }
    });
  }, [products, searchQuery, perishableFilter, selectedCategory, sortOption, shuffleSeed]);

  const sidebarFilters = [
    {
      label: "All products",
      count: products?.length || 0,
      isActive: (type: string, category: string) => type === "all" && category === "all",
      apply: () => {
        setPerishableFilter("all");
        setSelectedCategory("all");
      },
    },
    {
      label: "Fresh produce",
      count: countFor((p) => p.isPerishable),
      isActive: (type: string) => type === "perishable",
      apply: () => {
        setPerishableFilter("perishable");
        setSelectedCategory("all");
      },
    },
    {
      label: "Pantry staples",
      count: countFor((p) => !p.isPerishable),
      isActive: (type: string) => type === "non-perishable",
      apply: () => {
        setPerishableFilter("non-perishable");
        setSelectedCategory("all");
      },
    },
    ...categories.map((category) => ({
      label: category,
      count: countFor((p) => p.categoryName === category),
      isActive: (_type: string, selected: string) => selected === category,
      apply: () => {
        setSelectedCategory(category);
        setPerishableFilter("all");
      },
    })),
  ];

  const hasActiveFilters =
    searchQuery !== "" || perishableFilter !== "all" || selectedCategory !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setPerishableFilter("all");
    setSelectedCategory("all");
    router.push("/");
  };

  // Fetch compliance data and wishlist items (only for regular users)
  useEffect(() => {
    if (user?.token && isRegularUser) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/get-compliance`, {
          headers: { Authorization: `Bearer ${user.token}` },
          timeout: 10000,
        })
        .then((response) => {
          setComplianceData(response.data.data);
        })
        .catch((error) => {
          console.error("Failed to fetch compliance data:", error);
          setComplianceData(null);
        });

      const fetchWishlist = async () => {
        try {
          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist`,
            {
              headers: { Authorization: `Bearer ${user.token}` },
              timeout: 10000,
            }
          );
          const items = res.data.data.map((item: any) => item.productId);
          setWishlistItems(items);
        } catch (error) {
          console.error("Failed to fetch wishlist", error);
        }
      };
      fetchWishlist();
    }
  }, [user, isRegularUser]);

  // Compliance logic (only applies to regular users)
  const getComplianceStatusMessage = () => {
    if (isAdmin) return "Admin users cannot add items to cart";
    if (isAgent) return "Agents cannot add items to cart";
    if (!user) return "Please login to access this feature";
    if (!complianceData) return "Submit compliance form to enable cart features";
    if (complianceData?.status === "PENDING") return "Compliance pending admin approval";
    if (complianceData?.status === "DENIED")
      return "Your compliance form was rejected. Please submit a new one.";
    return "";
  };

  const isCartActionAllowed = () => {
    if (isAdmin) return false;
    if (isAgent) return false;
    if (!user) return false;
    if (!complianceData) return false;
    if (complianceData?.status === "PENDING") return false;
    if (complianceData?.status === "DENIED") return false;
    return complianceData?.status === "APPROVED";
  };

  // Toggle wishlist function
  const toggleWishlist = async (productId: string, productName: string) => {
    if (isAdmin) {
      toast.info("Admin users cannot add items to wishlist");
      return;
    }

    if (isAgent) {
      toast.info("Agents cannot add items to wishlist");
      return;
    }

    if (!user) {
      toast.error("Please login to manage wishlist");
      router.push(
        `/employee-login?returnUrl=${encodeURIComponent(window.location.pathname)}`
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
          {
            headers: { Authorization: `Bearer ${user.token}` },
            timeout: 10000,
          }
        );
        const itemToRemove = wishlistRes.data.data.find(
          (item: any) => item.productId === productId
        );

        if (itemToRemove) {
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist/remove-from-wishlist/${itemToRemove.id}`,
            {
              headers: { Authorization: `Bearer ${user.token}` },
              timeout: 10000,
            }
          );
        }
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist/add-to-wishlist`,
          payload,
          {
            headers: { Authorization: `Bearer ${user.token}` },
            timeout: 10000,
          }
        );
      }

      setWishlistItems((prev) =>
        isCurrentlyInWishlist
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );

      toast.success(
        isCurrentlyInWishlist
          ? `${productName} removed from wishlist`
          : `${productName} added to wishlist!`
      );
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Add to cart function
  const addToCart = async (product: Product) => {
    if (isAdmin) {
      toast.info("Admin users cannot add items to cart");
      return;
    }

    if (isAgent) {
      toast.info("Agents cannot add items to cart");
      return;
    }

    if (!user) {
      toast.error("Please login to add items to cart");
      router.push(
        `/employee-login?returnUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    if (!isRegularUser) {
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
            description: "Please remove some items before checkout.",
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
          description: creditSnapshot?.message,
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add to cart", {
        id: toastId,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleComplianceUploadSuccess = () => {
    setShowComplianceDialog(false);
    if (user?.token && isRegularUser) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/get-compliance`, {
          headers: { Authorization: `Bearer ${user.token}` },
          timeout: 10000,
        })
        .then((response) => {
          setComplianceData(response.data.data);
        })
        .catch((error) => {
          console.error("Failed to fetch compliance data:", error);
          setComplianceData(null);
        });
    }
  };

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
      const removed = await removeLatestCartItemByProductId(
        user.token,
        extensionConfirm.productId
      );
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

  const shownProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
      <div className="mb-4 space-y-2">

        {isAdmin && (
          <p className="flex items-center gap-2 border-l-4 border-violet-500 bg-violet-50 px-3 py-2.5 text-sm text-violet-900">
            <HugeiconsIcon icon={InformationCircleIcon} size={17} strokeWidth={1.8} />
            You are signed in as an administrator. Cart and wishlist are disabled.
          </p>
        )}

        {isAgent && (
          <p className="flex items-center gap-2 border-l-4 border-sky-500 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
            <HugeiconsIcon icon={InformationCircleIcon} size={17} strokeWidth={1.8} />
            You are signed in as a fulfillment officer. Cart and wishlist are disabled.
          </p>
        )}

        {isRegularUser && user && !complianceData && (
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

        {isRegularUser && user && complianceData?.status === "PENDING" && (
          <p className="flex items-center gap-2 border-l-4 border-sky-500 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
            <HugeiconsIcon icon={Alert01Icon} size={17} strokeWidth={1.8} />
            Your compliance form is awaiting approval. You can browse now and order once it is approved.
          </p>
        )}

        {isRegularUser && user && complianceData?.status === "DENIED" && (
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

      <div className="flex gap-5">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="border border-slate-200">
            <h2 className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-slate-600">
              Browse
            </h2>
            <ul className="py-1 text-sm">
              {sidebarFilters.map((filter) => {
                const active = filter.isActive(perishableFilter, selectedCategory);
                return (
                  <li key={filter.label}>
                    <button
                      onClick={filter.apply}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50",
                        active ? "font-medium text-brand-800" : "text-slate-700"
                      )}
                    >
                      {filter.label}
                      <span className="text-[12px] text-slate-400">{filter.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-4 border border-slate-200 p-3 text-[13px] leading-6 text-slate-600">
            <p className="mb-1.5 font-semibold text-slate-800">How payment works</p>
            Orders are charged to your purchasing unit and recovered from your salary at 0%
            interest. Monthly deductions never exceed one third of your pay.
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-3 border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-sm text-slate-600">
              {isLoadingProducts ? (
                "Loading products..."
              ) : (
                <>
                  <span className="font-semibold text-slate-900">{filteredProducts.length}</span>{" "}
                  {filteredProducts.length === 1 ? "product" : "products"}
                  {searchQuery && (
                    <>
                      {" for "}
                      <span className="font-medium text-slate-900">{searchQuery}</span>
                    </>
                  )}
                </>
              )}
            </p>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[13px] text-brand-700 hover:underline"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} />
                Clear filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="hidden text-[13px] text-slate-500 sm:block">
                Sort
              </label>
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="h-9 rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
              >
                <option value="random">Random</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="price-asc">Cheapest first</option>
                <option value="price-desc">Most expensive</option>
                <option value="newest">Recently added</option>
              </select>

              {sortOption === "random" && (
                <button
                  type="button"
                  onClick={() => setShuffleSeed(Math.floor(Math.random() * 100000))}
                  title="Shuffle products"
                  className="flex h-9 items-center gap-1.5 rounded-sm border border-slate-300 px-2.5 text-[13px] text-slate-700 hover:border-brand-600 hover:text-brand-700"
                >
                  <HugeiconsIcon icon={ShuffleIcon} size={15} strokeWidth={1.8} />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>
              )}
            </div>
          </div>

          {/* mobile filter row */}
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            {sidebarFilters.map((filter) => {
              const active = filter.isActive(perishableFilter, selectedCategory);
              return (
                <button
                  key={filter.label}
                  onClick={filter.apply}
                  className={cn(
                    "shrink-0 rounded-sm border px-3 py-1.5 text-[13px]",
                    active
                      ? "border-brand-700 bg-brand-50 font-medium text-brand-800"
                      : "border-slate-300 text-slate-700"
                  )}
                >
                  {filter.label} ({filter.count})
                </button>
              );
            })}
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : shownProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {shownProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isRegularUser={isRegularUser}
                    isAdmin={isAdmin}
                    isAgent={isAgent}
                    isSignedIn={Boolean(user)}
                    isWishlisted={wishlistItems.includes(product.id)}
                    isWishlistLoading={isWishlistLoading}
                    isAddingToCart={isAddingToCart}
                    cartAllowed={isCartActionAllowed()}
                    complianceMessage={getComplianceStatusMessage()}
                    onToggleWishlist={toggleWishlist}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setVisibleCount((count) => count + 24)}
                    className="h-10 rounded-sm border border-slate-300 px-6 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
                  >
                    Show more products
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="border border-slate-200 bg-white px-6 py-16 text-center">
              <HugeiconsIcon
                icon={Search01Icon}
                size={30}
                strokeWidth={1.5}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 text-sm font-medium text-slate-800">No products found</p>
              <p className="mt-1 text-[13px] text-slate-500">
                {hasActiveFilters
                  ? "Try a different search term or clear the filters."
                  : "No products are listed right now. Please check back later."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Eligibility notice, shown once per browser */}
      <Dialog
        open={showEligibilityNotice}
        onOpenChange={(open) => {
          if (!open) dismissEligibilityNotice();
        }}
      >
        <DialogContent className="sm:max-w-[440px]" showCloseButton={false}>
          <DialogHeader>
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <HugeiconsIcon icon={Shield01Icon} size={22} strokeWidth={1.8} />
            </div>
            <DialogTitle className="text-lg">Enugu State Government</DialogTitle>
            <DialogDescription className="leading-6 text-slate-600">
              This platform is for verified civil servants of Enugu State. You can browse the
              catalogue freely, but you will need your staff credentials to place an order.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              onClick={dismissEligibilityNotice}
              className="w-full rounded-sm bg-brand-700 hover:bg-brand-800 sm:w-auto"
            >
              I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isRegularUser && (
        <ConsentUpload
          isOpen={showComplianceDialog}
          onClose={() => setShowComplianceDialog(false)}
          onUploadSuccess={handleComplianceUploadSuccess}
          token={user?.token || ""}
          returnUrl={returnUrl}
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
              <dd className="font-medium">{formatNaira(extensionConfirm.loanUnit)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Extension buffer</dt>
              <dd className="font-medium">{formatNaira(extensionConfirm.extensionRemaining)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Cart total</dt>
              <dd className="font-medium">{formatNaira(extensionConfirm.cartTotal)}</dd>
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
    </div>
  );
};

export default ProductInstance;
