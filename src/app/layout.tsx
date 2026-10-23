
import AppSidebar from "@/components/app-sidebar";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayTrack | Smart Expense Manager",
  description:
    "Track payments, analyze expenses, and understand your finances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F7FB] text-slate-900 antialiased">
        <div className="min-h-screen bg-[#F5F7FB] lg:flex">
          <AppSidebar />

          <main className="min-w-0 flex-1 px-4 py-6 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
