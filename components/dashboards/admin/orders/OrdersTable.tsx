"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "@/types/order";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  EyeIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import OrdersFilter from "../OrdersFilter";

interface OrdersTableProps {
  orders: Order[];
}

type ManualAprilOrder = {
  sn: number;
  verificationId: string;
  name: string;
  phone: string;
  governmentEntity: string;
  employeeId: string;
  amount: number;
  narration: string;
  remarks: string;
};

const APRIL_2026_MANUAL_ORDERS: ManualAprilOrder[] = [
  {
    sn: 1,
    verificationId: "2503372218",
    name: "EVEREST ANASTAECIA P.",
    phone: "08032068969",
    governmentEntity: "MINISTRY OF COMMERCE AND INDUSTRY",
    employeeId: "",
    amount: 30000,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "MANUAL",
  },
  {
    sn: 2,
    verificationId: "2691772644",
    name: "NWANZE SYLVANUS",
    phone: "08066583466",
    governmentEntity: "OFFICE OF THE HEAD OF SERVICE",
    employeeId: "49112000137",
    amount: 26300,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "MANUAL",
  },
  {
    sn: 3,
    verificationId: "2374993091",
    name: "EZE NWAGBOLUIWE",
    phone: "08146317013",
    governmentEntity: "MINISTRY OF WATER RESOURCES",
    employeeId: "ENSC1544",
    amount: 24300,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "MANUAL",
  },
  {
    sn: 4,
    verificationId: "2709993738",
    name: "EGBODINMA CHARLES",
    phone: "07037431851",
    governmentEntity: "MINISTRY OF WATER RESOURCES",
    employeeId: "ENSC1530",
    amount: 22500,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "MANUAL",
  },
  {
    sn: 5,
    verificationId: "2637588911",
    name: "NNAJI LINDA",
    phone: "08063896839",
    governmentEntity: "OFFICE OF THE HEAD OF SERVICE",
    employeeId: "ENSC18745",
    amount: 23500,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "MANUAL",
  },
  {
    sn: 6,
    verificationId: "2130195154",
    name: "EZE JOSEPHINE",
    phone: "08068816955",
    governmentEntity: "STATE BUREAU OF STATISTICS ENUGU",
    employeeId: "ENSC18907",
    amount: 23650,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "MANUAL",
  },
  {
    sn: 7,
    verificationId: "2509785533",
    name: "UGWUANYI PATIENCE",
    phone: "07058973440",
    governmentEntity: "OFFICE OF THE HEAD OF SERVICE",
    employeeId: "49071900112",
    amount: 11000,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "MANUAL",
  },
  {
    sn: 8,
    verificationId: "9718462872",
    name: "MARYROSE ANEKWE",
    phone: "09122583109",
    governmentEntity: "MINISTRY OF HEALTH",
    employeeId: "",
    amount: 23000,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "",
  },
  {
    sn: 9,
    verificationId: "2160566815",
    name: "ONAGA KAOSISOCHUKWU",
    phone: "07066518722",
    governmentEntity: "",
    employeeId: "",
    amount: 13300,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "",
  },
  {
    sn: 10,
    verificationId: "7016735465",
    name: "UGBOKA CHRISTIANA U",
    phone: "08137753901",
    governmentEntity: "OFFICE OF THE HEAD OF SERVICE",
    employeeId: "",
    amount: 13150,
    narration: "EN-FOOD SCHEME APRIL 2026",
    remarks: "",
  },
];

const APRIL_2026_MANUAL_TOTAL = APRIL_2026_MANUAL_ORDERS.reduce(
  (sum, order) => sum + order.amount,
  0
);


export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.id.substring(0, 8)}...
      </span>
    ),
  },

  {
    id: "customerName",
    header: "Customer Name",

    // ⭐ Derive value safely
    accessorFn: (row) => {
      const fullName = `${row.user?.firstname ?? ""} ${row.user?.lastname ?? ""}`.trim();
      return fullName || "N/A";
    },

    cell: ({ getValue }) => {
      const name = getValue<string>();

      return (
        <span className="font-medium">
          {name.length > 18 ? `${name.substring(0, 18)}...` : name}
        </span>
      );
    },
  },

  {
    accessorKey: "placedAt",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.original.placedAt).toLocaleDateString(),
  },

  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.totalAmount),
  },

  {
    accessorKey: "orderStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.orderStatus;

      return (
        <span
          className={cn(
            "rounded-sm px-2 py-1 text-[11px] font-medium capitalize ring-1",
            status === "DELIVERED"
              ? "bg-brand-50 text-brand-800 ring-brand-200"
              : status === "CANCELLED"
              ? "bg-red-50 text-red-700 ring-red-200"
              : "bg-amber-50 text-amber-800 ring-amber-200"
          )}
        >
          {status.toLowerCase()}
        </span>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => (
      <Link
        href={`/admin-dashboard/orders/${row.original.id}`}
        title="View order"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700"
      >
        <HugeiconsIcon icon={EyeIcon} size={16} strokeWidth={1.8} />
      </Link>
    ),
  },
];

