"use client";

import { Check, Copy, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Props = {
  email: string;
  password: string;
};

export default function SandboxCredentials({
  email,
  password,
}: Props) {
  const [copied, setCopied] = useState<"email" | "password" | null>(
    null
  );

  async function copyValue(
    value: string,
    field: "email" | "password"
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
          <ShieldCheck size={22} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            PayPal Sandbox Test Buyer
          </h2>
          <p className="text-xs text-slate-500">
            Demo credentials for judges
          </p>
        </div>
      </div>

      <p className="mb-5 text-sm text-slate-600">
        Use this test buyer account when the PayPal Sandbox
        checkout window asks you to sign in. No real money is
        involved.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Sandbox buyer email
          </label>

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 break-all rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm text-slate-800">
              {email}
            </div>

            <button
              type="button"
              onClick={() => copyValue(email, "email")}
              aria-label="Copy Sandbox buyer email"
              className="rounded-xl border border-violet-200 bg-white p-3 text-violet-700 transition hover:bg-violet-100"
            >
              {copied === "email" ? (
                <Check size={18} />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Sandbox buyer password
          </label>

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 break-all rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm text-slate-800">
              {password}
            </div>

            <button
              type="button"
              onClick={() => copyValue(password, "password")}
              aria-label="Copy Sandbox buyer password"
              className="rounded-xl border border-violet-200 bg-white p-3 text-violet-700 transition hover:bg-violet-100"
            >
              {copied === "password" ? (
                <Check size={18} />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-violet-700">
        Test environment only. Never use real PayPal credentials.
      </p>
    </div>
  );
}