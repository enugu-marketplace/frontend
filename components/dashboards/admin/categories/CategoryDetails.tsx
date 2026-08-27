'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { EditCategoryDialog } from './EditCategoryDialog';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';

interface CategoryDetailsProps {
  category: any;
  token: string;
}

export function CategoryDetails({ category, token }: CategoryDetailsProps) {
  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <div className="flex gap-2">
          <EditCategoryDialog 
            category={category} 
            token={token} 
            onSuccess={() => window.location.reload()} 
          />
          <DeleteCategoryDialog 
            categoryId={category.id} 
            token={token} 
            onSuccess={() => window.location.href = '/admin-dashboard/categories'} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">Category Information</p>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-sm font-medium text-slate-500">Slug</h3>
              <p>{category.slug}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Parent Category</h3>
              <p>{category.parent?.name || 'None'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Subcategories</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {category.children.length > 0 ? (
                  category.children.map((child: any) => (
                    <span key={child.id} className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {child.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm">None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">Products ({category.products.length})</p>
          </div>
          <div className="p-4">
            {category.products.length > 0 ? (
              <div className="space-y-4">
                {category.products.map((product: any) => (
                  <div key={product.id} className="flex items-center gap-4 p-2 border rounded-lg">
                    <div className="relative h-16 w-16">
                      <Image
                        src={product.product_image || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-slate-600 line-clamp-1">{product.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No products in this category</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin-dashboard/categories">
            Back to Categories
          </Link>
        </Button>
      </div>
    </div>
  );
}