'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Download01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  TruckDeliveryIcon,
  HelpCircleIcon,
  QrCodeIcon,
  ShoppingBasket01Icon,
} from '@hugeicons/core-free-icons';

interface Props {
  order: any; // you can reuse your Order type
  qrCodeUrl: string | null;
  loanExtension?: number;
  showExport?: boolean; // toggle whether to show export button
  /** Confirmation screens celebrate; order history just shows the record */
  heading?: string;
  subheading?: string;
}

export default function OrderConfirmationContent({
  order,
  qrCodeUrl,
  loanExtension = 0,
  showExport = true,
  heading = 'Order confirmed',
  subheading = 'We have received your order and it is being prepared.',
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const formatCurrency = (amount: number, currency: string = 'NGN') =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(amount || 0);

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

      pdf.addImage(
        imgData,
        'PNG',
        0,
        0,
        imgWidth * ratio,
        imgHeight * ratio
      );
      pdf.save(`order-${order.id.split('-')[0]}.pdf`);
      toast.success('Order saved as PDF');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Could not export the PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const isPending = order.orderStatus === 'PENDING';

  return (
    <div className="w-full">
      {showExport && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={exportToPDF}
            disabled={isGeneratingPDF}
            className="flex h-9 items-center gap-2 rounded-sm border border-slate-300 px-3 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700 disabled:text-slate-400"
          >
            <HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={1.8} />
            {isGeneratingPDF ? 'Exporting...' : 'Export as PDF'}
          </button>
        </div>
      )}

      <div ref={contentRef} className="border border-slate-200 bg-white">
        {/* Header */}
        <div className="border-b border-slate-200 bg-brand-50 px-5 py-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 ring-1 ring-brand-200">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} strokeWidth={1.8} />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">{heading}</h2>
          <p className="mt-1 text-sm text-slate-600">{subheading}</p>

          {loanExtension > 0 && (
            <p className="mx-auto mt-4 max-w-lg border-l-4 border-amber-500 bg-amber-50 px-3 py-2.5 text-left text-[13px] text-amber-900">
              {formatCurrency(loanExtension, order.currency)} of this order was charged against
              next month&apos;s allocation.
            </p>
          )}
        </div>

        {/* Summary */}
        <dl className="grid grid-cols-2 gap-4 border-b border-slate-200 p-5 sm:grid-cols-4">
          <div>
            <dt className="text-[12px] text-slate-500">Order number</dt>
            <dd className="mt-0.5 text-sm font-medium text-slate-900">
              #{order.id.split('-')[0].toUpperCase()}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-slate-500">Date placed</dt>
            <dd className="mt-0.5 text-sm font-medium text-slate-900">
              {formatDate(order.placedAt)}
            </dd>
          </div>
          {order.user && (
            <div>
              <dt className="text-[12px] text-slate-500">Customer</dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">
                {order.user.firstname} {order.user.lastname}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-[12px] text-slate-500">Total</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">
              {formatCurrency(order.totalAmount, order.currency)}
            </dd>
          </div>
        </dl>

        {/* Status */}
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-md ${
              isPending ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'
            }`}
          >
            <HugeiconsIcon
              icon={isPending ? Clock01Icon : TruckDeliveryIcon}
              size={20}
              strokeWidth={1.8}
            />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {isPending ? 'Being prepared' : 'On the way'}
            </p>
            <p className="text-[13px] text-slate-500">
              {isPending
                ? 'Your order is being packed at the warehouse.'
                : 'Your order has left the warehouse for delivery.'}
            </p>
          </div>
          {order.trackingCode && (
            <span className="ml-auto rounded-sm bg-slate-100 px-2 py-1 text-[12px] text-slate-600">
              {order.trackingCode}
            </span>
          )}
        </div>

        {/* QR code */}
        <div className="border-b border-slate-200 p-5 text-center">
          <p className="text-[13px] font-medium text-slate-700">Delivery QR code</p>
          {qrCodeUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="Delivery QR code"
                className="mx-auto mt-3 h-44 w-44 border border-slate-200 p-2"
              />
              <p className="mt-2 text-[12px] text-slate-500">
                Show this to the delivery officer to confirm your order.
              </p>
            </>
          ) : (
            <div className="mx-auto mt-3 flex h-44 w-44 flex-col items-center justify-center gap-2 border border-dashed border-slate-300 text-slate-400">
              <HugeiconsIcon icon={QrCodeIcon} size={28} strokeWidth={1.5} />
              <span className="text-[12px]">Generating code</span>
            </div>
          )}
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="border-b border-slate-200">
            <p className="border-b border-slate-200 px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-slate-600">
              Items ({order.items.length})
            </p>
            <div className="divide-y divide-slate-100">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="relative h-14 w-14 shrink-0 border border-slate-100">
                    {item.Product?.product_image ? (
                      <Image
                        src={item.Product.product_image}
                        alt={item.Product?.name || 'Product image'}
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                        <HugeiconsIcon icon={ShoppingBasket01Icon} size={20} strokeWidth={1.3} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800">
                      {item.Product?.name || 'Unknown product'}
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {item.quantity} × {formatCurrency(item.unitPrice, order.currency)}
                      {item.Product?.isPerishable !== undefined && (
                        <>
                          <span className="mx-1.5" aria-hidden>·</span>
                          {item.Product.isPerishable ? 'Fresh' : 'Pantry'}
                        </>
                      )}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-medium text-slate-900">
                    {formatCurrency(item.total, order.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <span className="text-sm font-medium text-slate-900">Total</span>
          <span className="text-base font-semibold text-slate-900">
            {formatCurrency(order.totalAmount, order.currency)}
          </span>
        </div>

        {/* Delivery instructions */}
        <div className="border-b border-slate-200 p-5">
          <p className="text-[13px] font-medium text-slate-800">On delivery day</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-slate-600">
            <li>Keep this confirmation with you, printed or on your phone.</li>
            <li>Show the QR code to the delivery officer for scanning.</li>
            <li>The officer verifies your identity before handing over.</li>
            <li>You may be asked for a one-time code to complete the handover.</li>
          </ol>
        </div>

        {/* Customer details */}
        {order.user && (
          <dl className="grid gap-3 border-b border-slate-200 p-5 text-[13px] sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-800">
                {order.user.firstname} {order.user.lastname}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">Email</dt>
              <dd className="truncate text-slate-800">{order.user.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-800">{order.user.phone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">Status</dt>
              <dd className="capitalize text-slate-800">
                {order.orderStatus?.toLowerCase()}
              </dd>
            </div>
          </dl>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-3 p-5">
          <Link
            href="/employee-dashboard/products"
            className="flex h-10 items-center rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
          >
            Continue shopping
          </Link>
          <Link
            href="/employee-dashboard/orders"
            className="flex h-10 items-center rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
          >
            View all orders
          </Link>

          <p className="ml-auto flex items-center gap-1.5 text-[13px] text-slate-500">
            <HugeiconsIcon icon={HelpCircleIcon} size={15} strokeWidth={1.8} />
            Need help? Call 0800 3684 8
          </p>
        </div>
      </div>
    </div>
  );
}
