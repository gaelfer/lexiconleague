"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Subject, GameResult, InkAvatarConfig, DEFAULT_AVATAR_CONFIG, RANK_TIERS } from "@/types";
import { getProfile, createGuestProfile } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  OpponentInfo,
  generateBotOpponent,
  generateBotScore,
  generateMatchSeed,
  MATCHMAKING_TIMEOUT_MS,
} from "@/lib/matchmaking";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import InkAvatar from "@/components/InkAvatar";
import RankBadge from "@/components/RankBadge";
import ProgressBar from "@/components/ProgressBar";
import TrophyIcon from "@/components/icons/TrophyIcon";
import BookIcon from "@/components/icons/BookIcon";
import PencilIcon from "@/components/icons/PencilIcon";
import { getTierProgress, getTrophiesNeededForNextTier, calculateScore } from "@/lib/rank";

type Phase = "lobby" | "searching" | "prematch" | "playing" | "results";

const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

export default function RankedPage() {
  const { user, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [subject, setSubject] = useState<Subject>("vocabulary");
  const [result, setResult] = useState<GameResult | null>(null);
  const [profile, setProfile] = useState(getProfile() ?? createGuestProfile());
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [matchSeed, setMatchSeed] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [searchDots, setSearchDots] = useState("");
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = "/auth/signup?from=ranked";
      return;
    }
    const p = getProfile() ?? createGuestProfile();
    setProfile(p);
    const goldTierIdx = RANK_TIERS.indexOf("Gold");
    const playerTierIdx = RANK_TIERS.indexOf(p.rank_tier);
    if (playerTierIdx >= goldTierIdx) {
      setSubject(Math.random() > 0.5 ? "vocabulary" : "punctuation");
    } else {
      setSubject("vocabulary");
    }
  }, [user, authLoading]);

  // Search dots animation
  useEffect(() => {
    if (phase !== "searching") return;
    const interval = setInterval(() => {
      setSearchDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

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
    const bot = generateBotOpponent(profile.rank_tier);
    const seed = generateMatchSeed();
    setOpponent(bot);
    setMatchSeed(seed);
    cleanupChannel();
    setPhase("prematch");
  }

  function handleComplete(r: GameResult) {
    setResult(r);

    if (opponent && !opponent.isBot && channelRef.current && user) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "game-score",
          payload: { userId: user.id, score: r.score },
        });
      } catch {}
    }

    if (opponent?.isBot) {
      const botResult = generateBotScore(profile.rank_tier);
      setOpponentScore(calculateScore(botResult.correct));
    }

    setPhase("results");
  }

  function handlePlayAgain() {
    cleanupChannel();
    matchedRef.current = false;
    const fresh = getProfile() ?? createGuestProfile();
    setProfile(fresh);
    setResult(null);
    setOpponent(null);
    setOpponentScore(null);
    setMatchSeed("");
    setPhase("lobby");
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#64748B] font-semibold animate-pulse">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  // ── Playing ─────────────────────────────────────────────────────────────────
  if (phase === "playing") {
    return <GameScreen mode="ranked" subject={subject} onComplete={handleComplete} />;
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    return (
      <div>
        {/* Opponent comparison banner */}
        {opponent && (
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-4">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <InkAvatar config={profile.avatar_config} size="sm" />
                <div>
                  <p className="text-xs font-bold text-[#64748B]">You</p>
                  <p className="text-lg font-extrabold text-[#0F172A]">{result.score}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#64748B] uppercase">vs</p>
                {opponentScore !== null ? (
                  <p className={`text-sm font-extrabold ${
                    result.score > opponentScore
                      ? "text-[#22C55E]"
                      : result.score < opponentScore
                      ? "text-[#EF4444]"
                      : "text-[#64748B]"
                  }`}>
                    {result.score > opponentScore
                      ? "You win!"
                      : result.score < opponentScore
                      ? "You lose!"
                      : "Tie!"}
                  </p>
                ) : (
                  <p className="text-xs text-[#64748B] animate-pulse">Waiting...</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-[#64748B]">
                    {opponent.username}
                    {opponent.isBot && <span className="text-[10px] ml-1 text-[#94A3B8]">BOT</span>}
                  </p>
                  <p className="text-lg font-extrabold text-[#0F172A]">
                    {opponentScore !== null ? opponentScore : "..."}
                  </p>
                </div>
                <InkAvatar config={opponent.avatar_config} size="sm" />
              </div>
            </div>
          </div>
        )}
        <ResultsScreen result={result} onPlayAgain={handlePlayAgain} />
      </div>
    );
  }

  // ── Searching ───────────────────────────────────────────────────────────────
  if (phase === "searching") {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="relative">
            <div className="w-32 h-32 mx-auto rounded-full border-4 border-[#E2E8F0] border-t-[#34D399] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <InkAvatar config={profile.avatar_config} size="lg" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#0F172A]">
              Searching for opponent{searchDots}
            </h2>
            <p className="text-[#64748B] font-medium mt-2">
              Finding a worthy challenger in {profile.rank_tier}
            </p>
          </div>
          <button
            onClick={() => { cleanupChannel(); setPhase("lobby"); }}
            className="px-6 py-3 rounded-2xl text-[#64748B] font-bold border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
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
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg space-y-8">
          <div className="flex items-center justify-between gap-4">
            {/* Player */}
            <div className="flex-1 flex flex-col items-center gap-3 animate-slide-in-left">
              <div className="rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 shadow-lg w-full flex flex-col items-center">
                <InkAvatar config={profile.avatar_config} size="lg" />
                <p className="mt-3 text-sm font-extrabold text-[#0F172A] truncate max-w-full">
                  {profile.username}
                </p>
                <RankBadge tier={profile.rank_tier} size="sm" />
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#EF4444] flex items-center justify-center shadow-xl">
                <span className="text-white font-extrabold text-xl">VS</span>
              </div>
              <div className="w-14 h-14 rounded-full bg-[#0F172A] flex items-center justify-center shadow-lg">
                <span className="text-white font-extrabold text-2xl">{countdown}</span>
              </div>
            </div>

            {/* Opponent */}
            <div className="flex-1 flex flex-col items-center gap-3 animate-slide-in-right">
              <div className="rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 shadow-lg w-full flex flex-col items-center">
                <InkAvatar config={opponent.avatar_config} size="lg" />
                <p className="mt-3 text-sm font-extrabold text-[#0F172A] truncate max-w-full">
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
            <p className="text-[#64748B] font-bold text-sm uppercase tracking-wider">
              Match starting in {countdown}...
            </p>
            <p className="text-[#0F172A] font-medium text-sm mt-1">
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
  const winTrophies =
    profile.rank_tier === "Bronze"
      ? 20
      : profile.rank_tier === "Silver"
      ? 18
      : profile.rank_tier === "Gold"
      ? 16
      : 14;
  const lossTrophies =
    profile.rank_tier === "Bronze"
      ? 10
      : profile.rank_tier === "Silver"
      ? 12
      : profile.rank_tier === "Gold"
      ? 14
      : 16;

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="absolute top-5 left-5 text-[#64748B] hover:text-[#0F172A] text-sm font-bold transition-colors flex items-center gap-1"
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

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ECFDF5] border border-[#34D399]/50 text-sm font-bold text-[#059669] mb-4">
            <TrophyIcon className="w-4 h-4" color="#34D399" />
            Ranked Mode
          </div>
          <h1 className="text-4xl font-extrabold text-[#0F172A] mb-2">
            Enter the Ladder
          </h1>
          <p className="text-[#64748B] font-medium">
            Trophies on the line. Every answer matters!
          </p>
        </div>

        {/* Your avatar card */}
        <div className="rounded-3xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg">
          <div className="flex items-center gap-5">
            <InkAvatar config={profile.avatar_config} size="lg" />
            <div className="flex-1">
              <p className="text-[#0F172A] font-extrabold text-lg">
                {profile.username}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <RankBadge tier={profile.rank_tier} size="sm" />
                <span className="text-[#64748B] text-sm font-bold">
                  {profile.trophies} trophies
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar
                  value={tierProgress}
                  height="h-2.5"
                  color={
                    profile.rank_tier === "Gold"
                      ? "#D4AF37"
                      : profile.rank_tier === "Silver"
                      ? "#C0C0C0"
                      : profile.rank_tier === "Platinum"
                      ? "#7DD3FC"
                      : profile.rank_tier === "Diamond"
                      ? "#A78BFA"
                      : "#CD7F32"
                  }
                />
                <p className="text-[#64748B] text-[10px] font-semibold mt-1">
                  {tierProgress}% through {profile.rank_tier}
                  {tierIdx < RANK_TIERS.length - 1 &&
                    ` · ${RANK_TIERS[tierIdx + 1]} at ${
                      getTrophiesNeededForNextTier(profile.rank_tier) ?? ""
                    }`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Match info */}
        <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-[#E2E8F0] shadow-md">
          <p className="text-[#0F172A] font-bold text-sm mb-3">This match</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-[#64748B]">
              {subject === "vocabulary" ? (
                <BookIcon className="w-4 h-4" color="#3B82F6" />
              ) : (
                <PencilIcon className="w-4 h-4" color="#34D399" />
              )}
              <span>
                {isGoldPlus ? `Subject: ${subject}` : "Vocabulary only"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#5B5B7B]">
              <span className="font-bold">60s</span>
              <span>sprint</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#22C55E] font-bold">
                Win: +{winTrophies}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold">
                Loss: -{lossTrophies}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={startSearch}
          className="w-full py-4 rounded-2xl font-extrabold text-lg text-white bg-[#34D399] hover:bg-[#10B981] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <TrophyIcon className="w-6 h-6" color="white" />
          Find Match
        </button>

        <p className="text-center text-[#64748B] text-xs font-semibold">
          Online matchmaking · Bot fallback if no opponent found
        </p>
      </div>
    </main>
  );
}
