
"use client";

import ExpenseInsights from "@/components/ExpenseInsights";
import PayPalMonthlyChart from "@/components/PayPalMonthlyChart";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartTransaction = {
  date: string;
  amountMinor: number;
  category: string;
};

type Analytics = {
  currency: string;
  generatedAt: string;
  totalTransactions: number;
  totalSpentMinor: number;
  monthlySpentMinor: number;
  previousMonthSpentMinor: number;
  monthlyChangePercent: number | null;

  categoryBreakdown: {
    name: string;
    amountMinor: number;
  }[];

  dailySpending: {
    date: string;
    amountMinor: number;
  }[];

  chartTransactions: ChartTransaction[];

  recentTransactions: {
    id: string;
    description: string;
    amountMinor: number;
    currency: string;
    category: string;
    transactionDate: string;
  }[];
};

type TrendRange = "7D" | "30D" | "3M" | "6M";

type CategoryRange =
  | "TODAY"
  | "7D"
  | "1M"
  | "3M"
  | "ALL";

const COLORS = [
  "#8B5CF6",
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const DAY_MS = 86400000;

function formatMoney(amountMinor: number) {
  return money.format(amountMinor / 100);
}

function getUTCDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfUTCDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
}

function daysAgoStart(now: Date, days: number) {
  return new Date(
    startOfUTCDay(now).getTime() -
      (days - 1) * DAY_MS
  );
}

// Subtract calendar months safely.
// For example, March 31 minus one month
// becomes February 28 or 29.
function monthsAgoStart(now: Date, months: number) {
  const today = startOfUTCDay(now);

  const targetFirst = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth() - months,
      1
    )
  );

  const lastDay = new Date(
    Date.UTC(
      targetFirst.getUTCFullYear(),
      targetFirst.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  return new Date(
    Date.UTC(
      targetFirst.getUTCFullYear(),
      targetFirst.getUTCMonth(),
      Math.min(today.getUTCDate(), lastDay)
    )
  );
}

function getTrendStart(
  range: TrendRange,
  now: Date
) {
  switch (range) {
    case "7D":
      return daysAgoStart(now, 7);

    case "30D":
      return daysAgoStart(now, 30);

    case "3M":
      return monthsAgoStart(now, 3);

    case "6M":
      return monthsAgoStart(now, 6);
  }
}

function getCategoryStart(
  range: CategoryRange,
  now: Date
) {
  switch (range) {
    case "TODAY":
      return startOfUTCDay(now);

    case "7D":
      return daysAgoStart(now, 7);

    case "1M":
      return daysAgoStart(now, 30);

    case "3M":
      return monthsAgoStart(now, 3);

    case "ALL":
      return null;
  }
}

function createTrendData(
  transactions: ChartTransaction[],
  range: TrendRange,
  now: Date
) {
  const start = getTrendStart(range, now);
  const today = startOfUTCDay(now);

  const startDate = getUTCDate(start);
  const todayDate = getUTCDate(today);

  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (
      transaction.date < startDate ||
      transaction.date > todayDate
    ) {
      continue;
    }

    totals.set(
      transaction.date,
      (totals.get(transaction.date) ?? 0) +
        transaction.amountMinor
    );
  }

  const points: {
    date: string;
    label: string;
    amount: number;
  }[] = [];

  for (
    let timestamp = start.getTime();
    timestamp <= today.getTime();
    timestamp += DAY_MS
  ) {
    const date = getUTCDate(new Date(timestamp));

    points.push({
      date,
      label: date.slice(5),
      amount: (totals.get(date) ?? 0) / 100,
    });
  }

  return points;
}

