import { UserProfile, RankTier } from "@/types";
import {
  getProfile,
  saveProfile,
  createGuestProfile,
  ensureRankRewardsUnlocked,
  getLocalProfileUpdatedAtMs,
} from "./storage";
import { fetchProfile, updateProfileProgress, upsertProfile } from "@/lib/supabase/profile";
import { getTierFromTrophies } from "@/lib/game/rank";

let pushLock = false;
let pullLock = false;

/**
 * Push the current localStorage profile to Supabase.
 * Uses update() when row exists; falls back to upsert() for new users.
 * Guarded by a lock to prevent concurrent pushes.
 */
export async function syncCurrentProfile(userId: string): Promise<void> {
  if (pushLock) return;
  pushLock = true;
  try {
    const profile = getProfile();
    if (!profile) {
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.warn("[ProfileSync] No local profile to push — localStorage may be empty");
      }
      return;
    }

    const normalized: UserProfile = { ...profile, id: userId };

    const updateResult = await updateProfileProgress(userId, normalized);
    if (updateResult.success) return;

    if (updateResult.rowExists === false) {
      const upsertResult = await upsertProfile(userId, normalized);
      if (!upsertResult.success) {
        throw new Error(upsertResult.error || "Failed to sync profile");
      }
      return;
    }

    throw new Error(updateResult.error || "Failed to sync profile");
  } catch (err) {
    if (typeof window !== "undefined") {
      console.error("[ProfileSync] Push failed:", err instanceof Error ? err.message : err);
    }
    throw err;
  } finally {
    pushLock = false;
  }
}

/**
 * Sync profile for authenticated user: fetch from Supabase, merge with local.
 * Guarded by a lock to prevent concurrent pulls.
 */
export async function syncProfileForUser(
  userId: string,
  email: string
): Promise<UserProfile> {
  if (pullLock) {
    return getProfile() ?? createGuestProfile();
  }
  pullLock = true;
  try {
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
        try {
          await syncCurrentProfile(userId);
        } catch {
          // Local state is correct; push will retry via ProfileSyncOnLoad
        }
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
  } finally {
    pullLock = false;
  }
}
