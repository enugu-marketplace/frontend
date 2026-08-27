import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { ProductVariantDetails } from '@/components/dashboards/admin/product-variants/ProductVariantDetails';

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  netWeight: number;
  price: number;
  currency: string;
  image: string;
  attribute: string | null;
  expiryDate: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    description: string;
    product_image: string;
  };
  inventory: unknown | null;
}

export default async function ProductVariantDetailsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params; // Await here
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  let variant: ProductVariant | null = null;

  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/product-variant?product_variant_id=${id}`,
      {
        headers: { Authorization: `Bearer ${session.user.token}` }
      }
    );
    variant = res.data.data;
  } catch (error) {
    console.error('Error fetching product variant:', error);
    redirect('/admin-dashboard/product-variants');
  }

  return (
    <div className="container py-6">
      <ProductVariantDetails variant={variant} token={session.user.token} />
    </div>
  );
}
