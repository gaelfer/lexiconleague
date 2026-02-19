"use client";

import { createClient } from "./client";

export interface PartyInvitationEntry {
  id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  inviter_username?: string;
  inviter_avatar_config?: Record<string, unknown>;
  invitee_username?: string;
  invitee_avatar_config?: Record<string, unknown>;
}

/** Send party invitation */
export async function sendPartyInvitation(
  inviterId: string,
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

  const inviteeId = profile?.id;
  if (!inviteeId) return { success: false, error: "User not found" };
  if (inviteeId === inviterId) return { success: false, error: "You can't invite yourself" };

  const { data: existing } = await supabase
    .from("party_invitations")
    .select("id")
    .eq("inviter_id", inviterId)
    .eq("invitee_id", inviteeId)
    .eq("status", "pending")
    .limit(1)
    .single();

  if (existing) return { success: false, error: "Invitation already sent" };

  const { error } = await supabase.from("party_invitations").insert({
    inviter_id: inviterId,
    invitee_id: inviteeId,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Get incoming party invitations (pending) */
export async function getIncomingPartyInvitations(userId: string): Promise<PartyInvitationEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("party_invitations")
    .select("id, inviter_id, invitee_id, status, created_at")
    .eq("invitee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  const ids = data.map((r) => r.inviter_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_config").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return data.map((r) => ({
    id: r.id,
    inviter_id: r.inviter_id,
    invitee_id: r.invitee_id,
    status: r.status,
    created_at: r.created_at,
    inviter_username: byId.get(r.inviter_id)?.username ?? "Challenger",
    inviter_avatar_config: (byId.get(r.inviter_id)?.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Accept party invitation — returns inviter's profile for adding to party */
export async function acceptPartyInvitation(
  userId: string,
  invitationId: string
): Promise<{ success: boolean; inviter?: { id: string; username: string; avatar_config: Record<string, unknown> }; error?: string }> {
  const supabase = createClient();
  const { data: inv, error: fetchErr } = await supabase
    .from("party_invitations")
    .select("inviter_id")
    .eq("id", invitationId)
    .eq("invitee_id", userId)
    .eq("status", "pending")
    .single();

  if (fetchErr || !inv) return { success: false, error: "Invitation not found or already handled" };

  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("id, username, avatar_config")
    .eq("id", inv.inviter_id)
    .single();

  const { error: updateErr } = await supabase
    .from("party_invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);

  if (updateErr) return { success: false, error: updateErr.message };

  return {
    success: true,
    inviter: {
      id: inviterProfile?.id ?? inv.inviter_id,
      username: inviterProfile?.username ?? "Challenger",
      avatar_config: (inviterProfile?.avatar_config as Record<string, unknown>) ?? {},
    },
  };
}

/** Get accepted party invites where current user is inviter (to sync new members into party) */
export async function getAcceptedPartyInvitesAsInviter(userId: string): Promise<PartyInvitationEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("party_invitations")
    .select("id, inviter_id, invitee_id, status, created_at")
    .eq("inviter_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  const ids = data.map((r) => r.invitee_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_config").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return data.map((r) => ({
    id: r.id,
    inviter_id: r.inviter_id,
    invitee_id: r.invitee_id,
    status: r.status,
    created_at: r.created_at,
    invitee_username: byId.get(r.invitee_id)?.username ?? "Challenger",
    invitee_avatar_config: (byId.get(r.invitee_id)?.avatar_config as Record<string, unknown>) ?? {},
  }));
}

/** Decline party invitation */
export async function declinePartyInvitation(
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
