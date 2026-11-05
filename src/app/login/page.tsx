import { signIn } from "@/auth";
import {
  AlertTriangle,
  LogIn,
  Wallet,
  Zap,
} from "lucide-react";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeCallbackUrl(value: string | undefined) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  const error = firstValue(params.error);
  const redirectTo = safeCallbackUrl(
    firstValue(params.callbackUrl)
  );

  const errorMessage =
    error === "CredentialsSignin"
      ? "This username may already be taken, or it is invalid. Choose a new username using 3–24 letters, numbers, or underscores."
      : error
        ? "Sign-in failed. Please try again."
        : null;

  async function quickLogin(formData: FormData) {
    "use server";

    const rawUsername = formData.get("username");

    if (typeof rawUsername !== "string") {
      redirect("/login?error=CredentialsSignin");
    }

    const username = rawUsername.trim().toLowerCase();

    if (!/^[\p{L}\p{N} ._'’-]{1,50}$/u.test(username)) {
      redirect("/login?error=CredentialsSignin");
    }

    try {
      await signIn("quick-login", {
        username,
        redirectTo,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=CredentialsSignin");
      }

      // Auth.js uses a redirect exception after successful login.
      throw error;
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border border-violet-100 bg-white p-8 shadow-xl shadow-violet-100/40">

        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-violet-600 p-4 text-white">
            <Wallet size={30} />
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-slate-950">
          Welcome to PayTrack
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          Track payments, expenses, and financial insights.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* GitHub login */}
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo });
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            <LogIn size={20} />
            Continue with GitHub
          </button>
        </form>

        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">
            OR
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Quick Login */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Zap size={20} className="text-violet-600" />
            <h2 className="font-bold text-slate-900">
              Quick Login for Judges
            </h2>
          </div>

          <p className="mb-5 text-xs leading-5 text-slate-500">
          Enter your name to continue. New names create a demo profile,
          while existing names reopen their saved transactions.
          </p>

          <form action={quickLogin} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Unique username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                minLength={1}
                maxLength={50}
                autoComplete="off"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
            >
              <Zap size={18} />
              Continue with Quick Login
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Demo transactions are stored separately for each account.
        </p>
      </div>
    </div>
  );
}