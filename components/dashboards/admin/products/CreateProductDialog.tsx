'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export function CreateProductDialog({ token, onSuccess }: { token: string; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    brand: '',
    isPerishable: 'true',
    shelfLifeDays: '',
    unit: 'KG',
    packageType: 'Bag',
    active: 'true',
    categoryId: '',
    product_image: null as File | null,
    images: [] as File[],
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCategories(response.data.data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'product_image' | 'images') => {
    if (e.target.files) {
      if (field === 'product_image') {
        setFormData(prev => ({ ...prev, product_image: e.target.files![0] }));
      } else {
        setFormData(prev => ({ ...prev, images: Array.from(e.target.files!) }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formPayload = new FormData();
    formPayload.append('name', formData.name);
    formPayload.append('description', formData.description);
    formPayload.append('basePrice', formData.basePrice);
    formPayload.append('brand', formData.brand);
    formPayload.append('isPerishable', formData.isPerishable);
    formPayload.append('shelfLifeDays', formData.shelfLifeDays);
    formPayload.append('unit', formData.unit);
    formPayload.append('packageType', formData.packageType);
    formPayload.append('active', formData.active);
    formPayload.append('categoryId', formData.categoryId);
    if (formData.product_image) {
      formPayload.append('product_image', formData.product_image);
    }
    formData.images.forEach((image) => {
      formPayload.append('images', image);
    });

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/create-product`,
        formPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Product created successfully!');
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating product:', error);
      console.error('Error creating product:', error.response?.data || error);

      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='bg-brand-700 hover:bg-brand-800 w-full sm:w-auto' size="sm">
          Create New Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-full mx-2 sm:mx-0 sm:max-w-[600px] max-h-[95vh] font-header p-0">
        <ScrollArea className="h-full max-h-[95vh]">
          <div className="p-4 sm:p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl">Create New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="text-sm sm:text-base resize-vertical min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice" className="text-sm sm:text-base">Base Price</Label>
                  <Input
                    id="basePrice"
                    name="basePrice"
                    type="number"
                    value={formData.basePrice}
                    onChange={handleChange}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-sm sm:text-base">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isPerishable" className="text-sm sm:text-base">Perishable</Label>
                  <Select
                    value={formData.isPerishable}
                    onValueChange={(value) => handleSelectChange('isPerishable', value)}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Is perishable?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true" className="text-sm sm:text-base">Yes</SelectItem>
                      <SelectItem value="false" className="text-sm sm:text-base">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelfLifeDays" className="text-sm sm:text-base">Shelf Life (Days)</Label>
                  <Input
                    id="shelfLifeDays"
                    name="shelfLifeDays"
                    type="number"
                    value={formData.shelfLifeDays}
                    onChange={handleChange}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm sm:text-base">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleSelectChange('unit', value)}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG" className="text-sm sm:text-base">Kilogram (KG)</SelectItem>
                      <SelectItem value="GRAM" className="text-sm sm:text-base">Gram (G)</SelectItem>
                      <SelectItem value="LITER" className="text-sm sm:text-base">Liter (L)</SelectItem>
                      <SelectItem value="ML" className="text-sm sm:text-base">Milliliter (ML)</SelectItem>
                      <SelectItem value="PIECES" className="text-sm sm:text-base">Piece (PC)</SelectItem>
                      <SelectItem value="PACK" className="text-sm sm:text-base">PACK(S)</SelectItem>
                      <SelectItem value="BOTTLE" className="text-sm sm:text-base">Bottle</SelectItem>
                      <SelectItem value="CAN" className="text-sm sm:text-base">Can</SelectItem>
                      <SelectItem value="JAR" className="text-sm sm:text-base">Jar</SelectItem>
                      <SelectItem value="BOX" className="text-sm sm:text-base">Box</SelectItem>
                      <SelectItem value="BAG" className="text-sm sm:text-base">Bag</SelectItem>
                      <SelectItem value="PAINTER" className="text-sm sm:text-base">Painter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageType" className="text-sm sm:text-base">Package Type</Label>
                  <Select
                    value={formData.packageType}
                    onValueChange={(value) => handleSelectChange('packageType', value)}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select package type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bag" className="text-sm sm:text-base">Bag</SelectItem>
                      <SelectItem value="Bottle" className="text-sm sm:text-base">Bottle</SelectItem>
                      <SelectItem value="Box" className="text-sm sm:text-base">Box</SelectItem>
                      <SelectItem value="Can" className="text-sm sm:text-base">Can</SelectItem>
                      <SelectItem value="Jar" className="text-sm sm:text-base">Jar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-sm sm:text-base">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleSelectChange('categoryId', value)}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Main Product Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'product_image')}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Additional Images</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange(e, 'images')}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="active" className="text-sm sm:text-base">Status</Label>
                <Select
                  value={formData.active}
                  onValueChange={(value) => handleSelectChange('active', value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="text-sm sm:text-base">Active</SelectItem>
                    <SelectItem value="false" className="text-sm sm:text-base">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="w-full sm:w-auto mt-2 sm:mt-0"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}