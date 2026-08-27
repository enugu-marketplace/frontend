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
  title: "Enugu Market | Enugu State Food Scheme",
  description:
    "Official Enugu State food scheme marketplace - quality staples at government approved prices, paid from your salary at 0% interest.",
  icons: {
    icon: [
      { url: "/logo-mark.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/logo-mark.svg",
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
          <Header />
          <Toaster position="top-right" richColors />
          <Suspense fallback={<div>Loading...</div>}>
            <StatusCheckWrapper>{children}</StatusCheckWrapper>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}