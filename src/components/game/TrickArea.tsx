"use client";

import { PlayingCard } from "@/components/game/PlayingCard";

export interface TrickCardView {
  playerId: string;
  cardId: string;
}

function seatDirection(
  playerId: string,
  selfId: string | null,
  playerOrder: string[],
): "self" | "left" | "right" | "top" {
  if (playerId === selfId) return "self";
  const order = playerOrder.length ? playerOrder : [playerId];
  const selfIdx = selfId ? order.indexOf(selfId) : 0;
  const idx = order.indexOf(playerId);
  if (idx < 0 || selfIdx < 0) return "top";
  const n = order.length;
  const rel = (idx - selfIdx + n) % n;
  if (rel === 0) return "self";
  if (rel === 1) return "left";
  if (rel === n - 1) return "right";
  return "top";
}

export function TrickArea({
  trickCards,
  players,
  selfId,
  playerOrder,
}: {
  trickCards: TrickCardView[];
  players: Record<string, { nickname: string }>;
  selfId: string | null;
  playerOrder: string[];
}) {
  if (trickCards.length === 0) {
    return <p className="text-sm text-[var(--cream)]/50">Lead a card</p>;
  }

  return (
    <div className="flex flex-wrap items-end justify-center gap-3">
      {trickCards.map((tc, index) => {
        const dir = seatDirection(tc.playerId, selfId, playerOrder);
        const isNewest = index === trickCards.length - 1;

        return (
          <div
            key={
              isNewest
                ? `play-${trickCards.length}-${tc.playerId}-${tc.cardId}`
                : `settled-${tc.playerId}-${tc.cardId}-${index}`
            }
            className={[
              "flex flex-col items-center gap-1",
              isNewest ? `card-play-in card-play-from-${dir}` : "",
            ].join(" ")}
          >
            <PlayingCard cardId={tc.cardId} emphasize={isNewest} />
            <span className="max-w-16 truncate text-[10px] text-[var(--cream)]/70">
              {players[tc.playerId]?.nickname ?? "?"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
