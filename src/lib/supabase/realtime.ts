"use client";

import { createClient } from "./client";

/** Ping other clients on the room channel. Does not close it — the game page owns that subscription. */
export async function notifyRoomUpdated(gameId: string) {
  const supabase = createClient();
  const existing = supabase
    .getChannels()
    .find((channel) => channel.topic === `realtime:room-ws-${gameId}`);
  if (!existing) return;
  await existing.send({
    type: "broadcast",
    event: "room_updated",
    payload: { at: Date.now() },
  });
}
