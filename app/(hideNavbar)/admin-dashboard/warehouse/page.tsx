import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WarehousesList } from '@/components/dashboards/admin/warehouses/WarehousesList';
import { CreateWarehouseDialog } from '@/components/dashboards/admin/warehouses/CreateWarehouseDialog';

export default async function AdminWarehousesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Warehouses</h1>
          <p className="mt-1 text-sm text-slate-600">Storage and distribution points orders are fulfilled from.</p>
        </div>

        <CreateWarehouseDialog token={session.user.token} />
      </div>

      <WarehousesList token={session.user.token} />
    </div>
  );
}
