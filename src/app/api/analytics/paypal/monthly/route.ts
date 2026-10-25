
import { auth } from "@/auth";
import { getDemoPayPalMonthly } from "@/lib/demo-responses";
import { prisma } from "@/lib/prisma";
import { connection, NextResponse } from "next/server";

export async function GET(request: Request) {
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get("months") ?? "12";

    if (!["3", "6", "12"].includes(monthsParam)) {
      return NextResponse.json(
        { error: "months must be 3, 6, or 12" },
        { status: 400 }
      );
    }

    const numberOfMonths = Number(monthsParam);

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        getDemoPayPalMonthly(numberOfMonths)
      );
    }

const now = new Date();

const startDate = new Date(
  Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() - numberOfMonths + 1,
    1
  )
);

    const orders = await prisma.payPalOrder.findMany({
      where: {
        userId,
        status: "COMPLETED",
        currency: "USD",
        paypalCaptureId: { not: null },
        transactionId: { not: null },
        createdAt: { gte: startDate },
      },
      select: {
        amountMinor: true,
        createdAt: true,
      },
    });

    
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
    });

    const byMonth = new Map(
      months.map((month) => [month.month, month])
    );

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 7);
      const month = byMonth.get(key);

      if (month) {
        month.amountMinor += order.amountMinor;
        month.count += 1;
      }
    }

    return NextResponse.json({
      currency: "USD",
      months: months.map((month) => ({
        month: month.month,
        label: month.label,
        amount: Number((month.amountMinor / 100).toFixed(2)),
        count: month.count,
      })),
    });
  } catch (error) {
    console.error("PayPal monthly analytics error:", error);

    return NextResponse.json(
      { error: "Unable to load monthly PayPal analytics" },
      { status: 500 }
    );
  }
}
