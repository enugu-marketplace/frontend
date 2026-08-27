

import React from "react";
import { CreateFulfillmentOfficerDialog } from "@/components/dashboards/admin/agents/CreateFullfillmemtAgent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await getServerSession(authOptions);
  
  // Redirect if not authenticated
  if (!session) {
    redirect('/admin-login?callbackUrl=/admin-dashboard');
  }
  
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Fulfillment agents</h1>
          <p className="mt-1 text-sm text-slate-600">Officers who verify deliveries and hand orders over to staff.</p>
        </div>

        <CreateFulfillmentOfficerDialog token={session.user?.token || undefined} />
      </div>

      
    </div>
  );
}

export default Page;
