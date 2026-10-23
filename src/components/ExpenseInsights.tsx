
"use client";

import {
    ArrowDownRight,
    ArrowUpRight,
    BrainCircuit,
    CheckCircle2,
    Lightbulb,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Insight = {
  type: "trend" | "category" | "savings";
  title: string;
  message: string;
};

type InsightsResponse = {
  currency: string;
  currentMonthSpent: number;
  previousMonthSpent: number;
  changePercent: number | null;
  topCategory: string | null;
  insights: Insight[];
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const insightConfig = {
  trend: {
    icon: TrendingUp,
    iconClass: "text-blue-300",
    background: "bg-blue-500/15",
    label: "Spending Pattern",
  },
  category: {
    icon: Lightbulb,
    iconClass: "text-amber-300",
    background: "bg-amber-500/15",
    label: "Category Intelligence",
  },
  savings: {
    icon: Target,
    iconClass: "text-emerald-300",
    background: "bg-emerald-500/15",
    label: "Savings Strategy",
  },
};

export default function ExpenseInsights() {
  const [data, setData] = useState<InsightsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/insights", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please sign in to view your insights."
            : "Unable to load expense insights."
        );
      }

      const result: InsightsResponse =
        await response.json();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load insights."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const savingsTarget = data
    ? data.currentMonthSpent * 0.1
    : 0;

  const change = data?.changePercent ?? null;
  const spendingIncreased = change !== null && change > 0;
  const spendingDecreased = change !== null && change < 0;

  // This is a comparison with last month's total,
  // not a user-configured budget.
  const comparisonPercent =
    data && data.previousMonthSpent > 0
      ? Math.min(
          100,
          (data.currentMonthSpent /
            data.previousMonthSpent) *
            100
        )
      : 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
      <div className="relative overflow-hidden px-5 py-7 sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative space-y-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-violet-600 p-3 shadow-lg shadow-violet-900/40">
                <BrainCircuit size={25} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Financial Intelligence
                  </h2>

                  <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
                    Smart Insights
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Personalized analysis of your spending
                  habits, powered by your transaction data.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadInsights()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-violet-400 hover:bg-slate-800 disabled:opacity-50"
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
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          {loading && !data ? (
            <div
              role="status"
              className="flex min-h-52 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70"
            >
              <Sparkles
                size={28}
                className="animate-pulse text-violet-400"
              />
              <p className="text-sm text-slate-400">
                Analyzing your spending patterns...
              </p>
            </div>
          ) : data ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      This Month
                    </p>
                    <Wallet
                      size={19}
                      className="text-violet-400"
                    />
                  </div>

                  <p className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {money.format(data.currentMonthSpent)}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Completed USD expenses
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      Last Month
                    </p>
                    <TrendingUp
                      size={19}
                      className="text-blue-400"
                    />
                  </div>

                  <p className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {money.format(data.previousMonthSpent)}
                  </p>

                  {change === null ? (
                    <p className="mt-2 text-xs text-slate-500">
                      No previous-month spending to compare
                    </p>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      {spendingIncreased ? (
                        <ArrowUpRight
                          size={15}
                          className="text-rose-400"
                        />
                      ) : spendingDecreased ? (
                        <ArrowDownRight
                          size={15}
                          className="text-emerald-400"
                        />
                      ) : (
                        <CheckCircle2
                          size={15}
                          className="text-slate-400"
                        />
                      )}

                      <span
                        className={
                          spendingIncreased
                            ? "text-rose-300"
                            : spendingDecreased
                              ? "text-emerald-300"
                              : "text-slate-400"
                        }
                      >
                        {Math.abs(change).toFixed(1)}%{" "}
                        {spendingIncreased
                          ? "increase"
                          : spendingDecreased
                            ? "decrease"
                            : "change"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-emerald-200/80">
                      Savings Opportunity
                    </p>
                    <Target
                      size={19}
                      className="text-emerald-400"
                    />
                  </div>

                  <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-300 sm:text-3xl">
                    {money.format(savingsTarget)}
                  </p>

                  <p className="mt-2 text-xs text-emerald-200/60">
                    Illustrative 10% reduction target
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">
                      Monthly Spending Comparison
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Current month versus previous full month
                    </p>
                  </div>

                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                    {data.previousMonthSpent > 0
                      ? `${Math.round(
                          (data.currentMonthSpent /
                            data.previousMonthSpent) *
                            100
                        )}% of last month`
                      : "No baseline"}
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label="Current spending as percentage of last month's spending, capped at 100 percent"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(comparisonPercent)}
                  className="mt-5 h-3 overflow-hidden rounded-full bg-slate-700"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-blue-400 transition-all duration-700"
                    style={{
                      width: `${comparisonPercent}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  <span>
                    {money.format(data.currentMonthSpent)}
                  </span>
                  <span>
                    Previous:{" "}
                    {money.format(data.previousMonthSpent)}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles
                    size={20}
                    className="text-violet-400"
                  />
                  <h3 className="text-lg font-semibold">
                    Personalized Recommendations
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {data.insights.map((insight, index) => {
                    const config =
                      insightConfig[insight.type];
                    const Icon = config.icon;

                    return (
                      <article
                        key={`${insight.type}-${index}`}
                        className="group rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 transition duration-200 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-950/30"
                      >
                        <div
                          className={`mb-4 inline-flex rounded-xl p-3 ${config.background}`}
                        >
                          <Icon
                            size={22}
                            className={config.iconClass}
                          />
                        </div>

                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {config.label}
                        </p>

                        <h4 className="mt-2 font-semibold text-white">
                          {insight.title}
                        </h4>

                        <p className="mt-3 text-sm leading-6 text-slate-400">
                          {insight.message}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck
                size={16}
                className="text-emerald-400"
              />
              Insights generated locally from your
              authenticated expense data
            </div>

            <span className="text-xs text-slate-500">
              No paid AI API required
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
