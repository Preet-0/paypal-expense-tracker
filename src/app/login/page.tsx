
import { signIn } from "@/auth";
import { LogIn, Wallet } from "lucide-react";

export default function LoginPage() {
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

        <form
          action={async () => {
            "use server";
            await signIn("github", {
              redirectTo: "/",
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
