'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import OrderConfirmationContent from './OrderConfirmationContent';

interface Order {
  id: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  orderStatus: string;
  trackingCode: string | null;
  placedAt: string;
  deliveredAt: string | null;
  items?: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    total: number;
    Product: {
      id: string;
      name: string;
      product_image: string;
      isPerishable: boolean;
    };
  }>;
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  };
}

interface ProfileData {
  loan_extension?: number;
}

interface ProfileResponse {
  message?: string;
  data?: ProfileData;
}

export default function OrderConfirmationPage() {
  const { data: clientSession, status } = useSession();
  const [serverUser, setServerUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(setServerUser)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const user = clientSession?.user || serverUser;

  const { data: orders, isError } = useQuery({
    queryKey: ['userOrders'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/all-order`, {
        headers: { 
          Authorization: `Bearer ${user?.token}` 
        }
      });
      return res.data.data as Order[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user?.token
  });

  const { data: profileData } = useQuery({
    queryKey: ['user-profile', user?.token],
    queryFn: async () => {
      const res = await axios.get<ProfileResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      return res.data?.data || null;
    },
    enabled: !!user?.token,
  });

  // Get the most recent order
  const mostRecentOrder = orders?.[0];

  useEffect(() => {
    if (!isLoading && !isError && mostRecentOrder) {
      toast.success('Order placed successfully!', {
        description: `Your order #${mostRecentOrder.id.split('-')[0]} has been confirmed.`,
        duration: 5000,
      });
      
      // Generate QR code for the order
      generateQRCode(mostRecentOrder.id);
    }
  }, [mostRecentOrder, isLoading, isError]);

const generateQRCode = async (orderId: string) => {
  try {
    // Create QR code that points to your frontend delivery verification page
    const qrContent = `${window.location.origin}/agent-dashboard/delivery/verify/${orderId}`;
    
    // Use a QR code generation service (you can also use a client-side library)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrContent)}`;
    
    setQrCodeUrl(qrCodeUrl);
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    // Fallback: create a simple data URL QR code
    const qrContent = `${window.location.origin}/delivery/verify/${orderId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrContent)}`;
    setQrCodeUrl(qrCodeUrl);
  }
};

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-32 w-full animate-pulse border border-slate-200 bg-slate-50" />
        <div className="h-72 w-full animate-pulse border border-slate-200 bg-slate-50" />
      </div>
    );
  }

  if (isError || !mostRecentOrder) {
    return (
      <div className="mx-auto max-w-md border border-slate-200 bg-white px-6 py-14 text-center">
        <p className="text-sm font-medium text-slate-800">
          {isError ? 'We could not load your order' : 'No recent orders found'}
        </p>
        <p className="mt-1 text-[13px] text-slate-500">
          {isError
            ? 'Something went wrong fetching the order. Please try again in a moment.'
            : 'Once you place an order, its confirmation will appear here.'}
        </p>
        <Link
          href="/employee-dashboard/products"
          className="mt-4 inline-block h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium leading-9 text-white hover:bg-brand-800"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <OrderConfirmationContent
        order={mostRecentOrder}
        qrCodeUrl={qrCodeUrl}
        loanExtension={Number(profileData?.loan_extension || 0)}
        showExport
      />
    </div>
  );
}
