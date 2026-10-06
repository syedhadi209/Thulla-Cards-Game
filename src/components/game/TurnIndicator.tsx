export function TurnIndicator({ label, active }: { label: string; active?: boolean }) {
  return (
    <p
      className={[
        "text-sm font-medium tracking-wide",
        active ? "text-[var(--felt-gold)]" : "text-[var(--cream)]/75",
      ].join(" ")}
    >
      {label}
    </p>
  );
}
