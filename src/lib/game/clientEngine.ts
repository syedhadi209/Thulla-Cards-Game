/**
 * Client-side helpers for UI highlighting only.
 * Authoritative validation remains on Cloud Functions.
 */

export type Suit = "S" | "H" | "D" | "C";
export type CardId = string;

export interface TrickCard {
  playerId: string;
  cardId: CardId;
}

function parseSuit(id: CardId): Suit {
  return id.slice(-1) as Suit;
}

export function getClientValidMoves(params: {
  hand: CardId[];
  isMyTurn: boolean;
  mustLeadAS: boolean;
  trickCards: TrickCard[];
  ledSuit: Suit | null;
}): CardId[] {
  const { hand, isMyTurn, mustLeadAS, trickCards, ledSuit } = params;
  if (!isMyTurn) return [];

  if (mustLeadAS && trickCards.length === 0) {
    return hand.includes("AS") ? ["AS"] : [];
  }

  if (trickCards.length === 0 || !ledSuit) {
    return [...hand];
  }

  const ofSuit = hand.filter((c) => parseSuit(c) === ledSuit);
  return ofSuit.length > 0 ? ofSuit : [...hand];
}

export function sortHand(hand: CardId[]): CardId[] {
  const rankOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const suitOrder = ["S", "H", "D", "C"];
  return [...hand].sort((a, b) => {
    const ra = a.startsWith("10") ? "10" : a.slice(0, -1);
    const rb = b.startsWith("10") ? "10" : b.slice(0, -1);
    const sa = a.slice(-1);
    const sb = b.slice(-1);
    const rd = rankOrder.indexOf(ra) - rankOrder.indexOf(rb);
    if (rd !== 0) return rd;
    return suitOrder.indexOf(sa) - suitOrder.indexOf(sb);
  });
}
