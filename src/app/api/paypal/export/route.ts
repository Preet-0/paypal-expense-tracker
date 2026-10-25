
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { connection, NextResponse } from "next/server";

function csvCell(value: string | number) {
  const text = String(value);

  // Prevent spreadsheet formula execution.
  const safeText = /^[\s]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

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

    const orders = await prisma.payPalOrder.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        paypalCaptureId: { not: null },
        transactionId: { not: null },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        paypalOrderId: true,
        paypalCaptureId: true,
        description: true,
        amountMinor: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    const headers = [
      "Date",
      "Description",
      "Amount",
      "Currency",
      "Status",
      "PayPal Order ID",
      "PayPal Capture ID",
    ];

    const rows = orders.map((order) => [
      order.createdAt.toISOString(),
      order.description,
      (order.amountMinor / 100).toFixed(2),
      order.currency,
      order.status,
      order.paypalOrderId,
      order.paypalCaptureId ?? "",
    ]);

    const csv = [
      headers.map(csvCell).join(","),
      ...rows.map((row) => row.map(csvCell).join(",")),
    ].join("\r\n");

    return new Response("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="paypal-transactions.csv"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("PayPal CSV export error:", error);

    return NextResponse.json(
      { error: "Unable to export PayPal transactions" },
      { status: 500 }
    );
  }
}
