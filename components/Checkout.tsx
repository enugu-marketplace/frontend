'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';

interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    product_image: string;
    basePrice: number;
    currency: string;
    isPerishable: boolean;
  };
}

interface ComplianceUserData {
  id: string;
  firstname: string;
  lastname: string;
  email: string | null;
  phone: string;
  level: string;
  employee_id: string | null;
  verification_id: string;
  government_entity: string;
  salary_per_month: number;
  loan_unit: number;
  loan_amount_collected: number;
  loan_extension: number;
  max_extension_limit: number;
  is_address_set: boolean;
  is_compliance_submitted: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ComplianceData {
  id: string;
  userId: string;
  form_url: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: ComplianceUserData;
}

interface ComplianceResponse {
  message: string;
  data: ComplianceData | ComplianceUserData;
}

export default function CheckoutPage() {
  const { data: clientSession, status } = useSession();
  const [serverUser, setServerUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasShownExtensionSwitchToast = useRef(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(setServerUser)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);
  
  const user = clientSession?.user || serverUser;
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems, isLoading: isCartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      return res.data.data as CartItem[];
    },
    enabled: !!user?.token
  });

  // Fetch latest profile data (purchasing + extension state)
  const { 
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError 
  } = useQuery({
    queryKey: ['user-profile', user?.token],
    queryFn: async (): Promise<ComplianceUserData | null> => {
      try {
        const res = await axios.get<ComplianceResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        const payload = res.data?.data as ComplianceData | ComplianceUserData | undefined;
        if (!payload) return null;

        if ('user' in payload) {
          return payload.user;
        }

        return payload;
      } catch (error) {
        console.error('Error fetching profile data:', error);
        return null;
      }
    },
    enabled: !!user?.token,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  // Create order mutation (without address)
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart is empty');
      }

      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/create-order`,
        orderData,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Order placed successfully!');
      // Clear cart after successful order
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Refresh profile data after order to get latest loan fields.
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      router.push('/employee-dashboard/order-confirmation');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  });

  const onSubmit = () => {
    setIsSubmitting(true);
    createOrderMutation.mutate(undefined, {
      onSettled: () => setIsSubmitting(false)
    });
  };

  // Calculate totals
  const subtotal = cartItems?.reduce((sum, item) => {
    return sum + (item.product.basePrice * item.quantity);
  }, 0) || 0;

  const total = subtotal;

  // Loan fields from profile endpoint, with session fallback.
  const loanUnit = profileData?.loan_unit ?? user?.loan_unit ?? 0;
  const loanAmountCollected = profileData?.loan_amount_collected ?? user?.loan_amount_collected ?? 0;
  const loanExtension = profileData?.loan_extension ?? user?.loan_extension ?? 0;
  const maxExtensionLimit = profileData?.max_extension_limit ?? user?.max_extension_limit ?? 0;
  const salaryPerMonth = profileData?.salary_per_month ?? user?.salary_per_month ?? 0;
  const isComplianceSubmitted = profileData?.is_compliance_submitted ?? user?.is_compliance_submitted ?? false;
  const governmentEntity = profileData?.government_entity || user?.government_entity || '';
  const complianceStatus = profileData?.status;

  // Calculate if order exceeds credit limit
  const getCreditExceeded = () => {
    const availableCredit = loanUnit + (maxExtensionLimit - loanExtension);
    return total > availableCredit;
  };

  const isCreditExceeded = getCreditExceeded();
  const availableCredit = Math.max(0, loanUnit + (maxExtensionLimit - loanExtension));
  const totalPurchasingUnit = salaryPerMonth > 0 ? salaryPerMonth * 0.3 : Math.max(loanUnit, loanAmountCollected);
  const purchasingUnitUsed = Math.max(0, totalPurchasingUnit - loanUnit);
  const extensionRemaining = Math.max(0, maxExtensionLimit - loanExtension);
  const isUsingExtension = loanExtension > 0;
  const hasSwitchedToExtension = loanUnit <= 0 && extensionRemaining > 0;
  const purchasingUnitProgress = totalPurchasingUnit > 0
    ? Math.min(100, (loanUnit / totalPurchasingUnit) * 100)
    : 0;
  const extensionProgress = maxExtensionLimit > 0
    ? Math.min(100, (extensionRemaining / maxExtensionLimit) * 100)
    : 0;

  useEffect(() => {
    if (hasSwitchedToExtension && !hasShownExtensionSwitchToast.current) {
      toast.warning("Purchasing unit exhausted", {
        description: "You are now spending from your extension buffer (10% of salary).",
      });
      hasShownExtensionSwitchToast.current = true;
    }
  }, [hasSwitchedToExtension]);

  // Determine if button should be disabled
  const isButtonDisabled = 
    isSubmitting || 
    !cartItems || 
    cartItems.length === 0 ||
    isCreditExceeded ||
    isProfileLoading;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/employee-login?returnUrl=${encodeURIComponent('/checkout')}`);
    }
  }, [status, router]);

  // Show loading state
  if (status === 'loading' || isCartLoading || isProfileLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show compliance error
  if (profileError) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-red-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.103 16.5c-.77.833.192 2.5 1.732 2.5z" 
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Unable to Load Credit Information</h2>
                  <p className="text-gray-600 mt-2">
                    We couldn't retrieve your purchasing limit. Please try refreshing the page or contact support.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/employee-dashboard/help">
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="container py-8">Redirecting to login...</div>;
  }

  // Show compliance not submitted warning
  if (!isComplianceSubmitted) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-yellow-200">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-yellow-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.103 16.5c-.77.833.192 2.5 1.732 2.5z" 
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Compliance Required</h2>
                  <p className="text-gray-600 mt-2">
                    You need to complete your compliance form before you can make purchases. 
                    This is required to determine your purchasing limit.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href="/employee-dashboard/compliance">
                      Complete Compliance Form
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/employee-dashboard">
                      Back to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {/* Sticky extension warning */}
      {isUsingExtension && (
        <div className="sticky top-20 z-20 mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">
            Warning: You&apos;re currently using your extension credit.
          </p>
          <p className="text-sm text-amber-800 mt-1">
            {new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN',
            }).format(loanExtension)} will be deducted from next month&apos;s allocation.
          </p>
        </div>
      )}

      {/* Credit Limit Banner */}
      {(loanUnit > 0 || maxExtensionLimit > 0) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-green-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-green-800">Purchasing Credit</h3>
                <p className="text-sm text-green-600">
                  Real-time credit balance: {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                  }).format(availableCredit)} available
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-800">
                Updated just now
              </p>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['user-profile'] })}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 text-blue-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                  </div>
                  <h3 className="font-medium">Delivery Information</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Orders will be delivered to your registered office address. For delivery inquiries, 
                  please contact the fulfillment office.
                </p>
                {governmentEntity && (
                  <p className="text-sm font-medium text-blue-800 mt-2">
                    Delivery to: {governmentEntity}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items Section */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems && cartItems.length > 0 ? (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="relative h-20 w-20 rounded-md overflow-hidden border">
                        <Image
                          src={item.product.product_image || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.product.isPerishable
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            {item.product.isPerishable ? "Perishable" : "Non-Perishable"}
                          </span>
                          <span className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </span>
                        </div>
                        <p className="text-lg font-medium mt-2">
                          {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: item.product.currency || 'NGN',
                          }).format(item.product.basePrice * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: item.product.currency || 'NGN',
                          }).format(item.product.basePrice)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-16 w-16 text-gray-300 mx-auto" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                      />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
                  <Button asChild>
                    <Link href="/employee-dashboard/products">Browse Products</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Checkout Section */}
        <div>
          <Card className="sticky top-4 border-2 border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-green-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items ({cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0})</span>
                  <span>
                    {new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                    }).format(subtotal)}
                  </span>
                </div>
                
                {/* Credit Limit Information */}
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Total Purchasing Unit</span>
                    <span className="text-sm font-medium text-green-600">
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                      }).format(totalPurchasingUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Purchasing Unit Remaining</span>
                    <span className="text-gray-600">
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                      }).format(loanUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Extension Buffer Remaining</span>
                    <span className="text-yellow-700">
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                      }).format(extensionRemaining)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Extension Buffer Used</span>
                    <span className="text-yellow-700">
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                      }).format(loanExtension)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span className="text-green-700">Available Credit (spendable now)</span>
                    <span className="text-green-700">
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                      }).format(availableCredit)}
                    </span>
                  </div>
                  {(totalPurchasingUnit > 0 || maxExtensionLimit > 0) && (
                    <div className="mt-2">
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Purchasing Unit</span>
                          <span>
                            {new Intl.NumberFormat('en-NG', {
                              style: 'currency',
                              currency: 'NGN',
                            }).format(loanUnit)} remaining
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`${loanUnit <= 0 ? 'bg-red-500' : 'bg-green-500'} h-full rounded-full transition-all duration-300`}
                            style={{ width: `${purchasingUnitProgress}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Used: {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: 'NGN',
                          }).format(purchasingUnitUsed)} of {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: 'NGN',
                          }).format(totalPurchasingUnit)}
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Extension Buffer</span>
                          <span>
                            {new Intl.NumberFormat('en-NG', {
                              style: 'currency',
                              currency: 'NGN',
                            }).format(extensionRemaining)} remaining
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                            style={{ width: `${extensionProgress}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Used: {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: 'NGN',
                          }).format(loanExtension)} of {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: 'NGN',
                          }).format(maxExtensionLimit)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span className="text-green-700">
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                      }).format(total)}
                    </span>
                  </div>
                  
                  {/* Remaining Credit After Purchase */}
                  {(loanUnit > 0 || maxExtensionLimit > 0) && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-800">Credit After Purchase</span>
                        <span className="font-medium text-green-800">
                          {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: 'NGN',
                          }).format(availableCredit - total)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Credit Check Warning */}
                  {isCreditExceeded && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.103 16.5c-.77.833.192 2.5 1.732 2.5z" 
                          />
                        </svg>
                        <div className="text-sm text-red-700">
                          <p className="font-medium">Insufficient Credit</p>
                          <p className="mt-1">
                            This order exceeds your available credit by{' '}
                            {new Intl.NumberFormat('en-NG', {
                              style: 'currency',
                              currency: 'NGN',
                            }).format(total - availableCredit)}
                            . Please reduce your order amount.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardContent className="border-t">
              <Button 
                className="w-full bg-green-700 hover:bg-green-600 text-white" 
                size="lg"
                onClick={onSubmit}
                disabled={isButtonDisabled}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Place Order'
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                By placing this order, you agree to our Terms of Service and Privacy Policy
              </p>
              {complianceStatus && (
                <p className="text-xs text-center mt-1 text-gray-400">
                  Account Status: <span className="font-medium">{complianceStatus}</span>
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Help Section */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-blue-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Need Help?</h4>
                  <p className="text-sm text-gray-600">Contact fulfillment office for assistance</p>
                </div>
              </div>
              {/* <Button variant="outline" className="w-full" asChild>
                <Link href="/employee-dashboard/help">
                  Get Support
                </Link>
              </Button> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}