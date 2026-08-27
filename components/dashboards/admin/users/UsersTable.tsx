"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  Download01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserWithRelations } from "@/types/index";
import { useState, useMemo } from "react";
import { AddUnitDialog } from "./AddUnitDialog";

const columns: ColumnDef<UserWithRelations>[] = [
  // {
  //   accessorKey: "employee_id",
  //   header: "Employee ID",
  //   cell: ({ row }) => <div className="font-medium">{row.getValue("employee_id") || "N/A"}</div>,
  // },
  {
    accessorKey: "verification_id",
    header: "PSN",
    cell: ({ row }) => <div className="font-medium">{row.getValue("verification_id") || "N/A"}</div>,
  },
  {
    accessorFn: (row) => `${row.firstname || ''} ${row.lastname || ''}`.trim(),
    header: "Name",
    cell: ({ row }) => {
      const name = `${row.original.firstname || ''} ${row.original.lastname || ''}`.trim();
      return <div className="font-medium">{name || "N/A"}</div>;
    },
  },
  // {
  //   accessorKey: "email",
  //   header: "Email",
  //   cell: ({ row }) => <div className="text-brand-700 hover:underline">{row.getValue("email") || "N/A"}</div>,
  // },
  // {
  //   accessorKey: "phone",
  //   header: "Phone",
  //   cell: ({ row }) => <div className="font-mono">{row.getValue("phone") || "N/A"}</div>,
  // },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.original.phone;
      return <div className="font-mono">{phone || "N/A"}</div>;
    },
    filterFn: (row, columnId, filterValue) => {
      // Custom filter function that specifically handles phone numbers
      const phone = row.original.phone;
      if (!phone) return false;
      if (!filterValue) return true;
      
      const phoneStr = String(phone).toLowerCase();
      const searchStr = String(filterValue).toLowerCase();
      return phoneStr.includes(searchStr);
    },
  },
  {
    accessorKey: "government_entity",
    header: "Government Entity",
    cell: ({ row }) => <div className="capitalize">{row.getValue("government_entity") || "N/A"}</div>,
  },
  {
    accessorKey: "salary_per_month",
    header: "Salary (₦)",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("salary_per_month") || "0");
      return (
        <div className="font-medium text-brand-700">
          {new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
          }).format(amount)}
        </div>
      );
    },
  },
  {
    id: "total_purchasing_unit",
    header: "Total Purchasing Unit (₦)",
    cell: ({ row }) => {
      const salary = Number(row.original.salary_per_month || 0);
      const totalPurchasingUnit = salary * 0.3;
      return (
        <div className="font-medium text-slate-900">
          {new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
          }).format(totalPurchasingUnit)}
        </div>
      );
    },
  },
  {
    accessorKey: "loan_unit",
    header: "Purchasing Unit Remaining (₦)",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("loan_unit") || "0");
      return (
        <div className="font-medium">
          {new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
          }).format(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "loan_amount_collected",
    header: "Total Borrowed This Month (₦)",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("loan_amount_collected") || "0");
      return (
        <div className="font-medium text-red-700">
          {new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
          }).format(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "loan_extension",
    header: "Extension Used (₦)",
    cell: ({ row }) => {
      const amount = Number(row.original.loan_extension || 0);
      const isUsingExtension = amount > 0;

      return (
        <div>
          <div className={`font-medium ${isUsingExtension ? "text-amber-700" : "text-gray-700"}`}>
            {new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN'
            }).format(amount)}
          </div>
          {isUsingExtension && (
            <p className="text-[11px] text-amber-700">Deducts from next month</p>
          )}
        </div>
      );
    },
  },
  {
    id: "extension_buffer_remaining",
    header: "Extension Buffer Remaining (₦)",
    cell: ({ row }) => {
      const maxExtension = Number(row.original.max_extension_limit || 0);
      const extensionUsed = Number(row.original.loan_extension || 0);
      const extensionRemaining = Math.max(0, maxExtension - extensionUsed);

      return (
        <div className="font-medium text-yellow-700">
          {new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
          }).format(extensionRemaining)}
        </div>
      );
    },
  },
  {
    id: "available_credit",
    header: "Available Credit (₦)",
    cell: ({ row }) => {
      const loanUnit = Number(row.original.loan_unit || 0);
      const maxExtension = Number(row.original.max_extension_limit || 0);
      const extensionUsed = Number(row.original.loan_extension || 0);

      const availableCredit = Math.max(0, loanUnit + (maxExtension - extensionUsed));
      const extensionProgress = maxExtension > 0 ? (extensionUsed / maxExtension) * 100 : 0;

      return (
        <div className="space-y-1 min-w-[180px]">
          <div className="font-semibold text-blue-700">
            {new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN'
            }).format(availableCredit)}
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full"
              style={{ width: `${Math.min(100, extensionProgress)}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          <Link href={`/admin-dashboard/users/${user.id}`} legacyBehavior passHref>
            <Button variant="outline" size="sm" className="hover:bg-blue-50 text-[12px] hover:text-brand-700">
              View Details
            </Button>
          </Link>
          {/* <AddUnitDialog user={user} /> */}
        </div>
      );
    },
  },
];

interface AdminUsersTableProps {
  initialUsers: UserWithRelations[];
  token: string;
}

interface ExportData {
  "Employee ID": string;
  "Verification ID": string;
  "Name": string;
  "Email": string;
  "Phone": string;
  "Government Entity": string;
  "Salary (₦)": string;
  "Total Purchasing Unit (₦)": string;
  "Purchasing Unit Remaining (₦)": string;
  "Total Borrowed This Month (₦)": string;
  "Extension Used (₦)": string;
  "Extension Limit (₦)": string;
  "Available Credit (₦)": string;
  "Status": string;
}

export function AdminUsersTable({ initialUsers, token }: AdminUsersTableProps) {
  const router = useRouter();
  const [selectedEntity, setSelectedEntity] = useState<string>("all");

  const { data: users = initialUsers, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users", token],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            timeout: 10000
          }
        );
        return response.data?.data || response.data;
      } catch (error: any) {
        console.error("API Error:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          router.push("/auth/signin");
        }
        throw error;
      }
    },
    initialData: initialUsers,
    enabled: !!token,
    retry: false
  });

  // Get unique government entities for the filter
  const governmentEntities = useMemo(() => {
    const entities = Array.from(new Set(
      users.map((user: UserWithRelations) => user.government_entity).filter(Boolean) as string[]
    ));
    return entities.sort();
  }, [users]);

  // Filter users by selected government entity
  const filteredUsers = useMemo(() => {
    if (selectedEntity === "all") {
      return users;
    }
    return users.filter((user: UserWithRelations) => user.government_entity === selectedEntity);
  }, [users, selectedEntity]);

  // Function to export users to CSV
  const exportToCSV = (usersToExport: UserWithRelations[], filename: string) => {
    const headers: (keyof ExportData)[] = [
      "Employee ID",
      "Verification ID", 
      "Name",
      "Email",
      "Phone",
      "Government Entity",
      "Salary (₦)",
      "Total Purchasing Unit (₦)",
      "Purchasing Unit Remaining (₦)",
      "Total Borrowed This Month (₦)",
      "Extension Used (₦)",
      "Extension Limit (₦)",
      "Available Credit (₦)",
      "Status"
    ];

    const csvData = usersToExport.map((user: UserWithRelations) => ({
      "Employee ID": user.employee_id || "N/A",
      "Verification ID": user.verification_id || "N/A",
      "Name": `${user.firstname || ''} ${user.lastname || ''}`.trim() || "N/A",
      "Email": user.email || "N/A",
      "Phone": user.phone || "N/A",
      "Government Entity": user.government_entity || "N/A",
      "Salary (₦)": new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(parseFloat(user.salary_per_month?.toString() || "0")),
      "Total Purchasing Unit (₦)": new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format((parseFloat(user.salary_per_month?.toString() || "0")) * 0.3),
      "Purchasing Unit Remaining (₦)": new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(parseFloat(user.loan_unit?.toString() || "0")),
      "Total Borrowed This Month (₦)": new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(parseFloat(user.loan_amount_collected?.toString() || "0")),
      "Extension Used (₦)": new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(parseFloat(user.loan_extension?.toString() || "0")),
      "Extension Limit (₦)": new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(parseFloat(user.max_extension_limit?.toString() || "0")),
      "Available Credit (₦)": new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(
        Math.max(
          0,
          parseFloat(user.loan_unit?.toString() || "0") +
          (parseFloat(user.max_extension_limit?.toString() || "0") -
            parseFloat(user.loan_extension?.toString() || "0"))
        )
      ),
      "Status": user.status || "PENDING"
    }));

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(",")
      )
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${usersToExport.length} users to ${filename}.csv`);
  };

  // Export current filtered users
  const exportCurrentUsers = () => {
    if (filteredUsers.length === 0) {
      toast.error("No users to export");
      return;
    }

    const filename = selectedEntity === "all" 
      ? `all_users_${new Date().toISOString().split('T')[0]}`
      : `${selectedEntity.replace(/[^a-zA-Z0-9]/g, '_')}_users_${new Date().toISOString().split('T')[0]}`;
    
    exportToCSV(filteredUsers, filename);
  };

  // Export all users by entity
  const exportAllByEntity = () => {
    governmentEntities.forEach(entity => {
      const entityUsers = users.filter((user: UserWithRelations) => user.government_entity === entity);
      if (entityUsers.length > 0) {
        const filename = `${entity.replace(/[^a-zA-Z0-9]/g, '_')}_users_${new Date().toISOString().split('T')[0]}`;
        exportToCSV(entityUsers, filename);
      }
    });
    
    // Small delay between downloads to avoid browser restrictions
    setTimeout(() => {
      toast.success(`Exported users for ${governmentEntities.length} government entities`);
    }, 1000);
  };

  const table = useReactTable({
    data: filteredUsers,
    columns,
    meta: {
      token,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  if (isLoading && !users.length) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse border border-slate-200 bg-slate-50" />
        <div className="h-64 w-full animate-pulse border border-slate-200 bg-slate-50" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-red-900">Could not load users</p>
        <p className="mt-1 text-[13px] text-red-700">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          onClick={() => router.refresh()}
          className="mt-3 h-9 rounded-sm border border-red-300 bg-white px-4 text-[13px] font-medium text-red-700 hover:bg-red-50"
        >
          Try again
        </button>
      </div>
    );
  }

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const firstRow = filteredUsers.length === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, filteredUsers.length);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border border-slate-200 bg-white p-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} />
          </span>
          <input
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder="Search name, PSN, phone..."
            className="h-9 w-full rounded-sm border border-slate-300 pl-9 pr-3 text-[13px] outline-none focus:border-brand-600"
          />
        </div>

        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="h-9 max-w-[260px] rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
        >
          <option value="all">All government entities</option>
          {governmentEntities.map((entity: string) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCurrentUsers}
            disabled={filteredUsers.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-sm border border-slate-300 px-3 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700 disabled:text-slate-300"
          >
            <HugeiconsIcon icon={Download01Icon} size={15} strokeWidth={1.8} />
            Export view
          </button>

          <button
            onClick={exportAllByEntity}
            disabled={users.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-sm border border-slate-300 px-3 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700 disabled:text-slate-300"
          >
            <HugeiconsIcon icon={Download01Icon} size={15} strokeWidth={1.8} />
            Export by entity
          </button>

          <select
            value={`${pageSize}`}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            title="Rows per page"
            className="h-9 rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
          >
            {[5, 10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-[13px] text-slate-600">
        <span className="font-medium text-slate-900">{filteredUsers.length}</span> of {users.length}{" "}
        users
        {selectedEntity !== "all" && ` in ${selectedEntity}`}
      </p>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <Table className="min-w-[1200px]">
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-200 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
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
                  No users match these filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-slate-500">
          Showing {firstRow} to {lastRow} of {filteredUsers.length}
        </p>

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
  );
}
