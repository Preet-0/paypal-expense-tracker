
import { auth } from "@/auth";
import { getDemoAnalytics } from "@/lib/demo-responses";
import { prisma } from "@/lib/prisma";
import { connection, NextResponse } from "next/server";

export async function GET() {
  await connection();

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(getDemoAnalytics());
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        currency: "USD",
        source: {
          in: ["MANUAL", "PAYPAL"],
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const now = new Date();

    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );

    const previousMonthStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - 1,
        1
      )
    );

    const currentMonth = transactions.filter(
      (transaction) =>
        transaction.transactionDate >= monthStart
    );

    const previousMonth = transactions.filter(
      (transaction) =>
        transaction.transactionDate >= previousMonthStart &&
        transaction.transactionDate < monthStart
    );

    const sum = (items: typeof transactions) =>
      items.reduce(
        (total, transaction) =>
          total + transaction.amountMinor,
        0
      );

    const totalSpentMinor = sum(transactions);
    const monthlySpentMinor = sum(currentMonth);
    const previousMonthSpentMinor = sum(previousMonth);

    const monthlyChangePercent =
      previousMonthSpentMinor === 0
        ? null
        : Math.round(
            ((monthlySpentMinor - previousMonthSpentMinor) /
              previousMonthSpentMinor) *
              1000
          ) / 10;

    const categoryTotals = new Map<string, number>();

    for (const transaction of transactions) {
      const category =
        transaction.category?.name ?? "Uncategorized";

      categoryTotals.set(
        category,
        (categoryTotals.get(category) ?? 0) +
          transaction.amountMinor
      );
    }

    const categoryBreakdown = Array.from(
      categoryTotals,
      ([name, amountMinor]) => ({
        name,
        amountMinor,
      })
    ).sort(
      (a, b) => b.amountMinor - a.amountMinor
    );

    const todayUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );

    const dailySpending = Array.from(
      { length: 7 },
      (_, index) => {
        const day = new Date(
          todayUTC - (6 - index) * 86400000
        );

        const date = day.toISOString().slice(0, 10);

        const amountMinor = transactions
          .filter(
            (transaction) =>
              transaction.transactionDate
                .toISOString()
                .slice(0, 10) === date
          )
          .reduce(
            (total, transaction) =>
              total + transaction.amountMinor,
            0
          );

        return { date, amountMinor };
      }
    );

    const recentTransactions = transactions
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
      }));

    // Minimal chart records for independent date filtering.
    // No need to expose descriptions or payment IDs.
    const chartTransactions = transactions.map(
      (transaction) => ({
        date: transaction.transactionDate
          .toISOString()
          .slice(0, 10),
        amountMinor: transaction.amountMinor,
        category:
          transaction.category?.name ?? "Uncategorized",
      })
    );

    return NextResponse.json({
      status: "ok",
      currency: "USD",
      generatedAt: now.toISOString(),
      totalTransactions: transactions.length,
      totalSpentMinor,
      monthlySpentMinor,
      previousMonthSpentMinor,
      monthlyChangePercent,
      categoryBreakdown,
      dailySpending,
      recentTransactions,
      chartTransactions,
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      { error: "Unable to load analytics" },
      { status: 500 }
    );
  }
}
