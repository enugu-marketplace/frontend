'use client';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ShowProfile() {
const { data: clientSession, status } = useSession();
  const [serverUser, setServerUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(setServerUser)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, []);

const user = clientSession?.user || serverUser;

  if (!user) return null;

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    const parts = name.split(' ').filter(Boolean);
    return parts.map(n => n[0]).join('').toUpperCase();
  };

  const handleDashboardClick = () => {
    if (user?.role === 'super_admin') {
      router.push('/admin-dashboard');
    } 

     else if (user?.role === 'fulfillment_officer') {
      router.push('/agent-dashboard');
    } 

    else if (user?.role === 'cashier') {
      router.push('/cashier-dashboard');
    } 

    
     else {
      router.push('/employee-dashboard');
    }
  };

  return (
    <div
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100"
      onClick={handleDashboardClick}
    >
      <p className="hidden text-[13px] font-medium text-slate-700 sm:block">My dashboard</p>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-[13px] font-semibold text-brand-800 ring-1 ring-brand-200">
        {getInitials(user?.name)}
      </div>
    </div>
  );
}