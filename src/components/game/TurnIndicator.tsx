export function TurnIndicator({ label }: { label: string }) {
  return (
    <p className="text-center text-sm tracking-wide text-[var(--felt-gold)] animate-[pulse_2s_ease-in-out_infinite]">
      {label}
    </p>
  );
}
