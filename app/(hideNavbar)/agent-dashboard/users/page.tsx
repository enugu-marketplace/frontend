
import { UsersDataFetcher } from "@/components/dashboards/agent/users/UsersDataFetcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreateUserDialog } from "@/components/dashboards/agent/users/CreateUserDialog";
import { UploadUsersDialog } from "@/components/dashboards/agent/users/UploadUsersDialog";
import { ExportLoansDialog } from "@/components/dashboards/agent/users/ExportLoansDialog";
import { ExportExternalOrdersDialog } from "@/components/dashboards/agent/users/ExportExternalOrders";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "fulfillment_officer") {
    return null; 
  }

  return (
    <div className="container py-6 mt-[60px] ">
      <div className="flex items-center sm:flex-row flex-col justify-between mb-6">
        <h1 className="text-[18px] font-bold">User Management</h1>
        <div className="grid md:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-4">
          <CreateUserDialog token={session.user.token} />
          <UploadUsersDialog token={session.user.token} />
          
        </div>
        <div className="grid md:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-4">
         
          <ExportLoansDialog token={session.user.token} />
          {/* <ExportExternalOrdersDialog token={session.user.token} /> */}
        </div>
      </div>
      <UsersDataFetcher />
    </div>
  );
}