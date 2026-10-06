import { Card, CardId, RANKS, SUITS } from "./types";

export function parseCardId(id: CardId): Card {
  if (id.startsWith("10")) {
    return { id, rank: "10", suit: id.slice(2) as Card["suit"] };
  }
  return { id, rank: id.slice(0, -1) as Card["rank"], suit: id.slice(-1) as Card["suit"] };
}

export function createDeck(): CardId[] {
  const deck: CardId[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}` as CardId);
    }
  }
  return deck;
}

export type Rng = () => number;

/** Secure RNG using Web Crypto / Node crypto getRandomValues. Returns [0, 1). */
export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! / 2 ** 32;
}

/** Fisher–Yates shuffle. Does not mutate the input array. */
export function shuffleDeck(deck: CardId[], rng: Rng = secureRandom): CardId[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

/** Deal entire deck round-robin to players. */
export function dealAll(deck: CardId[], playerIds: string[]): Record<string, CardId[]> {
  const hands: Record<string, CardId[]> = {};
  for (const id of playerIds) {
    hands[id] = [];
  }
  deck.forEach((card, index) => {
    const playerId = playerIds[index % playerIds.length]!;
    hands[playerId]!.push(card);
  });
  return hands;
}

export function removeCardFromHand(hand: CardId[], cardId: CardId): CardId[] {
  const idx = hand.indexOf(cardId);
  if (idx === -1) return hand;
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}

export function addCardsToHand(hand: CardId[], cards: CardId[]): CardId[] {
  return [...hand, ...cards];
}

export function rankValue(rank: Card["rank"]): number {
  return RANKS.indexOf(rank);
}

export const SUIT_ORDER: Record<Card["suit"], number> = {
  S: 0,
  H: 1,
  D: 2,
  C: 3,
};

export function compareCards(a: CardId, b: CardId): number {
  const ca = parseCardId(a);
  const cb = parseCardId(b);
  const rankDiff = rankValue(ca.rank) - rankValue(cb.rank);
  if (rankDiff !== 0) return rankDiff;
  return SUIT_ORDER[ca.suit] - SUIT_ORDER[cb.suit];
}
