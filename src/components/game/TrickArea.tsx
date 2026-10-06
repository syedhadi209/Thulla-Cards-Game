"use client";

import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "@/components/game/PlayingCard";
import { playFrom, seatDirection, type SeatDir } from "@/components/game/seatLayout";

export interface TrickCardView {
  playerId: string;
  cardId: string;
}

const TRICK_POS: Record<SeatDir, string> = {
  self: "bottom-[12%] left-1/2 z-30 -translate-x-1/2",
  left: "left-[18%] top-1/2 z-30 -translate-y-1/2",
  right: "right-[18%] top-1/2 z-30 -translate-y-1/2",
  top: "top-[12%] left-1/2 z-30 -translate-x-1/2",
  topLeft: "top-[16%] left-[22%] z-30",
  topRight: "top-[16%] right-[22%] z-30",
};

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
  const prev = useRef(trickCards);
  const [fading, setFading] = useState<TrickCardView[] | null>(null);

  useEffect(() => {
    if (prev.current.length > 0 && trickCards.length === 0) {
      setFading(prev.current);
    }
    prev.current = trickCards;
  }, [trickCards]);

  useEffect(() => {
    if (!fading) return;
    const id = window.setTimeout(() => setFading(null), 420);
    return () => window.clearTimeout(id);
  }, [fading]);

  const clearing = trickCards.length === 0 && fading;
  const shown = trickCards.length > 0 ? trickCards : (fading ?? []);

  return (
    <div className="relative h-full min-h-[11rem] w-full">
      {shown.length === 0 && (
        <p className="absolute inset-0 grid place-items-center text-sm tracking-wide text-[var(--cream)]/45">
          Lead a card
        </p>
      )}
      {shown.map((tc, index) => {
        const dir = seatDirection(tc.playerId, selfId, playerOrder);
        const isNewest = !clearing && index === shown.length - 1;
        return (
          <div
            key={
              clearing
                ? `clear-${tc.playerId}-${tc.cardId}-${index}`
                : isNewest
                  ? `play-${shown.length}-${tc.playerId}-${tc.cardId}`
                  : `settled-${tc.playerId}-${tc.cardId}-${index}`
            }
            className={[
              "absolute flex flex-col items-center gap-1",
              TRICK_POS[dir],
              isNewest ? `card-play-in card-play-from-${playFrom(dir)}` : "",
            ].join(" ")}
          >
            <div className={clearing ? "trick-clearing" : undefined}>
              <PlayingCard cardId={tc.cardId} compact emphasize={isNewest} />
            </div>
            <span className="max-w-16 truncate text-[10px] text-[var(--cream)]/70">
              {players[tc.playerId]?.nickname ?? "?"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
