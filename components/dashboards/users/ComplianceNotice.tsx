"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, Upload01Icon } from "@hugeicons/core-free-icons";

import ConsentUpload from "@/components/ConsentUpload";

/**
 * Shown on the dashboard when the compliance form has not been submitted.
 * The form itself is the same upload dialog used on the marketplace, so the
 * notice opens it in place instead of linking to a page that does not exist.
 */
export default function ComplianceNotice({ token }: { token: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <HugeiconsIcon icon={Alert01Icon} size={18} strokeWidth={1.8} className="shrink-0" />
        <p>
          Submit your compliance form to activate your purchasing unit. You cannot place orders
          until it is approved.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="ml-auto flex items-center gap-1.5 rounded-sm bg-amber-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-amber-700"
        >
          <HugeiconsIcon icon={Upload01Icon} size={15} strokeWidth={1.8} />
          Submit form
        </button>
      </div>

      <ConsentUpload
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUploadSuccess={() => {
          setIsOpen(false);
          router.refresh();
        }}
        token={token}
        returnUrl="/employee-dashboard"
      />
    </>
  );
}
