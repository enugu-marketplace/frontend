"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import axios from "axios";
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  //   cell: ({ row }) => <div className="text-blue-600 hover:underline">{row.getValue("email") || "N/A"}</div>,
  // },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <div className="font-mono">{row.getValue("phone") || "N/A"}</div>,
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
        <div className="font-medium text-green-700">
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
        <div className="font-medium text-blue-700">
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
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          <Link href={`/admin-dashboard/users/${user.id}`} legacyBehavior passHref>
            <Button variant="outline" size="sm" className="hover:bg-blue-50 text-[12px] hover:text-blue-600">
              View Details
            </Button>
          </Link>
          <AddUnitDialog user={user} />
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="text-red-600 font-medium">Error loading users</div>
        <div className="text-red-500 text-sm mt-1">
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
        <Button
          variant="outline"
          className="mt-4 hover:bg-red-50 hover:text-red-600"
          onClick={() => router.refresh()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters and Export Buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <Input
            placeholder="Filter by any field..."
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => {
              table.setGlobalFilter(event.target.value); 
            }}
            className="max-w-sm"
          />
          
          {/* Government Entity Filter */}
          <Select
            value={selectedEntity}
            onValueChange={setSelectedEntity}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by Government Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Government Entities</SelectItem>
              {governmentEntities.map((entity: string) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Current Users */}
          <Button
            onClick={exportCurrentUsers}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={filteredUsers.length === 0}
          >
            <Download className="w-4 h-4" />
            Export Current
          </Button>

          {/* Export All by Entity */}
          <Button
            onClick={exportAllByEntity}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={users.length === 0}
          >
            <Download className="w-4 h-4" />
            Export All by Entity
          </Button>

          {/* Rows per page selector */}
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-600">Rows:</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Entity Summary and Quick Export */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-800">
            Showing {filteredUsers.length} of {users.length} users
            {selectedEntity !== "all" && ` from ${selectedEntity}`}
          </p>
          
          {selectedEntity !== "all" && filteredUsers.length > 0 && (
            <Button
              onClick={() => exportToCSV(
                filteredUsers, 
                `${selectedEntity.replace(/[^a-zA-Z0-9]/g, '_')}_users_${new Date().toISOString().split('T')[0]}`
              )}
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export {selectedEntity}
            </Button>
          )}
        </div>
      </div>

      {/* Government Entities Quick Export Panel */}
      {/* <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Export by Government Entity:</h3>
        <div className="flex flex-wrap gap-2">
          {governmentEntities.map((entity: string) => {
            const entityUsers = users.filter((user: UserWithRelations) => user.government_entity === entity);
            return (
              <Button
                key={entity}
                onClick={() => exportToCSV(
                  entityUsers,
                  `${entity.replace(/[^a-zA-Z0-9]/g, '_')}_users_${new Date().toISOString().split('T')[0]}`
                )}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs"
                disabled={entityUsers.length === 0}
              >
                <Download className="w-3 h-3" />
                {entity} ({entityUsers.length})
              </Button>
            );
          })}
        </div>
      </div> */}

      {/* Users Table */}
      <div className="rounded-md border shadow-sm">
        <Table className="min-w-[1200px]">
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="text-[14px]">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-gray-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50 text-[13px]">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-gray-600">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            filteredUsers.length
          )}{" "}
          of {filteredUsers.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}