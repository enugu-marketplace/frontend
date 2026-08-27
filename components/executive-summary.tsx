import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Target02Icon,
  Wallet01Icon,
  Leaf01Icon,
  Shield01Icon,
  Agreement01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

const objectives = [
  "Provide accessible, affordable food items to Enugu State workers",
  "Use the state payroll system for efficient, secure repayment",
  "Stimulate local economic activity by favouring locally produced food",
  "Improve the welfare and productivity of the state civil service",
];

const model = [
  {
    icon: Shield01Icon,
    title: "Payroll integration",
    body: "Deductions run through the existing GIFMIS payroll system, so recovery is automatic and no separate collection process is needed.",
  },
  {
    icon: Agreement01Icon,
    title: "Legal compliance",
    body: "Deductions stay within the Nigerian Labour Act limit of one third of salary, with documented consent from every participant.",
  },
  {
    icon: Leaf01Icon,
    title: "Local sourcing",
    body: "Supply is weighted towards locally produced agricultural goods through the Enugu State Marketing Company.",
  },
];

const ExecutiveSummary = () => {
  return (
    <div className="font-header bg-white">
      {/* Intro */}
      <section className="border-b border-slate-200 bg-brand-900">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <p className="flex items-center gap-2 text-[13px] font-medium text-leaf-400">
            <HugeiconsIcon icon={Target02Icon} size={15} strokeWidth={2} />
            Executive summary
          </p>

          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white lg:text-4xl">
            A food loan scheme financed by the state.
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-brand-100/85">
            Workers take home essential food items immediately and repay from salary at 0%
            interest, deducted by the Office of the Accountant General of Enugu State.
          </p>
        </div>
      </section>

      {/* The proposal */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">The proposal</h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">
              <p>
                This is a scheme directly financed by the Enugu State Government and built for its
                own workers. Staff acquire essential food items up front and repay through{" "}
                <span className="font-medium text-slate-900">interest-free salary deductions</span>{" "}
                handled by the Accountant General.
              </p>
              <p>
                The objectives are twofold. First, improve daily life for civil servants by making
                food accessible and affordable without recourse to informal lenders. Second, direct
                that consumer spending towards local agricultural producers and food businesses
                rather than out of the state.
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-base font-semibold text-slate-900">Strategic objectives</h3>
              <ol className="mt-4 space-y-3">
                {objectives.map((objective, index) => (
                  <li
                    key={objective}
                    className="flex items-start gap-3 border border-slate-200 bg-white px-4 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-brand-700 text-[12px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-[13px] leading-6 text-slate-700">{objective}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-slate-200 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <HugeiconsIcon icon={Wallet01Icon} size={20} strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-900">Direct state financing</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                The state government funds the scheme directly, which keeps it aligned with welfare
                and economic development objectives. The state carries the credit risk, mitigated
                by recovery through payroll.
              </p>
            </div>

            <div className="border border-slate-200 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <HugeiconsIcon icon={Leaf01Icon} size={20} strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-900">Local economic impact</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Prioritising locally produced items through the Enugu State Marketing Company links
                worker consumption to local production, supporting the agricultural value chain
                directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Operating model */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
          <h2 className="text-xl font-semibold text-slate-900">How it operates</h2>
          <p className="mt-1 text-sm text-slate-600">
            Three components of the operating model, chosen to work with systems the state already
            runs.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {model.map((item) => (
              <div key={item.title} className="border border-slate-200 bg-white p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                  <HugeiconsIcon icon={item.icon} size={20} strokeWidth={1.8} />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-900">{item.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 flex items-start gap-2.5 border-l-4 border-brand-700 bg-brand-50 px-4 py-3 text-[13px] leading-6 text-brand-900">
            <HugeiconsIcon
              icon={Tick02Icon}
              size={16}
              strokeWidth={2}
              className="mt-0.5 shrink-0"
            />
            Because repayment rides on payroll and supply runs through an existing state company,
            the scheme adds little operational overhead to either side.
          </p>
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white p-6">
          <div>
            <p className="text-base font-semibold text-slate-900">Read the detail</p>
            <p className="mt-1 text-[13px] text-slate-600">
              The rollout plan sets out phases, dependencies and how risk is handled.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/implementation"
              className="flex h-11 items-center rounded-sm bg-brand-700 px-5 text-sm font-medium text-white hover:bg-brand-800"
            >
              Implementation roadmap
            </Link>
            <Link
              href="/benefits"
              className="flex h-11 items-center rounded-sm border border-slate-300 px-5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
            >
              Benefits
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExecutiveSummary;
