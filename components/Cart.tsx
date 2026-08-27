'use client';

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingCart01Icon,
  ShoppingBasket01Icon,
  FavouriteIcon,
  Delete02Icon,
  MinusSignIcon,
  PlusSignIcon,
  Loading03Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  isInWishlist?: boolean;
  product: {
    id: string;
    name: string;
    product_image: string;
    basePrice: number;
    currency: string;
    isPerishable: boolean;
  };
}

interface ProfileData {
  loan_extension?: number;
  max_extension_limit?: number;
  loan_unit?: number;
  salary_per_month?: number;
}

interface ProfileResponse {
  message?: string;
  data?: ProfileData;
}

const naira = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

function ItemThumb({ src, alt }: { src?: string; alt: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
        <HugeiconsIcon icon={ShoppingBasket01Icon} size={24} strokeWidth={1.3} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="120px"
      className="object-contain p-2"
      onError={() => setBroken(true)}
    />
  );
}

const CartPage = () => {
  const { data: clientSession } = useSession();
  const [serverUser, setServerUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(setServerUser)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, []);

  const user = clientSession?.user || serverUser;
  const token = typeof user === "object" && user !== null
    ? "token" in user
      ? (user as any).token ?? ""
      : (user as any).user?.token ?? ""
    : "";
  const headers = { Authorization: `Bearer ${token}` };

  const { data: cartItems, isLoading: isCartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        const [cartRes, wishlistRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist`, { headers })
        ]);

        return cartRes.data.data.map((item: CartItem) => ({
          ...item,
          isInWishlist: wishlistRes.data.data.some((w: any) =>
            w.productId === item.productId
          )
        }));
      } catch (error) {
        console.error("Failed to fetch cart:", error);
        throw error;
      }
    },
    enabled: !!token,
  });

  const { data: profileData } = useQuery({
    queryKey: ["user-profile", token],
    queryFn: async () => {
      const res = await axios.get<ProfileResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`,
        { headers }
      );
      return res.data?.data || null;
    },
    enabled: !!token,
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async ({ item, currentStatus }: { item: CartItem; currentStatus: boolean }) => {
      if (!token) {
        throw new Error('Please login to manage wishlist');
      }

      if (currentStatus) {
        // Remove from wishlist
        const wishlistRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist`,
          { headers }
        );

        const wishlistItem = wishlistRes.data.data.find((w: any) =>
          w.productId === item.productId
        );

        if (!wishlistItem) {
          throw new Error('Wishlist item not found');
        }

        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist/remove-from-wishlist/${wishlistItem.id}`,
          { headers }
        );
      } else {
        // Add to wishlist
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist/add-to-wishlist`,
          {
            productId: item.productId,
            variantId: null
          },
          { headers }
        );
      }

      return item.id;
    },
    onMutate: async ({ item, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      const previousCart = queryClient.getQueryData<CartItem[]>(["cart"]);

      queryClient.setQueryData<CartItem[]>(["cart"], old =>
        old?.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, isInWishlist: !currentStatus }
            : cartItem
        ) || []
      );

      return { previousCart };
    },
    onError: (error, variables, context) => {
      toast.error(error.message);
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart/update-cart/${itemId}`,
        { quantity },
        { headers: { ...headers, 'Content-Type': 'application/json' } }
      );
      return response.data;
    },
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<CartItem[]>(["cart"]);

      if (previousCart) {
        queryClient.setQueryData<CartItem[]>(["cart"], old =>
          old?.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          ) || []
        );
      }
      return { previousCart };
    },
    onSuccess: () => {
      toast.success("Quantity updated");
    },
    onError: (error, variables, context) => {
      toast.error(axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to update cart'
        : 'Failed to update cart');
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart/remove-from-cart/${itemId}`,
        { headers }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed from cart");
    },
    onError: () => {
      toast.error("Failed to remove item");
    }
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart/remove-all-from-cart`,
        { headers }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Cart cleared");
    },
    onError: () => {
      toast.error("Failed to clear cart");
    }
  });

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCartMutation.mutate(itemId);
      return;
    }
    updateCartMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleInputQuantityChange = (itemId: string, value: string) => {
    const newQuantity = parseInt(value);
    if (!isNaN(newQuantity)) {
      handleQuantityChange(itemId, newQuantity);
    }
  };

  const getItemPrice = (item: CartItem) => item.product.basePrice || 0;
  const getItemName = (item: CartItem) => item.product.name || "Unknown Product";
  const getItemTotalPrice = (item: CartItem) => getItemPrice(item) * item.quantity;

  const totalPrice = cartItems?.reduce(
    (sum: number, item: CartItem) => sum + getItemTotalPrice(item),
    0
  ) || 0;

  const totalUnits = cartItems?.reduce(
    (sum: number, item: CartItem) => sum + item.quantity,
    0
  ) || 0;

  const loanExtension = Number(profileData?.loan_extension || 0);
  const loanUnit = Number(profileData?.loan_unit || 0);
  const maxExtensionLimit = Number(profileData?.max_extension_limit || 0);
  const extensionRemaining = Math.max(0, maxExtensionLimit - loanExtension);
  const hasSwitchedToExtension = loanUnit <= 0 && extensionRemaining > 0;

  const header = (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Your cart</h1>
      <p className="mt-1 text-sm text-slate-600">
        Review your items before checkout. Totals are charged against your purchasing unit.
      </p>
    </div>
  );

  if (isLoading || isCartLoading) {
    return (
      <div className="space-y-5">
        {header}
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4">
              <div className="h-20 w-20 animate-pulse bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                <div className="h-8 w-28 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}

      {hasSwitchedToExtension && (
        <div className="flex items-start gap-2.5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <HugeiconsIcon
            icon={Alert01Icon}
            size={18}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0 text-amber-600"
          />
          <div>
            <p className="font-medium">You are spending from your extension credit.</p>
            <p className="mt-0.5 text-amber-800">
              {naira(loanExtension)} will be deducted from next month&apos;s allocation.
            </p>
          </div>
        </div>
      )}

      {cartItems?.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={ShoppingCart01Icon} size={24} strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">Your cart is empty</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Add items from the catalogue and they will show up here.
          </p>
          <Link
            href="/employee-dashboard/products"
            className="mt-4 inline-block h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium leading-9 text-white hover:bg-brand-800"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
              {cartItems?.map((item: CartItem) => {
                const isUpdating = toggleWishlistMutation.isPending &&
                                 toggleWishlistMutation.variables?.item.id === item.id;

                return (
                  <div key={item.id} className="flex gap-4 p-4">
                    <Link
                      href={`/employee-dashboard/products/${item.productId}`}
                      className="relative h-20 w-20 shrink-0 border border-slate-100"
                    >
                      <ItemThumb src={item.product.product_image} alt={getItemName(item)} />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/employee-dashboard/products/${item.productId}`}
                            className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-brand-700"
                          >
                            {getItemName(item)}
                          </Link>
                          <p className="mt-1 text-[12px] text-slate-500">
                            {naira(getItemPrice(item), item.product.currency)} each
                            <span className="mx-1.5" aria-hidden>·</span>
                            {item.product.isPerishable ? "Fresh" : "Pantry"}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-semibold text-slate-900">
                          {naira(getItemTotalPrice(item), item.product.currency)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="flex h-9 items-center rounded-sm border border-slate-300">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateCartMutation.isPending}
                            className="flex h-full w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
                            aria-label="Decrease quantity"
                          >
                            <HugeiconsIcon icon={MinusSignIcon} size={14} strokeWidth={2} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleInputQuantityChange(item.id, e.target.value)}
                            className="h-full w-11 border-x border-slate-300 text-center text-[13px] outline-none"
                            disabled={updateCartMutation.isPending}
                            title="Quantity"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={updateCartMutation.isPending}
                            className="flex h-full w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
                            aria-label="Increase quantity"
                          >
                            <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
                          </button>
                        </div>

                        <button
                          onClick={() => toggleWishlistMutation.mutate({
                            item,
                            currentStatus: !!item.isInWishlist
                          })}
                          disabled={isUpdating}
                          className={cn(
                            "flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-[13px] hover:bg-slate-50",
                            item.isInWishlist ? "text-brand-700" : "text-slate-600"
                          )}
                        >
                          <HugeiconsIcon
                            icon={isUpdating ? Loading03Icon : FavouriteIcon}
                            size={15}
                            strokeWidth={1.8}
                            className={isUpdating ? "animate-spin" : undefined}
                          />
                          {item.isInWishlist ? "Saved" : "Save"}
                        </button>

                        <button
                          onClick={() => removeFromCartMutation.mutate(item.id)}
                          disabled={removeFromCartMutation.isPending}
                          className="flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-[13px] text-slate-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.8} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => clearCartMutation.mutate()}
                disabled={clearCartMutation.isPending || cartItems?.length === 0}
                className="text-[13px] text-slate-500 hover:text-red-700 disabled:text-slate-300"
              >
                {clearCartMutation.isPending ? "Clearing..." : "Clear cart"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 border border-slate-200 bg-white">
              <h2 className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
                Order summary
              </h2>

              <dl className="space-y-3 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">
                    Subtotal ({totalUnits} {totalUnits === 1 ? "item" : "items"})
                  </dt>
                  <dd className="font-medium text-slate-900">{naira(totalPrice)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">Delivery</dt>
                  <dd className="text-slate-500">Set at checkout</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-base">
                  <dt className="font-medium text-slate-900">Total</dt>
                  <dd className="font-semibold text-slate-900">{naira(totalPrice)}</dd>
                </div>
              </dl>

              <div className="border-t border-slate-200 p-4">
                <Link
                  href={
                    user
                      ? "/employee-dashboard/checkout"
                      : `/employee-login?returnUrl=${encodeURIComponent("/employee-dashboard/checkout")}`
                  }
                  className="flex h-11 w-full items-center justify-center rounded-sm bg-brand-700 text-sm font-medium text-white hover:bg-brand-800"
                >
                  Proceed to checkout
                </Link>
                <p className="mt-2 text-center text-[12px] text-slate-500">
                  Deducted from your salary at 0% interest
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
