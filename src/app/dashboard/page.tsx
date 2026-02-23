"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { getLevelProgress, getLevel } from "@/lib/user/levels";
import { canClaimDailyReward } from "@/lib/user/daily-rewards";
import { DEFAULT_AVATAR_CONFIG, RANK_COLORS } from "@/types";
import type { InkAvatarConfig } from "@/types";
import { getDailySeed, DAILY_CHALLENGE_MAX_ATTEMPTS, getDailyChallengeTopicAndGrade } from "@/lib/game/daily-challenge";
import { getDailyChallengeState, DailyChallengeState } from "@/lib/user/daily-challenge-storage";
import { getTeacherPortalStatus, listClassmates, listStudentClasses, requestClassJoin } from "@/lib/supabase/teacher-portal";
import type { Classmate, StudentClass } from "@/types";
import PartyWidget from "@/components/PartyWidget";

import { BLUE, MINT, CARD, SURFACE } from "@/lib/design-tokens";

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

export default function HomePage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}

function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { light } = useTheme();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const [dailyState, setDailyState] = useState<DailyChallengeState>({ date: "", attempts: 0, bestScore: 0, bestCorrect: 0, rewarded: false });
  const [teacherApproved, setTeacherApproved] = useState(false);
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [classmatesByClass, setClassmatesByClass] = useState<Record<string, Classmate[]>>({});
  const [classCodeInput, setClassCodeInput] = useState("");
  const [classCodeRequesting, setClassCodeRequesting] = useState(false);
  const [classCodeMessage, setClassCodeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    let cancelled = false;
    if (!user) {
      setTeacherApproved(false);
      setStudentClasses([]);
      setClassmatesByClass({});
      return;
    }

    getTeacherPortalStatus().then((result) => {
      if (cancelled) return;
      setTeacherApproved(Boolean(result.status?.account_type === "teacher" && result.status.teacher_approved));
    });

    listStudentClasses().then((res) => {
      if (cancelled) return;
      if (res.success && res.rows.length > 0) {
        setStudentClasses(res.rows);
        res.rows.forEach((c) => {
          listClassmates(c.id).then((m) => {
            if (cancelled) return;
            if (m.success) setClassmatesByClass((prev) => ({ ...prev, [c.id]: m.rows }));
          });
        });
      } else {
        setStudentClasses([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  async function handleClassCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !classCodeInput.trim() || classCodeRequesting) return;
    setClassCodeRequesting(true);
    setClassCodeMessage(null);
    const res = await requestClassJoin(classCodeInput.trim().toUpperCase());
    setClassCodeRequesting(false);
    if (res.success) {
      setClassCodeInput("");
      if (res.alreadyMember) setClassCodeMessage({ type: "success", text: "You're already in this class." });
      else if (res.pending) setClassCodeMessage({ type: "success", text: "Request sent! Your teacher will approve." });
      else setClassCodeMessage({ type: "success", text: "Joined!" });
      void listStudentClasses().then((r) => r.success && setStudentClasses(r.rows));
    } else {
      setClassCodeMessage({ type: "error", text: res.error ?? "Could not request" });
    }
    setTimeout(() => setClassCodeMessage(null), 4000);
  }

  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const textFaint = light ? "text-[#94A3B8]" : "text-[#475569]";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const cardShadow = light ? "shadow-lg shadow-slate-200/50" : "shadow-xl shadow-black/20";
  const menuBg = light ? "bg-white" : "bg-[#1E293B]";
  const menuBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const headerBtn = light ? "bg-[#F1F5F9] border-[#E2E8F0]" : "bg-white/5 border-white/10";

  return (
    <main className={`relative min-h-[100dvh] flex flex-col overflow-x-hidden ${bg}`} style={!light ? { background: SURFACE } : undefined}>
      {/* Background — immersive, layered */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {light ? (
          <>
            <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #E0F2FE 0%, #F0FDF4 35%, #FEF3C7 70%, #F8FAFC 100%)" }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-40 blur-[100px]" style={{ background: `radial-gradient(ellipse, ${BLUE}40 0%, transparent 70%)` }} />
            <div className="absolute top-1/3 -left-32 w-96 h-96 opacity-30 blur-[80px]" style={{ background: `radial-gradient(circle, ${MINT}50 0%, transparent 70%)` }} />
            <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] opacity-25 blur-[60px]" style={{ background: `radial-gradient(circle, #F59E0B40 0%, transparent 70%)` }} />
            <svg className="absolute bottom-0 left-0 w-full h-32 opacity-10" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path fill={BLUE} d="M0 120 Q300 0 600 60 T1200 120 V120 H0 Z" />
            </svg>
          </>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${SURFACE} 0%, #0f172a 40%, #020617 100%)` }} />
            <div className="absolute top-0 right-0 w-[600px] h-[500px] opacity-30 blur-[120px]" style={{ background: `radial-gradient(ellipse, ${BLUE} 0%, transparent 60%)` }} />
            <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] opacity-20 blur-[80px]" style={{ background: `radial-gradient(circle, ${MINT} 0%, transparent 65%)` }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-10 blur-[100px]" style={{ background: `radial-gradient(ellipse, #8B5CF6 0%, transparent 70%)` }} />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
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
                            ...(teacherApproved
                              ? [{ href: "/teacher", label: "Teacher Portal", icon: <BookIcon className="w-5 h-5 shrink-0" color="currentColor" /> }]
                              : []),
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
                  <Link href="/auth/login" className={`px-4 py-2.5 text-sm font-bold ${textMuted} transition-colors ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}>
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

      {/* ── class_requested success banner ── */}
      {user && searchParams.get("class_requested") === "1" && (
        <div className="relative z-10 px-4 sm:px-6 pt-2 max-w-6xl mx-auto w-full">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold shadow-lg shadow-emerald-500/10" style={{ borderRadius: "1rem 0.5rem 1rem 0.5rem" }}>
            Request sent! Your teacher will approve and add you to the class.
          </div>
        </div>
      )}

      {/* ── Top strip: season ── */}
      <section className="relative z-10 px-4 sm:px-6 pt-2 pb-2 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 p-1.5 rounded-2xl" style={{ transform: "rotate(-6deg)", background: light ? "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(52,211,153,0.1) 100%)" : "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(52,211,153,0.15) 100%)", boxShadow: "0 4px 12px rgba(59,130,246,0.2)" }}>
            <LogoIcon className="w-10 h-10" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ fontFamily: "system-ui, sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)", lineHeight: 1 }}>1</div>
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${textFaint}`}>Season 1</p>
            <p className={`text-sm font-bold ${textMuted} leading-tight`}>Vocabulary & punctuation. 60 seconds.</p>
          </div>
        </div>
      </section>

      {/* ── Bento layout ── */}
      <div className="relative z-10 px-4 sm:px-6 pb-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">

          {/* ── Profile Hub ── */}
          {profile ? (
            <div className="lg:col-span-12">
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push(user ? "/profile" : "/auth/signup")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(user ? "/profile" : "/auth/signup"); } }}
                className={`block cursor-pointer relative overflow-visible border transition-all duration-300 hover:scale-[1.005] ${cardBorder} ${cardShadow}`}
                style={{
                  borderRadius: "2rem 0.5rem 2rem 0.5rem",
                  background: light
                    ? `linear-gradient(135deg, ${tierColor}18 0%, ${tierColor}08 45%, #ffffff 100%)`
                    : `linear-gradient(135deg, ${tierColor}28 0%, ${tierColor}0e 50%, ${CARD} 100%)`,
                }}
              >
                  {/* Subtle shine overlay */}
                  <div className="absolute inset-0 pointer-events-none rounded-[2rem_0.5rem_2rem_0.5rem] overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.04]" style={{ background: "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.8) 50%, transparent 80%)" }} />
                  </div>

                  {/* Decorative inklings */}
                  <div className="absolute -top-1 left-6 opacity-40 pointer-events-none" style={{ transform: "rotate(-12deg)" }}>
                    <InkAvatar config={{ base: "droplet_02", color: "#8B5CF6", eyes: "eyes_01", accessory: "none", aura: "none" }} size={44} />
                  </div>
                  <div className="absolute top-2 right-8 opacity-35 pointer-events-none" style={{ transform: "rotate(8deg)" }}>
                    <InkAvatar config={{ base: "droplet_01", color: "#22C55E", eyes: "eyes_03", accessory: "bow_01", aura: "none" }} size={40} />
                  </div>
                  <div className="absolute bottom-4 left-12 opacity-40 pointer-events-none" style={{ transform: "rotate(-5deg)" }}>
                    <InkAvatar config={{ base: "droplet_01", color: "#F97316", eyes: "eyes_04", accessory: "scarf_01", aura: "none" }} size={48} />
                  </div>
                  <div className="absolute bottom-2 right-16 opacity-35 pointer-events-none" style={{ transform: "rotate(10deg)" }}>
                    <InkAvatar config={{ base: "droplet_02", color: "#06B6D4", eyes: "eyes_01", accessory: "none", aura: "none" }} size={42} />
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                      {/* Avatar with enhanced rank ring — container matches InkAvatar lg (120px) for proper centering */}
                      <div className="shrink-0 relative flex items-center justify-center">
                        <div
                          className="w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center"
                          style={{
                            boxShadow: `0 0 0 3px ${tierColor}70, 0 0 0 6px ${tierColor}25, 0 8px 28px ${tierColor}40`,
                          }}
                        >
                          <InkAvatar config={profile.avatar_config} size="lg" />
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left min-w-0">
                        {/* Name + badge */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                          <p className={`font-bold text-xl ${text} truncate`}>{profile.username}</p>
                          <RankBadge tier={displayTier} trophies={profile.trophies} showTrophies size="sm" />
                        </div>

                        {/* Stat chips */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                          <div
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border"
                            style={{
                              color: BLUE,
                              borderColor: light ? `${BLUE}30` : `${BLUE}45`,
                              background: light ? `${BLUE}12` : `${BLUE}18`,
                            }}
                          >
                            <SparkIcon className="w-3.5 h-3.5" color={BLUE} />
                            Lv. {getLevel(profile.xp)}
                          </div>
                          <div
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border"
                            style={{
                              color: MINT,
                              borderColor: light ? `${MINT}30` : `${MINT}45`,
                              background: light ? `${MINT}12` : `${MINT}18`,
                            }}
                          >
                            <InkDropIcon className="w-3.5 h-3.5" color={MINT} />
                            {profile.ink_drops.toLocaleString()}
                          </div>
                          {canClaimDailyReward(profile) && (
                            <Link
                              href="/shop"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-white"
                              style={{ backgroundColor: MINT }}
                              data-tutorial-id="daily-reward"
                            >
                              <InkDropIcon className="w-3 h-3" color="white" /> Daily ready
                            </Link>
                          )}
                        </div>

                        {/* Progress bars */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link href={user ? "/ranked" : "/auth/signup"} onClick={(e) => e.stopPropagation()} className="flex-1 min-w-0 group">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className={`font-semibold ${textMuted}`}>{displayTier} · {trophiesInTier} trophies</span>
                              {(() => { const t = getTrophiesToNextTier(profile.trophies); return t ? <span className={textFaint}>{t.needed} to {t.nextTier} →</span> : null; })()}
                            </div>
                            <div className={`h-2.5 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${tierProgress}%`,
                                  background: `linear-gradient(90deg, ${tierColor} 0%, ${tierColor}cc 100%)`,
                                  boxShadow: `0 0 10px ${tierColor}60`,
                                }}
                              ></div>
                            </div>
                          </Link>
                          {levelProgress && levelProgress.xpNeededForLevel > 0 ? (
                            <Link href="/levels" onClick={(e) => e.stopPropagation()} className="flex-1 min-w-0 group">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className={`font-semibold ${textMuted}`}>Level {levelProgress.level}</span>
                                <span className={textFaint}>{levelProgress.xpInLevel + "/" + levelProgress.xpNeededForLevel} XP →</span>
                              </div>
                              <div className={`h-2.5 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${levelProgress.progressPercent}%`,
                                    background: `linear-gradient(90deg, ${BLUE} 0%, #60A5FA 100%)`,
                                    boxShadow: `0 0 10px ${BLUE}60`,
                                  }}
                                ></div>
                              </div>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          ) : null}

          {/* ── Section divider ── */}
          <div className="lg:col-span-12 flex items-center gap-3 -mt-1">
            <div className={`h-px flex-1 ${light ? "bg-[#E2E8F0]" : "bg-white/8"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${textFaint} select-none`}>Choose a Mode</span>
            <div className={`h-px flex-1 ${light ? "bg-[#E2E8F0]" : "bg-white/8"}`} />
          </div>

          {/* ── Casual ── */}
          <Link href="/play/casual" className="lg:col-span-6 block relative group" data-tutorial-id="casual">
            <div
              className="h-full min-h-[156px] border transition-all duration-300 relative overflow-visible group-hover:scale-[1.02] group-hover:-rotate-0.5 group-hover:border-[#3B82F6]/55 group-hover:shadow-[0_20px_56px_rgba(59,130,246,0.22)]"
              style={{
                borderRadius: "1.5rem 0.25rem 1.5rem 0.25rem",
                borderColor: light ? "#E2E8F0" : "rgba(255,255,255,0.09)",
                background: light
                  ? "linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 75%, #F8FAFC 100%)"
                  : "linear-gradient(145deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.08) 60%, rgba(15,23,42,0.88) 100%)",
                boxShadow: light ? "0 4px 20px rgba(59,130,246,0.07), 0 1px 3px rgba(0,0,0,0.04)" : "0 4px 20px rgba(0,0,0,0.28)",
              }}
            >
              <div className="absolute -bottom-2 -left-2 opacity-40 pointer-events-none" style={{ transform: "rotate(-10deg)" }}>
                <InkAvatar config={{ base: "droplet_04", color: "#06B6D4", eyes: "eyes_08", accessory: "none", aura: "none" }} size={56} />
              </div>
              <div className="absolute -top-3 -right-2 opacity-90 pointer-events-none" style={{ transform: "rotate(12deg)" }}>
                <InkAvatar config={{ base: "droplet_01", color: BLUE, eyes: "eyes_03", accessory: "glasses_01", aura: "none" }} size={64} />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: light ? `${BLUE}20` : `${BLUE}28` }}
                  >
                    <BookIcon className="w-4 h-4 shrink-0" color={BLUE} />
                  </div>
                  <h3 className={`${text} font-bold text-xl`}>Casual</h3>
                </div>
                <p className={`${textMuted} text-sm mb-4 leading-relaxed`}>Vocabulary or punctuation. 60 seconds. No rank impact.</p>
                <span
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white transition-opacity group-hover:opacity-90"
                  style={{ background: BLUE }}
                >
                  Play now →
                </span>
              </div>
            </div>
          </Link>

          {/* ── Ranked ── */}
          <Link href={user ? "/ranked" : "/auth/signup?from=ranked"} className="lg:col-span-6 block relative group" data-tutorial-id="ranked">
            <div
              className="h-full min-h-[156px] border transition-all duration-300 relative overflow-visible group-hover:scale-[1.02] group-hover:rotate-0.5 group-hover:border-[#34D399]/55 group-hover:shadow-[0_20px_56px_rgba(52,211,153,0.22)]"
              style={{
                borderRadius: "0.25rem 1.5rem 0.25rem 1.5rem",
                borderColor: light ? "#E2E8F0" : "rgba(255,255,255,0.09)",
                background: light
                  ? "linear-gradient(145deg, #ECFDF5 0%, #D1FAE5 75%, #F8FAFC 100%)"
                  : "linear-gradient(145deg, rgba(52,211,153,0.2) 0%, rgba(52,211,153,0.08) 60%, rgba(15,23,42,0.88) 100%)",
                boxShadow: light ? "0 4px 20px rgba(52,211,153,0.07), 0 1px 3px rgba(0,0,0,0.04)" : "0 4px 20px rgba(0,0,0,0.28)",
              }}
            >
              <div className="absolute -bottom-2 -right-1 opacity-40 pointer-events-none" style={{ transform: "rotate(15deg)" }}>
                <InkAvatar config={{ base: "droplet_05", color: "#EAB308", eyes: "eyes_01", accessory: "tophat_01", aura: "none" }} size={56} />
              </div>
              <div className="absolute -top-3 -right-2 opacity-90 pointer-events-none" style={{ transform: "rotate(12deg)" }}>
                <InkAvatar config={{ base: "droplet_02", color: "#22C55E", eyes: "eyes_02", accessory: "crown_01", aura: "aura_glow_01" }} size={64} />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: light ? `${MINT}22` : `${MINT}28` }}
                  >
                    <TrophyIcon className="w-4 h-4 shrink-0" color={MINT} />
                  </div>
                  <h3 className={`${text} font-bold text-xl`}>Ranked</h3>
                </div>
                <p className={`${textMuted} text-sm mb-4 leading-relaxed`}>Earn trophies. Climb Bronze to Emerald.</p>
                <span
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white transition-opacity group-hover:opacity-90"
                  style={{ background: MINT }}
                >
                  {user ? "Leaderboard & play →" : "Sign up to play →"}
                </span>
              </div>
            </div>
          </Link>

          {/* ── Class code | Party | Daily Challenge (one row on desktop, stacked on tablet portrait) ── */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
            {/* Class code */}
            {user && (
              <div
                className={`rounded-xl p-4 ${cardBg} border ${cardBorder} ${cardShadow} min-w-0 overflow-hidden`}
                style={{ borderRadius: "0.6rem 1rem 0.6rem 1rem" }}
              >
                <p className={`text-xs font-bold ${textMuted} uppercase tracking-wide mb-2`}>Class code</p>
                <form onSubmit={handleClassCodeSubmit} className="flex gap-2">
                  <input
                    value={classCodeInput}
                    onChange={(e) => { setClassCodeInput(e.target.value.toUpperCase()); setClassCodeMessage(null); }}
                    placeholder="ABC123"
                    maxLength={8}
                    className={`flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm font-mono ${light ? "border-[#E2E8F0] bg-white text-[#0F172A]" : "border-white/10 bg-white/5 text-white"}`}
                  />
                  <button
                    type="submit"
                    disabled={classCodeRequesting || classCodeInput.trim().length < 4}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-white bg-[#0EA5E9] disabled:opacity-50 shrink-0"
                  >
                    {classCodeRequesting ? "…" : "Join"}
                  </button>
                </form>
                {classCodeMessage && (
                  <p className={`text-xs mt-1.5 font-semibold ${classCodeMessage.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {classCodeMessage.text}
                  </p>
                )}
              </div>
            )}

            {/* Party */}
            {user && (
              <div
                className={`rounded-xl p-4 ${cardBg} border ${cardBorder} ${cardShadow} min-w-0 overflow-hidden`}
                style={{ borderRadius: "0.6rem 1rem 0.6rem 1rem" }}
              >
                <PartyWidget embedded />
              </div>
            )}

            {/* Daily Challenge — date/topic deferred to avoid hydration mismatch */}
            {(() => {
              if (!mounted) {
                return (
                  <Link href="/play/daily" className={`block relative group min-w-0 ${user ? "" : "md:col-span-3"}`}>
                    <div
                      className={`h-full min-h-[100px] rounded-xl border transition-all duration-300 relative ${cardShadow}`}
                      style={{
                        borderRadius: "0.6rem 1rem 0.6rem 1rem",
                        borderColor: light ? "rgba(205,127,50,0.25)" : "rgba(205,127,50,0.3)",
                        background: light
                          ? "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FFFBEB 100%)"
                          : "linear-gradient(135deg, rgba(205,127,50,0.18) 0%, rgba(205,127,50,0.08) 55%, rgba(15,23,42,0.9) 100%)",
                      }}
                    >
                      <div className="p-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg shrink-0 bg-amber-200/50" />
                        <div className="flex-1 min-w-0">
                          <div className="h-4 w-24 rounded bg-amber-200/30 animate-pulse" />
                          <div className="h-3 w-32 rounded bg-amber-200/20 animate-pulse mt-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }
              const today = new Date();
              const dateLabel = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const { topic, grade } = getDailyChallengeTopicAndGrade();
              const attemptsUsed = dailyState.date === getDailySeed() ? dailyState.attempts : 0;
              const attemptsLeft = DAILY_CHALLENGE_MAX_ATTEMPTS - attemptsUsed;
              const hasPlayed = attemptsUsed > 0;
              const allDone = attemptsLeft === 0;
              return (
                <Link href="/play/daily" className={`block relative group min-w-0 ${user ? "" : "md:col-span-3"}`}>
                  <div
                    className={`h-full min-h-[100px] rounded-xl border transition-all duration-300 relative overflow-visible group-hover:scale-[1.005] group-hover:border-[#CD7F32]/50 ${cardShadow}`}
                    style={{
                      borderRadius: "0.6rem 1rem 0.6rem 1rem",
                      borderColor: light ? "rgba(205,127,50,0.25)" : "rgba(205,127,50,0.3)",
                      background: light
                        ? "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FFFBEB 100%)"
                        : "linear-gradient(135deg, rgba(205,127,50,0.18) 0%, rgba(205,127,50,0.08) 55%, rgba(15,23,42,0.9) 100%)",
                      boxShadow: light ? "0 2px 12px rgba(205,127,50,0.08)" : "0 2px 12px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div className="absolute -top-2 -right-1 pointer-events-none z-10 opacity-80" style={{ transform: "rotate(10deg)" }}>
                      <InkAvatar config={{ base: "droplet_03", color: "#F59E0B", eyes: "eyes_06", accessory: "crown_01", aura: "aura_glow_01" }} size={40} />
                    </div>

                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 shrink-0 min-w-0 overflow-hidden">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: light ? "rgba(205,127,50,0.2)" : "rgba(205,127,50,0.25)" }}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#CD7F32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className={`${text} font-bold text-sm truncate`}>Daily Challenge</h3>
                            {!hasPlayed && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
                          </div>
                          <p className={`text-xs ${textMuted} truncate`} title={`${dateLabel} · ${grade} · ${topic}`}>
                            {dateLabel} · {grade}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-1 flex-wrap min-w-0">
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: DAILY_CHALLENGE_MAX_ATTEMPTS }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < attemptsUsed ? "#CD7F32" : light ? "#E2E8F0" : "#334155" }} />
                          ))}
                          <span className={`text-xs font-semibold ${textMuted}`}>{allDone ? "Done!" : `${attemptsLeft} left`}</span>
                        </div>
                        {hasPlayed && <span className={`text-xs font-bold`} style={{ color: "#CD7F32" }}>Best: {dailyState.bestScore}</span>}
                      </div>

                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0 transition-opacity group-hover:opacity-90"
                        style={{ background: "#CD7F32" }}
                      >
                        {allDone ? "Leaderboard →" : hasPlayed ? "Play again →" : "Play now →"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })()}
          </div>

          {/* ── Study ── */}
          <Link href="/study" className="lg:col-span-5 block relative group" data-tutorial-id="study">
            <div
              className="h-full min-h-[136px] border transition-all duration-300 relative overflow-visible group-hover:scale-[1.02] group-hover:border-[#A78BFA]/55 group-hover:shadow-[0_20px_56px_rgba(139,92,246,0.2)]"
              style={{
                borderRadius: "1.25rem 0.5rem 0.5rem 1.25rem",
                borderColor: light ? "#E2E8F0" : "rgba(255,255,255,0.09)",
                background: light
                  ? "linear-gradient(145deg, #F5F3FF 0%, #EDE9FE 75%, #F8FAFC 100%)"
                  : "linear-gradient(145deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.08) 60%, rgba(15,23,42,0.88) 100%)",
                boxShadow: light ? "0 4px 20px rgba(139,92,246,0.07), 0 1px 3px rgba(0,0,0,0.04)" : "0 4px 20px rgba(0,0,0,0.28)",
              }}
            >
              <div className="absolute -top-3 right-8 opacity-90 pointer-events-none" style={{ transform: "rotate(-8deg)" }}>
                <InkAvatar config={{ base: "droplet_03", color: "#8B5CF6", eyes: "eyes_05", accessory: "wizard_01", aura: "none" }} size={60} />
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: light ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.25)" }}
                  >
                    <SparkIcon className="w-4 h-4 shrink-0" color="#A78BFA" />
                  </div>
                  <h3 className={`${text} font-bold text-lg`}>Study</h3>
                </div>
                <p className={`${textMuted} text-sm mb-4`}>Self-paced. Pick a tier, build mastery. Spaced repetition included.</p>
                <span
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white transition-opacity group-hover:opacity-90"
                  style={{ background: "#8B5CF6" }}
                >
                  Start studying →
                </span>
              </div>
            </div>
          </Link>

          {/* ── Classroom ── */}
          <Link href={user ? "/play/classroom" : "/auth/signup?next=/play/classroom"} className="lg:col-span-4 block relative group">
            <div
              className="h-full min-h-[136px] border transition-all duration-300 relative overflow-visible group-hover:scale-[1.02] group-hover:border-[#0EA5E9]/55 group-hover:shadow-[0_20px_56px_rgba(14,165,233,0.22)]"
              style={{
                borderRadius: "0.5rem 1.25rem 1.25rem 0.5rem",
                borderColor: light ? "#E2E8F0" : "rgba(255,255,255,0.09)",
                background: light
                  ? "linear-gradient(145deg, #F0F9FF 0%, #E0F2FE 75%, #F8FAFC 100%)"
                  : "linear-gradient(145deg, rgba(14,165,233,0.2) 0%, rgba(14,165,233,0.08) 60%, rgba(15,23,42,0.88) 100%)",
                boxShadow: light ? "0 4px 20px rgba(14,165,233,0.07), 0 1px 3px rgba(0,0,0,0.04)" : "0 4px 20px rgba(0,0,0,0.28)",
              }}
            >
              <div className="absolute -top-3 -right-2 opacity-90 pointer-events-none" style={{ transform: "rotate(10deg)" }}>
                <InkAvatar config={{ base: "droplet_01", color: "#38BDF8", eyes: "eyes_03", accessory: "quill_01", aura: "none" }} size={64} />
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: light ? "rgba(14,165,233,0.15)" : "rgba(14,165,233,0.25)" }}
                  >
                    <UsersIcon className="w-4 h-4 shrink-0" color="#0EA5E9" />
                  </div>
                  <h3 className={`${text} font-bold text-lg`}>Classroom</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white" style={{ backgroundColor: "#0EA5E9" }}>Alpha</span>
                </div>
                <p className={`${textMuted} text-sm mb-4`}>Host a live class battle. Up to 30 players. Sign in required.</p>
                <span
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white transition-opacity group-hover:opacity-90"
                  style={{ background: "#0EA5E9" }}
                >
                  {user ? "Create or join →" : "Sign up →"}
                </span>
              </div>
            </div>
          </Link>

          {/* ── Story Mode (Coming Soon) ── */}
          <div
            className="lg:col-span-3 relative overflow-hidden border-[3px] cursor-default select-none min-w-0 transition-transform hover:scale-[1.01]"
            style={{
              borderRadius: "0.5rem 1.25rem 0.5rem 1.25rem",
              borderColor: "rgba(190, 18, 60, 0.5)",
              background: light
                ? "linear-gradient(135deg, rgba(190, 18, 60, 0.08) 0%, rgba(190, 18, 60, 0.15) 50%, rgba(190, 18, 60, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(190, 18, 60, 0.2) 0%, rgba(190, 18, 60, 0.1) 50%, rgba(15, 23, 42, 0.6) 100%)",
              boxShadow: "0 8px 32px rgba(190, 18, 60, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "#BE123C" }} />
            <div className="relative z-10 p-4 h-full flex flex-col min-w-0">
              <div className="flex flex-col items-center text-center">
                <div
                  className="relative shrink-0 w-14 h-14 rounded-[18px] flex items-center justify-center overflow-visible mx-auto mb-2"
                  style={{
                    background: "linear-gradient(145deg, #E11D48 0%, #BE123C 40%, #9F1239 100%)",
                    boxShadow: "0 6px 16px rgba(220, 38, 38, 0.45)",
                    transform: "rotate(-3deg)",
                  }}
                >
                  <InkAvatar config={{ base: "droplet_04", color: "#BE123C", eyes: "eyes_02", accessory: "crown_01", aura: "none" }} size={48} className="drop-shadow-lg" />
                </div>
                <h3 className="font-extrabold text-base" style={{ color: "#BE123C" }}>Story Mode</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white mt-1" style={{ backgroundColor: "#9F1239" }}>Coming Soon</span>
                <p className={`text-xs font-medium mt-2 ${textMuted}`}>Chapters · Boss battles · Exclusive loot</p>
              </div>
            </div>
          </div>

          {/* ── My Classes ── */}
          {user && studentClasses.length > 0 && (
            <div className="lg:col-span-12">
              <div className={`rounded-2xl p-5 ${cardBg} border ${cardBorder} ${cardShadow}`} style={{ borderRadius: "0.5rem 1.5rem 0.5rem 1.5rem" }}>
                <h2 className={`${text} font-bold text-base flex items-center gap-2 mb-4`}>
                  <UsersIcon className="w-5 h-5 shrink-0" color="#0EA5E9" />
                  My Classes
                </h2>
                <div className="flex flex-wrap gap-3">
                  {studentClasses.map((cls) => (
                    <div key={cls.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cardBorder} min-w-0`}>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${text} truncate`}>{cls.name}</p>
                        <p className={`text-xs ${textMuted}`}>
                          {[cls.grade_label, cls.subject].filter(Boolean).join(" · ") || "Class"} · {cls.roster_count} students
                        </p>
                      </div>
                      {(classmatesByClass[cls.id]?.length ?? 0) > 0 && (
                        <div className="flex -space-x-1.5 shrink-0">
                          {classmatesByClass[cls.id].slice(0, 5).map((m) => (
                            <InkAvatar key={m.id} config={{ ...DEFAULT_AVATAR_CONFIG, ...(m.avatar_config ?? {}) } as InkAvatarConfig} size="xs" />
                          ))}
                          {classmatesByClass[cls.id].length > 5 && <span className={`text-xs ${textMuted} self-center ml-1`}>+{classmatesByClass[cls.id].length - 5}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick nav row ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {[
            { href: "/shop", label: "Shop", Icon: InkDropIcon, color: MINT, tutorialId: "shop" },
            { href: "/locker", label: "Locker", Icon: LockOpenIcon, color: BLUE, tutorialId: "locker" },
            { href: "/ranked", label: "Ranks", Icon: BarChartIcon, color: MINT, tutorialId: "leaderboard" },
            { href: user ? "/friends" : "/auth/signup", label: "Friends", Icon: UsersIcon, color: "#8B5CF6", tutorialId: "friends" },
            { href: user ? "/profile" : "/auth/signup", label: user ? "Profile" : "Join", Icon: UserIcon, color: BLUE, tutorialId: "profile" },
          ].map((link) => (
            <Link key={link.href + link.label} href={link.href} className="block group" data-tutorial-id={link.tutorialId}>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 group-hover:scale-[1.02] ${cardBg} ${cardBorder} ${cardShadow}`}
                style={{ borderRadius: "0.6rem 0.8rem 0.6rem 0.8rem" }}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: light ? `${link.color}18` : `${link.color}22` }}
                >
                  <link.Icon className="w-3 h-3" color={link.color} />
                </div>
                <p className={`${text} text-xs font-semibold`}>{link.label}</p>
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
