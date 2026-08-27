"use client";

import { useContext } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, ShoppingCart01Icon, Store01Icon } from "@hugeicons/core-free-icons";

import { CommonDashboardContext } from "@/providers/StateContext";
import Logo from "@/components/brand/Logo";
import { useCartCount } from "@/hooks/useCartCount";

interface TopbarProps {
  user?: { name?: string | null; email?: string | null };
  token?: string;
}

const DashboardTopbar = ({ user, token }: TopbarProps) => {
  const { setShowSidebar } = useContext(CommonDashboardContext);
  const cartCount = useCartCount(token);

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
          <Logo idSuffix="topbar" markClassName="h-8 w-8" showTagline={false} />
        </div>

        <p className="hidden text-sm text-slate-600 lg:block">
          {firstName ? `Signed in as ${firstName}` : "Employee dashboard"}
        </p>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 sm:flex"
          >
            <HugeiconsIcon icon={Store01Icon} size={18} strokeWidth={1.8} />
            Marketplace
          </Link>

          <Link
            href="/employee-dashboard/cart"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <span className="relative">
              <HugeiconsIcon icon={ShoppingCart01Icon} size={19} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-1.5 min-w-4 rounded-sm bg-brand-700 px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopbar;
