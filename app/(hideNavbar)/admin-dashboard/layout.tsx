import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminLayoutClient from "./AdminDashboardClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return redirect("/admin-login?callbackUrl=/admin-dashboard");
  }

  if (session.user.role !== "super_admin") {
    return redirect("/");
  }

  return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>;
}