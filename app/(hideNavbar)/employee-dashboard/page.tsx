import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserChartDialog from '@/components/dashboards/users/UsersChartDialog';
import { OrdersChart } from '@/components/dashboards/users/OrdersChart';
import axios from 'axios';
import { LoanStats } from '@/components/dashboards/users/LoanStats'; 

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
    redirect('/login');
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
      console.log('⚠️ Using session data for loan info (profile endpoint not available)');
      // Fallback to session data if compliance endpoint fails
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Fallback to session data if there's an error
    totalOrders = 0;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Welcome, {session?.user?.name}</h1>
      {!complianceStatus && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-yellow-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.103 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <p className="text-sm text-yellow-800">
              Please complete your <a href="/employee-dashboard/compliance" className="font-medium underline">compliance form</a> to activate your purchasing limit.
            </p>
          </div>
        </div>
      )}
     
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Orders (Server component) */}
         <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between">
  <div>
    <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
    <p className="text-2xl font-bold text-gray-900 mt-2">
      {totalOrders}
    </p>
  </div>

  <div className="h-11 w-11 rounded-lg bg-green-50 flex items-center justify-center">
    <svg
      className="h-6 w-6 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  </div>
</div>


          {/* Loan Stats (Client component with auto-refresh) */}
          <LoanStats 
            initialLoanUnit={initialLoanData.loan_unit}
            initialLoanTaken={initialLoanData.loan_amount_collected}
            token={session.user.token}
          />
        </div>
        <div className='my-6 flex md:flex-row flex-col justify-between gap-4'>
          <UserChartDialog />
          <OrdersChart />
        </div>
      </div>
    </div>
  );
}