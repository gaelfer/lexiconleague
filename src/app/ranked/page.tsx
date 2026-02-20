"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, createGuestProfile, INITIAL_PROFILE } from "@/lib/user/storage";
import { syncProfileForUser } from "@/lib/user/profile-sync";
import { fetchLeaderboard, LeaderboardEntry } from "@/lib/supabase/profile";
import { getTierProgress, getTrophiesToNextTier, getTierFromTrophies, getWinStreakMultiplier } from "@/lib/game/rank";
import { getLevel } from "@/lib/user/levels";
import { RANK_TIERS, RANK_COLORS, RANK_THRESHOLDS, RANK_INKLING_CONFIG, RankTier } from "@/types";
import InkAvatar from "@/components/InkAvatar";
import RankBadge from "@/components/RankBadge";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import TrophyIcon from "@/components/icons/TrophyIcon";
import { DEFAULT_AVATAR_CONFIG } from "@/types";

const BLUE = "#3B82F6";
const MINT = "#34D399";

const TIER_DESCRIPTIONS: Record<RankTier, string> = {
  Bronze: "The journey begins",
  Silver: "Rising challenger",
  Gold: "Proven wordsmith",
  Platinum: "Elite linguist",
  Diamond: "Legendary master",
  Emerald: "Ultimate champion",
};

