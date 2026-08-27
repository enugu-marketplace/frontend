import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProductVariantsList } from '@/components/dashboards/admin/product-variants/ProductVariantList';
import { CreateProductVariantDialog } from '@/components/dashboards/admin/product-variants/CreateProductVariantDialog';

export default async function AdminProductVariantsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Product variants</h1>
          <p className="mt-1 text-sm text-slate-600">Sizes, weights and packaging options for catalogue products.</p>
        </div>

        <CreateProductVariantDialog token={session.user.token} />
      </div>

      <ProductVariantsList token={session.user.token} />
    </div>
  );
}
