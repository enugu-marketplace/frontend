"use client";

import { useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";

import { CommonDashboardContext } from "@/providers/StateContext";
import Logo from "@/components/brand/Logo";
import { UserSideBarComponent } from "./SidebarNav";

export interface SidebarUser {
  name?: string | null;
  email?: string | null;
}

interface SidebarProps {
  dashboard: string;
  /** Comes from the server session in the dashboard layout, so the sidebar has
   *  nothing to load and never flashes a skeleton on navigation. */
  user?: SidebarUser;
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const Sidebar = ({ dashboard, user }: SidebarProps) => {
  const { setConfirmLogout, setShowSidebar } = useContext(CommonDashboardContext);
  const pathname = usePathname();

  const pathSegments = pathname?.split("/") || [];
  const findpath = pathSegments.length === 2 ? "" : pathSegments[2];

  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-b border-slate-200 px-4 py-4">
        <Link href="/" className="inline-block" onClick={() => setShowSidebar(false)}>
          <Logo idSuffix="sidebar" markClassName="h-9 w-9" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Menu
        </p>
        {dashboard === "user" && <UserSideBarComponent findpath={findpath} />}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-semibold text-brand-800 ring-1 ring-brand-200">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-800">
              {user?.name || "Staff member"}
            </p>
            {user?.email && (
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setConfirmLogout(true)}
          className="mt-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"
        >
          <HugeiconsIcon icon={Logout01Icon} size={17} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
