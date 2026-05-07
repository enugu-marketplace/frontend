
import { Consent } from "@/types/compliance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Download, ZoomIn, User, Building2, Mail, Phone, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ConsentCardProps {
  consent: Consent;
  onView: (consent: Consent) => void;
  onApprove: (complianceId: string) => void;
  onReject: (complianceId: string) => void;
  isUpdating?: boolean;
}

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  APPROVED: { badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
  DENIED:   { badge: "bg-red-100 text-red-700 border-red-200",       dot: "bg-red-500" },
  REJECTED: { badge: "bg-red-100 text-red-700 border-red-200",       dot: "bg-red-500" },
  PENDING:  { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" },
};

export function ComplianceCard({
  consent,
  onView,
  onApprove,
  onReject,
  isUpdating = false,
}: ConsentCardProps) {
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const statusStyle = STATUS_STYLES[consent.status] ?? STATUS_STYLES["PENDING"];

  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = consent.form_url;
    link.download = `compliance-${consent.user.employee_id}-${consent.user.firstname}-${consent.user.lastname}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
        {/* Card top color strip based on status */}
        <div className={`h-1 w-full ${statusStyle.dot}`} />

        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {consent.user.firstname} {consent.user.lastname}
              </p>
              <p className="text-xs text-gray-400 font-mono">{consent.user.employee_id}</p>
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
            {consent.status}
          </span>
        </div>

        {/* Meta info */}
        <div className="px-4 pb-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{consent.user.government_entity || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{consent.user.email || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{consent.user.phone || "—"}</span>
          </div>
        </div>

        {/* Image preview */}
        <div className="relative mx-4 mb-3 h-44 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group cursor-pointer"
          onClick={() => setImagePreviewOpen(true)}
        >
          <Image
            src={consent.form_url}
            alt={`Compliance form for ${consent.user.firstname} ${consent.user.lastname}`}
            fill
            className="object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setImagePreviewOpen(true); }}
                className="bg-white/90 hover:bg-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow"
              >
                <ZoomIn className="h-3.5 w-3.5" /> Zoom
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownloadImage(); }}
                className="bg-white/90 hover:bg-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow"
              >
                <Download className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(consent)}
            className="w-full text-xs rounded-xl border-gray-200 hover:bg-gray-50"
          >
            View Full Details
          </Button>

          {consent.status === "PENDING" && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={() => onApprove(consent.id)}
                disabled={isUpdating}
                className="rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</>}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(consent.id)}
                disabled={isUpdating}
                className="rounded-xl text-xs"
              >
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><XCircle className="h-3.5 w-3.5 mr-1" />Reject</>}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image zoom dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 pt-5 pb-4 border-b">
            <DialogTitle className="text-base">
              {consent.user.firstname} {consent.user.lastname}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Employee ID: {consent.user.employee_id}
            </DialogDescription>
          </DialogHeader>
          <div className="relative bg-gray-50" style={{ height: "70vh" }}>
            <img
              src={consent.form_url}
              alt="Compliance form preview"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-white">
            <Button variant="outline" onClick={handleDownloadImage} className="rounded-xl text-sm gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button onClick={() => setImagePreviewOpen(false)} className="rounded-xl text-sm">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
