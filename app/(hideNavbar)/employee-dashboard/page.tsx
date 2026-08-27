import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

import UserChartDialog from '@/components/dashboards/users/UsersChartDialog';
import { OrdersChart } from '@/components/dashboards/users/OrdersChart';
import { LoanStats } from '@/components/dashboards/users/LoanStats';
import ComplianceNotice from '@/components/dashboards/users/ComplianceNotice';

interface ComplianceData {
  id: string;
  loan_unit: number;
  loan_amount_collected: number;
  is_compliance_submitted: boolean;
}

interface ComplianceResponse {
  message: string;
  data: ComplianceData;
}

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.token) {
    redirect('/employee-login?returnUrl=/employee-dashboard');
  }

  // Fetch initial data on server
  let totalOrders = 0;
  let initialLoanData = {
    loan_unit: session?.user?.loan_unit || 0,
    loan_amount_collected: session?.user?.loan_amount_collected || 0
  };
  let complianceStatus = session?.user?.is_compliance_submitted || false;

  try {
    // Fetch orders
    const ordersResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/all-order`, {
      headers: {
        Authorization: `Bearer ${session.user.token}`
      }
    });
    totalOrders = ordersResponse.data.data?.length || 0;

    // Fetch profile data for fresh loan info
    try {
      const complianceResponse = await axios.get<ComplianceResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`
          }
        }
      );

      if (complianceResponse.data?.data) {
        const userData = complianceResponse.data.data;
        initialLoanData = {
          loan_unit: userData.loan_unit || 0,
          loan_amount_collected: userData.loan_amount_collected || 0
        };
        complianceStatus = userData.is_compliance_submitted || false;
      }
    } catch (complianceError) {
      console.log('Using session data for loan info (profile endpoint not available)');
      // Fallback to session data if compliance endpoint fails
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Fallback to session data if there's an error
    totalOrders = 0;
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Your purchasing unit, orders and spending for this salary cycle.
          </p>
        </div>

        <Link
          href="/employee-dashboard/products"
          className="h-9 rounded-sm bg-brand-700 px-4 text-[13px] font-medium leading-9 text-white hover:bg-brand-800"
        >
          Shop products
        </Link>
      </div>

      {!complianceStatus && <ComplianceNotice token={session.user.token} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-slate-500">Total orders</p>
              <p className="mt-1.5 text-2xl font-semibold text-slate-900">{totalOrders}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </span>
          </div>

          <Link
            href="/employee-dashboard/orders"
            className="mt-5 inline-block text-[13px] font-medium text-brand-700 hover:underline"
          >
            View order history
          </Link>
        </div>

        {/* Loan Stats (Client component with auto-refresh) */}
        <LoanStats
          initialLoanUnit={initialLoanData.loan_unit}
          initialLoanTaken={initialLoanData.loan_amount_collected}
          token={session.user.token}
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="min-w-0 flex-1">
          <UserChartDialog />
        </div>
        <div className="min-w-0 flex-1">
          <OrdersChart />
        </div>
      </div>
    </div>
  );
}
