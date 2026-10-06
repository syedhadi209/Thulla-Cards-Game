"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { Lobby } from "@/components/lobby/Lobby";
import { GameTable } from "@/components/game/GameTable";
import { ResultScreen } from "@/components/result/ResultScreen";
import { useAuth } from "@/lib/supabase/auth";
import { joinGame, leaveGame, mapApiError } from "@/lib/api/game";
import { useGameRoom } from "@/lib/hooks/useGameSubscriptions";
import { nicknameSchema } from "@/lib/validation/schemas";

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = String(params.gameId ?? "").toUpperCase();
  const { uid, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ending, setEnding] = useState(false);

  const [reloadToken, setReloadToken] = useState(0);
  const {
    meta,
    publicState,
    players,
    hand,
    error: metaError,
    isMember,
    loading: roomLoading,
    reload,
    connectionLabel,
  } = useGameRoom(gameId || null, reloadToken);

  const [nickname, setNickname] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  if (authLoading) return <LoadingState label="Loading…" />;

  if (!gameId) {
    return (
      <main className="p-8 text-center">
        <p>Invalid game link.</p>
        <Link href="/">Home</Link>
      </main>
    );
  }

  if (roomLoading && !meta) {
    return <LoadingState label="Loading game…" />;
  }

  if (!meta || !isMember) {
    return (
      <JoinGate
        gameId={gameId}
        nickname={nickname}
        setNickname={setNickname}
        error={joinError ?? (metaError ? "Join to open this private table." : null)}
        busy={joining}
        onSubmit={async (e) => {
          e.preventDefault();
          setJoinError(null);
          const parsed = nicknameSchema.safeParse(nickname);
          if (!parsed.success) {
            setJoinError(parsed.error.issues[0]?.message ?? "Invalid nickname");
            return;
          }
          setJoining(true);
          try {
            await joinGame({ gameId, nickname: parsed.data });
            setReloadToken((n) => n + 1);
            await reload();
          } catch (err) {
            setJoinError(mapApiError(err));
          } finally {
            setJoining(false);
          }
        }}
      />
    );
  }

  const isHost = uid === meta.hostId;

  async function endAsHost() {
    setEnding(true);
    try {
      await leaveGame({ gameId });
      router.push("/");
    } catch {
      await reload();
      setEnding(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-6">
      <div className="mb-4 flex w-full max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl text-[var(--cream)]">
          Thulla
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-[0.2em] text-[var(--cream)]/50">{gameId}</span>
          {isHost && (meta.status === "playing" || meta.status === "starting") && (
            <Button type="button" variant="ghost" disabled={ending} onClick={endAsHost}>
              {ending ? "Ending…" : "End Game"}
            </Button>
          )}
        </div>
      </div>

      {meta.status === "waiting" && (
        <Lobby gameId={gameId} meta={meta} players={players} onStarted={reload} />
      )}

      {(meta.status === "playing" || meta.status === "starting") && publicState && (
        <GameTable
          gameId={gameId}
          meta={meta}
          players={players}
          publicState={publicState}
          hand={hand}
          connectionLabel={connectionLabel}
          onPlayed={reload}
        />
      )}

      {meta.status === "finished" && (
        <ResultScreen
          gameId={gameId}
          meta={meta}
          players={players}
          publicState={publicState}
        />
      )}

      {meta.status === "cancelled" && (
        <div className="text-center text-[var(--cream)]">
          <p>This game ended because the host left.</p>
          <Button className="mt-4" type="button" onClick={() => router.push("/create")}>
            New Game
          </Button>
        </div>
      )}
    </main>
  );
}

function JoinGate({
  gameId,
  nickname,
  setNickname,
  error,
  busy,
  onSubmit,
}: {
  gameId: string;
  nickname: string;
  setNickname: (v: string) => void;
  error: string | null;
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--cream)]">
        Join Game
      </h1>
      <p className="mt-2 text-sm text-[var(--cream)]/60">Game ID: {gameId}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block space-y-2">
          <span className="text-sm text-[var(--cream)]/70">Nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-3 text-[var(--cream)] outline-none ring-[var(--felt-gold)] focus:ring-2"
            maxLength={20}
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
