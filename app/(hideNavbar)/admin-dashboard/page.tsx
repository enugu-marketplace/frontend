import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

import {
  MonthlyOrdersChart,
  OrderStatusChart,
  OrderTrendsChart,
  SystemOverviewChart,
} from '@/components/dashboards/admin/AdminChartDialog';
import StatCard from '@/components/dashboards/admin/StatCard';

const formatCurrency = (value: number | undefined) => {
  const numValue = value || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(numValue);
};

const APRIL_2026_MANUAL_REVENUE = 210700;

const share = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}% of total` : 'No data yet';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/admin-login?callbackUrl=${encodeURIComponent('/admin-dashboard')}`);
  }

  if (session.user.role !== 'super_admin') {
    redirect('/auth/error?error=Unauthorized');
  }

  // Fetch all data in parallel
  const [usersResponse, productsResponse, ordersResponse] = await Promise.allSettled([
    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${session.user.token}` }
    }),
    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products`, {
      headers: { Authorization: `Bearer ${session.user.token}` }
    }),
    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/all-order`, {
      headers: { Authorization: `Bearer ${session.user.token}` }
    })
  ]);

  // Process responses
  const users = usersResponse.status === 'fulfilled' ? usersResponse.value.data.data : [];
  const products = productsResponse.status === 'fulfilled' ? productsResponse.value.data.data : [];
  const orders = ordersResponse.status === 'fulfilled' ? ordersResponse.value.data.data : [];

  const failed = [
    usersResponse.status === 'rejected' && 'users',
    productsResponse.status === 'rejected' && 'products',
    ordersResponse.status === 'rejected' && 'orders',
  ].filter(Boolean) as string[];

  // Calculate metrics
  const totalUsers = users.length;
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const systemRevenue = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
  const totalRevenue = systemRevenue + APRIL_2026_MANUAL_REVENUE;
  const pendingOrders = orders.filter((order: any) => order.orderStatus === 'PENDING').length;
  const deliveredOrders = orders.filter((order: any) => order.orderStatus === 'DELIVERED').length;
  const activeUsers = users.filter((user: any) => user.orders?.length > 0).length;

  const firstName = session.user.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Scheme activity across users, products and orders.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin-dashboard/orders"
            className="flex h-9 items-center rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
          >
            View orders
          </Link>
          <Link
            href="/admin-dashboard/consent"
            className="flex h-9 items-center rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
          >
            Review consents
          </Link>
        </div>
      </div>

      {failed.length > 0 && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          Could not load {failed.join(', ')} from the API. The figures below exclude that data.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} icon="users" />
        <StatCard label="Products listed" value={totalProducts} icon="products" />
        <StatCard label="Orders placed" value={totalOrders} icon="orders" />
        <StatCard
          label="Total revenue"
          value={formatCurrency(totalRevenue)}
          icon="revenue"
          note={`Includes ${formatCurrency(APRIL_2026_MANUAL_REVENUE)} recorded manually for April 2026`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Active users" value={activeUsers} note={share(activeUsers, totalUsers)} />
        <StatCard
          label="Pending orders"
          value={pendingOrders}
          note={share(pendingOrders, totalOrders)}
          tone="amber"
        />
        <StatCard
          label="Delivered orders"
          value={deliveredOrders}
          note={share(deliveredOrders, totalOrders)}
          tone="brand"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SystemOverviewChart
          totalUsers={totalUsers}
          totalOrders={totalOrders}
          totalProducts={totalProducts}
        />

        <MonthlyOrdersChart orders={orders} />

        <div className="xl:col-span-2">
          <OrderStatusChart orders={orders} />
        </div>

        <div className="xl:col-span-2">
          <OrderTrendsChart orders={orders} />
        </div>
      </div>
    </div>
  );
}
