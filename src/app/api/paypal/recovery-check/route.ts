
import { auth } from "@/auth";
import { paypalRequest } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type PayPalOrderDetails = {
  id: string;
  status: string;
  purchase_units?: {
    payee?: {
      merchant_id?: string;
    };
    payments?: {
      captures?: {
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }[];
    };
  }[];
};

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const expectedMerchantId =
      process.env.PAYPAL_MERCHANT_ID;

    if (!expectedMerchantId) {
      return NextResponse.json(
        { error: "PayPal merchant ID is not configured" },
        { status: 500 }
      );
    }

    const pendingOrders = await prisma.payPalOrder.findMany({
      where: {
        userId,
        status: "CREATED",
        transactionId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const results = [];

    for (const storedOrder of pendingOrders) {
      try {
        const order =
          await paypalRequest<PayPalOrderDetails>(
            `/v2/checkout/orders/${storedOrder.paypalOrderId}`,
            { method: "GET" }
          );

        const units = order.purchase_units ?? [];
        const captures =
          units.flatMap(
            (unit) => unit.payments?.captures ?? []
          );

        const capture = captures[0];

        const merchantMatches =
          units.length === 1 &&
          units[0].payee?.merchant_id === expectedMerchantId;

        const amountMatches =
          captures.length === 1 &&
          capture?.amount.currency_code ===
            storedOrder.currency &&
          /^\d+\.\d{2}$/.test(
            capture?.amount.value ?? ""
          ) &&
          Number(capture.amount.value) * 100 ===
            storedOrder.amountMinor;

        const recoverable =
          order.id === storedOrder.paypalOrderId &&
          order.status === "COMPLETED" &&
          captures.length === 1 &&
          capture?.status === "COMPLETED" &&
          merchantMatches &&
          amountMatches;

        results.push({
          orderId: storedOrder.paypalOrderId,
          databaseStatus: storedOrder.status,
          paypalStatus: order.status,
          merchantMatches,
          amountMatches,
          recoverable,
        });
      } catch (error) {
        console.error(
          "PayPal recovery check failed for order",
          storedOrder.id,
          error
        );

        results.push({
          orderId: storedOrder.paypalOrderId,
          databaseStatus: storedOrder.status,
          paypalStatus: "UNKNOWN",
          merchantMatches: false,
          amountMatches: false,
          recoverable: false,
          error: "Unable to verify order",
        });
      }
    }

    return NextResponse.json({
      checked: results.length,
      recoverable: results.filter(
        (result) => result.recoverable
      ).length,
      orders: results,
    });
  } catch (error) {
    console.error("PayPal recovery check error:", error);

    return NextResponse.json(
      { error: "Unable to check PayPal orders" },
      { status: 500 }
    );
  }
}
