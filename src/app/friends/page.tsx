"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useParty } from "@/context/PartyContext";
import {
  getFriends,
  sendFriendRequest,
  removeFriend,
  getIncomingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  searchUsersByUsername,
  FriendEntry,
  FriendRequestEntry,
  UserSearchResult,
} from "@/lib/supabase/friends";
import { sendPartyInvitation } from "@/lib/supabase/party-invitations";
import InkAvatar from "@/components/InkAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import { DEFAULT_AVATAR_CONFIG } from "@/types";
import { SURFACE } from "@/lib/design-tokens";

export default function FriendsPage() {
  const { user } = useAuth();
  const { light } = useTheme();
  const { members, removeMember, setPartyLeader } = useParty();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestEntry[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [inviteInput, setInviteInput] = useState("");
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [f, inc, sent] = await Promise.all([
      getFriends(user.id),
      getIncomingFriendRequests(user.id),
      getSentFriendRequests(user.id),
    ]);
    setFriends(f);
    setIncomingRequests(inc);
    setSentRequests(sent);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  // Autocomplete search
  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const friendIds = friends.map((f) => f.id);
      const pendingIds = [
        ...sentRequests.map((r) => r.to_user_id),
        ...incomingRequests.map((r) => r.from_user_id),
      ];
      const results = await searchUsersByUsername(q, {
        limit: 8,
        excludeUserId: user?.id,
        excludeFriendIds: friendIds,
        excludeIds: pendingIds,
      });
      setSearchResults(results);
      setShowSearchDropdown(true);
      setSearchLoading(false);
      searchTimeoutRef.current = null;
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [input, user?.id, friends, sentRequests, incomingRequests]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSendRequest(username?: string) {
    const target = (username ?? input).trim();
    if (!user || !target || adding) return;
    setAdding(true);
    setShowSearchDropdown(false);
    const result = await sendFriendRequest(user.id, target);
    if (result.success) {
      setInput("");
      setSearchResults([]);
      await refresh();
      showToast("success", "Friend request sent!");
    } else {
      showToast("error", result.error ?? "Failed to send");
    }
    setAdding(false);
  }

  function handleSelectUser(u: UserSearchResult) {
    handleSendRequest(u.username);
  }

  async function handleAcceptRequest(requestId: string) {
    if (!user) return;
    setActing(requestId);
    const result = await acceptFriendRequest(user.id, requestId);
    if (result.success) await refresh();
    else showToast("error", result.error ?? "Failed");
    setActing(null);
  }

  async function handleDeclineRequest(requestId: string) {
    if (!user) return;
    setActing(requestId);
    await declineFriendRequest(user.id, requestId);
    await refresh();
    setActing(null);
  }

  async function handleInviteToParty(username: string) {
    if (!user || !username.trim() || inviting) return;
    setInviting(true);
    const result = await sendPartyInvitation(user.id, username.trim());
    if (result.success) {
      setPartyLeader(user.id); // You become the party leader when you invite
      setInviteInput("");
      showToast("success", "Party invitation sent!");
    } else {
      showToast("error", result.error ?? "Failed to invite");
    }
    setInviting(false);
  }

  async function handleRemove(friendId: string) {
    if (!user) return;
    const result = await removeFriend(user.id, friendId);
    if (result.success) {
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      showToast("success", "Friend removed");
    } else {
      showToast("error", result.error ?? "Failed to remove");
    }
  }

  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";

  if (!user) {
    return (
      <main className={`min-h-[100dvh] flex flex-col items-center justify-center px-4 ${bg}`} style={!light ? { background: SURFACE } : undefined}>
        <p className={`${textMuted} font-medium mb-4`}>Sign in to manage friends</p>
        <Link href="/auth/login" className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: "#3B82F6" }}>
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className={`min-h-[100dvh] flex flex-col overflow-x-hidden pb-24 ${bg}`} style={!light ? { background: SURFACE } : undefined}>
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
        <Link href="/dashboard" className={`flex items-center gap-1.5 text-sm font-bold ${textMuted}`}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className={`text-lg font-bold ${text}`}>Friends</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-6">
        {/* Send friend request */}
        <div className={`rounded-xl p-4 ${cardBg} border ${cardBorder}`}>
          <p className={`text-sm font-bold ${text} mb-3`}>Send friend request</p>
          <div ref={searchContainerRef} className="relative flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search by username..."
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${light ? "border-[#E2E8F0] text-[#0F172A]" : "border-white/20 bg-white/5 text-white"}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendRequest();
                }}
                onFocus={() => input.trim().length >= 2 && setShowSearchDropdown(true)}
              />
              {showSearchDropdown && (searchResults.length > 0 || searchLoading || input.trim().length >= 2) && (
                <div
                  className={`absolute top-full left-0 right-0 mt-1 rounded-xl border-2 overflow-hidden z-20 ${cardBg} ${cardBorder} shadow-xl max-h-64 overflow-y-auto`}
                >
                  {searchLoading ? (
                    <div className={`px-4 py-4 text-center ${textMuted} text-sm`}>Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className={`px-4 py-4 text-center ${textMuted} text-sm`}>No users found</div>
                  ) : (
                    searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 ${text}`}
                      >
                        <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...u.avatar_config }} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{u.username}</p>
                          <p className={`text-xs ${textMuted}`}>Level {u.level}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6]">Add</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSendRequest()}
              disabled={adding || !input.trim()}
              className="px-5 py-3 rounded-xl font-bold text-white disabled:opacity-50 shrink-0"
              style={{ backgroundColor: "#3B82F6" }}
            >
              {adding ? "..." : "Send"}
            </button>
          </div>
        </div>

        {/* Incoming friend requests */}
        {incomingRequests.length > 0 && (
          <div className={`rounded-xl overflow-hidden border ${cardBorder}`}>
            <div className={`px-4 py-3 border-b ${cardBorder} ${cardBg}`}>
              <p className={`text-sm font-bold ${text}`}>Friend requests</p>
            </div>
            <div className="divide-y divide-white/10">
              {incomingRequests.map((r) => (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${cardBg}`}>
                  <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...r.from_avatar_config }} size="sm" />
                  <span className={`flex-1 font-medium ${text}`}>{r.from_username}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(r.id)}
                      disabled={acting === r.id}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#22C55E] text-white hover:opacity-90"
                    >
                      {acting === r.id ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(r.id)}
                      disabled={acting === r.id}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/80"}`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent requests (pending) */}
        {sentRequests.length > 0 && (
          <div className={`rounded-xl overflow-hidden border ${cardBorder}`}>
            <div className={`px-4 py-3 border-b ${cardBorder} ${cardBg}`}>
              <p className={`text-sm font-bold ${text}`}>Sent requests</p>
            </div>
            <div className="divide-y divide-white/10">
              {sentRequests.map((r) => (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${cardBg}`}>
                  <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...(r.to_avatar_config ?? {}) }} size="sm" />
                  <span className={`flex-1 font-medium ${text}`}>{r.to_username}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends list */}
        <div className={`rounded-xl overflow-hidden border ${cardBorder}`}>
          <div className={`px-4 py-3 border-b ${cardBorder} ${cardBg}`}>
            <p className={`text-sm font-bold ${text}`}>Your friends</p>
          </div>
          {loading ? (
            <div className="p-6 text-center">
              <p className={textMuted}>Loading...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="p-6 text-center">
              <p className={textMuted}>No friends yet. Send a request and wait for them to accept!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {friends.map((f) => {
                const inParty = members.some((m) => m.id === f.id);
                return (
                  <div key={f.id} className={`flex items-center gap-3 px-4 py-3 ${cardBg}`}>
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...f.avatar_config }} size="sm" />
                    <span className={`flex-1 font-medium ${text}`}>{f.username}</span>
                    <div className="flex items-center gap-2">
                      {inParty ? (
                        <button
                          onClick={() => removeMember(f.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10"
                        >
                          In party
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInviteToParty(f.username)}
                          disabled={inviting}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-[#3B82F6] hover:bg-[#3B82F6]/10 disabled:opacity-50"
                        >
                          Invite to party
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(f.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invite to party */}
        <div className={`rounded-xl p-4 ${cardBg} border ${cardBorder}`}>
          <p className={`text-sm font-bold ${text} mb-3`}>Invite to party</p>
          <p className={`text-xs ${textMuted} mb-2`}>Send an invitation — they&apos;ll get a notification to join.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Friend's username"
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm ${light ? "border-[#E2E8F0] text-[#0F172A]" : "border-white/20 bg-white/5 text-white"}`}
              onKeyDown={(e) => e.key === "Enter" && handleInviteToParty(inviteInput)}
            />
            <button
              onClick={() => handleInviteToParty(inviteInput)}
              disabled={inviting || !inviteInput.trim()}
              className="px-5 py-3 rounded-xl font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: "#34D399" }}
            >
              {inviting ? "..." : "Invite"}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl z-50 ${
            toast.type === "success" ? "bg-[#22C55E] text-white" : "bg-[#EF4444] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
