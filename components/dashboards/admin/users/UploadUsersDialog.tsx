"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudUploadIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";

interface UploadUsersDialogProps {
  token: string;
}

export function UploadUsersDialog({ token }: UploadUsersDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileName = selectedFile.name.toLowerCase();
      const isSupportedFile =
        fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (!isSupportedFile) {
        toast.error("Please upload a CSV or XLSX file");
        setFile(null);
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
    }
  };

  const getRowsFromFile = async (selectedFile: File): Promise<string[][]> => {
    const XLSX = await import("xlsx");
    const fileName = selectedFile.name.toLowerCase();

    const workbook = fileName.endsWith(".csv")
      ? XLSX.read(await selectedFile.text(), { type: "string" })
      : XLSX.read(await selectedFile.arrayBuffer(), { type: "array" });

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("The spreadsheet has no sheets");
    }

    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
      raw: false,
    }).map((row) => row.map((value) => String(value ?? "").trim()));
  };
   const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!file) {
    toast.error("Please select a file to upload");
    return;
  }

  setLoading(true);

  try {
    const sheetRows = await getRowsFromFile(file);
    console.log("[DEBUG] Parsed sheet rows:", sheetRows);

    // Define CSV validation types
    type CSVValidationResult = {
      isValid: boolean;
      errors: string[];
      cleanedContent: string;
    };

    type CleanedRow = Record<string, string>;

    const escapeCsvValue = (value: string) => {
      const stringValue = String(value ?? "");

      if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    };

    const validateCSV = (rows: string[][]): CSVValidationResult => {
      const errors: string[] = [];

      if (rows.length < 2) {
        return {
          isValid: false,
          errors: ["CSV must contain at least one data row"],
          cleanedContent: ""
        };
      }

      const normalizeHeader = (header: string) => {
        const normalizedHeader = header
          .trim()
          .replace(/^\uFEFF/, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');

        const headerAliases: Record<string, string> = {
          surname: 'lastname',
          first_name: 'firstname',
          first_names: 'firstname',
          verification: 'verification_id',
          verification_no: 'verification_id',
          verification_nos: 'verification_id',
          verification_number: 'verification_id',
          verification_n0: 'verification_id',
          verificationno: 'verification_id',
          verificationnumber: 'verification_id',
          grade_step: 'level',
          grade_sep: 'level',
          gradestep: 'level',
          grade__step: 'level',
          net_pay: 'salary_per_month',
          netpay: 'salary_per_month',
          net_salary: 'salary_per_month',
        };

        if (headerAliases[normalizedHeader]) {
          return headerAliases[normalizedHeader];
        }

        if (['other_name', 'other_names', 'middlename', 'middle_name', 'middle_names'].includes(normalizedHeader)) {
          return 'other_name';
        }

        return normalizedHeader;
      };

      const normalizeCellValue = (value: string) =>
        value.trim().replace(/\s+/g, ' ').toLowerCase();

      const matchesHeaderKeyword = (value: string, keywords: string[]) => {
        const normalizedValue = normalizeHeader(value);
        return keywords.some((keyword) => normalizedValue.includes(keyword));
      };

      const normalizeSalaryValue = (value: string) => {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
          return "";
        }

        const negativeByParentheses = trimmedValue.startsWith("(") && trimmedValue.endsWith(")");
        let normalized = trimmedValue.replace(/[\s,]/g, "").replace(/[^\d.-]/g, "");

        if (negativeByParentheses && normalized && !normalized.startsWith("-")) {
          normalized = `-${normalized}`;
        }

        const parts = normalized.split(".");
        if (parts.length > 2) {
          normalized = `${parts.shift()}.${parts.join("")}`;
        }

        normalized = normalized.replace(/(?!^)-/g, "");

        if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
          return null;
        }

        return Number.isNaN(Number(normalized)) ? null : normalized;
      };

      const expectedHeaders = [
        'firstname', 'lastname', 'email', 'phone',
        'level', 'employee_id', 'verification_id', 'government_entity', 'salary_per_month'
      ];
      const identityHeaders = ['firstname', 'lastname', 'level', 'government_entity', 'verification_id'];
      const personAnchorHeaders = ['firstname', 'lastname', 'email', 'phone'];
      const defaultGovernmentEntity = 'OFFICE OF THE SURVEYOR GENERAL';
      const requiredHeaders = expectedHeaders.filter(
        (header) => !['employee_id', 'phone', 'email'].includes(header)
      );

      const cleanedRows: CleanedRow[] = [];
      let expectedHeaderIndexes = expectedHeaders.reduce<Record<string, number>>((acc, header) => {
        acc[header] = -1;
        return acc;
      }, {});
      let otherNameIndex = -1;
      let headerRowFound = false;
      let currentDepartment = "";

      const resolveHeaderIndexes = (values: string[]) => {
        const resolvedIndexes = expectedHeaders.reduce<Record<string, number>>((acc, header) => {
          acc[header] = -1;
          return acc;
        }, {});

        values.forEach((value, index) => {
          if (resolvedIndexes.verification_id === -1 && matchesHeaderKeyword(value, ['verification'])) {
            resolvedIndexes.verification_id = index;
          }

          if (resolvedIndexes.lastname === -1 && matchesHeaderKeyword(value, ['surname', 'lastname', 'last_name'])) {
            resolvedIndexes.lastname = index;
          }

          if (resolvedIndexes.firstname === -1 && matchesHeaderKeyword(value, ['first_name', 'firstname'])) {
            resolvedIndexes.firstname = index;
          }

          if (otherNameIndex === -1 && matchesHeaderKeyword(value, ['middle_name', 'middlename', 'other_name', 'other_names'])) {
            otherNameIndex = index;
          }

          if (resolvedIndexes.level === -1 && matchesHeaderKeyword(value, ['grade_step', 'gradestep', 'level'])) {
            resolvedIndexes.level = index;
          }

          if (resolvedIndexes.salary_per_month === -1 && matchesHeaderKeyword(value, ['net_pay', 'netpay', 'net_salary', 'salary_per_month'])) {
            resolvedIndexes.salary_per_month = index;
          }

          if (resolvedIndexes.email === -1 && matchesHeaderKeyword(value, ['email'])) {
            resolvedIndexes.email = index;
          }

          if (resolvedIndexes.phone === -1 && matchesHeaderKeyword(value, ['phone', 'telephone', 'gsm'])) {
            resolvedIndexes.phone = index;
          }

          if (resolvedIndexes.employee_id === -1 && matchesHeaderKeyword(value, ['employee_id', 'employeeid'])) {
            resolvedIndexes.employee_id = index;
          }

          if (resolvedIndexes.government_entity === -1 && matchesHeaderKeyword(value, ['government_entity', 'governmententity', 'department'])) {
            resolvedIndexes.government_entity = index;
          }
        });

        return resolvedIndexes;
      };

      const getHeaderScore = (resolvedIndexes: Record<string, number>) => {
        let score = 0;

        if (resolvedIndexes.firstname >= 0) score += 2;
        if (resolvedIndexes.lastname >= 0) score += 2;
        if (resolvedIndexes.verification_id >= 0) score += 2;
        if (resolvedIndexes.level >= 0) score += 2;
        if (resolvedIndexes.salary_per_month >= 0) score += 2;
        if (otherNameIndex >= 0) score += 1;

        return score;
      };

      for (let i = 0; i < rows.length; i++) {
        const values = rows[i].map((value) => String(value ?? '').trim());
        const normalizedValues = values.map(normalizeHeader);
        const normalizedRowText = values.map(normalizeCellValue).join(' ');

        const departmentMatch = normalizedRowText.match(/department\s*:\s*(.+)/i);
        if (departmentMatch?.[1]) {
          currentDepartment = departmentMatch[1].trim();
        }

        const resolvedHeaderIndexes = resolveHeaderIndexes(values);

        if (getHeaderScore(resolvedHeaderIndexes) >= 6) {
          headerRowFound = true;
          expectedHeaderIndexes = resolvedHeaderIndexes;
          continue;
        }

        if (!headerRowFound) {
          continue;
        }

        const rowData: Record<string, string> = {};
        expectedHeaders.forEach((header) => {
          const index = expectedHeaderIndexes[header];
          rowData[header] = index >= 0 ? (values[index]?.trim() || '') : '';
        });

        if (!rowData.government_entity) {
          rowData.government_entity = currentDepartment || defaultGovernmentEntity;
        }

        if (otherNameIndex >= 0) {
          const otherName = values[otherNameIndex]?.trim() || '';
          if (otherName) {
            rowData.firstname = [rowData.firstname, otherName].filter(Boolean).join(' ').trim();
          }
        }

        const populatedExpectedFieldCount = expectedHeaders.reduce((count, header) => {
          return count + (rowData[header] ? 1 : 0);
        }, 0);

        if (populatedExpectedFieldCount === 0) {
          continue;
        }

        const headerMatchCount = expectedHeaders.reduce((count, header) => {
          return count + (normalizeHeader(rowData[header]) === header ? 1 : 0);
        }, 0);

        if (headerMatchCount >= 4) {
          continue;
        }

        const populatedIdentityFieldCount = identityHeaders.reduce((count, header) => {
          return count + (rowData[header] ? 1 : 0);
        }, 0);
        const populatedPersonAnchorCount = personAnchorHeaders.reduce((count, header) => {
          return count + (rowData[header] ? 1 : 0);
        }, 0);

        const isSummaryRow = /\b(sub\s*total|subtotal|grand\s*total|total|summary)\b/.test(normalizedRowText);

        if (populatedIdentityFieldCount === 0 || populatedPersonAnchorCount === 0 || isSummaryRow) {
          continue;
        }

        if (!rowData.firstname) {
          errors.push(`Row ${i + 1}: Missing firstname`);
        }

        if (!rowData.lastname) {
          errors.push(`Row ${i + 1}: Missing lastname`);
        }

        if (!rowData.level) {
          errors.push(`Row ${i + 1}: Missing level`);
        }

        if (!rowData.verification_id) {
          errors.push(`Row ${i + 1}: Missing verification_id`);
        }

        if (!rowData.government_entity) {
          errors.push(`Row ${i + 1}: Missing government_entity`);
        }
        
        if (rowData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowData.email)) {
          errors.push(`Row ${i + 1}: Invalid email format`);
        }

        if (!rowData.salary_per_month) {
          errors.push(`Row ${i + 1}: Missing salary_per_month`);
        } else {
          const normalizedSalary = normalizeSalaryValue(rowData.salary_per_month);

          if (normalizedSalary === null) {
            errors.push(`Row ${i + 1}: Invalid salary value (must be a number)`);
          } else {
            rowData.salary_per_month = normalizedSalary;
          }
        }

        cleanedRows.push({ ...rowData });
      }

      if (!headerRowFound) {
        return {
          isValid: false,
          errors: ["Could not find a valid header row in the uploaded file"],
          cleanedContent: ""
        };
      }

      if (cleanedRows.length === 0) {
        return {
          isValid: false,
          errors: ["CSV must contain at least one data row"],
          cleanedContent: ""
        };
      }

      const availableHeaders = Object.entries(expectedHeaderIndexes)
        .filter(([, index]) => index >= 0)
        .map(([header]) => header);
      const missingHeaders = requiredHeaders.filter((header) => header !== 'government_entity' && !availableHeaders.includes(header));

      if (missingHeaders.length > 0) {
        return {
          isValid: false,
          errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
          cleanedContent: ""
        };
      }

      const usedEmployeeIds = new Set(
        cleanedRows
          .map((row) => row.employee_id.trim())
          .filter(Boolean)
      );

      const fallbackSeed = `${Date.now()}`;

      const rowsForUpload = cleanedRows.map((row, index) => {
        if (row.employee_id.trim()) {
          return row;
        }

        const sanitizedVerificationId = row.verification_id.replace(/\W+/g, "").trim();
        const baseEmployeeId = sanitizedVerificationId || `${fallbackSeed}${index + 1}`;
        let generatedEmployeeId = baseEmployeeId;
        let duplicateCounter = 1;

        while (usedEmployeeIds.has(generatedEmployeeId)) {
          generatedEmployeeId = `${baseEmployeeId}${duplicateCounter}`;
          duplicateCounter += 1;
        }

        usedEmployeeIds.add(generatedEmployeeId);

        return {
          ...row,
          employee_id: generatedEmployeeId,
        };
      });

      return {
        isValid: errors.length === 0,
        errors,
        cleanedContent: [
          expectedHeaders.join(','),
          ...rowsForUpload.map((row) => expectedHeaders.map((header) => escapeCsvValue(row[header])).join(',')),
        ].join('\n')
      };
    };

    const validationResult = validateCSV(sheetRows);
    if (!validationResult.isValid) {
      toast.error(
        <div className="max-h-[200px] overflow-y-auto">
          <p className="font-semibold">CSV validation failed:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            {validationResult.errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>,
        { duration: 10000 }
      );
      return;
    }

    const formData = new FormData();
    const csvBlob = new Blob([validationResult.cleanedContent], { type: "text/csv" });
    formData.append("file", csvBlob, "users_upload.csv");

    interface ApiError {
      row?: number;
      message?: string;
      errors?: Array<{
        msg?: string;
        path?: string;
      }>;
    }

    interface ApiResponse {
      message?: string;
      success?: any[];
      failed?: ApiError[];
      count?: number;
    }

    const response = await axios.post<ApiResponse>(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/upload-users`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 45000,
      }
    );

    if (response.data.failed && response.data.failed.length > 0) {
      const errorGroups = response.data.failed.reduce((acc: Record<string, string[]>, error) => {
        const nestedMessage = error.errors
          ?.map((item) => item.msg || item.path)
          .filter(Boolean)
          .join(", ");
        const key = error.message || nestedMessage || "Unknown error";
        if (!acc[key]) acc[key] = [];
        if (error.row) acc[key].push(`Row ${error.row}`);
        return acc;
      }, {});

      toast.error(
        <div className="max-h-[300px] overflow-y-auto">
          <p className="font-semibold">{response.data.message}</p>
          <div className="mt-2 space-y-2">
            {Object.entries(errorGroups).map(([message, rows], i) => (
              <div key={i}>
                <p className="text-sm font-medium">{message}</p>
                <p className="text-xs text-muted-foreground">
                  Affected rows: {rows.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>,
        { duration: 15000 }
      );
    } else {
      toast.success(
        response.data.message || "Users uploaded successfully",
        { duration: 5000 }
      );
    }

    router.refresh();
    setOpen(false);
  } catch (error: unknown) {
    let errorMessage = "Upload failed";
    let errorDetails = "";

    if (axios.isAxiosError(error)) {
      console.error("[AXIOS ERROR]", error.response?.data);
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.message;
        
        if (typeof error.response.data === 'string') {
          const serverErrorMatch = error.response.data.match(/<pre>([\s\S]*?)<\/pre>/i);
          if (serverErrorMatch) {
            errorDetails = serverErrorMatch[1];
          }
        } else if (error.response.data?.errors) {
          errorDetails = JSON.stringify(error.response.data.errors, null, 2);
        }
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out";
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    toast.error(
      <div className="max-w-md max-h-[300px] overflow-y-auto">
        <p className="font-semibold">{errorMessage}</p>
        {errorDetails && (
          <pre className="text-xs mt-2 p-2 bg-muted rounded">
            {errorDetails}
          </pre>
        )}
      </div>,
      { duration: 10000 }
    );
  } finally {
    setLoading(false);
  }
};
  const downloadTemplate = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users-template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: 'blob'
        }
      );

     

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'user_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2">
          Upload Bulk Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] font-header">
        <DialogHeader>
          <DialogTitle>Bulk Create Users <br/> </DialogTitle>
        </DialogHeader>
        <span className="text-[13px] font-normal">Click on the download template below to get the csv template and after filling it, upload the CSV/XLSX file here to create new user(s)</span> 
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV/XLSX File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              CSV or XLSX file with user data (max 1000 users)
            </p>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="text-brand-700"
            >
              <HugeiconsIcon icon={CloudUploadIcon} size={16} strokeWidth={1.8} className="mr-2" />
              Download Template
            </Button>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!file || loading}>
              {loading ? "Uploading..." : "Upload Users"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
