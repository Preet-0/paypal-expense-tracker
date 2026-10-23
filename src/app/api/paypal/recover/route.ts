
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

function toMinorUnits(value: string): number | null {
  if (!/^\d+\.\d{2}$/.test(value)) {
    return null;
  }

  const [whole, fraction] = value.split(".");
  const result = Number(whole) * 100 + Number(fraction);

  return Number.isSafeInteger(result) ? result : null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Recovery is Sandbox-only.
    if (process.env.PAYPAL_ENVIRONMENT !== "sandbox") {
      return NextResponse.json(
        { error: "Recovery is restricted to Sandbox" },
        { status: 403 }
      );
    }

    const expectedMerchantId =
      process.env.PAYPAL_MERCHANT_ID;

    if (!expectedMerchantId) {
      return NextResponse.json(
        { error: "Merchant ID is not configured" },
        { status: 500 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { orderId } = body as Record<string, unknown>;

    if (
      typeof orderId !== "string" ||
      !/^[A-Z0-9]{10,30}$/.test(orderId)
    ) {
      return NextResponse.json(
        { error: "Invalid PayPal order ID" },
        { status: 400 }
      );
    }

    const storedOrder = await prisma.payPalOrder.findUnique({
      where: { paypalOrderId: orderId },
    });

    if (!storedOrder || storedOrder.userId !== userId) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (storedOrder.status === "COMPLETED") {
      return NextResponse.json({
        status: "ok",
        alreadyProcessed: true,
        orderId,
        captureId: storedOrder.paypalCaptureId,
      });
    }

    if (
      storedOrder.status !== "CREATED" ||
      storedOrder.transactionId !== null ||
      storedOrder.paypalCaptureId !== null
    ) {
      return NextResponse.json(
        { error: "Order requires manual investigation" },
        { status: 409 }
      );
    }

    // Read the PayPal order. Do not capture again.
    const order = await paypalRequest<PayPalOrderDetails>(
      `/v2/checkout/orders/${orderId}`,
      { method: "GET" }
    );

    const units = order.purchase_units ?? [];
    const captures =
      units.flatMap(
        (unit) => unit.payments?.captures ?? []
      );

    const capture = captures[0];

    if (
      order.id !== orderId ||
      order.status !== "COMPLETED" ||
      units.length !== 1 ||
      units[0].payee?.merchant_id !== expectedMerchantId ||
      captures.length !== 1 ||
      !capture?.id ||
      capture.status !== "COMPLETED" ||
      capture.amount.currency_code !== storedOrder.currency ||
      toMinorUnits(capture.amount.value) !==
        storedOrder.amountMinor
    ) {
      return NextResponse.json(
        { error: "PayPal verification failed" },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Atomically claim the order.
      const claim = await tx.payPalOrder.updateMany({
        where: {
          id: storedOrder.id,
          userId,
          status: "CREATED",
          transactionId: null,
          paypalCaptureId: null,
        },
        data: {
          status: "PROCESSING",
        },
      });

      if (claim.count !== 1) {
        const current = await tx.payPalOrder.findUnique({
          where: { id: storedOrder.id },
        });

        if (
          current?.status === "COMPLETED" &&
          current.paypalCaptureId === capture.id &&
          current.transactionId
        ) {
          return {
            alreadyProcessed: true,
            captureId: capture.id,
          };
        }

        throw new Error("Order cannot be claimed for recovery");
      }

      const transaction = await tx.transaction.create({
        data: {
          userId,
          description: storedOrder.description,
          amountMinor: storedOrder.amountMinor,
          currency: storedOrder.currency,
          source: "PAYPAL",
          status: "COMPLETED",
        },
      });

      await tx.payPalOrder.update({
        where: { id: storedOrder.id },
        data: {
          status: "COMPLETED",
          paypalCaptureId: capture.id,
          transactionId: transaction.id,
        },
      });

      return {
        alreadyProcessed: false,
        captureId: capture.id,
      };
    });

    return NextResponse.json({
      status: "ok",
      orderId,
      captureId: result.captureId,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    console.error("PayPal recovery error:", error);

    return NextResponse.json(
      { error: "Unable to recover PayPal payment" },
      { status: 500 }
    );
  }
}
