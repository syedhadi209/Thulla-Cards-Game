"use client";

import { createClient } from "./client";

/** Ping other clients on this game over Supabase Realtime (WebSocket broadcast). */
export async function notifyRoomUpdated(gameId: string) {
  const supabase = createClient();
  const channel = supabase.channel(`room-ws-${gameId}`);
  await new Promise<void>((resolve) => {
    void channel.subscribe((status) => {
      if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        resolve();
      }
    });
  });
  await channel.send({
    type: "broadcast",
    event: "room_updated",
    payload: { at: Date.now() },
  });
  void supabase.removeChannel(channel);
}