export default function OrdersTable({ orders }: OrdersTableProps) {
  const uniqueOrders = useMemo(
    () => Array.from(new Map(orders.map((order) => [order.id, order])).values()),
    [orders]
  );

  const [filteredOrders, setFilteredOrders] = useState<Order[]>(uniqueOrders);
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: string; month: string }>({
    year: "all",
    month: "all",
  });

  const isApril2026Selected =
    selectedPeriod.year === "2026" && selectedPeriod.month === "04";

  /**
   ✅ VERY IMPORTANT FIX
   When new orders arrive from API,
   update filtered state automatically.
  */
  useEffect(() => {
    setFilteredOrders(uniqueOrders);
  }, [uniqueOrders]);

  const table = useReactTable({
    data: filteredOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;

  return (
    <div className="space-y-4">
      {/* Filter Component */}
      <OrdersFilter
        orders={uniqueOrders}
        onFilterChange={setFilteredOrders}
        onSelectionChange={setSelectedPeriod}
      />

      {isApril2026Selected && (
        <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <HugeiconsIcon icon={Alert01Icon} size={17} strokeWidth={1.8} />
            April 2026 reconciliation notice
          </p>
          <p className="mt-1 text-[13px] leading-6 text-amber-800">
            Some April 2026 orders were placed manually outside the platform. They are not in the
            system order list and should be reconciled separately.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-amber-900">
            <span>
              {APRIL_2026_MANUAL_ORDERS.length} manual records &middot;{" "}
              {formatCurrency(APRIL_2026_MANUAL_TOTAL)}
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <button className="h-8 rounded-sm border border-amber-300 bg-white px-3 text-[13px] font-medium text-amber-900 hover:bg-amber-100">
                  View manual records
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[88vh] w-[96vw] max-w-[1500px]">
                <DialogHeader>
                  <DialogTitle>Manual April 2026 orders</DialogTitle>
                  <DialogDescription>
                    Supplied as manual entries after the April incident, shown here for
                    reconciliation.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[72vh] overflow-auto border border-slate-200">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-slate-200 hover:bg-transparent">
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">S/N</TableHead>
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">Verification ID</TableHead>
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">Name</TableHead>
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">Phone</TableHead>
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">Entity</TableHead>
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">Employee ID</TableHead>
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">Amount</TableHead>
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">Narration</TableHead>
                        <TableHead className="text-[12px] uppercase tracking-wide text-slate-600">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {APRIL_2026_MANUAL_ORDERS.map((manualOrder) => (
                        <TableRow key={manualOrder.sn} className="border-slate-100 text-[13px]">
                          <TableCell>{manualOrder.sn}</TableCell>
                          <TableCell>{manualOrder.verificationId}</TableCell>
                          <TableCell>{manualOrder.name}</TableCell>
                          <TableCell>{manualOrder.phone}</TableCell>
                          <TableCell>{manualOrder.governmentEntity || "-"}</TableCell>
                          <TableCell>{manualOrder.employeeId || "-"}</TableCell>
                          <TableCell>{formatCurrency(manualOrder.amount)}</TableCell>
                          <TableCell>{manualOrder.narration}</TableCell>
                          <TableCell>{manualOrder.remarks || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-200 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-slate-100 text-[13px] hover:bg-slate-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  No orders match these filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-slate-500">
          Showing {table.getRowModel().rows.length} of {filteredOrders.length} orders
          {filteredOrders.length !== uniqueOrders.length && (
            <span className="text-slate-400"> (filtered from {uniqueOrders.length})</span>
          )}
        </p>

        <div className="flex items-center gap-3">
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
          >
            {[5, 10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
              className="hidden h-8 w-8 items-center justify-center rounded-sm border border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700 disabled:text-slate-300 lg:flex"
            >
              <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={15} strokeWidth={2} />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700 disabled:text-slate-300"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
            </button>

            <span className="px-2 text-[13px] text-slate-600">
              Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700 disabled:text-slate-300"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
              className="hidden h-8 w-8 items-center justify-center rounded-sm border border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700 disabled:text-slate-300 lg:flex"
            >
              <HugeiconsIcon icon={ArrowRightDoubleIcon} size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
