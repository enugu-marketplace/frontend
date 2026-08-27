"use client";

import { Consent } from "@/types/compliance";
import Image from "next/image";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Download01Icon,
  ZoomInAreaIcon,
  UserIcon,
  Building03Icon,
  Mail01Icon,
  Call02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConsentCardProps {
  consent: Consent;
  onView: (consent: Consent) => void;
  onApprove: (complianceId: string) => void;
  onReject: (complianceId: string) => void;
  isUpdating?: boolean;
}

const STATUS_STYLES: Record<string, { chip: string; rule: string }> = {
  APPROVED: { chip: "bg-brand-50 text-brand-800 ring-brand-200", rule: "bg-brand-600" },
  DENIED: { chip: "bg-red-50 text-red-700 ring-red-200", rule: "bg-red-500" },
  REJECTED: { chip: "bg-red-50 text-red-700 ring-red-200", rule: "bg-red-500" },
  PENDING: { chip: "bg-amber-50 text-amber-800 ring-amber-200", rule: "bg-amber-500" },
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
      <div className="flex flex-col border border-slate-200 bg-white">
        <div className={cn("h-0.5 w-full", statusStyle.rule)} />

        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <HugeiconsIcon icon={UserIcon} size={17} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {consent.user.firstname} {consent.user.lastname}
              </p>
              <p className="truncate font-mono text-[11px] text-slate-400">
                {consent.user.employee_id}
              </p>
            </div>
          </div>

          <span
            className={cn(
              "shrink-0 rounded-sm px-2 py-1 text-[11px] font-medium capitalize ring-1",
              statusStyle.chip
            )}
          >
            {consent.status.toLowerCase()}
          </span>
        </div>

        {/* Meta */}
        <dl className="space-y-1.5 px-4 pb-3 text-[12px] text-slate-500">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Building03Icon} size={14} strokeWidth={1.8} className="shrink-0" />
            <span className="truncate">{consent.user.government_entity || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Mail01Icon} size={14} strokeWidth={1.8} className="shrink-0" />
            <span className="truncate">{consent.user.email || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Call02Icon} size={14} strokeWidth={1.8} className="shrink-0" />
            <span>{consent.user.phone || "-"}</span>
          </div>
        </dl>

        {/* Document preview */}
        <button
          type="button"
          onClick={() => setImagePreviewOpen(true)}
          className="group relative mx-4 mb-3 h-40 overflow-hidden border border-slate-200 bg-slate-50"
        >
          <Image
            src={consent.form_url}
            alt={`Compliance form for ${consent.user.firstname} ${consent.user.lastname}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain"
          />
          <span className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/30 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700">
              <HugeiconsIcon icon={ZoomInAreaIcon} size={14} strokeWidth={1.8} />
              Zoom
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadImage();
              }}
              className="flex items-center gap-1.5 rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700"
            >
              <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={1.8} />
              Save
            </span>
          </span>
        </button>

        {/* Actions */}
        <div className="mt-auto space-y-2 px-4 pb-4">
          <button
            onClick={() => onView(consent)}
            className="h-9 w-full rounded-sm border border-slate-300 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
          >
            View full details
          </button>

          {consent.status === "PENDING" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onApprove(consent.id)}
                disabled={isUpdating}
                className="flex h-9 items-center justify-center gap-1.5 rounded-sm bg-brand-700 text-[13px] font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
              >
                <HugeiconsIcon
                  icon={isUpdating ? Loading03Icon : CheckmarkCircle01Icon}
                  size={15}
                  strokeWidth={1.8}
                  className={isUpdating ? "animate-spin" : undefined}
                />
                Approve
              </button>
              <button
                onClick={() => onReject(consent.id)}
                disabled={isUpdating}
                className="flex h-9 items-center justify-center gap-1.5 rounded-sm bg-red-600 text-[13px] font-medium text-white hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-500"
              >
                <HugeiconsIcon
                  icon={isUpdating ? Loading03Icon : CancelCircleIcon}
                  size={15}
                  strokeWidth={1.8}
                  className={isUpdating ? "animate-spin" : undefined}
                />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zoom dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 pb-4 pt-5">
            <DialogTitle className="text-base">
              {consent.user.firstname} {consent.user.lastname}
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              Employee ID: {consent.user.employee_id}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50" style={{ height: "70vh" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={consent.form_url}
              alt="Compliance form preview"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              onClick={handleDownloadImage}
              className="flex h-10 items-center gap-2 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
            >
              <HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={1.8} />
              Download
            </button>
            <button
              onClick={() => setImagePreviewOpen(false)}
              className="h-10 rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
