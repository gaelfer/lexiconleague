"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, saveProfile, createGuestProfile, INITIAL_PROFILE } from "@/lib/user/storage";
import { UserProfile } from "@/types";
import RankBadge from "@/components/RankBadge";
import InkAvatar from "@/components/InkAvatar";
import LogoIcon from "@/components/icons/LogoIcon";
import InkDropIcon from "@/components/icons/InkDropIcon";
import BookIcon from "@/components/icons/BookIcon";
import TrophyIcon from "@/components/icons/TrophyIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import HomeTutorialOverlay from "@/components/HomeTutorialOverlay";
import { getTierProgress, getTrophiesInTier, getTrophiesToNextTier, getTierFromTrophies } from "@/lib/game/rank";
import { getLevelProgress, getLevel, LEVEL_REWARDS } from "@/lib/user/levels";
import { canClaimDailyReward } from "@/lib/user/daily-rewards";
import { RANK_COLORS } from "@/types";
import { getDailySeed, DAILY_CHALLENGE_MAX_ATTEMPTS, getDailyChallengeTopicAndGrade } from "@/lib/game/daily-challenge";
import { getDailyChallengeState, DailyChallengeState } from "@/lib/user/daily-challenge-storage";

import { BLUE, MINT, DARK, CARD, SURFACE } from "@/lib/design-tokens";

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

function UsersIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

export default function HomePage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}