function createCategoryData(
  transactions: ChartTransaction[],
  range: CategoryRange,
  now: Date
) {
  const start = getCategoryStart(range, now);

  const startDate = start
    ? getUTCDate(start)
    : null;

  const todayDate = getUTCDate(
    startOfUTCDay(now)
  );

  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (
      startDate &&
      transaction.date < startDate
    ) {
      continue;
    }

    if (transaction.date > todayDate) {
      continue;
    }

    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? 0) +
        transaction.amountMinor
    );
  }

  return [...totals.entries()]
    .map(([name, amountMinor]) => ({
      name,
      value: amountMinor / 100,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}


type PaymentDotProps = {
  cx?: number;
  cy?: number;
  payload?: {
    amount: number;
    date: string;
  };
};

function PaymentDot({
  cx,
  cy,
  payload,
}: PaymentDotProps) {
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    !payload ||
    payload.amount <= 0
  ) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#8B5CF6"
      stroke="#FFFFFF"
      strokeWidth={2}
    />
  );
}


export default function AnalyticsPage() {
  const [data, setData] =
    useState<Analytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trendRange, setTrendRange] =
    useState<TrendRange>("7D");

  const [categoryRange, setCategoryRange] =
    useState<CategoryRange>("ALL");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/analytics",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please sign in to view analytics."
            : "Failed to load analytics."
        );
      }

      const result: Analytics =
        await response.json();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const now = data?.generatedAt
  ? new Date(data.generatedAt)
  : new Date("2026-01-01T00:00:00.000Z");

const dailyChartData = data
  ? createTrendData(
      data.chartTransactions ?? [],
      trendRange,
      now
    )
  : [];

const categoryChartData = data
  ? createCategoryData(
      data.chartTransactions ?? [],
      categoryRange,
      now
    )
  : [];

  const change =
    data?.monthlyChangePercent ?? null;

  const spendingDown =
    change !== null && change < 0;

  const spendingUp =
    change !== null && change > 0;

  const comparisonPercent =
    data && data.previousMonthSpentMinor > 0
      ? Math.min(
          100,
          (data.monthlySpentMinor /
            data.previousMonthSpentMinor) *
            100
        )
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles
              size={16}
              className="text-violet-600"
            />

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              Financial Insights
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Live Analytics
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Explore spending patterns and financial trends
            from your transaction history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200"
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
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-96 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-5 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg shadow-violet-500/15">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-violet-100">
                    Total Spending
                  </p>

                  <Wallet size={21} />
                </div>

                <p className="mt-7 break-words text-3xl font-extrabold tracking-tight">
                  {formatMoney(data.totalSpentMinor)}
                </p>

                <p className="mt-4 text-xs text-violet-100">
                  All-time USD expenses
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/60">
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

              <p className="mt-7 break-words text-3xl font-extrabold tracking-tight text-slate-950">
                {formatMoney(data.monthlySpentMinor)}
              </p>

              <p className="mt-4 text-xs text-slate-400">
                Current month USD spending
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/60">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Transactions
                </p>

                <div className="rounded-xl bg-emerald-50 p-2.5">
                  <Activity
                    size={20}
                    className="text-emerald-600"
                  />
                </div>
              </div>

              <p className="mt-7 text-3xl font-extrabold tracking-tight text-slate-950">
                {data.totalTransactions.toLocaleString(
                  "en-US"
                )}
              </p>

              <p className="mt-4 text-xs text-slate-400">
                Manual + PayPal transactions
              </p>
            </div>
          </div>

          {/* Interactive Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Spending Trend */}
            <div className="min-w-0 rounded-3xl bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/60 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Spending Trend
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Daily expense totals in USD
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                  {(
                    ["7D", "30D", "3M", "6M"] as const
                  ).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() =>
                        setTrendRange(range)
                      }
                      aria-pressed={
                        trendRange === range
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        trendRange === range
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-slate-500 hover:bg-white hover:text-violet-600"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={dailyChartData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -15,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      minTickGap={22}
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 11,
                      }}
                      tickFormatter={(
                        value: number
                      ) => `$${value}`}
                    />

                    <Tooltip
                      labelFormatter={(
                        _label,
                        payload
                      ) => {
                        const point = payload?.[0]
                          ?.payload as
                          | { date?: string }
                          | undefined;

                        return point?.date ?? "";
                      }}
                      formatter={(value) =>
                        money.format(
                          Number(value ?? 0)
                        )
                      }
                      contentStyle={{
                        borderRadius: 14,
                        border:
                          "1px solid #E2E8F0",
                        boxShadow:
                          "0 10px 30px rgba(15,23,42,0.08)",
                      }}
                    />

                    
