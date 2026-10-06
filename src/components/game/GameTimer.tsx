"use client";

import { useMemo, useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 250);
  return () => clearInterval(id);
}

export function GameTimer({ expiresAt }: { expiresAt: number | null }) {
  const getSnapshot = useMemo(() => {
    return () => {
      if (expiresAt == null) return null;
      return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    };
  }, [expiresAt]);

  const remaining = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (remaining === null) return null;

  return (
    <div
      className={`rounded-md px-3 py-1 text-sm font-semibold tabular-nums ${
        remaining <= 5 ? "bg-red-700/80 text-white" : "bg-black/40 text-[var(--cream)]"
      }`}
    >
      {remaining}s
    </div>
  );
}
