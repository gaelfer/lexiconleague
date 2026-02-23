"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
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
import { getRecentPlayers, RecentPlayerEntry } from "@/lib/supabase/recent-players";
import FriendProfileModal from "@/components/FriendProfileModal";
import InkAvatar from "@/components/InkAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import LogoIcon from "@/components/icons/LogoIcon";
import { DEFAULT_AVATAR_CONFIG } from "@/types";
import { SURFACE } from "@/lib/design-tokens";

export default function FriendsPage() {
  const { user } = useAuth();
  const { light } = useTheme();

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestEntry[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestEntry[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<FriendEntry | null>(null);

  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [pendingOpen, setPendingOpen] = useState(true);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [f, inc, sent, recent] = await Promise.all([
      getFriends(user.id),
      getIncomingFriendRequests(user.id),
      getSentFriendRequests(user.id),
      getRecentPlayers(user.id),
    ]);
    setFriends(f);
    setIncomingRequests(inc);
    setSentRequests(sent);
    setRecentPlayers(recent);
  }, [user?.id]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  // Autocomplete search
  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) { setSearchResults([]); setShowSearchDropdown(false); return; }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchUsersByUsername(q, {
        limit: 8,
        excludeUserId: user?.id,
        excludeFriendIds: friends.map((f) => f.id),
        excludeIds: [
          ...sentRequests.map((r) => r.to_user_id),
          ...incomingRequests.map((r) => r.from_user_id),
        ],
      });
      setSearchResults(results);
      setShowSearchDropdown(true);
      setSearchLoading(false);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [input, user?.id, friends, sentRequests, incomingRequests]);

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

  const pendingCount = incomingRequests.length + sentRequests.length;

  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const divider = light ? "divide-[#F1F5F9]" : "divide-white/5";

  if (!user) {
    return (
      <main
        className={`min-h-[100dvh] flex flex-col items-center justify-center px-4 ${bg}`}
        style={!light ? { background: SURFACE } : undefined}
      >
        <p className={`${textMuted} font-medium mb-4`}>Sign in to manage friends</p>
        <Link href="/auth/login" className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: "#3B82F6" }}>
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main
      className={`min-h-[100dvh] flex flex-col overflow-x-hidden pb-32 ${bg}`}
      style={!light ? { background: SURFACE } : undefined}
    >
      <header className={`flex items-center justify-between px-5 py-4 border-b ${cardBorder}`}>
        <Link href="/dashboard" className={`flex items-center gap-1.5 text-sm font-bold ${textMuted}`}>
          <div className={`w-7 h-7 rounded-lg p-0.5 border ${light ? "border-[#E2E8F0] bg-white" : "border-white/10 bg-[#1E293B]"}`}>
            <LogoIcon className="w-full h-full" />
          </div>
          Dashboard
        </Link>
        <h1 className={`text-lg font-bold ${text}`}>Friends</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5">

        {/* ── Add friend ─────────────────────────────────────── */}
        <div className={`rounded-2xl p-4 ${cardBg} border ${cardBorder}`}>
          <p className={`text-sm font-bold ${text} mb-3`}>Add friend</p>
          <div ref={searchContainerRef} className="relative flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
                onFocus={() => input.trim().length >= 2 && setShowSearchDropdown(true)}
                placeholder="Search by username..."
                className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm ${light ? "border-[#E2E8F0] text-[#0F172A]" : "border-white/20 bg-white/5 text-white"}`}
              />
              {showSearchDropdown && (searchResults.length > 0 || searchLoading || input.trim().length >= 2) && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border-2 overflow-hidden z-20 ${cardBg} ${cardBorder} shadow-xl max-h-60 overflow-y-auto`}>
                  {searchLoading ? (
                    <div className={`px-4 py-4 text-center ${textMuted} text-sm`}>Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className={`px-4 py-4 text-center ${textMuted} text-sm`}>No users found</div>
                  ) : (
                    searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSendRequest(u.username)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${light ? "hover:bg-[#F8FAFC]" : "hover:bg-white/5"} ${text}`}
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
              className="px-5 py-2.5 rounded-xl font-bold text-white disabled:opacity-50 shrink-0"
              style={{ backgroundColor: "#3B82F6" }}
            >
              {adding ? "..." : "Send"}
            </button>
          </div>
        </div>

        {/* ── Pending requests (collapsible) ─────────────────── */}
        {pendingCount > 0 && (
          <div className={`rounded-2xl overflow-hidden border ${cardBorder}`}>
            <button
              onClick={() => setPendingOpen((o) => !o)}
              className={`w-full flex items-center justify-between px-4 py-3 ${cardBg} ${light ? "hover:bg-[#F8FAFC]" : "hover:bg-white/5"}`}
            >
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${text}`}>Pending</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </span>
              </div>
              <span className={`text-xs ${textMuted}`}>{pendingOpen ? "▲" : "▼"}</span>
            </button>

            {pendingOpen && (
              <div className={`divide-y ${divider}`}>
                {incomingRequests.map((r) => (
                  <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${cardBg}`}>
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...r.from_avatar_config }} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text} truncate`}>{r.from_username}</p>
                      <p className={`text-xs ${textMuted}`}>Wants to be friends</p>
                    </div>
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
                {sentRequests.map((r) => (
                  <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${cardBg}`}>
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...(r.to_avatar_config ?? {}) }} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text} truncate`}>{r.to_username}</p>
                      <p className={`text-xs ${textMuted}`}>Request sent</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Friends list ────────────────────────────────────── */}
        <div className={`rounded-2xl overflow-hidden border ${cardBorder}`}>
          <div className={`px-4 py-3 border-b ${cardBorder} ${cardBg}`}>
            <p className={`text-sm font-bold ${text}`}>
              Friends
              {friends.length > 0 && (
                <span className={`ml-1.5 text-xs font-semibold ${textMuted}`}>({friends.length})</span>
              )}
            </p>
          </div>

          {loading ? (
            <div className={`p-8 text-center ${textMuted} text-sm ${cardBg}`}>Loading...</div>
          ) : friends.length === 0 ? (
            <div className={`p-8 text-center ${cardBg}`}>
              <p className={`${textMuted} text-sm`}>No friends yet.</p>
              <p className={`${textMuted} text-xs mt-1`}>Search for a username above to send a request.</p>
            </div>
          ) : (
            <div className={`divide-y ${divider}`}>
              {friends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFriend(f)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${cardBg} ${light ? "hover:bg-[#F8FAFC]" : "hover:bg-white/5"}`}
                >
                  <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...f.avatar_config }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${text} truncate`}>{f.username}</p>
                    <p className={`text-xs ${textMuted}`}>
                      {f.rank_tier ?? "Bronze"} · Lv. {f.level}
                    </p>
                  </div>
                  <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${textMuted} shrink-0`}>
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent players ──────────────────────────────────── */}
        {recentPlayers.length > 0 && (
          <div className={`rounded-2xl overflow-hidden border ${cardBorder}`}>
            <div className={`px-4 py-3 border-b ${cardBorder} ${cardBg}`}>
              <p className={`text-sm font-bold ${text}`}>Recent players</p>
            </div>
            <div className={`divide-y ${divider}`}>
              {recentPlayers.map((p) => {
                const alreadyFriend = friends.some((f) => f.id === p.played_with_id);
                return (
                  <div key={p.played_with_id} className={`flex items-center gap-3 px-4 py-3 ${cardBg}`}>
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...p.avatar_config }} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text} truncate`}>{p.username}</p>
                      <p className={`text-xs ${textMuted}`}>
                        {p.games_played} game{p.games_played !== 1 ? "s" : ""} together
                      </p>
                    </div>
                    {alreadyFriend ? (
                      <span className={`text-xs font-semibold ${textMuted}`}>Friends</span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(p.username)}
                        disabled={adding}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30 disabled:opacity-50"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl z-50 ${
            toast.type === "success" ? "bg-[#22C55E] text-white" : "bg-[#EF4444] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Friend profile modal */}
      {selectedFriend && user && (
        <FriendProfileModal
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
          onRemove={handleRemove}
          currentUserId={user.id}
        />
      )}
    </main>
  );
}
