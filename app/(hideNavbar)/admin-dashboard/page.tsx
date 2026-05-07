
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import  { MonthlyOrdersChart, OrderStatusChart, OrderTrendsChart, SystemOverviewChart } from '@/components/dashboards/admin/AdminChartDialog';
import OrdersChart from '@/components/dashboards/admin/OrdersChart';
import axios from 'axios';


const formatCurrency = (value: number | undefined) => {
  const numValue = value || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(numValue);
};

const APRIL_2026_MANUAL_REVENUE = 210700;

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
 

  // Calculate metrics
  const totalUsers = users.length;
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const systemRevenue = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
  const totalRevenue = systemRevenue + APRIL_2026_MANUAL_REVENUE;
  const pendingOrders = orders.filter((order: any) => order.orderStatus === 'PENDING').length;
  const deliveredOrders = orders.filter((order: any) => order.orderStatus === 'DELIVERED').length;
  const activeUsers = users.filter((user: any) => user.orders?.length > 0).length;

  // Get top selling products
  const productSales: Record<string, number> = {};
  products.forEach((product: any) => {
    productSales[product.name] = 0;
  });
  
  orders.forEach((order: any) => {
    // This assumes order items contain product info - adjust based on your actual data structure
    // You might need to fetch order items separately if not included in the order response
  });

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return (
    <div className="p-4 mt-[60px] md:mt-[20px]">
      <h1 className="text-2xl font-bold">Welcome to your dashboard, {session.user.name}.</h1>
      
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-500">Total Users</h3>
                <p className="text-2xl font-bold mt-2">{totalUsers}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-500">Total Products</h3>
                <p className="text-2xl font-bold mt-2">{totalProducts}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-500">Total Orders</h3>
                <p className="text-2xl font-bold mt-2">{totalOrders}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-500">Total Revenue</h3>
                <p className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
                
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Second row of cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Active Users */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-gray-500">Active Users</h3>
            <p className="text-2xl font-bold mt-2">{activeUsers}</p>
            <p className="text-sm text-gray-500 mt-1">{Math.round((activeUsers / totalUsers) * 100)}% of total users</p>
          </div> 

          {/* Pending Orders */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-gray-500">Pending Orders</h3>
            <p className="text-2xl font-bold mt-2">{pendingOrders}</p>
            <p className="text-sm text-gray-500 mt-1">{Math.round((pendingOrders / totalOrders) * 100)}% of total orders</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-gray-500">Delivered Orders</h3>
            <p className="text-2xl font-bold mt-2">{deliveredOrders}</p>
            <p className="text-sm text-gray-500 mt-1">{Math.round((deliveredOrders / totalOrders) * 100)}% of total orders</p>
          </div>

         
           {/* <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-gray-500">Top Products</h3>
            <ul className="mt-2 space-y-1">
              {topProducts.map((product, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-lg font-medium">{index + 1}.</span>
                  <span className="ml-2">{product}</span>
                </li>
              ))}
            </ul>
          </div> */}
        </div>
      </div>

      {/* Charts section */}
      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
  {/* System Overview (Pie Chart) */}
  <SystemOverviewChart
    totalUsers={totalUsers}
    totalOrders={totalOrders}
    totalProducts={totalProducts}
  />

  {/* Monthly Orders (Bar Chart) */}
  <MonthlyOrdersChart orders={orders} />

  {/* Order Status (Pie Chart) - Full width on larger screens */}
  <div className="lg:col-span-2">
    <OrderStatusChart orders={orders} />
  </div>

  {/* Order Trends (Area Chart) - Full width */}
  <div className="lg:col-span-2">
    <OrderTrendsChart orders={orders} />
  </div>
</div>
    </div>
  );
}