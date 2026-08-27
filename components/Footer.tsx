"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, Call02Icon, Mail01Icon } from "@hugeicons/core-free-icons";

import { socialMedia } from "@/constants/index";
import Logo from "@/components/brand/Logo";

const columns = [
  {
    title: "Shop",
    links: [
      { name: "All products", href: "/" },
      { name: "Fresh produce", href: "/?type=perishable" },
      { name: "Pantry staples", href: "/?type=non-perishable" },
      { name: "My orders", href: "/employee-dashboard/orders" },
    ],
  },
  {
    title: "The scheme",
    links: [
      { name: "About us", href: "/about" },
      { name: "Benefits", href: "/benefits" },
      { name: "Implementation", href: "/implementation" },
      { name: "Executive summary", href: "/executive-summary" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Sign in", href: "/employee-login" },
      { name: "Delivery verification", href: "/delivery-verification" },
      { name: "Compliance help", href: "/about" },
    ],
  },
];

const Footer = () => (
  <footer className="font-header mt-10 border-t border-slate-200 bg-slate-50">
    <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-6">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo idSuffix="footer" markClassName="h-9 w-9" />
          <p className="mt-3 max-w-xs text-[13px] leading-6 text-slate-600">
            Food scheme marketplace for Enugu State civil servants. Order staples at approved
            prices and pay from your salary at 0% interest.
          </p>

          <ul className="mt-4 space-y-2 text-[13px] text-slate-600">
            <li className="flex items-start gap-2">
              <HugeiconsIcon icon={Location01Icon} size={15} strokeWidth={1.8} className="mt-0.5" />
              Government House, Enugu, Nigeria
            </li>
            <li className="flex items-center gap-2">
              <HugeiconsIcon icon={Call02Icon} size={15} strokeWidth={1.8} />
              0800 3684 8
            </li>
            <li className="flex items-center gap-2">
              <HugeiconsIcon icon={Mail01Icon} size={15} strokeWidth={1.8} />
              support@enugufoodmarket.com
            </li>
          </ul>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate-800">
              {column.title}
            </h3>
            <ul className="mt-3 space-y-2 text-[13px]">
              {column.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-600 hover:text-brand-700">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row">
        <p className="text-[13px] text-slate-500">
          © {new Date().getFullYear()} Enugu State Government. All rights reserved.
        </p>

        <div className="flex items-center gap-4 text-slate-500">
          {socialMedia.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-700"
            >
              <item.icon className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
