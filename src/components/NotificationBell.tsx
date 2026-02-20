"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useParty } from "@/context/PartyContext";
import { useTheme } from "@/context/ThemeContext";
import {
  acceptFriendRequest,
  declineFriendRequest,
} from "@/lib/supabase/friends";
import {
  acceptPartyInvitation,
  declinePartyInvitation,
} from "@/lib/supabase/party-invitations";
import { getProfile } from "@/lib/user/storage";
import { canClaimDailyReward } from "@/lib/user/daily-rewards";
import { getLevel, LEVEL_REWARDS } from "@/lib/user/levels";
import { isLevelRewardClaimed } from "@/lib/user/storage";
import {
  getPendingNotifications,
  removePendingNotification,
  PendingNotification,
} from "@/lib/user/pending-notifications";
import { dismissAcceptedFriendRequest, dismissAcceptedPartyInvite } from "@/lib/user/dismissed-notifications";
import InkAvatar from "@/components/InkAvatar";
import { DEFAULT_AVATAR_CONFIG } from "@/types";

function BellIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function getUnclaimedLevelRewards(profile: ReturnType<typeof getProfile>) {
  if (!profile) return [];
  const level = getLevel(profile.xp);
  return LEVEL_REWARDS.filter(
    (r) => r.level <= level && !isLevelRewardClaimed(r.level, profile)
  );
}

