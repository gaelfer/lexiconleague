import { UserProfile } from "@/types";
import { getProfile, saveProfile, createGuestProfile } from "./storage";
import { fetchProfile, upsertProfile } from "./supabase/profile";

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
