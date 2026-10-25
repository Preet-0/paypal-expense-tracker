
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { connection, NextResponse } from "next/server";

export async function GET() {
  await connection();

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    const currentMonthStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1
      )
    );

    const previousMonthStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - 1,
        1
      )
    );

    // Include completed manual AND PayPal USD expenses.
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        currency: "USD",
        source: {
          in: ["MANUAL", "PAYPAL"],
        },
        transactionDate: {
          gte: previousMonthStart,
        },
      },
      select: {
        amountMinor: true,
        transactionDate: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const currentMonth = transactions.filter(
      (transaction) =>
        transaction.transactionDate >= currentMonthStart
    );

    const previousMonth = transactions.filter(
      (transaction) =>
        transaction.transactionDate >= previousMonthStart &&
        transaction.transactionDate < currentMonthStart
    );

    const sumMinor = (
      items: typeof transactions
    ) =>
      items.reduce(
        (sum, transaction) =>
          sum + transaction.amountMinor,
        0
      );

    const currentMonthSpentMinor = sumMinor(currentMonth);
    const previousMonthSpentMinor = sumMinor(previousMonth);

    const currentMonthSpent =
      currentMonthSpentMinor / 100;

    const previousMonthSpent =
      previousMonthSpentMinor / 100;

    const changePercent =
      previousMonthSpentMinor === 0
        ? null
        : Math.round(
            ((currentMonthSpentMinor -
              previousMonthSpentMinor) /
              previousMonthSpentMinor) *
              1000
          ) / 10;

    // Category totals across both payment sources.
    const categoryTotals = new Map<string, number>();

    for (const transaction of currentMonth) {
      const categoryName =
        transaction.category?.name ?? "Uncategorized";

      categoryTotals.set(
        categoryName,
        (categoryTotals.get(categoryName) ?? 0) +
          transaction.amountMinor
      );
    }

    const sortedCategories = [...categoryTotals.entries()]
      .sort((a, b) => b[1] - a[1]);

    const topCategory =
      sortedCategories.length > 0
        ? sortedCategories[0][0]
        : null;

    const insights: {
      type: "trend" | "category" | "savings";
      title: string;
      message: string;
    }[] = [];

    if (changePercent !== null) {
      if (changePercent > 0) {
        insights.push({
          type: "trend",
          title: "Spending Increased",
          message:
            `You've spent ${changePercent}% more this month ` +
            `than last month so far. Keep an eye on your expenses.`,
        });
      } else if (changePercent < 0) {
        insights.push({
          type: "trend",
          title: "Spending Decreased",
          message:
            `You've spent ${Math.abs(changePercent)}% less ` +
            `this month compared with last month.`,
        });
      } else {
        insights.push({
          type: "trend",
          title: "Spending Unchanged",
          message:
            "Your spending matches last month's total so far.",
        });
      }
    } else {
      insights.push({
        type: "trend",
        title: "Building Your Spending History",
        message:
          "Add more transactions over time to unlock " +
          "month-over-month comparisons.",
      });
    }

    if (topCategory) {
      insights.push({
        type: "category",
        title: "Top Spending Category",
        message:
          `${topCategory} is your highest spending category ` +
          `this month across manual and PayPal payments.`,
      });
    }

    if (currentMonthSpentMinor > 0) {
      const savingsTarget = currentMonthSpent * 0.1;

      insights.push({
        type: "savings",
        title: "Potential Savings Opportunity",
        message:
          `Reducing spending by 10% could save approximately ` +
          `$${savingsTarget.toFixed(2)} based on this month's spending.`,
      });
    }

    return NextResponse.json({
      currency: "USD",
      currentMonthSpent,
      previousMonthSpent,
      changePercent,
      topCategory,
      insights,
    });
  } catch (error) {
    console.error("Insights API error:", error);

    return NextResponse.json(
      { error: "Unable to load insights" },
      { status: 500 }
    );
  }
}
