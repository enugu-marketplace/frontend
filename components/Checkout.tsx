'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert01Icon,
  Location01Icon,
  ShoppingCart01Icon,
  ShoppingBasket01Icon,
  Loading03Icon,
  HelpCircleIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';

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
      router.push(`/employee-login?returnUrl=${encodeURIComponent('/employee-dashboard/checkout')}`);
    }
  }, [status, router]);

  const money = (value: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value || 0);

  // Show loading state
  if (status === 'loading' || isCartLoading || isProfileLoading) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 w-full animate-pulse border border-slate-200 bg-slate-50" />
            ))}
          </div>
          <div className="h-96 w-full animate-pulse border border-slate-200 bg-slate-50" />
        </div>
      </div>
    );
  }

  // Show compliance error
  if (profileError) {
    return (
      <div className="mx-auto max-w-md border border-slate-200 bg-white px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <HugeiconsIcon icon={Alert01Icon} size={24} strokeWidth={1.8} />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-800">
          We could not load your purchasing limit
        </p>
        <p className="mt-1 text-[13px] text-slate-500">
          Refresh the page, or call the support line if it keeps happening.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
          >
            Refresh
          </button>
          <Link
            href="/employee-dashboard"
            className="flex h-9 items-center rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">Taking you to sign in...</p>
    );
  }

  // Show compliance not submitted warning
  if (!isComplianceSubmitted) {
    return (
      <div className="mx-auto max-w-md border border-slate-200 bg-white px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <HugeiconsIcon icon={Alert01Icon} size={24} strokeWidth={1.8} />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-800">Compliance form required</p>
        <p className="mt-1 text-[13px] text-slate-500">
          Your purchasing limit is set once your compliance form is approved. You can submit it
          from your dashboard.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link
            href="/employee-dashboard"
            className="flex h-9 items-center rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
          >
            Go to dashboard
          </Link>
          <Link
            href="/employee-dashboard/cart"
            className="flex h-9 items-center rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Checkout</h1>
        <p className="mt-1 text-sm text-slate-600">
          Confirm your items and place the order against your purchasing unit.
        </p>
      </div>

      {isUsingExtension && (
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
              {money(loanExtension)} will be deducted from next month&apos;s allocation.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Delivery */}
          <div className="border border-slate-200 bg-white">
            <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
              Delivery
            </p>
            <div className="flex gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <HugeiconsIcon icon={Location01Icon} size={19} strokeWidth={1.8} />
              </span>
              <div className="text-[13px] leading-6 text-slate-600">
                <p>
                  Orders are delivered to your registered office address. For delivery questions,
                  contact the fulfillment office.
                </p>
                {governmentEntity && (
                  <p className="mt-1 font-medium text-slate-900">Delivering to: {governmentEntity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border border-slate-200 bg-white">
            <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
              Items ({cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0})
            </p>

            {cartItems && cartItems.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4">
                    <div className="relative h-16 w-16 shrink-0 border border-slate-100">
                      {item.product.product_image ? (
                        <Image
                          src={item.product.product_image}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-contain p-1.5"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                          <HugeiconsIcon icon={ShoppingBasket01Icon} size={22} strokeWidth={1.3} />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.product.name}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">
                        {item.quantity} × {money(item.product.basePrice)}
                        <span className="mx-1.5" aria-hidden>·</span>
                        {item.product.isPerishable ? 'Fresh' : 'Pantry'}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                      {money(item.product.basePrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <HugeiconsIcon icon={ShoppingCart01Icon} size={24} strokeWidth={1.5} />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-800">Your cart is empty</p>
                <Link
                  href="/employee-dashboard/products"
                  className="mt-4 inline-block h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium leading-9 text-white hover:bg-brand-800"
                >
                  Browse products
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-20 space-y-4">
            <div className="border border-slate-200 bg-white">
              <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
                Order summary
              </p>

              <div className="space-y-4 p-4">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-600">Items</dt>
                    <dd className="font-medium text-slate-900">{money(subtotal)}</dd>
                  </div>
                </dl>

                {/* Credit position */}
                <div className="space-y-3 border-y border-slate-200 py-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Wallet01Icon}
                      size={16}
                      strokeWidth={1.8}
                      className="text-brand-700"
                    />
                    <p className="text-[13px] font-medium text-slate-800">Your credit</p>
                    <button
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['user-profile'] })}
                      className="ml-auto text-[12px] text-brand-700 hover:underline"
                    >
                      Refresh
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-[12px] text-slate-600">
                      <span>Purchasing unit</span>
                      <span>
                        {money(loanUnit)} of {money(totalPurchasingUnit)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${loanUnit <= 0 ? 'bg-red-500' : 'bg-brand-600'}`}
                        style={{ width: `${purchasingUnitProgress}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[12px] text-slate-600">
                      <span>Extension buffer</span>
                      <span>
                        {money(extensionRemaining)} of {money(maxExtensionLimit)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${extensionProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-600">Available to spend</span>
                    <span className="font-medium text-brand-800">{money(availableCredit)}</span>
                  </div>
                </div>

                <dl className="space-y-2">
                  <div className="flex justify-between gap-3 text-base">
                    <dt className="font-medium text-slate-900">Total</dt>
                    <dd className="font-semibold text-slate-900">{money(total)}</dd>
                  </div>

                  {(loanUnit > 0 || maxExtensionLimit > 0) && !isCreditExceeded && (
                    <div className="flex justify-between gap-3 text-[13px]">
                      <dt className="text-slate-600">Credit left after this order</dt>
                      <dd className="font-medium text-slate-800">{money(availableCredit - total)}</dd>
                    </div>
                  )}
                </dl>

                {isCreditExceeded && (
                  <div className="flex items-start gap-2.5 border-l-4 border-red-500 bg-red-50 px-3 py-2.5 text-[13px] text-red-900">
                    <HugeiconsIcon
                      icon={Alert01Icon}
                      size={16}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="font-medium">Not enough credit</p>
                      <p className="mt-0.5">
                        This order is {money(total - availableCredit)} over your available credit.
                        Remove some items to continue.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 p-4">
                <button
                  onClick={onSubmit}
                  disabled={isButtonDisabled}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-brand-700 text-sm font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {isSubmitting ? (
                    <>
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        size={16}
                        strokeWidth={2}
                        className="animate-spin"
                      />
                      Placing order...
                    </>
                  ) : (
                    'Place order'
                  )}
                </button>

                <p className="mt-3 text-center text-[12px] leading-5 text-slate-500">
                  Placing this order authorises the deduction from your salary at 0% interest.
                </p>
                {complianceStatus && (
                  <p className="mt-1 text-center text-[12px] text-slate-400">
                    Account status: <span className="font-medium">{complianceStatus}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 border border-slate-200 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <HugeiconsIcon icon={HelpCircleIcon} size={19} strokeWidth={1.8} />
              </span>
              <div className="text-[13px]">
                <p className="font-medium text-slate-800">Need help?</p>
                <p className="text-slate-500">Call the fulfillment office on 0800 3684 8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
