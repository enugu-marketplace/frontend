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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const normalizeHeader = (value: string) =>
    value
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  const verificationIdAliases = new Set([
    "psn",
    "verification_id",
    "verificationid",
  ]);

  const amountAliases = new Set([
    "amount",
    "repayment_amount",
    "repaymentamount",
    "monthly_amount",
    "monthlyamount",
  ]);

  const nameAliases = new Set(["name"]);
  const phoneAliases = new Set(["phone", "phone_number", "phonenumber"]);
  const governmentEntityAliases = new Set(["government_entity", "governmententity", "entity"]);
  const employeeIdAliases = new Set(["employee_id", "employeeid", "employee", "staff_id", "staffid"]);
  const narrationAliases = new Set(["narration", "note", "notes", "remark", "remarks"]);

  const isCsvFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    const mimeType = (file.type || "").toLowerCase();
    return (
      fileName.endsWith(".csv") ||
      mimeType === "text/csv" ||
      mimeType === "application/csv"
    );
  };

  const isExcelFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    const mimeType = (file.type || "").toLowerCase();
    return (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    );
  };

  const isOdsFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    const mimeType = (file.type || "").toLowerCase();
    return (
      fileName.endsWith(".ods") ||
      mimeType === "application/vnd.oasis.opendocument.spreadsheet"
    );
  };

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

  const normalizeAmountForApi = (value: string) => {
    const cleaned = String(value ?? "")
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .replace(/[₦$£€]/g, "")
      .trim();

    if (!cleaned) {
      return null;
    }

    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed.toString();
  };

  const extractRowsFromFile = async (file: File): Promise<string[][]> => {
    const parseSpreadsheetRows = async () => {
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
    };

    if (isCsvFile(file) && !file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
      const fileText = await file.text();

      // Auto-detect binary spreadsheet files renamed as CSV and parse them safely.
      if (fileText.startsWith("PK") || fileText.includes("mimetypeapplication/vnd.oasis.opendocument.spreadsheet")) {
        return parseSpreadsheetRows();
      }

      return fileText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map(parseCsvLine);
    }

    if (isExcelFile(file) || isOdsFile(file)) {
      return parseSpreadsheetRows();
    }

    throw new Error("Unsupported file type. Please upload a CSV, XLSX, XLS, or ODS file.");
  };

  const readErrorMessage = async (response: Response) => {
    const fallback = `Request failed with status ${response.status}`;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => ({}));
      return data?.message || data?.error || fallback;
    }

    const text = await response.text().catch(() => "");
    return text || fallback;
  };

  const submitBulkRepayments = async (normalizedCsv: string, month: string, originalName: string) => {
    const normalizedFile = new File(
      [normalizedCsv],
      originalName.replace(/\.[^.]+$/, "") + "-normalized.csv",
      { type: "text/csv" }
    );

    const attempts: Array<{ label: string; run: () => Promise<Response> }> = [
      {
        label: "multipart:file",
        run: async () => {
          const formData = new FormData();
          formData.append("file", normalizedFile);
          formData.append("month", month);

          return fetch(`${apiBaseUrl}/admin/repayments/confirm-bulk?month=${encodeURIComponent(month)}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
            body: formData,
          });
        },
      },
      {
        label: "multipart:csv",
        run: async () => {
          const formData = new FormData();
          formData.append("csv", normalizedFile);
          formData.append("month", month);

          return fetch(`${apiBaseUrl}/admin/repayments/confirm-bulk?month=${encodeURIComponent(month)}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
            body: formData,
          });
        },
      },
      {
        label: "raw:text-csv",
        run: async () => {
          return fetch(`${apiBaseUrl}/admin/repayments/confirm-bulk?month=${encodeURIComponent(month)}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "text/csv",
              "Accept": "application/json",
            },
            body: normalizedCsv,
          });
        },
      },
    ];

    const errors: string[] = [];

    for (const attempt of attempts) {
      const response = await attempt.run();
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        return { result, attemptLabel: attempt.label };
      }

      const message = await readErrorMessage(response);
      errors.push(`${attempt.label}: ${message}`);
    }

    throw new Error(`Bulk repayment failed. ${errors.join(" | ")}`);
  };


  const downloadTemplate = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/admin/export-loans`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to download template. Please try again."
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `repayment-template-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Template downloaded successfully.");
    } catch (error) {
      console.error("Download error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to download template. Please try again.";
      toast.error(errorMessage);
    }
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
      const verificationIdIndex = normalizedHeaders.findIndex((header) => verificationIdAliases.has(header));
      const amountIndex = normalizedHeaders.findIndex((header) => amountAliases.has(header));
      const nameIndex = normalizedHeaders.findIndex((header) => nameAliases.has(header));
      const phoneIndex = normalizedHeaders.findIndex((header) => phoneAliases.has(header));
      const governmentEntityIndex = normalizedHeaders.findIndex((header) => governmentEntityAliases.has(header));
      const employeeIdIndex = normalizedHeaders.findIndex((header) => employeeIdAliases.has(header));
      const narrationIndex = normalizedHeaders.findIndex((header) => narrationAliases.has(header));

      if (verificationIdIndex === -1 || amountIndex === -1) {
        const foundColumns = headerCells.join(", ") || "none";
        throw new Error(`File must contain 'verification_id' and 'amount' columns. Found: ${foundColumns}`);
      }

      // Extract rows with required fields and a numeric amount the API can parse.
      const dataRows = rows.slice(1);
      const invalidAmountRows: number[] = [];
      const validRows = dataRows
        .map((row, index) => {
          const verificationId = String(row[verificationIdIndex] ?? "").trim();
          const normalizedAmount = normalizeAmountForApi(String(row[amountIndex] ?? "").trim());

          if (!verificationId || !normalizedAmount) {
            if (verificationId && !normalizedAmount) {
              invalidAmountRows.push(index + 2);
            }
            return null;
          }

          return {
            row,
            verificationId,
            normalizedAmount,
          };
        })
        .filter((entry): entry is { row: string[]; verificationId: string; normalizedAmount: string } => Boolean(entry));

      if (validRows.length === 0) {
        throw new Error("No rows with both 'verification_id' and 'amount' fields found in file.");
      }

      if (invalidAmountRows.length > 0) {
        const previewRows = invalidAmountRows.slice(0, 10).join(", ");
        const extraCount = invalidAmountRows.length > 10 ? ` (+${invalidAmountRows.length - 10} more)` : "";
        throw new Error(`Invalid amount format in row(s): ${previewRows}${extraCount}. Remove symbols and ensure amount is a positive number.`);
      }

      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const csvHeaders = ["verification_id", "amount"];
      if (nameIndex !== -1) csvHeaders.push("name");
      if (phoneIndex !== -1) csvHeaders.push("phone");
      if (governmentEntityIndex !== -1) csvHeaders.push("government_entity");
      if (employeeIdIndex !== -1) csvHeaders.push("employee_id");
      if (narrationIndex !== -1) csvHeaders.push("narration");

      const normalizedCsv = [
        csvHeaders.join(","),
        ...validRows.map((entry) => {
          const values = [
            entry.verificationId,
            entry.normalizedAmount,
          ];
          if (nameIndex !== -1) values.push(String(entry.row[nameIndex] ?? "").trim());
          if (phoneIndex !== -1) values.push(String(entry.row[phoneIndex] ?? "").trim());
          if (governmentEntityIndex !== -1) values.push(String(entry.row[governmentEntityIndex] ?? "").trim());
          if (employeeIdIndex !== -1) values.push(String(entry.row[employeeIdIndex] ?? "").trim());
          if (narrationIndex !== -1) values.push(String(entry.row[narrationIndex] ?? "").trim());
          return values.map(escapeCsv).join(",");
        }),
      ].join("\n");

      const { result, attemptLabel } = await submitBulkRepayments(
        normalizedCsv,
        selectedMonth,
        selectedFile.name
      );

      setIsOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(
        `Successfully processed ${result.updatedCount || result.successCount || result.processedCount || validRows.length} repayment record(s) for ${selectedMonth} (${attemptLabel}).`
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
      const isCsvOrExcel = isCsvFile(file) || isExcelFile(file) || isOdsFile(file);

      if (!isCsvOrExcel) {
        toast.error("Please select a CSV, XLSX, XLS, or ODS file.");
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
        <ScrollArea className="h-[400px] pr-4">
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
              <Label htmlFor="reset-file">Upload file (CSV, XLSX, XLS, or ODS)</Label>
              <Input
                id="reset-file"
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.ods"
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
                <li><span className="font-medium">Required columns:</span> <code className="bg-white px-1 rounded">verification_id</code> and <code className="bg-white px-1 rounded">amount</code></li>
                <li><span className="font-medium">Optional columns:</span> <code className="bg-white px-1 rounded">name</code>, <code className="bg-white px-1 rounded">phone</code>, <code className="bg-white px-1 rounded">government_entity</code>, <code className="bg-white px-1 rounded">employee_id</code>, <code className="bg-white px-1 rounded">narration</code></li>
                <li>The <code className="bg-white px-1 rounded">verification_id</code> must match the employee verification ID</li>
                <li>The <code className="bg-white px-1 rounded">narration</code> field maps to the note field on the repayment record</li>
                <li>Only rows with both verification_id and amount will be processed</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Download Template
          </Button>
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
