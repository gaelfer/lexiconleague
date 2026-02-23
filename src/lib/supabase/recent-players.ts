"use client";

import { createClient } from "./client";

export interface RecentPlayerEntry {
  played_with_id: string;
  username: string;
  avatar_config: Record<string, unknown>;
  last_played_at: string;
  games_played: number;
}

/** Record match participants as recent players for the current user. */
export async function recordRecentPlayers(
  userId: string,
  playerIds: string[]
): Promise<void> {
  const supabase = createClient();

  const others = playerIds.filter((id) => id !== userId);
  if (others.length === 0) return;

  const now = new Date().toISOString();

  // Upsert: if already played with them, increment games_played and update timestamp
  await supabase.from("recent_players").upsert(
    others.map((playedWithId) => ({
      user_id: userId,
      played_with_id: playedWithId,
      last_played_at: now,
      games_played: 1,
    })),
    {
      onConflict: "user_id,played_with_id",
      ignoreDuplicates: false,
    }
  );
}

/** Get the most recent players for a user (up to 10). */
export async function getRecentPlayers(userId: string): Promise<RecentPlayerEntry[]> {
  const supabase = createClient();

  const { data: rows, error } = await supabase
    .from("recent_players")
    .select("played_with_id, last_played_at, games_played")
    .eq("user_id", userId)
    .order("last_played_at", { ascending: false })
    .limit(10);

  if (error || !rows?.length) return [];

  type RecentRow = { played_with_id: string; last_played_at: string; games_played: number };
  const ids = (rows as RecentRow[]).map((r) => r.played_with_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_config")
    .in("id", ids);

  type ProfileRow = { id: string; username?: string; avatar_config?: unknown };
  const byId = new Map<string, ProfileRow>(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  return (rows as RecentRow[]).map((r) => ({
    played_with_id: r.played_with_id,
    username: byId.get(r.played_with_id)?.username ?? "Challenger",
    avatar_config:
      (byId.get(r.played_with_id)?.avatar_config as Record<string, unknown>) ?? {},
    last_played_at: r.last_played_at,
    games_played: r.games_played,
  }));
}
