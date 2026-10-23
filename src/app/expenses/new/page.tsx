
"use client";

import { ArrowLeft, Save, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewExpensePage() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const trimmedAmount = amount.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
      setError("Enter a valid amount with up to 2 decimals.");
      return;
    }

    const [dollars, cents = ""] = trimmedAmount.split(".");

    const amountMinor =
      Number(dollars) * 100 +
      Number(cents.padEnd(2, "0"));

    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0 ||
      amountMinor > 100000000
    ) {
      setError("Amount must be between $0.01 and $1,000,000.00.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          amountMinor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "Failed to save expense"
        );
      }

      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/transactions"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </Link>

      <div>
        <p className="text-sm font-medium text-blue-600">
          Expense management
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          Add New Expense
        </h1>

        <p className="mt-2 text-slate-500">
          Record an expense directly in PostgreSQL.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Wallet size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Expense Details
            </h2>
            <p className="text-sm text-slate-500">
              Manual expense — no PayPal payment.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>

          <input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            required
            placeholder="e.g. Lunch at restaurant"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="mb-2 block text-sm font-medium"
          >
            Amount (USD)
          </label>

          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="12.50"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? "Saving..." : "Save Expense"}
        </button>
      </form>
    </div>
  );
}
