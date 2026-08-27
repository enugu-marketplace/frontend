import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InventoriesList } from '@/components/dashboards/admin/inventories/InventoriesList';
import { CreateInventoryDialog } from '@/components/dashboards/admin/inventories/CreateInventoryDialog';

export default async function AdminInventoriesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
          <p className="mt-1 text-sm text-slate-600">Stock levels held against each warehouse.</p>
        </div>

        <CreateInventoryDialog token={session.user.token} />
      </div>

      <InventoriesList token={session.user.token} />
    </div>
  );
}
