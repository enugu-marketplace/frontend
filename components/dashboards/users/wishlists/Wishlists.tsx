'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { toast } from 'sonner';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, HeartOff } from 'lucide-react';
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
      const creditSnapshot = await fetchCreditSnapshot(user?.token || '');
      toast.success('Item added to cart!', {
        description: creditSnapshot?.message,
        action: {
          label: 'View Cart',
          onClick: () => router.push('/cart')
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

  if (isLoading || isWishlistLoading) return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-0">
              <Skeleton className="h-48 w-full rounded-t-lg" />
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      {wishlistItems?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-4">Your wishlist is empty</p>
          <Button asChild>
            <Link href="/employee-dashboard/products">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems?.map((item) => {
            const product = getProductDetails(item.productId);
            
            if (!product) {
              // Still loading or product not found
              if (isProductsLoading) {
                return (
                  <Card key={item.id}>
                    <CardHeader className="p-0">
                      <Skeleton className="h-48 w-full rounded-t-lg" />
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                );
              }
              
              // Product not found - might have been deleted
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full bg-gray-100">
                      <Image
                        src="/placeholder-product.jpg"
                        alt="Product no longer available"
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-lg">Product no longer available</h3>
                    <Button 
                      variant="ghost" 
                      className="w-full mt-4 text-red-500 hover:text-red-600"
                      onClick={() => removeFromWishlistMutation.mutate(item.id)}
                      disabled={removeFromWishlistMutation.isPending}
                    >
                      <HeartOff className="mr-2 h-4 w-4" />
                      {removeFromWishlistMutation.isPending ? 'Removing...' : 'Remove'}
                    </Button>
                  </CardContent>
                </Card>
              );
            }

            const minPrice = product.variants.length > 0 
              ? Math.min(...product.variants.map(v => v.price))
              : product.basePrice;

            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full">
                    <Image
                      src={product.product_image || '/placeholder-product.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {product.description}
                  </p>
                  <div className="mt-3">
                    <span className="font-medium">
                      From {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: product.currency || 'NGN',
                      }).format(minPrice)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      asChild 
                      variant="outline" 
                      className="flex-1"
                    >
                      <Link href={`/employee-dashboard/products/${product.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button 
                      className="flex-1 bg-orange-700 hover:bg-orange-600"
                      onClick={() => addToCartMutation.mutate(product.id)}
                      disabled={addToCartMutation.isPending}
                    >
                      {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-2 text-red-500 hover:text-red-600"
                    onClick={() => removeFromWishlistMutation.mutate(item.id)}
                    disabled={removeFromWishlistMutation.isPending}
                  >
                    <HeartOff className="mr-2 h-4 w-4" />
                    {removeFromWishlistMutation.isPending ? 'Removing...' : 'Remove'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;