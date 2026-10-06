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
  const sizeClass = compact ? "h-[4.75rem] w-[3.5rem]" : "h-[7.4rem] w-[5.45rem]";
  const showBack = faceDown || !cardId || broken;
  const src = showBack ? "/cards/back.png" : cardSrc(cardId);
  const muted = Boolean(onClick) && !playable;
  const legal = Boolean(playable && onClick && !disabled && !selected);

  const shellClass = [
    "playing-card relative isolate shrink-0 overflow-hidden rounded-[0.85rem]",
    "bg-[#f6f1e6] transition-[transform,box-shadow,filter] duration-200 ease-out",
    "shadow-[0_8px_18px_rgba(0,0,0,0.28)] ring-1 ring-black/10",
    sizeClass,
    selected
      ? "-translate-y-5 scale-[1.06] shadow-[0_16px_28px_rgba(0,0,0,0.4)] ring-2 ring-[var(--felt-gold)]"
      : "",
    legal ? "card-legal cursor-pointer hover:-translate-y-3" : "",
    playable && onClick && !disabled && !legal ? "cursor-pointer hover:-translate-y-2" : "",
    muted ? "cursor-default saturate-[0.8]" : "",
    disabled ? "cursor-not-allowed" : "",
    emphasize ? "ring-2 ring-[var(--felt-gold)]" : "",
  ].join(" ");

  const style: CSSProperties = {
    aspectRatio: "140 / 190",
  };

  const image = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={showBack ? "Card back" : cardId}
        draggable={false}
        className="h-full w-full select-none bg-[#f6f1e6] object-cover pointer-events-none"
        onError={() => setBroken(true)}
      />
      {muted && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#efe6d2]/45"
        />
      )}
    </>
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
