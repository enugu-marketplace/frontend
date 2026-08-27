'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  Loading03Icon,
  ShoppingBasket01Icon,
} from '@hugeicons/core-free-icons';

interface Product {
  id: string;
  name: string;
  description: string;
  product_image: string;
  basePrice: number;
  currency: string;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
  isPerishable: boolean;
  active: boolean;
}

interface ApiResponse {
  message: string;
  data: Product[];
}

const placeholderImages = {
  tomatoes: '/tomato.jpg',
  vegetable: '/vegetables.jpg',
  garri: '/garri.jpeg',
  beans: '/beans.jpg',
  rice: '/rice.jpeg',
  pepper: '/pepper.jpg',
};

export function ProductsList({ token }: { token: string }) {
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [perishableFilter, setPerishableFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('name-asc');

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['admin-products'],
    queryFn: async ({ pageParam = 1 }) => {
      const primaryUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const fallbackUrl = 'https://backend-api.enugufoodmarket.com/api/v1';
      const canFallback =
        process.env.NEXT_PUBLIC_ALLOW_PROD_FALLBACK === 'true' &&
        primaryUrl?.includes('backend-staging.enugufoodmarket.com');

      console.log(`[AdminProducts] Fetching page ${pageParam} from: ${primaryUrl}/admin/products`);
      console.log(`[AdminProducts] Fallback enabled: ${canFallback} (NEXT_PUBLIC_ALLOW_PROD_FALLBACK=${process.env.NEXT_PUBLIC_ALLOW_PROD_FALLBACK})`);

      try {
        const res = await axios.get<ApiResponse>(
          `${primaryUrl}/admin/products`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: pageParam, limit: 20 },
          }
        );
        console.log(`[AdminProducts] Success: ${res.status}, items: ${res.data?.data?.length ?? 0}`);
        return res.data;
      } catch (err: unknown) {
        const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
        const errMsg = axios.isAxiosError(err) ? err.message : String(err);
        const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
        const requestUrl = axios.isAxiosError(err) ? err.config?.url : undefined;
        const requestParams = axios.isAxiosError(err) ? err.config?.params : undefined;
        const responseHeaders = axios.isAxiosError(err) ? err.response?.headers : undefined;
        console.error(`[AdminProducts] Request failed — status: ${httpStatus ?? 'network error'}, message: ${errMsg}`);
        console.error('[AdminProducts] Failure details:', {
          url: requestUrl,
          params: requestParams,
          responseData,
          requestId: responseHeaders?.['x-request-id'],
          rateLimitRemaining: responseHeaders?.['x-ratelimit-remaining'],
        });

        if (canFallback && (!httpStatus || httpStatus >= 500)) {
          console.warn(`[AdminProducts] Falling back to production: ${fallbackUrl}/admin/products`);
          const res = await axios.get<ApiResponse>(
            `${fallbackUrl}/admin/products`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { page: pageParam, limit: 20 },
            }
          );
          console.log(`[AdminProducts] Fallback success: ${res.status}, items: ${res.data?.data?.length ?? 0}`);
          return res.data;
        }

        console.error('[AdminProducts] No fallback — rethrowing. Set NEXT_PUBLIC_ALLOW_PROD_FALLBACK=true to enable fallback.');
        throw err;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Only fetch next page if we got a full page of results
      return lastPage.data.length === 20 ? allPages.length + 1 : undefined;
    },
  });

  // Create a flat array of unique products
  const allProducts = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    // Perishable filter
    if (perishableFilter !== 'all') {
      const isPerishable = perishableFilter === 'perishable';
      result = result.filter(
        (product) => product.isPerishable === isPerishable
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(
        (product) => product.active === isActive
      );
    }

    // Sort products
    switch (sortOption) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.basePrice - a.basePrice);
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, searchQuery, perishableFilter, statusFilter, sortOption]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const getProductImage = (productName: string) => {
    const normalizedName = productName.toLowerCase();
    if (normalizedName.includes('tomato')) return placeholderImages.tomatoes;
    if (normalizedName.includes('vegetable')) return placeholderImages.vegetable;
    if (normalizedName.includes('garri')) return placeholderImages.garri;
    if (normalizedName.includes('bean')) return placeholderImages.beans;
    if (normalizedName.includes('rice')) return placeholderImages.rice;
    if (normalizedName.includes('pepper')) return placeholderImages.pepper;
    return placeholderImages.tomatoes; // default
  };

  const hasFilters =
    Boolean(searchQuery) || perishableFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setPerishableFilter('all');
    setStatusFilter('all');
    setSortOption('name-asc');
  };

  return (
    <div className="space-y-4">
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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

        {hasFilters && (
          <button onClick={clearFilters} className="ml-auto text-[13px] text-brand-700 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {filteredProducts.length > 0 && (
        <p className="text-[13px] text-slate-600">
          <span className="font-medium text-slate-900">{filteredProducts.length}</span> of{" "}
          {allProducts.length} products
        </p>
      )}

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
          Could not load products: {(error as Error).message}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={Search01Icon} size={24} strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">No products found</p>
          <p className="mt-1 text-[13px] text-slate-500">
            {hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Nothing has been added to the catalogue yet.'}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 h-9 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <article
                key={product.id}
                className="flex flex-col border border-slate-200 bg-white transition-colors hover:border-brand-600"
              >
                <div className="relative aspect-square w-full">
                  {product.product_image ? (
                    <Image
                      src={product.product_image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-contain p-3"
                      priority={index < 4}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                      <HugeiconsIcon icon={ShoppingBasket01Icon} size={30} strokeWidth={1.3} />
                    </span>
                  )}

                  <span className="absolute left-2 top-2 rounded-sm bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                    {product.isPerishable ? 'Fresh' : 'Pantry'}
                  </span>

                  {!product.active && (
                    <span className="absolute right-2 top-2 rounded-sm bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 ring-1 ring-red-200">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col border-t border-slate-100 p-3">
                  <h3 className="line-clamp-2 min-h-10 text-[13px] leading-5 text-slate-800">
                    {product.name}
                  </h3>

                  <p className="mt-1.5 text-base font-semibold text-slate-900">
                    {new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: product.currency || 'NGN',
                      maximumFractionDigits: 0,
                    }).format(product.basePrice)}
                  </p>

                  <Link
                    href={`/admin-dashboard/products/${product.id}`}
                    className="mt-3 flex h-9 items-center justify-center rounded-sm border border-slate-300 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
                  >
                    Manage product
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length > 0 && (
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
    </div>
  );
}
