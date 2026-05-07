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

const CYCLE_START_YEAR = 2026;
const CYCLE_START_MONTH = 4; // April (1-12)
const CYCLE_START_DAY = 21;

const getOrderCycleMonthKey = (placedAt: string): string | null => {
  if (typeof placedAt !== "string" || !placedAt.trim()) {
    return null;
  }

  const fullDateMatch = placedAt.match(/^(\d{4})-(\d{2})-(\d{2})/);

  let year: number;
  let monthIndex: number;
  let day: number;

  if (fullDateMatch) {
    year = Number(fullDateMatch[1]);
    monthIndex = Number(fullDateMatch[2]) - 1;
    day = Number(fullDateMatch[3]);
  } else {
    const parsed = new Date(placedAt);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    year = parsed.getUTCFullYear();
    monthIndex = parsed.getUTCMonth();
    day = parsed.getUTCDate();
  }

  const shouldApplyCycle =
    year > CYCLE_START_YEAR ||
    (year === CYCLE_START_YEAR && monthIndex + 1 > CYCLE_START_MONTH) ||
    (year === CYCLE_START_YEAR && monthIndex + 1 === CYCLE_START_MONTH && day >= CYCLE_START_DAY);

  // Apply payroll cycle only from April->May boundary onward.
  if (shouldApplyCycle && day >= 21) {
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }

  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
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
        throw new Error(`Export-loans API returned ${csvResponse.status} ${csvResponse.statusText}`);
      }

      if (!ordersResponse.ok) {
        throw new Error(`All-orders API returned ${ordersResponse.status} ${ordersResponse.statusText}`);
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

      const monthlyOrders = Array.from(
        new Map(
          allOrders
            .filter((order) => {
              const cycleMonthKey = getOrderCycleMonthKey(order?.placedAt ?? "");
              return cycleMonthKey === selectedMonth;
            })
            .map((order) => [String(order.id ?? ""), order])
        ).values()
      ).filter((order) => String(order.id ?? "").trim().length > 0);

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
      const startDateIndex = headerCells.findIndex((header) => header.toLowerCase().replace(/[\s_]/g, "") === "startdate");
      const endDateIndex = headerCells.findIndex((header) => header.toLowerCase().replace(/[\s_]/g, "") === "enddate");

      if (psnIndex === -1 || amountIndex === -1) {
        throw new Error(`Required columns not found. Headers found: ${headerCells.join(" | ")}`);
      }

      const templateRow = parseCsvLine(lines[1]);

      // Build one output row per monthly order, filling PSN and Amount.
      // StartDate and EndDate are left blank.
      const outputRows: string[][] = monthlyOrders.map((order) => {
        const userId = String(order.userId ?? order.user?.id ?? "").trim();
        const psn =
          (userId ? userVerificationMap.get(userId) : undefined) ??
          String(order.user?.verification_id ?? order.user?.employee_id ?? "").trim();
        const amount = String(Math.round(Number(order.totalAmount ?? 0)));

        const row = [...templateRow];
        row[psnIndex] = psn;
        row[amountIndex] = amount;
        if (startDateIndex !== -1) row[startDateIndex] = "";
        if (endDateIndex !== -1) row[endDateIndex] = "";
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
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Export failed: ${message}`);
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