export const SUITS = ["S", "H", "D", "C"] as const;
export const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export type CardId = `${Rank}${Suit}`;

export interface Card {
  id: CardId;
  rank: Rank;
  suit: Suit;
}

export type GameStatus = "waiting" | "starting" | "playing" | "finished" | "cancelled";
export type PlayerStatus = "active" | "escaped" | "disconnected";
export type TrickPhase = "leading" | "following" | "resolving";

export interface TrickCard {
  playerId: string;
  cardId: CardId;
}

export interface EnginePlayer {
  id: string;
  hand: CardId[];
  status: PlayerStatus;
  escapeOrder: number | null;
}

export interface EngineState {
  status: GameStatus;
  playerOrder: string[];
  players: Record<string, EnginePlayer>;
  currentTurn: string | null;
  turnNumber: number;
  stateVersion: number;
  ledSuit: Suit | null;
  trickCards: TrickCard[];
  mustLeadAS: boolean;
  winnerId: string | null;
  loserId: string | null;
  escapeCounter: number;
}

export type ActionType = "PLAY_CARD";

export interface PlayCardAction {
  actionId: string;
  type: "PLAY_CARD";
  playerId: string;
  payload: { cardId: CardId };
}

export type GameAction = PlayCardAction;

export type EngineErrorCode =
  | "GAME_NOT_PLAYING"
  | "NOT_YOUR_TURN"
  | "CARD_NOT_IN_HAND"
  | "INVALID_MOVE"
  | "PLAYER_NOT_ACTIVE"
  | "GAME_FINISHED";

export class EngineError extends Error {
  constructor(public code: EngineErrorCode, message: string) {
    super(message);
    this.name = "EngineError";
  }
}
