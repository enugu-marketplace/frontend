"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';
import Footer from '@/components/Footer'
import ProductInstance from '@/components/product-instance'

const Page = () => {
  useEffect(() => {
    // Show toast message when component mounts
    toast.info(
      <div className="flex items-start gap-3">
        <div className="flex flex-col">
          <span className="font-bold text-base">Enugu State Government</span>
          <span className="text-sm mt-1">This platform is exclusively for verified civil servants of Enugu State</span>
        </div>
      </div>,
      {
        duration: 8000, // Show for 8 seconds
        position: 'top-center',
        style: {
          background: '#008000',
          color: 'white',
          border: 'none',
        }
      }
    );
  }, []);

  return (
    <div className="bg-[#f8f4ea] text-slate-900">
      <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(24,119,70,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,177,131,0.2),_transparent_24%),linear-gradient(180deg,_#f8f4ea_0%,_#f4efe3_22%,_#ffffff_100%)]">
        <ProductInstance />
      </main>

      <Footer />
    </div>
  )
}

export default Page