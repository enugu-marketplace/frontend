'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import { toast } from 'sonner';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  FavouriteIcon,
  Delete02Icon,
  ShoppingCart01Icon,
  ShoppingBasket01Icon,
} from '@hugeicons/core-free-icons';

import { fetchCreditSnapshot } from '@/lib/credit-feedback';

interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  addedAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  product_image: string;
  basePrice: number;
  currency: string;
  variants: {
    id: string;
    name: string;
    price: number;
  }[];
}

function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
        <HugeiconsIcon icon={ShoppingBasket01Icon} size={28} strokeWidth={1.3} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, 25vw"
      className="object-contain p-3"
      onError={() => setBroken(true)}
    />
  );
}

const WishlistPage = () => {
  const router = useRouter();
  const { data: clientSession } = useSession();
  const [serverUser, setServerUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setServerUser(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Session error:", err);
        setIsLoading(false);
      });
  }, []);

  const user = clientSession?.user || serverUser;

  // Fetch wishlist items
  const { data: wishlistItems, isLoading: isWishlistLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist`,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        return res.data.data as WishlistItem[];
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        throw error;
      }
    },
    enabled: !!user?.token,
  });

  // Fetch product details for each wishlist item
  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["wishlist-products", wishlistItems],
    queryFn: async () => {
      if (!wishlistItems || wishlistItems.length === 0) return [];

      try {
        // Fetch all products at once if your API supports it
        const productIds = wishlistItems.map(item => item.productId).filter(Boolean);
        if (productIds.length === 0) return [];

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`,
          {
            params: { ids: productIds.join(',') },
            headers: { Authorization: `Bearer ${user?.token}` }
          }
        );
        return res.data.data as Product[];
      } catch (error) {
        console.error("Failed to fetch products:", error);
        throw error;
      }
    },
    enabled: !!wishlistItems && wishlistItems.length > 0,
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (wishlistItemId: string) => {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/wishlist/remove-from-wishlist/${wishlistItemId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Item removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to remove item");
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      const payload = {
        productId,
        quantity: 1
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart/add-to-cart`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      const creditSnapshot = await fetchCreditSnapshot(user?.token || '');
      toast.success('Item added to cart!', {
        description: creditSnapshot?.message,
        action: {
          label: 'View cart',
          onClick: () => router.push('/employee-dashboard/cart')
        }
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  });

  const getProductDetails = (productId: string) => {
    return products?.find(product => product.id === productId);
  };

  const header = (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Saved items</h1>
      <p className="mt-1 text-sm text-slate-600">
        Products you saved for later. Adding one to your cart still uses your purchasing unit.
      </p>
    </div>
  );

  if (isLoading || isWishlistLoading) {
    return (
      <div className="space-y-5">
        {header}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}

      {wishlistItems?.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={FavouriteIcon} size={24} strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">Nothing saved yet</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Tap the heart on any product to keep it here for later.
          </p>
          <Link
            href="/employee-dashboard/products"
            className="mt-4 inline-block h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium leading-9 text-white hover:bg-brand-800"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {wishlistItems?.map((item) => {
            const product = getProductDetails(item.productId);

            if (!product) {
              // Still loading or product not found
              if (isProductsLoading) {
                return (
                  <div key={item.id} className="border border-slate-200 bg-white">
                    <div className="aspect-square w-full animate-pulse bg-slate-100" />
                    <div className="space-y-2 p-3">
                      <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                );
              }

              // Product not found - might have been deleted
              return (
                <div key={item.id} className="flex flex-col border border-slate-200 bg-white">
                  <div className="relative aspect-square w-full">
                    <ProductThumb alt="Product no longer available" />
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-[13px] text-slate-600">
                      This product is no longer listed.
                    </p>
                    <button
                      onClick={() => removeFromWishlistMutation.mutate(item.id)}
                      disabled={removeFromWishlistMutation.isPending}
                      className="mt-auto flex h-9 items-center justify-center gap-1.5 rounded-sm border border-slate-300 text-[13px] text-slate-600 hover:border-red-300 hover:text-red-700"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.8} />
                      {removeFromWishlistMutation.isPending ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              );
            }

            const minPrice = product.variants.length > 0
              ? Math.min(...product.variants.map(v => v.price))
              : product.basePrice;

            return (
              <div key={item.id} className="flex flex-col border border-slate-200 bg-white">
                <Link
                  href={`/employee-dashboard/products/${product.id}`}
                  className="relative aspect-square w-full"
                >
                  <ProductThumb src={product.product_image} alt={product.name} />
                </Link>

                <div className="flex flex-1 flex-col border-t border-slate-100 p-3">
                  <Link
                    href={`/employee-dashboard/products/${product.id}`}
                    className="line-clamp-2 min-h-10 text-[13px] leading-5 text-slate-700 hover:text-brand-700"
                  >
                    {product.name}
                  </Link>

                  <p className="mt-1.5 text-base font-semibold text-slate-900">
                    {new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: product.currency || 'NGN',
                      maximumFractionDigits: 0,
                    }).format(minPrice)}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => addToCartMutation.mutate(product.id)}
                      disabled={addToCartMutation.isPending}
                      className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm bg-brand-700 text-[13px] font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      <HugeiconsIcon icon={ShoppingCart01Icon} size={16} strokeWidth={1.8} />
                      {addToCartMutation.isPending ? 'Adding...' : 'Add to cart'}
                    </button>

                    <button
                      onClick={() => removeFromWishlistMutation.mutate(item.id)}
                      disabled={removeFromWishlistMutation.isPending}
                      title="Remove from saved items"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-300 text-slate-500 hover:border-red-300 hover:text-red-700"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
