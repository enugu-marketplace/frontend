import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Rocket01Icon,
  ChartLineData01Icon,
  Alert01Icon,
  Tick02Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";

const phases = [
  {
    label: "Phase 1",
    name: "Pilot programme",
    timing: "3-6 months",
    scope: "Selected ministries and departments",
    objectives: [
      "Test the operational model with a handful of state ministries",
      "Validate GIFMIS integration and the payroll deduction process",
      "Establish the initial supplier network through the Marketing Company",
      "Gather feedback and surface operational problems early",
    ],
    deliverables: [
      "Launch with 500 to 1,000 workers",
      "Basic food categories available to order",
      "First performance metrics and feedback reports",
      "Technical integration documentation",
    ],
  },
  {
    label: "Phase 2",
    name: "Gradual expansion",
    timing: "6-12 months",
    scope: "Additional ministries and departments",
    objectives: [
      "Scale operations on what the pilot taught us",
      "Widen the product range and the supplier base",
      "Refine credit assessment and risk management",
      "Put stronger monitoring and evaluation in place",
    ],
    deliverables: [
      "5,000 to 10,000 workers enrolled",
      "Full catalogue including local produce",
      "Reporting and analytics dashboard",
      "Financial literacy programme for staff",
    ],
  },
  {
    label: "Phase 3",
    name: "Full-scale rollout",
    timing: "12 months onward",
    scope: "All eligible state workers",
    objectives: [
      "Complete rollout to every eligible state worker",
      "Optimise supply chain and distribution networks",
      "Reach the target economic impact on local agriculture",
      "Establish a long-term sustainability framework",
    ],
    deliverables: [
      "Scheme open to all state workers",
      "Mature supplier and distribution network",
      "Full impact assessment report",
      "A framework other states can replicate",
    ],
  },
];

const requirements = [
  {
    title: "Executive support",
    body: "Sustained backing from state leadership, with a steering committee that can clear blockers between ministries.",
  },
  {
    title: "Worker buy-in",
    body: "Staff need to understand the terms before they enrol, which depends on plain communication and a helpdesk that answers.",
  },
  {
    title: "Supplier network",
    body: "Enough vetted local suppliers to hold prices and keep essential items in stock through the year.",
  },
  {
    title: "Technical infrastructure",
    body: "Reliable GIFMIS integration, tested backups, and a support team that can respond to failures quickly.",
  },
  {
    title: "Performance monitoring",
    body: "Enrollment, repayment and satisfaction tracked continuously rather than reconstructed after the fact.",
  },
  {
    title: "Legal compliance",
    body: "Deductions operated within the Nigerian Labour Act, with documented consent and data protection safeguards.",
  },
];

const reporting = [
  {
    title: "Monthly",
    items: [
      "Beneficiary enrollment and disbursements",
      "Repayment rates and delinquency tracking",
      "Financial performance metrics",
    ],
  },
  {
    title: "Quarterly",
    items: [
      "Worker satisfaction surveys",
      "Local economic impact assessment",
      "Supplier performance evaluation",
    ],
  },
];

const risks = [
  {
    title: "Technical",
    items: [
      "GIFMIS integration built with fallback mechanisms",
      "Regular system audits and performance testing",
      "Backup and disaster recovery protocols",
      "A technical support team on call for incidents",
    ],
  },
  {
    title: "Financial",
    items: [
      "Credit assessment applied to every participant",
      "Gradual scaling to limit financial exposure",
      "Reserve fund held against defaults",
      "Routine financial health checks and audits",
    ],
  },
  {
    title: "Operational",
    items: [
      "Pilot used to find operational problems first",
      "Training for everyone who touches the process",
      "Documented standard operating procedures",
      "Alternative suppliers to absorb disruption",
    ],
  },
  {
    title: "Compliance",
    items: [
      "Legal reviews against the Nigerian Labour Act",
      "Transparent consent from every participant",
      "Data protection and privacy safeguards",
      "Terms communicated plainly to all workers",
    ],
  },
];

