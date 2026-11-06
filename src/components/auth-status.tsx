
"use client";

import { signOutAction } from "@/app/auth-actions";
import { LogOut, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Session = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
} | null;

export default function AuthStatus() {
  const pathname = usePathname();

  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function refreshSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load session");
        }

        const data: Session = await response.json();

        if (!controller.signal.aborted) {
          setSession(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSession(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void refreshSession();

    return () => {
      controller.abort();
    };
  }, [pathname]);

  if (loading) {
    return (
      <p className="text-[11px] text-slate-500">
        Checking session…
      </p>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400">
        <UserRound size={15} />

        <span className="truncate text-xs">
          {session.user.name ??
            session.user.email ??
            "Signed in"}
        </span>
      </div>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </form>
    </div>
  );
}
