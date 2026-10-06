import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { applyAction } from "@/lib/game/engine";
import { publicStateFromEngine } from "@/lib/game/publicState";
import { EngineError, type CardId, type EngineState, type PlayCardAction } from "@/lib/game/types";
import { createServiceClient } from "@/lib/supabase/server";
import { playActionSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_ARGUMENT", "Invalid JSON");
  }

  const parsed = playActionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_ARGUMENT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { gameId, type, payload } = parsed.data;
  const admin = createServiceClient();

  const { data: game } = await admin.from("games").select("*").eq("id", gameId).maybeSingle();
  if (!game) return apiError("GAME_NOT_FOUND", "Game not found", 404);
  if (game.status !== "playing") return apiError("GAME_FINISHED", "Game is not playing");

  const { data: me } = await admin
    .from("players")
    .select("user_id")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me) return apiError("NOT_GAME_MEMBER", "Not a member", 403);

  const engine = game.engine as EngineState | null;
  if (!engine) return apiError("INTERNAL", "Missing engine state", 500);

  const action: PlayCardAction = {
    actionId: crypto.randomUUID(),
    type,
    playerId: user.id,
    payload: { cardId: payload.cardId as CardId },
  };

  let next: EngineState;
  try {
    next = applyAction(engine, action);
  } catch (err) {
    if (err instanceof EngineError) {
      const map: Record<string, Parameters<typeof apiError>[0]> = {
        NOT_YOUR_TURN: "NOT_YOUR_TURN",
        CARD_NOT_IN_HAND: "CARD_NOT_IN_HAND",
        INVALID_MOVE: "INVALID_MOVE",
        GAME_FINISHED: "GAME_FINISHED",
        GAME_NOT_PLAYING: "GAME_FINISHED",
        PLAYER_NOT_ACTIVE: "NOT_GAME_MEMBER",
      };
      return apiError(map[err.code] ?? "INVALID_MOVE", err.message);
    }
    throw err;
  }

  const { error: gameErr } = await admin
    .from("games")
    .update({
      status: next.status,
      current_turn: next.currentTurn,
      turn_number: next.turnNumber,
      winner_id: next.winnerId,
      loser_id: next.loserId,
      finished_at: next.status === "finished" ? new Date().toISOString() : null,
      public_state: publicStateFromEngine(next),
      engine: next,
    })
    .eq("id", gameId);

  if (gameErr) return apiError("INTERNAL", gameErr.message, 500);

  for (const pid of next.playerOrder) {
    const p = next.players[pid]!;
    await admin.from("hands").upsert({
      game_id: gameId,
      user_id: pid,
      cards: p.hand,
    });
    await admin
      .from("players")
      .update({
        card_count: p.hand.length,
        status: p.status,
      })
      .eq("game_id", gameId)
      .eq("user_id", pid);
  }

  return apiOk({ ok: true });
}
