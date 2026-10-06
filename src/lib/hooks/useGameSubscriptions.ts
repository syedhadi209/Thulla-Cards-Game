"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth";
import type { PublicState } from "@/lib/game/publicState";

export interface GameMeta {
  status: "waiting" | "starting" | "playing" | "finished" | "cancelled";
  hostId: string;
  maxPlayers: number;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  currentTurn: string | null;
  turnNumber: number;
  turnStartedAt: number | null;
  turnExpiresAt: number | null;
  winnerId: string | null;
  loserId: string | null;
  stateVersion: number;
}

export interface PlayerInfo {
  nickname: string;
  joinedAt: number;
  connected: boolean;
  lastSeenAt: number;
  cardCount: number;
  status: string;
}

export type { PublicState };

const FALLBACK_POLL_MS = 10_000;
const RELOAD_DEBOUNCE_MS = 300;
const PRESENCE_HEARTBEAT_MS = 60_000;

function mapGameRow(row: Record<string, unknown>): GameMeta {
  return {
    status: row.status as GameMeta["status"],
    hostId: String(row.host_id),
    maxPlayers: Number(row.max_players),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : Date.now(),
    startedAt: row.started_at ? new Date(String(row.started_at)).getTime() : null,
    finishedAt: row.finished_at ? new Date(String(row.finished_at)).getTime() : null,
    currentTurn: row.current_turn ? String(row.current_turn) : null,
    turnNumber: Number(row.turn_number ?? 0),
    turnStartedAt: null,
    turnExpiresAt: row.turn_expires_at
      ? new Date(String(row.turn_expires_at)).getTime()
      : null,
    winnerId: row.winner_id ? String(row.winner_id) : null,
    loserId: row.loser_id ? String(row.loser_id) : null,
    stateVersion: 0,
  };
}

function mapPlayerRow(row: Record<string, unknown>): PlayerInfo {
  return {
    nickname: String(row.nickname),
    joinedAt: row.joined_at ? new Date(String(row.joined_at)).getTime() : Date.now(),
    connected: Boolean(row.connected),
    lastSeenAt: row.last_seen_at ? new Date(String(row.last_seen_at)).getTime() : Date.now(),
    cardCount: Number(row.card_count ?? 0),
    status: String(row.status ?? "active"),
  };
}

async function fetchGameState(gameId: string) {
  const res = await fetch(`/api/game/state?gameId=${encodeURIComponent(gameId)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (res.status === 403 || res.status === 401) return { forbidden: true as const };
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Failed to load game");
  }
  return (await res.json()) as {
    game: Record<string, unknown>;
    players: Record<string, unknown>[];
    hand: string[];
  };
}

function usePresence(gameId: string | null) {
  const { uid } = useAuth();
  const [connectionLabel, setConnectionLabel] = useState<"connected" | "reconnecting" | "offline">(
    "connected",
  );

  useEffect(() => {
    if (!gameId || !uid) return;
    const supabase = createClient();
    let cancelled = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    async function mark(connected: boolean) {
      await supabase
        .from("players")
        .update({
          connected,
          last_seen_at: new Date().toISOString(),
        })
        .eq("game_id", gameId)
        .eq("user_id", uid);
    }

    async function bind() {
      try {
        setConnectionLabel("reconnecting");
        await mark(true);
        if (!cancelled) setConnectionLabel("connected");
      } catch {
        if (!cancelled) setConnectionLabel("offline");
      }
    }

    void bind();
    heartbeat = setInterval(() => {
      void mark(true);
    }, PRESENCE_HEARTBEAT_MS);

    const onOnline = () => {
      setConnectionLabel("reconnecting");
      void bind();
    };
    const onOffline = () => {
      setConnectionLabel("offline");
      void mark(false);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      void mark(false);
    };
  }, [gameId, uid]);

  return connectionLabel;
}

/**
 * Live room state via Supabase Realtime.
 * Polls every 10s only while the channel is not subscribed.
 */
export function useGameRoom(gameId: string | null, reloadToken = 0) {
  const { uid } = useAuth();
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [publicState, setPublicState] = useState<PublicState | null>(null);
  const [players, setPlayers] = useState<Record<string, PlayerInfo>>({});
  const [hand, setHand] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(Boolean(gameId));
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "polling">("connecting");
  const inFlight = useRef(false);
  const pendingReload = useRef(false);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadAgain = useRef<(opts?: { silent?: boolean }) => Promise<void>>(async () => undefined);

  const applyState = useCallback(
    (payload: {
      game: Record<string, unknown>;
      players: Record<string, unknown>[];
      hand: string[];
    }) => {
      setMeta(mapGameRow(payload.game));
      setPublicState((payload.game.public_state as PublicState) ?? null);
      const map: Record<string, PlayerInfo> = {};
      for (const row of payload.players) {
        map[String(row.user_id)] = mapPlayerRow(row);
      }
      setPlayers(map);
      setHand(payload.hand ?? []);
      setIsMember(true);
      setError(null);
    },
    [],
  );

  const reload = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!gameId) return;
      if (inFlight.current) {
        pendingReload.current = true;
        return;
      }
      inFlight.current = true;
      if (!opts?.silent) setLoading(true);
      try {
        const result = await fetchGameState(gameId);
        if ("forbidden" in result && result.forbidden) {
          setMeta(null);
          setPublicState(null);
          setPlayers({});
          setHand([]);
          setIsMember(false);
          setError(null);
          return;
        }
        applyState(
          result as {
            game: Record<string, unknown>;
            players: Record<string, unknown>[];
            hand: string[];
          },
        );
      } catch (err) {
        if (!opts?.silent) {
          setError(err instanceof Error ? err.message : "Failed to load game");
          setIsMember(false);
        }
      } finally {
        inFlight.current = false;
        if (!opts?.silent) setLoading(false);
        if (pendingReload.current) {
          pendingReload.current = false;
          queueMicrotask(() => {
            void reloadAgain.current({ silent: true });
          });
        }
      }
    },
    [gameId, applyState],
  );

  useEffect(() => {
    reloadAgain.current = reload;
  }, [reload]);

  const scheduleReload = useCallback(
    (opts?: { silent?: boolean }) => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => {
        reloadTimer.current = null;
        void reload(opts);
      }, RELOAD_DEBOUNCE_MS);
    },
    [reload],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, [reload, reloadToken]);

  // WebSocket: Supabase Realtime
  useEffect(() => {
    if (!gameId || !isMember) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`room-ws-${gameId}`, { config: { broadcast: { self: true } } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        () => {
          scheduleReload({ silent: true });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        () => {
          scheduleReload({ silent: true });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hands", filter: `game_id=eq.${gameId}` },
        () => {
          scheduleReload({ silent: true });
        },
      )
      .on("broadcast", { event: "room_updated" }, () => {
        scheduleReload({ silent: true });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("polling");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [gameId, isMember, scheduleReload]);

  useEffect(() => {
    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
    };
  }, []);

  // Fallback only while the websocket is down or still connecting.
  useEffect(() => {
    if (!gameId || !isMember || realtimeStatus === "live") return;
    const id = setInterval(() => {
      scheduleReload({ silent: true });
    }, FALLBACK_POLL_MS);
    return () => clearInterval(id);
  }, [gameId, isMember, realtimeStatus, scheduleReload]);

  const connectionLabel = usePresence(isMember && uid ? gameId : null);

  return {
    meta,
    publicState,
    players,
    hand,
    error,
    isMember,
    loading,
    reload: () => reload({ silent: false }),
    connectionLabel,
    realtimeStatus,
  };
}
