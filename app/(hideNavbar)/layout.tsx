import type { Metadata } from "next";

//@ts-ignore
import "../globals.css";
import Providers from "@/providers/Providers";
import Header from "@/components/Header";
import StatusCheckWrapper from "@/components/StatusCheckWrapper";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { outfit } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Enugu Food Scheme",
  description: "Food Loan Scheme for Enugu State Workers",
  icons: {
    icon: [
      { url: "/logo-mark.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body suppressHydrationWarning className="font-header antialiased">
        <Providers>
         
          <Toaster position="top-right" richColors style={{ zIndex: 10000 }} />
          <Suspense fallback={<div>Loading...</div>}>
            <StatusCheckWrapper>{children}</StatusCheckWrapper>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}