'use client'
import { useState, useRef } from "react";
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
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface ResetPurchasingUnitDialogProps {
  token: string;
}

export function ResetPurchasingUnitDialog({ token }: ResetPurchasingUnitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-staging.enugufoodmarket.com/api/v1";

  const normalizeHeader = (value: string) =>
    value
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  const psnAliases = new Set([
    "psn",
    "verification_id",
    "verificationid",
    "employee_id",
    "employeeid",
  ]);

  const amountAliases = new Set([
    "amount",
    "repayment_amount",
    "repaymentamount",
    "monthly_amount",
    "monthlyamount",
  ]);

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

  const extractRowsFromFile = async (file: File): Promise<string[][]> => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      const fileText = await file.text();
      return fileText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map(parseCsvLine);
    }

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The spreadsheet has no sheets.");
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
        header: 1,
        raw: false,
        defval: "",
      });

      return rawRows
        .map((row) => row.map((cell) => String(cell ?? "").trim()))
        .filter((row) => row.some((cell) => cell.length > 0));
    }

    throw new Error("Unsupported file type. Please upload a CSV or XLSX file.");
  };

  const confirmBulkRepayments = async () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }

    if (!selectedMonth) {
      toast.error("Please select a month.");
      return;
    }

    setIsResetting(true);
    try {
      // Parse and normalize either CSV or XLSX rows.
      const rows = await extractRowsFromFile(selectedFile);

      if (rows.length < 2) {
        throw new Error("File must contain at least a header row and one data row.");
      }

      const headerCells = rows[0];
      const normalizedHeaders = headerCells.map((header) => normalizeHeader(header));
      const verificationIdIndex = normalizedHeaders.findIndex((header) => psnAliases.has(header));
      const amountIndex = normalizedHeaders.findIndex((header) => amountAliases.has(header));

      if (verificationIdIndex === -1 || amountIndex === -1) {
        const foundColumns = headerCells.join(", ") || "none";
        throw new Error(`File must contain 'PSN' and 'Amount' columns. Found: ${foundColumns}`);
      }

      // Extract rows with required fields
      const dataRows = rows.slice(1);
      const validRows = dataRows.filter((row) => {
        const verificationId = String(row[verificationIdIndex] ?? "").trim();
        const amount = String(row[amountIndex] ?? "").trim();
        return verificationId && amount; // Both fields required
      });

      if (validRows.length === 0) {
        throw new Error("No rows with both 'PSN' and 'Amount' fields found in file.");
      }

      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const normalizedCsv = [
        "PSN,Amount",
        ...validRows.map((row) => {
          const psn = String(row[verificationIdIndex] ?? "").trim();
          const amount = String(row[amountIndex] ?? "").trim();
          return `${escapeCsv(psn)},${escapeCsv(amount)}`;
        }),
      ].join("\n");

      const normalizedFile = new File(
        [normalizedCsv],
        selectedFile.name.replace(/\.[^.]+$/, "") + "-normalized.csv",
        { type: "text/csv" }
      );

      // Prepare FormData for upload
      const formData = new FormData();
      formData.append("file", normalizedFile);
      formData.append("month", selectedMonth);

      const response = await fetch(
        `${apiBaseUrl}/admin/repayments/confirm-bulk`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to confirm bulk repayments. Please try again."
        );
      }

   const result = await response.json();

      setIsOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(
        `Successfully processed ${result.updatedCount || result.successCount || result.processedCount || validRows.length} repayment record(s) for ${selectedMonth}.`
      );
    } catch (error) {
      console.error("Reset error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to confirm bulk repayments. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const isCsvOrExcel =
        fileName.endsWith(".csv") ||
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".xls");

      if (!isCsvOrExcel) {
        toast.error("Please select a CSV or XLSX file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex font-header bg-green-700 hover:bg-green-600 text-white items-center gap-2">
          <Upload className="h-4 w-4" />
          Confirm Repayments
        </Button>
      </DialogTrigger>
      <DialogContent className="font-header">
        <DialogHeader>
          <DialogTitle>Confirm Monthly Repayments</DialogTitle>
          <DialogDescription>
            Upload the monthly repayment CSV to confirm employee repayments for the selected month. This uses the new admin repayments endpoint and applies the repayment records that drive purchasing limit updates.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="reset-month">Select month</Label>
            <Input
              id="reset-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              max={new Date().toISOString().slice(0, 7)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-file">Upload file (CSV or XLSX)</Label>
            <Input
              id="reset-file"
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isResetting}
            />
            {selectedFile && (
              <p className="text-sm text-gray-500">
                Selected file: <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
            <p className="font-semibold mb-1">File Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Required columns: <code className="bg-white px-1 rounded">PSN</code> and <code className="bg-white px-1 rounded">Amount</code></li>
              <li>The <code className="bg-white px-1 rounded">PSN</code> value must match the employee verification ID</li>
              <li>Only rows with both PSN and Amount will be processed</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmBulkRepayments}
            disabled={isResetting || !selectedMonth || !selectedFile}
            className="flex items-center bg-green-700 hover:bg-green-600 gap-2"
          >
            {isResetting ? "Processing..." : "Confirm Repayments"}
            {isResetting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
