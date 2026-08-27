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
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

interface ResetPurchasingUnitDialogProps {
  token: string;
}

export function ResetPurchasingUnitDialog({ token }: ResetPurchasingUnitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [pendingSubmission, setPendingSubmission] = useState<{
    normalizedCsv: string;
    month: string;
    originalName: string;
    validCount: number;
  } | null>(null);
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
  const CYCLE_START_YEAR = 2026;
  const CYCLE_START_MONTH = 4;
  const CYCLE_START_DAY = 21;

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

  const normalizeVerificationId = (value: string) =>
    String(value ?? "")
      .replace(/\s+/g, "")
      .trim();

  const normalizePersonName = (value: string) =>
    String(value ?? "")
      .replace(/\([^)]*\)/g, " ")
      .toLowerCase()
      .replace(/[-_/]+/g, " ")
      .replace(/[.,']/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const stopwordTokens = new Set(["mr", "mrs", "miss", "dr", "nee"]);

  const toNameTokens = (value: string) =>
    normalizePersonName(value)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !stopwordTokens.has(token));

  // Canonical key lets "Ugwu Somto" match "Somto Ugwu".
  const toNameMatchKey = (value: string) => {
    const tokens = toNameTokens(value);
    if (tokens.length === 0) {
      return "";
    }

    return tokens
      .sort((a, b) => a.localeCompare(b))
      .join(" ");
  };

  const extractDisplayNameFromOrder = (order: any) => {
    const fullName = `${order?.user?.firstname ?? ""} ${order?.user?.lastname ?? ""}`.trim();
    return fullName || String(order?.user?.name ?? "").trim();
  };

  const getOrderMonthKey = (placedAt: string) => {
    const date = new Date(placedAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    let year = date.getUTCFullYear();
    let monthIndex = date.getUTCMonth();
    const day = date.getUTCDate();

    const shouldApplyCycle =
      year > CYCLE_START_YEAR ||
      (year === CYCLE_START_YEAR && monthIndex + 1 > CYCLE_START_MONTH) ||
      (year === CYCLE_START_YEAR && monthIndex + 1 === CYCLE_START_MONTH && day >= CYCLE_START_DAY);

    if (shouldApplyCycle && day >= CYCLE_START_DAY) {
      monthIndex += 1;
      if (monthIndex > 11) {
        monthIndex = 0;
        year += 1;
      }
    }

    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  };

  const hasNameMatch = (uploadedName: string, orderNameEntries: Array<{ key: string; tokens: string[] }>) => {
    const uploadedKey = toNameMatchKey(uploadedName);
    const uploadedTokens = toNameTokens(uploadedName);

    if (!uploadedKey || uploadedTokens.length === 0) {
      return false;
    }

    for (const entry of orderNameEntries) {
      if (entry.key === uploadedKey) {
        return true;
      }

      if (uploadedTokens.length < 2 || entry.tokens.length < 2) {
        continue;
      }

      const orderTokenSet = new Set(entry.tokens);
      const uploadedTokenSet = new Set(uploadedTokens);
      const uploadedInsideOrder = uploadedTokens.every((token) => orderTokenSet.has(token));
      const orderInsideUploaded = entry.tokens.every((token) => uploadedTokenSet.has(token));

      if (uploadedInsideOrder || orderInsideUploaded) {
        return true;
      }
    }

    return false;
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
        label: "file",
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

  const fetchOrderNamesSet = async (month: string) => {
    const [ordersResponse, usersResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/admin/all-order`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      }),
      fetch(`${apiBaseUrl}/admin/users`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      }),
    ]);

    if (!ordersResponse.ok) {
      throw new Error(await readErrorMessage(ordersResponse));
    }

    if (!usersResponse.ok) {
      throw new Error(await readErrorMessage(usersResponse));
    }

    const ordersJson = await ordersResponse.json().catch(() => ({}));
    const usersJson = await usersResponse.json().catch(() => ({}));

    const orders = Array.isArray(ordersJson?.data) ? ordersJson.data : [];
    const users = Array.isArray(usersJson?.data) ? usersJson.data : [];
    const usersById = new Map<string, any>(
      users.map((user: any) => [String(user?.id ?? ""), user])
    );

    const nameEntries: Array<{ key: string; tokens: string[] }> = [];
    const verificationIds = new Set<string>();

    for (const order of orders) {
      if (getOrderMonthKey(String(order?.placedAt ?? "")) !== month) {
        continue;
      }

      let name = extractDisplayNameFromOrder(order);
      let verificationId = normalizeVerificationId(String(order?.user?.verification_id ?? ""));

      if (!name && order?.userId) {
        const matchedUser = usersById.get(String(order.userId));
        const fallbackFullName = `${matchedUser?.firstname ?? ""} ${matchedUser?.lastname ?? ""}`.trim();
        name = fallbackFullName || String(matchedUser?.name ?? "").trim();
        if (!verificationId) {
          verificationId = normalizeVerificationId(String(matchedUser?.verification_id ?? ""));
        }
      }

      const nameKey = toNameMatchKey(name);
      if (nameKey) {
        nameEntries.push({ key: nameKey, tokens: toNameTokens(name) });
      }

      if (verificationId) {
        verificationIds.add(verificationId);
      }
    }

    return { nameEntries, verificationIds };
  };

  const resetDialogState = () => {
    setSelectedFile(null);
    setUnmatchedNames([]);
    setPendingSubmission(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const continueWithPendingUpload = async () => {
    if (!pendingSubmission) {
      return;
    }

    setIsResetting(true);
    try {
      const { result, attemptLabel } = await submitBulkRepayments(
        pendingSubmission.normalizedCsv,
        pendingSubmission.month,
        pendingSubmission.originalName
      );

      setIsOpen(false);
      resetDialogState();
      toast.success(
        `Successfully processed ${result.updatedCount || result.successCount || result.processedCount || pendingSubmission.validCount} repayment record(s) for ${pendingSubmission.month}.`
      );
    } catch (error) {
      console.error("Reset error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to confirm bulk repayments. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
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

      if (nameIndex !== -1) {
        const uploadedNames = Array.from(
          new Set(
            validRows
              .map((entry) => String(entry.row[nameIndex] ?? "").trim())
              .filter(Boolean)
          )
        );

        if (uploadedNames.length > 0) {
          const { nameEntries, verificationIds } = await fetchOrderNamesSet(selectedMonth);
          const unmatched = validRows
            .filter((entry) => {
              const uploadedName = String(entry.row[nameIndex] ?? "").trim();
              if (!uploadedName) {
                return false;
              }

              const uploadedVerificationId = normalizeVerificationId(entry.verificationId);
              const verificationMatched = !!uploadedVerificationId && verificationIds.has(uploadedVerificationId);
              const nameMatched = hasNameMatch(uploadedName, nameEntries);
              return !verificationMatched && !nameMatched;
            })
            .map((entry) => String(entry.row[nameIndex] ?? "").trim())
            .filter(Boolean)
            .filter((name, index, arr) => arr.indexOf(name) === index);

          if (unmatched.length > 0) {
            setUnmatchedNames(unmatched);
            setPendingSubmission({
              normalizedCsv,
              month: selectedMonth,
              originalName: selectedFile.name,
              validCount: validRows.length,
            });
            toast.warning(
              `${unmatched.length} uploaded name(s) were not found in orders for ${selectedMonth}. Review and confirm to continue.`
            );
            setIsResetting(false);
            return;
          }
        }
      }

      const { result, attemptLabel } = await submitBulkRepayments(
        normalizedCsv,
        selectedMonth,
        selectedFile.name
      );

      setIsOpen(false);
      resetDialogState();

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
      setUnmatchedNames([]);
      setPendingSubmission(null);
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex font-header bg-brand-700 hover:bg-brand-800 text-white items-center gap-2">
          <HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={1.8} />
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

            <div className="bg-brand-50 border border-brand-200 rounded p-3 text-sm text-brand-800">
              <p className="font-semibold mb-1">File Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-medium">Required columns:</span> <code className="bg-white px-1 rounded">verification_id</code> and <code className="bg-white px-1 rounded">amount</code></li>
                <li><span className="font-medium">Optional columns:</span> <code className="bg-white px-1 rounded">name</code>, <code className="bg-white px-1 rounded">phone</code>, <code className="bg-white px-1 rounded">government_entity</code>, <code className="bg-white px-1 rounded">employee_id</code>, <code className="bg-white px-1 rounded">narration</code></li>
                <li>The <code className="bg-white px-1 rounded">verification_id</code> must match the employee verification ID</li>
                <li>The <code className="bg-white px-1 rounded">narration</code> field maps to the note field on the repayment record</li>
                <li>Only rows with both verification_id and amount will be processed</li>
              </ul>
            </div>

            {unmatchedNames.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
                <p className="font-semibold mb-1">Names not found in orders for {selectedMonth} ({unmatchedNames.length})</p>
                <p className="mb-2">These names were in the uploaded file but could not be matched to orders in the selected month.</p>
                <div className="max-h-28 overflow-auto rounded border border-amber-200 bg-white p-2">
                  <ul className="list-disc list-inside space-y-1">
                    {unmatchedNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            <HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={1.8} />
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              resetDialogState();
            }}
            disabled={isResetting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          {pendingSubmission && (
            <Button
              onClick={continueWithPendingUpload}
              disabled={isResetting}
              className="flex w-full items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 sm:w-auto"
            >
              {isResetting ? "Uploading..." : "Upload Anyway"}
              {isResetting && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
            </Button>
          )}
          <Button
            onClick={confirmBulkRepayments}
            disabled={isResetting || !selectedMonth || !selectedFile}
            className="flex w-full items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 sm:w-auto"
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
