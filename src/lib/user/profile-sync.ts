import { UserProfile } from "@/types";
import { getProfile, saveProfile, createGuestProfile, ensureRankRewardsUnlocked } from "./storage";
import { fetchProfile, upsertProfile, updateProfileGameProgress } from "@/lib/supabase/profile";

function isEmptyGuestProfile(profile: UserProfile): boolean {
  const isGuest = profile.id?.startsWith("guest_");
  if (!isGuest) return false;
  return (
    (profile.trophies ?? 0) === 0 &&
    (profile.xp ?? 0) === 0 &&
    (profile.ink_drops ?? 0) === 0 &&
    (profile.ranked_win_streak ?? 0) === 0 &&
    (profile.placement_completed ?? false) === false &&
    (profile.mmr ?? 1000) === 1000 &&
    (profile.username ?? "Challenger") === "Challenger"
  );
}

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

  // Canonical rule: if local website values are meaningful, treat local as
  // source of truth and push them to Supabase.
  if (local && !(remote && isEmptyGuestProfile(local))) {
    const mergedUnlocked = [
      ...new Set([
        ...(remote?.unlocked_items ?? []),
        ...(local.unlocked_items ?? []),
      ]),
    ];
    const mergedClaimedRewards = [
      ...new Set([
        ...(remote?.claimed_level_rewards ?? []),
        ...(local.claimed_level_rewards ?? []),
      ]),
    ];
    const merged: UserProfile = {
      ...(remote ?? local),
      ...local,
      id: userId,
      email: email || local.email || remote?.email || "",
      username:
        local.username && local.username !== "Challenger"
          ? local.username
          : remote?.username || email?.split("@")[0] || "Challenger",
      unlocked_items: mergedUnlocked,
      claimed_level_rewards: mergedClaimedRewards,
    };
    ensureRankRewardsUnlocked(merged);
    saveProfile(merged);
    await syncCurrentProfile(userId);
    return merged;
  }

  if (remote) {
    ensureRankRewardsUnlocked(remote);
    saveProfile(remote);
    return remote;
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
