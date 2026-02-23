"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useParty } from "@/context/PartyContext";
import { FriendEntry } from "@/lib/supabase/friends";
import InkAvatar from "@/components/InkAvatar";
import { DEFAULT_AVATAR_CONFIG } from "@/types";
import { getLevel } from "@/lib/user/levels";

const RANK_COLORS: Record<string, string> = {
  Bronze: "text-amber-700 dark:text-amber-500",
  Silver: "text-slate-400",
  Gold: "text-yellow-400",
  Platinum: "text-cyan-400",
  Diamond: "text-blue-400",
  Master: "text-purple-400",
  Grandmaster: "text-rose-400",
};

interface FriendProfileModalProps {
  friend: FriendEntry;
  onClose: () => void;
  onRemove: (friendId: string) => void;
  currentUserId: string;
}

export default function FriendProfileModal({
  friend,
  onClose,
  onRemove,
  currentUserId,
}: FriendProfileModalProps) {
  const { light } = useTheme();
  const { party, partyId, isLeader, startParty } = useParty();
  const overlayRef = useRef<HTMLDivElement>(null);
  const level = getLevel(friend.xp ?? 0);
  const rankColor = RANK_COLORS[friend.rank_tier ?? "Bronze"] ?? "text-amber-700";
  void currentUserId;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleInvite() {
    if (!partyId) {
      // Create a party first, then invite
      const { error } = await startParty();
      if (error) return;
    }
    // Invite is handled by PartyWidget — navigate user there
    // For now, close the modal; the party widget will show the invite flow
    onClose();
    // Dispatch a custom event that PartyWidget can listen for (optional)
    window.dispatchEvent(new CustomEvent("ll-open-party-invite", { detail: { username: friend.username } }));
  }

  const bg = light ? "bg-white" : "bg-[#1E293B]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/50";
  const cardBg = light ? "bg-[#F8FAFC]" : "bg-white/5";
  const border = light ? "border-[#E2E8F0]" : "border-white/10";

  const inParty = party?.members.some((m) => m.id === friend.id) ?? false;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className={`${bg} rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden`}>
        {/* Avatar + name */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <div className="mb-3">
            <InkAvatar
              config={{ ...DEFAULT_AVATAR_CONFIG, ...friend.avatar_config }}
              size="lg"
            />
          </div>
          <h2 className={`text-xl font-extrabold ${text}`}>{friend.username}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-bold ${rankColor}`}>{friend.rank_tier ?? "Bronze"}</span>
            <span className={`text-sm ${textMuted}`}>·</span>
            <span className={`text-sm font-semibold ${textMuted}`}>Lv. {level}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className={`grid grid-cols-2 gap-px mx-6 mb-5 rounded-xl overflow-hidden border ${border}`}>
          <div className={`${cardBg} px-4 py-3 text-center`}>
            <p className={`text-lg font-extrabold ${text}`}>{level}</p>
            <p className={`text-xs ${textMuted}`}>Level</p>
          </div>
          <div className={`${cardBg} px-4 py-3 text-center`}>
            <p className={`text-lg font-extrabold ${text}`}>{(friend.xp ?? 0).toLocaleString()}</p>
            <p className={`text-xs ${textMuted}`}>Total XP</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2.5">
          {inParty ? (
            <div className={`w-full py-3 rounded-xl text-sm font-bold text-center ${textMuted} ${cardBg}`}>
              Already in your party
            </div>
          ) : (
            <button
              onClick={handleInvite}
              disabled={!isLeader && !!party}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#3B82F6] hover:opacity-90 disabled:opacity-50"
            >
              Invite to party
            </button>
          )}
          <button
            onClick={() => { onRemove(friend.id); onClose(); }}
            className={`w-full py-3 rounded-xl text-sm font-bold border ${border} ${light ? "text-red-500 hover:bg-red-50" : "text-red-400 hover:bg-red-500/10"}`}
          >
            Remove friend
          </button>
          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold ${textMuted} ${light ? "hover:bg-[#F8FAFC]" : "hover:bg-white/5"}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
