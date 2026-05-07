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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
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
    accessorFn: (row) =>
      `${row.user?.firstname ?? ""} ${row.user?.lastname ?? ""}`,

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
        <Badge
          className={
            status === "DELIVERED"
              ? "bg-green-700"
              : status === "CANCELLED"
              ? ""
              : "bg-yellow-600"
          }
          variant={
            status === "DELIVERED"
              ? "secondary"
              : status === "CANCELLED"
              ? "destructive"
              : "default"
          }
        >
          {status}
        </Badge>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => (
      <Button asChild size="sm" variant="ghost">
        <Link href={`/admin-dashboard/orders/${row.original.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">View</span>
        </Link>
      </Button>
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

  return (
    <div>
      {/* Filter Component */}
      <OrdersFilter
        orders={uniqueOrders}
        onFilterChange={setFilteredOrders}
        onSelectionChange={setSelectedPeriod}
      />

      {isApril2026Selected && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="text-sm font-semibold">April 2026 reconciliation notice</p>
          <p className="mt-1 text-sm">
            Some April 2026 orders were placed manually outside the platform. They are not present in the
            system order list and should be reconciled separately.
          </p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span>
              Manual records: {APRIL_2026_MANUAL_ORDERS.length} | Total: {formatCurrency(APRIL_2026_MANUAL_TOTAL)}
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">View manual April orders</Button>
              </DialogTrigger>
              <DialogContent className="w-[96vw] max-w-[1500px] max-h-[88vh]">
                <DialogHeader>
                  <DialogTitle>Manual April 2026 Orders</DialogTitle>
                  <DialogDescription>
                    These records were supplied as manual entries due to the April incident and are shown for
                    reconciliation.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[72vh] overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S/N</TableHead>
                        <TableHead>Verification ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Government Entity</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Narration</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {APRIL_2026_MANUAL_ORDERS.map((manualOrder) => (
                        <TableRow key={manualOrder.sn}>
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

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                No orders found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 mt-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {filteredOrders.length} orders
          {filteredOrders.length !== uniqueOrders.length && (
            <span className="text-blue-600 ml-1">
              (filtered from {uniqueOrders.length} total)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          {/* Rows per page */}
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>

            <select
              aria-label="Rows per page"
              className="h-8 w-[70px] rounded-md border border-input bg-background"
              value={table.getState().pagination.pageSize}
              onChange={(e) =>
                table.setPageSize(Number(e.target.value))
              }
            >
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          {/* Page info */}
          <div className="flex w-[120px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() =>
                table.setPageIndex(table.getPageCount() - 1)
              }
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
