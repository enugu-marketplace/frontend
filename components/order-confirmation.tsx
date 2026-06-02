'use client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Truck, HelpCircle, Download, QrCode } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const exportToPDF = async () => {
    if (!contentRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`order-confirmation-${mostRecentOrder?.id.split('-')[0]}.pdf`);
      
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md p-8">
          <Skeleton className="h-8 w-48 mx-auto mb-6" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !mostRecentOrder) {
    return (
      <div className="container py-12">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isError ? 'Error loading order' : 'No recent orders found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isError 
              ? 'We encountered an error loading your order details.' 
              : 'You haven\'t placed any orders recently.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/employee-dashboard/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(amount);
  };

  return (
    <div className="container py-12">
      {/* Export Button */}
      {mostRecentOrder && (
      <OrderConfirmationContent
        order={mostRecentOrder}
        qrCodeUrl={qrCodeUrl}
        loanExtension={Number(profileData?.loan_extension || 0)}
        showExport
      />
    )}
    </div>
  );
}