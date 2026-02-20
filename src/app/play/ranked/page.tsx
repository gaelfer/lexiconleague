"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Subject, GameResult, InkAvatarConfig, DEFAULT_AVATAR_CONFIG, RANK_TIERS, RANK_COLORS } from "@/types";
import { getProfile, createGuestProfile } from "@/lib/user/storage";
import { syncProfileForUser, syncCurrentProfile } from "@/lib/user/profile-sync";
import { useAuth } from "@/context/AuthContext";
import { useParty } from "@/context/PartyContext";
import { createClient } from "@/lib/supabase/client";
import {
  OpponentInfo,
  generateBotOpponent,
  generateBotScore,
  generateMatchSeed,
  MATCHMAKING_TIMEOUT_MS,
} from "@/lib/game/matchmaking";
import { useTheme } from "@/context/ThemeContext";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import InkAvatar from "@/components/InkAvatar";
import RankBadge from "@/components/RankBadge";
import TrophyIcon from "@/components/icons/TrophyIcon";
import FlameIcon from "@/components/icons/FlameIcon";
import BookIcon from "@/components/icons/BookIcon";
import PencilIcon from "@/components/icons/PencilIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import { getTierProgress, getTrophiesToNextTier, getTierFromTrophies, calculateScore, TROPHY_WIN, TROPHY_LOSS, getWinStreakMultiplier } from "@/lib/game/rank";
import { getVocabGradeForRanked, PLACEMENT_VOCAB_GRADE } from "@/lib/game/questions";

type Phase = "lobby" | "searching" | "prematch" | "playing" | "results";

const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

const BLUE = "#3B82F6";
const MINT = "#34D399";

