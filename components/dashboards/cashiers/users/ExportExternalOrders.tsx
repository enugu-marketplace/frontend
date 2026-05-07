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
import { Download } from "lucide-react";

interface ExportLoansDialogProps {
  token: string;
}

export function ExportExternalOrdersDialog({ token }: ExportLoansDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

      if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    cells.push(current.trim());
    return cells;
  };

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const ensurePsnColumn = (csvText: string) => {
    const lines = csvText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      return csvText;
    }

    const header = parseCsvLine(lines[0]);
    const normalized = header.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

    const psnIndex = normalized.findIndex((h) => h === "psn");
    const verificationIndex = normalized.findIndex((h) => h === "verification_id" || h === "verificationid");
    const employeeIndex = normalized.findIndex((h) => h === "employee_id" || h === "employeeid");
    const sourceIndex = verificationIndex !== -1 ? verificationIndex : employeeIndex;

    if (psnIndex !== -1) {
      // PSN column exists — fill any empty values from source.
      const rebuilt = [
        header.map((cell) => escapeCsv(cell)).join(","),
        ...lines.slice(1).map((line) => {
          const row = parseCsvLine(line);
          const existing = String(row[psnIndex] ?? "").trim();
          const fallback = sourceIndex !== -1 ? String(row[sourceIndex] ?? "").trim() : "";
          row[psnIndex] = existing || fallback;
          return row.map((cell) => escapeCsv(cell)).join(",");
        }),
      ];
      return rebuilt.join("\n");
    }

    if (sourceIndex === -1) {
      return csvText;
    }

    const rebuilt = [
      [...header, "PSN"].map((cell) => escapeCsv(cell)).join(","),
      ...lines.slice(1).map((line) => {
        const row = parseCsvLine(line);
        const psnValue = String(row[sourceIndex] ?? "").trim();
        return [...row, psnValue].map((cell) => escapeCsv(cell)).join(",");
      }),
    ];

    return rebuilt.join("\n");
  };

  const exportLoans = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/export-loans`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export loans");
      }

      // Normalize export so PSN is always present when source columns exist.
      const rawText = await response.text();
      const normalizedCsv = ensurePsnColumn(rawText);
      const blob = new Blob([normalizedCsv], { type: "text/csv;charset=utf-8;" });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      
      // Create a filename with current date
      const date = new Date().toISOString().split('T')[0];
      a.download = `loans_export_${date}.csv`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setIsOpen(false);
      
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export loans. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex font-header bg-orange-700 hover:bg-orange-600 text-white items-center gap-2">
          <Download className="h-4 w-4" />
          Export Internal Orders
        </Button>
      </DialogTrigger>
      <DialogContent className="font-header">
        <DialogHeader>
          <DialogTitle>Export Loans Data</DialogTitle>
          <DialogDescription>
            This will export all users who have taken loans as a CSV file.
            The file will include: First Name, Last Name, Email, Phone, Level,
            Employee ID, Government Entity, Salary Per Month, Loan Unit, and Loan Amount Collected.
          </DialogDescription>
        </DialogHeader>
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
            disabled={isExporting}
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