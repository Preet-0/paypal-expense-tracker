type DemoCategory = {
  id: string;
  name: string;
};

type DemoExpense = {
  id: string;
  description: string;
  amountMinor: number;
  currency: "USD";
  source: "MANUAL" | "PAYPAL";
  status: "COMPLETED";
  transactionDate: string;
  categoryId: string | null;
  category: DemoCategory | null;
};

export const demoCategories: DemoCategory[] = [
  { id: "demo-cat-food", name: "Food" },
  { id: "demo-cat-transport", name: "Transportation" },
  { id: "demo-cat-stationery", name: "Stationery" },
  { id: "demo-cat-entertainment", name: "Entertainment" },
  { id: "demo-cat-shopping", name: "Shopping" },
  { id: "demo-cat-bills", name: "Bills and Utilities" },
  { id: "demo-cat-clothing", name: "Clothing" },
  { id: "demo-cat-other", name: "Other" },
];

const categoriesByName = new Map(
  demoCategories.map((category) => [category.name, category])
);

function daysAgo(days: number, hour = 12) {
  const date = new Date(Date.now() - days * 86400000);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function category(name: string): DemoCategory | null {
  return categoriesByName.get(name) ?? null;
}

const demoExpenses: DemoExpense[] = [
  {
    id: "demo-001",
    description: "Team lunch",
    amountMinor: 2450,
    currency: "USD",
    source: "MANUAL",
    status: "COMPLETED",
    transactionDate: daysAgo(1).toISOString(),
    categoryId: category("Food")?.id ?? null,
    category: category("Food"),
  },
  {
    id: "demo-002",
    description: "Metro card top-up",
    amountMinor: 1800,
    currency: "USD",
    source: "MANUAL",
    status: "COMPLETED",
    transactionDate: daysAgo(2).toISOString(),
    categoryId: category("Transportation")?.id ?? null,
    category: category("Transportation"),
  },
  {
    id: "demo-003",
    description: "Notebook and pens",
    amountMinor: 1299,
    currency: "USD",
    source: "PAYPAL",
    status: "COMPLETED",
    transactionDate: daysAgo(3).toISOString(),
    categoryId: category("Stationery")?.id ?? null,
    category: category("Stationery"),
  },
  {
    id: "demo-004",
    description: "Movie tickets",
    amountMinor: 3000,
    currency: "USD",
    source: "PAYPAL",
    status: "COMPLETED",
    transactionDate: daysAgo(4).toISOString(),
    categoryId: category("Entertainment")?.id ?? null,
    category: category("Entertainment"),
  },
  {
    id: "demo-005",
    description: "Groceries",
    amountMinor: 6840,
    currency: "USD",
    source: "MANUAL",
    status: "COMPLETED",
    transactionDate: daysAgo(6).toISOString(),
    categoryId: category("Food")?.id ?? null,
    category: category("Food"),
  },
  {
    id: "demo-006",
    description: "Internet bill",
    amountMinor: 4999,
    currency: "USD",
    source: "MANUAL",
    status: "COMPLETED",
    transactionDate: daysAgo(8).toISOString(),
    categoryId: category("Bills and Utilities")?.id ?? null,
    category: category("Bills and Utilities"),
  },
  {
    id: "demo-007",
    description: "T-shirt",
    amountMinor: 2599,
    currency: "USD",
    source: "MANUAL",
    status: "COMPLETED",
    transactionDate: daysAgo(12).toISOString(),
    categoryId: category("Clothing")?.id ?? null,
    category: category("Clothing"),
  },
  {
    id: "demo-008",
    description: "Coffee beans",
    amountMinor: 1650,
    currency: "USD",
    source: "MANUAL",
    status: "COMPLETED",
    transactionDate: daysAgo(20).toISOString(),
    categoryId: category("Food")?.id ?? null,
    category: category("Food"),
  },
  {
    id: "demo-009",
    description: "Dinner out",
    amountMinor: 4200,
    currency: "USD",
    source: "MANUAL",
    status: "COMPLETED",
    transactionDate: daysAgo(35).toISOString(),
    categoryId: category("Food")?.id ?? null,
    category: category("Food"),
  },
  {
    id: "demo-010",
    description: "Bus pass",
    amountMinor: 3500,
    currency: "USD",
    source: "MANUAL",
    status: "COMPLETED",
    transactionDate: daysAgo(40).toISOString(),
    categoryId: category("Transportation")?.id ?? null,
    category: category("Transportation"),
  },
  {
    id: "demo-011",
    description: "Headphones",
    amountMinor: 7900,
    currency: "USD",
    source: "PAYPAL",
    status: "COMPLETED",
    transactionDate: daysAgo(45).toISOString(),
    categoryId: category("Shopping")?.id ?? null,
    category: category("Shopping"),
  },
];

function sortedExpenses() {
  return [...demoExpenses].sort((a, b) =>
    b.transactionDate.localeCompare(a.transactionDate)
  );
}

function paypalExpenses() {
  return sortedExpenses().filter(
    (expense) => expense.source === "PAYPAL"
  );
}

export function getDemoTransactions() {
  return sortedExpenses();
}

export function getDemoAnalytics() {
  const transactions = sortedExpenses();
  const now = new Date();

  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const previousMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  );

  const currentMonth = transactions.filter(
    (transaction) =>
      new Date(transaction.transactionDate) >= monthStart
  );

  const previousMonth = transactions.filter((transaction) => {
    const date = new Date(transaction.transactionDate);
    return date >= previousMonthStart && date < monthStart;
  });

  const sum = (items: DemoExpense[]) =>
    items.reduce(
      (total, transaction) => total + transaction.amountMinor,
      0
    );

  const monthlySpentMinor = sum(currentMonth);
  const previousMonthSpentMinor = sum(previousMonth);

  const categoryTotals = new Map<string, number>();

  for (const transaction of transactions) {
    const name = transaction.category?.name ?? "Uncategorized";
    categoryTotals.set(
      name,
      (categoryTotals.get(name) ?? 0) + transaction.amountMinor
    );
  }

  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  const dailySpending = Array.from(
    { length: 7 },
    (_, index) => {
      const day = new Date(todayUTC - (6 - index) * 86400000);
      const date = day.toISOString().slice(0, 10);

      const amountMinor = transactions
        .filter(
          (transaction) =>
            transaction.transactionDate.slice(0, 10) === date
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amountMinor,
          0
        );

      return { date, amountMinor };
    }
  );

  return {
    status: "ok",
    demo: true,
    currency: "USD",
    generatedAt: now.toISOString(),
    totalTransactions: transactions.length,
    totalSpentMinor: sum(transactions),
    monthlySpentMinor,
    previousMonthSpentMinor,
    monthlyChangePercent:
      previousMonthSpentMinor === 0
        ? null
        : Math.round(
            ((monthlySpentMinor - previousMonthSpentMinor) /
              previousMonthSpentMinor) *
              1000
          ) / 10,
    categoryBreakdown: Array.from(
      categoryTotals,
      ([name, amountMinor]) => ({ name, amountMinor })
    ).sort((a, b) => b.amountMinor - a.amountMinor),
    dailySpending,
    recentTransactions: transactions
      .slice(0, 5)
      .map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        amountMinor: transaction.amountMinor,
        currency: transaction.currency,
        source: transaction.source,
        category:
          transaction.category?.name ?? "Uncategorized",
        transactionDate: transaction.transactionDate,
      })),
    chartTransactions: transactions.map((transaction) => ({
      date: transaction.transactionDate.slice(0, 10),
      amountMinor: transaction.amountMinor,
      category:
        transaction.category?.name ?? "Uncategorized",
    })),
  };
}