export default function RankedPage() {
  const { user, loading: authLoading } = useAuth();
  const { light } = useTheme();
  const { members, canPlayRanked } = useParty();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [subject, setSubject] = useState<Subject>("vocabulary");
  const [result, setResult] = useState<GameResult | null>(null);
  const [resultMetadata, setResultMetadata] = useState<import("@/types").GameResultMetadata | undefined>(undefined);
  const [profile, setProfile] = useState(getProfile() ?? createGuestProfile());
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [matchSeed, setMatchSeed] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [searchDots, setSearchDots] = useState("");
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState<number | null>(null);
  const botResultRef = useRef<{ correct: number; total: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchedRef = useRef(false);
  const isPlacementMatchRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = "/auth/signup?from=ranked";
      return;
    }
    async function load() {
      const synced = await syncProfileForUser(user!.id, user!.email ?? "");
      setProfile(synced);
      const goldTierIdx = RANK_TIERS.indexOf("Gold");
      const playerTierIdx = RANK_TIERS.indexOf(synced.rank_tier);
      if (playerTierIdx >= goldTierIdx) {
        setSubject(Math.random() > 0.5 ? "vocabulary" : "punctuation");
      } else {
        setSubject("vocabulary");
      }
    }
    load();
  }, [user, authLoading]);

  // Search dots animation
  useEffect(() => {
    if (phase !== "searching") return;
    const interval = setInterval(() => {
      setSearchDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  // Reset opponent progress when starting a new game
  useEffect(() => {
    if (phase === "playing") {
      setOpponentAnswered(null);
      setOpponentScore(null);
    }
  }, [phase]);

  // Simulate bot progress during ranked match — questions answered over time toward pre-computed final
  useEffect(() => {
    if (phase !== "playing" || !opponent?.isBot) return;
    const bot = botResultRef.current;
    if (!bot) return;
    const { correct: finalCorrect, total: finalTotal } = bot;
    const totalTime = 60_000;
    const tickMs = 1400;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += tickMs;
      const progress = Math.min(1, elapsed / totalTime);
      const answered = Math.round(progress * finalTotal);
      const correctSoFar = finalTotal > 0 ? Math.round((answered / finalTotal) * finalCorrect) : 0;
      setOpponentAnswered(Math.min(answered, finalTotal));
      setOpponentScore(Math.min(correctSoFar, finalCorrect) * 10);
    }, tickMs);
    return () => clearInterval(interval);
  }, [phase, opponent?.isBot]);

  // Prematch countdown
  useEffect(() => {
    if (phase !== "prematch") return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase("playing");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      try {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
      } catch {}
      channelRef.current = null;
    }
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupChannel();
  }, [cleanupChannel]);

  function startSearch() {
    if (!canPlayRanked) return;
    matchedRef.current = false;
    setPhase("searching");

    if (!isSupabaseConfigured || !user) {
      searchTimerRef.current = setTimeout(() => {
        matchWithBot();
      }, 3000);
      return;
    }

    try {
      const supabase = createClient();

      const channel = supabase.channel("ranked-matchmaking", {
        config: { presence: { key: user.id } },
      });

      channelRef.current = channel;

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const players = Object.entries(state).filter(
          ([key]) => key !== user.id
        );

        if (players.length > 0 && !matchedRef.current) {
          matchedRef.current = true;
          const [opId, opData] = players[0];
          const opInfo = (opData as any[])[0];

          const seed = generateMatchSeed();

          channel.send({
            type: "broadcast",
            event: "match-found",
            payload: {
              from: user.id,
              to: opId,
              seed,
              player: {
                id: user.id,
                username: profile.username,
                rank_tier: profile.rank_tier,
                avatar_config: profile.avatar_config,
              },
            },
          });

          const opp: OpponentInfo = {
            id: opId,
            username: opInfo?.username ?? "Opponent",
            rank_tier: opInfo?.rank_tier ?? profile.rank_tier,
            avatar_config: opInfo?.avatar_config ?? DEFAULT_AVATAR_CONFIG,
            isBot: false,
          };

          isPlacementMatchRef.current = !(getProfile() ?? createGuestProfile()).placement_completed;
          setMatchSeed(seed);
          setOpponent(opp);
          if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
          setPhase("prematch");
        }
      });

      channel.on("broadcast", { event: "match-found" }, (msg: any) => {
        const payload = msg.payload;
        if (payload.to === user.id && !matchedRef.current) {
          matchedRef.current = true;
          const opp: OpponentInfo = {
            id: payload.from,
            username: payload.player?.username ?? "Opponent",
            rank_tier: payload.player?.rank_tier ?? profile.rank_tier,
            avatar_config: payload.player?.avatar_config ?? DEFAULT_AVATAR_CONFIG,
            isBot: false,
          };
          isPlacementMatchRef.current = !(getProfile() ?? createGuestProfile()).placement_completed;
          setMatchSeed(payload.seed);
          setOpponent(opp);
          if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
          setPhase("prematch");
        }
      });

      channel.on("broadcast", { event: "game-score" }, (msg: any) => {
        if (msg.payload.userId !== user.id) {
          setOpponentScore(msg.payload.score);
        }
      });

      channel.on("broadcast", { event: "game-progress" }, (msg: any) => {
        if (msg.payload.userId !== user.id) {
          setOpponentAnswered(msg.payload.answered ?? 0);
          setOpponentScore(msg.payload.score ?? null);
        }
      });

      channel.subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            username: profile.username,
            rank_tier: profile.rank_tier,
            avatar_config: profile.avatar_config,
          });
        }
      });

      searchTimerRef.current = setTimeout(() => {
        matchWithBot();
      }, MATCHMAKING_TIMEOUT_MS);
    } catch {
      searchTimerRef.current = setTimeout(() => {
        matchWithBot();
      }, 3000);
    }
  }

  function matchWithBot() {
    isPlacementMatchRef.current = !profile.placement_completed;
    const bot = generateBotOpponent(profile.rank_tier);
    const botResult = generateBotScore(profile.rank_tier);
    botResultRef.current = { correct: botResult.correct, total: botResult.total };
    const seed = generateMatchSeed();
    setOpponent(bot);
    setMatchSeed(seed);
    cleanupChannel();
    setPhase("prematch");
  }

  async function handleComplete(r: GameResult, metadata?: import("@/types").GameResultMetadata) {
    setResult(r);
    setResultMetadata(metadata);
    const updated = getProfile();
    if (updated) setProfile(updated);

    if (opponent && !opponent.isBot && channelRef.current && user) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "game-score",
          payload: { userId: user.id, score: r.score },
        });
      } catch {}
    }

    // Do NOT snap opponentScore to the pre-computed value here — keep whatever
    // the live simulation had reached so the results screen is consistent with
    // the in-game display.
    setPhase("results");
    if (user && updated) {
      try {
        await syncCurrentProfile(user.id);
      } catch {
        // Sync failed; local state is correct, Supabase will catch up on next load
      }
    }
  }

  function handlePlayAgain() {
    cleanupChannel();
    matchedRef.current = false;
    botResultRef.current = null;
    const fresh = getProfile() ?? createGuestProfile();
    setProfile(fresh);
    setResult(null);
    setResultMetadata(undefined);
    setOpponent(null);
    setOpponentScore(null);
    setOpponentAnswered(null);
    setMatchSeed("");
    setPhase("lobby");
  }

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";

  if (authLoading) {
    return (
      <main className={`min-h-screen flex items-center justify-center ${bg}`}>
        <p className={`font-semibold animate-pulse ${textMuted}`}>Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  // ── Playing ─────────────────────────────────────────────────────────────────
  if (phase === "playing") {
    const handleAnswerProgress = (answered: number, score: number) => {
      if (opponent && !opponent.isBot && channelRef.current && user) {
        try {
          channelRef.current.send({
            type: "broadcast",
            event: "game-progress",
            payload: { userId: user.id, answered, score },
          });
        } catch {}
      }
    };
    // For win/loss determination use the live simulated score, not the
    // pre-computed target. This keeps the result consistent with what the
    // player saw on screen during the match.
    const getOpponentScore = () => opponentScore;
    const isPlacement = !profile.placement_completed;
    const rankedVocabGrade =
      subject === "vocabulary"
        ? isPlacement
          ? PLACEMENT_VOCAB_GRADE
          : getVocabGradeForRanked(profile.placement_vocab_grade, getTierFromTrophies(profile.trophies), profile.trophies)
        : undefined;
    return (
      <GameScreen
        mode="ranked"
        subject={subject}
        onComplete={handleComplete}
        onAnswerProgress={handleAnswerProgress}
        opponentAnswered={opponentAnswered}
        opponentScore={opponentScore}
        opponent={opponent}
        playerAvatarConfig={profile.avatar_config}
        getOpponentScore={getOpponentScore}
        vocabGrade={rankedVocabGrade}
      />
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    // Use the live state value so it always matches what was shown during play.
    const finalOpponentScore = opponentScore;
    return (
      <div>
        {/* Opponent comparison banner */}
        {opponent && (
          <div className={`${light ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#1E293B] border-white/10"} border-b px-3 sm:px-4 py-3 sm:py-4 overflow-x-hidden`}>
            <div className="max-w-md mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-3">
                <InkAvatar config={profile.avatar_config} size="sm" />
                <div>
                  <p className={`text-xs font-bold ${textMuted}`}>You</p>
                  <p className={`text-lg font-extrabold ${text}`}>{result.score}</p>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-xs font-bold ${textMuted} uppercase`}>vs</p>
                {finalOpponentScore !== null && finalOpponentScore !== undefined ? (
                  <p className={`text-sm font-extrabold ${
                    result.score > finalOpponentScore
                      ? "text-[#22C55E]"
                      : result.score < finalOpponentScore
                      ? "text-[#EF4444]"
                      : "text-[#64748B]"
                  }`}>
                    {result.score > finalOpponentScore
                      ? "You win!"
                      : result.score < finalOpponentScore
                      ? "You lose!"
                      : "Tie!"}
                  </p>
                ) : (
                  <p className="text-xs text-[#64748B] animate-pulse">Waiting...</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-xs font-bold ${textMuted}`}>
                    {opponent.username}
                    {opponent.isBot && <span className="text-[10px] ml-1 opacity-70">BOT</span>}
                  </p>
                  <p className={`text-lg font-extrabold ${text}`}>
                    {finalOpponentScore !== null && finalOpponentScore !== undefined ? finalOpponentScore : "..."}
                  </p>
                </div>
                <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...opponent.avatar_config }} size="sm" />
              </div>
            </div>
          </div>
        )}
        <ResultsScreen
          result={result}
          onPlayAgain={handlePlayAgain}
          placementGrade={isPlacementMatchRef.current ? (getProfile()?.placement_vocab_grade) : undefined}
          metadata={resultMetadata}
        />
      </div>
    );
  }

  // ── Searching ───────────────────────────────────────────────────────────────
  if (phase === "searching") {
    return (
      <main className={`min-h-screen ${bg} flex flex-col items-center justify-center px-6`}>
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="relative">
            <div className={`w-32 h-32 mx-auto rounded-full border-4 ${light ? "border-[#E2E8F0]" : "border-white/20"} border-t-[#34D399] animate-spin`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <InkAvatar config={profile.avatar_config} size="lg" />
            </div>
          </div>
          <div>
            <h2 className={`text-2xl font-extrabold ${text}`}>
              Searching for opponent{searchDots}
            </h2>
            <p className={`${textMuted} font-medium mt-2`}>
              Finding a worthy challenger in {profile.rank_tier}
            </p>
          </div>
          <button
            onClick={() => { cleanupChannel(); setPhase("lobby"); }}
            className={`px-6 py-3 rounded-2xl font-bold border transition-colors ${light ? "text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]" : "text-white/60 border-white/20 hover:bg-white/5"}`}
          >
            Cancel
          </button>
        </div>
      </main>
    );
  }

  // ── Pre-match VS screen ─────────────────────────────────────────────────────
  if (phase === "prematch" && opponent) {
    return (
      <main className={`min-h-[100dvh] min-h-screen ${bg} flex flex-col items-center justify-center px-4 sm:px-6 py-6 overflow-x-hidden`}>
        <div className="w-full max-w-lg space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-4">
            {/* Player */}
            <div className="flex-1 flex flex-col items-center gap-3 animate-slide-in-left w-full sm:min-w-0 min-w-0">
              <div className={`rounded-3xl ${cardBg} border ${cardBorder} p-4 sm:p-6 shadow-lg w-full flex flex-col items-center min-w-0`}>
                <InkAvatar config={profile.avatar_config} size="lg" />
                <p className={`mt-3 text-sm font-extrabold truncate max-w-full w-full text-center ${text}`}>
                  {profile.username}
                </p>
                <RankBadge tier={profile.rank_tier} size="sm" />
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-xl" style={{ backgroundColor: MINT }}>
                <span className="text-white font-extrabold text-lg sm:text-xl">VS</span>
              </div>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg ${light ? "bg-[#0F172A]" : "bg-[#1E293B]"}`}>
                <span className="text-white font-extrabold text-xl sm:text-2xl">{countdown}</span>
              </div>
            </div>

            {/* Opponent */}
            <div className="flex-1 flex flex-col items-center gap-3 animate-slide-in-right w-full sm:min-w-0 min-w-0">
              <div className={`rounded-3xl ${cardBg} border ${cardBorder} p-4 sm:p-6 shadow-lg w-full flex flex-col items-center min-w-0`}>
                <InkAvatar config={opponent.avatar_config} size="lg" />
                <p className={`mt-3 text-sm font-extrabold truncate max-w-full w-full text-center ${text}`}>
                  {opponent.username}
                  {opponent.isBot && (
                    <span className="text-[10px] ml-1 text-[#94A3B8] font-medium">BOT</span>
                  )}
                </p>
                <RankBadge tier={opponent.rank_tier} size="sm" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className={`${textMuted} font-bold text-sm uppercase tracking-wider`}>
              Match starting in {countdown}...
            </p>
            <p className={`${text} font-medium text-sm mt-1`}>
              {subject === "vocabulary" ? "Vocabulary Sprint" : "Punctuation Sprint"} · 60 seconds
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Lobby ───────────────────────────────────────────────────────────────────
  const tierIdx = RANK_TIERS.indexOf(profile.rank_tier);
  const isGoldPlus = tierIdx >= RANK_TIERS.indexOf("Gold");
  const tierProgress = getTierProgress(profile.trophies, profile.rank_tier);
  const currentStreak = profile.ranked_win_streak ?? 0;
  const streakMultiplier = getWinStreakMultiplier(currentStreak);
  const winTrophies = Math.round(TROPHY_WIN[profile.rank_tier] * streakMultiplier);
  const lossTrophies = Math.abs(TROPHY_LOSS[profile.rank_tier]);
  // Streak milestone thresholds for progress display
  const STREAK_MILESTONES = [0, 3, 5, 7, 10];
  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak) ?? 10;
  const prevMilestone = [...STREAK_MILESTONES].reverse().find((m) => m <= currentStreak) ?? 0;
  const streakProgress = nextMilestone === prevMilestone ? 100 : ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  return (
    <main className={`min-h-screen ${bg} flex flex-col items-center justify-center px-6`}>
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <Link
          href="/"
          className={`text-sm font-bold transition-colors flex items-center gap-1 ${textMuted} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}
        >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 ${light ? "bg-[#ECFDF5] border border-[#34D399]/50 text-[#059669]" : "bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399]"}`}>
            <TrophyIcon className="w-4 h-4" color={MINT} />
            Ranked Mode
          </div>
          <h1 className={`text-4xl font-extrabold mb-2 ${text}`}>
            Enter the Ladder
          </h1>
          <p className={`font-medium ${textMuted}`}>
            Trophies on the line. Every answer matters!
          </p>
        </div>

        {/* Your avatar card */}
        <div className={`rounded-3xl p-6 ${cardBg} border ${cardBorder} shadow-lg`}>
          <div className="flex items-center gap-5">
            <InkAvatar config={profile.avatar_config} size="lg" />
            <div className="flex-1">
              <p className={`font-extrabold text-lg ${text}`}>
                {profile.username}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <RankBadge tier={profile.rank_tier} size="sm" />
                <span className={`text-sm font-bold ${textMuted}`}>
                  {profile.trophies} trophies
                </span>
              </div>
              <div className="mt-4">
                <div className={`flex justify-between text-sm font-bold mb-2 ${text}`}>
                  <span>{profile.rank_tier} → {tierIdx < RANK_TIERS.length - 1 ? RANK_TIERS[tierIdx + 1] : "Max"}</span>
                  <span style={{ color: RANK_COLORS[profile.rank_tier] }}>{tierProgress}%</span>
                </div>
                <div className={`w-full h-5 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${tierProgress}%`,
                      backgroundColor: RANK_COLORS[profile.rank_tier],
                      boxShadow: `0 0 14px ${RANK_COLORS[profile.rank_tier]}80`,
                    }}
                  />
                </div>
                {(() => {
                  const toNext = getTrophiesToNextTier(profile.trophies);
                  return toNext ? (
                    <p className={`text-xs font-semibold mt-2 ${textMuted}`}>
                      {toNext.needed} trophies to {toNext.nextTier}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>

        {!profile.placement_completed && (
          <div className={`rounded-xl p-4 ${light ? "bg-[#DBEAFE] border-[#3B82F6]/30" : "bg-[#3B82F6]/15 border-[#3B82F6]/30"} border`}>
            <p className={`text-sm font-bold ${text}`}>Placement Match</p>
            <p className={`text-xs ${textMuted} mt-1`}>Play vs a bot to determine your question difficulty. Younger and older players compete fairly!</p>
          </div>
        )}

        {/* Match info */}
        <div className={`rounded-2xl p-4 ${cardBg} border ${cardBorder} shadow-md`}>
          <p className={`font-bold text-sm mb-3 ${text}`}>{profile.placement_completed ? "This match" : "Placement"}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`flex items-center gap-2 ${textMuted}`}>
              {subject === "vocabulary" ? (
                <BookIcon className="w-4 h-4" color="#3B82F6" />
              ) : (
                <PencilIcon className="w-4 h-4" color="#34D399" />
              )}
              <span>
                {isGoldPlus ? `Subject: ${subject}` : "Vocabulary only"}
              </span>
            </div>
            <div className={`flex items-center gap-2 ${textMuted}`}>
              <span className="font-bold">60s</span>
              <span>sprint</span>
            </div>
            {profile.placement_completed && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[#22C55E] font-bold flex items-center gap-1">
                    Win: +{winTrophies}
                    {currentStreak > 0 && (
                      <FlameIcon className="w-3.5 h-3.5 inline" color="#F59E0B" />
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">
                    Loss: {TROPHY_LOSS[profile.rank_tier]}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {!canPlayRanked && (
          <div className={`rounded-xl p-4 ${light ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/30"}`}>
            <p className={`text-sm font-bold ${text}`}>Leave your party to play ranked</p>
            <p className={`text-xs ${textMuted} mt-1`}>Parties are not allowed in ranked. Clear your party ({members.length} members) to queue.</p>
          </div>
        )}

        {/* Win streak card — always visible so players know the mechanic */}
        <div
          className={`rounded-2xl p-4 border-2 ${
            currentStreak > 0
              ? light ? "bg-amber-50 border-amber-300" : "bg-amber-500/10 border-amber-500/40"
              : light ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#1E293B] border-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FlameIcon className="w-5 h-5" color={currentStreak > 0 ? "#F59E0B" : (light ? "#CBD5E1" : "#475569")} />
              <span
                className="font-extrabold"
                style={{ color: currentStreak > 0 ? "#D97706" : (light ? "#94A3B8" : "#64748B") }}
              >
                {currentStreak > 0 ? `${currentStreak} Win Streak` : "No Streak Yet"}
              </span>
            </div>
            <span
              className="font-extrabold text-sm px-2 py-0.5 rounded-lg"
              style={{
                color: currentStreak > 0 ? "#D97706" : (light ? "#94A3B8" : "#64748B"),
                backgroundColor: currentStreak > 0 ? "rgba(245,158,11,0.15)" : "transparent",
              }}
            >
              {currentStreak > 0
                ? `${streakMultiplier === 1 ? "1×" : streakMultiplier.toFixed(1)}× trophies`
                : "Win to start"}
            </span>
          </div>
          {/* Progress bar to next milestone */}
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
            <p className={`text-[10px] mt-2 font-semibold ${light ? "text-[#94A3B8]" : "text-white/30"}`}>
              Consecutive ranked wins multiply your trophy gains — up to 3× at 10 wins
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={startSearch}
            disabled={!canPlayRanked}
            className="flex-1 py-4 rounded-2xl font-extrabold text-lg text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{ backgroundColor: MINT }}
          >
            <TrophyIcon className="w-6 h-6" color="white" />
            Find Match
          </button>
        </div>

        <p className={`text-center text-xs font-semibold ${textMuted}`}>
          Online matchmaking · Bot fallback if no opponent found
        </p>
      </div>
    </main>
  );
}
