import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { CategoryDetails } from '@/components/dashboards/admin/categories/CategoryDetails';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  products: Array<{
    id: string;
    name: string;
    description: string;
    product_image: string;
  }>;
  parent: null | {
    id: string;
    name: string;
  };
  children: Array<{
    id: string;
    name: string;
  }>;
}

export default async function CategoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  let category: Category | null = null;
  
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/category?category_id=${resolvedParams.id}`,
      { headers: { Authorization: `Bearer ${session.user.token}` } }
    );
    category = res.data.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    redirect('/admin-dashboard/categories');
  }

  return (
    <div className="container py-6">
      <CategoryDetails category={category} token={session.user.token} />
    </div>
  );
}
