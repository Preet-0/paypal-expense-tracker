
"use client";

import {
    CheckCircle2,
    CreditCard,
    Download,
    ReceiptText,
    RefreshCw,
    ShieldCheck,
    Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type PayPalPayment = {
  orderId: string;
  description: string;
  amount: string;
  currency: string;
  createdAt: string;
};

type PayPalAnalytics = {
  currency: string;
  totalSpent: string;
  totalPayments: number;
  recentPayments: PayPalPayment[];
};

function formatAmount(amount: string, currency: string) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return `${currency} ${amount}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(numericAmount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export default function PayPalTransactions() {
  const [data, setData] = useState<PayPalAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/analytics/paypal",
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please sign in to view PayPal transactions."
            : `Failed to load payments (${response.status})`
        );
      }

      const result: PayPalAnalytics =
        await response.json();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payments"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
              PayPal Sandbox
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            PayPal Transactions
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Completed Sandbox payments recorded in PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/paypal/export"
            download="paypal-transactions.csv"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            <Download size={16} />
            Download CSV
          </a>

          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}

          <button
            type="button"
            onClick={() => void loadPayments()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>

          <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      ) : data ? (
        <>

{/* Summary Cards */}
<div className="grid gap-5 sm:grid-cols-2">
  {/* Total PayPal Spending */}
  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg shadow-violet-500/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/20">
    {/* Decorative background */}
    <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-indigo-300/10 blur-2xl" />

    <div className="relative z-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-100">
            Total PayPal Spending
          </p>
          <p className="mt-1 text-xs text-violet-200">
            Your Sandbox payment volume
          </p>
        </div>

        <div className="rounded-2xl bg-white/15 p-3">
          <Wallet size={22} className="text-white" />
        </div>
      </div>

      <p className="mt-7 break-words text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        {formatAmount(data.totalSpent, data.currency)}
      </p>

      <div className="mt-5 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
        <p className="text-xs font-medium text-violet-100">
          Completed Sandbox transactions
        </p>
      </div>
    </div>
  </div>

  {/* Completed Payments */}
  <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(15,23,42,0.09)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Completed Payments
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Successfully recorded payments
        </p>
      </div>

      <div className="rounded-2xl bg-emerald-50 p-3">
        <ShieldCheck
          size={22}
          className="text-emerald-600"
        />
      </div>
    </div>

    <p className="mt-7 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
      {data.totalPayments.toLocaleString("en-IN")}
    </p>

    <div className="mt-5 flex items-center gap-2">
      <CheckCircle2 size={15} className="text-emerald-600" />
      <p className="text-xs font-medium text-emerald-700">
        PayPal Sandbox · Completed
      </p>
    </div>
  </div>
</div>


          {/* Transaction List */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  Payment History
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Recent completed PayPal Sandbox payments
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                Completed
              </div>
            </div>

            {data.recentPayments.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                  <ReceiptText
                    size={26}
                    className="text-violet-500"
                  />
                </div>

                <h4 className="mt-4 font-semibold text-slate-900">
                  No PayPal payments yet
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  Completed Sandbox payments will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentPayments.map((payment) => (
                  <div
                    key={payment.orderId}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-violet-50/40 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50">
                        <CreditCard
                          size={21}
                          className="text-violet-600"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-900">
                          {payment.description}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(
                            payment.createdAt
                          ).toLocaleString("en-IN")}
                        </p>

                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 size={13} />
                          PayPal · Completed
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-slate-950">
                        {formatAmount(
                          payment.amount,
                          payment.currency
                        )}
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-slate-400">
                        {payment.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Payment data is unavailable.
        </div>
      )}
    </section>
  );
}
