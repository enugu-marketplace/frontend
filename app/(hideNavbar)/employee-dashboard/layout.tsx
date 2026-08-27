import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import EmployeeLayoutClient from "./EmployeeDashboardClient";


export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return redirect("/employee-login?returnUrl=/employee-dashboard");
  }

  if (session.user.role !== "user") {
    return redirect("/");
  }

  return <EmployeeLayoutClient session={session}>{children}</EmployeeLayoutClient>;
}