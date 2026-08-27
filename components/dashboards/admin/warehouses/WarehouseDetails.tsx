'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EditWarehouseDialog } from './EditWarehouseDialog';
import { DeleteWarehouseDialog } from './DeleteWarehouseDialog';

interface WarehouseDetailsProps {
  warehouse: any;
  token: string;
}

export function WarehouseDetails({ warehouse, token }: WarehouseDetailsProps) {
  if (!warehouse) {
    return <div>Warehouse not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{warehouse.name}</h1>
        <div className="flex gap-2">
          <EditWarehouseDialog 
            warehouse={warehouse} 
            token={token} 
            onSuccess={() => window.location.reload()} 
          />
          <DeleteWarehouseDialog 
            warehouseId={warehouse.id} 
            token={token} 
            onSuccess={() => window.location.href = '/admin-dashboard/warehouse'} 
          />
        </div>
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">Warehouse Information</p>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500">Address</h3>
            <p>{warehouse.address}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500">City</h3>
            <p>{warehouse.city}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500">Country</h3>
            <p>{warehouse.country}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500">Created At</h3>
            <p>{new Date(warehouse.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500">Last Updated</h3>
            <p>{new Date(warehouse.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">Inventory</p>
        </div>
        <div className="p-4">
          {warehouse.inventories.length > 0 ? (
            <div className="space-y-4">
              {/* Render inventory items here */}
            </div>
          ) : (
            <p>No inventory items found for this warehouse.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin-dashboard/warehouse">
            Back to Warehouses
          </Link>
        </Button>
      </div>
    </div>
  );
}