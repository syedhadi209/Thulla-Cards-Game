import type { EngineState } from "./types";

export interface PublicState {
  phase: string;
  ledSuit: string | null;
  trickCards: { playerId: string; cardId: string }[];
  activePlayerIds: string[];
  announcements: string[];
  escapeOrder: Record<string, number>;
  playerOrder: string[];
  mustLeadAS: boolean;
}

export function publicStateFromEngine(engine: EngineState): PublicState {
  const activePlayerIds = engine.playerOrder.filter(
    (id) => engine.players[id]?.status === "active",
  );
  const escapeOrder: Record<string, number> = {};
  for (const id of engine.playerOrder) {
    const order = engine.players[id]?.escapeOrder;
    if (order != null) escapeOrder[id] = order;
  }

  return {
    phase: engine.status === "finished" ? "finished" : "playing",
    ledSuit: engine.ledSuit,
    trickCards: engine.trickCards,
    activePlayerIds,
    announcements: [],
    escapeOrder,
    playerOrder: engine.playerOrder,
    mustLeadAS: engine.mustLeadAS,
  };
}
