"use client";

import { signOutAction } from "@/app/auth-actions";
import { LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Session = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
} | null;

export default function AuthStatus() {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Session) => {
        if (active) {
          setSession(data);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-[11px] text-slate-600">
        Checking session…
      </p>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] text-slate-500">
          You are viewing demo data.
        </p>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <LogIn size={16} />
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400">
        <UserRound size={15} />
        <span className="truncate text-xs">
          {session.user.email ?? session.user.name ?? "Signed in"}
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