<Line
  type="monotone"
  dataKey="amount"
  name="Spending"
  stroke="#8B5CF6"
  strokeWidth={3}
  dot={<PaymentDot />}
  activeDot={{
    r: 7,
    fill: "#7C3AED",
    stroke: "#FFFFFF",
    strokeWidth: 3,
  }}
  connectNulls
/>

                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Spending by Category */}
            <div className="min-w-0 rounded-3xl bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/60 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Spending by Category
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Breakdown of completed USD expenses
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                  {(
                    [
                      {
                        value: "TODAY",
                        label: "Today",
                      },
                      {
                        value: "7D",
                        label: "7D",
                      },
                      {
                        value: "1M",
                        label: "1M",
                      },
                      {
                        value: "3M",
                        label: "3M",
                      },
                      {
                        value: "ALL",
                        label: "All",
                      },
                    ] as const
                  ).map((range) => (
                    <button
                      key={range.value}
                      type="button"
                      onClick={() =>
                        setCategoryRange(
                          range.value
                        )
                      }
                      aria-pressed={
                        categoryRange ===
                        range.value
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        categoryRange ===
                        range.value
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-slate-500 hover:bg-white hover:text-violet-600"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {categoryChartData.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                  No spending in this period.
                </div>
              ) : (
                <>
                  <div className="h-64 w-full min-w-0">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={
                            categoryChartData
                          }
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={90}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {categoryChartData.map(
                            (item, index) => (
                              <Cell
                                key={`${item.name}-${index}`}
                                fill={
                                  COLORS[
                                    index %
                                      COLORS.length
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          formatter={(value) =>
                            money.format(
                              Number(value ?? 0)
                            )
                          }
                          contentStyle={{
                            borderRadius: 14,
                            border:
                              "1px solid #E2E8F0",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {categoryChartData.map(
                      (item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                COLORS[
                                  index %
                                    COLORS.length
                                ],
                            }}
                          />

                          <span className="text-xs text-slate-600">
                            {item.name}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Monthly Comparison
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current partial month vs previous full month
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 p-2.5">
                {spendingDown ? (
                  <ArrowDownRight
                    size={21}
                    className="text-emerald-600"
                  />
                ) : (
                  <ArrowUpRight
                    size={21}
                    className="text-violet-600"
                  />
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Previous Month
                </p>

                <p className="mt-3 break-words text-2xl font-extrabold text-slate-950">
                  {formatMoney(
                    data.previousMonthSpentMinor
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-violet-50 p-5">
                <p className="text-sm text-violet-600">
                  Current Month
                </p>

                <p className="mt-3 break-words text-2xl font-extrabold text-violet-950">
                  {formatMoney(
                    data.monthlySpentMinor
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-700"
                style={{
                  width: `${comparisonPercent}%`,
                }}
              />
            </div>

            <p
              className={`mt-4 text-sm font-medium ${
                spendingDown
                  ? "text-emerald-700"
                  : spendingUp
                    ? "text-rose-700"
                    : "text-slate-500"
              }`}
            >
              {change === null
                ? "No previous-month spending to compare."
                : `${change > 0 ? "+" : ""}${change}% compared with last month.`}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              This bar compares spending totals; it is not
              a configured budget.
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center text-slate-500 shadow-sm">
          Analytics unavailable.
        </div>
      )}

      {/* Existing Financial Intelligence */}
      <ExpenseInsights />

      {/* Existing PayPal Monthly Chart */}
      <PayPalMonthlyChart />
    </div>
  );
}
