
"use client";

import {
    ArrowUpRight,
    CreditCard,
    ReceiptText,
    RefreshCw,
    ShieldCheck,
    TrendingUp,
    Wallet,
} from "lucide-react";
import Link from "next/link";
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
  averagePayment: string;
  recentPayments: PayPalPayment[];
};

function formatUSD(value: string) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    : value;
}

export default function PayPalDashboard() {
  const [data, setData] = useState<PayPalAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
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
            ? "Please sign in to view PayPal analytics."
            : `Unable to load PayPal data (${response.status})`
        );
      }

      const result: PayPalAnalytics =
        await response.json();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load PayPal analytics"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const cards = data
    ? [
        {
          title: "Total USD Spending",
          value: formatUSD(data.totalSpent),
          icon: Wallet,
          color: "text-violet-600",
          background: "bg-violet-50",
        },
        {
          title: "Completed Payments",
          value: data.totalPayments.toLocaleString("en-IN"),
          icon: CreditCard,
          color: "text-emerald-600",
          background: "bg-emerald-50",
        },
        {
          title: "Average Payment",
          value: formatUSD(data.averagePayment),
          icon: TrendingUp,
          color: "text-blue-600",
          background: "bg-blue-50",
        },
        {
          title: "Currency",
          value: data.currency,
          icon: ShieldCheck,
          color: "text-amber-600",
          background: "bg-amber-50",
        },
      ]
    : [];

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              PayPal Sandbox
            </p>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Payment Analytics
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Completed USD payments recorded in PostgreSQL.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAnalytics()}
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

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-3xl bg-slate-200"
            />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className={
                    index === 0
                      ? "relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg shadow-violet-200/50"
                      : "rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={
                        index === 0
                          ? "text-sm font-medium text-violet-100"
                          : "text-sm font-medium text-slate-500"
                      }
                    >
                      {card.title}
                    </p>

                    <div
                      className={
                        index === 0
                          ? "rounded-xl bg-white/15 p-2.5"
                          : `rounded-xl p-2.5 ${card.background}`
                      }
                    >
                      <Icon
                        size={19}
                        className={
                          index === 0
                            ? "text-white"
                            : card.color
                        }
                      />
                    </div>
                  </div>

                  <p
                    className={`mt-6 break-words text-2xl font-extrabold tracking-tight ${
                      index === 0
                        ? "text-white"
                        : "text-slate-950"
                    }`}
                  >
                    {card.value}
                  </p>

                  <p
                    className={
                      index === 0
                        ? "mt-3 text-xs text-violet-100"
                        : "mt-3 text-xs text-slate-400"
                    }
                  >
                    {index === 0
                      ? "PayPal Sandbox transactions"
                      : "Based on completed payments"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  Recent PayPal Payments
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your latest recorded Sandbox payments
                </p>
              </div>

              <Link
                href="/transactions"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700"
              >
                View transactions
                <ArrowUpRight size={16} />
              </Link>
            </div>

            {data.recentPayments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ReceiptText
                  size={32}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-3 text-sm text-slate-500">
                  No completed Sandbox payments yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentPayments.map((payment) => (
                  <div
                    key={payment.orderId}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50">
                        <CreditCard
                          size={19}
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
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {payment.currency === "USD"
                          ? formatUSD(payment.amount)
                          : `${payment.currency} ${payment.amount}`}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
