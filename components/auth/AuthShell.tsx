"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Call02Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import Logo from "@/components/brand/Logo";

const defaultPoints = [
  "Staples at government approved prices",
  "Paid from your salary at 0% interest",
  "Collected at your assigned distribution centre",
];

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered under the form, e.g. a resend link or step hint */
  footer?: ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Left panel copy - staff sign-ins get a different pitch to shoppers */
  panelTitle?: string;
  points?: string[];
  panelNote?: string;
};

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  backHref = "/",
  backLabel = "Back to marketplace",
  panelTitle = "The Enugu State food scheme, in one place.",
  points = defaultPoints,
  panelNote = "Access is limited to verified civil servants of Enugu State. If your details are not recognised, contact your ministry’s scheme officer.",
}: AuthShellProps) {
  return (
    <div className="font-header flex min-h-screen flex-col lg:flex-row">
      {/* brand side */}
      <aside className="bg-brand-900 px-6 py-8 text-brand-100 lg:w-[38%] lg:px-10 lg:py-12">
        <Link href="/" className="inline-block">
          <Logo tone="light" idSuffix="auth" markClassName="h-9 w-9" />
        </Link>

        <div className="mt-8 hidden lg:block">
          <h2 className="text-2xl font-semibold leading-snug text-white">{panelTitle}</h2>

          <ul className="mt-6 space-y-3 text-sm">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={17}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-leaf-400"
                />
                {point}
              </li>
            ))}
          </ul>

          <p className="mt-10 max-w-xs border-t border-white/15 pt-5 text-[13px] leading-6 text-brand-100/70">
            {panelNote}
          </p>
        </div>
      </aside>

      {/* form side */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 lg:px-10">
        <div className="w-full max-w-sm">
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-brand-700"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
            {backLabel}
          </Link>

          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm leading-6 text-slate-600">{subtitle}</p>}

          <div className="mt-6">{children}</div>

          {footer && <div className="mt-5 text-sm text-slate-600">{footer}</div>}

          <p className="mt-10 flex items-center gap-1.5 border-t border-slate-200 pt-4 text-[13px] text-slate-500">
            <HugeiconsIcon icon={Call02Icon} size={14} strokeWidth={2} />
            Trouble signing in? Call 0800 3684 8
          </p>
        </div>
      </main>
    </div>
  );
}
