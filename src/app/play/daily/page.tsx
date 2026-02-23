"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameResult, Question } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, createGuestProfile, INITIAL_PROFILE } from "@/lib/user/storage";
import { syncCurrentProfile } from "@/lib/user/profile-sync";
import GameScreen from "@/components/GameScreen";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import LogoIcon from "@/components/icons/LogoIcon";
import {
  getDailySeed,
  getDailyQuestions,
  getDailyChallengeTopicAndGrade,
  DAILY_CHALLENGE_MAX_ATTEMPTS,
  DAILY_CHALLENGE_QUESTION_COUNT,
  DAILY_CHALLENGE_DURATION,
  DAILY_COMPLETION_BONUS,
} from "@/lib/game/daily-challenge";
import {
  getDailyChallengeState,
  canAttemptDailyChallenge,
  recordDailyChallengeAttempt,
  applyDailyChallengeRewards,
  DailyChallengeState,
} from "@/lib/user/daily-challenge-storage";
import { saveDailyChallengeScore } from "@/lib/supabase/daily-challenge";
import { BLUE, MINT, SURFACE, BRONZE, AMBER } from "@/lib/design-tokens";

type Phase = "lobby" | "playing" | "results";

function BackIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TrophySmallIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}

function StarBadgeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function DailyChallengePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { light } = useTheme();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [challengeState, setChallengeState] = useState<DailyChallengeState>(() =>
    typeof window !== "undefined" ? getDailyChallengeState() : { date: "", attempts: 0, bestScore: 0, bestCorrect: 0, rewarded: false }
  );
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

  const seed = getDailySeed();
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const attemptsLeft = DAILY_CHALLENGE_MAX_ATTEMPTS - challengeState.attempts;
  const { topic, grade } = getDailyChallengeTopicAndGrade();

  // Theming
  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-[#94A3B8]";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const headerBtn = light ? "bg-[#F1F5F9] border-[#E2E8F0]" : "bg-white/5 border-white/10";

  useEffect(() => {
    const p = getProfile() ?? createGuestProfile();
    setProfile(p);
    setChallengeState(getDailyChallengeState());
  }, []);

  useEffect(() => {
    const onUpdate = () => setProfile(getProfile() ?? createGuestProfile());
    window.addEventListener("ll-profile-updated", onUpdate);
    return () => window.removeEventListener("ll-profile-updated", onUpdate);
  }, []);

  function handlePlay() {
    if (!canAttemptDailyChallenge()) return;
    setActiveQuestions(getDailyQuestions());
    setPhase("playing");
  }

  async function handleGameComplete(result: GameResult) {
    const { isNewBest: newBest, state: newState } = recordDailyChallengeAttempt(result.score, result.correct);
    setLastResult(result);
    setIsNewBest(newBest);
    setChallengeState(newState);

    // Award flat completion bonus on first attempt of the day
    let bonusGiven = false;
    if (!newState.rewarded || (newState.attempts === 1 && !challengeState.rewarded)) {
      applyDailyChallengeRewards();
      bonusGiven = true;
    }
    setBonusAwarded(bonusGiven);

    // Persist leaderboard score for authenticated users
    if (user) {
      const currentProfile = getProfile() ?? profile;
      await saveDailyChallengeScore(
        user.id,
        seed,
        newBest ? result.score : newState.bestScore,
        newBest ? result.correct : newState.bestCorrect,
        newState.attempts,
        currentProfile.username,
        currentProfile.avatar_config
      );
      await syncCurrentProfile(user.id).catch(() => null);
    }

    setPhase("results");
  }

  function handleRetry() {
    if (!canAttemptDailyChallenge()) return;
    setActiveQuestions(getDailyQuestions());
    setPhase("playing");
  }

  if (phase === "playing") {
    return (
      <GameScreen
        mode="casual"
        subject="vocabulary"
        questionsOverride={activeQuestions}
        onComplete={handleGameComplete}
        playerAvatarConfig={profile.avatar_config}
        gameDuration={DAILY_CHALLENGE_DURATION}
      />
    );
  }

  return (
    <main
      className={`relative min-h-[100dvh] flex flex-col overflow-x-hidden ${bg}`}
      style={!light ? { background: SURFACE } : undefined}
    >
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {light ? (
          <>
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-30 blur-3xl" style={{ background: `radial-gradient(circle, ${BLUE}40 0%, transparent 70%)` }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#F8FAFC_40%,#F8FAFC_100%)]" />
          </>
        ) : (
          <>
            <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${BLUE} 0%, transparent 65%)`, transform: "translate(20%, -50%)" }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${SURFACE} 0%, #0c1524 50%, #0a0f1a 100%)` }} />
          </>
        )}
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => router.back()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${headerBtn} border transition-colors hover:opacity-80`}
            aria-label="Go back"
          >
            <BackIcon className={`w-5 h-5 ${text}`} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${headerBtn} border overflow-hidden p-0.5`}>
              <LogoIcon className="w-full h-full" />
            </div>
            <span className={`text-base font-bold ${text}`}>
              Lexicon<span style={{ color: BLUE }}>League</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center px-4 pb-12 pt-4 max-w-lg mx-auto w-full gap-6">

        {/* Title */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${light ? "bg-amber-50" : ""}`}
              style={{ background: !light ? "rgba(205, 127, 50, 0.2)" : undefined, color: light ? "#92400E" : BRONZE }}
            >
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className={`text-sm font-semibold uppercase tracking-widest ${textMuted}`}>Daily Challenge</span>
          </div>
          <h1 className={`text-3xl font-bold ${text}`}>{dateLabel}</h1>
          <p className={`text-sm mt-2 ${textMuted}`}>
            <span className="font-semibold" style={{ color: BRONZE }}>Topic:</span> {topic} · <span className="font-semibold" style={{ color: BRONZE }}>Grade:</span> {grade}
          </p>
        </div>

        {/* Results card */}
        {phase === "results" && lastResult && (
          <div
            className={`w-full rounded-2xl border overflow-visible relative ${cardBg}`}
            style={{ borderColor: light ? "rgba(205, 127, 50, 0.35)" : "rgba(205, 127, 50, 0.4)" }}
          >
            {/* Decorative inkling — top right */}
            <div className="absolute -top-3 right-4 pointer-events-none z-10" style={{ transform: "rotate(10deg)" }}>
              <InkAvatar
                config={{ base: "droplet_03", color: AMBER, eyes: "eyes_06", accessory: "crown_01", aura: "aura_glow_01" }}
                size={64}
              />
            </div>
            {/* Score banner */}
            <div className="flex flex-col items-center gap-1 py-7 px-6" style={{ background: light ? `linear-gradient(135deg, rgba(205,127,50,0.12), ${MINT}15)` : `linear-gradient(135deg, rgba(205,127,50,0.2), ${MINT}10)` }}>
              {isNewBest && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mb-2" style={{ background: `${MINT}20`, color: MINT }}>
                  <StarBadgeIcon className="w-3.5 h-3.5" />
                  New Personal Best!
                </span>
              )}
              <p className={`text-sm font-semibold ${textMuted}`}>Your score</p>
              <p className="text-5xl font-black" style={{ color: BLUE }}>{lastResult.score}</p>
              <p className={`text-sm ${textMuted}`}>{lastResult.correct} correct · {Math.round(lastResult.accuracy)}% accuracy</p>
            </div>

            <div className={`px-6 py-5 flex flex-col gap-4 border-t ${cardBorder}`}>
              {/* Best score row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrophySmallIcon className={`w-4 h-4 ${textMuted}`} />
                  <span className={`text-sm font-semibold ${textMuted}`}>Today&apos;s best</span>
                </div>
                <span className={`text-sm font-bold ${text}`}>{challengeState.bestScore}</span>
              </div>

              {/* Rewards row — only on first completion */}
              {bonusAwarded && (
                <div className={`rounded-xl px-4 py-3 flex items-center justify-between`} style={{ background: light ? `${MINT}15` : `${MINT}12` }}>
                  <div className="flex items-center gap-2">
                    <SparkIcon className="w-4 h-4" color={MINT} />
                    <span className="text-sm font-bold" style={{ color: MINT }}>Completion bonus</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <InkDropIcon className="w-3.5 h-3.5" color={MINT} />
                      <span className="text-sm font-bold" style={{ color: MINT }}>+{DAILY_COMPLETION_BONUS.drops}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SparkIcon className="w-3.5 h-3.5" color="#A78BFA" />
                      <span className="text-sm font-bold" style={{ color: "#A78BFA" }}>+{DAILY_COMPLETION_BONUS.xp} XP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Attempts remaining */}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textMuted}`}>Attempts used</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: DAILY_CHALLENGE_MAX_ATTEMPTS }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: i < challengeState.attempts ? BRONZE : light ? "#E2E8F0" : "#334155" }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={`px-6 pb-6 flex flex-col gap-3 border-t ${cardBorder} pt-5`}>
              {attemptsLeft > 0 ? (
                <button
                  onClick={handleRetry}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: BRONZE }}
                >
                  Try Again ({attemptsLeft} attempt{attemptsLeft > 1 ? "s" : ""} left)
                </button>
              ) : (
                <div className={`w-full py-3.5 rounded-xl text-center text-sm font-semibold ${textMuted} ${light ? "bg-[#F1F5F9]" : "bg-white/5"}`}>
                  No more attempts today
                </div>
              )}
              <Link
                href="/daily-leaderboard"
                className={`w-full py-3.5 rounded-xl text-center text-sm font-bold transition-colors ${light ? "border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A]" : "border border-white/10 hover:bg-white/5 text-white"}`}
              >
                View Leaderboard
              </Link>
              <Link
                href="/dashboard"
                className={`w-full py-3 text-center text-sm font-semibold ${textMuted} hover:underline`}
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Lobby card */}
        {phase === "lobby" && (
          <div
            className={`w-full rounded-2xl border ${cardBg} relative overflow-visible`}
            style={{ borderColor: light ? "rgba(205, 127, 50, 0.35)" : "rgba(205, 127, 50, 0.45)" }}
          >
            {/* Decorative inkling — top right */}
            <div className="absolute -top-3 right-4 pointer-events-none z-10" style={{ transform: "rotate(10deg)" }}>
              <InkAvatar
                config={{ base: "droplet_03", color: AMBER, eyes: "eyes_06", accessory: "crown_01", aura: "aura_glow_01" }}
                size={72}
              />
            </div>
            {/* Player info */}
            <div className="flex items-center gap-4 px-6 py-5 rounded-t-2xl overflow-hidden">
              <InkAvatar config={profile.avatar_config} size="md" />
              <div className="flex-1 min-w-0">
                <p className={`font-bold ${text} truncate`}>{profile.username}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <InkDropIcon className="w-3.5 h-3.5 shrink-0" color={MINT} />
                  <span className="text-sm font-semibold" style={{ color: MINT }}>{profile.ink_drops ?? 0} Ink Drops</span>
                </div>
              </div>
            </div>

            <div className={`border-t ${cardBorder} px-6 py-5 flex flex-col gap-4`}>
              {/* Challenge info */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`rounded-xl py-3 px-2 ${light ? "bg-amber-50/80" : ""}`} style={!light ? { background: "rgba(205, 127, 50, 0.12)" } : undefined}>
                  <p className="text-xl font-black" style={{ color: BRONZE }}>{DAILY_CHALLENGE_QUESTION_COUNT}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>Questions</p>
                </div>
                <div className={`rounded-xl py-3 px-2 ${light ? "bg-amber-50/80" : ""}`} style={!light ? { background: "rgba(205, 127, 50, 0.12)" } : undefined}>
                  <p className="text-xl font-black" style={{ color: BRONZE }}>{DAILY_CHALLENGE_DURATION}s</p>
                  <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>Timer</p>
                </div>
                <div className={`rounded-xl py-3 px-2 ${light ? "bg-amber-50/80" : ""}`} style={!light ? { background: "rgba(205, 127, 50, 0.12)" } : undefined}>
                  <p className="text-xl font-black" style={{ color: BRONZE }}>{attemptsLeft}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>Left today</p>
                </div>
              </div>

              {/* Best score */}
              {challengeState.attempts > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrophySmallIcon className={`w-4 h-4 ${textMuted}`} />
                    <span className={`text-sm font-semibold ${textMuted}`}>Your best</span>
                  </div>
                  <span className={`text-sm font-bold ${text}`}>{challengeState.bestScore}</span>
                </div>
              )}

              {/* Attempts tracker */}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textMuted}`}>Attempts</span>
                <div className="flex items-center gap-1.5">
              {Array.from({ length: DAILY_CHALLENGE_MAX_ATTEMPTS }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full transition-colors"
                  style={{ background: i < challengeState.attempts ? BRONZE : light ? "#E2E8F0" : "#334155" }}
                />
              ))}
                </div>
              </div>

              {/* Rewards info — only shown if not rewarded yet */}
              {!challengeState.rewarded && (
                <div className={`rounded-xl px-4 py-3`} style={{ background: light ? `${MINT}12` : `${MINT}10` }}>
                  <p className="text-xs font-bold mb-1" style={{ color: MINT }}>First completion reward</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <InkDropIcon className="w-3.5 h-3.5" color={MINT} />
                      <span className="text-xs font-semibold" style={{ color: MINT }}>+{DAILY_COMPLETION_BONUS.drops} bonus drops</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SparkIcon className="w-3.5 h-3.5" color="#A78BFA" />
                      <span className="text-xs font-semibold" style={{ color: "#A78BFA" }}>+{DAILY_COMPLETION_BONUS.xp} XP</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`px-6 pb-6 flex flex-col gap-3 border-t ${cardBorder} pt-5 rounded-b-2xl overflow-hidden`}>
              {attemptsLeft > 0 ? (
                <button
                  onClick={handlePlay}
                  className="w-full py-4 rounded-xl text-white font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: BRONZE }}
                >
                  {challengeState.attempts === 0 ? "Start Challenge" : "Play Again"}
                </button>
              ) : (
                <div className={`w-full py-4 rounded-xl text-center font-semibold ${textMuted} ${light ? "bg-[#F1F5F9]" : "bg-white/5"}`}>
                  Come back tomorrow for a new challenge!
                </div>
              )}
              <Link
                href="/daily-leaderboard"
                className={`w-full py-3.5 rounded-xl text-center text-sm font-bold transition-colors ${light ? "border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A]" : "border border-white/10 hover:bg-white/5 text-white"}`}
              >
                View Today&apos;s Leaderboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
