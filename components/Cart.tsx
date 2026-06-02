'use client';

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, HeartOff, Loader2 } from "lucide-react";

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

  const { data: cartItems } = useQuery({
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

  const getItemPrice = (item: CartItem) => {
    return item.product.basePrice || 0;
  };

  const getItemImage = (item: CartItem) => {
    return item.product.product_image || "/placeholder-product.jpg";
  };

  const getItemName = (item: CartItem) => {
    return item.product.name || "Unknown Product";
  };

  const getItemTotalPrice = (item: CartItem) => {
    return getItemPrice(item) * item.quantity;
  };

  const totalPrice = cartItems?.reduce(
    (sum: number, item: CartItem) => sum + getItemTotalPrice(item),
    0
  ) || 0;

  const loanExtension = Number(profileData?.loan_extension || 0);
  const loanUnit = Number(profileData?.loan_unit || 0);
  const maxExtensionLimit = Number(profileData?.max_extension_limit || 0);
  const extensionRemaining = Math.max(0, maxExtensionLimit - loanExtension);
  const hasSwitchedToExtension = loanUnit <= 0 && extensionRemaining > 0;

  if (isLoading) return <div className="container py-8">Loading cart...</div>;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {hasSwitchedToExtension && (
        <div className="sticky top-20 z-20 mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">
            Warning: You&apos;re currently using your extension credit.
          </p>
          <p className="text-sm text-amber-800 mt-1">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(loanExtension)} will be deducted from next month&apos;s allocation.
          </p>
        </div>
      )}

      {cartItems?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-4">Your cart is empty</p>
          <Button asChild>
            <Link href="/employee-dashboard/products">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems?.map((item: CartItem) => {
              const isUpdating = toggleWishlistMutation.isPending && 
                               toggleWishlistMutation.variables?.item.id === item.id;

              return (
                <Card key={item.id} className="flex flex-col sm:flex-row">
                  <div className="relative h-48 w-full sm:w-48">
                    <Image
                      src={getItemImage(item)}
                      alt={getItemName(item)}
                      fill
                      className="object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-semibold">{getItemName(item)}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.product.isPerishable
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {item.product.isPerishable ? "Perishable" : "Non-Perishable"}
                      </span>
                      <p className="font-medium mt-2">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: item.product.currency || "NGN",
                        }).format(getItemPrice(item))}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateCartMutation.isPending}
                          >
                            -
                          </Button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleInputQuantityChange(item.id, e.target.value)}
                            className="w-12 text-center border-0 focus:outline-none"
                            disabled={updateCartMutation.isPending}
                            title="Quantity"
                            placeholder="Qty"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={updateCartMutation.isPending}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => removeFromCartMutation.mutate(item.id)}
                          disabled={removeFromCartMutation.isPending}
                        >
                          Remove
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex items-center ${
                            item.isInWishlist
                              ? 'text-orange-600 hover:text-orange-700'
                              : 'text-gray-600 hover:text-gray-700'
                          }`}
                          onClick={() => toggleWishlistMutation.mutate({ 
                            item, 
                            currentStatus: !!item.isInWishlist 
                          })}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : item.isInWishlist ? (
                            <>
                              <HeartOff className="mr-2 h-4 w-4" />
                              Unsave
                            </>
                          ) : (
                            <>
                              <Heart className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="font-medium">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: item.product.currency || "NGN",
                        }).format(getItemTotalPrice(item))}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => clearCartMutation.mutate()}
                disabled={clearCartMutation.isPending || cartItems?.length === 0}
              >
                {clearCartMutation.isPending ? "Clearing..." : "Clear Cart"}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)} items)</span>
                  <span>
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(totalPrice)}
                  </span> </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-green-700 hover:bg-green-600" 
                  size="lg" 
                  asChild
                  disabled={cartItems?.length === 0}
                >
                  <Link
                    href={
                      user
                        ? "/employee-dashboard/checkout"
                        : `/employee-login?returnUrl=${encodeURIComponent("/checkout")}`
                    }
                  >
                    Proceed to Checkout
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;