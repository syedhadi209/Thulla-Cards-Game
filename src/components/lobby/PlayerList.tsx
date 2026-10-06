import type { PlayerInfo } from "@/lib/hooks/useGameSubscriptions";

export function PlayerList({
  players,
  hostId,
  maxPlayers,
}: {
  players: Record<string, PlayerInfo>;
  hostId: string;
  maxPlayers: number;
}) {
  const entries = Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--cream)]/80">
        Players: {entries.length} / {maxPlayers}
      </p>
      <ul className="space-y-2">
        {entries.map(([id, p]) => (
          <li
            key={id}
            className="flex items-center justify-between rounded-md bg-black/20 px-3 py-2 text-[var(--cream)]"
          >
            <span className="font-medium">
              {p.nickname}
              {id === hostId && (
                <span className="ml-2 text-xs uppercase tracking-wider text-[var(--felt-gold)]">
                  Host
                </span>
              )}
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${p.connected ? "bg-emerald-400" : "bg-zinc-500"}`}
              title={p.connected ? "Connected" : "Disconnected"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
