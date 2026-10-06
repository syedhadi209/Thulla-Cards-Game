"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { GameCode } from "@/components/lobby/GameCode";
import { PlayerList } from "@/components/lobby/PlayerList";
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
  const count = Object.keys(players).length;
  const canStart = isHost && count === meta.maxPlayers;

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
    <div className="mx-auto w-full max-w-lg space-y-6 rounded-xl bg-black/30 p-6 backdrop-blur">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--cream)]">Lobby</h1>
      <GameCode gameId={gameId} />
      <PlayerList players={players} hostId={meta.hostId} maxPlayers={meta.maxPlayers} />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex flex-col gap-3">
        {isHost ? (
          <Button type="button" disabled={!canStart || busy} onClick={onStart}>
            {busy ? "Starting…" : "Start Game"}
          </Button>
        ) : (
          <p className="text-center text-sm text-[var(--cream)]/70">
            Waiting for host to start…
          </p>
        )}
        <Button type="button" variant="ghost" disabled={busy} onClick={onLeave}>
          {isHost ? "Leave & End Game" : "Leave Game"}
        </Button>
      </div>
    </div>
  );
}
