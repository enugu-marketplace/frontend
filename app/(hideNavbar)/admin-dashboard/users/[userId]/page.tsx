import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import axios from "axios";
import { UserDetails } from "@/components/dashboards/admin/UserDetails";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export default async function UserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params; // ✅ await params here

  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "super_admin") {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-red-900">Invalid user ID</p>
        <p className="mt-1 text-[13px] text-red-700">That ID is not in the expected format.</p>
        <Link
          href="/admin-dashboard/users"
          className="mt-3 inline-block h-9 rounded-sm border border-red-300 bg-white px-4 text-[13px] font-medium leading-9 text-red-700 hover:bg-red-50"
        >
          Back to users
        </Link>
      </div>
    );
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user`,
      {
        headers: { 
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json"
        },
        params: { user_id: userId },
        timeout: 5000
      }
    );

    const userData = response.data.data || response.data;

    return (
      <div className="space-y-5">
        <Link
          href="/admin-dashboard/users"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-brand-700"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
          Back to users
        </Link>

        <div>
          <h1 className="text-xl font-semibold text-slate-900">User details</h1>
          <p className="mt-1 text-sm text-slate-600">
            Account, purchasing unit and order activity for this staff member.
          </p>
        </div>

        <UserDetails userData={userData} token={session.user.token} />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch user:", error);

    let errorMessage = "Unknown error occurred";
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        errorMessage = "User not found";
      } else if (error.response?.status === 401) {
        redirect('/admin-login?callbackUrl=/admin-dashboard');
      } else {
        errorMessage = error.response?.data?.message || error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return (
      <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-red-900">Could not load this user</p>
        <p className="mt-1 text-[13px] text-red-700">{errorMessage}</p>
        <Link
          href="/admin-dashboard/users"
          className="mt-3 inline-block h-9 rounded-sm border border-red-300 bg-white px-4 text-[13px] font-medium leading-9 text-red-700 hover:bg-red-50"
        >
          Back to users
        </Link>
      </div>
    );
  }
}
