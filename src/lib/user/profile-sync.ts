import { UserProfile, RankTier } from "@/types";
import {
  getProfile,
  saveProfile,
  createGuestProfile,
  ensureRankRewardsUnlocked,
  getLocalProfileUpdatedAtMs,
} from "./storage";
import { fetchProfile, upsertProfile, updateProfileGameProgress } from "@/lib/supabase/profile";
import { getTierFromTrophies } from "@/lib/game/rank";

/**
 * Push the current localStorage profile to Supabase.
 * Call after any local mutation (game result, purchase, daily reward, etc.).
 */
export async function syncCurrentProfile(userId: string): Promise<void> {
  const profile = getProfile();
  if (!profile) {
    console.warn("[ProfileSync] No local profile to sync");
    return;
  }
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
  if (!progressResult.success || !upsertResult.success) {
    const errors = [progressResult.error, upsertResult.error].filter(Boolean).join(" | ");
    const err = errors || "Failed to sync profile";
    console.error("[ProfileSync] Partial/failed sync:", err, {
      progressSuccess: progressResult.success,
      upsertSuccess: upsertResult.success,
      trophies: normalized.trophies,
    });
    if (!progressResult.success && !upsertResult.success) {
      throw new Error(err);
    }
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
  const localBelongsToUser =
    !!local && (local.id === userId || (!!email && local.email === email));
  const localUserProfile = localBelongsToUser ? local : null;
  const remote = await fetchProfile(userId);

  if (remote) {
    const localUpdatedAtMs = getLocalProfileUpdatedAtMs();
    const remoteUpdatedAtMs = remote.updated_at ? Date.parse(remote.updated_at) : 0;
    const remoteIsNewer = remoteUpdatedAtMs > localUpdatedAtMs + 1000;
    const localIsNewer = localUpdatedAtMs > remoteUpdatedAtMs + 1000;
    const base = remoteIsNewer ? remote : (localUserProfile ?? remote);

    const localClaim = localUserProfile?.daily_reward_claimed_at ? new Date(localUserProfile.daily_reward_claimed_at) : null;
    const remoteClaim = remote.daily_reward_claimed_at ? new Date(remote.daily_reward_claimed_at) : null;
    const useLocalDaily = localClaim && (!remoteClaim || localClaim > remoteClaim);
    const mergedUnlocked = [
      ...new Set([
        ...(remote.unlocked_items ?? []),
        ...(localUserProfile?.unlocked_items ?? []),
      ]),
    ];
    const mergedClaimedRewards = [
      ...new Set([
        ...(remote.claimed_level_rewards ?? []),
        ...(localUserProfile?.claimed_level_rewards ?? []),
      ]),
    ];
    const mergedTrophies = base.trophies ?? 0;
    const merged: UserProfile = {
      ...base,
      id: userId,
      trophies: mergedTrophies,
      rank_tier: getTierFromTrophies(mergedTrophies) as RankTier,
      xp: base.xp ?? 0,
      ink_drops: base.ink_drops ?? 0,
      ranked_win_streak: base.ranked_win_streak ?? 0,
      mmr: base.mmr ?? 1000,
      email: email || remote.email || localUserProfile?.email || "",
      username:
        base.username && base.username !== "Challenger"
          ? base.username
          : localUserProfile?.username && localUserProfile.username !== "Challenger"
          ? localUserProfile.username
          : email?.split("@")[0] || "Challenger",
      unlocked_items: mergedUnlocked,
      claimed_level_rewards: mergedClaimedRewards,
      daily_reward_claimed_at: useLocalDaily ? localUserProfile!.daily_reward_claimed_at : remote.daily_reward_claimed_at,
      daily_streak: useLocalDaily ? (localUserProfile!.daily_streak ?? 0) : (remote.daily_streak ?? 0),
      placement_completed: (remote.placement_completed ?? false) || (localUserProfile?.placement_completed ?? false),
      tutorial_completed: (remote.tutorial_completed ?? false) || (localUserProfile?.tutorial_completed ?? false),
      onboarding_completed: (remote.onboarding_completed ?? true) || (localUserProfile?.onboarding_completed ?? false),
      vocab_grade: base.vocab_grade ?? localUserProfile?.vocab_grade,
      placement_vocab_grade: base.placement_vocab_grade ?? localUserProfile?.placement_vocab_grade,
      updated_at: remote.updated_at,
    };
    ensureRankRewardsUnlocked(merged);
    saveProfile(merged, {
      source: remoteIsNewer ? "remote" : "local",
      remoteUpdatedAt: remote.updated_at,
      emitSyncEvent: true,
    });
    if (localIsNewer || !remoteIsNewer) {
      await syncCurrentProfile(userId);
    }
    return merged;
  }

  // No remote profile yet — create from local or default
  const base = localUserProfile ?? createGuestProfile();
  const newProfile: UserProfile = {
    ...base,
    id: userId,
    email,
    username: base.username && base.username !== "Challenger" ? base.username : email?.split("@")[0] || "Challenger",
    onboarding_completed: false,
  };
  saveProfile(newProfile, { source: "local", emitSyncEvent: true });
  await syncCurrentProfile(userId);
  return newProfile;
}
