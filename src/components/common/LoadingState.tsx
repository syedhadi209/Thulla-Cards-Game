export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[var(--cream)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--felt-gold)] border-t-transparent" />
      <p className="text-sm tracking-wide opacity-80">{label}</p>
    </div>
  );
}
