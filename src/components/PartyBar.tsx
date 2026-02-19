"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useParty } from "@/context/PartyContext";
import InkAvatar from "@/components/InkAvatar";
import { DEFAULT_AVATAR_CONFIG } from "@/types";

/** Persistent party bar — visible when party has members */
export default function PartyBar() {
  const { user } = useAuth();
  const { members, removeMember, clearParty, canQueue1v1, canQueue3v3 } = useParty();
  const { light } = useTheme();

  if (!user || members.length === 0) return null;

  const bg = light ? "bg-white/95 border-[#E2E8F0]" : "bg-[#1E293B]/95 border-white/10";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-2xl border shadow-xl ${bg} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m) => (
            <div key={m.id} className="ring-2 ring-white dark:ring-[#1E293B] rounded-full">
              <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...m.avatar_config }} size="xs" />
            </div>
          ))}
          {members.length > 4 && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white"}`}>
              +{members.length - 4}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${text}`}>Party ({members.length}/6)</p>
          <p className={`text-xs ${textMuted}`}>
            {canQueue1v1 ? "1v1 ready" : ""} {canQueue1v1 && canQueue3v3 ? "· " : ""} {canQueue3v3 ? "3v3 ready" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/play/casual"
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: "#34D399" }}
          >
            Play
          </Link>
          <button
            onClick={clearParty}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${light ? "text-[#64748B] hover:bg-[#F1F5F9]" : "text-white/70 hover:bg-white/10"}`}
          >
            Leave
          </button>
        </div>
      </div>
      <div className={`flex flex-wrap gap-2 px-4 pb-3 pt-0 max-h-20 overflow-y-auto`}>
        {members.map((m) => (
          <div
            key={m.id}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${light ? "bg-[#F8FAFC]" : "bg-white/5"}`}
          >
            <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...m.avatar_config }} size="xs" />
            <span className={`text-xs font-medium ${text} truncate max-w-[80px]`}>{m.username}</span>
            <button
              onClick={() => removeMember(m.id)}
              className="text-[#EF4444] hover:bg-[#EF4444]/10 rounded p-0.5 text-xs font-bold"
              aria-label={`Remove ${m.username}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
