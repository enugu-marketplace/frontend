import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { formatCurrency, cn } from '@/lib/utils';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';



export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {

    const { orderId } = await params;



  // First get the session before using params
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(`/admin-login?callbackUrl=${encodeURIComponent(`/admin-dashboard/orders/${orderId}`)}`);
  }

  if (session.user.role !== 'super_admin') {
    redirect('/auth/error?error=Unauthorized');
  }

  
  let order = null;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/single-order?order_id=${orderId}`,
     
      {
        headers: { Authorization: `Bearer ${session.user.token}` }
      }
    );
    
    order = response.data.data;
  } catch (error) {
    console.error('Failed to fetch order:', error);
    redirect('/admin-dashboard/orders');
  }

  if (!order) {
    redirect('/admin-dashboard/orders');
  }

  let customerName =
    `${order?.user?.firstname ?? ''} ${order?.user?.lastname ?? ''}`.trim() ||
    order?.user?.name ||
    '';

  if (!customerName && order?.userId) {
    try {
      const usersResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`,
        {
          headers: { Authorization: `Bearer ${session.user.token}` }
        }
      );

      const users = usersResponse.data?.data || [];
      const matchedUser = users.find((user: any) => user.id === order.userId);
      customerName = `${matchedUser?.firstname ?? ''} ${matchedUser?.lastname ?? ''}`.trim();
    } catch {
      // Keep fallback below if user lookup fails.
    }
  }

  customerName = customerName || 'N/A';

  const statusChip = (value: string, kind: 'order' | 'payment') => {
    const upper = value?.toUpperCase();
    const good = kind === 'order' ? upper === 'DELIVERED' : upper === 'PAID';
    const bad = kind === 'order' ? upper === 'CANCELLED' : upper === 'FAILED';

    return cn(
      'inline-block rounded-sm px-2 py-1 text-[11px] font-medium capitalize ring-1',
      good
        ? 'bg-brand-50 text-brand-800 ring-brand-200'
        : bad
        ? 'bg-red-50 text-red-700 ring-red-200'
        : 'bg-amber-50 text-amber-800 ring-amber-200'
    );
  };

  return (
    <div className="space-y-4">
      <Link
        href="/admin-dashboard/orders"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-brand-700"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
        Back to orders
      </Link>

      <h1 className="text-xl font-semibold text-slate-900">
        Order #{order.id.substring(0, 8).toUpperCase()}
      </h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border border-slate-200 bg-white lg:col-span-2">
          <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
            Order details
          </p>

          <dl className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12px] text-slate-500">Order status</dt>
              <dd className="mt-1">
                <span className={statusChip(order.orderStatus, 'order')}>
                  {order.orderStatus?.toLowerCase()}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-[12px] text-slate-500">Payment status</dt>
              <dd className="mt-1">
                <span className={statusChip(order.paymentStatus, 'payment')}>
                  {order.paymentStatus?.toLowerCase()}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-[12px] text-slate-500">Customer</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{customerName}</dd>
            </div>

            <div>
              <dt className="text-[12px] text-slate-500">Tracking code</dt>
              <dd className="mt-1 font-mono text-sm text-slate-800">
                {order.trackingCode || 'Not available'}
              </dd>
            </div>

            <div>
              <dt className="text-[12px] text-slate-500">Placed at</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {new Date(order.placedAt).toLocaleString('en-NG')}
              </dd>
            </div>

            <div>
              <dt className="text-[12px] text-slate-500">Last updated</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {new Date(order.updatedAt).toLocaleString('en-NG')}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border border-slate-200 bg-white">
          <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
            Total
          </p>

          <dl className="space-y-2 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Subtotal</dt>
              <dd className="text-slate-900">{formatCurrency(order.totalAmount + order.discount)}</dd>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Discount</dt>
                <dd className="text-red-600">-{formatCurrency(order.discount)}</dd>
              </div>
            )}

            <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-base">
              <dt className="font-medium text-slate-900">Total</dt>
              <dd className="font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {order?.items?.length > 0 && (
        <div className="border border-slate-200 bg-white">
          <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
            Items ({order.items.length})
          </p>

          <div className="divide-y divide-slate-100">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden border border-slate-100 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.variant?.image ||
                      item.Product?.product_image ||
                      '/placeholder-product.jpg'
                    }
                    alt={item.variant?.name || item.Product?.name || 'Product'}
                    className="h-full w-full object-contain p-1"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-800">
                    {item.variant?.name || item.Product?.name || 'Unknown product'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {item.quantity} &times; {formatCurrency(item.unitPrice)}
                    {item.variant?.netWeight ? ` \u00b7 ${item.variant.netWeight}kg` : ''}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-medium text-slate-900">
                  {formatCurrency(item.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
