import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { generateGameId } from "@/lib/game/gameId";
import { createServiceClient } from "@/lib/supabase/server";
import { rematchSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_ARGUMENT", "Invalid JSON");
  }

  const parsed = rematchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_ARGUMENT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { gameId } = parsed.data;
  const admin = createServiceClient();

  const { data: old } = await admin.from("games").select("*").eq("id", gameId).maybeSingle();
  if (!old) return apiError("GAME_NOT_FOUND", "Game not found", 404);
  if (old.status !== "finished") {
    return apiError("INVALID_MOVE", "Rematch only after finished games");
  }

  const { data: me } = await admin
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me) return apiError("NOT_GAME_MEMBER", "Not a member", 403);

  const { data: oldPlayers } = await admin.from("players").select("*").eq("game_id", gameId);
  const list = oldPlayers ?? [];

  for (let attempt = 0; attempt < 5; attempt++) {
    const newId = generateGameId();
    const ids = list.map((p) => p.user_id as string);

    const { error: gameErr } = await admin.from("games").insert({
      id: newId,
      status: "waiting",
      host_id: user.id,
      max_players: old.max_players,
      public_state: {
        phase: "lobby",
        ledSuit: null,
        trickCards: [],
        activePlayerIds: ids,
        announcements: ["Rematch lobby"],
        escapeOrder: {},
        playerOrder: ids,
        mustLeadAS: false,
      },
    });

    if (gameErr) {
      if (gameErr.code === "23505") continue;
      return apiError("INTERNAL", gameErr.message, 500);
    }

    const rows = list.map((p) => ({
      game_id: newId,
      user_id: p.user_id,
      nickname: p.nickname,
      connected: p.user_id === user.id,
      card_count: 0,
      status: "active",
    }));

    const { error: playerErr } = await admin.from("players").insert(rows);
    if (playerErr) {
      await admin.from("games").delete().eq("id", newId);
      return apiError("INTERNAL", playerErr.message, 500);
    }

    return apiOk({ gameId: newId });
  }

  return apiError("INTERNAL", "Could not create rematch", 500);
}
