"use client";

import { createClient } from "./client";

export interface FriendEntry {
  id: string;
  username: string;
  avatar_config: Record<string, unknown>;
}

export interface FriendRequestEntry {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  from_username?: string;
  from_avatar_config?: Record<string, unknown>;
  to_username?: string;
  to_avatar_config?: Record<string, unknown>;
}

export interface UserSearchResult {
  id: string;
  username: string;
  avatar_config: Record<string, unknown>;
  xp: number;
  level: number;
}

/** Search users by username prefix (for autocomplete). Min 2 chars. Excludes current user, friends, and users with pending requests. */
export async function searchUsersByUsername(
  prefix: string,
  options?: { limit?: number; excludeUserId?: string; excludeFriendIds?: string[]; excludeIds?: string[] }
): Promise<UserSearchResult[]> {
  const supabase = createClient();
  const trimmed = prefix.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  let q = supabase
    .from("profiles")
    .select("id, username, avatar_config, xp")
    .ilike("username", `${trimmed}%`)
    .limit(options?.limit ?? 12);

  const exclude = new Set<string>();
  if (options?.excludeUserId) exclude.add(options.excludeUserId);
  (options?.excludeFriendIds ?? []).forEach((id) => exclude.add(id));
  (options?.excludeIds ?? []).forEach((id) => exclude.add(id));
  if (exclude.size > 0) {
    const list = Array.from(exclude).join(",");
    q = q.not("id", "in", `(${list})`);
  }

  const { data, error } = await q;

  if (error) return [];

  const { getLevel } = await import("@/lib/user/levels");
  type ProfileRow = { id: string; username?: string; avatar_config?: unknown; xp?: number };
  return (data ?? []).map((row: ProfileRow) => ({
    id: row.id,
    username: row.username ?? "Challenger",
    avatar_config: (row.avatar_config as Record<string, unknown>) ?? {},
    xp: row.xp ?? 0,
    level: getLevel(row.xp ?? 0),
  }));
}

/** Find user ID by username (case-insensitive, exact match) */
export async function findUserIdByUsername(username: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username.trim())
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.id;
}

/** Check if already friends */
async function areFriends(userId: string, friendId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: r1 } = await supabase.from("friends").select("id").eq("user_id", userId).eq("friend_id", friendId).limit(1).single();
  const { data: r2 } = await supabase.from("friends").select("id").eq("user_id", friendId).eq("friend_id", userId).limit(1).single();
  return !!(r1 || r2);
}

/** Check for existing pending request (either direction) */
async function hasPendingRequest(userId: string, otherId: string): Promise<"sent" | "received" | null> {
  const supabase = createClient();
  const { data: sent } = await supabase.from("friend_requests").select("id").eq("from_user_id", userId).eq("to_user_id", otherId).eq("status", "pending").limit(1).single();
  if (sent) return "sent";
  const { data: received } = await supabase.from("friend_requests").select("id").eq("from_user_id", otherId).eq("to_user_id", userId).eq("status", "pending").limit(1).single();
  if (received) return "received";
  return null;
}

