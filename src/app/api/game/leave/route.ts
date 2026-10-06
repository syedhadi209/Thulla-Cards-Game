import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
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

  const { data: me } = await admin
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me) return apiError("NOT_GAME_MEMBER", "Not a member", 403);

  const isHost = game.host_id === user.id;
  const now = new Date().toISOString();

  // Host leave ends the game for everyone
  if (isHost && (game.status === "waiting" || game.status === "playing" || game.status === "starting")) {
    const endedStatus = game.status === "waiting" ? "cancelled" : "finished";
    await admin
      .from("games")
      .update({
        status: endedStatus,
        finished_at: now,
        current_turn: null,
        public_state: {
          ...(typeof game.public_state === "object" && game.public_state ? game.public_state : {}),
          phase: endedStatus,
          announcements: ["Host left — game ended"],
        },
      })
      .eq("id", gameId);

    if (game.status === "waiting") {
      await admin.from("players").delete().eq("game_id", gameId).eq("user_id", user.id);
    } else {
      await admin
        .from("players")
        .update({ connected: false, last_seen_at: now })
        .eq("game_id", gameId)
        .eq("user_id", user.id);
    }

    return apiOk({ left: true, ended: true, status: endedStatus });
  }

  if (game.status === "waiting") {
    await admin.from("players").delete().eq("game_id", gameId).eq("user_id", user.id);
    const { data: remaining } = await admin.from("players").select("user_id").eq("game_id", gameId);
    const ids = (remaining ?? []).map((p) => p.user_id);

    if (ids.length === 0) {
      await admin.from("games").update({ status: "cancelled", finished_at: now }).eq("id", gameId);
    } else {
      await admin
        .from("games")
        .update({
          public_state: {
            ...(typeof game.public_state === "object" && game.public_state ? game.public_state : {}),
            activePlayerIds: ids,
            playerOrder: ids,
          },
        })
        .eq("id", gameId);
    }
    return apiOk({ left: true });
  }

  await admin
    .from("players")
    .update({ connected: false, last_seen_at: now })
    .eq("game_id", gameId)
    .eq("user_id", user.id);

  return apiOk({ left: false, disconnected: true });
}
