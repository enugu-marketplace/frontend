'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

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

  return (
    <div className="py-6">
      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select onValueChange={setPerishableFilter} value={perishableFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Perishable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="perishable">Perishable</SelectItem>
            <SelectItem value="non-perishable">Non-Perishable</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setSortOption} value={sortOption}>
          <SelectTrigger className="w-full sm:w-40">
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

      {/* Results count */}
      {filteredProducts.length > 0 && (
        <div className="text-sm text-gray-600 mb-6">
          Showing {filteredProducts.length} of {allProducts.length} products
          {(searchQuery || perishableFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-3"
              onClick={() => {
                setSearchQuery('');
                setPerishableFilter('all');
                setStatusFilter('all');
                setSortOption('name-asc');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {status === 'pending' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="space-y-2 pt-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : status === 'error' ? (
        <div>Error: {(error as Error).message}</div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || perishableFilter !== 'all' || statusFilter !== 'all'
                    ? "Try adjusting your search or filter criteria"
                    : "No products available at the moment"}
                </p>
                {(searchQuery || perishableFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setPerishableFilter('all');
                      setStatusFilter('all');
                    }}
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow md:w-[300px] w-full">
                  <CardHeader className="p-0">
                    <div className="relative mt-6 h-48 w-full">
                      <Image
                        src={product.product_image || getProductImage(product.name)}
                        alt={product.name}
                        fill
                        className="object-contain rounded-t-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={filteredProducts.indexOf(product) < 6}
                      />
                      {!product.active && (
                        <div className="absolute top-2 left-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Inactive
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {product.isPerishable ? 'Perishable' : 'Non-Perishable'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-2">
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: product.currency,
                        }).format(product.basePrice)}
                      </span>
                    </div>
                    {/* {product.variants.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium">Variants:</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {product.variants.map(variant => (
                            <span 
                              key={variant.id} 
                              className="text-xs bg-gray-100 px-2 py-1 rounded"
                            >
                              {variant.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )} */}
                  </CardContent>
                  <CardFooter>
                    <Link href={`/admin-dashboard/products/${product.id}`} className='w-full'>
                      <Button variant="outline" className='w-full bg-orange-700 text-white hover:bg-orange-600'>
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div ref={ref} className="h-10 flex items-center justify-center mt-6">
              {isFetchingNextPage ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading more...</span>
                </div>
              ) : hasNextPage ? (
                <Button variant="ghost" onClick={() => fetchNextPage()}>
                  Load More
                </Button>
              ) : (
                <p className="text-sm text-gray-500">No more products to load</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}