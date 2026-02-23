"use client";

import { createClient } from "./client";

export interface FriendEntry {
  id: string;
  username: string;
  avatar_config: Record<string, unknown>;
  xp?: number;
  level?: number;
  rank_tier?: string;
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

export interface AcceptedFriendRequestEntry {
  id: string;
  to_user_id: string;
  to_username?: string;
  to_avatar_config?: Record<string, unknown>;
  created_at: string;
}

type ProfileRow = { id: string; username?: string; avatar_config?: unknown; xp?: number; rank_tier?: string };

/** Search users by username prefix (autocomplete). Min 2 chars. */
export async function searchUsersByUsername(
  prefix: string,
  options?: {
    limit?: number;
    excludeUserId?: string;
    excludeFriendIds?: string[];
    excludeIds?: string[];
  }
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
    q = q.not("id", "in", `(${Array.from(exclude).join(",")})`);
  }

  const { data, error } = await q;
  if (error) return [];

  const { getLevel } = await import("@/lib/user/levels");
  return (data ?? []).map((row: ProfileRow) => ({
    id: row.id,
    username: row.username ?? "Challenger",
    avatar_config: (row.avatar_config as Record<string, unknown>) ?? {},
    xp: row.xp ?? 0,
    level: getLevel(row.xp ?? 0),
  }));
}

/** Find user ID by username (case-insensitive, exact match). */
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

/** Check if two users are friends (accepted friend_request in either direction). */
async function areFriends(userId: string, friendId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(from_user_id.eq.${userId},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${userId})`
    )
    .limit(1)
    .single();
  return !!data;
}

/** Check for an existing pending request in either direction. */
async function hasPendingRequest(
  userId: string,
  otherId: string
): Promise<"sent" | "received" | null> {
  const supabase = createClient();
  const { data: sent } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user_id", userId)
    .eq("to_user_id", otherId)
    .eq("status", "pending")
    .limit(1)
    .single();
  if (sent) return "sent";

  const { data: received } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user_id", otherId)
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .limit(1)
    .single();
  if (received) return "received";
  return null;
}

/** Send friend request by username. */
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
  if (pending === "received")
    return { success: false, error: "They already sent you a request — check your notifications" };

  const { error } = await supabase.from("friend_requests").insert({
    from_user_id: userId,
    to_user_id: friendId,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** @deprecated Use sendFriendRequest */
export async function addFriendByUsername(
  userId: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  return sendFriendRequest(userId, username);
}

/** Get incoming (pending) friend requests. */
export async function getIncomingFriendRequests(userId: string): Promise<FriendRequestEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, from_user_id, to_user_id, status, created_at")
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  type ReqRow = {
    id: string;
    from_user_id: string;
    to_user_id: string;
    status: string;
    created_at: string;
  };
  const ids = (data as ReqRow[]).map((r) => r.from_user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_config")
    .in("id", ids);

  const byId = new Map<string, ProfileRow>(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  return (data as ReqRow[]).map((r) => ({
    id: r.id,
    from_user_id: r.from_user_id,
    to_user_id: r.to_user_id,
    status: r.status,
    created_at: r.created_at,
    from_username: byId.get(r.from_user_id)?.username ?? "Challenger",
    from_avatar_config:
      (byId.get(r.from_user_id)?.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Get sent (pending) friend requests. */
export async function getSentFriendRequests(userId: string): Promise<FriendRequestEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, from_user_id, to_user_id, status, created_at")
    .eq("from_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  type ReqRow = {
    id: string;
    from_user_id: string;
    to_user_id: string;
    status: string;
    created_at: string;
  };
  const ids = (data as ReqRow[]).map((r) => r.to_user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_config")
    .in("id", ids);

  const byId = new Map<string, ProfileRow>(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  return (data as ReqRow[]).map((r) => ({
    ...r,
    to_username: byId.get(r.to_user_id)?.username ?? "Challenger",
    to_avatar_config: (byId.get(r.to_user_id)?.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Accept a friend request — just updates status. No dual-write needed (friends_view handles it). */
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

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Decline a friend request. */
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

/** Get list of accepted friends. Queries friend_requests directly (no friends table). */
export async function getFriends(userId: string): Promise<FriendEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, from_user_id, to_user_id")
    .eq("status", "accepted")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  if (error || !data?.length) return [];

  type ReqRow = { id: string; from_user_id: string; to_user_id: string };
  const friendIds = (data as ReqRow[]).map((r) =>
    r.from_user_id === userId ? r.to_user_id : r.from_user_id
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_config, xp, rank_tier")
    .in("id", friendIds);

  const { getLevel } = await import("@/lib/user/levels");
  return (profiles ?? []).map((p: ProfileRow) => ({
    id: p.id,
    username: p.username ?? "Challenger",
    avatar_config: (p.avatar_config as Record<string, unknown>) ?? {},
    xp: p.xp ?? 0,
    level: getLevel(p.xp ?? 0),
    rank_tier: p.rank_tier ?? "Bronze",
  }));
}

/** Remove a friend — deletes the accepted friend_request record. */
export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("status", "accepted")
    .or(
      `and(from_user_id.eq.${userId},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${userId})`
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Get accepted friend requests where current user was the sender (for notifications). */
export async function getAcceptedFriendRequestsAsSender(
  userId: string
): Promise<AcceptedFriendRequestEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, to_user_id, created_at")
    .eq("from_user_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  type ReqRow = { id: string; to_user_id: string; created_at: string };
  const ids = (data as ReqRow[]).map((r) => r.to_user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_config")
    .in("id", ids);

  const byId = new Map<string, ProfileRow>(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  return (data as ReqRow[]).map((r) => ({
    id: r.id,
    to_user_id: r.to_user_id,
    created_at: r.created_at,
    to_username: byId.get(r.to_user_id)?.username ?? "Challenger",
    to_avatar_config: (byId.get(r.to_user_id)?.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Get a single friend's full profile for the profile modal. */
export async function getFriendProfile(friendId: string): Promise<FriendEntry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_config, xp, rank_tier")
    .eq("id", friendId)
    .single();

  if (error || !data) return null;

  const { getLevel } = await import("@/lib/user/levels");
  const p = data as ProfileRow & { rank_tier?: string };
  return {
    id: p.id,
    username: p.username ?? "Challenger",
    avatar_config: (p.avatar_config as Record<string, unknown>) ?? {},
    xp: p.xp ?? 0,
    level: getLevel(p.xp ?? 0),
    rank_tier: p.rank_tier ?? "Bronze",
  };
}
