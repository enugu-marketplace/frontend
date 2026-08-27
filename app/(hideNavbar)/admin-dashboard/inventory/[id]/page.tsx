import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { InventoryDetails } from '@/components/dashboards/admin/inventories/InventoryDetails';

interface Inventory {
  id: string;
  variantId: string;
  variantName: string;
  productName: string;
  quantity: number;
  lowStockLevel: number;
  batchNumber: string;
  warehouseId: string;
  warehouseName: string;
  createdAt: string;
  updatedAt: string;
}

export default async function InventoryDetailsPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const { id } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;

  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  let inventory: Inventory | null = null;
  
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/inventory?inventory_id=${id}`,
      {
        headers: { Authorization: `Bearer ${session.user.token}` }
      }
    );
    inventory = res.data.data;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    redirect('/admin-dashboard/inventory');
  }

  return (
    <div className="container py-6">
      <InventoryDetails inventory={inventory} token={session.user.token} />
    </div>
  );
}
