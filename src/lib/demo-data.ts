
export const EXPENSE_CATEGORIES = [
    "Food",
    "Clothing",
    "Stationery",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Bills and Utilities",
    "Other",
  ] as const;
  
  export type ExpenseCategory =
    (typeof EXPENSE_CATEGORIES)[number];
  
  export type DemoTransaction = {
    id: string;
    description: string;
    amount: number;
    currency: "INR";
    date: string;
    category: ExpenseCategory | null;
  };
  
  export const demoTransactions: DemoTransaction[] = [
    {
      id: "demo-001",
      description: "Lunch at restaurant",
      amount: 350,
      currency: "INR",
      date: "2026-10-19",
      category: "Food",
    },
    {
      id: "demo-002",
      description: "Notebook and pens",
      amount: 180,
      currency: "INR",
      date: "2026-10-19",
      category: "Stationery",
    },
    {
      id: "demo-003",
      description: "Shopping purchase",
      amount: 799,
      currency: "INR",
      date: "2026-10-18",
      category: null,
    },
    {
      id: "demo-004",
      description: "Bus transportation",
      amount: 75,
      currency: "INR",
      date: "2026-10-17",
      category: "Transportation",
    },
    {
      id: "demo-005",
      description: "Store purchase",
      amount: 450,
      currency: "INR",
      date: "2026-10-16",
      category: null,
    },
  ];
  
  export function formatMoney(
    amount: number,
    currency = "INR"
  ) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  