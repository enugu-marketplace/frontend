"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import OrderConfirmationContent from "@/components/OrderConfirmationContent";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
  productId: string | null;
  variantId: string | null;
  Product: {
    id: string;
    name: string;
    product_image: string;
    description: string;
  } | null;
  variant: {
    id: string;
    name: string;
    image: string;
    price: number;
  } | null;
}

interface OrderDetails {
  id: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  orderStatus: string;
  trackingCode: string | null;
  placedAt: string;
  deliveredAt: string | null;
  items: OrderItem[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

const formatCurrency = (amount: number, currency: string = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount);
};

export default function SingleOrderPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { data: clientSession } = useSession();
  const [serverUser, setServerUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(setServerUser)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const user = clientSession?.user || serverUser;

  const { data: order, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/single-order`,
        {
          params: { order_id: orderId },
          headers: {
            Authorization: `Bearer ${
              user?.token || localStorage.getItem("token")
            }`,
          },
        }
      );
      return res.data.data as OrderDetails;
    },
    retry: 1,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load order details");
      setShouldRedirect(true);
    }
  }, [isError]);

  useEffect(() => {
    if (order?.id) {
      generateQRCode(order.id);
    }
  }, [order]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/employee-dashboard/orders");
    }
  }, [shouldRedirect, router]);

  const generateQRCode = async (orderId: string) => {
    try {
      // Create QR code that points to your frontend delivery verification page
      const qrContent = `${window.location.origin}/delivery/verify/${orderId}`;

      // Use a QR code generation service (you can also use a client-side library)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        qrContent
      )}`;

      setQrCodeUrl(qrCodeUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      // Fallback: create a simple data URL QR code
      const qrContent = `${window.location.origin}/delivery/verify/${orderId}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        qrContent
      )}`;
      setQrCodeUrl(qrCodeUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        <div className="h-6 w-56 animate-pulse rounded bg-slate-100" />
        <div className="h-96 w-full animate-pulse border border-slate-200 bg-slate-50" />
      </div>
    );
  }

  if (!order) {
    return null; // The redirect will happen via useEffect
  }

  const statusTone =
    order.orderStatus === "DELIVERED"
      ? "bg-brand-50 text-brand-800 ring-brand-200"
      : order.orderStatus === "CANCELLED"
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-amber-50 text-amber-800 ring-amber-200";

  return (
    <div className="space-y-4">
      <Link
        href="/employee-dashboard/orders"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-brand-700"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">
          Order #{order.id.split("-")[0].toUpperCase()}
        </h1>
        <span
          className={cn(
            "rounded-sm px-2 py-1 text-[11px] font-medium capitalize ring-1",
            statusTone
          )}
        >
          {order.orderStatus.toLowerCase()}
        </span>
      </div>

      <OrderConfirmationContent
        order={order}
        qrCodeUrl={qrCodeUrl}
        showExport
        heading="Order details"
        subheading="Keep the QR code handy for collection or delivery."
      />
    </div>
  );
}
