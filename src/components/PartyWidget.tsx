"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useParty } from "@/context/PartyContext";
import { useNotifications } from "@/context/NotificationContext";
import { acceptPartyInvite, declinePartyInvite, sendPartyInvite } from "@/lib/supabase/parties";
import { getFriends, FriendEntry } from "@/lib/supabase/friends";
import { getProfile } from "@/lib/user/storage";
import InkAvatar from "@/components/InkAvatar";
import { DEFAULT_AVATAR_CONFIG } from "@/types";

type WidgetView = "party" | "join-code" | "invite-friend";

interface PartyWidgetProps {
  /** When true, renders inline in document flow instead of fixed overlay */
  inline?: boolean;
  /** When true, renders embedded inside a parent card (no wrapper, compact layout) */
  embedded?: boolean;
}

export default function PartyWidget({ inline = false, embedded = false }: PartyWidgetProps) {
  const { user } = useAuth();
  const { light } = useTheme();
  const {
    party,
    partyId,
    members,
    isLeader,
    canQueue1v1,
    canQueue3v3,
    startParty,
    joinByCode,
    clearParty,
    removeMember,
  } = useParty();
  const { partyInvitations, refresh: refreshNotifications } = useNotifications();

  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState<WidgetView>("party");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodError] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const prevPartyId = useRef<string | null>(null);

  // Auto-expand when first joining a party
  useEffect(() => {
    if (partyId && partyId !== prevPartyId.current) {
      setCollapsed(false);
      setView("party");
    }
    prevPartyId.current = partyId ?? null;
  }, [partyId]);

  // Load friends for invite view
  useEffect(() => {
    if (!user) return;
    getFriends(user.id).then(setFriends);
  }, [user?.id, view]);

  const copyCode = useCallback(() => {
    if (!party?.code) return;
    navigator.clipboard.writeText(party.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [party?.code]);

  async function handleCreate() {
    if (!user || creating) return;
    setCreating(true);
    setCodError("");
    const profile = getProfile();
    const { error } = await startParty();
    if (error) setCodError(error);
    setCreating(false);
    void profile;
  }

  async function handleJoinByCode() {
    if (!codeInput.trim() || joining) return;
    setJoining(true);
    setCodError("");
    const { error } = await joinByCode(codeInput.trim());
    if (error) {
      setCodError(error);
      setJoining(false);
    } else {
      setCodeInput("");
      setView("party");
    }
    setJoining(false);
  }

  async function handleInviteFriend(username: string) {
    if (!partyId || !user || inviting) return;
    setInviting(true);
    setInviteError("");
    const { success, error } = await sendPartyInvite(user.id, partyId, username);
    if (!success) setInviteError(error ?? "Failed to invite");
    setInviting(false);
    setInviteInput("");
  }

  async function handleAcceptInvite(invitationId: string) {
    if (!user) return;
    setActing(invitationId);
    const { party: joined, error } = await acceptPartyInvite(user.id, invitationId);
    if (!error && joined) {
      await refreshNotifications();
    }
    setActing(null);
  }

  async function handleDeclineInvite(invitationId: string) {
    if (!user) return;
    setActing(invitationId);
    await declinePartyInvite(user.id, invitationId);
    await refreshNotifications();
    setActing(null);
  }

  if (!user) return null;

  const bg = light ? "bg-white border-[#E2E8F0]" : "bg-[#1E293B] border-white/10";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/50";
  const rowHover = light ? "hover:bg-[#F8FAFC]" : "hover:bg-white/5";
  const inputCls = light
    ? "border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8]"
    : "border-white/20 bg-white/5 text-white placeholder:text-white/30";

  const wrapperClass = embedded
    ? "w-full"
    : inline
      ? `rounded-2xl border w-full max-w-72 ${bg}`
      : `fixed bottom-4 right-4 z-50 rounded-2xl border shadow-xl w-72 ${bg} backdrop-blur-sm`;

  // ── No party, show pending invites or entry point ──────────
  if (!party) {
    const hasPending = partyInvitations.length > 0;

    if (!inline && !embedded && collapsed && !hasPending) return null;

    return (
      <div className={wrapperClass}>
        <p className={`text-[10px] font-bold ${textMuted} uppercase tracking-wide mb-1.5`}>Party</p>
        {/* Invitations panel */}
        {hasPending && (
          <div className="space-y-2 mb-3">
            {partyInvitations.map((inv) => (
              <div
                key={inv.id}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl ${light ? "bg-[#F8FAFC]" : "bg-white/5"}`}
              >
                <InkAvatar
                  config={{ ...DEFAULT_AVATAR_CONFIG, ...(inv.inviter_avatar_config ?? {}) }}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${text} truncate`}>{inv.inviter_username}</p>
                  <p className={`text-xs ${textMuted}`}>
                    Code: <span className="font-mono font-bold">{inv.party_code}</span>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAcceptInvite(inv.id)}
                    disabled={acting === inv.id}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-[#3B82F6] text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {acting === inv.id ? "..." : "Join"}
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.id)}
                    disabled={acting === inv.id}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/70"}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / join entry */}
        {view === "join-code" ? (
          <div className="space-y-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
              placeholder="6-char party code"
              maxLength={6}
              className={`w-full px-3 py-2 rounded-lg border text-sm font-mono tracking-widest ${inputCls}`}
            />
            {codeError && <p className="text-xs text-red-500 px-1">{codeError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleJoinByCode}
                disabled={joining || codeInput.trim().length < 4}
                className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-[#3B82F6] hover:opacity-90 disabled:opacity-50"
              >
                {joining ? "Joining..." : "Join"}
              </button>
              <button
                onClick={() => { setView("party"); setCodError(""); setCodeInput(""); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold ${light ? "text-[#64748B] hover:bg-[#F1F5F9]" : "text-white/60 hover:bg-white/10"}`}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white bg-[#34D399] hover:opacity-90 disabled:opacity-50"
              >
                {creating ? "..." : "Create party"}
              </button>
              <button
                onClick={() => { setView("join-code"); setCodError(""); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${light ? "border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]" : "border-white/20 text-white hover:bg-white/5"}`}
              >
                Join by code
              </button>
            </div>
            {codeError && <p className="text-xs font-semibold text-red-500 px-0.5 mt-1">{codeError}</p>}
          </div>
        )}
      </div>
    );
  }

  // ── In a party ────────────────────────────────────────────
  if (collapsed && !inline && !embedded) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-xl ${bg} backdrop-blur-sm`}
      >
        <div className="flex -space-x-1.5">
          {members.slice(0, 3).map((m) => (
            <div key={m.id} className="ring-2 ring-white dark:ring-[#1E293B] rounded-full">
              <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...m.avatar_config }} size="xs" />
            </div>
          ))}
          {members.length > 3 && (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white"}`}>
              +{members.length - 3}
            </div>
          )}
        </div>
        <span className={`text-xs font-bold ${text}`}>{members.length}/6</span>
        <span className={`text-xs ${textMuted}`}>▲</span>
      </button>
    );
  }

  const inPartyFriends = friends.filter((f) => members.some((m) => m.id === f.id));
  void inPartyFriends;

  // ── Embedded in-party layout (compact, for dashboard card) ──
  if (embedded && view === "party") {
    return (
      <div className={wrapperClass}>
        <p className={`text-[10px] font-bold ${textMuted} uppercase tracking-wide mb-1.5`}>Party</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex -space-x-1">
              {members.slice(0, 5).map((m) => (
                <div key={m.id} className="ring-2 ring-white dark:ring-[#1E293B] rounded-full">
                  <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...m.avatar_config }} size="xs" />
                </div>
              ))}
              {members.length > 5 && <span className={`text-[10px] font-bold ${textMuted}`}>+{members.length - 5}</span>}
            </div>
            <span className={`text-[10px] font-bold ${text}`}>{members.length}/6</span>
            {party.code && (
              <button onClick={copyCode} className={`text-[10px] font-mono font-bold ${textMuted} hover:opacity-80 px-1 rounded`}>
                {party.code} {copied ? "✓" : "⎘"}
              </button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {isLeader && (
              <a href="/play/casual" className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold text-white hover:opacity-90" style={{ backgroundColor: "#34D399" }}>
                Queue up
              </a>
            )}
            {isLeader && (
              <button onClick={() => setView("invite-friend")} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${light ? "border-[#E2E8F0] text-[#3B82F6] hover:bg-[#EFF6FF]" : "border-white/20 text-[#60A5FA] hover:bg-white/5"}`}>
                + Invite
              </button>
            )}
            {!isLeader && <p className={`text-[10px] ${textMuted}`}>Leader will queue</p>}
            <button onClick={clearParty} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${light ? "text-red-500 hover:bg-red-50" : "text-red-400 hover:bg-red-500/10"}`}>
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${light ? "border-[#E2E8F0]" : "border-white/10"}`}>
        <div>
          <p className={`text-sm font-bold ${text}`}>Party ({members.length}/6)</p>
          {party.code && (
            <button
              onClick={copyCode}
              className={`flex items-center gap-1.5 text-xs ${textMuted} hover:opacity-80 mt-0.5`}
            >
              <span className="font-mono tracking-widest font-bold">{party.code}</span>
              <span>{copied ? "✓" : "⎘"}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {view !== "party" && (
            <button
              onClick={() => { setView("party"); setInviteError(""); setInviteInput(""); }}
              className={`p-1.5 rounded-lg text-xs ${light ? "text-[#64748B] hover:bg-[#F1F5F9]" : "text-white/50 hover:bg-white/10"}`}
            >
              ← Back
            </button>
          )}
          {!embedded && (
            <button
              onClick={() => setCollapsed(true)}
              className={`p-1.5 rounded-lg text-xs ${light ? "text-[#64748B] hover:bg-[#F1F5F9]" : "text-white/50 hover:bg-white/10"}`}
              aria-label="Minimize"
            >
              ▼
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {view === "party" && (
        <>
          {/* Member list */}
          <div className="p-2 space-y-0.5 max-h-48 overflow-y-auto">
            {members.map((m) => (
              <div key={m.id} className={`flex items-center gap-2.5 px-2 py-2 rounded-xl ${rowHover}`}>
                <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...m.avatar_config }} size="xs" />
                <span className={`flex-1 text-sm font-medium ${text} truncate`}>{m.username}</span>
                {m.id === party.leader_id && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-bold">
                    leader
                  </span>
                )}
                {isLeader && m.id !== user.id && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-xs text-red-400 hover:text-red-500 px-1"
                    aria-label={`Kick ${m.username}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Queue status */}
          <div className={`px-4 py-2 border-t ${light ? "border-[#F1F5F9]" : "border-white/5"}`}>
            <p className={`text-xs ${textMuted}`}>
              {isLeader
                ? `${canQueue1v1 ? "1v1 ready" : ""}${canQueue1v1 && canQueue3v3 ? " · " : ""}${canQueue3v3 ? "3v3 ready" : ""}`
                : "Waiting for leader to queue"}
            </p>
          </div>

          {/* Actions */}
          <div className={`flex gap-2 px-3 pb-3 pt-2 border-t ${light ? "border-[#E2E8F0]" : "border-white/10"}`}>
            {isLeader && (
              <button
                onClick={() => setView("invite-friend")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${light ? "border-[#E2E8F0] text-[#3B82F6] hover:bg-[#EFF6FF]" : "border-white/20 text-[#60A5FA] hover:bg-white/5"}`}
              >
                + Invite
              </button>
            )}
            {isLeader && (
              <a
                href="/play/casual"
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white text-center"
                style={{ backgroundColor: "#34D399" }}
              >
                Queue up
              </a>
            )}
            <button
              onClick={clearParty}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${light ? "text-red-500 hover:bg-red-50" : "text-red-400 hover:bg-red-500/10"}`}
            >
              Leave
            </button>
          </div>
        </>
      )}

      {view === "invite-friend" && (
        <div className="p-3 space-y-3">
          {/* Inline invite by username */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => { setInviteInput(e.target.value); setInviteError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleInviteFriend(inviteInput)}
              placeholder="Username..."
              className={`flex-1 px-3 py-2 rounded-xl border text-sm ${inputCls}`}
            />
            <button
              onClick={() => handleInviteFriend(inviteInput)}
              disabled={inviting || !inviteInput.trim()}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#3B82F6] hover:opacity-90 disabled:opacity-50"
            >
              {inviting ? "..." : "Send"}
            </button>
          </div>
          {inviteError && <p className="text-xs text-red-500 px-1">{inviteError}</p>}

          {/* Quick-invite from friends list */}
          {friends.length > 0 && (
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              <p className={`text-xs ${textMuted} px-1 mb-1`}>Your friends</p>
              {friends.map((f) => {
                const alreadyIn = members.some((m) => m.id === f.id);
                return (
                  <div key={f.id} className={`flex items-center gap-2.5 px-2 py-2 rounded-xl ${rowHover}`}>
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...f.avatar_config }} size="xs" />
                    <span className={`flex-1 text-sm ${text} truncate`}>{f.username}</span>
                    {alreadyIn ? (
                      <span className={`text-xs ${textMuted}`}>In party</span>
                    ) : (
                      <button
                        onClick={() => handleInviteFriend(f.username)}
                        disabled={inviting}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30 disabled:opacity-50"
                      >
                        Invite
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
