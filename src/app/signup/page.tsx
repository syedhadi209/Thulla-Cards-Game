"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/common/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/lib/supabase/auth";
import { authFormSchema } from "@/lib/validation/schemas";

function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function SignupForm() {
  const { signUp, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (authLoading) return <LoadingState label="Checking session…" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = authFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    const result = await signUp(parsed.data.email, parsed.data.password);
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    if (result.needsConfirm) {
      setInfo("Check your email to confirm your account, then sign in.");
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Take a seat"
      subtitle="Create your account and host a private Thulla table with friends."
      footer={
        <>
          Already playing?{" "}
          <Link
            href={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`}
            className="font-semibold text-[var(--felt-gold)] underline-offset-4 transition hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
        {error && (
          <p className="rounded-md border border-red-400/25 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-md border border-[var(--felt-gold)]/30 bg-[var(--felt-gold)]/10 px-3 py-2 text-sm text-[var(--felt-gold)]">
            {info}
          </p>
        )}
        <Button type="submit" disabled={busy} className="mt-1 w-full text-base">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SignupForm />
    </Suspense>
  );
}
