'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, X, Loader2, FileImage, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from "sonner";
import axios from 'axios';

interface ConsentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  token: string;
  returnUrl?: string;
}

export default function ConsentUpload({
  isOpen,
  onClose,
  onUploadSuccess,
  token
}: ConsentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image to upload');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('compliance_form', selectedFile);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/add-compliance`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success('Compliance document uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsUploading(false);
        onUploadSuccess();
        onClose();
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload compliance document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 rounded-full p-2">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-white text-lg font-semibold m-0">
              Compliance Verification
            </DialogTitle>
          </div>
          <DialogDescription className="text-green-100 text-sm leading-relaxed">
            Upload your signed compliance / consent form to activate your account and start shopping.
          </DialogDescription>
        </div>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5 space-y-5">

            {/* Info cards */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your compliance document is required once. It will be reviewed by an administrator before your account is fully activated.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-xs text-green-700 leading-relaxed">
                  Accepted formats: <strong>JPG, PNG, WEBP, HEIC</strong>. Please ensure the document is clear and fully visible.
                </p>
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? 'border-green-500 bg-green-50 scale-[1.01]'
                  : previewUrl
                  ? 'border-green-400 bg-green-50/40'
                  : 'border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50/40'
              }`}
            >
              {previewUrl ? (
                <div className="p-4">
                  <div className="relative rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100">
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="w-full max-h-56 object-contain"
                    />
                    <button
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {selectedFile && (
                    <div className="mt-3 flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
                      <FileImage className="h-4 w-4 text-green-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
                  <div className={`rounded-full p-4 transition-colors ${isDragging ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Upload className={`h-7 w-7 transition-colors ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {isDragging ? 'Drop your image here' : 'Drag & drop your document'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse files</p>
                  </div>
                </div>
              )}

              <Input
                id="compliance_form"
                name="compliance_form"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="flex-1 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex-1 rounded-xl bg-green-700 hover:bg-green-600 text-white font-medium shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}