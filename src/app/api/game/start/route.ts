import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createDeck, dealAll, shuffleDeck } from "@/lib/game/deck";
import { createInitialEngineState } from "@/lib/game/engine";
import { publicStateFromEngine } from "@/lib/game/publicState";
import { createServiceClient } from "@/lib/supabase/server";
import { gameIdOnlySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_ARGUMENT", "Invalid JSON");
  }

  const parsed = gameIdOnlySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_ARGUMENT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { gameId } = parsed.data;
  const admin = createServiceClient();

  const { data: game } = await admin.from("games").select("*").eq("id", gameId).maybeSingle();
  if (!game) return apiError("GAME_NOT_FOUND", "Game not found", 404);
  if (game.host_id !== user.id) return apiError("NOT_HOST", "Only the host can start", 403);
  if (game.status !== "waiting") return apiError("GAME_ALREADY_STARTED", "Game already started");

  const { data: players } = await admin
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  const list = players ?? [];
  if (list.length !== game.max_players) {
    return apiError(
      "NOT_ENOUGH_PLAYERS",
      `Need exactly ${game.max_players} players (have ${list.length})`,
    );
  }

  const ordered = list.map((p) => p.user_id as string);
  const hands = dealAll(shuffleDeck(createDeck()), ordered);
  const engine = createInitialEngineState(ordered, hands);
  const publicState = publicStateFromEngine(engine);

  const { error: gameErr } = await admin
    .from("games")
    .update({
      status: "playing",
      started_at: new Date().toISOString(),
      current_turn: engine.currentTurn,
      turn_number: engine.turnNumber,
      turn_expires_at: null,
      winner_id: null,
      loser_id: null,
      public_state: publicState,
      engine,
    })
    .eq("id", gameId);

  if (gameErr) return apiError("INTERNAL", gameErr.message, 500);

  for (const pid of ordered) {
    await admin.from("hands").upsert({
      game_id: gameId,
      user_id: pid,
      cards: hands[pid] ?? [],
    });
    await admin
      .from("players")
      .update({
        card_count: hands[pid]?.length ?? 0,
        status: "active",
      })
      .eq("game_id", gameId)
      .eq("user_id", pid);
  }

  return apiOk({ started: true });
}
