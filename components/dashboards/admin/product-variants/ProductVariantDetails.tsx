'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { EditProductVariantDialog } from './EditProductVariantDialog';
import { DeleteProductVariantDialog } from './DeleteProductVariantDialog';

interface ProductVariantDetailsProps {
  variant: any;
  token: string;
}

export function ProductVariantDetails({ variant, token }: ProductVariantDetailsProps) {
  if (!variant) {
    return <div>Product variant not found</div>;
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{variant.name}</h1>
        <div className="flex gap-2">
          <EditProductVariantDialog 
            variant={variant} 
            token={token} 
            onSuccess={() => window.location.reload()} 
          />
          <DeleteProductVariantDialog 
            variantId={variant.id} 
            token={token} 
            onSuccess={() => window.location.href = '/admin-dashboard/product-variants'} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">Variant Image</p>
          </div>
          <div className="p-4">
            <div className="relative h-64 w-full">
              <Image
                src={variant.image || '/placeholder-product.jpg'}
                alt={variant.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">Variant Information</p>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-sm font-medium text-slate-500">SKU</h3>
              <p>{variant.sku}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Product</h3>
              <p>{variant.product.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Price</h3>
              <p>{formatCurrency(variant.price, variant.currency)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Net Weight</h3>
              <p>{variant.netWeight} kg</p>
            </div>
            {variant.attribute && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Attribute</h3>
                <p>{variant.attribute}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-slate-500">Expiry Date</h3>
              <p>{formatDate(variant.expiryDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Created At</h3>
              <p>{new Date(variant.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Last Updated</h3>
              <p>{new Date(variant.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin-dashboard/product-variants">
            Back to Product Variants
          </Link>
        </Button>
      </div>
    </div>
  );
}