"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, createGuestProfile } from "@/lib/user/storage";
import { UserProfile } from "@/types";
import RankBadge from "@/components/RankBadge";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import BookIcon from "@/components/icons/BookIcon";
import TrophyIcon from "@/components/icons/TrophyIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { getTierProgress, getTrophiesInTier, getTrophiesNeededForNextTier } from "@/lib/game/rank";
import { getLevelProgress, getLevel, LEVEL_REWARDS } from "@/lib/user/levels";
import { canClaimDailyReward } from "@/lib/user/daily-rewards";
import { syncProfileForUser } from "@/lib/user/profile-sync";
import { RANK_TIERS, RANK_COLORS } from "@/types";

const BLUE = "#3B82F6";
const MINT = "#34D399";

function LockOpenIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function BarChartIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function UserIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockerIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function LeaderboardIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function GiftIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 8 12 8" />
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5C15 3 12 8 12 8" />
    </svg>
  );
}

function PaletteIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill={color} stroke={color} />
      <circle cx="17.5" cy="10.5" r="0.5" fill={color} stroke={color} />
      <circle cx="8.5" cy="7.5" r="0.5" fill={color} stroke={color} />
      <circle cx="6.5" cy="12.5" r="0.5" fill={color} stroke={color} />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function CrownIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function StarIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const { light } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (user) {
        const synced = await syncProfileForUser(user.id, user.email ?? "");
        setProfile(synced);
      } else {
        let p = getProfile();
        if (!p) p = createGuestProfile();
        setProfile(p);
      }
    }
    load();
  }, [user]);

  const tierProgress = profile ? getTierProgress(profile.trophies, profile.rank_tier) : 0;
  const trophiesInTier = profile ? getTrophiesInTier(profile.trophies, profile.rank_tier) : 0;
  const tierIdx = profile ? RANK_TIERS.indexOf(profile.rank_tier) : 0;
  const tierColor = profile ? RANK_COLORS[profile.rank_tier] : BLUE;
  const levelProgress = profile ? getLevelProgress(profile.xp) : null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const textFaint = light ? "text-[#94A3B8]" : "text-white/40";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]/60";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const menuBg = light ? "bg-white" : "bg-[#1E293B]";
  const menuBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const headerBtn = light ? "bg-[#F1F5F9] border-[#E2E8F0]" : "bg-white/5 border-white/10";

  return (
    <main className={`relative min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      {/* Background design */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {light ? (
          <>
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-30 blur-3xl" style={{ background: `radial-gradient(circle, ${BLUE}40 0%, transparent 70%)` }} />
            <div className="absolute top-1/3 -left-32 w-64 h-64 rounded-full opacity-25 blur-3xl" style={{ background: `radial-gradient(circle, ${MINT}50 0%, transparent 70%)` }} />
            <div className="absolute bottom-20 right-1/4 w-48 h-48 rounded-full opacity-20 blur-2xl" style={{ background: `radial-gradient(circle, ${BLUE}60 0%, transparent 70%)` }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#F8FAFC_40%,#F8FAFC_100%)]" />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #64748B 1px, transparent 0)", backgroundSize: "36px 36px" }} />
          </>
        ) : (
          <>
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${BLUE} 0%, transparent 60%)` }} />
            <div className="absolute top-1/3 -left-40 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: `radial-gradient(circle, ${MINT} 0%, transparent 60%)` }} />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-2xl" style={{ background: `radial-gradient(circle, ${BLUE} 0%, transparent 60%)` }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#0F172A_0%,#0F172A_30%,#0c1222_100%)]" />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
          </>
        )}
      </div>

      <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${headerBtn} border`}>
            <SparkIcon className="w-5 h-5" color={BLUE} />
          </div>
          <span className={`text-lg font-bold ${text}`}>
            Lexicon<span style={{ color: BLUE }}>League</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading && (
            <>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${headerBtn} border`}
                  >
                    {profile && <InkAvatar config={profile.avatar_config} size="xs" />}
                    {profile && <RankBadge tier={profile.rank_tier} size="sm" />}
                    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${textFaint} ${menuOpen ? "rotate-180" : ""}`}>
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={closeMenu} aria-hidden="true" />
                      <div className={`absolute right-0 top-full mt-2 w-64 sm:w-72 ${menuBg} border ${menuBorder} rounded-2xl shadow-2xl overflow-hidden z-50`}>
                        <div className={`px-5 py-4 border-b ${menuBorder}`}>
                          <p className={`${text} text-base font-bold truncate`}>{profile?.username || user.email}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <InkDropIcon className="w-4 h-4 shrink-0" color={MINT} />
                            <span className="text-sm font-bold" style={{ color: MINT }}>{profile?.ink_drops ?? 0} Ink Drops</span>
                          </div>
                        </div>
                        <nav className="py-2" aria-label="Account menu">
                          {[
                            { href: "/profile", label: "Profile", icon: <UserIcon className="w-5 h-5 shrink-0" color="currentColor" /> },
                            { href: "/shop", label: "Ink Shop", icon: <InkDropIcon className="w-5 h-5 shrink-0" color="currentColor" />, dot: profile && canClaimDailyReward(profile) },
                            { href: "/locker", label: "Ink Locker", icon: <LockerIcon className="w-5 h-5 shrink-0" color="currentColor" /> },
                            { href: "/ranked", label: "Ranked & Leaderboard", icon: <LeaderboardIcon className="w-5 h-5 shrink-0" color="currentColor" /> },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeMenu}
                              className={`flex items-center gap-4 w-full px-5 py-3.5 text-base font-semibold transition-colors min-h-[48px] active:scale-[0.98] ${textMuted} ${light ? "hover:text-[#0F172A] hover:bg-[#F8FAFC]" : "hover:text-white hover:bg-white/5"}`}
                            >
                              {item.icon}
                              <span className="flex-1">{item.label}</span>
                              {item.dot && <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse shrink-0" aria-label="Daily reward available" />}
                            </Link>
                          ))}
                        </nav>
                        <div className={`border-t ${menuBorder} p-2`}>
                          <button
                            onClick={() => { signOut(); closeMenu(); }}
                            className={`w-full text-left px-5 py-3.5 min-h-[48px] rounded-xl ${textMuted} hover:text-[#EF4444] hover:bg-[#EF4444]/5 text-base font-semibold transition-colors active:scale-[0.98]`}
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className={`px-4 py-2.5 text-sm font-bold ${textMuted} hover:${text} transition-colors`}>
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors"
                    style={{ backgroundColor: BLUE }}
                  >
                    Join Free
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      <section className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 pt-10 sm:pt-16 pb-8 gap-4 max-w-2xl mx-auto w-full">
        <p className={`text-sm font-semibold ${textMuted}`}>Season 1</p>
        <h1 className={`text-3xl sm:text-4xl font-bold ${text} leading-tight`}>
          Vocabulary and punctuation. 60 seconds. Climb the ranks.
        </h1>
        <p className={`${textMuted} text-base max-w-lg`}>
          Pick Casual for practice or Ranked to earn trophies. Bronze to Diamond.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/play/casual"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-white rounded-xl transition-colors"
            style={{ backgroundColor: BLUE }}
          >
            <BookIcon className="w-5 h-5" color="white" />
            Play Casual
          </Link>
          <Link
            href={user ? "/ranked" : "/auth/signup"}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold rounded-xl border-2 transition-colors ${light ? "border-[#34D399] text-[#059669] hover:bg-[#34D399]/10" : "border-[#34D399]/60 text-[#34D399] hover:bg-[#34D399]/10"}`}
          >
            <TrophyIcon className="w-5 h-5" color={MINT} />
            {user ? "Ranked Mode" : "Join to Rank Up"}
          </Link>
        </div>
      </section>

      {profile && (
        <section className="relative z-10 px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Trophies", value: profile.trophies, Icon: TrophyIcon, color: MINT, format: (v: number) => v.toLocaleString() },
              { label: "Level", value: getLevel(profile.xp), Icon: SparkIcon, color: BLUE, format: (v: number) => String(v) },
              { label: "Ink Drops", value: profile.ink_drops, Icon: InkDropIcon, color: MINT, format: (v: number) => v.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-4 ${cardBg} border ${cardBorder} text-center`}>
                <stat.Icon className="w-6 h-6 mx-auto mb-2" color={stat.color} />
                <p className={`text-xl font-bold ${text}`}>{profile ? stat.format(stat.value) : "—"}</p>
                <p className={`text-xs font-medium ${textFaint} mt-0.5`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile && (
        <>
          {/* Rank card — for ranked mode */}
          <section className="relative z-10 px-4 sm:px-6 pb-3 max-w-lg mx-auto w-full">
            <div className={`rounded-xl p-5 ${cardBg} border ${cardBorder}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`${textFaint} text-xs font-semibold uppercase mb-1`}>{user ? "Your rank" : "Progress"}</p>
                <RankBadge tier={profile.rank_tier} trophies={profile.trophies} showTrophies size="md" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className={textMuted}>{profile.rank_tier} · {trophiesInTier} trophies</span>
                  {tierIdx < RANK_TIERS.length - 1 && (
                    <span className={textFaint}>{(getTrophiesNeededForNextTier(profile.rank_tier) ?? 0) - profile.trophies} to {RANK_TIERS[tierIdx + 1]}</span>
                  )}
                </div>
                <div className={`w-full h-2.5 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${tierProgress}%`, backgroundColor: tierColor }}
                  />
                </div>
              </div>
              {!user && (
                <div className={`mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg ${light ? "bg-[#ECFDF5] border border-[#34D399]/30" : "bg-[#34D399]/10 border border-[#34D399]/20"}`}>
                  <span className="text-sm font-semibold" style={{ color: MINT }}>Save progress</span>
                  <Link href="/auth/signup" className="text-xs font-bold px-4 py-2 rounded-lg text-white transition-colors" style={{ backgroundColor: MINT }}>
                    Join Free
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Level & Rewards — compact preview (click to open full roadmap) */}
          <section className="relative z-10 px-4 sm:px-6 pb-3 max-w-lg mx-auto w-full">
            <Link href="/levels" className="block">
            <div className={`rounded-xl overflow-hidden border ${cardBorder} transition-all hover:border-[#3B82F6]/40 hover:shadow-md cursor-pointer active:scale-[0.99]`}>
              <div className={`px-4 py-3 ${cardBg} flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-2 min-w-0">
                  <GiftIcon className="w-4 h-4 shrink-0" color={BLUE} />
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${text}`}>Level & Rewards</p>
                    {levelProgress && levelProgress.xpNeededForLevel > 0 && (
                      <p className={`text-[10px] ${textFaint}`}>{levelProgress.xpInLevel}/{levelProgress.xpNeededForLevel} XP</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`flex -space-x-1.5`}>
                    {(() => {
                      const currentLevel = levelProgress?.level ?? 1;
                      const visibleRewards = LEVEL_REWARDS.filter(r => r.level <= currentLevel + 12).slice(0, 4);
                      const nextRewardLevel = LEVEL_REWARDS.find(r => r.level > currentLevel)?.level;
                      return visibleRewards.map((reward) => {
                        const unlocked = currentLevel >= reward.level;
                        const isNext = !unlocked && reward.level === nextRewardLevel;
                        const RewardVisual = reward.type === "ink_drops" ? InkDropIcon : reward.type === "cosmetic" ? PaletteIcon : reward.type === "title" ? CrownIcon : StarIcon;
                        const rewardColor = reward.type === "ink_drops" ? MINT : reward.type === "cosmetic" ? "#8B5CF6" : reward.type === "title" ? "#D4AF37" : BLUE;
                        return (
                          <div
                            key={reward.level}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
                              unlocked ? "border-transparent" : isNext ? "" : light ? "border-[#E2E8F0] bg-[#F8FAFC]" : "border-white/10 bg-[#0F172A]"
                            }`}
                            style={{
                              backgroundColor: unlocked ? BLUE : isNext ? `${BLUE}15` : undefined,
                              borderColor: isNext ? BLUE : undefined,
                            }}
                          >
                            {unlocked ? (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : isNext ? (
                              <RewardVisual className="w-3.5 h-3.5" color={rewardColor} />
                            ) : (
                              <LockIcon className="w-3 h-3" color={light ? "#94A3B8" : "rgba(255,255,255,0.3)"} />
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <span className={`text-base font-extrabold`} style={{ color: BLUE }}>{levelProgress?.level ?? 1}</span>
                </div>
              </div>
              {levelProgress && levelProgress.xpNeededForLevel > 0 && (
                <div className={`px-4 pb-2.5 ${cardBg}`}>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${levelProgress.progressPercent}%`, backgroundColor: BLUE }}
                    />
                  </div>
                </div>
              )}
            </div>
            </Link>
            <p className={`text-[10px] font-medium ${textFaint} text-center mt-1.5`}>Tap to view full roadmap →</p>
          </section>
        </>
      )}

      {profile && canClaimDailyReward(profile) && (
        <section className="relative z-10 px-4 sm:px-6 py-2 max-w-lg mx-auto w-full">
          <Link href="/shop" className="block">
            <div className={`rounded-xl p-4 flex items-center gap-4 ${light ? "bg-[#ECFDF5] border border-[#34D399]/30" : "bg-[#34D399]/10 border border-[#34D399]/20"} transition-colors hover:opacity-90`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: MINT }}>
                <InkDropIcon className="w-5 h-5" color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${text}`}>Daily reward ready</p>
                <p className={`text-xs ${textMuted}`}>Claim in Ink Shop</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse shrink-0" />
            </div>
          </Link>
        </section>
      )}

      <section className="relative z-10 px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
        <Link href="/play/casual" className="block">
          <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} transition-colors hover:border-[#3B82F6]/40 h-full`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${light ? "bg-[#DBEAFE]" : "bg-[#3B82F6]/20"}`}>
              <BookIcon className="w-6 h-6" color={BLUE} />
            </div>
            <h3 className={`${text} font-bold text-lg mb-2`}>Casual Mode</h3>
            <p className={`${textMuted} text-sm mb-4`}>Vocabulary or punctuation. 60 seconds. No rank impact.</p>
            <span className="text-sm font-bold" style={{ color: BLUE }}>Play now →</span>
          </div>
        </Link>
        <Link href={user ? "/ranked" : "/auth/signup?from=ranked"} className="block">
          <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} transition-colors hover:border-[#34D399]/40 h-full`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${light ? "bg-[#D1FAE5]" : "bg-[#34D399]/20"}`}>
              <TrophyIcon className="w-6 h-6" color={MINT} />
            </div>
            <h3 className={`${text} font-bold text-lg mb-2`}>Ranked Mode</h3>
            <p className={`${textMuted} text-sm mb-4`}>Earn trophies. Climb Bronze to Diamond.</p>
            <span className="text-sm font-bold" style={{ color: MINT }}>{user ? "Leaderboard & play →" : "Sign up to play →"}</span>
          </div>
        </Link>

        {/* Story Mode — Coming Soon (cartoony, red inkling) */}
        <div
          className="relative rounded-2xl overflow-hidden border-[3px] cursor-default select-none min-w-0"
          style={{
            borderColor: "rgba(190, 18, 60, 0.5)",
            background: light
              ? "linear-gradient(135deg, rgba(190, 18, 60, 0.08) 0%, rgba(190, 18, 60, 0.15) 50%, rgba(190, 18, 60, 0.08) 100%)"
              : "linear-gradient(135deg, rgba(190, 18, 60, 0.2) 0%, rgba(190, 18, 60, 0.1) 50%, rgba(15, 23, 42, 0.6) 100%)",
            boxShadow: "0 6px 24px rgba(190, 18, 60, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "#BE123C" }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none" style={{ background: "#DC2626" }} />
          <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-2 sm:mb-3">
              <div
                className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[22px] flex items-center justify-center overflow-visible mx-auto sm:mx-0"
                style={{
                  background: "linear-gradient(145deg, #E11D48 0%, #BE123C 40%, #9F1239 100%)",
                  boxShadow: "0 6px 16px rgba(220, 38, 38, 0.45), inset 0 2px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(255,255,255,0.15)",
                  transform: "rotate(-3deg)",
                }}
              >
                <InkAvatar
                  config={{
                    base: "droplet_01",
                    color: "#DC2626",
                    eyes: "eyes_02",
                    accessory: "none",
                    aura: "none",
                  }}
                  size={48}
                  className="drop-shadow-lg"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white/40" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h3 className="font-extrabold text-base sm:text-lg" style={{ color: "#BE123C" }}>Story Mode</h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white whitespace-nowrap"
                    style={{ backgroundColor: "#9F1239", boxShadow: "0 2px 6px rgba(159, 18, 57, 0.4)" }}
                  >
                    Coming Soon
                  </span>
                </div>
                <p className={`text-xs font-medium mt-1 ${textMuted}`}>
                  Chapters · Boss battles · Exclusive loot
                </p>
              </div>
            </div>
            <p className={`text-xs sm:text-sm font-medium flex-1 ${textMuted} text-center sm:text-left`}>
              A narrative adventure through the world of words. Defeat vocab villains!
            </p>
            <div className="mt-2 sm:mt-3 flex justify-center sm:justify-start gap-1.5 flex-wrap">
              {["📖", "⚔️", "🎁"].map((emoji, i) => (
                <span
                  key={i}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm sm:text-base shrink-0"
                  style={{
                    background: "rgba(190, 18, 60, 0.15)",
                    border: "1px solid rgba(190, 18, 60, 0.25)",
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 sm:px-6 pb-8 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/shop", label: "Ink Shop", Icon: InkDropIcon, color: MINT },
            { href: "/locker", label: "Ink Locker", Icon: LockOpenIcon, color: BLUE },
            { href: "/ranked", label: "Leaderboard", Icon: BarChartIcon, color: MINT },
            { href: user ? "/profile" : "/auth/signup", label: user ? "Profile" : "Join Free", Icon: UserIcon, color: BLUE },
          ].map((link) => (
            <Link key={link.href + link.label} href={link.href} className="block">
              <div className={`rounded-xl p-4 ${cardBg} border ${cardBorder} text-center transition-colors hover:border-opacity-60`}>
                <link.Icon className="w-6 h-6 mx-auto mb-2" color={link.color} />
                <p className={`${text} text-sm font-semibold`}>{link.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className={`relative z-10 mt-auto text-center py-6 text-sm ${textFaint} font-medium border-t ${cardBorder}`}>
        Lexicon League · Season 1
      </footer>
    </main>
  );
}
