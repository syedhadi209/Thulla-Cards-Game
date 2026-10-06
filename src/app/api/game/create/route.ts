import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { generateGameId } from "@/lib/game/gameId";
import { createServiceClient } from "@/lib/supabase/server";
import { createGameSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_ARGUMENT", "Invalid JSON");
  }

  const parsed = createGameSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_ARGUMENT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { nickname, maxPlayers } = parsed.data;
  const admin = createServiceClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const gameId = generateGameId();
    const { error: gameErr } = await admin.from("games").insert({
      id: gameId,
      status: "waiting",
      host_id: user.id,
      max_players: maxPlayers,
      public_state: {
        phase: "lobby",
        ledSuit: null,
        trickCards: [],
        activePlayerIds: [user.id],
        announcements: [],
        escapeOrder: {},
        playerOrder: [user.id],
        mustLeadAS: false,
      },
    });

    if (gameErr) {
      if (gameErr.code === "23505") continue;
      return apiError("INTERNAL", gameErr.message, 500);
    }

    const { error: playerErr } = await admin.from("players").insert({
      game_id: gameId,
      user_id: user.id,
      nickname,
      connected: true,
      card_count: 0,
      status: "active",
    });

    if (playerErr) {
      await admin.from("games").delete().eq("id", gameId);
      return apiError("INTERNAL", playerErr.message, 500);
    }

    return apiOk({ gameId });
  }

  return apiError("INTERNAL", "Could not allocate game ID", 500);
}
