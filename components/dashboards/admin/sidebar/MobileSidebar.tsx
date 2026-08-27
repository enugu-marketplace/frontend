"use client";

import { useContext } from "react";
import { Session } from "next-auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { CommonDashboardContext } from "@/providers/StateContext";
import Sidebar from "./Sidebar";

const MobileSideBar = ({ dashboard, session }: { dashboard: string; session: Session }) => {
  const { showSidebar, setShowSidebar } = useContext(CommonDashboardContext);

  return (
    <div
      onClick={() => setShowSidebar(false)}
      className={`fixed inset-0 z-[9999] bg-black/40 transition-opacity duration-200 lg:hidden ${
        showSidebar ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`h-full w-[17rem] max-w-[80%] bg-white transition-transform duration-200 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setShowSidebar(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-md p-2 text-slate-500 hover:bg-slate-100"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.8} />
        </button>

        <Sidebar
          dashboard={dashboard}
          user={{ name: session?.user?.name, email: session?.user?.email }}
        />
      </div>
    </div>
  );
};

export default MobileSideBar;
