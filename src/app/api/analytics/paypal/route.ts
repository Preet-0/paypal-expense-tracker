
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { connection, NextResponse } from "next/server";

export async function GET() {
  await connection();

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orders = await prisma.payPalOrder.findMany({
      where: {
        userId,
        status: "COMPLETED",
        paypalCaptureId: { not: null },
        transactionId: { not: null },
        currency: "USD",
      },
      select: {
        paypalOrderId: true,
        description: true,
        amountMinor: true,
        currency: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalMinor = orders.reduce(
      (sum, order) => sum + order.amountMinor,
      0
    );

    return NextResponse.json({
      currency: "USD",
      totalSpent: (totalMinor / 100).toFixed(2),
      totalPayments: orders.length,
      averagePayment:
        orders.length > 0
          ? (totalMinor / orders.length / 100).toFixed(2)
          : "0.00",
      recentPayments: orders.slice(0, 10).map((order) => ({
        orderId: order.paypalOrderId,
        description: order.description,
        amount: (order.amountMinor / 100).toFixed(2),
        currency: order.currency,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("PayPal analytics error:", error);

    return NextResponse.json(
      { error: "Unable to load PayPal analytics" },
      { status: 500 }
    );
  }
}
