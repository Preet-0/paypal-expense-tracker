
"use client";

import {
  apiFetch,
  getErrorMessage,
} from "@/lib/api-client";
import {
    CreditCard,
    RefreshCw,
    TrendingUp,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type MonthlyPoint = {
  month: string;
  label: string;
  amount: number;
  count: number;
};

type MonthlyResponse = {
  currency: string;
  months: MonthlyPoint[];
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function PayPalMonthlyChart() {
  const [data, setData] = useState<MonthlyResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<3 | 6 | 12>(12);

  const loadChart = useCallback(
    async (months: 3 | 6 | 12) => {
      setLoading(true);
      setError("");

      try {
        const result = await apiFetch<MonthlyResponse>(
          `/api/analytics/paypal/monthly?months=${months}`,
          "Unable to load chart",
          "Please sign in to view PayPal analytics."
        );

        setData(result);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to load chart"));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    apiFetch<MonthlyResponse>(
      `/api/analytics/paypal/monthly?months=${period}`,
      "Unable to load chart",
      "Please sign in to view PayPal analytics."
    )
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Unable to load chart"));
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
  }, [period]);

  const totalSpending =
    data?.months.reduce(
      (sum, month) => sum + month.amount,
      0
    ) ?? 0;

  const totalPayments =
    data?.months.reduce(
      (sum, month) => sum + month.count,
      0
    ) ?? 0;

  return (
    <section className="min-w-0 rounded-3xl bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/60 sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
            PayPal Sandbox · USD
          </p>

          <h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
            PayPal Monthly Spending
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Completed payments over the selected period.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadChart(period)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/70 transition hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Period Filters */}
      <div className="mt-6 inline-flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5">
        {([3, 6, 12] as const).map((months) => (
          <button
            key={months}
            type="button"
            onClick={() => {
              setLoading(true);
              setPeriod(months);
            }}
            aria-pressed={period === months}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              period === months
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            {months} Months
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-slate-100" />
      ) : data ? (
        <>
          {/* Summary */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-violet-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-violet-700">
                  Spending in Selected Period
                </p>
                <TrendingUp
                  size={19}
                  className="text-violet-600"
                />
              </div>

              <p className="mt-4 break-words text-2xl font-extrabold text-violet-950 sm:text-3xl">
                {usd.format(totalSpending)}
              </p>

              <p className="mt-2 text-xs text-violet-500">
                USD · PayPal Sandbox
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">
                  Completed Payments
                </p>
                <CreditCard
                  size={19}
                  className="text-emerald-600"
                />
              </div>

              <p className="mt-4 text-2xl font-extrabold text-slate-950 sm:text-3xl">
                {totalPayments.toLocaleString("en-IN")}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                In the selected period
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-7">
            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Payment Activity
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                USD spending by month
              </p>
            </div>

            <div className="h-80 w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={data.months}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 10,
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
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 11,
                    }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={65}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 11,
                    }}
                    tickFormatter={(value: number) =>
                      `$${value}`
                    }
                  />

                  <Tooltip
                    formatter={(value) => [
                      usd.format(Number(value ?? 0)),
                      "USD Spending",
                    ]}
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #E2E8F0",
                      boxShadow:
                        "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                  />

                  <Bar
                    dataKey="amount"
                    fill="#8B5CF6"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={46}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center text-sm text-slate-500">
          Monthly payment data unavailable.
        </div>
      )}
    </section>
  );
}
