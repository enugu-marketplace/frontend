import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  Leaf01Icon,
  Building03Icon,
  ChartLineData01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { stats } from "@/constants/index";

const groups = [
  {
    icon: UserMultipleIcon,
    title: "For civil servants",
    points: [
      "Essential foodstuffs without paying anything up front",
      "Less month-end pressure on the household food budget",
      "Repayment at 0% interest, capped at a third of net salary",
      "No credit check, no collateral, no lender involved",
      "Fewer food-related absences and better focus at work",
    ],
  },
  {
    icon: Leaf01Icon,
    title: "For the local economy",
    points: [
      "State spending injected directly into Enugu businesses",
      "Steady, predictable demand for local farmers and suppliers",
      "Employment across the food value chain, from farm to centre",
      "Incentive for producers to raise volume and quality",
    ],
  },
  {
    icon: Building03Icon,
    title: "For the state",
    points: [
      "Aligned with the state agricultural development strategy",
      "A visible commitment to worker welfare",
      "Contribution to internally generated revenue",
      "A model other states can replicate",
    ],
  },
];

const longTerm = [
  {
    title: "A stronger food system",
    body: "Combined demand from state workers gives local farmers a reason to increase production and hold to consistent quality standards, which makes the wider food supply more resilient.",
  },
  {
    title: "Healthier credit habits",
    body: "Staff build a record of responsible, salary-linked credit without exposure to informal lenders, supporting broader financial inclusion goals.",
  },
  {
    title: "A multiplier effect",
    body: "Money spent through the scheme circulates inside the local economy rather than leaving it, producing secondary benefits for traders, transporters and their communities.",
  },
];

export default function BenefitsPage() {
  return (
    <div className="font-header bg-white">
      {/* Intro */}
      <section className="border-b border-slate-200 bg-brand-900">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white lg:text-4xl">
            Who the scheme benefits, and how.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-brand-100/85">
            The food scheme is designed to work on three levels at once: relief for the worker,
            demand for local producers, and a return for the state that funds it.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/employee-login"
              className="flex h-11 items-center rounded-sm bg-white px-5 text-sm font-medium text-brand-900 hover:bg-brand-50"
            >
              Sign in to order
            </Link>
            <Link
              href="/about"
              className="flex h-11 items-center rounded-sm border border-white/25 px-5 text-sm font-medium text-white hover:bg-white/10"
            >
              How the scheme works
            </Link>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.id} className="bg-slate-50 px-4 py-6 text-center lg:px-6">
              <p className="text-2xl font-semibold text-brand-800 lg:text-3xl">{stat.value}</p>
              <p className="mt-1 text-[13px] text-slate-600">{stat.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stakeholder groups */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
        <h2 className="text-xl font-semibold text-slate-900">Three groups, one scheme</h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                  <HugeiconsIcon icon={group.icon} size={20} strokeWidth={1.8} />
                </span>
                <p className="text-sm font-medium text-slate-900">{group.title}</p>
              </div>

              <ul className="flex-1 space-y-3 px-5 py-4">
                {group.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[13px] leading-6 text-slate-600">
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={16}
                      strokeWidth={2}
                      className="mt-1 shrink-0 text-brand-700"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Long-term impact */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon
              icon={ChartLineData01Icon}
              size={20}
              strokeWidth={1.8}
              className="text-brand-700"
            />
            <h2 className="text-xl font-semibold text-slate-900">Beyond the first year</h2>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {longTerm.map((item) => (
              <div key={item.title} className="border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 border-l-4 border-brand-700 bg-brand-50 px-4 py-3 text-[13px] leading-6 text-brand-900">
            Deductions are recovered directly from payroll at 0% interest and never exceed one
            third of net salary, so the scheme costs the worker nothing beyond the price of the
            goods.
          </p>
        </div>
      </section>
    </div>
  );
}
