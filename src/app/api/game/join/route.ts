import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createServiceClient } from "@/lib/supabase/server";
import { joinGameSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_ARGUMENT", "Invalid JSON");
  }

  const parsed = joinGameSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_ARGUMENT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { gameId, nickname } = parsed.data;
  const admin = createServiceClient();

  const { data: game, error } = await admin.from("games").select("*").eq("id", gameId).maybeSingle();
  if (error || !game) return apiError("GAME_NOT_FOUND", "Game not found", 404);

  const { data: existingPlayers } = await admin.from("players").select("*").eq("game_id", gameId);
  const players = existingPlayers ?? [];
  const me = players.find((p) => p.user_id === user.id);

  if (me) {
    await admin
      .from("players")
      .update({ nickname, connected: true, last_seen_at: new Date().toISOString() })
      .eq("game_id", gameId)
      .eq("user_id", user.id);
    return apiOk({ gameId, reconnected: true });
  }

  if (game.status !== "waiting") {
    return apiError("GAME_NOT_JOINABLE", "Game is not joinable");
  }

  if (players.length >= game.max_players) {
    return apiError("GAME_FULL", "Game is full");
  }

  const nickTaken = players.some(
    (p) => String(p.nickname).toLowerCase() === nickname.toLowerCase(),
  );
  if (nickTaken) return apiError("NICKNAME_TAKEN", "Nickname already used");

  const { error: insertErr } = await admin.from("players").insert({
    game_id: gameId,
    user_id: user.id,
    nickname,
    connected: true,
    card_count: 0,
    status: "active",
  });
  if (insertErr) return apiError("INTERNAL", insertErr.message, 500);

  const activeIds = [...players.map((p) => p.user_id), user.id];
  await admin
    .from("games")
    .update({
      public_state: {
        ...(game.public_state as object),
        activePlayerIds: activeIds,
        playerOrder: activeIds,
      },
    })
    .eq("id", gameId);

  return apiOk({ gameId, reconnected: false });
}
