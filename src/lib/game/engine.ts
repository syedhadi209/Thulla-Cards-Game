import {
  addCardsToHand,
  compareCards,
  parseCardId,
  removeCardFromHand,
} from "./deck";
import {
  CardId,
  EngineError,
  EngineState,
  GameAction,
  PlayCardAction,
  Suit,
  TrickCard,
} from "./types";

export function createInitialEngineState(
  playerOrder: string[],
  hands: Record<string, CardId[]>,
): EngineState {
  const players: EngineState["players"] = {};
  for (const id of playerOrder) {
    players[id] = {
      id,
      hand: [...(hands[id] ?? [])],
      status: "active",
      escapeOrder: null,
    };
  }

  const asHolder =
    playerOrder.find((id) => players[id]!.hand.includes("AS")) ?? playerOrder[0]!;

  return {
    status: "playing",
    playerOrder,
    players,
    currentTurn: asHolder,
    turnNumber: 1,
    stateVersion: 1,
    ledSuit: null,
    trickCards: [],
    mustLeadAS: true,
    winnerId: null,
    loserId: null,
    escapeCounter: 0,
  };
}

export function getActivePlayerIds(state: EngineState): string[] {
  return state.playerOrder.filter((id) => state.players[id]?.status === "active");
}

function nextActiveAfter(state: EngineState, playerId: string): string | null {
  const active = getActivePlayerIds(state);
  if (active.length === 0) return null;
  const idx = active.indexOf(playerId);
  if (idx === -1) return active[0]!;
  return active[(idx + 1) % active.length]!;
}

export function getValidMoves(state: EngineState, playerId: string): CardId[] {
  const player = state.players[playerId];
  if (!player || player.status !== "active") return [];
  if (state.status !== "playing") return [];
  if (state.currentTurn !== playerId) return [];

  const hand = player.hand;

  if (state.mustLeadAS && state.trickCards.length === 0) {
    return hand.includes("AS") ? ["AS"] : [];
  }

  if (state.trickCards.length === 0 || state.ledSuit === null) {
    return [...hand];
  }

  const ledSuit = state.ledSuit;
  const ofSuit = hand.filter((c) => parseCardId(c).suit === ledSuit);
  return ofSuit.length > 0 ? ofSuit : [...hand];
}

export function validateAction(state: EngineState, action: GameAction): void {
  if (state.status === "finished") {
    throw new EngineError("GAME_FINISHED", "Game is finished");
  }
  if (state.status !== "playing") {
    throw new EngineError("GAME_NOT_PLAYING", "Game is not in playing state");
  }

  const player = state.players[action.playerId];
  if (!player || player.status !== "active") {
    throw new EngineError("PLAYER_NOT_ACTIVE", "Player is not active");
  }
  if (state.currentTurn !== action.playerId) {
    throw new EngineError("NOT_YOUR_TURN", "It is not your turn");
  }

  if (action.type !== "PLAY_CARD") {
    throw new EngineError("INVALID_MOVE", "Unknown action type");
  }

  const cardId = action.payload.cardId;
  if (!player.hand.includes(cardId)) {
    throw new EngineError("CARD_NOT_IN_HAND", "Card is not in hand");
  }

  const valid = getValidMoves(state, action.playerId);
  if (!valid.includes(cardId)) {
    throw new EngineError("INVALID_MOVE", "Card is not a legal play");
  }
}

function highestOfLedSuit(trickCards: TrickCard[], ledSuit: Suit): TrickCard {
  let best = trickCards[0]!;
  for (const tc of trickCards) {
    const card = parseCardId(tc.cardId);
    if (card.suit !== ledSuit) continue;
    const bestCard = parseCardId(best.cardId);
    if (bestCard.suit !== ledSuit || compareCards(tc.cardId, best.cardId) > 0) {
      best = tc;
    }
  }
  return best;
}

function markEscapes(state: EngineState): EngineState {
  let next = state;
  for (const id of state.playerOrder) {
    const p = next.players[id]!;
    if (p.status === "active" && p.hand.length === 0) {
      const escapeOrder = next.escapeCounter + 1;
      next = {
        ...next,
        escapeCounter: escapeOrder,
        winnerId: next.winnerId ?? (escapeOrder === 1 ? id : next.winnerId),
        players: {
          ...next.players,
          [id]: { ...p, status: "escaped", escapeOrder },
        },
      };
    }
  }
  return maybeFinish(next);
}

function maybeFinish(state: EngineState): EngineState {
  const active = getActivePlayerIds(state);
  if (active.length <= 1) {
    const loserId = active[0] ?? null;
    return {
      ...state,
      status: "finished",
      currentTurn: null,
      loserId,
      winnerId:
        state.winnerId ??
        state.playerOrder.find(
          (id) => state.players[id]?.escapeOrder === 1,
        ) ??
        null,
    };
  }
  return state;
}

function resolveTrick(state: EngineState, thulla: boolean): EngineState {
  const ledSuit = state.ledSuit!;
  const winner = highestOfLedSuit(state.trickCards, ledSuit);
  const trickCardIds = state.trickCards.map((t) => t.cardId);

  let next: EngineState = {
    ...state,
    trickCards: [],
    ledSuit: null,
    mustLeadAS: false,
  };

  if (thulla) {
    const picker = next.players[winner.playerId]!;
    next = {
      ...next,
      players: {
        ...next.players,
        [winner.playerId]: {
          ...picker,
          hand: addCardsToHand(picker.hand, trickCardIds),
        },
      },
    };
  }

  next = markEscapes(next);
  if (next.status === "finished") return next;

  // Leader may have escaped after a clean trick (played last card).
  let leader = winner.playerId;
  if (next.players[leader]?.status !== "active") {
    leader = nextActiveAfter(next, leader) ?? leader;
  }

  return {
    ...next,
    currentTurn: leader,
    turnNumber: next.turnNumber + 1,
  };
}

export function applyAction(state: EngineState, action: GameAction): EngineState {
  validateAction(state, action);
  const play = action as PlayCardAction;
  const cardId = play.payload.cardId;
  const card = parseCardId(cardId);
  const player = state.players[play.playerId]!;

  let next: EngineState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    players: {
      ...state.players,
      [play.playerId]: {
        ...player,
        hand: removeCardFromHand(player.hand, cardId),
      },
    },
    trickCards: [...state.trickCards, { playerId: play.playerId, cardId }],
    mustLeadAS: false,
  };

  const isLead = state.trickCards.length === 0;
  if (isLead) {
    next = { ...next, ledSuit: card.suit };
  }

  const ledSuit = next.ledSuit!;
  const isThulla = !isLead && card.suit !== ledSuit;
  const active = getActivePlayerIds(state);
  const allFollowed = next.trickCards.length >= active.length;

  if (isThulla || allFollowed) {
    return resolveTrick(next, isThulla);
  }

  const following = nextActiveAfter(next, play.playerId);
  return {
    ...next,
    currentTurn: following,
    turnNumber: next.turnNumber + 1,
  };
}

export function pickAutoPlayCard(state: EngineState, playerId: string): CardId | null {
  const moves = getValidMoves(state, playerId);
  if (moves.length === 0) return null;
  return [...moves].sort(compareCards)[0]!;
}

export function isGameComplete(state: EngineState): boolean {
  return state.status === "finished";
}

export function getNextTurn(state: EngineState): string | null {
  return state.currentTurn;
}
