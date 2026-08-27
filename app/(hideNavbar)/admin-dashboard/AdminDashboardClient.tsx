"use client";

import { Session } from "next-auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ConfirmLogout from "@/components/ConfirmLogout";
import MobileSideBar from "@/components/dashboards/admin/sidebar/MobileSidebar";
import AdminTopbar from "@/components/dashboards/admin/navbar/MobileNavbar";
import Sidebar from "@/components/dashboards/admin/sidebar/Sidebar";

export default function AdminLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  const user = { name: session?.user?.name, email: session?.user?.email };

  return (
    <div className="font-header flex min-h-screen bg-slate-50">
      {/* Desktop sidebar lives in the layout, so it stays mounted between pages */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Sidebar dashboard="super_admin" user={user} />
      </aside>

      <MobileSideBar dashboard="super_admin" session={session} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />

        <main className="flex-1 px-4 py-5 lg:px-6">
          <ConfirmLogout />
          <div className="mx-auto w-full max-w-7xl">{children}</div>
          <ToastContainer position="top-right" autoClose={3000} />
        </main>
      </div>
    </div>
  );
}