export function getDemoInsights() {
  const now = new Date();

  const currentMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const previousMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  );

  const transactions = sortedExpenses().filter(
    (transaction) =>
      new Date(transaction.transactionDate) >=
      previousMonthStart
  );

  const currentMonth = transactions.filter(
    (transaction) =>
      new Date(transaction.transactionDate) >= currentMonthStart
  );

  const previousMonth = transactions.filter((transaction) => {
    const date = new Date(transaction.transactionDate);
    return date >= previousMonthStart && date < currentMonthStart;
  });

  const sumMinor = (items: DemoExpense[]) =>
    items.reduce(
      (total, transaction) => total + transaction.amountMinor,
      0
    );

  const currentMonthSpentMinor = sumMinor(currentMonth);
  const previousMonthSpentMinor = sumMinor(previousMonth);
  const currentMonthSpent = currentMonthSpentMinor / 100;

  const changePercent =
    previousMonthSpentMinor === 0
      ? null
      : Math.round(
          ((currentMonthSpentMinor - previousMonthSpentMinor) /
            previousMonthSpentMinor) *
            1000
        ) / 10;

  const categoryTotals = new Map<string, number>();

  for (const transaction of currentMonth) {
    const name = transaction.category?.name ?? "Uncategorized";
    categoryTotals.set(
      name,
      (categoryTotals.get(name) ?? 0) + transaction.amountMinor
    );
  }

  const sortedCategories = [...categoryTotals.entries()].sort(
    (a, b) => b[1] - a[1]
  );

  const topCategory =
    sortedCategories.length > 0 ? sortedCategories[0][0] : null;

  const insights: {
    type: "trend" | "category" | "savings";
    title: string;
    message: string;
  }[] = [];

  if (changePercent !== null) {
    insights.push({
      type: "trend",
      title:
        changePercent > 0
          ? "Spending Increased"
          : changePercent < 0
            ? "Spending Decreased"
            : "Spending Unchanged",
      message:
        changePercent > 0
          ? `You've spent ${changePercent}% more this month than last month so far. Keep an eye on your expenses.`
          : changePercent < 0
            ? `You've spent ${Math.abs(changePercent)}% less this month compared with last month.`
            : "Your spending matches last month's total so far.",
    });
  }

  if (topCategory) {
    insights.push({
      type: "category",
      title: "Top Spending Category",
      message: `${topCategory} is your highest spending category this month across manual and PayPal payments.`,
    });
  }

  if (currentMonthSpentMinor > 0) {
    insights.push({
      type: "savings",
      title: "Potential Savings Opportunity",
      message: `Reducing spending by 10% could save approximately $${(currentMonthSpent * 0.1).toFixed(2)} based on this month's spending.`,
    });
  }

  return {
    demo: true,
    currency: "USD",
    currentMonthSpent,
    previousMonthSpent: previousMonthSpentMinor / 100,
    changePercent,
    topCategory,
    insights,
  };
}

