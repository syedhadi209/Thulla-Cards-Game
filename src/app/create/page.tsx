"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/lib/supabase/auth";
import { createGame, mapApiError } from "@/lib/api/game";
import { createGameFormSchema } from "@/lib/validation/schemas";

export default function CreatePage() {
  const { loading } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState label="Loading…" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createGameFormSchema.safeParse({ nickname, maxPlayers });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const res = await createGame(parsed.data);
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
        Create Game
      </h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
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
        <label className="block space-y-2">
          <span className="text-sm text-[var(--cream)]/70">Players</span>
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-3 text-[var(--cream)] outline-none ring-[var(--felt-gold)] focus:ring-2"
          >
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} players
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create Game"}
        </Button>
      </form>
    </main>
  );
}