function Home() {
  const { user, loading, signOut } = useAuth();
  const { light } = useTheme();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const [dailyState, setDailyState] = useState<DailyChallengeState>({ date: "", attempts: 0, bestScore: 0, bestCorrect: 0, rewarded: false });

  useEffect(() => {
    const p = getProfile() ?? createGuestProfile();
    setProfile(p);
    setProfileLoaded(true);
    setDailyState(getDailyChallengeState());
  }, []);

  useEffect(() => {
    const onProfileUpdated = () => {
      const fresh = getProfile() ?? createGuestProfile();
      setProfile(fresh);
      setProfileLoaded(true);
    };
    window.addEventListener("ll-profile-updated", onProfileUpdated);
    return () => window.removeEventListener("ll-profile-updated", onProfileUpdated);
  }, []);

  useEffect(() => {
    if (!profileLoaded || !profile) return;
    if (tutorialDismissed) return;
    const forceTutorial = searchParams.get("tutorial") === "1";
    if (forceTutorial || !profile.tutorial_completed) {
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
    }
  }, [profileLoaded, profile, searchParams, tutorialDismissed]);

  function handleTutorialFinish() {
    setShowTutorial(false);
    setTutorialDismissed(true);
    if (!profile || profile.tutorial_completed) return;
    const updated = { ...profile, tutorial_completed: true };
    setProfile(updated);
    saveProfile(updated);
  }

  const displayTier = profile ? getTierFromTrophies(profile.trophies) : "Bronze";
  const tierProgress = profile ? getTierProgress(profile.trophies, displayTier) : 0;
  const trophiesInTier = profile ? getTrophiesInTier(profile.trophies, displayTier) : 0;
  const tierColor = profile ? RANK_COLORS[displayTier] : BLUE;
  const levelProgress = profile ? getLevelProgress(profile.xp) : null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const textFaint = light ? "text-[#94A3B8]" : "text-[#475569]";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const menuBg = light ? "bg-white" : "bg-[#1E293B]";
  const menuBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const headerBtn = light ? "bg-[#F1F5F9] border-[#E2E8F0]" : "bg-white/5 border-white/10";

  return (
    <main className={`relative min-h-[100dvh] flex flex-col overflow-x-hidden ${bg}`} style={!light ? { background: SURFACE } : undefined}>
      {/* Background design — marketing style */}
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
            <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${BLUE} 0%, transparent 65%)`, transform: "translate(20%, -50%)" }} />
            <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full opacity-12 pointer-events-none" style={{ background: `radial-gradient(circle, ${MINT} 0%, transparent 65%)`, transform: "translate(-20%, 0)" }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${SURFACE} 0%, ${DARK} 30%, #0a0f1a 100%)` }} />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
          </>
        )}
      </div>

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${headerBtn} border overflow-hidden p-0.5`}>
            <LogoIcon className="w-full h-full" />
          </div>
          <span className={`text-lg font-bold ${text}`}>
            Lexicon<span style={{ color: BLUE }}>League</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
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
                            { href: "/locker", label: "Ink Locker", icon: <LockOpenIcon className="w-5 h-5 shrink-0" color="currentColor" /> },
                            { href: "/ranked", label: "Ranked & Leaderboard", icon: <BarChartIcon className="w-5 h-5 shrink-0" color="currentColor" /> },
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

      {/* ── Compact hero banner ── */}
      <section className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-6 pt-2 pb-4 max-w-3xl mx-auto w-full overflow-visible">
        {/* Floating inklings */}
        <div className="absolute -top-1 left-2 opacity-40 pointer-events-none" style={{ transform: "rotate(-12deg)" }}>
          <InkAvatar config={{ base: "droplet_02", color: "#8B5CF6", eyes: "eyes_01", accessory: "none", aura: "none" }} size={44} />
        </div>
        <div className="absolute top-3 right-4 sm:right-10 opacity-35 pointer-events-none" style={{ transform: "rotate(8deg)" }}>
          <InkAvatar config={{ base: "droplet_01", color: "#22C55E", eyes: "eyes_03", accessory: "bow_01", aura: "none" }} size={40} />
        </div>
        <div className="absolute top-8 left-10 sm:left-20 opacity-25 pointer-events-none" style={{ transform: "rotate(5deg)" }}>
          <InkAvatar config={{ base: "droplet_03", color: "#EC4899", eyes: "eyes_06", accessory: "none", aura: "none" }} size={36} />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative shrink-0" style={{ transform: "rotate(-6deg)" }}>
            <LogoIcon className="w-10 h-10" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ fontFamily: "system-ui, sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)", lineHeight: 1 }}>1</div>
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${textFaint}`}>Season 1</p>
            <p className={`text-sm font-bold ${textMuted} leading-tight`}>Vocabulary & punctuation. 60 seconds.</p>
          </div>
        </div>
      </section>

      {/* ── Combined player progress card ── */}
      {profile && (
        <section className="relative z-10 px-4 sm:px-6 pb-4 max-w-3xl mx-auto w-full">
          <div className={`rounded-xl p-5 ${cardBg} border ${cardBorder} relative overflow-visible`}>
            {/* Decorative teardrops */}
            <div className="absolute -top-2 left-8 opacity-40 pointer-events-none" style={{ transform: "rotate(-5deg)" }}>
              <InkAvatar config={{ base: "droplet_01", color: "#F97316", eyes: "eyes_04", accessory: "scarf_01", aura: "none" }} size={52} />
            </div>
            <div className="absolute top-2 right-12 opacity-35 pointer-events-none" style={{ transform: "rotate(10deg)" }}>
              <InkAvatar config={{ base: "droplet_02", color: "#06B6D4", eyes: "eyes_01", accessory: "none", aura: "none" }} size={48} />
            </div>
            <div className="absolute -bottom-1 left-4 opacity-40 pointer-events-none" style={{ transform: "rotate(-8deg)" }}>
              <InkAvatar config={{ base: "droplet_04", color: "#C0C0C0", eyes: "eyes_05", accessory: "monocle_01", aura: "none" }} size={44} />
            </div>

            {/* Top row: avatar + name + rank + stats */}
            <div className="flex items-start gap-3 mb-4">
              <Link href={user ? "/profile" : "/auth/signup"} className="shrink-0">
                <InkAvatar config={profile.avatar_config} size="md" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold text-base ${text} truncate`}>{profile.username}</p>
                  <RankBadge tier={displayTier} trophies={profile.trophies} showTrophies size="sm" />
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <SparkIcon className="w-3.5 h-3.5 shrink-0" color={BLUE} />
                    <span className={`text-xs font-bold ${text}`}>Lv. {getLevel(profile.xp)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <InkDropIcon className="w-3.5 h-3.5 shrink-0" color={MINT} />
                    <span className={`text-xs font-bold ${text}`}>{profile.ink_drops.toLocaleString()} drops</span>
                  </div>
                  {profile && canClaimDailyReward(profile) && (
                    <Link href="/shop" className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: MINT }} data-tutorial-id="daily-reward">
                      <InkDropIcon className="w-2.5 h-2.5" color="white" />
                      Daily ready
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Rank progress */}
            <div className="space-y-3">
              <Link href={user ? "/ranked" : "/auth/signup"} className="block group">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className={`font-semibold ${textMuted} group-hover:opacity-80 transition-opacity`}>
                    {displayTier} · {trophiesInTier} trophies
                  </span>
                  {(() => {
                    const toNext = getTrophiesToNextTier(profile.trophies);
                    return toNext
                      ? <span className={`${textFaint} group-hover:opacity-80 transition-opacity`}>{toNext.needed} to {toNext.nextTier} →</span>
                      : null;
                  })()}
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${tierProgress}%`, backgroundColor: tierColor }} />
                </div>
              </Link>

              {levelProgress && levelProgress.xpNeededForLevel > 0 && (
                <Link href="/levels" className="block group">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${textMuted} group-hover:opacity-80 transition-opacity`}>Level {levelProgress.level}</span>
                      {/* Upcoming reward icons */}
                      <div className="flex -space-x-1">
                        {(() => {
                          const currentLevel = levelProgress.level;
                          const visibleRewards = LEVEL_REWARDS.filter(r => r.level <= currentLevel + 6).slice(0, 3);
                          const nextRewardLevel = LEVEL_REWARDS.find(r => r.level > currentLevel)?.level;
                          return visibleRewards.map((reward) => {
                            const unlocked = currentLevel >= reward.level;
                            const isNext = !unlocked && reward.level === nextRewardLevel;
                            const RewardVisual = reward.type === "ink_drops" ? InkDropIcon : reward.type === "cosmetic" ? PaletteIcon : reward.type === "title" ? CrownIcon : StarIcon;
                            const rewardColor = reward.type === "ink_drops" ? MINT : reward.type === "cosmetic" ? "#8B5CF6" : reward.type === "title" ? "#D4AF37" : BLUE;
                            return (
                              <div
                                key={reward.level}
                                className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                                  unlocked ? "border-transparent" : isNext ? "" : light ? "border-[#E2E8F0] bg-[#F8FAFC]" : "border-white/10 bg-[#0F172A]"
                                }`}
                                style={{
                                  backgroundColor: unlocked ? BLUE : isNext ? `${BLUE}15` : undefined,
                                  borderColor: isNext ? BLUE : undefined,
                                }}
                              >
                                {unlocked ? (
                                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : isNext ? (
                                  <RewardVisual className="w-2.5 h-2.5" color={rewardColor} />
                                ) : (
                                  <LockIcon className="w-2 h-2" color={light ? "#94A3B8" : "rgba(255,255,255,0.3)"} />
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <span className={`${textFaint} group-hover:opacity-80 transition-opacity`}>{levelProgress.xpInLevel}/{levelProgress.xpNeededForLevel} XP →</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${levelProgress.progressPercent}%`, backgroundColor: BLUE }} />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Mode cards — primary content ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">

        {/* Casual Mode */}
        <Link href="/play/casual" className="block relative" data-tutorial-id="casual">
          <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} transition-all duration-200 h-full relative overflow-visible ${!light ? "hover:border-[#3B82F6]/40 hover:shadow-[0_20px_56px_rgba(59,130,246,0.15)]" : "hover:border-[#3B82F6]/40"}`}>
            <div className="absolute -bottom-2 -left-2 opacity-40 pointer-events-none" style={{ transform: "rotate(-10deg)" }}>
              <InkAvatar config={{ base: "droplet_04", color: "#06B6D4", eyes: "eyes_08", accessory: "none", aura: "none" }} size={56} />
            </div>
            <div className="absolute -top-3 -right-2 opacity-90 pointer-events-none" style={{ transform: "rotate(12deg)" }}>
              <InkAvatar config={{ base: "droplet_01", color: BLUE, eyes: "eyes_03", accessory: "glasses_01", aura: "none" }} size={64} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <BookIcon className="w-5 h-5 shrink-0" color={BLUE} />
              <h3 className={`${text} font-bold text-lg`}>Casual</h3>
            </div>
            <p className={`${textMuted} text-sm mb-4`}>Vocabulary or punctuation. 60 seconds. No rank impact.</p>
            <span className="text-sm font-bold" style={{ color: BLUE }}>Play now →</span>
          </div>
        </Link>

        {/* Ranked Mode */}
        <Link href={user ? "/ranked" : "/auth/signup?from=ranked"} className="block relative" data-tutorial-id="ranked">
          <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} transition-all duration-200 h-full relative overflow-visible ${!light ? "hover:border-[#34D399]/40 hover:shadow-[0_20px_56px_rgba(52,211,153,0.12)]" : "hover:border-[#34D399]/40"}`}>
            <div className="absolute -bottom-2 -right-1 opacity-40 pointer-events-none" style={{ transform: "rotate(15deg)" }}>
              <InkAvatar config={{ base: "droplet_05", color: "#EAB308", eyes: "eyes_01", accessory: "tophat_01", aura: "none" }} size={56} />
            </div>
            <div className="absolute -top-3 -right-2 opacity-90 pointer-events-none" style={{ transform: "rotate(12deg)" }}>
              <InkAvatar config={{ base: "droplet_02", color: "#22C55E", eyes: "eyes_02", accessory: "crown_01", aura: "aura_glow_01" }} size={64} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <TrophyIcon className="w-5 h-5 shrink-0" color={MINT} />
              <h3 className={`${text} font-bold text-lg`}>Ranked</h3>
            </div>
            <p className={`${textMuted} text-sm mb-4`}>Earn trophies. Climb Bronze to Emerald.</p>
            <span className="text-sm font-bold" style={{ color: MINT }}>{user ? "Leaderboard & play →" : "Sign up to play →"}</span>
          </div>
        </Link>

        {/* Study Mode */}
        <Link href="/study" className="block relative sm:col-span-2" data-tutorial-id="study">
          <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} transition-all duration-200 h-full relative overflow-visible flex flex-col sm:flex-row sm:items-center gap-4 ${!light ? "hover:border-[#A78BFA]/40 hover:shadow-[0_20px_56px_rgba(167,139,250,0.12)]" : "hover:border-[#A78BFA]/40"}`}>
            <div className="absolute -top-3 right-8 opacity-90 pointer-events-none" style={{ transform: "rotate(-8deg)" }}>
              <InkAvatar config={{ base: "droplet_03", color: "#8B5CF6", eyes: "eyes_05", accessory: "wizard_01", aura: "none" }} size={60} />
            </div>
            <div className="flex items-center gap-2 mb-1 sm:mb-0">
              <SparkIcon className="w-5 h-5 shrink-0" color="#A78BFA" />
              <h3 className={`${text} font-bold text-lg`}>Study</h3>
            </div>
            <p className={`${textMuted} text-sm flex-1`}>Self-paced. Pick a tier, build mastery over time. Spaced repetition included.</p>
            <span className="text-sm font-bold shrink-0" style={{ color: "#8B5CF6" }}>Start studying →</span>
          </div>
        </Link>

        {/* Daily Challenge */}
        {(() => {
          const today = new Date();
          const dateLabel = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const { topic, grade } = getDailyChallengeTopicAndGrade();
          const attemptsUsed = dailyState.date === getDailySeed() ? dailyState.attempts : 0;
          const attemptsLeft = DAILY_CHALLENGE_MAX_ATTEMPTS - attemptsUsed;
          const hasPlayed = attemptsUsed > 0;
          const allDone = attemptsLeft === 0;
          return (
            <Link href="/play/daily" className="block relative sm:col-span-2">
              <div className={`rounded-xl px-6 py-5 ${cardBg} border transition-all duration-200 relative overflow-visible flex flex-col sm:flex-row sm:items-center gap-4 ${light ? cardBorder : ""} ${!light ? "hover:border-[#CD7F32]/50 hover:shadow-[0_20px_56px_rgba(205,127,50,0.15)]" : "hover:border-[#CD7F32]/50"}`} style={!light ? { borderColor: "rgba(205, 127, 50, 0.35)" } : undefined}>
                {/* Orange guy — top right, outside the card */}
                <div className="absolute -top-4 -right-2 pointer-events-none z-10" style={{ transform: "rotate(10deg)" }}>
                  <InkAvatar config={{ base: "droplet_03", color: "#F59E0B", eyes: "eyes_06", accessory: "crown_01", aura: "aura_glow_01" }} size={64} />
                </div>
                {/* Left: label + date */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: light ? "#F5E6D3" : "rgba(205, 127, 50, 0.2)" }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#CD7F32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`${text} font-bold text-base`}>Daily Challenge</h3>
                      {!hasPlayed && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <p className={`text-xs ${textMuted}`}>{dateLabel} · {grade} · {topic}</p>
                  </div>
                </div>
                {/* Middle: attempt pips + score */}
                <div className="flex items-center gap-4 sm:flex-1 sm:justify-center flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: DAILY_CHALLENGE_MAX_ATTEMPTS }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: i < attemptsUsed ? "#CD7F32" : light ? "#E2E8F0" : "#334155" }}
                      />
                    ))}
                    <span className={`text-xs font-semibold ml-1 ${textMuted}`}>
                      {allDone ? "Done!" : `${attemptsLeft} left`}
                    </span>
                  </div>
                  {hasPlayed && (
                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${textMuted}`}>Best:</span>
                      <span className="text-xs font-bold" style={{ color: "#CD7F32" }}>{dailyState.bestScore}</span>
                    </div>
                  )}
                </div>
                {/* Right: CTA */}
                <span className="text-sm font-bold shrink-0 mr-2" style={{ color: "#CD7F32" }}>
                  {allDone ? "View leaderboard →" : hasPlayed ? "Play again →" : "Play now →"}
                </span>
              </div>
            </Link>
          );
        })()}

        {/* Story Mode — Coming Soon */}
        <div className="relative rounded-2xl overflow-hidden border-[3px] cursor-default select-none min-w-0" style={{ borderColor: "rgba(190, 18, 60, 0.5)", background: light ? "linear-gradient(135deg, rgba(190, 18, 60, 0.08) 0%, rgba(190, 18, 60, 0.15) 50%, rgba(190, 18, 60, 0.08) 100%)" : "linear-gradient(135deg, rgba(190, 18, 60, 0.2) 0%, rgba(190, 18, 60, 0.1) 50%, rgba(15, 23, 42, 0.6) 100%)", boxShadow: "0 6px 24px rgba(190, 18, 60, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "#BE123C" }} />
          <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-2 sm:mb-3">
              <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[22px] flex items-center justify-center overflow-visible mx-auto sm:mx-0" style={{ background: "linear-gradient(145deg, #E11D48 0%, #BE123C 40%, #9F1239 100%)", boxShadow: "0 6px 16px rgba(220, 38, 38, 0.45), inset 0 2px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(255,255,255,0.15)", transform: "rotate(-3deg)" }}>
                <InkAvatar config={{ base: "droplet_04", color: "#BE123C", eyes: "eyes_02", accessory: "crown_01", aura: "none" }} size={48} className="drop-shadow-lg" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h3 className="font-extrabold text-base sm:text-lg" style={{ color: "#BE123C" }}>Story Mode</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white whitespace-nowrap" style={{ backgroundColor: "#9F1239", boxShadow: "0 2px 6px rgba(159, 18, 57, 0.4)" }}>Coming Soon</span>
                </div>
                <p className={`text-xs font-medium mt-1 ${textMuted}`}>Chapters · Boss battles · Exclusive loot</p>
              </div>
            </div>
            <p className={`text-xs sm:text-sm font-medium flex-1 ${textMuted} text-center sm:text-left`}>A narrative adventure through the world of words. Defeat vocab villains!</p>
          </div>
        </div>

        {/* Classroom Mode */}
        <Link href="/play/classroom" className="block relative">
          <div className={`rounded-xl p-6 ${cardBg} border ${cardBorder} transition-all duration-200 h-full relative overflow-visible ${!light ? "hover:border-[#0EA5E9]/40 hover:shadow-[0_20px_56px_rgba(14,165,233,0.12)]" : "hover:border-[#0EA5E9]/40"}`}>
            <div className="absolute -top-3 -right-2 opacity-90 pointer-events-none" style={{ transform: "rotate(10deg)" }}>
              <InkAvatar config={{ base: "droplet_01", color: "#38BDF8", eyes: "eyes_03", accessory: "quill_01", aura: "none" }} size={64} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="w-5 h-5 shrink-0" color="#0EA5E9" />
              <h3 className={`${text} font-bold text-lg`}>Classroom</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white" style={{ backgroundColor: "#0EA5E9" }}>
                Alpha
              </span>
            </div>
            <p className={`${textMuted} text-sm mb-4`}>Host a live class battle royale. Up to 30 players per room.</p>
            <span className="text-sm font-bold" style={{ color: "#0EA5E9" }}>Create or join lobby →</span>
          </div>
        </Link>
      </section>

      {/* ── Quick nav row ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-6 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-5 gap-2">
          {[
            { href: "/shop", label: "Shop", Icon: InkDropIcon, color: MINT, tutorialId: "shop" },
            { href: "/locker", label: "Locker", Icon: LockOpenIcon, color: BLUE, tutorialId: "locker" },
            { href: "/ranked", label: "Ranks", Icon: BarChartIcon, color: MINT, tutorialId: "leaderboard" },
            { href: user ? "/friends" : "/auth/signup", label: "Friends", Icon: UsersIcon, color: "#8B5CF6", tutorialId: "friends" },
            { href: user ? "/profile" : "/auth/signup", label: user ? "Profile" : "Join", Icon: UserIcon, color: BLUE, tutorialId: "profile" },
          ].map((link) => (
            <Link key={link.href + link.label} href={link.href} className="block" data-tutorial-id={link.tutorialId}>
              <div className={`rounded-xl py-3 px-2 ${cardBg} border ${cardBorder} text-center transition-colors hover:border-opacity-60`}>
                <link.Icon className="w-5 h-5 mx-auto mb-1" color={link.color} />
                <p className={`${text} text-[11px] font-semibold`}>{link.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className={`relative z-10 mt-auto text-center py-5 text-sm ${textFaint} font-medium border-t ${cardBorder}`} style={!light ? { borderColor: "rgba(255,255,255,0.06)" } : undefined}>
        Lexicon League · Season 1
      </footer>

      <HomeTutorialOverlay
        open={showTutorial}
        light={light}
        onFinish={handleTutorialFinish}
      />
    </main>
  );
}
