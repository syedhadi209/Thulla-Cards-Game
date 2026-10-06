"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

export function GameCode({ gameId }: { gameId: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/game/${gameId}` : `/game/${gameId}`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${label} copied`);
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast("Could not copy");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => copy(gameId, "Game ID")}
        className="rounded-2xl border border-[var(--felt-gold)]/40 bg-[#07160f]/75 px-6 py-3 text-center shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:border-[var(--felt-gold)]"
      >
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--felt-gold)]">
          Game code
        </span>
        <span className="mt-1 block font-[family-name:var(--font-display)] text-4xl tracking-[0.22em] text-[var(--cream)]">
          {gameId}
        </span>
      </button>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="secondary" onClick={() => copy(gameId, "Game ID")}>
          Copy code
        </Button>
        <Button type="button" variant="secondary" onClick={() => copy(shareUrl, "Link")}>
          Copy link
        </Button>
      </div>
      {toast && <p className="text-sm text-[var(--felt-gold)]">{toast}</p>}
    </div>
  );
}
