"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { mapApiError, rematch } from "@/lib/api/game";
import { playThullaSting } from "@/lib/game/thullaSound";
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

  useEffect(() => {
    if (!loserId) return;
    const key = `thulla-sting-${gameId}-${meta.finishedAt ?? loserId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void playThullaSting();
  }, [gameId, loserId, meta.finishedAt]);

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

  const podium = ranked.filter(([id]) => id !== loserId).slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-4 py-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--felt-gold)]">
          Game over
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl text-[var(--cream)]">
          {winnerId ? (players[winnerId]?.nickname ?? "Winner") : "Ended"}
        </h1>
        <p className="mt-2 text-sm text-[var(--cream)]/65">
          {winnerId
            ? "First to escape"
            : (publicState?.announcements?.[0] ?? "Host left — game ended")}
        </p>
      </div>

      {podium.length > 0 && (
        <ol className="flex w-full items-end justify-center gap-3">
          {podium.map(([id, p], idx) => (
            <li
              key={id}
              className="podium-rise flex w-28 flex-col items-center"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <span className="mb-2 text-sm font-semibold text-[var(--cream)]">{p.nickname}</span>
              <div
                className={[
                  "flex w-full items-end justify-center rounded-t-xl pb-3 pt-6 text-sm font-semibold",
                  idx === 0
                    ? "h-28 bg-[var(--felt-gold)] text-[var(--felt-deep)]"
                    : "h-20 bg-white/10 text-[var(--cream)]",
                ].join(" ")}
              >
                {idx + 1}
              </div>
            </li>
          ))}
        </ol>
      )}

      <ol className="w-full space-y-2 text-left">
        {ranked.map(([id, p], idx) => {
          const isThulla = id === loserId;
          return (
            <li
              key={id}
              className={[
                "podium-rise flex items-center justify-between rounded-xl px-4 py-3",
                isThulla
                  ? "bg-red-950/50 text-red-100 ring-1 ring-red-400/30"
                  : "bg-black/25 text-[var(--cream)]",
              ].join(" ")}
              style={{ animationDelay: `${120 + idx * 60}ms` }}
            >
              <span className="font-medium">
                {idx + 1}. {p.nickname}
              </span>
              <span className="text-xs uppercase tracking-wider opacity-80">
                {isThulla ? "Thulla" : id === winnerId ? "Winner" : "Escaped"}
              </span>
            </li>
          );
        })}
      </ol>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex w-full max-w-sm flex-col gap-3">
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
