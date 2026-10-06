import { notifyRoomUpdated } from "@/lib/supabase/realtime";

export async function createGame(input: { nickname: string; maxPlayers: number }) {
  return post<{ gameId: string }>("/api/game/create", input);
}

export async function joinGame(input: { gameId: string; nickname: string }) {
  const data = await post<{ gameId: string; reconnected: boolean }>("/api/game/join", input);
  void notifyRoomUpdated(input.gameId);
  return data;
}

export async function leaveGame(input: { gameId: string }) {
  const data = await post<{ left: boolean; disconnected?: boolean }>("/api/game/leave", input);
  void notifyRoomUpdated(input.gameId);
  return data;
}

export async function startGame(input: { gameId: string }) {
  const data = await post<{ started: boolean }>("/api/game/start", input);
  void notifyRoomUpdated(input.gameId);
  return data;
}

export async function playAction(input: {
  gameId: string;
  type: "PLAY_CARD";
  payload: { cardId: string };
}) {
  const data = await post<{ ok: boolean }>("/api/game/play", input);
  void notifyRoomUpdated(input.gameId);
  return data;
}

export async function rematch(input: { gameId: string }) {
  return post<{ gameId: string }>("/api/game/rematch", input);
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = (await res.json()) as T & { code?: string; message?: string };
  if (!res.ok) {
    const err = new Error(data.message ?? "Request failed") as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data;
}

export function mapApiError(err: unknown): string {
  if (typeof err === "object" && err && "code" in err) {
    const code = String((err as { code?: string }).code ?? "");
    const messages: Record<string, string> = {
      GAME_NOT_FOUND: "Game not found.",
      GAME_FULL: "This game is full.",
      GAME_ALREADY_STARTED: "The game has already started.",
      GAME_NOT_JOINABLE: "You cannot join this game.",
      GAME_FINISHED: "This game is finished.",
      NOT_GAME_MEMBER: "You are not in this game.",
      NOT_HOST: "Only the host can do that.",
      NOT_YOUR_TURN: "It is not your turn.",
      CARD_NOT_IN_HAND: "That card is not in your hand.",
      INVALID_MOVE: "That move is not allowed.",
      NICKNAME_TAKEN: "That nickname is already taken.",
      NOT_ENOUGH_PLAYERS: "Waiting for more players.",
      UNAUTHENTICATED: "Please sign in to continue.",
      INVALID_ARGUMENT: err instanceof Error ? err.message : "Invalid input.",
    };
    if (messages[code]) return messages[code];
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
