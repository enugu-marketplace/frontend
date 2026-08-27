'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon, Layers01Icon } from '@hugeicons/core-free-icons';
import { EditInventoryDialog } from './EditInventoryDialog';
import { DeleteInventoryDialog } from './DeleteInventoryDialog';

interface Inventory {
  id: string;
  variantId: string;
  variantName: string;
  productName: string;
  quantity: number;
  lowStockLevel: number;
  batchNumber: string;
  warehouseId: string;
  warehouseName: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  message: string;
  data: Inventory[];
}

export function InventoriesList({ token }: { token: string }) {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['admin-inventories'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/inventories`,
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

  const inventories = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="space-y-4">
      {status === 'pending' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2 border border-slate-200 bg-white p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-9 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900">
          Could not load inventory: {(error as Error).message}
        </div>
      ) : inventories.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={Layers01Icon} size={24} strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">No stock recorded</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventories.map((inventory) => {
              const isLow = inventory.quantity <= inventory.lowStockLevel;

              return (
                <div key={inventory.id} className="flex flex-col border border-slate-200 bg-white">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {inventory.productName}
                      {inventory.variantName ? ` - ${inventory.variantName}` : ''}
                    </p>
                    {isLow && (
                      <span className="shrink-0 rounded-sm bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
                        Low stock
                      </span>
                    )}
                  </div>

                  <dl className="flex-1 space-y-1.5 px-4 py-3 text-[13px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Quantity</dt>
                      <dd className="font-medium text-slate-900">{inventory.quantity}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Low stock level</dt>
                      <dd className="text-slate-800">{inventory.lowStockLevel}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Batch</dt>
                      <dd className="truncate text-slate-800">{inventory.batchNumber || '-'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Warehouse</dt>
                      <dd className="truncate text-slate-800">{inventory.warehouseName || '-'}</dd>
                    </div>
                  </dl>

                  <div className="flex items-center gap-2 border-t border-slate-100 p-3">
                    <Link
                      href={`/admin-dashboard/inventory/${inventory.id}`}
                      className="flex h-9 flex-1 items-center justify-center rounded-sm border border-slate-300 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
                    >
                      View details
                    </Link>

                    <EditInventoryDialog
                      inventory={inventory}
                      token={token}
                      onSuccess={() => window.location.reload()}
                    />
                    <DeleteInventoryDialog
                      inventoryId={inventory.id}
                      token={token}
                      onSuccess={() => window.location.reload()}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={ref} className="flex justify-center py-2">
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2 text-[13px] text-slate-500">
                <HugeiconsIcon icon={Loading03Icon} size={15} strokeWidth={2} className="animate-spin" />
                Loading more inventory
              </span>
            ) : hasNextPage ? (
              <button
                onClick={() => fetchNextPage()}
                className="h-9 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
              >
                Show more
              </button>
            ) : (
              <p className="text-[13px] text-slate-500">All inventory loaded.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
