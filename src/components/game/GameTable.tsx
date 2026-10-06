"use client";

import { useCallback, useMemo, useState } from "react";
import { PlayerHand } from "@/components/game/PlayerHand";
import { PlayerSeat } from "@/components/game/PlayerSeat";
import { GameTimer } from "@/components/game/GameTimer";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { ActionControls } from "@/components/game/ActionControls";
import { TrickArea } from "@/components/game/TrickArea";
import { Toast } from "@/components/common/Toast";
import { useAuth } from "@/lib/supabase/auth";
import { mapApiError, playAction } from "@/lib/api/game";
import { getClientValidMoves } from "@/lib/game/clientEngine";
import type { GameMeta, PlayerInfo, PublicState } from "@/lib/hooks/useGameSubscriptions";

export function GameTable({
  gameId,
  meta,
  players,
  publicState,
  hand,
  connectionLabel,
  onPlayed,
}: {
  gameId: string;
  meta: GameMeta;
  players: Record<string, PlayerInfo>;
  publicState: PublicState;
  hand: string[];
  connectionLabel: string;
  onPlayed?: () => Promise<void> | void;
}) {
  const { uid } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [flyingCard, setFlyingCard] = useState<string | null>(null);

  const isMyTurn = meta.currentTurn === uid;
  const order = publicState.playerOrder ?? Object.keys(players);
  const opponents = order.filter((id) => id !== uid);
  const displayHand = flyingCard ? hand.filter((c) => c !== flyingCard) : hand;

  const playable = useMemo(() => {
    const moves = getClientValidMoves({
      hand,
      isMyTurn,
      mustLeadAS: Boolean(publicState.mustLeadAS),
      trickCards: publicState.trickCards ?? [],
      ledSuit: (publicState.ledSuit as "S" | "H" | "D" | "C" | null) ?? null,
    });
    return new Set(moves);
  }, [hand, isMyTurn, publicState]);

  const turnLabel = useMemo(() => {
    if (!meta.currentTurn) return "Waiting…";
    if (meta.currentTurn === uid) return "Your turn";
    const name = players[meta.currentTurn]?.nickname ?? "Opponent";
    return `${name}'s turn`;
  }, [meta.currentTurn, players, uid]);

  const trickCards = useMemo(() => {
    const base = [...(publicState.trickCards ?? [])];
    const onTable =
      flyingCard &&
      uid &&
      base.some((tc) => tc.playerId === uid && tc.cardId === flyingCard);
    if (flyingCard && uid && !onTable) {
      base.push({ playerId: uid, cardId: flyingCard });
    }
    return base;
  }, [publicState.trickCards, flyingCard, uid]);

  const onPlay = useCallback(async () => {
    if (!selected || !uid) return;
    const cardId = selected;
    setBusy(true);
    setFlyingCard(cardId);
    setSelected(null);
    try {
      await playAction({
        gameId,
        type: "PLAY_CARD",
        payload: { cardId },
      });
      await onPlayed?.();
      setFlyingCard(null);
    } catch (err) {
      setFlyingCard(null);
      setSelected(cardId);
      setToast(mapApiError(err));
    } finally {
      setBusy(false);
    }
  }, [selected, uid, gameId, onPlayed]);

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-4 px-3 py-4">
      <div className="flex w-full items-center justify-between gap-2">
        <TurnIndicator label={turnLabel} />
        <GameTimer expiresAt={meta.turnExpiresAt} />
      </div>

      {connectionLabel !== "connected" && (
        <p className="text-xs text-amber-200">
          {connectionLabel === "reconnecting" ? "Reconnecting…" : "Connection lost"}
        </p>
      )}

      <div className="flex w-full flex-wrap justify-center gap-3">
        {opponents.map((id) => (
          <PlayerSeat
            key={id}
            player={{ id, ...players[id]! }}
            isTurn={meta.currentTurn === id}
            isSelf={false}
            isHost={meta.hostId === id}
          />
        ))}
      </div>

      <div className="relative flex min-h-[180px] w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_center,#1f6b45_0%,#0d3b28_70%)] p-6 shadow-inner ring-1 ring-black/30">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--cream)]/50">Trick</p>
        <TrickArea
          trickCards={trickCards}
          players={players}
          selfId={uid}
          playerOrder={order}
        />
      </div>

      {uid && players[uid] && (
        <PlayerSeat
          player={{ id: uid, ...players[uid] }}
          isTurn={isMyTurn}
          isSelf
          isHost={meta.hostId === uid}
        />
      )}

      <PlayerHand
        hand={displayHand}
        selected={selected}
        playable={playable}
        onSelect={setSelected}
        disabled={!isMyTurn || busy}
      />

      <ActionControls canPlay={Boolean(selected) && isMyTurn} busy={busy} onPlay={onPlay} />

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