export default function NotificationBell() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { friendRequests, acceptedFriendRequests, acceptedPartyInvites, partyInvitations, refresh } = useNotifications();
  const { addMember, setPartyLeader } = useParty();
  const { light } = useTheme();
  const [open, setOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const profile = getProfile();
  const hasDailyReward = profile && canClaimDailyReward(profile);
  const unclaimedLevelRewards = getUnclaimedLevelRewards(profile);

  useEffect(() => {
    setPending(getPendingNotifications());
    const handler = () => setPending(getPendingNotifications());
    window.addEventListener("ll-pending-notifications", handler);
    return () => window.removeEventListener("ll-pending-notifications", handler);
  }, []);

  // Don't show notifications for things you're already on the page to see/claim (uniform behavior)
  const showDailyReward = hasDailyReward && pathname !== "/shop";
  const showLevelRewards = unclaimedLevelRewards.length > 0 && pathname !== "/levels";
  const showFriendStuff = pathname !== "/friends";
  const filteredPending = useMemo(
    () =>
      pending.filter((n) => {
        if (n.type === "rank_up" && (pathname === "/ranked" || pathname === "/play/ranked")) return false;
        if (n.type === "level_up") {
          if (pathname === "/levels") return false;
          if (n.level == null) return false;
          if (!LEVEL_REWARDS.some((r) => r.level === n.level)) return false;
          if (unclaimedLevelRewards.length === 0) return false;
        }
        return true;
      }),
    [pending, pathname, unclaimedLevelRewards.length]
  );

  const total =
    (showFriendStuff ? friendRequests.length + acceptedFriendRequests.length + acceptedPartyInvites.length + partyInvitations.length : 0) +
    (showDailyReward ? 1 : 0) +
    (showLevelRewards ? unclaimedLevelRewards.length : 0) +
    filteredPending.length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleAcceptFriend(requestId: string) {
    if (!user) return;
    setActing(requestId);
    const res = await acceptFriendRequest(user.id, requestId);
    if (res.success) await refresh();
    setActing(null);
  }

  async function handleDeclineFriend(requestId: string) {
    if (!user) return;
    setActing(requestId);
    await declineFriendRequest(user.id, requestId);
    await refresh();
    setActing(null);
  }

  async function handleAcceptParty(invitationId: string) {
    if (!user) return;
    setActing(invitationId);
    const res = await acceptPartyInvitation(user.id, invitationId);
    if (res.success && res.inviter) {
      setPartyLeader(res.inviter.id); // Inviter is the party leader
      addMember(res.inviter);
      await refresh();
    }
    setActing(null);
  }

  async function handleDeclineParty(invitationId: string) {
    if (!user) return;
    setActing(invitationId);
    await declinePartyInvitation(user.id, invitationId);
    await refresh();
    setActing(null);
  }

  function handleDismissPending(id: string) {
    removePendingNotification(id);
    setPending((p) => p.filter((n) => n.id !== id));
  }

  function handleDismissAcceptedFriend(id: string) {
    dismissAcceptedFriendRequest(id);
    refresh(); // Context also listens for ll-dismissed-friend-accept; refresh ensures immediate UI update
  }

  const bg = light ? "bg-white" : "bg-[#1E293B]";
  const border = light ? "border-[#E2E8F0]" : "border-white/10";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-xl transition-colors ${light ? "hover:bg-[#F1F5F9] text-[#0F172A]" : "hover:bg-white/10 text-white"}`}
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" color={light ? "#0F172A" : "#ffffff"} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-xs font-bold flex items-center justify-center">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border ${border} ${bg} shadow-xl z-[200] overflow-hidden`}
        >
          <div className={`px-4 py-3 border-b ${border}`}>
            <p className={`font-bold text-sm ${text}`}>Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {total === 0 ? (
              <div className={`p-4 text-center ${textMuted} text-sm`}>
                No new notifications
              </div>
            ) : (
              <>
                {showDailyReward && (
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 border-b ${border} hover:opacity-90`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#34D399]">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="8" width="18" height="4" rx="1" />
                        <path d="M12 8v13" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${text}`}>Daily reward ready!</p>
                      <p className={`text-xs ${textMuted}`}>Claim your Ink Drops in the shop</p>
                    </div>
                    <span className={`text-xs font-bold ${light ? "text-[#3B82F6]" : "text-[#60A5FA]"}`}>Claim →</span>
                  </Link>
                )}
                {showLevelRewards && (
                  <Link
                    href="/levels"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 border-b ${border} hover:opacity-90`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#8B5CF6]">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${text}`}>Level rewards to claim!</p>
                      <p className={`text-xs ${textMuted}`}>{unclaimedLevelRewards.length} reward{unclaimedLevelRewards.length > 1 ? "s" : ""} waiting</p>
                    </div>
                    <span className={`text-xs font-bold ${light ? "text-[#3B82F6]" : "text-[#60A5FA]"}`}>Claim →</span>
                  </Link>
                )}
                {filteredPending.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b ${border}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${n.type === "rank_up" ? "bg-[#D4AF37]" : "bg-[#3B82F6]"}`}>
                      {n.type === "rank_up" ? (
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                          <path d="M4 22h16" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text}`}>
                        {n.type === "rank_up" ? `Ranked up to ${n.tier ?? "new tier"}!` : `Level ${n.level ?? ""} reward to claim`}
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <Link
                          href={n.type === "rank_up" ? "/ranked" : "/levels"}
                          onClick={() => { handleDismissPending(n.id); setOpen(false); }}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#22C55E] text-white hover:opacity-90"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDismissPending(n.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/80"}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {showFriendStuff && acceptedPartyInvites.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b ${border}`}
                  >
                    <InkAvatar
                      config={{ ...DEFAULT_AVATAR_CONFIG, ...(r.invitee_avatar_config ?? {}) }}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text}`}>
                        <span className="font-bold">{r.invitee_username ?? "Someone"}</span> accepted your party invite!
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <Link
                          href="/play/casual"
                          onClick={() => { dismissAcceptedPartyInvite(r.id); setOpen(false); }}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#22C55E] text-white hover:opacity-90"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => dismissAcceptedPartyInvite(r.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/80"}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {showFriendStuff && acceptedFriendRequests.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b ${border}`}
                  >
                    <InkAvatar
                      config={{ ...DEFAULT_AVATAR_CONFIG, ...r.to_avatar_config }}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text}`}>
                        <span className="font-bold">{r.to_username}</span> accepted your friend request!
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <Link
                          href="/friends"
                          onClick={() => { handleDismissAcceptedFriend(r.id); setOpen(false); }}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#22C55E] text-white hover:opacity-90"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDismissAcceptedFriend(r.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/80"}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {showFriendStuff && friendRequests.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b ${border}`}
                  >
                    <InkAvatar
                      config={{ ...DEFAULT_AVATAR_CONFIG, ...r.from_avatar_config }}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text}`}>
                        <span className="font-bold">{r.from_username}</span> wants to be friends
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => handleAcceptFriend(r.id)}
                          disabled={acting === r.id}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#22C55E] text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {acting === r.id ? "..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleDeclineFriend(r.id)}
                          disabled={acting === r.id}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/80"}`}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {showFriendStuff && partyInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b ${border}`}
                  >
                    <InkAvatar
                      config={{ ...DEFAULT_AVATAR_CONFIG, ...inv.inviter_avatar_config }}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text}`}>
                        <span className="font-bold">{inv.inviter_username}</span> invited you to their party
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => handleAcceptParty(inv.id)}
                          disabled={acting === inv.id}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#3B82F6] text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {acting === inv.id ? "..." : "Join party"}
                        </button>
                        <button
                          onClick={() => handleDeclineParty(inv.id)}
                          disabled={acting === inv.id}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/80"}`}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          {total > 0 && (
            <div className={`flex border-t ${border}`}>
              {showFriendStuff && (friendRequests.length > 0 || acceptedFriendRequests.length > 0 || acceptedPartyInvites.length > 0 || partyInvitations.length > 0) && (
                <Link
                  href="/friends"
                  onClick={() => setOpen(false)}
                  className={`flex-1 px-4 py-3 text-center text-sm font-bold ${light ? "text-[#3B82F6]" : "text-[#60A5FA]"}`}
                >
                  Friends
                </Link>
              )}
              <Link
                href="/levels"
                onClick={() => setOpen(false)}
                className={`flex-1 px-4 py-3 text-center text-sm font-bold border-l ${border} ${light ? "text-[#3B82F6]" : "text-[#60A5FA]"}`}
              >
                Levels
              </Link>
              <Link
                href="/ranked"
                onClick={() => setOpen(false)}
                className={`flex-1 px-4 py-3 text-center text-sm font-bold border-l ${border} ${light ? "text-[#3B82F6]" : "text-[#60A5FA]"}`}
              >
                Ranked
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
