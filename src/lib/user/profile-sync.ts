import { UserProfile, RankTier } from "@/types";
import { getProfile, saveProfile, createGuestProfile, ensureRankRewardsUnlocked } from "./storage";
import { fetchProfile, upsertProfile, updateProfileGameProgress } from "@/lib/supabase/profile";
import { getTierFromTrophies } from "@/lib/game/rank";

/**
 * Push the current localStorage profile to Supabase.
 * Call after any local mutation (game result, purchase, daily reward, etc.).
 */
export async function syncCurrentProfile(userId: string): Promise<void> {
  const profile = getProfile();
  if (!profile) return;
  const normalized: UserProfile = {
    ...profile,
    id: userId,
  };
  const progressResult = await updateProfileGameProgress(userId, {
    trophies: normalized.trophies ?? 0,
    xp: normalized.xp ?? 0,
    rank_tier: normalized.rank_tier,
    ink_drops: normalized.ink_drops ?? 0,
    unlocked_items: normalized.unlocked_items ?? [],
    ranked_win_streak: normalized.ranked_win_streak ?? 0,
    placement_completed: normalized.placement_completed,
    placement_vocab_grade: normalized.placement_vocab_grade,
    mmr: normalized.mmr,
  });
  const upsertResult = await upsertProfile(userId, normalized);
  if (!progressResult.success && !upsertResult.success) {
    throw new Error(upsertResult.error ?? progressResult.error ?? "Failed to sync profile");
  }
}

/**
 * Sync profile for authenticated user: fetch from Supabase, merge with local.
 * Returns the merged profile to use.
 */
export async function syncProfileForUser(
  userId: string,
  email: string
): Promise<UserProfile> {
  const local = getProfile();
  const remote = await fetchProfile(userId);

  if (remote) {
    const localClaim = local?.daily_reward_claimed_at ? new Date(local.daily_reward_claimed_at) : null;
    const remoteClaim = remote.daily_reward_claimed_at ? new Date(remote.daily_reward_claimed_at) : null;
    const useLocalDaily = localClaim && (!remoteClaim || localClaim > remoteClaim);
    const mergedUnlocked = [
      ...new Set([
        ...(remote.unlocked_items ?? []),
        ...(local?.unlocked_items ?? []),
      ]),
    ];
    const mergedClaimedRewards = [
      ...new Set([
        ...(remote.claimed_level_rewards ?? []),
        ...(local?.claimed_level_rewards ?? []),
      ]),
    ];
    // Progress: take max so we never lose a fresh win (local may have just updated)
    const mergedTrophies = Math.max(remote.trophies ?? 0, local?.trophies ?? 0);
    const merged: UserProfile = {
      ...remote,
      id: userId,
      trophies: mergedTrophies,
      rank_tier: getTierFromTrophies(mergedTrophies) as RankTier,
      xp: Math.max(remote.xp ?? 0, local?.xp ?? 0),
      ink_drops: Math.max(remote.ink_drops ?? 0, local?.ink_drops ?? 0),
      ranked_win_streak: Math.max(remote.ranked_win_streak ?? 0, local?.ranked_win_streak ?? 0),
      mmr: Math.max(remote.mmr ?? 1000, local?.mmr ?? 1000),
      email: email || remote.email || local?.email || "",
      username:
        remote.username && remote.username !== "Challenger"
          ? remote.username
          : local?.username && local.username !== "Challenger"
          ? local.username
          : email?.split("@")[0] || "Challenger",
      unlocked_items: mergedUnlocked,
      claimed_level_rewards: mergedClaimedRewards,
      daily_reward_claimed_at: useLocalDaily ? local!.daily_reward_claimed_at : remote.daily_reward_claimed_at,
      daily_streak: useLocalDaily ? (local!.daily_streak ?? 0) : (remote.daily_streak ?? 0),
      placement_completed: (remote.placement_completed ?? false) || (local?.placement_completed ?? false),
      tutorial_completed: (remote.tutorial_completed ?? false) || (local?.tutorial_completed ?? false),
      onboarding_completed: (remote.onboarding_completed ?? true) || (local?.onboarding_completed ?? false),
      vocab_grade: remote.vocab_grade ?? local?.vocab_grade,
      placement_vocab_grade: remote.placement_vocab_grade ?? local?.placement_vocab_grade,
    };
    ensureRankRewardsUnlocked(merged);
    saveProfile(merged);
    await syncCurrentProfile(userId);
    return merged;
  }

  // No remote profile yet — create from local or default
  const base = local ?? createGuestProfile();
  const newProfile: UserProfile = {
    ...base,
    id: userId,
    email,
    username: base.username && base.username !== "Challenger" ? base.username : email?.split("@")[0] || "Challenger",
    onboarding_completed: false,
  };
  saveProfile(newProfile);
  await syncCurrentProfile(userId);
  return newProfile;
}
