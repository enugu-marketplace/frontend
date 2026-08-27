import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CategoriesList } from '@/components/dashboards/admin/categories/CategoriesList';
import { CreateCategoryDialog } from '@/components/dashboards/admin/categories/CreateCategoryDialog';

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-600">Groupings used to organise the product catalogue.</p>
        </div>

        <CreateCategoryDialog token={session.user.token} />
      </div>

      <CategoriesList token={session.user.token} />
    </div>
  );
}
