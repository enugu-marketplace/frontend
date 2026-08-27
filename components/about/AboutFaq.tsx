"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does the salary deduction work?",
    a: (
      <>
        What you spend is deducted from your next salary payment through the government payroll
        integration. The amount comes off after other statutory deductions, and it appears on your
        payslip as a line item.
      </>
    ),
  },
  {
    q: "What can I buy?",
    a: (
      <>
        Household staples such as rice, beans, garri, cooking oil and pasta, along with seasonal
        produce and protein options. Everything on the catalogue is supplied at
        government-approved prices.
      </>
    ),
  },
  {
    q: "Is there a limit on how much I can spend?",
    a: (
      <>
        Yes. Your purchasing unit is capped at one third of your net salary, and your ministry may
        apply its own limit on top of that. Once the unit is used up you can draw on an extension
        buffer of 10% of salary, which is recovered in the following cycle.
      </>
    ),
  },
  {
    q: "How soon do I get my order?",
    a: (
      <>
        Orders are collected from your assigned distribution centre. Timing depends on the centre
        and the delivery run for your ministry, and the status of every order is shown in your
        dashboard.
      </>
    ),
  },
  {
    q: "What if something is wrong with my order?",
    a: (
      <>
        Report it at the point of collection. Wrong or missing items are replaced or credited to
        your account, quality issues are refunded, and delivery problems are escalated to the
        fulfillment office.
      </>
    ),
  },
  {
    q: "Can contract staff use the scheme?",
    a: (
      <>
        It is currently open to permanent civil servants and Enugu State government agency staff
        whose records the scheme can verify. If your verification number is not recognised, contact
        your ministry&rsquo;s scheme officer.
      </>
    ),
  },
];

export default function AboutFaq() {
  return (
    <Accordion type="single" collapsible className="mt-5 border-t border-slate-200">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={faq.q}
          value={`item-${index + 1}`}
          className="border-b border-slate-200"
        >
          <AccordionTrigger className="py-4 text-left text-sm font-medium text-slate-900 hover:no-underline">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-[13px] leading-6 text-slate-600">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
