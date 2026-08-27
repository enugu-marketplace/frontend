'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon, ShoppingBasket01Icon } from '@hugeicons/core-free-icons';
import Image from 'next/image';
import { EditProductVariantDialog } from './EditProductVariantDialog';
import { DeleteProductVariantDialog } from './DeleteProductVariantDialog';

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  netWeight: number;
  price: number;
  currency: string;
  image: string;
  attribute: string | null;
  expiryDate: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    description: string;
    product_image: string;
  };
  inventory: any | null;
}

interface ApiResponse {
  message: string;
  data: ProductVariant[];
}

export function ProductVariantsList({ token }: { token: string }) {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['admin-product-variants'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/product-variants`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pageParam, limit: 10 }
        }
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.data.length === 10 ? allPages.length + 1 : undefined;
    },
  });

  const variants = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {status === 'pending' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border border-slate-200 bg-white">
              <div className="aspect-square w-full animate-pulse bg-slate-100" />
              <div className="space-y-2 p-3">
                <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900">
          Could not load variants: {(error as Error).message}
        </div>
      ) : variants.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={ShoppingBasket01Icon} size={24} strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">No variants yet</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {variants.map((variant) => (
              <div key={variant.id} className="flex flex-col border border-slate-200 bg-white">
                <div className="relative aspect-square w-full">
                  {variant.image ? (
                    <Image
                      src={variant.image}
                      alt={variant.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-contain p-3"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                      <HugeiconsIcon icon={ShoppingBasket01Icon} size={28} strokeWidth={1.3} />
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col border-t border-slate-100 p-3">
                  <p className="text-[13px] font-medium text-slate-900">{variant.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-slate-500">
                    {variant.product.name}
                  </p>

                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatCurrency(variant.price, variant.currency)}
                  </p>

                  <dl className="mt-2 space-y-1 text-[12px]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Net weight</dt>
                      <dd className="text-slate-800">{variant.netWeight} kg</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">SKU</dt>
                      <dd className="truncate font-mono text-slate-800">{variant.sku || '-'}</dd>
                    </div>
                  </dl>

                  {variant.attribute && (
                    <div className="mt-2 border-t border-slate-100 pt-2 text-[12px]">
                      {(() => {
                        try {
                          // Handle both stringified JSON and already-parsed objects
                          const attributes =
                            typeof variant.attribute === 'string'
                              ? JSON.parse(variant.attribute)
                              : variant.attribute;

                          if (
                            attributes &&
                            typeof attributes === 'object' &&
                            !Array.isArray(attributes)
                          ) {
                            return Object.entries(attributes).map(([key, value]) => (
                              <div key={key} className="flex justify-between gap-2">
                                <span className="capitalize text-slate-500">{key}</span>
                                <span className="truncate text-slate-800">{String(value)}</span>
                              </div>
                            ));
                          }
                          return <span className="text-slate-600">{String(variant.attribute)}</span>;
                        } catch (e) {
                          return <span className="text-slate-600">{String(variant.attribute)}</span>;
                        }
                      })()}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/admin-dashboard/product-variants/${variant.id}`}
                      className="flex h-9 flex-1 items-center justify-center rounded-sm border border-slate-300 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
                    >
                      View details
                    </Link>

                    <EditProductVariantDialog
                      variant={variant}
                      token={token}
                      onSuccess={() => window.location.reload()}
                    />
                    <DeleteProductVariantDialog
                      variantId={variant.id}
                      token={token}
                      onSuccess={() => window.location.reload()}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={ref} className="flex justify-center py-2">
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2 text-[13px] text-slate-500">
                <HugeiconsIcon icon={Loading03Icon} size={15} strokeWidth={2} className="animate-spin" />
                Loading more variants
              </span>
            ) : hasNextPage ? (
              <button
                onClick={() => fetchNextPage()}
                className="h-9 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
              >
                Show more
              </button>
            ) : (
              <p className="text-[13px] text-slate-500">All variants loaded.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
