'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Wallet01Icon, Alert01Icon, ChartLineData01Icon } from '@hugeicons/core-free-icons';

interface ComplianceData {
  id: string;
  loan_unit: number;
  loan_amount_collected: number;
  loan_extension?: number;
  max_extension_limit?: number;
  salary_per_month: number;
  government_entity: string;
  is_compliance_submitted: boolean;
  status: string;
  updatedAt: string;
}

interface ComplianceResponse {
  message: string;
  data: ComplianceData;
}

interface LoanStatsProps {
  initialLoanUnit: number;
  initialLoanTaken: number;
  token: string;
}

export function LoanStats({
  initialLoanUnit,
  initialLoanTaken,
  token,
}: LoanStatsProps) {
  const hasShownExtensionSwitchToast = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-data', token],
    queryFn: async (): Promise<ComplianceData | null> => {
      try {
        const res = await axios.get<ComplianceResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data.data ?? null;
      } catch {
        return null;
      }
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const user = data;
  const loanUnit = user?.loan_unit ?? initialLoanUnit;
  const loanTaken = user?.loan_amount_collected ?? initialLoanTaken;
  const loanExtension = Number(user?.loan_extension ?? 0);
  const maxExtensionLimit = Number(user?.max_extension_limit ?? 0);
  const totalPurchasingUnit = Number(user?.salary_per_month ?? 0) * 0.3;
  const purchasingUnitUsed = Math.max(0, totalPurchasingUnit - loanUnit);
  const extensionRemaining = Math.max(0, maxExtensionLimit - loanExtension);
  const purchasingUnitProgress = totalPurchasingUnit > 0
    ? Math.min(100, (loanUnit / totalPurchasingUnit) * 100)
    : 0;
  const extensionProgress = maxExtensionLimit > 0
    ? Math.min(100, (extensionRemaining / maxExtensionLimit) * 100)
    : 0;
  const available = Math.max(0, loanUnit + extensionRemaining);
  const hasSwitchedToExtension = loanUnit <= 0 && extensionRemaining > 0;

  const format = (v: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(v || 0);

  useEffect(() => {
    if (hasSwitchedToExtension && !hasShownExtensionSwitchToast.current) {
      toast.warning('Purchasing unit exhausted', {
        description: 'You are now spending from your extension buffer (10% of salary).',
      });
      hasShownExtensionSwitchToast.current = true;
    }
  }, [hasSwitchedToExtension]);

  if (isLoading) {
    return (
      <>
        {[0, 1].map((i) => (
          <div key={i} className="border border-slate-200 bg-white p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-7 w-32 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 h-1.5 w-full animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {loanExtension > 0 && (
        <div className="flex items-start gap-2.5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 md:col-span-2 lg:col-span-3">
          <HugeiconsIcon
            icon={Alert01Icon}
            size={18}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0 text-amber-600"
          />
          <div className="text-sm text-amber-900">
            <p className="font-medium">You are spending from your extension credit.</p>
            <p className="mt-0.5 text-amber-800">
              {format(loanExtension)} will be deducted from next month&apos;s allocation.
            </p>
          </div>
        </div>
      )}

      {/* Available credit */}
      <div className="border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-slate-500">Available to spend</p>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">{format(available)}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <HugeiconsIcon icon={Wallet01Icon} size={20} strokeWidth={1.8} />
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-slate-600">Purchasing unit</span>
              <span className="text-slate-500">
                {format(loanUnit)} of {format(totalPurchasingUnit)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${loanUnit <= 0 ? 'bg-red-500' : 'bg-brand-600'}`}
                style={{ width: `${purchasingUnitProgress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-slate-600">Extension buffer</span>
              <span className="text-slate-500">
                {format(extensionRemaining)} of {format(maxExtensionLimit)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${extensionProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* This month */}
      <div className="border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-slate-500">Spent this month</p>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">{format(loanTaken)}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <HugeiconsIcon icon={ChartLineData01Icon} size={20} strokeWidth={1.8} />
          </span>
        </div>

        <dl className="mt-5 space-y-2 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Purchasing unit used</dt>
            <dd className="font-medium text-slate-800">{format(purchasingUnitUsed)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Extension used</dt>
            <dd className="font-medium text-slate-800">{format(loanExtension)}</dd>
          </div>
          {user?.government_entity && (
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-2">
              <dt className="text-slate-500">Entity</dt>
              <dd className="truncate font-medium text-slate-800">{user.government_entity}</dd>
            </div>
          )}
        </dl>
      </div>
    </>
  );
}
