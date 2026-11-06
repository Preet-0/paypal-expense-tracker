
"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkspaceAccess({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      setLoading(true);

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        const session = response.ok ? await response.json() : null;

        if (!controller.signal.aborted) {
          setAuthenticated(Boolean(session?.user));
        }
      } catch {
        if (!controller.signal.aborted) {
          setAuthenticated(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void checkSession();

    return () => controller.abort();
  }, [pathname]);

  if (loading) {
    return (
      <p className="px-3 text-xs text-slate-500">
        Checking workspace…
      </p>
    );
  }

  if (!authenticated) {
    return (
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-5">
        <LockKeyhole
          size={22}
          className="mb-3 text-violet-400"
        />

        <p className="text-sm font-semibold text-violet-200">
          Unlock your workspace
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          Log in with GitHub or Quick Login to access your
          dashboard, payments, transactions, and analytics.
        </p>

        {pathname !== "/login" && (
          <Link
            href="/login"
            className="mt-4 inline-flex text-xs font-semibold text-violet-300 hover:text-violet-200"
          >
            Go to Login
          </Link>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
