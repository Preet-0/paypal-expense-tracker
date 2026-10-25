
"use client";


import PayPalTransactions from "@/components/PayPalTransactions";
import {
  apiFetch,
  getErrorMessage,
} from "@/lib/api-client";

import {
  AlertCircle,
  CheckCircle2,
  Plus,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";


type Category = {
  id: string;
  name: string;
};

type Transaction = {
  id: string;
  description: string;
  amountMinor: number;
  currency: string;
  source: "MANUAL" | "PAYPAL";
  status: string;
  transactionDate: string;
  categoryId: string | null;
  category: Category | null;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [transactionData, categoryData] =
        await Promise.all([
          apiFetch<{ transactions: Transaction[] }>(
            "/api/transactions",
            "Unable to load transaction data.",
            "Please sign in to view your transactions."
          ),
          apiFetch<{ categories: Category[] }>(
            "/api/categories",
            "Unable to load transaction data.",
            "Please sign in to view your transactions."
          ),
        ]);

      setTransactions(transactionData.transactions);
      setCategories(categoryData.categories);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiFetch<{ transactions: Transaction[] }>(
        "/api/transactions",
        "Unable to load transaction data.",
        "Please sign in to view your transactions."
      ),
      apiFetch<{ categories: Category[] }>(
        "/api/categories",
        "Unable to load transaction data.",
        "Please sign in to view your transactions."
      ),
    ])
      .then(([transactionData, categoryData]) => {
        if (active) {
          setTransactions(transactionData.transactions);
          setCategories(categoryData.categories);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Something went wrong"));
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

  const filtered = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        filter === "all" ||
        (filter === "uncategorized"
          ? transaction.categoryId === null
          : transaction.categoryId === filter);

      return matchesSearch && matchesCategory;
    });
  }, [transactions, search, filter]);

  const categorized = transactions.filter(
    (transaction) => transaction.categoryId !== null
  ).length;

  const uncategorized = transactions.length - categorized;

  async function updateCategory(
    transactionId: string,
    categoryId: string | null
  ) {
    setSavingId(transactionId);
    setError("");

    try {
      const response = await fetch(
        `/api/transactions/${encodeURIComponent(transactionId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ categoryId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update category.");
      }

      const data = await response.json();

      setTransactions((previous) =>
        previous.map((transaction) =>
          transaction.id === transactionId
            ? data.transaction
            : transaction
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Update failed"
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
  Expense Management
</p>
<h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
  Transaction History
</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your expenses, securely stored in PostgreSQL.
          </p>
        </div>

        <Link
          href="/expenses/new"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
        >
          <Plus size={18} />
          Add Expense
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Transactions",
            value: transactions.length,
            icon: ReceiptText,
          },
          {
            label: "Categorized",
            value: categorized,
            icon: CheckCircle2,
          },
          {
            label: "Needs Attention",
            value: uncategorized,
            icon: AlertCircle,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {item.label}
                </span>
                <div className="rounded-xl bg-violet-50 p-2.5">
  <Icon size={20} className="text-violet-600" />
</div>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-950">
                {loading ? "—" : item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-violet-50/40 sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">
              All Transactions
            </h2>
            <p className="text-xs text-slate-500">
              {filtered.length} transactions shown
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transactions..."
                className="w-40 bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:w-56"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="uncategorized">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={() => void loadData()}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading transactions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center">
            <ReceiptText
              size={36}
              className="mx-auto text-slate-300"
            />
            <h3 className="mt-4 font-semibold text-slate-900">
              No matching transactions
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Add an expense or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                    <Wallet size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {transaction.description}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(
                        transaction.transactionDate
                      ).toLocaleDateString("en-IN")}
                      {" • "}
                      {transaction.source}
                      {" • "}
                      {transaction.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    aria-label={`Category for ${transaction.description}`}
                    value={transaction.categoryId ?? ""}
                    disabled={savingId === transaction.id}
                    onChange={(event) =>
                      void updateCategory(
                        transaction.id,
                        event.target.value || null
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <p className="min-w-28 text-right font-bold text-slate-900">
                    {transaction.currency === "USD"
                      ? money.format(transaction.amountMinor / 100)
                      : `${transaction.currency} ${(
                          transaction.amountMinor / 100
                        ).toFixed(2)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <PayPalTransactions />
    </div>
  );
}