function BigTierIcon({ tier, color }: { tier: RankTier; color: string }) {
  const common = { stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  if (tier === "Bronze") {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}20`} stroke={color} strokeWidth="2.5" />
        <circle cx="32" cy="32" r="22" fill={`${color}15`} stroke={color} strokeWidth="1" strokeDasharray="4 3" />
        <path d="M22 38c3-3 7-4.5 10.5-4.5s7.5 1.5 10.5 4.5" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="27" r="2.5" fill={color} />
        <circle cx="40" cy="27" r="2.5" fill={color} />
      </svg>
    );
  }
  if (tier === "Silver") {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}15`} stroke={color} strokeWidth="2.5" />
        <circle cx="32" cy="32" r="20" {...common} strokeDasharray="4 3" />
        <path d="M32 20v12l6 6" {...common} strokeWidth="2.5" />
      </svg>
    );
  }
  if (tier === "Gold") {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}15`} stroke={color} strokeWidth="2" />
        <path d="M20 50h24M32 42v8M42 12H22l-5 12c0 9.5 6.7 17 15 17s15-7.5 15-17L42 12z" {...common} strokeWidth="2.5" />
        <path d="M17 24h-5l-2 8h8M47 24h5l2 8h-8" {...common} strokeWidth="2" />
      </svg>
    );
  }
  if (tier === "Platinum") {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}10`} stroke={color} strokeWidth="2" />
        <path d="M32 8L8 20l24 12 24-12L32 8z" {...common} strokeWidth="2.5" />
        <path d="M8 44l24 12 24-12" {...common} strokeWidth="2" />
        <path d="M8 32l24 12 24-12" {...common} strokeWidth="2" />
      </svg>
    );
  }
  if (tier === "Emerald") {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill={`${color}15`} stroke={color} strokeWidth="2.5" />
        <path d="M32 12l4 12 12 1.5-9 8 3 12-10-6-10 6 3-12-9-8 12-1.5L32 12z" fill={`${color}30`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="w-full h-full" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill={`${color}10`} stroke={color} strokeWidth="2" />
      <path d="M32 8l4 12 12 1.5-9 8 3 12-10-6-10 6 3-12-9-8 12-1.5L32 8z" fill={`${color}25`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIconSmall({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg font-bold text-[#D4AF37]">1</span>;
  if (rank === 2) return <span className="text-lg font-bold text-[#C0C0C0]">2</span>;
  if (rank === 3) return <span className="text-lg font-bold text-[#CD7F32]">3</span>;
  return <span className="text-sm font-bold text-[#94A3B8]">{rank}</span>;
}

export default function RankedScreenPage() {
  const { user, loading: authLoading } = useAuth();
  const { light } = useTheme();
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLeaderboard() {
    try {
      const entries = await fetchLeaderboard(100);
      setLeaderboard(entries);
    } catch {
      setLeaderboard([]);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    setProfile(getProfile() ?? createGuestProfile());
    if (user) {
      syncProfileForUser(user.id, user.email ?? "")
        .then(setProfile)
        .catch(() => {});
    }
    Promise.race([
      loadLeaderboard(),
      new Promise<void>((r) => setTimeout(r, 8000)),
    ]).finally(() => setLoading(false));
  }, [user, authLoading]);

  useEffect(() => {
    const onProfileUpdated = () => {
      setProfile(getProfile() ?? createGuestProfile());
    };
    window.addEventListener("ll-profile-updated", onProfileUpdated);
    return () => window.removeEventListener("ll-profile-updated", onProfileUpdated);
  }, []);

  // Pull latest profile and refetch leaderboard when tab becomes visible
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      if (user) {
        const refreshed = await syncProfileForUser(user.id, user.email ?? "").catch(() => null);
        if (refreshed) setProfile(refreshed);
      }
      loadLeaderboard();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user]);

  const displayTier = getTierFromTrophies(profile.trophies);
  const tierProgress = getTierProgress(profile.trophies, displayTier);
  const tierIdx = RANK_TIERS.indexOf(displayTier);
  const tierColor = RANK_COLORS[displayTier];
  const toNextTier = getTrophiesToNextTier(profile.trophies);

  const currentStreak = profile.ranked_win_streak ?? 0;
  const streakMultiplier = getWinStreakMultiplier(currentStreak);
  const nextMilestone = [3, 5, 7, 10].find((m) => m > currentStreak) ?? 10;
  const prevMilestone = [0, 3, 5, 7, 10].filter((m) => m <= currentStreak).slice(-1)[0] ?? 0;
  const streakProgress = nextMilestone === prevMilestone ? 100 : ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

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
          <GlobalNotificationBar />
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
        {/* League hero card */}
        <div
          className={`relative rounded-2xl overflow-hidden border ${cardBorder} shadow-xl`}
          style={{ background: light
            ? `linear-gradient(135deg, ${tierColor}08 0%, ${tierColor}15 40%, ${tierColor}08 100%)`
            : `linear-gradient(135deg, ${tierColor}15 0%, ${tierColor}08 40%, #0F172A 100%)`
          }}
        >
          {/* Decorative background glow */}
          <div
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: tierColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none"
            style={{ background: tierColor }}
          />

          <div className="relative z-10 p-6 sm:p-8">
            {/* Top row: avatar + name */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`shrink-0 p-0.5 rounded-xl ring-2 ${light ? "ring-black/10" : "ring-white/10"}`}>
                <InkAvatar config={profile.avatar_config} size="sm" />
              </div>
              <div className="min-w-0">
                <p className={`${text} font-bold text-sm truncate`}>{profile.username}</p>
                <p className={`text-xs font-semibold ${textMuted}`}>Season 1</p>
              </div>
            </div>

            {/* Center: giant tier emblem */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 relative">
                <BigTierIcon tier={displayTier} color={tierColor} />
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-25 pointer-events-none"
                  style={{ background: tierColor }}
                />
              </div>
              <h2
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ color: tierColor }}
              >
                {displayTier}
              </h2>
              <p className={`text-sm font-semibold mt-1 ${textMuted}`}>
                {TIER_DESCRIPTIONS[displayTier]}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <TrophyIcon className="w-4 h-4" color={MINT} />
                <span className="text-lg font-bold" style={{ color: MINT }}>{profile.trophies}</span>
                <span className={`text-sm font-semibold ${textFaint}`}>trophies</span>
              </div>

              {/* Win streak row */}
              <div
                className={`mt-4 w-full rounded-xl px-4 py-3 border ${
                  currentStreak > 0
                    ? light ? "bg-amber-50 border-amber-300" : "bg-amber-500/10 border-amber-500/40"
                    : light ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#0F172A]/40 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C12 2 9 6 9 9c0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.5-1-3-1-3s2 3 2 6c0 3.31-2.69 6-6 6S5 15.31 5 12C5 7 12 2 12 2z" fill={currentStreak > 0 ? "#F59E0B" : (light ? "#CBD5E1" : "#475569")} />
                    </svg>
                    <span className="text-sm font-extrabold" style={{ color: currentStreak > 0 ? "#D97706" : (light ? "#94A3B8" : "#64748B") }}>
                      {currentStreak > 0 ? `${currentStreak} Win Streak` : "No Streak"}
                    </span>
                  </div>
                  <span
                    className="text-xs font-extrabold px-2 py-0.5 rounded-lg"
                    style={{
                      color: currentStreak > 0 ? "#D97706" : (light ? "#94A3B8" : "#64748B"),
                      backgroundColor: currentStreak > 0 ? "rgba(245,158,11,0.15)" : "transparent",
                    }}
                  >
                    {currentStreak > 0 ? `${streakMultiplier === 1 ? "1×" : streakMultiplier.toFixed(1)}× trophies` : "Win to start"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${light ? "bg-amber-100" : "bg-amber-500/20"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, streakProgress)}%`, backgroundColor: "#F59E0B" }}
                    />
                  </div>
                  {currentStreak < 10 ? (
                    <span className="text-[10px] font-bold shrink-0" style={{ color: currentStreak > 0 ? "#D97706" : (light ? "#94A3B8" : "#64748B") }}>
                      {currentStreak === 0 ? "3 wins → 1.2×" : `${nextMilestone - currentStreak} to ${getWinStreakMultiplier(nextMilestone).toFixed(1)}×`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold shrink-0" style={{ color: "#D97706" }}>MAX 3×</span>
                  )}
                </div>
                {currentStreak === 0 && (
                  <p className={`text-[10px] mt-1.5 font-semibold ${light ? "text-[#94A3B8]" : "text-white/30"}`}>
                    Consecutive ranked wins multiply your trophy gains — up to 3× at 10 wins
                  </p>
                )}
              </div>
            </div>

            {/* Progress bar: current → next tier */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tierColor }} />
                  <span className={`text-xs font-bold ${text}`}>{displayTier}</span>
                </div>
                {tierIdx < RANK_TIERS.length - 1 ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${text}`}>{RANK_TIERS[tierIdx + 1]}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RANK_COLORS[RANK_TIERS[tierIdx + 1]] }} />
                  </div>
                ) : (
                  <span className={`text-xs font-bold ${textFaint}`}>Max Rank</span>
                )}
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${light ? "bg-black/10" : "bg-white/10"}`}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(tierProgress, 2)}%`,
                    background: `linear-gradient(90deg, ${tierColor}, ${tierColor}cc)`,
                    boxShadow: `0 0 12px ${tierColor}60`,
                  }}
                />
              </div>
              {toNextTier != null && (
                <p className={`text-xs font-semibold mt-2 text-center ${textMuted}`}>
                  <span className="font-bold" style={{ color: tierColor }}>{toNextTier.needed}</span> trophies to <span className="font-bold">{toNextTier.nextTier}</span>
                </p>
              )}
            </div>

            {/* All tiers mini-roadmap — icon + inkling per rank */}
            <div className="flex items-center justify-between mt-5 px-1 gap-1">
              {RANK_TIERS.map((t, i) => {
                const isActive = i === tierIdx;
                const isPast = i < tierIdx;
                const c = RANK_COLORS[t];
                const inkCfg = RANK_INKLING_CONFIG[t];
                return (
                  <div key={t} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-center gap-0.5">
                      <div
                        className={`rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isActive ? "w-6 h-6 ring-2 ring-offset-1" : "w-4 h-4"
                        }`}
                        style={{
                          backgroundColor: isActive || isPast ? c : `${c}30`,
                          ringColor: isActive ? c : undefined,
                          opacity: isActive || isPast ? 1 : 0.5,
                        } as React.CSSProperties}
                      >
                        {isActive && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <InkAvatar
                        config={{ base: inkCfg.base, color: c, eyes: inkCfg.eyes, accessory: inkCfg.accessory, aura: inkCfg.aura }}
                        size={isActive ? 28 : 22}
                        className={`shrink-0 transition-all ${isActive || isPast ? "" : "opacity-50"}`}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-bold truncate w-full text-center ${isActive ? "" : isPast ? "" : "opacity-50"}`}
                      style={{ color: isActive || isPast ? c : undefined }}
                    >
                      {t}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ranked rewards callout */}
            <div className={`mt-5 px-4 py-3 rounded-xl border-2 ${light ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#0F172A]/50 border-[#334155]"}`}>
              <p className={`text-xs font-extrabold uppercase tracking-wider ${textMuted} mb-2`}>Ranked Rewards</p>
              <p className={`text-sm font-semibold ${text}`}>
                Unlock exclusive skins in the Ink Shop by playing ranked and climbing tiers. Bronze → Silver → Gold → Platinum → Diamond → Emerald.
              </p>
              <Link href="/shop" className={`inline-flex items-center gap-1.5 mt-2 text-sm font-bold ${light ? "text-[#3B82F6] hover:underline" : "text-[#60A5FA] hover:underline"}`}>
                View in Ink Shop →
              </Link>
            </div>
          </div>

        </div>

        <div className={`rounded-2xl overflow-hidden ${cardBg} border ${cardBorder} shadow-lg relative`}>
          <div className="absolute -top-2 -left-4 opacity-40 pointer-events-none z-10" style={{ transform: "rotate(-10deg)" }}>
            <InkAvatar config={{ base: "droplet_02", color: "#C0C0C0", eyes: "eyes_04", accessory: "monocle_01", aura: "none" }} size={60} />
          </div>
          <div className="absolute -bottom-4 -right-6 opacity-75 pointer-events-none z-10" style={{ transform: "rotate(15deg)" }}>
            <InkAvatar config={{ base: "droplet_01", color: "#D4AF37", eyes: "eyes_02", accessory: "crown_01", aura: "aura_glow_03" }} size={64} />
          </div>
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
                const tier = isCurrentUser
                  ? getTierFromTrophies(profile.trophies)
                  : RANK_TIERS.includes(entry.rank_tier as RankTier)
                  ? (entry.rank_tier as RankTier)
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
                      <div className="flex items-center gap-2">
                        <RankBadge tier={tier} size="sm" />
                        <span className={`text-[10px] font-medium ${textFaint}`}>Lv {getLevel(entry.xp ?? 0)}</span>
                      </div>
                    </div>
                    <span className="font-bold tabular-nums shrink-0" style={{ color: MINT }}>
                      {isCurrentUser ? profile.trophies : entry.trophies}
                    </span>
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
