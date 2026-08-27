'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EditProductDialog } from './EditProductDialog';
import { format } from 'date-fns';

interface ProductDetailsProps {
  productId: string;
  token: string;
}

interface Product {
  id: string | number;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  brand?: string;
  isPerishable: boolean;
  shelfLifeDays?: number;
  unit: string;
  packageType: string;
  active: boolean;
  categoryId: string | number;
  category?: {
    name: string;
  };
  product_image?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export function ProductDetails({ productId, token }: ProductDetailsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/product?product_id=${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data;
    }
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    toast.success('Product updated successfully!');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/delete-product?product_id=${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Product deleted successfully');
      router.push('/admin-dashboard/products');
    } catch (error) {
      toast.error('Failed to delete product');
      console.error('Delete error:', error);
    }
  };

  if (isLoading) return (
    <div className="container py-4 sm:py-6 flex justify-center items-center min-h-[50vh]">
      <div className="text-base sm:text-lg">Loading product details...</div>
    </div>
  );
  
  if (isError) return (
    <div className="container py-4 sm:py-6 flex justify-center items-center min-h-[50vh]">
      <div className="text-base sm:text-lg text-red-600">Error: {(error as Error).message}</div>
    </div>
  );

  if (!data) return (
    <div className="container py-4 sm:py-6 flex justify-center items-center min-h-[50vh]">
      <div className="text-base sm:text-lg">Product not found</div>
    </div>
  );

  const product: Product = data;

  return (
    <div className="container py-4 sm:py-6 mt-[80px] space-y-4 sm:space-y-6 px-3 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Product Details</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <EditProductDialog 
            product={product} 
            token={token} 
            onSuccess={handleSuccess} 
          />
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            size="sm"
            className="w-full sm:w-auto"
          >
            Delete Product
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Product Images Card */}
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">Images</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Main Image */}
              {product.product_image ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Main Image</p>
                  <div className="relative aspect-square w-full">
                    <Image
                      src={product.product_image}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Main Image</p>
                  <div className="relative aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-slate-500 text-sm">No main image</span>
                  </div>
                </div>
              )}
              
              {/* Additional Images */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Additional Images</p>
                {product.images && product.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {product.images.map((image: string, index: number) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-slate-500 text-sm">No additional images</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Card */}
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">Product Information</p>
          </div>
          <div className="space-y-4 p-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-semibold leading-tight">{product.name}</h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{product.description}</p>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Base Price</p>
                <p className="font-medium text-sm sm:text-base">
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: product.currency || 'NGN',
                  }).format(product.basePrice)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Brand</p>
                <p className="font-medium text-sm sm:text-base">{product.brand || 'No brand'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Category</p>
                <p className="font-medium text-sm sm:text-base">{product.category?.name || 'No category'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Status</p>
                <Badge 
                  variant={product.active ? 'default' : 'destructive'} 
                  className="text-xs sm:text-sm"
                >
                  {product.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Perishable</p>
                <Badge 
                  variant={product.isPerishable ? 'default' : 'secondary'} 
                  className="text-xs sm:text-sm"
                >
                  {product.isPerishable ? 'Yes' : 'No'}
                </Badge>
              </div>

              {product.isPerishable && product.shelfLifeDays && (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-slate-500">Shelf Life</p>
                  <p className="font-medium text-sm sm:text-base">{product.shelfLifeDays} days</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Unit</p>
                <p className="font-medium text-sm sm:text-base">{product.unit}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Package Type</p>
                <p className="font-medium text-sm sm:text-base">{product.packageType}</p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Created At</p>
                <p className="text-xs sm:text-sm font-medium">
                  {format(new Date(product.createdAt), 'PPpp')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-500">Last Updated</p>
                <p className="text-xs sm:text-sm font-medium">
                  {format(new Date(product.updatedAt), 'PPpp')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}