const contingencies = [
  {
    title: "If participation is low",
    items: [
      "Communication campaign focused on the concrete benefit",
      "Incentives for early adopters",
      "A simpler enrollment process",
      "Focus groups to understand what is holding staff back",
    ],
  },
  {
    title: "If supply is disrupted",
    items: [
      "More than one supplier per product category",
      "Buffer stock held for essential items",
      "Local producer development programme",
      "Alternative distribution channels",
    ],
  },
  {
    title: "Government engagement",
    items: [
      "Regular progress reporting to all ministries",
      "A liaison officer designated per department",
      "Executive steering committee for oversight",
      "Clear escalation pathways for issues",
    ],
  },
  {
    title: "Worker communication",
    items: [
      "Multi-channel communication strategy",
      "Regular feedback mechanisms and surveys",
      "Transparent reporting of scheme performance",
      "A dedicated helpdesk for queries",
    ],
  },
];

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-slate-600">
          <HugeiconsIcon
            icon={Tick02Icon}
            size={15}
            strokeWidth={2}
            className="mt-1 shrink-0 text-brand-700"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ImplementationRoadmap() {
  return (
    <div className="font-header bg-white">
      {/* Intro */}
      <section className="border-b border-slate-200 bg-brand-900">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <p className="flex items-center gap-2 text-[13px] font-medium text-leaf-400">
            <HugeiconsIcon icon={Rocket01Icon} size={15} strokeWidth={2} />
            Implementation roadmap
          </p>

          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white lg:text-4xl">
            How the scheme is being rolled out.
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-brand-100/85">
            A phased rollout: prove the model with a small group, expand on what it teaches, then
            open the scheme to every eligible state worker.
          </p>
        </div>
      </section>

      {/* Phases */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
        <h2 className="text-xl font-semibold text-slate-900">The three phases</h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {phases.map((phase) => (
            <div key={phase.label} className="flex flex-col border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                  {phase.label}
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">{phase.name}</p>
                <p className="mt-1 text-[12px] text-slate-500">
                  {phase.timing} &middot; {phase.scope}
                </p>
              </div>

              <div className="flex-1 space-y-4 px-5 py-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                    Objectives
                  </p>
                  <div className="mt-2">
                    <BulletList items={phase.objectives} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                    Deliverables
                  </p>
                  <div className="mt-2">
                    <BulletList items={phase.deliverables} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What it depends on */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon
              icon={Shield01Icon}
              size={20}
              strokeWidth={1.8}
              className="text-brand-700"
            />
            <h2 className="text-xl font-semibold text-slate-900">What it depends on</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Six conditions the rollout cannot succeed without.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requirements.map((requirement) => (
              <div key={requirement.title} className="border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-900">{requirement.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">{requirement.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Measurement */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon
            icon={ChartLineData01Icon}
            size={20}
            strokeWidth={1.8}
            className="text-brand-700"
          />
          <h2 className="text-xl font-semibold text-slate-900">How progress is measured</h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reporting.map((cycle) => (
            <div key={cycle.title} className="border border-slate-200 bg-white">
              <p className="border-b border-slate-200 px-5 py-3 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
                {cycle.title} reporting
              </p>
              <div className="px-5 py-4">
                <BulletList items={cycle.items} />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 border-l-4 border-brand-700 bg-brand-50 px-4 py-3 text-[13px] leading-6 text-brand-900">
          Reviews feed back into the rollout: operational fixes are applied within the current
          phase, while findings that challenge the model itself go to the steering committee before
          the next phase opens.
        </p>
      </section>

      {/* Risk */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon
              icon={Alert01Icon}
              size={20}
              strokeWidth={1.8}
              className="text-amber-600"
            />
            <h2 className="text-xl font-semibold text-slate-900">Risks and how they are handled</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {risks.map((risk) => (
              <div key={risk.title} className="border border-slate-200 bg-white">
                <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-800">
                  {risk.title}
                </p>
                <div className="px-4 py-3">
                  <BulletList items={risk.items} />
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-10 text-base font-semibold text-slate-900">Contingencies</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {contingencies.map((plan) => (
              <div key={plan.title} className="border border-slate-200 bg-white">
                <p className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-800">
                  {plan.title}
                </p>
                <div className="px-4 py-3">
                  <BulletList items={plan.items} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white p-6">
          <div>
            <p className="text-base font-semibold text-slate-900">
              Eligible for the scheme?
            </p>
            <p className="mt-1 text-[13px] text-slate-600">
              Sign in with your verification number to see your purchasing unit.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/employee-login"
              className="flex h-11 items-center rounded-sm bg-brand-700 px-5 text-sm font-medium text-white hover:bg-brand-800"
            >
              Sign in
            </Link>
            <Link
              href="/about"
              className="flex h-11 items-center rounded-sm border border-slate-300 px-5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
            >
              About the scheme
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
