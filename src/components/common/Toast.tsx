"use client";

import { useEffect } from "react";

export function Toast({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-[var(--felt-deep)] px-4 py-2 text-sm text-[var(--cream)] shadow-lg ring-1 ring-[var(--felt-gold)]/40">
      {message}
    </div>
  );
}
