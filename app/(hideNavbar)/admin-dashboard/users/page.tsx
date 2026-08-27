
import { UsersDataFetcher } from "@/components/dashboards/admin/users/UsersDataFetcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreateUserDialog } from "@/components/dashboards/admin/users/CreateUserDialog";
import { UploadUsersDialog } from "@/components/dashboards/admin/users/UploadUsersDialog";


export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "super_admin") {
    return null; 
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-600">
            Civil servants enrolled in the scheme, with their purchasing units and balances.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <CreateUserDialog token={session.user.token} />
          <UploadUsersDialog token={session.user.token} />
        </div>
      </div>

      <UsersDataFetcher />
    </div>
  );
}
