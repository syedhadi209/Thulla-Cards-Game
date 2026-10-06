"use client";

import { useCallback, useMemo, useState } from "react";
import { PlayerHand } from "@/components/game/PlayerHand";
import { PlayerSeat } from "@/components/game/PlayerSeat";
import { GameTimer } from "@/components/game/GameTimer";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { ActionControls } from "@/components/game/ActionControls";
import { TrickArea } from "@/components/game/TrickArea";
import { SEAT_POSITION, seatDirection } from "@/components/game/seatLayout";
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
  const seated = order.filter((id) => players[id]);
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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between gap-3 px-1">
        <TurnIndicator label={turnLabel} active={isMyTurn} />
        <GameTimer expiresAt={meta.turnExpiresAt} />
      </div>

      {connectionLabel !== "connected" && (
        <p className="mt-2 text-xs text-amber-200">
          {connectionLabel === "reconnecting" ? "Reconnecting…" : "Connection lost"}
        </p>
      )}

      <div className="relative mt-3 h-[min(54vh,30rem)] w-full max-w-4xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[10%] inset-y-[12%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,#2a7a4e_0%,#145536_48%,#0c3324_100%)] shadow-[inset_0_0_40px_rgba(0,0,0,0.35),0_18px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/30"
        />
        <div className="absolute inset-x-[18%] inset-y-[22%] z-30">
          <TrickArea
            trickCards={trickCards}
            players={players}
            selfId={uid}
            playerOrder={order}
          />
        </div>

        {seated.map((id) => (
          <div key={id} className={["absolute", SEAT_POSITION[seatDirection(id, uid, order)]].join(" ")}>
            <PlayerSeat
              player={{ id, ...players[id]! }}
              isTurn={meta.currentTurn === id}
              isSelf={id === uid}
              isHost={meta.hostId === id}
            />
          </div>
        ))}
      </div>

      <PlayerHand
        hand={displayHand}
        selected={selected}
        playable={playable}
        onSelect={setSelected}
        disabled={!isMyTurn || busy}
      />

      <div className="h-12">
        {(selected || busy) && (
          <ActionControls canPlay={Boolean(selected) && isMyTurn} busy={busy} onPlay={onPlay} />
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
