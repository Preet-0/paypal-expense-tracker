import { signIn } from "@/auth";
import { AlertTriangle, LogIn, Wallet } from "lucide-react";

export const instant = false;

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "GitHub sign-in could not be completed. Check that AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET are set in your deployment, that database migrations have been applied (npx prisma migrate deploy), and that the GitHub OAuth callback URL is https://your-domain/api/auth/callback/github. Then check the server logs for [auth][cause].",
  AccessDenied: "Access was denied. Try signing in again.",
  Verification: "That sign-in link has expired. Start again.",
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method.",
  OAuthCallbackError:
    "GitHub could not complete the sign-in. Verify the OAuth client ID and secret.",
  OAuthSignInError:
    "Could not start GitHub sign-in. Verify the OAuth client ID and secret.",
  MissingCSRF:
    "Your browser blocked the sign-in cookies. Enable cookies and try again.",
  InvalidCheck:
    "The sign-in attempt expired. Please try again.",
  AccountNotLinked:
    "This email is already linked to a different sign-in method.",
};

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
  const errorMessage = error
    ? ERROR_MESSAGES[error] ??
      `Sign-in failed (${error}). Please try again.`
    : null;

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center justify-center">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-blue-600 p-4 text-white">
            <Wallet size={30} />
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-slate-950">
          Welcome Back
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to manage your expenses securely.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs leading-5 text-amber-900"
          >
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <p>{errorMessage}</p>
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("github", {
              redirectTo,
            });
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

        <p className="mt-6 text-center text-xs text-slate-400">
          Secure authentication powered by Auth.js.
        </p>
      </div>
    </div>
  );
}
