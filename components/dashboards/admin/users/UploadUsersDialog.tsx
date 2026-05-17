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
import { DownloadCloud } from "lucide-react";
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

  const getCsvContentFromFile = async (selectedFile: File): Promise<string> => {
    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      return selectedFile.text();
    }

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The spreadsheet has no sheets");
      }

      const sheet = workbook.Sheets[firstSheetName];
      return XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    }

    throw new Error("Unsupported file type. Please upload a CSV or XLSX file.");
  };
   const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!file) {
    toast.error("Please select a file to upload");
    return;
  }

  setLoading(true);

  try {
    const csvContent = await getCsvContentFromFile(file);
    console.log("[DEBUG] Original CSV content:", csvContent);

    // Define CSV validation types
    type CSVValidationResult = {
      isValid: boolean;
      errors: string[];
      cleanedContent: string;
    };

    const validateCSV = (content: string): CSVValidationResult => {
      const errors: string[] = [];
      const lines = content.split('\n').filter(line => line.trim() !== '');

      if (lines.length < 2) {
        return {
          isValid: false,
          errors: ["CSV must contain at least one data row"],
          cleanedContent: ""
        };
      }

      const cleanedLines = lines.map(line => 
        line.trim()
          .replace(/\s*,\s*/g, ',')
          .replace(/,+/g, ',')
          .replace(/,$/, '')
          .replace(/\s+/g, ' ')
      ).filter(line => line !== '');

      const requiredHeaders = [
        'firstname', 'lastname', 'email', 'phone',
        'level', 'employee_id', 'verification_id', 'government_entity', 'salary_per_month'
      ];
      
      const headers = cleanedLines[0].split(',');
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const cleanedRows: string[] = [];
      for (let i = 1; i < cleanedLines.length; i++) {
        const values = cleanedLines[i].split(',');
        
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Expected ${headers.length} columns, found ${values.length}`);
          continue;
        }

        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index]?.trim() || '';
        });

        if (!rowData.employee_id) {
          errors.push(`Row ${i + 1}: Missing employee_id`);
        }
         if (!rowData.verification_id) {
          errors.push(`Row ${i + 1}: Missing verification_id`);
        }
        
        if (!rowData.email) {
          errors.push(`Row ${i + 1}: Missing email`);
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowData.email)) {
          errors.push(`Row ${i + 1}: Invalid email format`);
        }

        if (!rowData.salary_per_month) {
          errors.push(`Row ${i + 1}: Missing salary_per_month`);
        } else if (isNaN(Number(rowData.salary_per_month.replace(/,/g, '')))) {
          errors.push(`Row ${i + 1}: Invalid salary value (must be a number)`);
        }

        if (rowData.salary_per_month) {
          rowData.salary_per_month = rowData.salary_per_month.replace(/,/g, '');
        }

        cleanedRows.push(headers.map(header => rowData[header]).join(','));
      }

      return {
        isValid: errors.length === 0,
        errors,
        cleanedContent: [headers.join(','), ...cleanedRows].join('\n')
      };
    };

    const validationResult = validateCSV(csvContent);
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
        const key = error.message || "Unknown error";
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
          Upload CSV/XLSX
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
              className="text-blue-600"
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
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
