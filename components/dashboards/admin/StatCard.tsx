import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  ShoppingBasket01Icon,
  ShoppingBag01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

const icons = {
  users: UserMultipleIcon,
  products: ShoppingBasket01Icon,
  orders: ShoppingBag01Icon,
  revenue: Wallet01Icon,
};

const tones = {
  slate: "bg-slate-100 text-slate-600",
  brand: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-700",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof icons;
  note?: string;
  tone?: keyof typeof tones;
}

export default function StatCard({ label, value, icon, note, tone = "slate" }: StatCardProps) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-slate-500">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-semibold text-slate-900">{value}</p>
        </div>

        {icon && (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
              tones[tone]
            )}
          >
            <HugeiconsIcon icon={icons[icon]} size={20} strokeWidth={1.8} />
          </span>
        )}
      </div>

      {note && <p className="mt-3 text-[12px] leading-5 text-slate-500">{note}</p>}
    </div>
  );
}
