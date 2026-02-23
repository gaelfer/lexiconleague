"use client";

import { createClient } from "./client";
import type { InkAvatarConfig, VocabLevel, PunctuationLevel } from "@/types";
import type { OpponentInfo } from "@/lib/game/matchmaking";

// ============================================================
// Types
// ============================================================

export interface PartyMember {
  id: string;
  username: string;
  avatar_config: Record<string, unknown>;
}

export interface Party {
  id: string;
  code: string;
  leader_id: string;
  status: "open" | "dissolved";
  created_at: string;
  members: PartyMember[];
}

export interface PartyInvitationEntry {
  id: string;
  party_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  inviter_username?: string;
  inviter_avatar_config?: Record<string, unknown>;
  party_code?: string;
}

export interface PartyQueuePayload {
  mode: "1v1" | "3v3";
  subject: "vocabulary" | "punctuation";
  vocabGrade?: VocabLevel;
  punctuationLevel?: PunctuationLevel;
  seed: string;
  startedAt: number;
  opponents: OpponentInfo[];
  teamMembers: { id?: string; username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[];
  botResults: {
    opponents: { correct: number; total: number }[];
    teammates: { correct: number; total: number }[];
  };
}

// ============================================================
// Room code generation
// ============================================================

function generateCode(): string {
  // Exclude visually confusing characters: 0/O, 1/I/L
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ============================================================
// Internal helpers
// ============================================================

type ProfileRow = { id: string; username?: string; avatar_config?: unknown };
type MemberRow = { user_id: string };

async function fetchPartyMembers(partyId: string): Promise<PartyMember[]> {
  const supabase = createClient();
  const { data: memberRows } = await supabase
    .from("party_members")
    .select("user_id")
    .eq("party_id", partyId);

  const memberIds = (memberRows ?? []).map((r: MemberRow) => r.user_id);
  if (memberIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_config")
    .in("id", memberIds);

  return (profiles ?? []).map((p: ProfileRow) => ({
    id: p.id,
    username: p.username ?? "Challenger",
    avatar_config: (p.avatar_config as Record<string, unknown>) ?? {},
  }));
}

// ============================================================
// Party lifecycle
// ============================================================

/** Get the current user's active party with all members. Returns null if not in a party. */
export async function getCurrentParty(userId: string): Promise<Party | null> {
  const supabase = createClient();

  const { data: membership } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", userId)
    .single();

  if (!membership) return null;

  const { data: party, error } = await supabase
    .from("parties")
    .select("id, code, leader_id, status, created_at")
    .eq("id", membership.party_id)
    .eq("status", "open")
    .single();

  if (error || !party) return null;

  const members = await fetchPartyMembers(party.id);
  return { ...party, members };
}

/** Create a new party. Current user becomes leader. */
export async function createParty(
  userId: string,
  profile: PartyMember
): Promise<{ party?: Party; error?: string }> {
  const supabase = createClient();

  // RPC bypasses RLS — guarantees delete before insert (avoids party_members_user_unique)
  await supabase.rpc("leave_party_rpc");

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();

    const { data, error } = await supabase
      .from("parties")
      .insert({ code, leader_id: userId, status: "open" })
      .select("id, code, leader_id, status, created_at")
      .single();

    if (error?.code === "23505") continue; // Unique code collision — retry

    if (error || !data) {
      return { error: error?.message ?? "Failed to create party" };
    }

    // RPC already removed any existing row; insert is safe
    const { error: memberErr } = await supabase
      .from("party_members")
      .insert({ party_id: data.id, user_id: userId });

    if (memberErr) {
      await supabase.from("parties").delete().eq("id", data.id);
      return { error: memberErr.message };
    }

    return { party: { ...data, members: [profile] } };
  }

  return { error: "Failed to generate a unique party code" };
}

/** Join a party by room code. */
export async function joinPartyByCode(
  userId: string,
  code: string,
  profile: PartyMember
): Promise<{ party?: Party; error?: string }> {
  const supabase = createClient();
  const normalized = code.trim().toUpperCase();

  if (normalized.length < 4) return { error: "Invalid code" };

  const { data: party, error: findErr } = await supabase
    .from("parties")
    .select("id, code, leader_id, status, created_at")
    .eq("code", normalized)
    .eq("status", "open")
    .single();

  if (findErr || !party) return { error: "Party not found or no longer active" };

  const { count } = await supabase
    .from("party_members")
    .select("*", { count: "exact", head: true })
    .eq("party_id", party.id);

  if ((count ?? 0) >= 6) return { error: "Party is full (max 6 players)" };

  // Can't join a party you're already in
  if ((count ?? 0) > 0) {
    const { data: existing } = await supabase
      .from("party_members")
      .select("user_id")
      .eq("party_id", party.id)
      .eq("user_id", userId)
      .single();
    if (existing) return { error: "You're already in this party" };
  }

  await leaveParty(userId);

  const { error: joinErr } = await supabase
    .from("party_members")
    .insert({ party_id: party.id, user_id: userId });

  if (joinErr) return { error: "Could not join party" };

  profile; // Referenced to avoid lint warning — not needed since Realtime will sync
  const full = await getCurrentParty(userId);
  return full ? { party: full } : { error: "Joined but could not fetch party" };
}

/** Join a party by its UUID (used when accepting an invitation). */
async function joinPartyById(
  userId: string,
  partyId: string
): Promise<{ party?: Party; error?: string }> {
  const supabase = createClient();

  const { data: party } = await supabase
    .from("parties")
    .select("id, status")
    .eq("id", partyId)
    .eq("status", "open")
    .single();

  if (!party) return { error: "Party is no longer active" };

  const { count } = await supabase
    .from("party_members")
    .select("*", { count: "exact", head: true })
    .eq("party_id", partyId);

  if ((count ?? 0) >= 6) return { error: "Party is full (max 6 players)" };

  await leaveParty(userId);

  const { error: joinErr } = await supabase
    .from("party_members")
    .insert({ party_id: partyId, user_id: userId });

  if (joinErr) return { error: "Could not join party" };

  const full = await getCurrentParty(userId);
  return full ? { party: full } : { error: "Joined but could not fetch party" };
}

/** Leave the current party. If leader, the DB trigger dissolves the party for everyone. */
export async function leaveParty(userId: string): Promise<void> {
  const supabase = createClient();

  // Always delete first — avoids duplicate key when creating a new party.
  // No-op if user has no membership; required before insert due to party_members_user_unique.
  await supabase
    .from("party_members")
    .delete()
    .eq("user_id", userId);
  // DB trigger fires: if userId was the leader, party.status → 'dissolved'
}

/** Remove a member from the party (leader only). */
export async function kickMember(
  partyId: string,
  leaderId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: party } = await supabase
    .from("parties")
    .select("leader_id")
    .eq("id", partyId)
    .single();

  if (party?.leader_id !== leaderId) {
    return { success: false, error: "Only the leader can remove members" };
  }

  const { error } = await supabase
    .from("party_members")
    .delete()
    .eq("party_id", partyId)
    .eq("user_id", targetUserId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================================
// Party invitations
// ============================================================

/** Send a party invitation to a user by username. Sender must be in an open party. */
export async function sendPartyInvite(
  inviterId: string,
  partyId: string,
  inviteeUsername: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const trimmed = inviteeUsername.trim();
  if (!trimmed) return { success: false, error: "Enter a username" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", trimmed)
    .limit(1)
    .single();

  if (!profile?.id) return { success: false, error: "User not found" };
  if (profile.id === inviterId) return { success: false, error: "Can't invite yourself" };

  const { error } = await supabase
    .from("party_invitations")
    .upsert(
      {
        party_id: partyId,
        inviter_id: inviterId,
        invitee_id: profile.id,
        status: "pending",
        created_at: new Date().toISOString(),
      },
      { onConflict: "party_id,invitee_id" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Get pending incoming party invitations for a user. */
export async function getIncomingPartyInvites(userId: string): Promise<PartyInvitationEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("party_invitations")
    .select("id, party_id, inviter_id, invitee_id, status, created_at")
    .eq("invitee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  type InvRow = {
    id: string;
    party_id: string;
    inviter_id: string;
    invitee_id: string;
    status: string;
    created_at: string;
  };

  const inviterIds = (data as InvRow[]).map((r) => r.inviter_id);
  const partyIds = (data as InvRow[]).map((r) => r.party_id);

  const [{ data: profiles }, { data: parties }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_config").in("id", inviterIds),
    supabase.from("parties").select("id, code").in("id", partyIds),
  ]);

  type PartyRow = { id: string; code: string };
  const profilesById = new Map<string, ProfileRow>(
    (profiles ?? []).map((p: ProfileRow) => [p.id, p])
  );
  const partiesById = new Map<string, PartyRow>(
    ((parties ?? []) as PartyRow[]).map((p) => [p.id, p])
  );

  return (data as InvRow[]).map((r) => ({
    id: r.id,
    party_id: r.party_id,
    inviter_id: r.inviter_id,
    invitee_id: r.invitee_id,
    status: r.status,
    created_at: r.created_at,
    inviter_username: profilesById.get(r.inviter_id)?.username ?? "Challenger",
    inviter_avatar_config:
      (profilesById.get(r.inviter_id)?.avatar_config as Record<string, unknown>) ?? {},
    party_code: partiesById.get(r.party_id)?.code,
  }));
}

/** Accept a party invitation — joins the party. PartyContext will sync via Realtime. */
export async function acceptPartyInvite(
  userId: string,
  invitationId: string
): Promise<{ party?: Party; error?: string }> {
  const supabase = createClient();

  const { data: inv, error: fetchErr } = await supabase
    .from("party_invitations")
    .select("party_id, inviter_id")
    .eq("id", invitationId)
    .eq("invitee_id", userId)
    .eq("status", "pending")
    .single();

  if (fetchErr || !inv) return { error: "Invitation not found or already handled" };

  // Mark as accepted before joining (so RLS passes for party_members insert)
  await supabase
    .from("party_invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);

  return joinPartyById(userId, inv.party_id);
}

/** Decline a party invitation. */
export async function declinePartyInvite(
  userId: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("party_invitations")
    .update({ status: "declined" })
    .eq("id", invitationId)
    .eq("invitee_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================================
// Queue broadcast (Supabase Realtime broadcast channel)
// ============================================================

const PARTY_QUEUE_EVENT = "party_queue_start";

export function getPartyChannelName(partyId: string): string {
  return `party-queue:${partyId}`;
}

/** Leader broadcasts queue start to all party members. */
export async function broadcastPartyQueue(
  partyId: string,
  payload: PartyQueuePayload
): Promise<boolean> {
  const supabase = createClient();
  const channel = supabase.channel(getPartyChannelName(partyId));

  return new Promise<boolean>((resolve) => {
    channel.subscribe((status: string) => {
      if (status === "SUBSCRIBED") {
        channel.send({ type: "broadcast", event: PARTY_QUEUE_EVENT, payload });
        setTimeout(() => {
          supabase.removeChannel(channel);
          resolve(true);
        }, 500);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        supabase.removeChannel(channel);
        resolve(false);
      }
    });
  });
}

/** Members subscribe to receive queue broadcasts from their leader. */
export function subscribeToPartyQueue(
  partyId: string,
  onPayload: (payload: PartyQueuePayload) => void
): () => void {
  const supabase = createClient();
  const channel = supabase.channel(getPartyChannelName(partyId));

  channel.on(
    "broadcast",
    { event: PARTY_QUEUE_EVENT },
    ({ payload }: { payload: PartyQueuePayload }) => {
      onPayload(payload);
    }
  );

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
