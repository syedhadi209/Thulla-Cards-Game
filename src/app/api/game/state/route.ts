import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createServiceClient } from "@/lib/supabase/server";
import { gameIdSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response!;

  const gameId = gameIdSchema.safeParse(
    new URL(request.url).searchParams.get("gameId") ?? "",
  );
  if (!gameId.success) {
    return apiError("INVALID_ARGUMENT", "Invalid game ID");
  }

  const admin = createServiceClient();
  const id = gameId.data;

  const { data: membership } = await admin
    .from("players")
    .select("user_id")
    .eq("game_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return apiError("NOT_GAME_MEMBER", "Not a member of this game", 403);
  }

  const { data: game, error: gameErr } = await admin
    .from("games")
    .select(
      "id, status, host_id, max_players, current_turn, turn_number, turn_expires_at, winner_id, loser_id, public_state, created_at, started_at, finished_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (gameErr || !game) return apiError("GAME_NOT_FOUND", "Game not found", 404);

  const { data: players } = await admin.from("players").select("*").eq("game_id", id);
  const { data: hand } = await admin
    .from("hands")
    .select("cards")
    .eq("game_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return apiOk({
    game,
    players: players ?? [],
    hand: (hand?.cards as string[] | undefined) ?? [],
  });
}
