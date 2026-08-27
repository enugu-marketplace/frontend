"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ShoppingCart01Icon,
  Menu01Icon,
  Cancel01Icon,
  LogInIcon,
  Call02Icon,
  Shield01Icon,
  Leaf01Icon,
  PackageIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import ShowProfile from "./ShowProfile";
import Logo from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useCartCount } from "@/hooks/useCartCount";

const primaryNav = [
  { name: "All products", href: "/", icon: Store01Icon },
  { name: "Fresh produce", href: "/?type=perishable", icon: Leaf01Icon },
  { name: "Pantry staples", href: "/?type=non-perishable", icon: PackageIcon },
];

const secondaryNav = [
  { name: "About the scheme", href: "/about" },
  { name: "Benefits", href: "/benefits" },
];

function CartButton({ token }: { token?: string }) {
  const count = useCartCount(token);

  return (
    <Link
      href="/employee-dashboard/cart"
      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-3"
    >
      <span className="relative">
        <HugeiconsIcon icon={ShoppingCart01Icon} size={21} strokeWidth={1.8} />
        {count > 0 && (
          <span className="absolute -right-2 -top-1.5 min-w-4 rounded-sm bg-brand-700 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">Cart</span>
    </Link>
  );
}

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState("");
  const { data: clientSession, status } = useSession();
  const [serverUser, setServerUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Session fetch failed: ${res.status}`);
        if (res.status === 204) return null;
        try {
          return await res.json();
        } catch {
          return null;
        }
      })
      .then(setServerUser)
      .catch((err) => console.error("Session error:", err));
  }, []);

  // close the drawer when the route changes
  useEffect(() => setMenuOpen(false), [pathname]);

  const user = clientSession?.user || serverUser?.user || serverUser;

  function search(e: FormEvent) {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <header className="font-header sticky top-0 z-50 w-full bg-white">
      <div className="hidden bg-brand-900 text-[12px] text-brand-100 md:block">
        <div className="mx-auto flex h-8 max-w-[1400px] items-center justify-between px-4 lg:px-6">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Shield01Icon} size={14} strokeWidth={2} />
            Official Enugu State Government food scheme
          </span>
          <span className="flex items-center gap-4">
            <Link href="/about" className="hover:underline">
              Help centre
            </Link>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Call02Icon} size={14} strokeWidth={2} />
              0800 3684 8
            </span>
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 lg:gap-6 lg:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="-ml-1 rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Menu"
          >
            <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={22} strokeWidth={1.8} />
          </button>

          <Link href="/" className="shrink-0">
            <Logo idSuffix="header" markClassName="h-9 w-9" />
          </Link>

          <form onSubmit={search} className="hidden flex-1 md:block">
            <div className="flex h-10 max-w-2xl overflow-hidden rounded-md border border-slate-300 focus-within:border-brand-600">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search for rice, beans, oil"
                className="w-full px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-brand-700 px-5 text-sm font-medium text-white hover:bg-brand-800"
              >
                <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
                <span className="hidden lg:inline">Search</span>
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {status === "authenticated" && user ? (
              <>
                {user?.role === "user" && <CartButton token={user?.token} />}
                <ShowProfile />
              </>
            ) : (
              <>
                <Link
                  href="/employee-login"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <HugeiconsIcon icon={LogInIcon} size={19} strokeWidth={1.8} />
                  <span className="hidden sm:inline">Sign in</span>
                </Link>
                <Button
                  asChild
                  className="hidden h-10 rounded-md bg-brand-700 px-4 text-sm font-medium hover:bg-brand-800 sm:inline-flex"
                >
                  <Link href="/employee-login">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={search} className="px-4 pb-3 md:hidden">
          <div className="flex h-10 overflow-hidden rounded-md border border-slate-300 focus-within:border-brand-600">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search products"
              className="w-full px-3 text-sm outline-none placeholder:text-slate-400"
            />
            <button type="submit" className="bg-brand-700 px-4 text-white" aria-label="Search">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>

      <nav className="hidden border-b border-slate-200 bg-slate-50 lg:block">
        <div className="mx-auto flex h-11 max-w-[1400px] items-center gap-1 px-4 text-sm lg:px-6">
          {primaryNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-200/70"
            >
              <HugeiconsIcon icon={item.icon} size={17} strokeWidth={1.8} />
              {item.name}
            </Link>
          ))}

          <span className="mx-2 h-5 w-px bg-slate-300" />

          {secondaryNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 hover:bg-slate-200/70",
                pathname.startsWith(item.href) ? "font-medium text-brand-800" : "text-slate-700"
              )}
            >
              {item.name}
            </Link>
          ))}

          <span className="ml-auto text-[13px] text-slate-500">
            Deductions capped at 1/3 of salary. 0% interest.
          </span>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-b border-slate-200 bg-white lg:hidden">
          <nav className="px-4 py-3">
            {[...primaryNav, ...secondaryNav].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block border-b border-slate-100 py-3 text-sm text-slate-700 last:border-0"
              >
                {item.name}
              </Link>
            ))}

            {status !== "authenticated" && (
              <Link
                href="/employee-login"
                className="mt-3 block rounded-md bg-brand-700 py-2.5 text-center text-sm font-medium text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
