import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  Wallet01Icon,
  Leaf01Icon,
  UserMultipleIcon,
  IdentityCardIcon,
  ShoppingBasket01Icon,
  TruckDeliveryIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import Footer from "@/components/Footer";
import AboutFaq from "@/components/about/AboutFaq";
import { stats } from "@/constants/index";

export const metadata = {
  title: "About the scheme | Enugu Market",
  description:
    "How the Enugu State food scheme works for civil servants: approved prices, salary deduction at 0% interest, and delivery to your assigned centre.",
};

const pillars = [
  {
    icon: Shield01Icon,
    title: "Food security",
    body: "Staff can take home essential foodstuffs without paying anything up front.",
  },
  {
    icon: Wallet01Icon,
    title: "Interest-free repayment",
    body: "What you spend is recovered from your salary at 0% interest, never more than a third of your pay.",
  },
  {
    icon: Leaf01Icon,
    title: "Local agriculture",
    body: "Purchases are sourced locally, putting state spending back into Enugu farms and traders.",
  },
  {
    icon: UserMultipleIcon,
    title: "Worker welfare",
    body: "A practical benefit for civil servants that does not depend on a cash advance or a lender.",
  },
];

const steps = [
  {
    icon: IdentityCardIcon,
    title: "Sign in and get verified",
    body: "Use the verification number issued to you. Your compliance form is reviewed once, and your purchasing unit is set from your salary.",
  },
  {
    icon: ShoppingBasket01Icon,
    title: "Order what you need",
    body: "Browse the catalogue at government-approved prices and add items to your cart. Your remaining unit is shown as you shop.",
  },
  {
    icon: TruckDeliveryIcon,
    title: "Collect and repay",
    body: "Show your QR code at your assigned distribution centre. The amount is deducted from your next salary cycle.",
  },
];

const benefits = [
  "Salary-linked purchases with automatic deductions",
  "Delivery to your assigned distribution centre",
  "Order any time, pay on payday",
  "Government approved prices and suppliers",
  "No credit checks and no interest",
  "A budget-friendly alternative to a loan",
];

export default function AboutPage() {
  return (
    <div className="font-header bg-white">
      {/* Intro */}
      <section className="border-b border-slate-200 bg-brand-900">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <p className="flex items-center gap-2 text-[13px] font-medium text-leaf-400">
            <HugeiconsIcon icon={Shield01Icon} size={15} strokeWidth={2} />
            An Enugu State Government initiative
          </p>

          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white lg:text-4xl">
            A food scheme for Enugu State civil servants.
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-brand-100/85">
            Staff order household staples at approved prices and pay from their salary at 0%
            interest. It improves food security for workers while keeping state spending inside the
            local agricultural economy.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/employee-login"
              className="flex h-11 items-center rounded-sm bg-white px-5 text-sm font-medium text-brand-900 hover:bg-brand-50"
            >
              Sign in to order
            </Link>
            <Link
              href="/"
              className="flex h-11 items-center rounded-sm border border-white/25 px-5 text-sm font-medium text-white hover:bg-white/10"
            >
              Browse the catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-slate-200 px-0 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.id} className="bg-slate-50 px-4 py-6 text-center lg:px-6">
              <p className="text-2xl font-semibold text-brand-800 lg:text-3xl">{stat.value}</p>
              <p className="mt-1 text-[13px] text-slate-600">{stat.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What it does */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
        <h2 className="text-xl font-semibold text-slate-900">What the scheme sets out to do</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="border border-slate-200 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <HugeiconsIcon icon={pillar.icon} size={20} strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-900">{pillar.title}</p>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
          <p className="mt-1 text-sm text-slate-600">Three steps, from sign-in to collection.</p>

          <ol className="mt-6 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-700 text-[13px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <HugeiconsIcon
                    icon={step.icon}
                    size={20}
                    strokeWidth={1.8}
                    className="text-slate-400"
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">{step.title}</p>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Benefits + leadership */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">What staff get</h2>
            <ul className="mt-5 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={17}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-brand-700"
                  />
                  {benefit}
                </li>
              ))}
            </ul>

            <p className="mt-6 border-l-4 border-brand-700 bg-brand-50 px-4 py-3 text-[13px] leading-6 text-brand-900">
              Monthly deductions never exceed one third of your net salary, and there are no
              interest charges or credit checks.
            </p>
          </div>

          <div className="border border-slate-200 bg-white">
            <div className="relative h-64 w-full bg-slate-100">
              <Image
                src="/gov1.jpg"
                alt="Peter Mbah, Executive Governor of Enugu State"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>

            <div className="p-5">
              <p className="text-base font-semibold text-slate-900">Peter Mbah</p>
              <p className="mt-0.5 text-[13px] font-medium text-brand-700">
                Executive Governor of Enugu State
              </p>

              <blockquote className="mt-4 border-l-4 border-slate-200 pl-4 text-[13px] leading-6 text-slate-600">
                Leading the strategic development of innovative solutions that enhance worker
                welfare while driving sustainable economic growth in Enugu State&rsquo;s
                agricultural sector.
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[900px] px-4 py-12 lg:px-6 lg:py-16">
          <h2 className="text-xl font-semibold text-slate-900">Frequently asked questions</h2>
          <AboutFaq />
        </div>
      </section>

      <Footer />
    </div>
  );
}
