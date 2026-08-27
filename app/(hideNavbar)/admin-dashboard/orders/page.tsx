import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import axios from 'axios';
import OrdersTable from '@/components/dashboards/admin/orders/OrdersTable';
import { ExportExternalOrdersDialog } from '@/components/dashboards/admin/users/ExportExternalOrders';
import { ResetPurchasingUnitDialog } from '@/components/dashboards/admin/orders/ResetPurchasingUnitDialog';

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(`/admin-login?callbackUrl=${encodeURIComponent('/admin-dashboard/orders')}`);
  }

  if (session.user.role !== 'super_admin') {
    redirect('/auth/error?error=Unauthorized');
  }

  let orders = [];
  let users: Array<{
    id: string;
    firstname?: string;
    lastname?: string;
  }> = [];
  try {
    const [ordersResponse, usersResponse] = await Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/all-order`, {
        headers: { Authorization: `Bearer ${session.user.token}` }
      }),
      axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${session.user.token}` }
      }),
    ]);

    orders = ordersResponse.data.data || [];
    users = usersResponse.data.data || [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  }

  const usersById = new Map(users.map((user) => [user.id, user]));
  const ordersWithUserNames = orders.map((order: any) => {
    if (order.user?.firstname || order.user?.lastname) {
      return order;
    }

    const matchedUser = usersById.get(order.userId);
    if (!matchedUser) {
      return order;
    }

    return {
      ...order,
      user: {
        ...order.user,
        firstname: matchedUser.firstname || '',
        lastname: matchedUser.lastname || '',
      },
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Every order placed under the scheme, with delivery and payment status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportExternalOrdersDialog token={session.user.token} />
          <ResetPurchasingUnitDialog token={session.user.token} />
        </div>
      </div>

      <OrdersTable orders={ordersWithUserNames} />
    </div>
  );
}
