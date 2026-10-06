"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

function cardSrc(cardId: string) {
  return `/cards/${cardId}.png`;
}

export function PlayingCard({
  cardId,
  selected,
  playable,
  disabled,
  onClick,
  faceDown,
  compact,
  emphasize,
}: {
  cardId?: string;
  selected?: boolean;
  playable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  compact?: boolean;
  emphasize?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const sizeClass = compact ? "h-[5rem] w-[3.5rem]" : "h-[8.25rem] w-[5.75rem]";
  const showBack = faceDown || !cardId || broken;
  const src = showBack ? "/cards/back.png" : cardSrc(cardId);

  const shellClass = [
    "playing-card relative shrink-0 overflow-hidden rounded-[0.55rem]",
    "bg-[#1a1a1a] transition-[transform,box-shadow,filter] duration-200 ease-out",
    "shadow-[0_4px_0_rgba(0,0,0,0.25),0_10px_22px_rgba(0,0,0,0.4)]",
    sizeClass,
    selected
      ? "-translate-y-5 scale-[1.06] shadow-[0_8px_0_rgba(0,0,0,0.2),0_18px_32px_rgba(0,0,0,0.5)] ring-2 ring-[var(--felt-gold)]"
      : "",
    playable && onClick && !disabled
      ? "hover:-translate-y-3 hover:shadow-[0_6px_0_rgba(0,0,0,0.22),0_16px_28px_rgba(0,0,0,0.45)] cursor-pointer"
      : "",
    !playable && onClick ? "opacity-50 saturate-[0.7]" : "",
    disabled ? "cursor-not-allowed opacity-40" : "",
    emphasize ? "ring-2 ring-[var(--felt-gold)] scale-105" : "",
  ].join(" ");

  const style: CSSProperties = {
    aspectRatio: "338 / 489",
  };

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={showBack ? "Card back" : cardId}
      draggable={false}
      className="h-full w-full object-cover select-none pointer-events-none"
      onError={() => setBroken(true)}
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={cardId ?? "facedown card"}
        className={shellClass}
        style={style}
      >
        {image}
      </button>
    );
  }

  return (
    <div className={shellClass} style={style} aria-label={cardId ?? "facedown card"}>
      {image}
    </div>
  );
}
