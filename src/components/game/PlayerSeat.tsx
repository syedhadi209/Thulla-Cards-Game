import type { PlayerInfo } from "@/lib/hooks/useGameSubscriptions";

export function PlayerSeat({
  player,
  isTurn,
  isSelf,
  isHost,
}: {
  player: PlayerInfo & { id: string };
  isTurn: boolean;
  isSelf: boolean;
  isHost: boolean;
}) {
  return (
    <div
      className={[
        "min-w-[7rem] rounded-lg px-3 py-2 text-center",
        isTurn ? "bg-[var(--felt-gold)]/25 ring-1 ring-[var(--felt-gold)]" : "bg-black/30",
      ].join(" ")}
    >
      <p className="truncate text-sm font-semibold text-[var(--cream)]">
        {player.nickname}
        {isSelf ? " (You)" : ""}
      </p>
      <p className="text-xs text-[var(--cream)]/70">
        {player.status === "escaped" ? "Escaped" : `${player.cardCount} cards`}
        {isHost ? " · Host" : ""}
      </p>
      {!player.connected && <p className="text-[10px] text-amber-300">Away</p>}
    </div>
  );
}
