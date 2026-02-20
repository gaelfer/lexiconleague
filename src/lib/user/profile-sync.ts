import { UserProfile } from "@/types";
import { getProfile, saveProfile, createGuestProfile, ensureRankRewardsUnlocked } from "./storage";
import { fetchProfile, upsertProfile } from "@/lib/supabase/profile";

/**
 * Push the current localStorage profile to Supabase.
 * Call after any local mutation (game result, purchase, daily reward, etc.).
 */
export async function syncCurrentProfile(userId: string): Promise<void> {
  const profile = getProfile();
  if (!profile) return;
  await upsertProfile(userId, profile);
}

/**
 * Sync profile for authenticated user: fetch from Supabase, merge with local.
 * Returns the merged profile to use.
 */
export async function syncProfileForUser(
  userId: string,
  email: string
): Promise<UserProfile> {
  const remote = await fetchProfile(userId);
  const local = getProfile();

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

    // ink_drops: trust the local profile ONLY when it actually belongs to this
    // user (i.e. it was previously synced). A freshly-created guest profile has
    // a "guest_…" id, meaning there has been no prior sync — in that case we
    // must use the remote balance so we don't overwrite the player's real drops.
    const localBelongsToUser = local?.id === userId;
    const mergedInkDrops = localBelongsToUser ? (local!.ink_drops ?? 0) : remote.ink_drops;

    const merged: UserProfile = {
      ...remote,
      email: email || remote.email,
      trophies: Math.max(remote.trophies, local?.trophies ?? 0),
      xp: Math.max(remote.xp, local?.xp ?? 0),
      ink_drops: mergedInkDrops,
      unlocked_items: mergedUnlocked,
      daily_reward_claimed_at: useLocalDaily ? local!.daily_reward_claimed_at : remote.daily_reward_claimed_at,
      daily_streak: useLocalDaily ? (local!.daily_streak ?? 0) : (remote.daily_streak ?? 0),
      vocab_grade: remote.vocab_grade ?? local?.vocab_grade,
      placement_completed: remote.placement_completed ?? local?.placement_completed,
      placement_vocab_grade: remote.placement_vocab_grade ?? local?.placement_vocab_grade,
      tutorial_completed: (remote.tutorial_completed ?? false) || (local?.tutorial_completed ?? false),
      claimed_level_rewards: [
        ...new Set([
          ...(remote.claimed_level_rewards ?? []),
          ...(local?.claimed_level_rewards ?? []),
        ]),
      ],
      ranked_win_streak: Math.max(remote.ranked_win_streak ?? 0, local?.ranked_win_streak ?? 0),
    };
    ensureRankRewardsUnlocked(merged);
    saveProfile(merged);
    await upsertProfile(userId, merged);
    return merged;
  }

  // No remote profile yet (new OAuth user) — create from local or default
  const base = local ?? createGuestProfile();
  const newProfile: UserProfile = {
    ...base,
    id: userId,
    email,
    username: base.username && base.username !== "Challenger" ? base.username : email?.split("@")[0] || "Challenger",
    onboarding_completed: false,
  };
  saveProfile(newProfile);
  await upsertProfile(userId, newProfile);
  return newProfile;
}
