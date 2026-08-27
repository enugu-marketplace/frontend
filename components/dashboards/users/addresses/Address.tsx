'use client';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Delete02Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  Location01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';



// Updated schema to include isDefault
const addressFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  isDefault: z.boolean(),
});

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { data: clientSession, status} = useSession();
  const [serverUser, setServerUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setServerUser(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Session error:", err);
        setIsLoading(false);
      });
  }, []);
  
  const user = clientSession?.user || serverUser;

  const form = useForm<z.infer<typeof addressFormSchema>>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: '',
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      zipCode: '',
      isDefault: false,
    },
  });

  // Fetch addresses
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/address`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      return res.data.data as Address[];
    },
    enabled: !!user?.token,
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (values: z.infer<typeof addressFormSchema>) => {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/address/add-address`,
        values,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Address added successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add address');
    }
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async (values: z.infer<typeof addressFormSchema>) => {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/address/update-address?address_id=${isEditing}`,
        values,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Address updated successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update address');
    }
  });

  // Set default address mutation
  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/address/set-default-address?address_id=${addressId}`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Default address updated successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set default address');
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/address/delete-address?address_id=${addressId}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
    },
    onSuccess: () => {
      toast.success('Address deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    }
  });

  const resetForm = () => {
    form.reset();
    setIsEditing(null);
    setIsFormOpen(false);
  };

  const handleEdit = (address: Address) => {
    form.reset({
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    });
    setIsEditing(address.id);
    setIsFormOpen(true);
  };

  const onSubmit = (values: z.infer<typeof addressFormSchema>) => {
    if (isEditing) {
      updateAddressMutation.mutate(values);
    } else {
      createAddressMutation.mutate(values);
    }
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultAddressMutation.mutate(addressId);
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 border border-slate-200 bg-white p-4">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Delivery addresses</h1>
          <p className="mt-1 text-sm text-slate-600">
            Where your orders are delivered. The default address is used at checkout.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
            Add address
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="border border-slate-200 bg-white">
          <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
            {isEditing ? 'Edit address' : 'New address'}
          </p>

          <div className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-slate-700">
                          Label
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Home"
                            className="h-10 rounded-sm border-slate-300 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-slate-700">
                          Street address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="24 Richard Street, Asata"
                            className="h-10 rounded-sm border-slate-300 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-slate-700">
                          City
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enugu North"
                            className="h-10 rounded-sm border-slate-300 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-slate-700">
                          State
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enugu"
                            className="h-10 rounded-sm border-slate-300 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-slate-700">
                          Country
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nigeria"
                            className="h-10 rounded-sm border-slate-300 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-slate-700">
                          Postal code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="400102"
                            className="h-10 rounded-sm border-slate-300 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between gap-3 rounded-sm border border-slate-200 p-3 md:col-span-2">
                        <FormLabel className="text-[13px] font-medium text-slate-700">
                          Use this as my default delivery address
                        </FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-10 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                    className="h-10 rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {createAddressMutation.isPending || updateAddressMutation.isPending
                      ? 'Saving...'
                      : 'Save address'}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {addresses?.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={Location01Icon} size={24} strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">No addresses saved</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Add one so your orders have somewhere to go.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses?.map((address) => (
            <div
              key={address.id}
              className={cn(
                'flex flex-col border bg-white p-4',
                address.isDefault ? 'border-brand-600' : 'border-slate-200'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{address.label}</p>
                  {address.isDefault && (
                    <span className="rounded-sm bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800 ring-1 ring-brand-200">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleEdit(address)}
                    title="Edit address"
                    className="rounded-sm p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={() => deleteAddressMutation.mutate(address.id)}
                    disabled={deleteAddressMutation.isPending}
                    title="Delete address"
                    className="rounded-sm p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              <address className="mt-2 text-[13px] not-italic leading-6 text-slate-600">
                {address.street}
                <br />
                {address.city}, {address.state}
                <br />
                {address.country} {address.zipCode}
              </address>

              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  disabled={setDefaultAddressMutation.isPending}
                  className="mt-auto pt-3 text-left text-[13px] font-medium text-brand-700 hover:underline disabled:text-slate-400"
                >
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
