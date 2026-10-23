
"use client";

import {
    PayPalButtons,
    PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";

type CreateOrderResponse = {
  orderId?: string;
  error?: string;
};

type CaptureResponse = {
  status?: string;
  captureId?: string;
  alreadyProcessed?: boolean;
  error?: string;
};

const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export default function PayPalCheckout() {
  const [description, setDescription] = useState(
    "PayPal Sandbox Test Payment"
  );
  const [amount, setAmount] = useState("5.00");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locked, setLocked] = useState(false);

  async function createOrder(): Promise<string> {
    setError("");

    const trimmedAmount = amount.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
      throw new Error("Enter a valid USD amount.");
    }

    const [dollars, cents = ""] = trimmedAmount.split(".");

    const amountMinor =
      Number(dollars) * 100 +
      Number(cents.padEnd(2, "0"));

    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor < 1 ||
      amountMinor > 100000000
    ) {
      throw new Error("Amount must be between $0.01 and $1,000,000.");
    }

    if (
      description.trim().length === 0 ||
      description.trim().length > 127
    ) {
      throw new Error(
        "Description must contain 1–127 characters."
      );
    }

    const response = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: description.trim(),
        amountMinor,
      }),
    });

    const data: CreateOrderResponse = await response.json();

    if (!response.ok || !data.orderId) {
      throw new Error(
        data.error || "Unable to create PayPal order."
      );
    }

    return data.orderId;
  }

  async function captureOrder(orderId: string) {
    const response = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    const data: CaptureResponse = await response.json();

    if (!response.ok || data.status !== "ok") {
      throw new Error(
        data.error || "Unable to capture payment."
      );
    }

    return data;
  }

  if (!clientId) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-red-700">
        PayPal Sandbox Client ID is missing.
        Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to .env and restart Next.js.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          PayPal Sandbox
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          Make a Test Payment
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Pay securely using a PayPal Sandbox buyer account.
          No real money is transferred.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Payment Details
            </h2>
            <p className="text-sm text-slate-500">
              Sandbox checkout • USD
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="payment-description"
              className="mb-2 block text-sm font-medium"
            >
              Description
            </label>

            <input
              id="payment-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              maxLength={127}
              disabled={locked}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="payment-amount"
              className="mb-2 block text-sm font-medium"
            >
              Amount (USD)
            </label>

            <input
              id="payment-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              disabled={locked}
              placeholder="5.00"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {success ? (
            <div
              role="status"
              className="rounded-xl bg-green-50 p-5 text-green-700"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={22} />
                <p className="font-semibold">
                  Sandbox Payment Completed!
                </p>
              </div>

              <p className="mt-2 text-sm">{success}</p>
            </div>
          ) : (
            <div className="pt-3">
              <PayPalScriptProvider
                options={{
                  clientId,
                  currency: "USD",
                  intent: "capture",
                  components: "buttons",
                }}
              >
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    shape: "rect",
                    label: "paypal",
                  }}
                  createOrder={async () => {
                    try {
                      return await createOrder();
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Unable to create order."
                      );
                      throw err;
                    }
                  }}
                  onApprove={async (data) => {
                    setError("");

                    try {
                      const result = await captureOrder(
                        data.orderID
                      );

                      setSuccess(
                        `Capture ID: ${result.captureId ?? "N/A"}`
                      );
                      setLocked(true);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Payment verification failed."
                      );
                    }
                  }}
                  onError={(err) => {
                    console.error("PayPal checkout error:", err);
                    setError(
                      "PayPal checkout encountered an error. Check the console for details."
                    );
                  }}
                  onCancel={() => {
                    setError("Payment was cancelled.");
                  }}
                />
              </PayPalScriptProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}