export function getDemoPayPalAnalytics() {
  const payments = paypalExpenses();
  const totalMinor = payments.reduce(
    (sum, payment) => sum + payment.amountMinor,
    0
  );

  return {
    demo: true,
    currency: "USD",
    totalSpent: (totalMinor / 100).toFixed(2),
    totalPayments: payments.length,
    averagePayment:
      payments.length > 0
        ? (totalMinor / payments.length / 100).toFixed(2)
        : "0.00",
    recentPayments: payments.slice(0, 10).map((payment) => ({
      orderId: `DEMO-${payment.id}`,
      description: payment.description,
      amount: (payment.amountMinor / 100).toFixed(2),
      currency: payment.currency,
      createdAt: payment.transactionDate,
    })),
  };
}

export function getDemoPayPalMonthly(numberOfMonths: number) {
  const now = new Date();
  const payments = paypalExpenses();

  const months = Array.from(
    { length: numberOfMonths },
    (_, index) => {
      const date = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() - numberOfMonths + 1 + index,
          1
        )
      );

      return {
        month: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        }),
        amountMinor: 0,
        count: 0,
      };
    }
  );

  const byMonth = new Map(
    months.map((month) => [month.month, month])
  );

  for (const payment of payments) {
    const key = payment.transactionDate.slice(0, 7);
    const month = byMonth.get(key);

    if (month) {
      month.amountMinor += payment.amountMinor;
      month.count += 1;
    }
  }

  return {
    demo: true,
    currency: "USD",
    months: months.map((month) => ({
      month: month.month,
      label: month.label,
      amount: Number((month.amountMinor / 100).toFixed(2)),
      count: month.count,
    })),
  };
}

export function getDemoPayPalCsv() {
  const headers = [
    "Date",
    "Description",
    "Amount",
    "Currency",
    "Status",
    "PayPal Order ID",
    "PayPal Capture ID",
  ];

  const rows = paypalExpenses().map((payment) => [
    payment.transactionDate,
    payment.description,
    (payment.amountMinor / 100).toFixed(2),
    payment.currency,
    payment.status,
    `DEMO-${payment.id}`,
    `DEMO-CAPTURE-${payment.id}`,
  ]);

  const cell = (value: string | number) => {
    const text = String(value);
    const safeText = /^[\s]*[=+\-@]/.test(text)
      ? `'${text}`
      : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };

  return [
    headers.map(cell).join(","),
    ...rows.map((row) => row.map(cell).join(",")),
  ].join("\r\n");
}
