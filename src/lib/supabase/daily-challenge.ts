"use client";

import { InkAvatarConfig } from "@/types";
import { createClient } from "./client";

export interface DailyLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarConfig: InkAvatarConfig;
  bestScore: number;
  correct: number;
  attempts: number;
}

interface DbDailyScore {
  user_id: string;
  username: string | null;
  avatar_config: Record<string, unknown> | null;
  best_score: number;
  correct: number;
  attempts: number;
}

/**
 * Upserts this player's daily challenge score for today.
 * Only updates best_score if the new score is higher (enforced via SQL GREATEST).
 */
export async function saveDailyChallengeScore(
  userId: string,
  date: string,
  score: number,
  correct: number,
  attempts: number,
  username: string,
  avatarConfig: InkAvatarConfig
): Promise<void> {
  const supabase = createClient();

  // First try to read existing row to apply GREATEST manually (Supabase doesn't support UPDATE SET col = GREATEST(...) via JS client easily)
  const { data: existing } = await supabase
    .from("daily_challenge_scores")
    .select("best_score, correct, attempts")
    .eq("user_id", userId)
    .eq("challenge_date", date)
    .maybeSingle();

  const prevBest = (existing as { best_score?: number } | null)?.best_score ?? -1;
  const isNewBest = score > prevBest;

  const { error } = await supabase
    .from("daily_challenge_scores")
    .upsert(
      {
        user_id: userId,
        challenge_date: date,
        best_score: isNewBest ? score : prevBest,
        correct: isNewBest ? correct : ((existing as { correct?: number } | null)?.correct ?? correct),
        attempts,
        username,
        avatar_config: avatarConfig as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,challenge_date" }
    );

  if (error && typeof window !== "undefined") {
    console.error("[DailyChallenge] Failed to save score:", error.message);
  }
}

/** Fetches today's top scores for the global leaderboard. */
export async function fetchDailyLeaderboard(
  date: string,
  limit = 50
): Promise<DailyLeaderboardEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("daily_challenge_scores")
    .select("user_id, username, avatar_config, best_score, correct, attempts")
    .eq("challenge_date", date)
    .order("best_score", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as DbDailyScore[]).map((row, i) => ({
    rank: i + 1,
    userId: row.user_id,
    username: row.username ?? "Challenger",
    avatarConfig: {
      base: "droplet_01",
      color: "#1E293B",
      eyes: "eyes_01",
      accessory: "none",
      aura: "none",
      ...(row.avatar_config as object),
    } as InkAvatarConfig,
    bestScore: row.best_score,
    correct: row.correct,
    attempts: row.attempts,
  }));
}
