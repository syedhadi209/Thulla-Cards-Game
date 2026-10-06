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
  const escaped = player.status === "escaped";
  const stacks = escaped ? 0 : Math.min(3, Math.max(player.cardCount > 0 ? 1 : 0, Math.ceil(player.cardCount / 6)));

  return (
    <div
      className={[
        "flex min-w-[7.5rem] items-center gap-2 rounded-2xl px-3 py-2 text-left backdrop-blur-sm",
        "border border-white/10 bg-[#07160f]/80 shadow-[0_10px_24px_rgba(0,0,0,0.28)]",
        isTurn ? "seat-turn ring-2 ring-[var(--felt-gold)]" : "",
        escaped ? "seat-escaped" : "",
        !player.connected && !escaped ? "opacity-80" : "",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold",
          isTurn
            ? "bg-[var(--felt-gold)] text-[var(--felt-deep)]"
            : "bg-white/10 text-[var(--cream)]",
        ].join(" ")}
      >
        {player.nickname.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--cream)]">
          {player.nickname}
          {isSelf ? " (You)" : ""}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--cream)]/65">
          {escaped ? (
            "Escaped"
          ) : (
            <>
              <span className="flex items-center" aria-hidden>
                {Array.from({ length: stacks }).map((_, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src="/cards/back.png"
                    alt=""
                    className="h-5 w-3.5 rounded-[3px] object-cover shadow-sm ring-1 ring-black/20"
                    style={{ marginLeft: i === 0 ? 0 : -7 }}
                  />
                ))}
              </span>
              {player.cardCount} {player.cardCount === 1 ? "card" : "cards"}
            </>
          )}
          {isHost ? " · Host" : ""}
          {!player.connected ? " · Away" : ""}
        </span>
      </span>
    </div>
  );
}
