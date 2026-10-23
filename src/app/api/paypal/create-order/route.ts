
import { auth } from "@/auth";
import { paypalRequest } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type PayPalOrderResponse = {
  id: string;
  status: string;
  links?: {
    href: string;
    rel: string;
    method?: string;
  }[];
};

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
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

    const { description, amountMinor } =
      body as Record<string, unknown>;

    if (
      typeof description !== "string" ||
      description.trim().length === 0 ||
      description.trim().length > 127
    ) {
      return NextResponse.json(
        { error: "Description must be 1–127 characters" },
        { status: 400 }
      );
    }

    if (
      typeof amountMinor !== "number" ||
      !Number.isSafeInteger(amountMinor) ||
      amountMinor < 1 ||
      amountMinor > 100000000
    ) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const order = await paypalRequest<PayPalOrderResponse>(
      "/v2/checkout/orders",
      {
        method: "POST",
        body: {
          intent: "CAPTURE",
          purchase_units: [
            {
              description: description.trim(),
              amount: {
                currency_code: "USD",
                value: (amountMinor / 100).toFixed(2),
              },
            },
          ],
        },
      }
    );

    await prisma.payPalOrder.create({
      data: {
        paypalOrderId: order.id,
        userId: session.user.id,
        description: description.trim(),
        amountMinor,
        currency: "USD",
        status: order.status,
      },
    });

    
return NextResponse.json({
  orderId: order.id,
  status: order.status,
  hasApprovalLink:
    order.links?.some(
      (link) =>
        link.rel === "approve" ||
        link.rel === "payer-action"
    ) ?? false,
});

  } catch (error) {
    console.error("Create PayPal order error:", error);

    return NextResponse.json(
      { error: "Unable to create PayPal order" },
      { status: 500 }
    );
  }
}
