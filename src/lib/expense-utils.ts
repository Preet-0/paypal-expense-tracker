
import type { DemoTransaction } from "./demo-data";

export function calculateTotal(
  transactions: DemoTransaction[]
) {
  return transactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );
}

export function getCategoryTotals(
  transactions: DemoTransaction[]
) {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    const category =
      transaction.category ?? "Uncategorized";

    totals.set(
      category,
      (totals.get(category) ?? 0) + transaction.amount
    );
  }

  return Array.from(totals.entries())
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export function getUncategorizedCount(
  transactions: DemoTransaction[]
) {
  return transactions.filter(
    (transaction) => transaction.category === null
  ).length;
}
