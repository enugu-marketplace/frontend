'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { PackageIcon, ArrowRight01Icon, Loading03Icon } from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils';

interface Order {
  id: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  orderStatus: string;
  placedAt: string;
}

const formatCurrency = (value: number | undefined) => {
  const numValue = value || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(numValue);
};

function statusTone(status: string, kind: 'order' | 'payment') {
  const value = status?.toUpperCase();

  if (kind === 'order') {
    if (value === 'DELIVERED') return 'bg-brand-50 text-brand-800 ring-brand-200';
    if (value === 'CANCELLED') return 'bg-red-50 text-red-700 ring-red-200';
    return 'bg-amber-50 text-amber-800 ring-amber-200';
  }

  if (value === 'PAID') return 'bg-brand-50 text-brand-800 ring-brand-200';
  if (value === 'FAILED') return 'bg-red-50 text-red-700 ring-red-200';
  return 'bg-amber-50 text-amber-800 ring-amber-200';
}

export function OrdersList() {
  const { data: clientSession } = useSession();
  const [serverUser, setServerUser] = useState<any>(null);
  const { ref, inView } = useInView();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(setServerUser)
      .catch(console.error);
  }, []);

  const user = clientSession?.user || serverUser;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['user-orders', user?.token], // Include token in query key
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const token = user?.token;
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/all-order`, {
          params: { page: pageParam, limit: 10 },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        return res.data.data as Order[];
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          toast.error('Session expired. Please log in again.');
          // Clear invalid token
          localStorage.removeItem('token');
        } else {
          toast.error('Failed to load orders');
        }
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 10) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    enabled: !!user?.token, // Only enable query when token is available
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Use a Set to ensure unique orders
  const uniqueOrders = Array.from(new Map(
    data?.pages.flat().map(order => [order.id, order])
  ).values());

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Your orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every order you have placed under the scheme, newest first.
        </p>
      </div>

      {status === 'pending' && (
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-9 w-9 animate-pulse rounded-md bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-800">We could not load your orders</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Check your connection and try again, or sign in once more if the problem continues.
          </p>
          <Link
            href="/employee-dashboard/products"
            className="mt-4 inline-block h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium leading-9 text-white hover:bg-brand-800"
          >
            Browse products
          </Link>
        </div>
      )}

      {status === 'success' && uniqueOrders.length === 0 && (
        <div className="border border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={PackageIcon} size={24} strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">No orders yet</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Once you place an order it will appear here with its delivery status.
          </p>
          <Link
            href="/employee-dashboard/products"
            className="mt-4 inline-block h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium leading-9 text-white hover:bg-brand-800"
          >
            Browse products
          </Link>
        </div>
      )}

      {status === 'success' && uniqueOrders.length > 0 && (
        <>
          <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
            {uniqueOrders.map((order) => (
              <Link
                key={order.id}
                href={`/employee-dashboard/orders/${order.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                  <HugeiconsIcon icon={PackageIcon} size={18} strokeWidth={1.8} />
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    #{order.id.split('-')[0].toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {format(new Date(order.placedAt), 'd MMM yyyy')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-sm px-2 py-1 text-[11px] font-medium capitalize ring-1',
                      statusTone(order.orderStatus, 'order')
                    )}
                  >
                    {order.orderStatus.toLowerCase()}
                  </span>
                  <span
                    className={cn(
                      'rounded-sm px-2 py-1 text-[11px] font-medium capitalize ring-1',
                      statusTone(order.paymentStatus, 'payment')
                    )}
                  >
                    {order.paymentStatus.toLowerCase()}
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    strokeWidth={2}
                    className="text-slate-400"
                  />
                </div>
              </Link>
            ))}
          </div>

          <div ref={ref} className="flex justify-center py-2">
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2 text-[13px] text-slate-500">
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={15}
                  strokeWidth={2}
                  className="animate-spin"
                />
                Loading more orders
              </span>
            ) : hasNextPage ? (
              <button
                onClick={() => fetchNextPage()}
                className="h-9 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
              >
                Load more
              </button>
            ) : (
              <p className="text-[13px] text-slate-500">That is all your orders.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
