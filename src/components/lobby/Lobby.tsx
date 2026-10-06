"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { GameCode } from "@/components/lobby/GameCode";
import { SEAT_POSITION, seatSlots } from "@/components/game/seatLayout";
import { useAuth } from "@/lib/supabase/auth";
import { leaveGame, mapApiError, startGame } from "@/lib/api/game";
import type { GameMeta, PlayerInfo } from "@/lib/hooks/useGameSubscriptions";

export function Lobby({
  gameId,
  meta,
  players,
  onStarted,
}: {
  gameId: string;
  meta: GameMeta;
  players: Record<string, PlayerInfo>;
  onStarted?: () => Promise<void> | void;
}) {
  const { uid } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isHost = uid === meta.hostId;
  const seated = Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  if (uid) {
    const mine = seated.findIndex(([id]) => id === uid);
    if (mine > 0) {
      const [me] = seated.splice(mine, 1);
      if (me) seated.unshift(me);
    }
  }
  const slots = seatSlots(meta.maxPlayers);
  const chairs: Array<[string, PlayerInfo] | null> = slots.map((_, i) => seated[i] ?? null);
  const canStart = isHost && seated.length === meta.maxPlayers;

  async function onStart() {
    setBusy(true);
    setError(null);
    try {
      await startGame({ gameId });
      await onStarted?.();
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onLeave() {
    setBusy(true);
    try {
      await leaveGame({ gameId });
      router.push("/");
    } catch (err) {
      setError(mapApiError(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-6">
      <div className="relative h-[min(52vh,28rem)] w-full">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[12%] inset-y-[16%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,#2a7a4e_0%,#145536_55%,#0c3324_100%)] shadow-[inset_0_0_36px_rgba(0,0,0,0.35)] ring-1 ring-black/25"
        />
        <div className="absolute inset-0 grid place-items-center px-6">
          <GameCode gameId={gameId} />
        </div>
        {chairs.map((chair, i) => {
          const dir = slots[i] ?? "top";
          return (
            <div key={chair?.[0] ?? `empty-${dir}-${i}`} className={["absolute", SEAT_POSITION[dir]].join(" ")}>
              {chair ? (
                <div className="flex min-w-[7.5rem] items-center gap-2 rounded-2xl border border-white/10 bg-[#07160f]/85 px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--felt-gold)] text-sm font-semibold text-[var(--felt-deep)]">
                    {chair[1].nickname.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--cream)]">
                      {chair[1].nickname}
                      {chair[0] === uid ? " (You)" : ""}
                    </span>
                    <span className="text-[11px] text-[var(--cream)]/60">
                      {chair[0] === meta.hostId ? "Host" : "Seated"}
                      {!chair[1].connected ? " · Away" : ""}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="grid h-14 min-w-[7.5rem] place-items-center rounded-2xl border border-dashed border-white/20 bg-black/20 px-3 text-xs tracking-wide text-[var(--cream)]/40">
                  Open seat
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-[var(--cream)]/70">
        {seated.length} / {meta.maxPlayers} seated
      </p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex w-full max-w-sm flex-col gap-3">
        {isHost ? (
          <Button type="button" disabled={!canStart || busy} onClick={onStart}>
            {busy ? "Starting…" : canStart ? "Start Game" : "Waiting for the table to fill"}
          </Button>
        ) : (
          <p className="text-center text-sm text-[var(--cream)]/70">Waiting for the host to start…</p>
        )}
        <Button type="button" variant="ghost" disabled={busy} onClick={onLeave}>
          {isHost ? "Leave & End Game" : "Leave Game"}
        </Button>
      </div>
    </div>
  );
}
