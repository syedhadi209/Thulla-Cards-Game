"use client";

import { PlayingCard } from "@/components/game/PlayingCard";
import { sortHand } from "@/lib/game/clientEngine";

/** Negative margin so roughly half of each card stays visible. */
function handOverlap(count: number) {
  if (count <= 1) return 0;
  if (count <= 7) return -20;
  if (count <= 12) return -30;
  return -38;
}

export function PlayerHand({
  hand,
  selected,
  playable,
  onSelect,
  disabled,
}: {
  hand: string[];
  selected: string | null;
  playable: Set<string>;
  onSelect: (cardId: string) => void;
  disabled: boolean;
}) {
  const sorted = sortHand(hand);
  const overlap = handOverlap(sorted.length);
  const mid = (sorted.length - 1) / 2;

  return (
    <div className="flex w-full max-w-5xl items-end justify-center overflow-x-auto px-3 pb-2 pt-6">
      {sorted.map((cardId, i) => {
        const tilt = (i - mid) * 1.05;
        const lift = Math.abs(i - mid) * 1.1;
        const isSelected = selected === cardId;

        return (
          <div
            key={cardId}
            className="relative shrink-0 origin-bottom transition-transform duration-200"
            style={{
              marginLeft: i === 0 ? 0 : overlap,
              zIndex: isSelected ? sorted.length + 2 : i,
              transform: isSelected ? undefined : `translateY(${lift}px) rotate(${tilt}deg)`,
            }}
          >
            <PlayingCard
              cardId={cardId}
              selected={isSelected}
              playable={playable.has(cardId)}
              disabled={disabled || !playable.has(cardId)}
              onClick={() => onSelect(cardId)}
            />
          </div>
        );
      })}
      {sorted.length === 0 && (
        <p className="text-sm text-[var(--cream)]/60">No cards — you escaped!</p>
      )}
    </div>
  );
}
