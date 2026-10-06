"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { mapApiError, rematch } from "@/lib/api/game";
import type { GameMeta, PlayerInfo, PublicState } from "@/lib/hooks/useGameSubscriptions";

export function ResultScreen({
  gameId,
  meta,
  players,
  publicState,
}: {
  gameId: string;
  meta: GameMeta;
  players: Record<string, PlayerInfo>;
  publicState: PublicState | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const winnerId = meta.winnerId;
  const loserId = meta.loserId;
  const escapeOrder = publicState?.escapeOrder ?? {};

  const ranked = Object.entries(players).sort((a, b) => {
    const ea = escapeOrder[a[0]] ?? 999;
    const eb = escapeOrder[b[0]] ?? 999;
    if (a[0] === loserId) return 1;
    if (b[0] === loserId) return -1;
    return ea - eb;
  });

  async function onRematch() {
    setBusy(true);
    setError(null);
    try {
      const res = await rematch({ gameId });
      router.push(`/game/${res.gameId}`);
    } catch (err) {
      setError(mapApiError(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 rounded-xl bg-black/35 p-6 text-center backdrop-blur">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--felt-gold)]">Game Over</p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--cream)]">
        {winnerId ? "Winner" : "Ended"}
      </h1>
      <p className="text-2xl font-semibold text-[var(--felt-gold)]">
        {winnerId
          ? (players[winnerId]?.nickname ?? "—")
          : (publicState?.announcements?.[0] ?? "Host left — game ended")}
      </p>

      <div className="space-y-2 text-left">
        <p className="text-sm uppercase tracking-wider text-[var(--cream)]/60">Final Results</p>
        <ol className="space-y-2">
          {ranked.map(([id, p], idx) => (
            <li
              key={id}
              className="flex items-center justify-between rounded-md bg-black/25 px-3 py-2 text-[var(--cream)]"
            >
              <span>
                {idx + 1}. {p.nickname}
              </span>
              <span className="text-xs text-[var(--cream)]/60">
                {id === loserId ? "Thulla (loser)" : id === winnerId ? "Winner" : "Escaped"}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex flex-col gap-3">
        <Button type="button" disabled={busy} onClick={onRematch}>
          {busy ? "Creating…" : "Rematch"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/create")}>
          New Game
        </Button>
      </div>
    </div>
  );
}
