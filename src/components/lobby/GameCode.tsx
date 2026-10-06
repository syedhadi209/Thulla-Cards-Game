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
    <div className="space-y-3">
      <div className="rounded-lg bg-black/25 px-4 py-3 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--felt-gold)]/80">Game ID</p>
        <p className="font-[family-name:var(--font-display)] text-3xl tracking-[0.25em] text-[var(--cream)]">
          {gameId}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => copy(gameId, "Game ID")}>
          Copy Game ID
        </Button>
        <Button type="button" variant="secondary" onClick={() => copy(shareUrl, "Link")}>
          Copy Share Link
        </Button>
      </div>
      {toast && <p className="text-sm text-[var(--felt-gold)]">{toast}</p>}
    </div>
  );
}
