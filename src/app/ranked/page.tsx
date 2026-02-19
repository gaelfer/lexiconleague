"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, createGuestProfile } from "@/lib/storage";
import { syncProfileForUser } from "@/lib/profile-sync";
import { fetchLeaderboard, LeaderboardEntry } from "@/lib/supabase/profile";
import { getTierProgress, getTrophiesNeededForNextTier } from "@/lib/rank";
import { RANK_TIERS, RANK_COLORS } from "@/types";
import InkAvatar from "@/components/InkAvatar";
import RankBadge from "@/components/RankBadge";
import ProgressBar from "@/components/ProgressBar";
import ThemeToggle from "@/components/ThemeToggle";
import TrophyIcon from "@/components/icons/TrophyIcon";
import { DEFAULT_AVATAR_CONFIG } from "@/types";

const BLUE = "#3B82F6";
const MINT = "#34D399";

function TrophyIconSmall({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg font-bold text-[#D4AF37]">1</span>;
  if (rank === 2) return <span className="text-lg font-bold text-[#C0C0C0]">2</span>;
  if (rank === 3) return <span className="text-lg font-bold text-[#CD7F32]">3</span>;
  return <span className="text-sm font-bold text-[#94A3B8]">{rank}</span>;
}

export default function RankedScreenPage() {
  const { user, loading: authLoading } = useAuth();
  const { light } = useTheme();
  const [profile, setProfile] = useState(createGuestProfile());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      if (user) {
        const u = user;
        const synced = await syncProfileForUser(u.id, u.email ?? "");
        setProfile(synced);
      } else {
        const p = getProfile() ?? createGuestProfile();
        setProfile(p);
      }
      try {
        const entries = await fetchLeaderboard(100);
        setLeaderboard(entries);
      } catch {
        setLeaderboard([]);
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading]);

  const tierProgress = getTierProgress(profile.trophies, profile.rank_tier);
  const tierIdx = RANK_TIERS.indexOf(profile.rank_tier);
  const tierColor = RANK_COLORS[profile.rank_tier];
  const nextTier = getTrophiesNeededForNextTier(profile.rank_tier);

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const textFaint = light ? "text-[#94A3B8]" : "text-white/40";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-[#334155]";
  const heroBg = light ? "bg-white" : "bg-gradient-to-br from-[#1E293B] to-[#0F172A]";

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${textMuted} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <h1 className={`text-lg font-bold ${text} flex items-center gap-2`}>
          <TrophyIcon className="w-5 h-5" color={MINT} />
          Leaderboard
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/play/ranked"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors"
            style={{ backgroundColor: MINT }}
          >
            Play Ranked
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-0">
        <div className={`rounded-2xl p-6 ${heroBg} border ${cardBorder} shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className={`shrink-0 p-1 rounded-xl ring-2 ${light ? "ring-[#34D399]/40 bg-[#F8FAFC]" : "ring-[#34D399]/50 bg-[#1E293B]/30"}`}>
              <InkAvatar config={profile.avatar_config} size="lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${text} font-bold text-xl truncate`}>{profile.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <RankBadge tier={profile.rank_tier} trophies={profile.trophies} showTrophies size="sm" />
              </div>
              <div className="mt-4">
                <div className={`flex justify-between text-sm font-bold mb-2 ${text}`}>
                  <span>{profile.rank_tier} → {tierIdx < RANK_TIERS.length - 1 ? RANK_TIERS[tierIdx + 1] : "Max"}</span>
                  <span style={{ color: tierColor }}>{tierProgress}%</span>
                </div>
                <div className={`w-full h-4 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${tierProgress}%`, backgroundColor: tierColor, boxShadow: `0 0 12px ${tierColor}80` }}
                  />
                </div>
                {nextTier != null && (
                  <p className={`text-xs font-semibold mt-2 ${textMuted}`}>
                    {nextTier - profile.trophies} trophies to {RANK_TIERS[tierIdx + 1]}
                  </p>
                )}
              </div>
            </div>
          </div>
          {!user && (
            <div className={`mt-4 flex items-center justify-between px-4 py-3 rounded-xl ${light ? "bg-[#ECFDF5] border border-[#34D399]/30" : "bg-[#34D399]/20 border border-[#34D399]/40"}`}>
              <span className="text-sm font-bold" style={{ color: MINT }}>Sign in to save your rank</span>
              <Link href="/auth/signup" className="text-xs font-bold px-4 py-2 rounded-lg text-white transition-colors" style={{ backgroundColor: MINT }}>
                Join Free
              </Link>
            </div>
          )}
        </div>

        <div className={`rounded-2xl overflow-hidden ${cardBg} border ${cardBorder} shadow-lg`}>
          <div className={`px-6 py-4 border-b ${cardBorder} flex items-center justify-between`}>
            <h2 className={`${text} font-bold text-lg flex items-center gap-2`}>
              <TrophyIcon className="w-5 h-5" color={MINT} />
              Top 100
            </h2>
            <span className={`text-xs font-semibold ${textFaint}`}>By trophies</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-16 rounded-xl animate-pulse ${light ? "bg-[#E2E8F0]" : "bg-[#334155]/50"}`} />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <p className={`${textMuted} font-medium mb-2`}>No ranked players yet</p>
              <p className={`${textFaint} text-sm`}>Be the first to climb the ladder.</p>
              <Link href="/play/ranked" className="inline-block mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-colors" style={{ backgroundColor: BLUE }}>
                Play Now
              </Link>
            </div>
          ) : (
            <div className="max-h-[50vh] sm:max-h-[420px] overflow-y-auto p-3 sm:p-4 space-y-2 min-h-0">
              {leaderboard.map((entry) => {
                const isCurrentUser = user && entry.id === user.id;
                const tier = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"].includes(entry.rank_tier)
                  ? (entry.rank_tier as "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond")
                  : "Bronze";
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      isCurrentUser
                        ? light
                          ? "bg-[#DBEAFE] border border-[#3B82F6]/30"
                          : "bg-[#3B82F6]/20 border border-[#3B82F6]/40"
                        : light
                        ? "bg-[#F8FAFC] border border-transparent hover:bg-[#F1F5F9]"
                        : "bg-[#0F172A]/50 hover:bg-[#1E293B]/50 border border-transparent"
                    }`}
                  >
                    <span className="w-8 shrink-0 text-center font-bold flex items-center justify-center">
                      <TrophyIconSmall rank={entry.rank} />
                    </span>
                    <InkAvatar
                      config={entry.avatar_config ? { ...DEFAULT_AVATAR_CONFIG, ...entry.avatar_config } : undefined}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className={`font-bold truncate ${text}`}>
                        {entry.username || "Challenger"}
                        {isCurrentUser && <span className="ml-1.5 text-xs font-semibold" style={{ color: BLUE }}>(you)</span>}
                      </p>
                      <RankBadge tier={tier} size="sm" />
                    </div>
                    <span className="font-bold tabular-nums shrink-0" style={{ color: MINT }}>{entry.trophies}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
