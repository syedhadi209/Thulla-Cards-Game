"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/lib/supabase/auth";

export function AuthNav() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-md px-3 py-2 text-sm text-[var(--cream)]/80 transition hover:bg-white/10 hover:text-[var(--cream)]"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-[var(--cream)] transition hover:bg-white/15"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="hidden max-w-[14rem] truncate text-sm text-[var(--cream)]/55 md:inline">
        {user.email}
      </span>
      <Button
        type="button"
        variant="ghost"
        className="min-h-9 shrink-0 px-3 py-1.5 text-xs"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await signOut();
          router.push("/");
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
