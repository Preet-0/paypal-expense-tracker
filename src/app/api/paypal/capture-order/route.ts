
import { auth } from "@/auth";
import { paypalRequest } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type PayPalCapture = {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
};


type PayPalCapturedOrder = {
  id: string;
  status: string;
  purchase_units?: {
    payee?: {
      merchant_id?: string;
      email_address?: string;
    };
    payments?: {
      captures?: PayPalCapture[];
    };
  }[];
};


function toMinorUnits(value: string): number | null {
  if (!/^\d+\.\d{2}$/.test(value)) {
    return null;
  }

  const [whole, fractional] = value.split(".");
  const minor = Number(whole) * 100 + Number(fractional);

  return Number.isSafeInteger(minor) ? minor : null;
}


async function getPayPalOrder(
  orderId: string
): Promise<PayPalCapturedOrder> {
  return paypalRequest<PayPalCapturedOrder>(
    `/v2/checkout/orders/${orderId}`,
    {
      method: "GET",
    }
  );
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
        { error: "Invalid order ID" },
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
        orderId,
        captureId: storedOrder.paypalCaptureId,
        alreadyProcessed: true,
      });
    }

    
// Check whether PayPal has already captured this order.
let order = await getPayPalOrder(orderId);

if (order.id !== orderId) {
  return NextResponse.json(
    { error: "PayPal order ID mismatch" },
    { status: 409 }
  );
}

// Capture only if PayPal has not completed the order.
if (order.status === "APPROVED") {
  order = await paypalRequest<PayPalCapturedOrder>(
    `/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      requestId: `capture-${orderId}`,
    }
  );
}


    const captures =
      order.purchase_units?.flatMap(
        (unit) => unit.payments?.captures ?? []
      ) ?? [];

    const capture = captures[0];

    
const expectedMerchantId = process.env.PAYPAL_MERCHANT_ID;

if (!expectedMerchantId) {
  console.error("PAYPAL_MERCHANT_ID is not configured");

  return NextResponse.json(
    { error: "Payment verification is not configured" },
    { status: 500 }
  );
}

const orderDetails = await getPayPalOrder(orderId);

const detailPurchaseUnits =
  orderDetails.purchase_units ?? [];

console.log("PayPal order details verification:", {
  orderIdMatches: orderDetails.id === orderId,
  orderStatus: orderDetails.status,
  purchaseUnitCount: detailPurchaseUnits.length,
  payeePresent: Boolean(detailPurchaseUnits[0]?.payee),
  merchantIdPresent: Boolean(
    detailPurchaseUnits[0]?.payee?.merchant_id
  ),
  merchantIdsMatch:
    detailPurchaseUnits[0]?.payee?.merchant_id ===
    expectedMerchantId,
});




if (
  orderDetails.id !== orderId ||
  orderDetails.status !== "COMPLETED" ||
  detailPurchaseUnits.length !== 1 ||
  detailPurchaseUnits[0].payee?.merchant_id !== expectedMerchantId
) {
  console.error("PayPal merchant verification failed");

  return NextResponse.json(
    { error: "Payment merchant mismatch" },
    { status: 409 }
  );
}


    if (
      order.id !== orderId ||
      order.status !== "COMPLETED" ||
      captures.length !== 1 ||
      !capture ||
      capture.status !== "COMPLETED"
    ) {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 409 }
      );
    }

    const capturedMinor = toMinorUnits(capture.amount.value);

    if (
      capturedMinor !== storedOrder.amountMinor ||
      capture.amount.currency_code !== storedOrder.currency
    ) {
      return NextResponse.json(
        { error: "Payment amount mismatch" },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.payPalOrder.findUnique({
        where: { paypalOrderId: orderId },
      });

      if (!existing || existing.userId !== userId) {
        throw new Error("Order ownership changed");
      }

      
if (existing.status === "COMPLETED") {
  return {
    captureId: existing.paypalCaptureId,
    alreadyProcessed: true,
  };
}

// Atomically claim this order for database processing.
// Only one concurrent request can change CREATED to PROCESSING.
const claim = await tx.payPalOrder.updateMany({
  where: {
    id: existing.id,
    status: "CREATED",
  },
  data: {
    status: "PROCESSING",
  },
});

if (claim.count !== 1) {
  throw new Error(
    "Order is already being processed or has an unexpected status"
  );
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
        captureId: capture.id,
        alreadyProcessed: false,
      };
    });

    return NextResponse.json({
      status: "ok",
      orderId,
      captureId: result.captureId,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    console.error("Capture PayPal order error:", error);

    return NextResponse.json(
      { error: "Unable to capture PayPal order" },
      { status: 500 }
    );
  }
}
