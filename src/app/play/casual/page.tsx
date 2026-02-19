"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Subject, GameResult, VocabLevel, DEFAULT_AVATAR_CONFIG, InkAvatarConfig } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useParty, type PartyMember } from "@/context/PartyContext";
import { getProfile, createGuestProfile } from "@/lib/user/storage";
import { upsertProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/client";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import InkAvatar from "@/components/InkAvatar";
import BookIcon from "@/components/icons/BookIcon";
import PencilIcon from "@/components/icons/PencilIcon";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import {
  generateBotOpponent,
  generateBotOpponents,
  generateBotScore,
  generateMatchSeed,
  MATCHMAKING_TIMEOUT_MS,
} from "@/lib/game/matchmaking";
import { getSeededQuestionsForMode } from "@/lib/game/questions";
import { broadcastPartyQueue } from "@/lib/supabase/party-realtime";
import { calculateScore } from "@/lib/game/rank";
import type { OpponentInfo } from "@/lib/game/matchmaking";

const BLUE = "#3B82F6";
const MINT = "#34D399";

const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

type CasualMode = "1v1" | "3v3";
type Phase = "select" | "vocab-grade" | "searching" | "matchmaking" | "playing" | "results";

const VOCAB_LEVELS: { level: VocabLevel; label: string }[] = [
  { level: 3, label: "Grade 3" },
  { level: 4, label: "Grade 4" },
  { level: 5, label: "Grade 5" },
  { level: 6, label: "Grade 6" },
  { level: 7, label: "Grade 7" },
  { level: 8, label: "Grade 8" },
  { level: "psat", label: "PSAT" },
  { level: "sat", label: "SAT" },
];

const PREMATCH_SECONDS = 5;

export default function CasualPage() {
  const { user } = useAuth();
  const { light } = useTheme();
  const { members, isLeader, canQueue1v1, canQueue3v3, partyQueuePayload, setPartyQueuePayload } = useParty();
  const [phase, setPhase] = useState<Phase>("select");
  const [mode, setMode] = useState<CasualMode>("1v1");
  const [subject, setSubject] = useState<Subject>("vocabulary");
  const [vocabGrade, setVocabGrade] = useState<VocabLevel | undefined>(undefined);
  const [result, setResult] = useState<GameResult | null>(null);
  const [resultMetadata, setResultMetadata] = useState<import("@/types").GameResultMetadata | undefined>(undefined);
  const [prematchSeconds, setPrematchSeconds] = useState(PREMATCH_SECONDS);
  const [searchDots, setSearchDots] = useState("");
  const [playersFound, setPlayersFound] = useState(1);
  const [opponents, setOpponents] = useState<OpponentInfo[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[]>([]);
  const [opponentScores, setOpponentScores] = useState<number[]>([]);
  const [opponentAnswered, setOpponentAnswered] = useState<number[]>([]);
  const [teammateScores, setTeammateScores] = useState<number[]>([]);
  const [teammateAnswered, setTeammateAnswered] = useState<number[]>([]);
  const [matchSeed, setMatchSeed] = useState<string | null>(null);
  const partyQueueAppliedRef = useRef(false);
  const matchedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botResultsRef = useRef<{
    opponents: { correct: number; total: number }[];
    teammates: { correct: number; total: number }[];
  } | null>(null);
  const profile = getProfile() ?? createGuestProfile();

  const canQueue = mode === "1v1" ? canQueue1v1 : canQueue3v3;

  // Apply party queue payload when member receives broadcast (navigated here)
  useEffect(() => {
    if (!partyQueuePayload || phase !== "select") return;
    partyQueueAppliedRef.current = true;
    setMode(partyQueuePayload.mode);
    setSubject(partyQueuePayload.subject);
    setVocabGrade(partyQueuePayload.vocabGrade);
    setOpponents(partyQueuePayload.opponents);
    setTeamMembers(partyQueuePayload.teamMembers);
    botResultsRef.current = partyQueuePayload.botResults;
    setMatchSeed(partyQueuePayload.seed);
    const elapsed = Math.floor((Date.now() - partyQueuePayload.startedAt) / 1000);
    const syncedSeconds = Math.max(0, PREMATCH_SECONDS - elapsed);
    setPrematchSeconds(syncedSeconds);
    setPhase("matchmaking");
    setPartyQueuePayload(null);
  }, [partyQueuePayload, setPartyQueuePayload]);

  // Search dots animation
  useEffect(() => {
    if (phase !== "searching") return;
    const interval = setInterval(() => {
      setSearchDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  // 3v3 player count ticker during search
  useEffect(() => {
    if (phase !== "searching" || mode !== "3v3") return;
    setPlayersFound(1);
    const delays = [800, 1400, 1900, 2600, 3300];
    const timers = delays.map((ms, i) =>
      setTimeout(() => setPlayersFound(i + 2), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, mode]);

  // Prematch countdown (after match is found)
  useEffect(() => {
    if (phase !== "matchmaking") return;
    if (!partyQueueAppliedRef.current) {
      setPrematchSeconds(PREMATCH_SECONDS);
    }
    partyQueueAppliedRef.current = false;
    const interval = setInterval(() => {
      setPrematchSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setPhase("playing");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Reset opponent/teammate progress when starting a new game
  useEffect(() => {
    if (phase === "playing") {
      setOpponentAnswered(new Array(opponents.length).fill(0));
      setOpponentScores(new Array(opponents.length).fill(0));
      setTeammateAnswered(new Array(teamMembers.length).fill(0));
      setTeammateScores(new Array(teamMembers.length).fill(0));
    }
  }, [phase, opponents.length, teamMembers.length]);

  // Simulate bot progress during casual match (opponents + teammates for 3v3)
  useEffect(() => {
    if (phase !== "playing" || opponents.length === 0) return;
    const botResults = botResultsRef.current;
    if (!botResults) return;
    const totalTime = 60_000;
    const tickMs = 1400;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += tickMs;
      const progress = Math.min(1, elapsed / totalTime);
      const oppAnswered = botResults.opponents.map((b) =>
        Math.min(Math.round(progress * b.total), b.total)
      );
      const oppScores = botResults.opponents.map((b, i) =>
        Math.round((oppAnswered[i] / b.total) * b.correct) * 10
      );
      setOpponentAnswered(oppAnswered);
      setOpponentScores(oppScores);
      if (botResults.teammates.length > 0) {
        const tmAnswered = botResults.teammates.map((b) =>
          Math.min(Math.round(progress * b.total), b.total)
        );
        const tmScores = botResults.teammates.map((b, i) =>
          Math.round((tmAnswered[i] / b.total) * b.correct) * 10
        );
        setTeammateAnswered(tmAnswered);
        setTeammateScores(tmScores);
      }
    }, tickMs);
    return () => clearInterval(interval);
  }, [phase, opponents.length, teamMembers.length]);

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

  function handleStartVocab() {
    setSubject("vocabulary");
    setPhase("vocab-grade");
  }

  function matchWithBots(queueSubject: Subject, queueGrade: VocabLevel | undefined): { opps: OpponentInfo[]; tms: { username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[]; seed: string; botResults: typeof botResultsRef.current } {
    const tier = profile?.rank_tier ?? "Bronze";
    const seed = generateMatchSeed();
    setMatchSeed(seed);
    setSubject(queueSubject);
    setVocabGrade(queueGrade);

    let opps: OpponentInfo[];
    let tms: { username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[];

    if (mode === "1v1") {
      const bot = generateBotOpponent(tier);
      const botResult = generateBotScore(tier);
      botResultsRef.current = { opponents: [{ correct: botResult.correct, total: botResult.total }], teammates: [] };
      opps = [bot];
      tms = [];
      setOpponents(opps);
      setTeamMembers(tms);
    } else {
      const bots = generateBotOpponents(tier, 3);
      const oppResults = bots.map(() => generateBotScore(tier));
      const partyTeammates = members.slice(0, 2).map((m: PartyMember) => ({
        username: m.username,
        avatar_config: { ...DEFAULT_AVATAR_CONFIG, ...(m.avatar_config as Partial<InkAvatarConfig>) } as InkAvatarConfig,
        isBot: false,
      }));
      const botTeammates = Array.from({ length: 2 - partyTeammates.length }, () => {
        const bot = generateBotOpponent(tier);
        return { username: bot.username, avatar_config: bot.avatar_config, isBot: true };
      });
      const allTeammates = [...partyTeammates, ...botTeammates];
      const teammateResults = allTeammates.map(() => generateBotScore(tier));
      botResultsRef.current = {
        opponents: oppResults.map((r) => ({ correct: r.correct, total: r.total })),
        teammates: teammateResults.map((r) => ({ correct: r.correct, total: r.total })),
      };
      opps = bots;
      tms = allTeammates.map((t) => ({ username: t.username, avatar_config: t.avatar_config, isBot: t.isBot }));
      setOpponents(opps);
      setTeamMembers(tms);
    }

    setOpponentScores([]);
    setOpponentAnswered([]);
    setTeammateScores([]);
    setTeammateAnswered([]);
    cleanupChannel();
    setPhase("matchmaking");
    return { opps, tms, seed, botResults: botResultsRef.current };
  }

  async function startSearch(queueSubject: Subject, queueGrade: VocabLevel | undefined) {
    if (!canQueue) return;
    matchedRef.current = false;
    setSubject(queueSubject);
    setVocabGrade(queueGrade);
    setPhase("searching");

    // 3v3 skips real matchmaking — too many players needed, go straight to bots after a brief search
    if (mode === "3v3") {
      searchTimerRef.current = setTimeout(() => matchWithBots(queueSubject, queueGrade), 4000);
      return;
    }

    // 1v1: try real matchmaking via Supabase presence
    if (!isSupabaseConfigured || !user) {
      searchTimerRef.current = setTimeout(() => matchWithBots(queueSubject, queueGrade), 3000);
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel("casual-matchmaking", {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const players = Object.entries(state).filter(([key]) => key !== user.id);

      if (players.length > 0 && !matchedRef.current) {
        matchedRef.current = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [opId, opData] = players[0] as [string, any[]];
        const opInfo = opData[0];

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
        const botResult = generateBotScore(profile.rank_tier);
        botResultsRef.current = { opponents: [{ correct: botResult.correct, total: botResult.total }], teammates: [] };
        setMatchSeed(seed);
        setOpponents([opp]);
        setTeamMembers([]);
        setOpponentScores([]);
        setOpponentAnswered([]);
        setTeammateScores([]);
        setTeammateAnswered([]);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        setPhase("matchmaking");
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const botResult = generateBotScore(profile.rank_tier);
        botResultsRef.current = { opponents: [{ correct: botResult.correct, total: botResult.total }], teammates: [] };
        setMatchSeed(payload.seed);
        setOpponents([opp]);
        setTeamMembers([]);
        setOpponentScores([]);
        setOpponentAnswered([]);
        setTeammateScores([]);
        setTeammateAnswered([]);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        setPhase("matchmaking");
      }
    });

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          username: profile.username,
          rank_tier: profile.rank_tier,
          avatar_config: profile.avatar_config,
          mode,
          subject: queueSubject,
        });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        matchWithBots(queueSubject, queueGrade);
      }
    });

    searchTimerRef.current = setTimeout(() => matchWithBots(queueSubject, queueGrade), MATCHMAKING_TIMEOUT_MS);
  }

  async function doQueue(queueSubject: Subject, queueGrade: VocabLevel | undefined) {
    if (!canQueue) return;
    // For parties, the leader broadcasts the match details to members (skip real search)
    if (members.length > 0 && user) {
      const { opps, tms, seed, botResults } = matchWithBots(queueSubject, queueGrade);
      await broadcastPartyQueue(user.id, {
        mode,
        subject: queueSubject,
        vocabGrade: queueGrade,
        seed,
        startedAt: Date.now(),
        opponents: opps,
        teamMembers: tms,
        botResults: botResults!,
      });
      return;
    }
    startSearch(queueSubject, queueGrade);
  }

  function handleStartPunctuation() {
    doQueue("punctuation", undefined);
  }

  function handleStartWithGrade(level: VocabLevel) {
    doQueue("vocabulary", level);
  }

  function handleUseDefault() {
    const defaultLevel = profile?.vocab_grade ?? 8;
    doQueue("vocabulary", defaultLevel);
  }

  async function handleComplete(r: GameResult, metadata?: import("@/types").GameResultMetadata) {
    setResult(r);
    setResultMetadata(metadata);
    if (botResultsRef.current) {
      const { opponents: oppResults, teammates: tmResults } = botResultsRef.current;
      setOpponentScores(oppResults.map((b) => calculateScore(b.correct)));
      setOpponentAnswered(oppResults.map((b) => b.total));
      if (tmResults.length > 0) {
        setTeammateScores(tmResults.map((b) => calculateScore(b.correct)));
        setTeammateAnswered(tmResults.map((b) => b.total));
      }
    }
    setPhase("results");
    if (user) {
      const updated = getProfile();
      if (updated) await upsertProfile(user.id, updated);
    }
  }

  function handlePlayAgain() {
    cleanupChannel();
    matchedRef.current = false;
    setResult(null);
    setResultMetadata(undefined);
    setVocabGrade(undefined);
    setMatchSeed(null);
    setOpponents([]);
    setTeamMembers([]);
    setOpponentScores([]);
    setOpponentAnswered([]);
    setTeammateScores([]);
    setTeammateAnswered([]);
    botResultsRef.current = null;
    setPhase("select");
  }

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";

  const seededQuestions = useMemo(
    () => (matchSeed ? getSeededQuestionsForMode(subject, matchSeed, 30, vocabGrade) : undefined),
    [matchSeed, subject, vocabGrade]
  );

  if (phase === "playing" && opponents.length > 0) {
    const getOpponentScore = () => {
      const br = botResultsRef.current;
      if (!br) return null;
      if (mode === "1v1") return calculateScore(br.opponents[0].correct);
      return br.opponents.reduce((sum, o) => sum + calculateScore(o.correct), 0);
    };
    const combinedOpponentScore = mode === "1v1"
      ? opponentScores[0] ?? null
      : opponentScores.reduce((a, b) => a + b, 0);
    const combinedOpponentAnswered = mode === "1v1"
      ? opponentAnswered[0] ?? 0
      : opponentAnswered.reduce((a, b) => a + b, 0);
    return (
      <GameScreen
        mode="casual"
        subject={subject}
        onComplete={handleComplete}
        opponent={mode === "1v1" ? opponents[0] : undefined}
        opponents={mode === "3v3" ? opponents : undefined}
        teamMembers={mode === "3v3" ? teamMembers : undefined}
        teammateScores={mode === "3v3" ? teammateScores : undefined}
        opponentScore={combinedOpponentScore}
        opponentAnswered={combinedOpponentAnswered}
        playerAvatarConfig={profile?.avatar_config}
        getOpponentScore={getOpponentScore}
        vocabGrade={subject === "vocabulary" ? vocabGrade : undefined}
        questionsOverride={seededQuestions}
      />
    );
  }

  // ── Searching for opponent ──────────────────────────────────────────────────
  if (phase === "searching") {
    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col items-center justify-center px-6 overflow-x-hidden`}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="relative">
            <div className={`w-32 h-32 mx-auto rounded-full border-4 ${light ? "border-[#E2E8F0]" : "border-white/20"} border-t-[#3B82F6] animate-spin`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <InkAvatar config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig} size="lg" />
            </div>
          </div>
          <div>
            <h2 className={`text-2xl font-extrabold ${text}`}>
              Searching for {mode === "3v3" ? "players" : "opponent"}{searchDots}
            </h2>
            {mode === "3v3" ? (
              <div className="mt-3 space-y-2">
                <p className={`text-3xl font-extrabold tabular-nums ${playersFound >= 6 ? "text-[#22C55E]" : "text-[#3B82F6]"}`}>
                  {playersFound}/6
                </p>
                <p className={`${textMuted} font-medium text-sm`}>players found</p>
                <div className="flex justify-center gap-1.5 mt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i < playersFound ? "bg-[#3B82F6] scale-100" : light ? "bg-[#E2E8F0] scale-75" : "bg-[#334155] scale-75"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className={`${textMuted} font-medium mt-2`}>Finding a player to challenge</p>
            )}
          </div>
          <button
            onClick={() => { cleanupChannel(); setPhase("select"); }}
            className={`px-6 py-3 rounded-2xl font-bold border transition-colors ${light ? "text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]" : "text-white/60 border-white/20 hover:bg-white/5"}`}
          >
            Cancel
          </button>
        </div>
      </main>
    );
  }

  // ── Prematch (opponent found, countdown to start) ─────────────────────────
  if (phase === "matchmaking" && opponents.length > 0) {
    const cardBg = light ? "bg-white" : "bg-[#1E293B]";
    const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
    const avatarSize = mode === "3v3" ? "sm" as const : "lg" as const;
    const yourTeam = mode === "3v3"
      ? [
          { config: (profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig, name: profile?.username ?? "You", isBot: false },
          ...teamMembers.map((m) => ({ config: m.avatar_config, name: m.username, isBot: m.isBot ?? false })),
        ]
      : [{ config: (profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig, name: profile?.username ?? "You", isBot: false }];

    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col items-center justify-center px-4 sm:px-6 py-6 overflow-x-hidden`}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <p className="text-lg font-bold text-[#22C55E]">Match found!</p>
          </div>
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Your team */}
            <div className={`flex-1 flex flex-col items-center gap-2 rounded-2xl ${cardBg} border ${cardBorder} p-3 sm:p-4 min-w-0 animate-slide-in-left`}>
              <p className={`text-xs font-bold ${textMuted} mb-1`}>{mode === "3v3" ? "Your team" : "You"}</p>
              <div className={`flex ${mode === "3v3" ? "gap-1 sm:gap-2 justify-center" : "justify-center"}`}>
                {yourTeam.map((p, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...p.config }} size={avatarSize} className="ring-2 ring-[#1E293B] rounded-full shrink-0" />
                    <p className={`text-[10px] sm:text-xs font-extrabold truncate max-w-[50px] mt-1 ${text}`}>
                      {p.name}{p.isBot && " BOT"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* VS + countdown */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: mode === "3v3" ? MINT : BLUE }}>
                <span className="text-white font-extrabold text-sm sm:text-base">VS</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${text}`}>{prematchSeconds}s</p>
            </div>
            {/* Opponents */}
            <div className={`flex-1 flex flex-col items-center gap-2 rounded-2xl ${cardBg} border ${cardBorder} p-3 sm:p-4 min-w-0 animate-slide-in-right`}>
              <p className={`text-xs font-bold ${textMuted} mb-1`}>{mode === "3v3" ? "Their team" : "Opponent"}</p>
              <div className={`flex ${mode === "3v3" ? "gap-1 sm:gap-2 justify-center" : "justify-center"}`}>
                {opponents.map((o, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...o.avatar_config }} size={avatarSize} className="ring-2 ring-[#1E293B] rounded-full shrink-0" />
                    <p className={`text-[10px] sm:text-xs font-extrabold truncate max-w-[50px] mt-1 ${text}`}>
                      {o.username}
                      {o.isBot && " BOT"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className={`${textMuted} font-bold text-sm uppercase tracking-wider`}>
              Match starting in {prematchSeconds}...
            </p>
            <p className={`${text} font-medium text-sm mt-1`}>
              {subject === "vocabulary" ? "Vocabulary" : "Punctuation"} Sprint · 60 seconds
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "vocab-grade") {
    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
        <header className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setPhase("select")}
            className={`flex items-center gap-1.5 text-sm font-bold ${textMuted}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${light ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#3B82F6]/20 text-[#3B82F6]"}`}>
            {mode} · Vocabulary
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <GlobalNotificationBar />
          </div>
        </header>
        <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-5 py-8 flex flex-col items-center justify-center">
          <div className="text-center space-y-2 mb-6">
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${text}`}>Pick Your Level</h1>
            <p className={`${textMuted} text-sm font-medium`}>Grades 3–8, or PSAT/SAT</p>
          </div>
          {profile?.vocab_grade && (
            <button
              onClick={handleUseDefault}
              className="w-full mb-4 py-3 rounded-2xl font-bold text-white"
              style={{ backgroundColor: BLUE }}
            >
              Use my default ({VOCAB_LEVELS.find((l) => l.level === profile.vocab_grade)?.label ?? profile.vocab_grade})
            </button>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            {VOCAB_LEVELS.map(({ level, label }) => (
              <button
                key={String(level)}
                onClick={() => handleStartWithGrade(level)}
                className={`rounded-2xl p-4 border-2 text-center font-bold ${cardBg} ${cardBorder} hover:border-[#3B82F6]/50`}
              >
                <span className={`text-lg ${text}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (phase === "results" && result) {
    const br = botResultsRef.current;
    const is3v3 = mode === "3v3" && br?.teammates.length === 2 && opponents.length === 3;

    // 3v3: individual matchups (best of 3)
    const matchups = is3v3
      ? [
          {
            allyName: profile?.username ?? "You",
            allyAvatar: (profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig,
            allyScore: result.score,
            allyIsPlayer: true,
            oppName: opponents[0].username,
            oppAvatar: opponents[0].avatar_config,
            oppIsBot: opponents[0].isBot,
            oppScore: calculateScore(br!.opponents[0].correct),
          },
          {
            allyName: teamMembers[0]?.username ?? "Teammate 1",
            allyAvatar: teamMembers[0]?.avatar_config ?? DEFAULT_AVATAR_CONFIG,
            allyScore: calculateScore(br!.teammates[0].correct),
            allyIsPlayer: false,
            oppName: opponents[1].username,
            oppAvatar: opponents[1].avatar_config,
            oppIsBot: opponents[1].isBot,
            oppScore: calculateScore(br!.opponents[1].correct),
          },
          {
            allyName: teamMembers[1]?.username ?? "Teammate 2",
            allyAvatar: teamMembers[1]?.avatar_config ?? DEFAULT_AVATAR_CONFIG,
            allyScore: calculateScore(br!.teammates[1].correct),
            allyIsPlayer: false,
            oppName: opponents[2].username,
            oppAvatar: opponents[2].avatar_config,
            oppIsBot: opponents[2].isBot,
            oppScore: calculateScore(br!.opponents[2].correct),
          },
        ]
      : [];

    const matchupsWon = matchups.filter((m) => m.allyScore > m.oppScore).length;
    const matchupsLost = matchups.filter((m) => m.allyScore < m.oppScore).length;

    // 1v1 uses simple score comparison; 3v3 uses best-of-3 matchups
    let youWin: boolean;
    let youLose: boolean;
    if (is3v3) {
      youWin = matchupsWon >= 2;
      youLose = matchupsLost >= 2;
    } else {
      const yourScore = result.score;
      const theirScore = br
        ? calculateScore(br.opponents[0].correct)
        : opponentScores[0] ?? 0;
      youWin = yourScore > theirScore;
      youLose = yourScore < theirScore;
    }

    return (
      <div>
        {opponents.length > 0 && (
          <div className={`${light ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#1E293B] border-white/10"} border-b px-3 sm:px-4 py-3 sm:py-4 overflow-x-hidden`}>
            {is3v3 ? (
              <div className="max-w-lg mx-auto space-y-3">
                <div className="text-center">
                  <p className={`text-sm font-extrabold ${youWin ? "text-[#22C55E]" : youLose ? "text-[#EF4444]" : "text-[#64748B]"}`}>
                    {youWin ? "Team Wins!" : youLose ? "Team Loses!" : "Tie!"}
                  </p>
                  <p className={`text-xs ${textMuted}`}>Best of 3 — {matchupsWon} won, {matchupsLost} lost</p>
                </div>
                <div className="space-y-2">
                  {matchups.map((m, i) => {
                    const allyWon = m.allyScore > m.oppScore;
                    const oppWon = m.allyScore < m.oppScore;
                    const tied = m.allyScore === m.oppScore;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 border ${
                          allyWon
                            ? light ? "bg-[#ECFDF5] border-[#22C55E]/30" : "bg-[#22C55E]/10 border-[#22C55E]/30"
                            : oppWon
                            ? light ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30"
                            : light ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#1E293B] border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...m.allyAvatar }} size="xs" className="shrink-0" />
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${text}`}>
                              {m.allyIsPlayer ? "You" : m.allyName}
                            </p>
                            <p className={`text-sm font-extrabold ${allyWon ? "text-[#22C55E]" : text}`}>{m.allyScore}</p>
                          </div>
                        </div>
                        <div className="shrink-0 px-1">
                          <span className={`text-[10px] font-extrabold uppercase ${
                            allyWon ? "text-[#22C55E]" : oppWon ? "text-[#EF4444]" : textMuted
                          }`}>
                            {allyWon ? "W" : oppWon ? "L" : tied ? "T" : "vs"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                          <div className="text-right min-w-0">
                            <p className={`text-xs font-bold truncate ${text}`}>
                              {m.oppName}{m.oppIsBot ? " BOT" : ""}
                            </p>
                            <p className={`text-sm font-extrabold ${oppWon ? "text-[#EF4444]" : text}`}>{m.oppScore}</p>
                          </div>
                          <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...m.oppAvatar }} size="xs" className="shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="max-w-lg mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <InkAvatar config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig} size="sm" />
                  <div>
                    <p className={`text-xs font-bold ${textMuted}`}>You</p>
                    <p className={`text-lg font-extrabold ${text}`}>{result.score}</p>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <p className={`text-xs font-bold ${textMuted} uppercase`}>vs</p>
                  <p className={`text-sm font-extrabold ${youWin ? "text-[#22C55E]" : youLose ? "text-[#EF4444]" : "text-[#64748B]"}`}>
                    {youWin ? "You win!" : youLose ? "You lose!" : "Tie!"}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 justify-end">
                  <div className="text-right">
                    <p className={`text-xs font-bold ${textMuted}`}>
                      {opponents[0].username}{opponents[0].isBot ? " BOT" : ""}
                    </p>
                    <p className={`text-lg font-extrabold ${text}`}>
                      {br ? calculateScore(br.opponents[0].correct) : opponentScores[0] ?? 0}
                    </p>
                  </div>
                  <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...opponents[0].avatar_config }} size="sm" />
                </div>
              </div>
            )}
          </div>
        )}
        <ResultsScreen
          result={result}
          onPlayAgain={handlePlayAgain}
          metadata={resultMetadata}
          casualOutcome={youWin ? "win" : youLose ? "loss" : "draw"}
        />
      </div>
    );
  }

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className="flex items-center justify-between px-5 py-4">
        <Link href="/" className={`flex items-center gap-1.5 text-sm font-bold ${textMuted}`}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${light ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#3B82F6]/20 text-[#3B82F6]"}`}>
          Casual
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-5 py-8">
        <div className="text-center space-y-2 mb-6">
          <h1 className={`text-2xl sm:text-3xl font-extrabold ${text}`}>Choose Your Sprint</h1>
          <p className={`${textMuted} text-sm`}>1v1 or 3v3 · No rank impact</p>
        </div>

        {members.length > 0 && (
          <div className={`rounded-xl p-3 mb-4 ${cardBg} border ${cardBorder}`}>
            <p className={`text-xs font-bold ${textMuted}`}>Party ({members.length}/6)</p>
            {!isLeader && <p className="text-xs text-amber-600 mt-1">Only the party leader can queue</p>}
            {isLeader && !canQueue1v1 && mode === "1v1" && <p className="text-xs text-amber-600 mt-1">Party too large for 1v1</p>}
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode("1v1")}
            className={`flex-1 py-3 rounded-xl font-bold ${mode === "1v1" ? "text-white" : textMuted}`}
            style={{ backgroundColor: mode === "1v1" ? BLUE : "transparent", border: `2px solid ${mode === "1v1" ? BLUE : "transparent"}` }}
          >
            1v1
          </button>
          <button
            onClick={() => setMode("3v3")}
            className={`flex-1 py-3 rounded-xl font-bold ${mode === "3v3" ? "text-white" : textMuted}`}
            style={{ backgroundColor: mode === "3v3" ? MINT : "transparent", border: `2px solid ${mode === "3v3" ? MINT : "transparent"}` }}
          >
            3v3
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleStartVocab}
            disabled={!canQueue}
            className={`group rounded-2xl p-5 border text-left transition-all disabled:opacity-50 ${cardBg} ${cardBorder} hover:border-[#3B82F6]/40`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${light ? "bg-[#DBEAFE]" : "bg-[#3B82F6]/20"}`}>
              <BookIcon className="w-6 h-6" color={BLUE} />
            </div>
            <h3 className={`${text} font-extrabold text-base mb-1`}>Vocabulary</h3>
            <p className={`${textMuted} text-xs`}>Definitions, synonyms, context clues</p>
          </button>

          <button
            onClick={handleStartPunctuation}
            disabled={!canQueue}
            className={`group rounded-2xl p-5 border text-left transition-all disabled:opacity-50 ${cardBg} ${cardBorder} hover:border-[#34D399]/40`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${light ? "bg-[#D1FAE5]" : "bg-[#34D399]/20"}`}>
              <PencilIcon className="w-6 h-6" color={MINT} />
            </div>
            <h3 className={`${text} font-extrabold text-base mb-1`}>Punctuation</h3>
            <p className={`${textMuted} text-xs`}>Commas, apostrophes, quotes</p>
          </button>
        </div>

        {!canQueue && (
          <p className={`text-center text-sm ${textMuted} mt-4`}>
            {!isLeader && members.length > 0
              ? "Only the party leader can queue"
              : mode === "1v1"
                ? "Leave party or reduce to 2 to queue 1v1"
                : "Invite friends to party — bots fill empty slots"}
          </p>
        )}
      </div>
    </main>
  );
}
