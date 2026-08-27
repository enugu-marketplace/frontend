import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { WarehouseDetails } from '@/components/dashboards/admin/warehouses/WarehouseDetails';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  inventories: unknown[];
}

export default async function WarehouseDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  let warehouse: Warehouse | null = null;

  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/warehouse?warehouse_id=${id}`,
      {
        headers: { Authorization: `Bearer ${session.user.token}` }
      }
    );
    warehouse = res.data.data;
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    redirect('/admin-dashboard/warehouse');
  }

  return (
    <div className="container py-6">
      <WarehouseDetails warehouse={warehouse} token={session.user.token} />
    </div>
  );
}
