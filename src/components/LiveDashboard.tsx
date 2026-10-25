
"use client";

import {
  apiFetch,
  getErrorMessage,
} from "@/lib/api-client";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Plus,
  ReceiptText,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type RecentTransaction = {
  id: string;
  description: string;
  amountMinor: number;
  currency: string;
  category: string;
  transactionDate: string;
};

type AnalyticsData = {
  currency: string;
  totalTransactions: number;
  totalSpentMinor: number;
  monthlySpentMinor: number;
  previousMonthSpentMinor: number;
  monthlyChangePercent: number | null;
  recentTransactions: RecentTransaction[];
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatMoney(amountMinor: number) {
  return money.format(amountMinor / 100);
}

export default function LiveDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiFetch<AnalyticsData>(
        "/api/analytics",
        "Unable to load dashboard data.",
        "Please sign in to view your dashboard."
      );

      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    apiFetch<AnalyticsData>(
      "/api/analytics",
      "Unable to load dashboard data.",
      "Please sign in to view your dashboard."
    )
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Something went wrong."));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const change = data?.monthlyChangePercent ?? null;
  const spendingDown = change !== null && change < 0;
  const spendingUp = change !== null && change > 0;

  const comparisonWidth =
    data && data.previousMonthSpentMinor > 0
      ? Math.min(
          100,
          (data.monthlySpentMinor /
            data.previousMonthSpentMinor) *
            100
        )
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles
              size={16}
              className="text-violet-600"
            />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              Financial Overview
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Your Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Every transaction, one clear financial picture.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            <Plus size={17} />
            Add Expense
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-3xl bg-slate-200"
            />
          ))}
        </div>
      ) : !data ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Dashboard data unavailable.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl shadow-violet-200/60">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/15" />
              <div className="pointer-events-none absolute -bottom-16 right-6 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-violet-100">
                    Total Spending
                  </p>
                  <Wallet size={21} className="text-violet-100" />
                </div>

                <p className="mt-6 break-words text-3xl font-extrabold tracking-tight">
                  {formatMoney(data.totalSpentMinor)}
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs text-violet-100">
                  <ArrowUpRight size={15} />
                  All-time USD expenses
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  This Month
                </p>
                <div className="rounded-xl bg-blue-50 p-2.5">
                  <CalendarDays
                    size={20}
                    className="text-blue-600"
                  />
                </div>
              </div>

              <p className="mt-6 break-words text-3xl font-extrabold tracking-tight text-slate-950">
                {formatMoney(data.monthlySpentMinor)}
              </p>

              <p className="mt-5 text-xs text-slate-500">
                Current month USD spending
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Transactions
                </p>
                <div className="rounded-xl bg-emerald-50 p-2.5">
                  <ReceiptText
                    size={20}
                    className="text-emerald-600"
                  />
                </div>
              </div>

              <p className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">
                {data.totalTransactions.toLocaleString("en-IN")}
              </p>

              <p className="mt-5 text-xs text-slate-500">
                Recorded USD expenses
              </p>
            </div>
          </div>

          {/* Comparison and Actions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Monthly Comparison
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Track how your spending changes
                  </p>
                </div>
                <div className="rounded-xl bg-violet-50 p-2.5">
                  {spendingDown ? (
                    <TrendingDown
                      size={20}
                      className="text-emerald-600"
                    />
                  ) : (
                    <TrendingUp
                      size={20}
                      className="text-violet-600"
                    />
                  )}
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Last Month
                  </p>
                  <p className="mt-2 break-words text-xl font-bold text-slate-900">
                    {formatMoney(data.previousMonthSpentMinor)}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl bg-violet-50 p-4">
                  <p className="text-xs font-medium text-violet-600">
                    This Month
                  </p>
                  <p className="mt-2 break-words text-xl font-bold text-violet-950">
                    {formatMoney(data.monthlySpentMinor)}
                  </p>
                </div>
              </div>

              <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-700"
                  style={{
                    width: `${comparisonWidth}%`,
                  }}
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                {spendingDown ? (
                  <TrendingDown
                    size={17}
                    className="text-emerald-600"
                  />
                ) : spendingUp ? (
                  <TrendingUp
                    size={17}
                    className="text-rose-600"
                  />
                ) : null}

                <p
                  className={`text-sm font-medium ${
                    spendingDown
                      ? "text-emerald-700"
                      : spendingUp
                        ? "text-rose-700"
                        : "text-slate-500"
                  }`}
                >
                  {change === null
                    ? "No previous-month spending available."
                    : `${change > 0 ? "+" : ""}${change}% compared with last month`}
                </p>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Current partial month compared with the
                previous full month.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Quick Actions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your financial tools in one place
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-2.5">
                  <CreditCard
                    size={20}
                    className="text-blue-600"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  {
                    label: "Add Manual Expense",
                    description: "Record a new transaction",
                    href: "/expenses/new",
                  },
                  {
                    label: "View Transactions",
                    description: "Explore your payment history",
                    href: "/transactions",
                  },
                  {
                    label: "Explore Analytics",
                    description: "Charts and smart insights",
                    href: "/analytics",
                  },
                  {
                    label: "PayPal Sandbox",
                    description: "Test a secure payment",
                    href: "/payment",
                  },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {action.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {action.description}
                      </p>
                    </div>

                    <ArrowRight
                      size={18}
                      className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-600"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Recent Transactions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your five latest completed expenses
                </p>
              </div>

              <Link
                href="/transactions"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            {data.recentTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <ReceiptText
                  size={32}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-3 text-sm text-slate-500">
                  No expenses yet. Add your first expense
                  to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50">
                        <ReceiptText
                          size={19}
                          className="text-violet-600"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-900">
                          {transaction.description}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {transaction.category}
                          {" • "}
                          {new Date(
                            transaction.transactionDate
                          ).toLocaleDateString("en-US")}
                        </p>
                      </div>
                    </div>

                    <p className="font-bold text-slate-900">
                      {formatMoney(transaction.amountMinor)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
