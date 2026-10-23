
"use client";

import {
  ArrowUpRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Make Payment",
    href: "/payment",
    icon: CreditCard,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: ReceiptText,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: PieChart,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex h-24 items-center justify-between border-b border-white/10 px-6">
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40">
            <Wallet size={23} className="text-white" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              PayTrack
            </h1>
            <p className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-400">
              EXPENSE INTELLIGENCE
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={closeMobileMenu}
          aria-label="Close navigation"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-7">
        <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>

        <nav
          aria-label="Main navigation"
          className="space-y-1.5"
        >
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-violet-600/20 text-violet-200 shadow-inner shadow-violet-950/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-violet-400" />
                )}

                <Icon
                  size={19}
                  className={
                    active
                      ? "text-violet-300"
                      : "text-slate-400 transition group-hover:text-white"
                  }
                />

                <span>{item.name}</span>

                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Smart Insights Card */}
        <div className="mt-9 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/15 to-indigo-600/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-violet-500/20 p-2">
              <Sparkles
                size={17}
                className="text-violet-300"
              />
            </div>

            <span className="text-sm font-semibold text-white">
              Smart Insights
            </span>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            Discover spending patterns and personalized
            recommendations from your expenses.
          </p>

          <Link
            href="/analytics"
            onClick={closeMobileMenu}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition hover:text-violet-200"
          >
            Explore Insights
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-5">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={17}
            className="text-emerald-400"
          />

          <span className="text-xs font-medium text-slate-400">
            PayPal Sandbox Mode
          </span>
        </div>

        <p className="mt-2 text-[11px] text-slate-600">
          Hackathon Demo • PayTrack
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-lg lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-2.5"
        >
          <div className="rounded-xl bg-violet-600 p-2 text-white">
            <Wallet size={19} />
          </div>

          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            PayTrack
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
        >
          <Menu size={21} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <aside
            id="mobile-sidebar"
            aria-label="Mobile sidebar"
            className="absolute inset-y-0 left-0 flex w-[min(85vw,290px)] flex-col bg-[#0F172A] shadow-2xl"
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-[#0F172A] lg:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