/** Send friend request by username. Recipient must accept. */
export async function sendFriendRequest(
  userId: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const trimmed = username.trim();
  if (!trimmed) return { success: false, error: "Enter a username" };

  const friendId = await findUserIdByUsername(trimmed);
  if (!friendId) return { success: false, error: "User not found" };
  if (friendId === userId) return { success: false, error: "You can't add yourself" };

  if (await areFriends(userId, friendId)) return { success: false, error: "Already friends" };
  const pending = await hasPendingRequest(userId, friendId);
  if (pending === "sent") return { success: false, error: "Request already sent" };
  if (pending === "received") return { success: false, error: "They already sent you a request — check your notifications" };

  const { error } = await supabase.from("friend_requests").insert({
    from_user_id: userId,
    to_user_id: friendId,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** @deprecated Use sendFriendRequest. Kept for compatibility. */
export async function addFriendByUsername(
  userId: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  return sendFriendRequest(userId, username);
}

/** Accepted friend requests where current user was the sender (someone accepted your request) */
export interface AcceptedFriendRequestEntry {
  id: string;
  to_user_id: string;
  to_username?: string;
  to_avatar_config?: Record<string, unknown>;
  created_at: string;
}

export async function getAcceptedFriendRequestsAsSender(userId: string): Promise<AcceptedFriendRequestEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, to_user_id, created_at")
    .eq("from_user_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  type ReqRow = { id: string; to_user_id: string; created_at: string };
  type ProfileRow = { id: string; username?: string; avatar_config?: unknown };
  const ids = data.map((r: ReqRow) => r.to_user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_config").in("id", ids);
  const byId = new Map<string, ProfileRow>((profiles ?? []).map((p: ProfileRow) => [p.id, p]));
  return data.map((r: ReqRow) => ({
    id: r.id,
    to_user_id: r.to_user_id,
    created_at: r.created_at,
    to_username: byId.get(r.to_user_id)?.username ?? "Challenger",
    to_avatar_config: (byId.get(r.to_user_id)?.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Get incoming friend requests (pending, for current user) */
export async function getIncomingFriendRequests(userId: string): Promise<FriendRequestEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, from_user_id, to_user_id, status, created_at")
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  type ReqRow = { id: string; from_user_id: string; to_user_id: string; status: string; created_at: string };
  type ProfileRow = { id: string; username?: string; avatar_config?: unknown };
  const ids = data.map((r: ReqRow) => r.from_user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_config").in("id", ids);
  const byId = new Map<string, ProfileRow>((profiles ?? []).map((p: ProfileRow) => [p.id, p]));
  return data.map((r: ReqRow) => ({
    id: r.id,
    from_user_id: r.from_user_id,
    to_user_id: r.to_user_id,
    status: r.status,
    created_at: r.created_at,
    from_username: byId.get(r.from_user_id)?.username ?? "Challenger",
    from_avatar_config: (byId.get(r.from_user_id)?.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Get sent friend requests (pending) */
export async function getSentFriendRequests(userId: string): Promise<FriendRequestEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, from_user_id, to_user_id, status, created_at")
    .eq("from_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  type ReqRow = { id: string; from_user_id: string; to_user_id: string; status: string; created_at: string };
  type ProfileRow = { id: string; username?: string; avatar_config?: unknown };
  const ids = data.map((r: ReqRow) => r.to_user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_config").in("id", ids);
  const byId = new Map<string, ProfileRow>((profiles ?? []).map((p: ProfileRow) => [p.id, p]));
  return data.map((r: ReqRow) => ({
    ...r,
    to_username: byId.get(r.to_user_id)?.username ?? "Challenger",
    to_avatar_config: (byId.get(r.to_user_id)?.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Accept friend request */
export async function acceptFriendRequest(
  userId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: req, error: fetchErr } = await supabase
    .from("friend_requests")
    .select("from_user_id, to_user_id")
    .eq("id", requestId)
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .single();

  if (fetchErr || !req) return { success: false, error: "Request not found or already handled" };

  const { error: updateErr } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (updateErr) return { success: false, error: updateErr.message };

  const { error: insertErr } = await supabase.from("friends").insert([
    { user_id: req.from_user_id, friend_id: req.to_user_id },
    { user_id: req.to_user_id, friend_id: req.from_user_id },
  ]);

  if (insertErr) {
    await supabase.from("friend_requests").update({ status: "pending" }).eq("id", requestId);
    return { success: false, error: insertErr.message };
  }
  return { success: true };
}

/** Decline friend request */
export async function declineFriendRequest(
  userId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "declined" })
    .eq("id", requestId)
    .eq("to_user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Get list of friends (accepted only) */
export async function getFriends(userId: string): Promise<FriendEntry[]> {
  const supabase = createClient();
  const { data: asUser, error: e1 } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);
  const { data: asFriend, error: e2 } = await supabase
    .from("friends")
    .select("user_id")
    .eq("friend_id", userId);

  if (e1 || e2) return [];
  const ids = new Set<string>();
  (asUser ?? []).forEach((r: { friend_id: string }) => ids.add(r.friend_id));
  (asFriend ?? []).forEach((r: { user_id: string }) => ids.add(r.user_id));
  if (ids.size === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_config")
    .in("id", Array.from(ids));

  type ProfileRow = { id: string; username?: string; avatar_config?: unknown };
  return (profiles ?? []).map((p: ProfileRow) => ({
    id: p.id,
    username: p.username ?? "Challenger",
    avatar_config: (p.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Remove friend */
export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error: e1 } = await supabase.from("friends").delete().eq("user_id", userId).eq("friend_id", friendId);
  const { error: e2 } = await supabase.from("friends").delete().eq("user_id", friendId).eq("friend_id", userId);
  if (e1 && e2) return { success: false, error: e1.message };
  return { success: true };
}
