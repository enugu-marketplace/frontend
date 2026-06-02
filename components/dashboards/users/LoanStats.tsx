'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

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
    }).format(v || 0);

  useEffect(() => {
    if (hasSwitchedToExtension && !hasShownExtensionSwitchToast.current) {
      toast.warning('Purchasing unit exhausted', {
        description: 'You are now spending from your extension buffer (10% of salary).',
      });
      hasShownExtensionSwitchToast.current = true;
    }
  }, [hasSwitchedToExtension]);

  if (isLoading) return null;

  return (
    <>
      {loanExtension > 0 && (
        <div className="md:col-span-2 lg:col-span-3 sticky top-20 z-10 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">
            Warning: You&apos;re currently using your extension credit.
          </p>
          <p className="text-sm text-amber-800 mt-1">
            {format(loanExtension)} will be deducted from next month&apos;s allocation.
          </p>
        </div>
      )}

      {/* Available Credit */}
      <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              Available Credit
            </h3>
            
          </div>

          <p className="text-2xl font-bold text-gray-900 mt-2">
            {format(available)}
          </p>

          <p className="text-xs text-green-600 mt-1">
            Spendable now
          </p>

          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Purchasing Unit</p>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div
                className={`${loanUnit <= 0 ? 'bg-red-500' : 'bg-green-500'} h-full rounded-full`}
                style={{ width: `${purchasingUnitProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {format(loanUnit)} remaining of {format(totalPurchasingUnit)}
            </p>

            <p className="text-xs text-gray-500 mt-3 mb-1">Extension Buffer</p>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${extensionProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {format(extensionRemaining)} remaining of {format(maxExtensionLimit)}
            </p>
          </div>
        </div>

        <div className="h-11 w-11 rounded-lg bg-orange-50 flex items-center justify-center ml-4">
          <svg
            className="h-6 w-6 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"
            />
          </svg>
        </div>
      </div>

      {/* Extension Buffer */}
      <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between mt-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">
            Extension Buffer
          </h3>

          <p className="text-2xl font-bold text-gray-900 mt-2">
            {format(extensionRemaining)}
          </p>

          <p className="text-xs text-yellow-700 mt-1">
            Extension buffer remaining
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Purchasing unit used this month: {format(purchasingUnitUsed)}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Total borrowed this month: {format(loanTaken)}
          </p>

          {user?.government_entity && (
            <p className="text-xs text-gray-500 mt-2">
              <strong>Entity:</strong> {user.government_entity}
            </p>
          )}

          {/* {user?.salary_per_month && (
            <p className="text-xs text-gray-500">
              <strong>Salary:</strong> {format(user.salary_per_month)}
            </p>
          )} */}
        </div>

        <div className="h-11 w-11 rounded-lg bg-green-50 flex items-center justify-center ml-4">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6" />
          </svg>
        </div>
      </div>
    </>
  );
}
