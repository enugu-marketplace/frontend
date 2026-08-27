import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProductsList } from '@/components/dashboards/admin/products/ProductsList';
import { CreateProductDialog } from '@/components/dashboards/admin/products/CreateProductDialog';

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard/products');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-600">
            The catalogue staff order from. Inactive products stay hidden from the marketplace.
          </p>
        </div>

        <CreateProductDialog token={session.user.token} />
      </div>

      <ProductsList token={session.user.token} />
    </div>
  );
}
