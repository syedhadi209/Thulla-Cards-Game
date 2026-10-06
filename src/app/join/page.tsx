"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/common/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/lib/supabase/auth";
import { joinGame, mapApiError } from "@/lib/api/game";
import { joinGameFormSchema } from "@/lib/validation/schemas";

function JoinForm() {
  const { loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [gameId, setGameId] = useState(params.get("code")?.toUpperCase() ?? "");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState label="Loading…" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = joinGameFormSchema.safeParse({ gameId, nickname });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const res = await joinGame(parsed.data);
      router.push(`/game/${res.gameId}`);
    } catch (err) {
      setError(mapApiError(err));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-6 text-sm text-[var(--felt-gold)]">
        ← Thulla
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--cream)]">
        Join Game
      </h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block space-y-2">
          <span className="text-sm text-[var(--cream)]/70">Game ID</span>
          <input
            value={gameId}
            onChange={(e) => setGameId(e.target.value.toUpperCase())}
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-3 tracking-[0.2em] text-[var(--cream)] outline-none ring-[var(--felt-gold)] focus:ring-2"
            maxLength={6}
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-[var(--cream)]/70">Nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-3 text-[var(--cream)] outline-none ring-[var(--felt-gold)] focus:ring-2"
            maxLength={20}
            autoComplete="nickname"
            required
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Joining…" : "Join Game"}
        </Button>
      </form>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <JoinForm />
    </Suspense>
  );
}
