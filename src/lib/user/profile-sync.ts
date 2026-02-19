import { UserProfile } from "@/types";
import { getProfile, saveProfile, createGuestProfile } from "./storage";
import { fetchProfile, upsertProfile } from "@/lib/supabase/profile";

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
    // Prefer remote for auth user; merge local game progress if local has more trophies (e.g. from before sync)
    // For daily reward: prefer whichever is more recent (if local claimed today and remote didn't, keep local)
    const localClaim = local?.daily_reward_claimed_at ? new Date(local.daily_reward_claimed_at) : null;
    const remoteClaim = remote.daily_reward_claimed_at ? new Date(remote.daily_reward_claimed_at) : null;
    const useLocalDaily = localClaim && (!remoteClaim || localClaim > remoteClaim);
    const merged: UserProfile = {
      ...remote,
      email: email || remote.email,
      trophies: Math.max(remote.trophies, local?.trophies ?? 0),
      xp: Math.max(remote.xp, local?.xp ?? 0),
      ink_drops: Math.max(remote.ink_drops, local?.ink_drops ?? 0),
      unlocked_items: [
        ...new Set([
          ...(remote.unlocked_items ?? []),
          ...(local?.unlocked_items ?? []),
        ]),
      ],
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
    };
    saveProfile(merged);
    // Persist merged state to Supabase
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
  };
  saveProfile(newProfile);
  await upsertProfile(userId, newProfile);
  return newProfile;
}
