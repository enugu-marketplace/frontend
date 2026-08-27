"use client";

import { useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Store01Icon } from "@hugeicons/core-free-icons";

import { CommonDashboardContext } from "@/providers/StateContext";
import Logo from "@/components/brand/Logo";
import { AdminSideBar } from "@/constants/adminSidebar";

interface TopbarProps {
  user?: { name?: string | null; email?: string | null };
}

const AdminTopbar = ({ user }: TopbarProps) => {
  const { setShowSidebar } = useContext(CommonDashboardContext);
  const pathname = usePathname();

  const segments = pathname?.split("/") || [];
  const section = segments.length === 2 ? "" : segments[2];
  const current = AdminSideBar.find((item) => item.path === section);
  const firstName = user?.name?.split(" ")[0];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <button
          onClick={() => setShowSidebar(true)}
          className="-ml-1 rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.8} />
        </button>

        <div className="lg:hidden">
          <Logo idSuffix="admin-topbar" markClassName="h-8 w-8" showTagline={false} />
        </div>

        <p className="hidden text-sm font-medium text-slate-800 lg:block">
          {current?.name || "Overview"}
        </p>

        <div className="ml-auto flex items-center gap-1">
          {firstName && (
            <span className="hidden text-[13px] text-slate-500 sm:inline">
              Signed in as {firstName}
            </span>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <HugeiconsIcon icon={Store01Icon} size={18} strokeWidth={1.8} />
            <span className="hidden sm:inline">Marketplace</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
