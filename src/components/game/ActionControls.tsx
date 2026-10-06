"use client";

import { Button } from "@/components/common/Button";

export function ActionControls({
  canPlay,
  busy,
  onPlay,
}: {
  canPlay: boolean;
  busy: boolean;
  onPlay: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button type="button" disabled={!canPlay || busy} onClick={onPlay}>
        {busy ? "Playing…" : "Play Card"}
      </Button>
    </div>
  );
}
