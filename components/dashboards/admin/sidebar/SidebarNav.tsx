"use client";

import Link from "next/link";
import { useContext } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

import { CommonDashboardContext } from "@/providers/StateContext";
import { AdminSideBar, AdminSideBarType } from "@/constants/adminSidebar";
import { cn } from "@/lib/utils";

interface Isidebar {
  findpath: string;
}

export const AdminSideBarComponent = ({ findpath }: Isidebar) => {
  const { setShowSidebar } = useContext(CommonDashboardContext);

  return (
    <nav className="flex flex-col gap-0.5">
      {AdminSideBar.map((item: AdminSideBarType) => {
        const active = findpath === item.path;

        return (
          <Link
            key={item.path || "overview"}
            href={`/admin-dashboard/${item.path}`}
            onClick={() => setShowSidebar(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-brand-50 font-medium text-brand-800"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {item.icon && (
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                strokeWidth={active ? 2 : 1.8}
                className={active ? "text-brand-700" : "text-slate-400"}
              />
            )}
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};
