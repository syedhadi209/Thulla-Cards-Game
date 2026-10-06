export type SeatDir = "self" | "left" | "right" | "top" | "topLeft" | "topRight";

const SLOTS: Record<number, SeatDir[]> = {
  1: ["self"],
  2: ["self", "top"],
  3: ["self", "left", "right"],
  4: ["self", "left", "top", "right"],
  5: ["self", "left", "topLeft", "topRight", "right"],
  6: ["self", "left", "topLeft", "top", "topRight", "right"],
};

export function seatSlots(playerCount: number): SeatDir[] {
  const n = Math.min(6, Math.max(1, playerCount));
  return SLOTS[n] ?? SLOTS[6]!;
}

export function relativeSeat(playerId: string, selfId: string | null, playerOrder: string[]): number {
  const order = playerOrder.length ? playerOrder : [playerId];
  const selfIdx = selfId && order.includes(selfId) ? order.indexOf(selfId) : 0;
  const idx = order.indexOf(playerId);
  if (idx < 0) return 0;
  return (idx - selfIdx + order.length) % order.length;
}

export function seatDirection(
  playerId: string,
  selfId: string | null,
  playerOrder: string[],
): SeatDir {
  const order = playerOrder.length ? playerOrder : [playerId];
  const rel = relativeSeat(playerId, selfId, order);
  return seatSlots(order.length)[rel] ?? "top";
}

/** Fly-in animation bucket. Corner seats use the top entrance. */
export function playFrom(dir: SeatDir): "self" | "left" | "right" | "top" {
  if (dir === "left" || dir === "right" || dir === "self") return dir;
  return "top";
}

export const SEAT_POSITION: Record<SeatDir, string> = {
  self: "bottom-1 left-1/2 z-10 -translate-x-1/2",
  left: "left-1 top-1/2 z-10 -translate-y-1/2",
  right: "right-1 top-1/2 z-10 -translate-y-1/2",
  top: "top-1 left-1/2 z-10 -translate-x-1/2",
  topLeft: "top-2 left-[8%] z-10 sm:left-[14%]",
  topRight: "top-2 right-[8%] z-10 sm:right-[14%]",
};
