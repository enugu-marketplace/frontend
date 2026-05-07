'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportLoansDialogProps {
  token: string;
}

type AdminOrder = {
  id?: string;
  userId?: string;
  placedAt: string;
  totalAmount: number;
  user?: {
    id?: string;
    verification_id?: string;
    employee_id?: string;
  };
};

export function ExportExternalOrdersDialog({ token }: ExportLoansDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const parseCsvLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    cells.push(current.trim());
    return cells;
  };

  const escapeCsvValue = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const exportLoans = async () => {
    setIsExporting(true);
    try {
      const [csvResponse, ordersResponse, usersResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/export-loans`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/all-order`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!csvResponse.ok) {
        throw new Error("Failed to fetch export file");
      }

      if (!ordersResponse.ok) {
        throw new Error("Failed to fetch orders for month filter");
      }

      const csvText = await csvResponse.text();
      const ordersPayload = await ordersResponse.json();
      const allOrders: AdminOrder[] = ordersPayload?.data ?? [];

      // Build userId → verification_id lookup from the users list so we can
      // populate PSN even when the orders response omits verification_id.
      const userVerificationMap = new Map<string, string>();
      if (usersResponse.ok) {
        try {
          const usersPayload = await usersResponse.json();
          const usersList: Array<{ id?: string; verification_id?: string; employee_id?: string }> =
            usersPayload?.data ?? usersPayload ?? [];
          for (const u of usersList) {
            const uid = String(u.id ?? "").trim();
            const vid = String(u.verification_id ?? u.employee_id ?? "").trim();
            if (uid && vid) {
              userVerificationMap.set(uid, vid);
            }
          }
        } catch {
          // Non-fatal: proceed without the lookup
        }
      }

      const monthlyOrders = allOrders.filter((order) => {
        const placedAt = order?.placedAt ?? "";
        return placedAt.slice(0, 7) === selectedMonth;
      });

      if (monthlyOrders.length === 0) {
        toast.info(`No orders found for ${selectedMonth}.`);
        return;
      }

      const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error("Export returned no data");
      }

      const headerCells = parseCsvLine(lines[0]);
      const psnIndex = headerCells.findIndex((header) => header.toLowerCase() === "psn");
      const amountIndex = headerCells.findIndex((header) => header.toLowerCase() === "amount");

      if (psnIndex === -1 || amountIndex === -1) {
        throw new Error("Required columns not found in export");
      }

      // Use the first data row as a template for fixed fields
      // (DeductionName, ValueType, DurationType, StartDate, EndDate).
      const templateRow = parseCsvLine(lines[1]);

      // Build one output row per monthly order, filling PSN from the users lookup
      // and amount from the order. All other columns come from the template row.
      const outputRows: string[][] = monthlyOrders.map((order) => {
        const userId = String(order.userId ?? order.user?.id ?? "").trim();
        const psn =
          (userId ? userVerificationMap.get(userId) : undefined) ??
          String(order.user?.verification_id ?? order.user?.employee_id ?? "").trim();
        const amount = String(Math.round(Number(order.totalAmount ?? 0)));

        const row = [...templateRow];
        row[psnIndex] = psn;
        row[amountIndex] = amount;
        return row;
      });

      if (outputRows.length === 0) {
        toast.info(`No orders found for ${selectedMonth}.`);
        return;
      }

      const csvRows = [headerCells, ...outputRows].map((row) =>
        row.map(escapeCsvValue).join(",")
      );
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Create a filename with selected month
      a.download = `orders_export_${selectedMonth}.csv`;

      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsOpen(false);
      toast.success(`Exported ${outputRows.length} order(s) for ${selectedMonth}.`);

    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export orders for the selected month. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex font-header bg-green-700 hover:bg-green-600 text-white items-center gap-2">
          <Download className="h-4 w-4" />
          Export Orders
        </Button>
      </DialogTrigger>
      <DialogContent className="font-header">
        <DialogHeader>
          <DialogTitle>Export Orders</DialogTitle>
          <DialogDescription>
            Export only orders for a particular month as a CSV file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          <Label htmlFor="export-month">Select month</Label>
          <Input
            id="export-month"
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            max={new Date().toISOString().slice(0, 7)}
          />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={exportLoans}
            disabled={isExporting || !selectedMonth}
            className="flex items-center gap-2"
          >
            {isExporting ? "Exporting..." : "Export CSV"}
            {isExporting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}