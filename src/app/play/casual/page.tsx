"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Subject, GameResult, VocabLevel, DEFAULT_AVATAR_CONFIG, InkAvatarConfig, RankTier, RANK_TIERS } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useParty, type PartyMember } from "@/context/PartyContext";
import { getProfile, createGuestProfile, INITIAL_PROFILE } from "@/lib/user/storage";
import { syncCurrentProfile } from "@/lib/user/profile-sync";
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
  generateBotScore3v3,
  generateBotScore3v3Seeded,
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

const THREE_VS_THREE_QUESTIONS = 15;
const ONE_VS_ONE_QUESTIONS = 15;

type CasualMode = "1v1" | "3v3";
type Phase = "select" | "vocab-grade" | "punctuation-level" | "searching" | "matchmaking" | "playing" | "waiting" | "results";

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
const THREE_VS_THREE_TIMEOUT_MS = 15_000;

type MatchTeam = "A" | "B";
type QueuePlayer = {
  id: string;
  username: string;
  avatar_config: InkAvatarConfig;
};
type QueueEntry = {
  leaderId: string;
  mode: CasualMode;
  subject: Subject;
  queuedAt: number;
  players: QueuePlayer[];
  rank_tier?: RankTier;
};
type MatchPlayer = QueuePlayer & { team: MatchTeam; isBot?: boolean; rank_tier?: RankTier };
type BotProgressSnapshot = {
  opponents: { correct: number; total: number; finishTimeMs?: number }[];
  teammates: { correct: number; total: number; finishTimeMs?: number }[];
};
type MatchFoundPayload1v1 = {
  to?: string;
  from?: string;
  seed?: string;
  player?: {
    username?: string;
    rank_tier?: RankTier;
    avatar_config?: InkAvatarConfig;
  };
};
type GameDecisionPayload = {
  matchSeed?: string;
  fromUserId?: string;
  toUserId?: string;
  finalAnswered?: number;
  finalScore?: number;
  finalElapsedMs?: number;
};

function toRankTier(value: unknown): RankTier | undefined {
  if (typeof value !== "string") return undefined;
  return RANK_TIERS.includes(value as RankTier) ? (value as RankTier) : undefined;
}

function toQueueEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any[]>,
  queueMode: CasualMode,
  queueSubject: Subject
): QueueEntry[] {
  return Object.entries(state).reduce<QueueEntry[]>((acc, [leaderId, raw]) => {
    const meta = raw?.[0] as Partial<QueueEntry> | undefined;
    if (!meta) return acc;
    if (meta.mode !== queueMode || meta.subject !== queueSubject) return acc;
    const players = Array.isArray(meta.players)
      ? (meta.players.filter((p): p is QueuePlayer =>
          Boolean(p && typeof p.id === "string" && typeof p.username === "string" && p.avatar_config)
        ))
      : [];
    if (players.length === 0) return acc;
    acc.push({
      leaderId,
      mode: meta.mode,
      subject: meta.subject,
      queuedAt: typeof meta.queuedAt === "number" ? meta.queuedAt : Date.now(),
      players: players.slice(0, 3),
      rank_tier: toRankTier(meta.rank_tier),
    });
    return acc;
  }, []);
}

function findEntriesTotal(
  entries: QueueEntry[],
  requiredLeaderId: string,
  targetPlayers: number
): QueueEntry[] | null {
  const required = entries.find((e) => e.leaderId === requiredLeaderId);
  if (!required) return null;
  const others = entries
    .filter((e) => e.leaderId !== requiredLeaderId)
    .sort((a, b) => a.queuedAt - b.queuedAt || a.leaderId.localeCompare(b.leaderId));
  let found: QueueEntry[] | null = null;

  function dfs(index: number, picked: QueueEntry[], total: number) {
    if (found) return;
    if (total === targetPlayers) {
      found = [...picked];
      return;
    }
    if (total > targetPlayers || index >= others.length) return;
    dfs(index + 1, [...picked, others[index]], total + others[index].players.length);
    dfs(index + 1, picked, total);
  }

  dfs(0, [required], required.players.length);
  return found;
}

function splitTeams(entries: QueueEntry[]): { teamA: QueueEntry[]; teamB: QueueEntry[] } | null {
  const n = entries.length;
  if (n === 0) return null;
  const maxMask = 1 << n;
  let chosenTeamA: QueueEntry[] | null = null;

  for (let mask = 1; mask < maxMask; mask++) {
    const picked: QueueEntry[] = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) === 0) continue;
      picked.push(entries[i]);
      total += entries[i].players.length;
      if (total > 3) break;
    }
    if (total === 3) {
      chosenTeamA = picked;
      break;
    }
  }

  if (!chosenTeamA) return null;
  const teamAIds = new Set(chosenTeamA.map((e) => e.leaderId));
  const teamB = entries.filter((e) => !teamAIds.has(e.leaderId));
  const countA = chosenTeamA.reduce((sum, e) => sum + e.players.length, 0);
  const countB = teamB.reduce((sum, e) => sum + e.players.length, 0);
  if (countA !== 3 || countB !== 3) return null;
  return { teamA: chosenTeamA, teamB };
}

function findEntriesBestAtMost(
  entries: QueueEntry[],
  requiredLeaderId: string,
  maxPlayers: number
): QueueEntry[] | null {
  const required = entries.find((e) => e.leaderId === requiredLeaderId);
  if (!required) return null;
  const others = entries
    .filter((e) => e.leaderId !== requiredLeaderId)
    .sort((a, b) => a.queuedAt - b.queuedAt || a.leaderId.localeCompare(b.leaderId));
  let best: QueueEntry[] = [required];
  let bestTotal = required.players.length;

  function dfs(index: number, picked: QueueEntry[], total: number) {
    if (total > maxPlayers) return;
    if (total > bestTotal) {
      best = [...picked];
      bestTotal = total;
    }
    if (total === maxPlayers || index >= others.length) return;
    dfs(index + 1, [...picked, others[index]], total + others[index].players.length);
    dfs(index + 1, picked, total);
  }

  dfs(0, [required], required.players.length);
  return best;
}

function buildMixedTeamsWithBots(
  entries: QueueEntry[],
  defaultTier: RankTier
): MatchPlayer[] {
  const sorted = [...entries].sort(
    (a, b) => b.players.length - a.players.length || a.queuedAt - b.queuedAt || a.leaderId.localeCompare(b.leaderId)
  );
  const teamA: MatchPlayer[] = [];
  const teamB: MatchPlayer[] = [];

  for (const entry of sorted) {
    const withTier = entry.players.map((p) => ({ ...p, rank_tier: entry.rank_tier ?? defaultTier }));
    const canFitA = teamA.length + withTier.length <= 3;
    const canFitB = teamB.length + withTier.length <= 3;

    if ((teamA.length <= teamB.length && canFitA) || !canFitB) {
      teamA.push(...withTier.map((p) => ({ ...p, team: "A" as const, isBot: false })));
    } else {
      teamB.push(...withTier.map((p) => ({ ...p, team: "B" as const, isBot: false })));
    }
  }

  while (teamA.length < 3) {
    const bot = generateBotOpponent(defaultTier);
    teamA.push({
      id: `bot-A-${teamA.length}`,
      username: bot.username,
      avatar_config: bot.avatar_config,
      team: "A",
      isBot: true,
      rank_tier: bot.rank_tier,
    });
  }
  while (teamB.length < 3) {
    const bot = generateBotOpponent(defaultTier);
    teamB.push({
      id: `bot-B-${teamB.length}`,
      username: bot.username,
      avatar_config: bot.avatar_config,
      team: "B",
      isBot: true,
      rank_tier: bot.rank_tier,
    });
  }

  return [...teamA, ...teamB];
}

function getStartedAtFromSeed(seed: string): number {
  const ts = Number(seed.split("_")[1]);
  return Number.isFinite(ts) ? ts : 0;
}

export default function CasualPage() {
  const { user } = useAuth();
  const { light } = useTheme();
  const { members, isLeader, canQueue1v1, canQueue3v3, partyQueuePayload, setPartyQueuePayload } = useParty();
  const [phase, setPhase] = useState<Phase>("select");
  const [mode, setMode] = useState<CasualMode>("1v1");
  const [subject, setSubject] = useState<Subject>("vocabulary");
  const [vocabGrade, setVocabGrade] = useState<VocabLevel | undefined>(undefined);
  const [punctuationLevel, setPunctuationLevel] = useState<1 | 2 | 3>(2);
  const [result, setResult] = useState<GameResult | null>(null);
  const [resultMetadata, setResultMetadata] = useState<import("@/types").GameResultMetadata | undefined>(undefined);
  const [prematchSeconds, setPrematchSeconds] = useState(PREMATCH_SECONDS);
  const [searchDots, setSearchDots] = useState("");
  const [playersFound, setPlayersFound] = useState(1);
  const [opponents, setOpponents] = useState<OpponentInfo[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id?: string; username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[]>([]);
  const [opponentScores, setOpponentScores] = useState<number[]>([]);
  const [opponentAnswered, setOpponentAnswered] = useState<number[]>([]);
  const [teammateScores, setTeammateScores] = useState<number[]>([]);
  const [, setTeammateAnswered] = useState<number[]>([]);
  const [matchSeed, setMatchSeed] = useState<string | null>(null);
  const [forceFinishSignal, setForceFinishSignal] = useState(0);
  const partyQueueAppliedRef = useRef(false);
  const matchedRef = useRef(false);
  const decisionSentRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameChannelRef = useRef<any>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botResultsRef = useRef<BotProgressSnapshot | null>(null);
  const [botResultsState, setBotResultsState] = useState<BotProgressSnapshot | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const playerFinishTimeRef = useRef<number>(0);
  const [playerFinishMsState, setPlayerFinishMsState] = useState(0);
  const playerDoneRef = useRef<boolean>(false);
  const remoteDoneRef = useRef<Record<string, boolean>>({});
  const remoteFinishMsRef = useRef<Record<string, number>>({});
  const [remoteFinishMsState, setRemoteFinishMsState] = useState<Record<string, number>>({});
  const [remoteFinalState, setRemoteFinalState] = useState<Record<string, { answered: number; score: number }>>({});
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [waitElapsedMs, setWaitElapsedMs] = useState(0);
  const [profile, setProfile] = useState(INITIAL_PROFILE);

  const setBotResults = useCallback((value: BotProgressSnapshot | null) => {
    botResultsRef.current = value;
    setBotResultsState(value);
  }, []);

  const setRemoteFinish = useCallback((userId: string, elapsedMs: number) => {
    remoteFinishMsRef.current[userId] = elapsedMs;
    setRemoteFinishMsState({ ...remoteFinishMsRef.current });
  }, []);

  const setRemoteFinal = useCallback((userId: string, answered: number, score: number) => {
    setRemoteFinalState((prev) => {
      const current = prev[userId];
      if (current && current.answered === answered && current.score === score) return prev;
      return { ...prev, [userId]: { answered, score } };
    });
  }, []);

  useEffect(() => {
    setProfile(getProfile() ?? createGuestProfile());
  }, []);

  const canQueue = mode === "1v1" ? canQueue1v1 : canQueue3v3;

  // Apply party queue payload when member receives broadcast (navigated here)
  useEffect(() => {
    if (!partyQueuePayload || phase !== "select") return;
    partyQueueAppliedRef.current = true;
    let normalizedTeamMembers = partyQueuePayload.teamMembers;
    if (partyQueuePayload.mode === "3v3" && user) {
      const containsSelf = partyQueuePayload.teamMembers.some((m) => m.id === user.id);
      if (containsSelf) {
        const othersFromPayload = partyQueuePayload.teamMembers.filter((m) => m.id !== user.id);
        const othersFromParty = members
          .filter((m) => m.id !== user.id && !othersFromPayload.some((p) => p.id === m.id))
          .map((m) => ({
            id: m.id,
            username: m.username,
            avatar_config: { ...DEFAULT_AVATAR_CONFIG, ...(m.avatar_config as Partial<InkAvatarConfig>) } as InkAvatarConfig,
            isBot: false,
          }));
        normalizedTeamMembers = [...othersFromPayload, ...othersFromParty].slice(0, 2);
      }
    }
    setMode(partyQueuePayload.mode);
    setSubject(partyQueuePayload.subject);
    setVocabGrade(partyQueuePayload.vocabGrade);
    setPunctuationLevel(partyQueuePayload.punctuationLevel ?? 2);
    setOpponents(partyQueuePayload.opponents);
    setTeamMembers(normalizedTeamMembers);
    setBotResults(partyQueuePayload.botResults);
    setMatchSeed(partyQueuePayload.seed);
    const elapsed = Math.floor((Date.now() - partyQueuePayload.startedAt) / 1000);
    const syncedSeconds = Math.max(0, PREMATCH_SECONDS - elapsed);
    setPrematchSeconds(syncedSeconds);
    setPhase("matchmaking");
    setPartyQueuePayload(null);
  }, [members, partyQueuePayload, phase, setBotResults, setPartyQueuePayload, user]);

  // Search dots animation
  useEffect(() => {
    if (phase !== "searching") return;
    const interval = setInterval(() => {
      setSearchDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

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

  // Reset opponent/teammate progress when starting a new game; record start time
  useEffect(() => {
    if (phase === "playing") {
      setOpponentAnswered(new Array(opponents.length).fill(0));
      setOpponentScores(new Array(opponents.length).fill(0));
      setTeammateAnswered(new Array(teamMembers.length).fill(0));
      setTeammateScores(new Array(teamMembers.length).fill(0));
      setForceFinishSignal(0);
      gameStartTimeRef.current = Date.now();
      setWaitElapsedMs(0);
      playerDoneRef.current = false;
      playerFinishTimeRef.current = 0;
      setPlayerFinishMsState(0);
      decisionSentRef.current = false;
      remoteDoneRef.current = {};
      remoteFinishMsRef.current = {};
      setRemoteFinishMsState({});
      setRemoteFinalState({});
    }
  }, [phase, opponents.length, teamMembers.length]);

  // Simulate bot progress during casual match (opponents + teammates for 3v3)
  // Only runs while actively playing; "waiting" phase uses snapped final scores
  useEffect(() => {
    if ((phase !== "playing") || opponents.length === 0) return;
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

  const cleanupGameChannel = useCallback(() => {
    if (gameChannelRef.current) {
      try {
        const supabase = createClient();
        supabase.removeChannel(gameChannelRef.current);
      } catch {}
      gameChannelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupChannel();
      cleanupGameChannel();
      if (waitTimerRef.current) { clearTimeout(waitTimerRef.current); waitTimerRef.current = null; }
    };
  }, [cleanupChannel, cleanupGameChannel]);

  function handleStartVocab() {
    setSubject("vocabulary");
    setPhase("vocab-grade");
  }

  function matchWithBots(queueSubject: Subject, queueGrade: VocabLevel | undefined, queuePunctuationLevel?: 1 | 2 | 3): { opps: OpponentInfo[]; tms: { id?: string; username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[]; seed: string; botResults: typeof botResultsRef.current } {
    const tier = profile?.rank_tier ?? "Bronze";
    const seed = generateMatchSeed();
    setMatchSeed(seed);
    setSubject(queueSubject);
    setVocabGrade(queueGrade);
    if (queueSubject === "punctuation" && queuePunctuationLevel != null) setPunctuationLevel(queuePunctuationLevel);

    let opps: OpponentInfo[];
    let tms: { id?: string; username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[];

    if (mode === "1v1") {
      const bot = generateBotOpponent(tier);
      const botResult = generateBotScore(tier);
      setBotResults({ opponents: [{ correct: botResult.correct, total: botResult.total }], teammates: [] });
      opps = [bot];
      tms = [];
      setOpponents(opps);
      setTeamMembers(tms);
    } else {
      // 3v3: use seeded bot scores so all party members see the same outcome
      const bots = generateBotOpponents(tier, 3);
      const oppResults = [0, 1, 2].map((i) => generateBotScore3v3Seeded(seed, i, tier));
      const partyTeammates = members.slice(0, 2).map((m: PartyMember) => ({
        id: m.id,
        username: m.username,
        avatar_config: { ...DEFAULT_AVATAR_CONFIG, ...(m.avatar_config as Partial<InkAvatarConfig>) } as InkAvatarConfig,
        isBot: false,
      }));
      const botTeammates = Array.from({ length: 2 - partyTeammates.length }, () => {
        const bot = generateBotOpponent(tier);
        return { username: bot.username, avatar_config: bot.avatar_config, isBot: true };
      });
      const allTeammates = [...partyTeammates, ...botTeammates];
      const teammateResults = allTeammates.map((_, i) => generateBotScore3v3Seeded(seed, 3 + i, tier));
      setBotResults({
        opponents: oppResults.map((r) => ({ correct: r.correct, total: r.total, finishTimeMs: r.finishTimeMs })),
        teammates: teammateResults.map((r) => ({ correct: r.correct, total: r.total, finishTimeMs: r.finishTimeMs })),
      });
      opps = bots;
      tms = allTeammates.map((t) => ({ id: (t as { id?: string }).id, username: t.username, avatar_config: t.avatar_config, isBot: t.isBot }));
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

  function startBotMatch(queueSubject: Subject, queueGrade: VocabLevel | undefined, queuePunctuationLevel?: 1 | 2 | 3) {
    const { opps, tms, seed, botResults } = matchWithBots(queueSubject, queueGrade, queuePunctuationLevel);
    if (mode === "3v3" && members.length > 0 && user && isLeader && botResults) {
      void broadcastPartyQueue(user.id, {
        mode,
        subject: queueSubject,
        vocabGrade: queueGrade,
        punctuationLevel: queuePunctuationLevel,
        seed,
        startedAt: getStartedAtFromSeed(seed),
        opponents: opps,
        teamMembers: tms,
        botResults,
      });
    }
  }

  type BotResult3v3 = { correct: number; total: number; finishTimeMs: number };

  const apply3v3Match = useCallback(async (
    players: MatchPlayer[],
    seed: string,
    queueSubject: Subject,
    queueGrade: VocabLevel | undefined,
    broadcastBotResults?: { teamA: (BotResult3v3 | null)[]; teamB: (BotResult3v3 | null)[] },
    queuePunctuationLevel?: 1 | 2 | 3
  ) => {
    if (!user || matchedRef.current) return;
    const me = players.find((p) => p.id === user.id);
    if (!me) return;
    matchedRef.current = true;

    const allies = players.filter((p) => p.team === me.team && p.id !== user.id);
    const enemies = players.filter((p) => p.team !== me.team);

    const opps: OpponentInfo[] = enemies.map((p) => ({
      id: p.id,
      username: p.username,
      rank_tier: p.rank_tier ?? profile.rank_tier,
      avatar_config: p.avatar_config,
      isBot: p.isBot ?? false,
    }));
    const tms = allies.map((p) => ({
      id: p.id,
      username: p.username,
      avatar_config: p.avatar_config,
      isBot: p.isBot ?? false,
    }));
    const hasAnyBot = [...opps, ...tms].some((p) => p.isBot);
    if (hasAnyBot && broadcastBotResults) {
      // Use shared bot results from coordinator so all players see the same outcome
      if (me.team === "A") {
        setBotResults({
          opponents: broadcastBotResults.teamB.map((r) => r ?? { correct: 0, total: 15, finishTimeMs: 60000 }),
          teammates: [broadcastBotResults.teamA[1], broadcastBotResults.teamA[2]].map(
            (r) => r ?? { correct: 0, total: 15, finishTimeMs: 60000 }
          ),
        });
      } else {
        setBotResults({
          opponents: broadcastBotResults.teamA.map((r) => r ?? { correct: 0, total: 15, finishTimeMs: 60000 }),
          teammates: [broadcastBotResults.teamB[1], broadcastBotResults.teamB[2]].map(
            (r) => r ?? { correct: 0, total: 15, finishTimeMs: 60000 }
          ),
        });
      }
    } else if (hasAnyBot) {
      // Fallback: generate locally (legacy; may differ per player if multiple humans)
      const oppResults = opps.map(() => generateBotScore3v3(profile.rank_tier));
      const tmResults = tms.map(() => generateBotScore3v3(profile.rank_tier));
      setBotResults({
        opponents: oppResults.map((r) => ({ correct: r.correct, total: r.total, finishTimeMs: r.finishTimeMs })),
        teammates: tmResults.map((r) => ({ correct: r.correct, total: r.total, finishTimeMs: r.finishTimeMs })),
      });
    } else {
      setBotResults(null);
    }

    setMatchSeed(seed);
    setSubject(queueSubject);
    setVocabGrade(queueGrade);
    setPunctuationLevel(queuePunctuationLevel ?? 2);
    setOpponents(opps);
    setTeamMembers(tms);
    setOpponentScores([]);
    setOpponentAnswered([]);
    setTeammateScores([]);
    setTeammateAnswered([]);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setPhase("matchmaking");

    if (members.length > 0 && isLeader) {
      await broadcastPartyQueue(user.id, {
        mode: "3v3",
        subject: queueSubject,
        vocabGrade: queueGrade,
        punctuationLevel: queuePunctuationLevel,
        seed,
        startedAt: Date.now(),
        opponents: opps,
        teamMembers: tms,
        botResults: botResultsRef.current ?? { opponents: [], teammates: [] },
      });
    }
  }, [isLeader, members.length, profile.rank_tier, setBotResults, user]);

  const hasHumanMatch = useMemo(() => {
    if (mode === "1v1") return opponents.length > 0 && !opponents[0].isBot;
    return opponents.some((o) => !o.isBot);
  }, [mode, opponents]);

  useEffect(() => {
    if (!user || !matchSeed || !hasHumanMatch) return;
    if (phase !== "matchmaking" && phase !== "playing" && phase !== "waiting") return;

    cleanupGameChannel();
    const supabase = createClient();
    const gameChannel = supabase.channel(`casual-game:${matchSeed}`);
    gameChannelRef.current = gameChannel;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gameChannel.on("broadcast", { event: "game-progress" }, (msg: any) => {
      const payload = msg.payload as {
        matchSeed?: string;
        userId?: string;
        answered?: number;
        score?: number;
        elapsedMs?: number;
        finished?: boolean;
      };
      if (!payload || payload.matchSeed !== matchSeed || !payload.userId || payload.userId === user.id) return;

      const oppIdx = opponents.findIndex((o) => o.id === payload.userId);
      if (oppIdx >= 0) {
        setOpponentAnswered((prev) => {
          const next = prev.length === opponents.length ? [...prev] : new Array(opponents.length).fill(0);
          next[oppIdx] = payload.answered ?? next[oppIdx] ?? 0;
          return next;
        });
        setOpponentScores((prev) => {
          const next = prev.length === opponents.length ? [...prev] : new Array(opponents.length).fill(0);
          next[oppIdx] = payload.score ?? next[oppIdx] ?? 0;
          return next;
        });
        if (payload.answered != null && payload.score != null) {
          setRemoteFinal(payload.userId, payload.answered, payload.score);
        }
        return;
      }

      const teamIdx = teamMembers.findIndex((m) => m.id === payload.userId);
      if (teamIdx >= 0) {
        setTeammateAnswered((prev) => {
          const next = prev.length === teamMembers.length ? [...prev] : new Array(teamMembers.length).fill(0);
          next[teamIdx] = payload.answered ?? next[teamIdx] ?? 0;
          return next;
        });
        setTeammateScores((prev) => {
          const next = prev.length === teamMembers.length ? [...prev] : new Array(teamMembers.length).fill(0);
          next[teamIdx] = payload.score ?? next[teamIdx] ?? 0;
          return next;
        });
        if (payload.answered != null && payload.score != null) {
          setRemoteFinal(payload.userId, payload.answered, payload.score);
        }
      }

      if (
        mode === "3v3" &&
        (payload.finished || (payload.answered ?? 0) >= THREE_VS_THREE_QUESTIONS)
      ) {
        remoteDoneRef.current[payload.userId] = true;
        if (typeof payload.elapsedMs === "number" && Number.isFinite(payload.elapsedMs)) {
          setRemoteFinish(payload.userId, Math.max(0, payload.elapsedMs));
        } else if (remoteFinishMsRef.current[payload.userId] == null) {
          setRemoteFinish(payload.userId, Math.max(0, Date.now() - gameStartTimeRef.current));
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gameChannel.on("broadcast", { event: "game-complete" }, (msg: any) => {
      const payload = msg.payload as {
        matchSeed?: string;
        userId?: string;
        answered?: number;
        score?: number;
        elapsedMs?: number;
      };
      if (!payload || payload.matchSeed !== matchSeed || !payload.userId || payload.userId === user.id) return;
      if (payload.answered != null && payload.score != null) {
        setRemoteFinal(payload.userId, payload.answered, payload.score);
      }

      remoteDoneRef.current[payload.userId] = true;
      if (typeof payload.elapsedMs === "number" && Number.isFinite(payload.elapsedMs)) {
        setRemoteFinish(payload.userId, Math.max(0, payload.elapsedMs));
      } else if (remoteFinishMsRef.current[payload.userId] == null) {
        setRemoteFinish(payload.userId, Math.max(0, Date.now() - gameStartTimeRef.current));
      }

      const oppIdx = opponents.findIndex((o) => o.id === payload.userId);
      if (oppIdx >= 0) {
        setOpponentAnswered((prev) => {
          const next = prev.length === opponents.length ? [...prev] : new Array(opponents.length).fill(0);
          next[oppIdx] = payload.answered ?? next[oppIdx] ?? 0;
          return next;
        });
        setOpponentScores((prev) => {
          const next = prev.length === opponents.length ? [...prev] : new Array(opponents.length).fill(0);
          next[oppIdx] = payload.score ?? next[oppIdx] ?? 0;
          return next;
        });
        return;
      }

      const teamIdx = teamMembers.findIndex((m) => m.id === payload.userId);
      if (teamIdx >= 0) {
        setTeammateAnswered((prev) => {
          const next = prev.length === teamMembers.length ? [...prev] : new Array(teamMembers.length).fill(0);
          next[teamIdx] = payload.answered ?? next[teamIdx] ?? 0;
          return next;
        });
        setTeammateScores((prev) => {
          const next = prev.length === teamMembers.length ? [...prev] : new Array(teamMembers.length).fill(0);
          next[teamIdx] = payload.score ?? next[teamIdx] ?? 0;
          return next;
        });
      }
    });

    gameChannel.on("broadcast", { event: "game-decision" }, (msg: { payload: GameDecisionPayload }) => {
      const payload = msg.payload;
      if (mode !== "1v1") return;
      if (!payload || payload.matchSeed !== matchSeed || !payload.fromUserId || payload.fromUserId === user.id) return;
      if (payload.toUserId && payload.toUserId !== user.id) return;

      if (payload.finalAnswered != null && payload.finalScore != null) {
        setOpponentAnswered([payload.finalAnswered]);
        setOpponentScores([payload.finalScore]);
        setRemoteFinal(payload.fromUserId, payload.finalAnswered, payload.finalScore);
      }
      if (payload.finalElapsedMs != null) {
        setRemoteFinish(payload.fromUserId, payload.finalElapsedMs);
      }
      remoteDoneRef.current[payload.fromUserId] = true;

      if (phase === "playing") {
        setForceFinishSignal((n) => n + 1);
      } else if (phase === "waiting") {
        setPhase("results");
      }
    });

    gameChannel.subscribe();
    return () => cleanupGameChannel();
  }, [cleanupGameChannel, hasHumanMatch, matchSeed, mode, opponents, phase, setBotResults, setRemoteFinal, setRemoteFinish, teamMembers, user]);

  // In 3v3, if you finish early, wait until all humans + bots are done.
  useEffect(() => {
    if (phase !== "waiting" || mode !== "3v3") return;
    const deadlineMs = 65_000;

    const allDone = () => {
      const elapsedMs = Math.max(0, Date.now() - gameStartTimeRef.current);
      const br = botResultsRef.current;

      const opponentsDone = opponents.every((opp, i) => {
        if (opp.isBot) {
          const botFinish = br?.opponents[i]?.finishTimeMs ?? 60_000;
          return elapsedMs >= botFinish;
        }
        return !!remoteDoneRef.current[opp.id];
      });

      const teammatesDone = teamMembers.every((tm, i) => {
        if (tm.isBot) {
          const botFinish = br?.teammates[i]?.finishTimeMs ?? 60_000;
          return elapsedMs >= botFinish;
        }
        if (!tm.id) return false;
        return !!remoteDoneRef.current[tm.id];
      });

      return playerDoneRef.current && opponentsDone && teammatesDone;
    };

    const tick = () => {
      const elapsedMs = Math.max(0, Date.now() - gameStartTimeRef.current);
      setWaitElapsedMs(elapsedMs);
      if (allDone() || elapsedMs >= deadlineMs) {
        setPhase("results");
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [mode, opponents, phase, teamMembers]);

  // In human 1v1, if you finish early, wait until outcome is guaranteed or opponent finishes.
  useEffect(() => {
    if (phase !== "waiting" || mode !== "1v1") return;
    if (!user || !matchSeed || opponents.length !== 1 || opponents[0].isBot || !result) return;

    const opponentId = opponents[0].id;
    const myCorrect = result.correct;
    const myElapsed = playerFinishTimeRef.current;

    const tick = () => {
      const oppSnapshot = remoteFinalState[opponentId];
      const oppAnswered = oppSnapshot?.answered ?? (opponentAnswered[0] ?? 0);
      const oppScore = oppSnapshot?.score ?? (opponentScores[0] ?? 0);
      const oppCorrect = Math.round(oppScore / 10);
      const oppDone = !!remoteDoneRef.current[opponentId] || oppAnswered >= ONE_VS_ONE_QUESTIONS;
      const remaining = Math.max(0, ONE_VS_ONE_QUESTIONS - oppAnswered);
      const oppMaxCorrect = oppCorrect + remaining;
      const guaranteedWin = myCorrect > oppMaxCorrect || (myCorrect === oppMaxCorrect && myElapsed > 0);

      if (!oppDone && !guaranteedWin) return;

      if (!decisionSentRef.current && gameChannelRef.current) {
        decisionSentRef.current = true;
        try {
          gameChannelRef.current.send({
            type: "broadcast",
            event: "game-decision",
            payload: {
              matchSeed,
              fromUserId: user.id,
              toUserId: opponentId,
              finalAnswered: result.correct + result.incorrect,
              finalScore: result.score,
              finalElapsedMs: myElapsed,
            } satisfies GameDecisionPayload,
          });
        } catch {}
      }

      setPhase("results");
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [matchSeed, mode, opponentAnswered, opponentScores, opponents, phase, remoteFinalState, result, user]);

  async function startSearch(queueSubject: Subject, queueGrade: VocabLevel | undefined, queuePunctuationLevel?: 1 | 2 | 3) {
    if (!canQueue) return;
    matchedRef.current = false;
    cleanupChannel();
    setSubject(queueSubject);
    setVocabGrade(queueGrade);
    setPunctuationLevel(queuePunctuationLevel ?? 2);
    setPlayersFound(Math.min(6, mode === "3v3" ? members.length + 1 : 1));
    setPhase("searching");

    if (!isSupabaseConfigured || !user) {
      searchTimerRef.current = setTimeout(() => startBotMatch(queueSubject, queueGrade, queuePunctuationLevel), mode === "3v3" ? THREE_VS_THREE_TIMEOUT_MS : 3000);
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel("casual-matchmaking", {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();

      if (mode === "3v3") {
        const entries = toQueueEntries(state, "3v3", queueSubject);
        const queuedPlayers = entries.reduce((sum, entry) => sum + entry.players.length, 0);
        setPlayersFound(Math.max(1, Math.min(6, queuedPlayers)));
        if (matchedRef.current) return;

        const sortedLeaders = [...entries].sort(
          (a, b) => a.queuedAt - b.queuedAt || a.leaderId.localeCompare(b.leaderId)
        );
        const coordinator = sortedLeaders[0];
        if (!coordinator || coordinator.leaderId !== user.id) return;

        const participants = findEntriesTotal(entries, user.id, 6);
        if (!participants) return;
        const teams = splitTeams(participants);
        if (!teams) return;

        const seed = generateMatchSeed();
        const teamAPlayers = teams.teamA.flatMap((entry) =>
          entry.players.map((player): MatchPlayer => ({ ...player, team: "A" }))
        );
        const teamBPlayers = teams.teamB.flatMap((entry) =>
          entry.players.map((player): MatchPlayer => ({ ...player, team: "B" }))
        );
        const payload = {
          to: participants.map((p) => p.leaderId),
          seed,
          players: [...teamAPlayers, ...teamBPlayers],
        };

        channel.send({
          type: "broadcast",
          event: "match-found-3v3",
          payload,
        });
        void apply3v3Match(payload.players, payload.seed, queueSubject, queueGrade, undefined, queuePunctuationLevel);
      }

      const players = Object.entries(state).filter(([key, raw]) => {
        if (key === user.id) return false;
        const arr = Array.isArray(raw) ? raw : [];
        const meta = arr[0] as Partial<QueueEntry> | undefined;
        return meta?.mode === "1v1" && meta.subject === queueSubject;
      });

      if (mode === "1v1" && players.length > 0 && !matchedRef.current) {
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
        setBotResults(null);
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

    channel.on("broadcast", { event: "match-found" }, (msg: { payload: MatchFoundPayload1v1 }) => {
      const payload = msg.payload;
      if (mode !== "1v1") return;
      if (payload.to === user.id && payload.seed && payload.from && !matchedRef.current) {
        matchedRef.current = true;
        const opp: OpponentInfo = {
          id: payload.from,
          username: payload.player?.username ?? "Opponent",
          rank_tier: payload.player?.rank_tier ?? profile.rank_tier,
          avatar_config: payload.player?.avatar_config ?? DEFAULT_AVATAR_CONFIG,
          isBot: false,
        };
        setBotResults(null);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on("broadcast", { event: "match-found-3v3" }, async (msg: any) => {
      if (mode !== "3v3" || matchedRef.current) return;
      const payload = msg.payload as {
        to?: string[];
        seed?: string;
        players?: MatchPlayer[];
        botResults?: { teamA: (BotResult3v3 | null)[]; teamB: (BotResult3v3 | null)[] };
        punctuationLevel?: 1 | 2 | 3;
      };
      if (!payload?.to?.includes(user.id) || !payload.seed || !Array.isArray(payload.players)) return;
      const puncLevel = payload.punctuationLevel ?? queuePunctuationLevel;
      await apply3v3Match(payload.players, payload.seed, queueSubject, queueGrade, payload.botResults, puncLevel);
    });

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        const ownPartyPlayers: QueuePlayer[] = [
          {
            id: user.id,
            username: profile.username,
            avatar_config: (profile.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig,
          },
          ...(mode === "3v3"
            ? members.slice(0, 2).map((m) => ({
                id: m.id,
                username: m.username,
                avatar_config: { ...DEFAULT_AVATAR_CONFIG, ...(m.avatar_config as Partial<InkAvatarConfig>) } as InkAvatarConfig,
              }))
            : []),
        ];
        await channel.track({
          username: profile.username,
          rank_tier: profile.rank_tier,
          avatar_config: profile.avatar_config,
          mode,
          subject: queueSubject,
          queuedAt: Date.now(),
          players: ownPartyPlayers,
        });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        startBotMatch(queueSubject, queueGrade, queuePunctuationLevel);
      }
    });

    searchTimerRef.current = setTimeout(() => {
      if (mode !== "3v3") {
        startBotMatch(queueSubject, queueGrade, queuePunctuationLevel);
        return;
      }
      if (matchedRef.current) return;
      const currentState = channel.presenceState();
      const entries = toQueueEntries(currentState, "3v3", queueSubject);
      const sortedLeaders = [...entries].sort(
        (a, b) => a.queuedAt - b.queuedAt || a.leaderId.localeCompare(b.leaderId)
      );
      const coordinator = sortedLeaders[0];
      if (!coordinator) {
        startBotMatch(queueSubject, queueGrade, queuePunctuationLevel);
        return;
      }

      if (coordinator.leaderId !== user.id) {
        setTimeout(() => {
          if (!matchedRef.current) startBotMatch(queueSubject, queueGrade, queuePunctuationLevel);
        }, 1200);
        return;
      }

      const participants = findEntriesBestAtMost(entries, user.id, 6);
      if (!participants) {
        startBotMatch(queueSubject, queueGrade, queuePunctuationLevel);
        return;
      }

      const mixedPlayers = buildMixedTeamsWithBots(participants, profile.rank_tier);
      const seed = generateMatchSeed();
      // Generate deterministic bot scores once so all players see the same match outcome
      const teamA = mixedPlayers.slice(0, 3);
      const teamB = mixedPlayers.slice(3, 6);
      const botResults = {
        teamA: teamA.map((p, i) =>
          p.isBot ? generateBotScore3v3Seeded(seed, i, p.rank_tier ?? profile.rank_tier) : null
        ),
        teamB: teamB.map((p, i) =>
          p.isBot ? generateBotScore3v3Seeded(seed, 3 + i, p.rank_tier ?? profile.rank_tier) : null
        ),
      };
      const payload = {
        to: participants.map((p) => p.leaderId),
        seed,
        players: mixedPlayers,
        botResults,
        ...(queueSubject === "punctuation" && queuePunctuationLevel != null && { punctuationLevel: queuePunctuationLevel }),
      };
      channel.send({
        type: "broadcast",
        event: "match-found-3v3",
        payload,
      });
      void apply3v3Match(payload.players, payload.seed, queueSubject, queueGrade, payload.botResults, payload.punctuationLevel ?? queuePunctuationLevel);
    }, mode === "3v3" ? THREE_VS_THREE_TIMEOUT_MS : MATCHMAKING_TIMEOUT_MS);
  }

  async function doQueue(queueSubject: Subject, queueGrade: VocabLevel | undefined, queuePunctuationLevel?: 1 | 2 | 3) {
    if (!canQueue) return;
    // 1v1 and 3v3 party flow: instant match with bots, broadcast so all party members get same game
    if ((mode === "1v1" || mode === "3v3") && members.length > 0 && user && isLeader) {
      const { opps, tms, seed, botResults } = matchWithBots(queueSubject, queueGrade, queuePunctuationLevel);
      if (botResults) {
        await broadcastPartyQueue(user.id, {
          mode,
          subject: queueSubject,
          vocabGrade: queueGrade,
          punctuationLevel: queuePunctuationLevel,
          seed,
          startedAt: getStartedAtFromSeed(seed),
          opponents: opps,
          teamMembers: tms,
          botResults,
        });
      }
      return;
    }
    await startSearch(queueSubject, queueGrade, queuePunctuationLevel);
  }

  function handleStartPunctuation() {
    setSubject("punctuation");
    setPhase("punctuation-level");
  }

  function handleStartWithPunctuationLevel(level: 1 | 2 | 3) {
    setPunctuationLevel(level);
    doQueue("punctuation", undefined, level);
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
    const playerAnswered = r.correct + r.incorrect;
    const is3v3Game = mode === "3v3" && opponents.length === 3;
    const elapsedMs = Math.max(0, Date.now() - gameStartTimeRef.current);
    playerFinishTimeRef.current = elapsedMs;
    setPlayerFinishMsState(elapsedMs);
    playerDoneRef.current = true;
    if (user) {
      remoteDoneRef.current[user.id] = true;
      setRemoteFinish(user.id, elapsedMs);
      setRemoteFinal(user.id, playerAnswered, r.score);
    }

    // Snap final bot scores immediately for non-3v3; 3v3 waits for full team completion.
    if (!is3v3Game && botResultsRef.current && botResultsRef.current.opponents.length > 0) {
      const { opponents: oppResults, teammates: tmResults } = botResultsRef.current;
      setOpponentScores(oppResults.map((b) => calculateScore(b.correct)));
      setOpponentAnswered(oppResults.map((b) => b.total));
      if (tmResults.length > 0) {
        setTeammateScores(tmResults.map((b) => calculateScore(b.correct)));
        setTeammateAnswered(tmResults.map((b) => b.total));
      }
    }

    if (user && hasHumanMatch && gameChannelRef.current) {
      try {
        gameChannelRef.current.send({
          type: "broadcast",
          event: "game-progress",
          payload: { matchSeed, userId: user.id, answered: playerAnswered, score: r.score, elapsedMs, finished: true },
        });
        gameChannelRef.current.send({
          type: "broadcast",
          event: "game-complete",
          payload: { matchSeed, userId: user.id, answered: playerAnswered, score: r.score, elapsedMs },
        });
      } catch {}
    }

    if (is3v3Game && playerAnswered >= THREE_VS_THREE_QUESTIONS) {
      setPhase("waiting");
    } else if (mode === "1v1" && hasHumanMatch && !opponents[0]?.isBot && playerAnswered >= ONE_VS_ONE_QUESTIONS) {
      setPhase("waiting");
    } else {
      // Timer ran out or 1v1
      setPhase("results");
    }

    if (user) {
      try {
        await syncCurrentProfile(user.id);
        setProfile(getProfile() ?? createGuestProfile());
      } catch (e) {
        console.error("[Casual] Trophy sync failed:", e);
        // Sync failed; local state is correct, Supabase will catch up on next load
      }
    }
  }

  function handlePlayAgain() {
    cleanupChannel();
    cleanupGameChannel();
    if (waitTimerRef.current) { clearTimeout(waitTimerRef.current); waitTimerRef.current = null; }
    matchedRef.current = false;
    setResult(null);
    setResultMetadata(undefined);
    setVocabGrade(undefined);
    setMatchSeed(null);
    setForceFinishSignal(0);
    setOpponents([]);
    setTeamMembers([]);
    setOpponentScores([]);
    setOpponentAnswered([]);
    setTeammateScores([]);
    setTeammateAnswered([]);
    setBotResults(null);
    playerFinishTimeRef.current = 0;
    setPlayerFinishMsState(0);
    playerDoneRef.current = false;
    decisionSentRef.current = false;
    remoteDoneRef.current = {};
    remoteFinishMsRef.current = {};
    setRemoteFinishMsState({});
    setRemoteFinalState({});
    setWaitElapsedMs(0);
    setPhase("select");
  }

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";

  const seededQuestions = useMemo(() => {
    if (!matchSeed) return undefined;
    const qs = getSeededQuestionsForMode(subject, matchSeed, 30, vocabGrade, subject === "punctuation" ? punctuationLevel : undefined);
    // PvP uses a fixed 15-question sprint; everyone answers the same set
    if (mode === "3v3") return qs.slice(0, THREE_VS_THREE_QUESTIONS);
    if (mode === "1v1") return qs.slice(0, ONE_VS_ONE_QUESTIONS);
    return qs;
  }, [matchSeed, mode, subject, vocabGrade, punctuationLevel]);

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
    const handleAnswerProgress = (answered: number, score: number) => {
      if (!user || !hasHumanMatch || !gameChannelRef.current) return;
      try {
        const elapsedMs = Math.max(0, Date.now() - gameStartTimeRef.current);
        gameChannelRef.current.send({
          type: "broadcast",
          event: "game-progress",
          payload: {
            matchSeed,
            userId: user.id,
            answered,
            score,
            elapsedMs,
            finished:
              (mode === "3v3" && answered >= THREE_VS_THREE_QUESTIONS) ||
              (mode === "1v1" && answered >= ONE_VS_ONE_QUESTIONS),
          },
        });
      } catch {}
    };

    return (
      <GameScreen
        mode="casual"
        subject={subject}
        onComplete={handleComplete}
        forceFinishSignal={forceFinishSignal}
        onAnswerProgress={handleAnswerProgress}
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

  // ── Waiting for other players to finish (3v3 + human 1v1) ──────────────────
  if (phase === "waiting") {
    if (mode === "1v1") {
      const opp = opponents[0];
      const oppSnapshot = opp ? remoteFinalState[opp.id] : undefined;
      const oppAnswered = oppSnapshot?.answered ?? (opponentAnswered[0] ?? 0);
      return (
        <main className={`min-h-[100dvh] ${bg} flex flex-col items-center justify-center px-6 overflow-x-hidden`}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <ThemeToggle />
            <GlobalNotificationBar />
          </div>
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <div className={`w-24 h-24 rounded-full border-4 ${light ? "border-[#E2E8F0]" : "border-white/20"} border-t-[#3B82F6] animate-spin`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <InkAvatar config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig} size="md" />
              </div>
            </div>
            <div>
              <h2 className={`text-xl font-extrabold ${text}`}>Waiting for opponent…</h2>
              <p className={`${textMuted} text-sm mt-1`}>
                You finished {ONE_VS_ONE_QUESTIONS}/{ONE_VS_ONE_QUESTIONS}. Resolving match.
              </p>
            </div>
            {opp && (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${light ? "bg-white border border-[#E2E8F0]" : "bg-[#1E293B] border border-white/10"}`}>
                <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...opp.avatar_config }} size="xs" className="shrink-0" />
                <p className={`text-xs font-bold flex-1 text-left truncate ${text}`}>{opp.username}{opp.isBot ? " BOT" : ""}</p>
                <span className="text-xs font-bold text-[#3B82F6]">{oppAnswered}/{ONE_VS_ONE_QUESTIONS}</span>
              </div>
            )}
          </div>
        </main>
      );
    }

    const br = botResultsState;
    const allOppBotsDone = !br || br.opponents.every((b) => waitElapsedMs >= (b.finishTimeMs ?? 60_000));
    const allTeamBotsDone = !br || br.teammates.every((b) => waitElapsedMs >= (b.finishTimeMs ?? 60_000));
    const allBotsDone = allOppBotsDone && allTeamBotsDone;
    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col items-center justify-center px-6 overflow-x-hidden`}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className={`w-24 h-24 rounded-full border-4 ${light ? "border-[#E2E8F0]" : "border-white/20"} border-t-[#34D399] animate-spin`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <InkAvatar config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig} size="md" />
            </div>
          </div>
          <div>
            <h2 className={`text-xl font-extrabold ${text}`}>
              {allBotsDone ? "Tallying scores…" : "Waiting for others to finish…"}
            </h2>
            <p className={`${textMuted} text-sm mt-1`}>
              You answered all {THREE_VS_THREE_QUESTIONS} questions!
            </p>
          </div>
          {br && (
            <div className="space-y-2">
              {opponents.map((opp, i) => {
                const botFinish = br.opponents[i]?.finishTimeMs ?? 60000;
                const done = waitElapsedMs >= botFinish;
                return (
                  <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${light ? "bg-white border border-[#E2E8F0]" : "bg-[#1E293B] border border-white/10"}`}>
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...opp.avatar_config }} size="xs" className="shrink-0" />
                    <p className={`text-xs font-bold flex-1 text-left truncate ${text}`}>{opp.username}{opp.isBot ? " BOT" : ""}</p>
                    <span className={`text-xs font-bold ${done ? "text-[#22C55E]" : "text-[#FBBF24]"}`}>
                      {done ? "Done" : "Playing…"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── Searching for opponent ──────────────────────────────────────────────────
  if (phase === "searching") {
    const accentColor = mode === "3v3" ? MINT : BLUE;
    const allFound = mode === "3v3" && playersFound >= 6;
    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col items-center justify-center px-6 overflow-x-hidden`}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>

        <div className="w-full max-w-sm text-center space-y-6">
          {/* Animated avatar ring */}
          <div className="relative mx-auto" style={{ width: 120, height: 120 }}>
            <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: "1.8s" }} viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke={light ? "#E2E8F0" : "rgba(255,255,255,0.08)"} strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={accentColor} strokeWidth="6"
                strokeDasharray="80 260" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}15`, border: `2px solid ${accentColor}30` }}>
                <InkAvatar config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig} size="md" />
              </div>
            </div>
          </div>

          {/* Status text */}
          <div>
            <h2 className={`text-xl font-extrabold ${text}`}>
              {allFound ? "Match found!" : `Searching for ${mode === "3v3" ? "players" : "opponent"}${searchDots}`}
            </h2>
            <p className={`text-sm font-semibold mt-1 ${textMuted}`}>
              {mode === "3v3" ? "3v3 Team Battle" : "1v1 Duel"} · {subject === "vocabulary" ? "Vocabulary" : "Punctuation"}
            </p>
          </div>

          {/* Player slots */}
          <div className={`rounded-2xl border p-4 ${cardBg} ${cardBorder}`}>
            {mode === "3v3" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${textMuted}`}>Players found</span>
                  <span className={`text-sm font-extrabold tabular-nums`} style={{ color: allFound ? MINT : accentColor }}>
                    {playersFound} / 6
                  </span>
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className={`w-full h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          i < playersFound
                            ? ""
                            : light ? "bg-[#F1F5F9]" : "bg-white/5"
                        }`}
                        style={i < playersFound ? { backgroundColor: `${accentColor}20`, border: `1.5px solid ${accentColor}60` } : {}}
                      >
                        {i < playersFound ? (
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
                        ) : (
                          <div className={`w-5 h-5 rounded-full ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`} />
                        )}
                      </div>
                      <span className={`text-[9px] font-bold ${i < playersFound ? "" : textMuted}`}
                        style={i < playersFound ? { color: accentColor } : {}}>
                        {i < 3 ? "A" : "B"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${BLUE}15`, border: `1.5px solid ${BLUE}40` }}>
                    <InkAvatar config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig} size="sm" />
                  </div>
                  <span className={`text-[10px] font-bold ${text} truncate max-w-[60px]`}>{profile?.username ?? "You"}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-extrabold" style={{ color: BLUE }}>VS</span>
                  <div className="w-0.5 h-6 rounded-full" style={{ backgroundColor: `${BLUE}30` }} />
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse ${light ? "bg-[#F1F5F9]" : "bg-white/5"}`}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={light ? "#CBD5E1" : "rgba(255,255,255,0.2)"} strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <span className={`text-[10px] font-bold ${textMuted}`}>Searching…</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { cleanupChannel(); setPhase("select"); }}
            className={`w-full py-3 rounded-2xl font-bold border transition-colors text-sm ${
              light ? "text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]" : "text-white/60 border-white/10 hover:bg-white/5"
            }`}
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
              {subject === "vocabulary" ? "Vocabulary" : "Punctuation"} Sprint ·{" "}
              {mode === "3v3" ? `${THREE_VS_THREE_QUESTIONS} questions` : "60 seconds"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "vocab-grade") {
    const gradeColors: Record<string, string> = {
      "3": "#34D399", "4": "#60A5FA", "5": "#A78BFA",
      "6": "#F97316", "7": "#EC4899", "8": "#EF4444",
      psat: "#FBBF24", sat: "#F43F5E",
    };
    const gradeEmojis: Record<string, string> = {
      "3": "🌱", "4": "📗", "5": "📘", "6": "📙",
      "7": "📕", "8": "🔥", psat: "⚡", sat: "🏆",
    };
    const defaultLabel = VOCAB_LEVELS.find((l) => l.level === profile?.vocab_grade)?.label ?? profile?.vocab_grade;
    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
        <header className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setPhase("select")}
            className={`flex items-center gap-1.5 text-sm font-bold ${textMuted} hover:opacity-80 transition-opacity`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${light ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#3B82F6]/20 text-[#60A5FA]"}`}>
            {mode} · Vocabulary
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <GlobalNotificationBar />
          </div>
        </header>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-5 py-6 flex flex-col gap-5">
          <div className="text-center">
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${text}`}>Pick Your Level</h1>
            <p className={`${textMuted} text-sm font-medium mt-1`}>Choose the grade that matches your skill</p>
          </div>

          {/* Quick-use default */}
          {profile?.vocab_grade && (
            <button
              onClick={handleUseDefault}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl font-extrabold text-white transition-all active:scale-[0.98] hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)`, boxShadow: `0 4px 16px ${BLUE}50` }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="white" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="flex-1 text-left">Use my default level</span>
              <span className="text-sm opacity-80 font-bold">{defaultLabel}</span>
            </button>
          )}

          {/* Grade grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {VOCAB_LEVELS.map(({ level, label }) => {
              const key = String(level);
              const color = gradeColors[key] ?? BLUE;
              const emoji = gradeEmojis[key] ?? "📚";
              const isDefault = profile?.vocab_grade === level;
              return (
                <button
                  key={key}
                  onClick={() => handleStartWithGrade(level)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 px-3 border-2 font-bold transition-all duration-150 active:scale-95`}
                  style={{
                    borderColor: isDefault ? color : (light ? "#E2E8F0" : "rgba(255,255,255,0.1)"),
                    backgroundColor: isDefault ? `${color}12` : (light ? "#ffffff" : "#1E293B"),
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 14px ${color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDefault ? color : (light ? "#E2E8F0" : "rgba(255,255,255,0.1)"); e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className={`text-sm font-extrabold ${text}`}>{label}</span>
                  {isDefault && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}25`, color }}>
                      default
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  if (phase === "punctuation-level") {
    const levelConfig: { level: 1 | 2 | 3; label: string; emoji: string; color: string; desc: string }[] = [
      { level: 1, label: "Beginner", emoji: "📝", color: "#34D399", desc: "Periods, commas, question marks" },
      { level: 2, label: "Intermediate", emoji: "✏️", color: "#60A5FA", desc: "Semicolons, colons, apostrophes" },
      { level: 3, label: "Advanced", emoji: "📌", color: "#A78BFA", desc: "Dashes, ellipses, complex rules" },
    ];
    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
        <header className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setPhase("select")}
            className={`flex items-center gap-1.5 text-sm font-bold ${textMuted} hover:opacity-80 transition-opacity`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${light ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#3B82F6]/20 text-[#60A5FA]"}`}>
            {mode} · Punctuation
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <GlobalNotificationBar />
          </div>
        </header>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-5 py-6 flex flex-col gap-5">
          <div className="text-center">
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${text}`}>Pick Punctuation Level</h1>
            <p className={`${textMuted} text-sm font-medium mt-1`}>Choose the difficulty that matches your skill</p>
          </div>

          <div className="flex flex-col gap-3">
            {levelConfig.map(({ level, label, emoji, color, desc }) => {
              const isSelected = punctuationLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => handleStartWithPunctuationLevel(level)}
                  className={`relative flex items-center gap-4 rounded-2xl px-5 py-4 border-2 font-bold transition-all duration-150 active:scale-[0.98] text-left`}
                  style={{
                    borderColor: isSelected ? color : (light ? "#E2E8F0" : "rgba(255,255,255,0.1)"),
                    backgroundColor: isSelected ? `${color}12` : (light ? "#ffffff" : "#1E293B"),
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 14px ${color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = isSelected ? color : (light ? "#E2E8F0" : "rgba(255,255,255,0.1)"); e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span className="text-2xl leading-none">{emoji}</span>
                  <div className="flex-1">
                    <span className={`block text-base font-extrabold ${text}`}>{label}</span>
                    <span className={`block text-xs font-medium ${textMuted} mt-0.5`}>{desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  if (phase === "results" && result) {
    const br = botResultsState;
    const hasBotResults = !!br && br.opponents.length > 0;
    const is3v3 = mode === "3v3" && opponents.length === 3 && teamMembers.length === 2;

    function matchupWinner(
      allyCorrect: number,
      oppCorrect: number
    ): "ally" | "opp" | "tie" {
      if (allyCorrect !== oppCorrect) return allyCorrect > oppCorrect ? "ally" : "opp";
      return "tie";
    }

    const playerCorrect = result.correct;

    // 3v3: individual matchups (best of 3). Use bot results for bots, opponentScores for humans.
    const matchups = is3v3
      ? (() => {
          const allyScore0 = result.score;
          const allyCorrect0 = playerCorrect;
          const oppHuman0 = remoteFinalState[opponents[0].id];
          const oppCorrect0 = opponents[0].isBot && br?.opponents[0]
            ? br.opponents[0].correct
            : oppHuman0
            ? oppHuman0.answered
            : Math.round((opponentScores[0] ?? 0) / 10);
          const oppScore0 = opponents[0].isBot && br?.opponents[0]
            ? calculateScore(br.opponents[0].correct)
            : oppHuman0
            ? oppHuman0.score
            : (opponentScores[0] ?? 0);
          const w0 = matchupWinner(allyCorrect0, oppCorrect0);

          const allyHuman1Id = teamMembers[0]?.id;
          const allyHuman1 = allyHuman1Id ? remoteFinalState[allyHuman1Id] : undefined;
          const allyCorrect1 = teamMembers[0]?.isBot && br?.teammates[0]
            ? br.teammates[0].correct
            : allyHuman1
            ? allyHuman1.answered
            : Math.round((teammateScores[0] ?? 0) / 10);
          const allyScore1 = teamMembers[0]?.isBot && br?.teammates[0]
            ? calculateScore(br.teammates[0].correct)
            : allyHuman1
            ? allyHuman1.score
            : (teammateScores[0] ?? 0);
          const oppHuman1 = remoteFinalState[opponents[1].id];
          const oppCorrect1 = opponents[1].isBot && br?.opponents[1]
            ? br.opponents[1].correct
            : oppHuman1
            ? oppHuman1.answered
            : Math.round((opponentScores[1] ?? 0) / 10);
          const oppScore1 = opponents[1].isBot && br?.opponents[1]
            ? calculateScore(br.opponents[1].correct)
            : oppHuman1
            ? oppHuman1.score
            : (opponentScores[1] ?? 0);
          const w1 = matchupWinner(allyCorrect1, oppCorrect1);

          const allyHuman2Id = teamMembers[1]?.id;
          const allyHuman2 = allyHuman2Id ? remoteFinalState[allyHuman2Id] : undefined;
          const allyCorrect2 = teamMembers[1]?.isBot && br?.teammates[1]
            ? br.teammates[1].correct
            : allyHuman2
            ? allyHuman2.answered
            : Math.round((teammateScores[1] ?? 0) / 10);
          const allyScore2 = teamMembers[1]?.isBot && br?.teammates[1]
            ? calculateScore(br.teammates[1].correct)
            : allyHuman2
            ? allyHuman2.score
            : (teammateScores[1] ?? 0);
          const oppHuman2 = remoteFinalState[opponents[2].id];
          const oppCorrect2 = opponents[2].isBot && br?.opponents[2]
            ? br.opponents[2].correct
            : oppHuman2
            ? oppHuman2.answered
            : Math.round((opponentScores[2] ?? 0) / 10);
          const oppScore2 = opponents[2].isBot && br?.opponents[2]
            ? calculateScore(br.opponents[2].correct)
            : oppHuman2
            ? oppHuman2.score
            : (opponentScores[2] ?? 0);
          const w2 = matchupWinner(allyCorrect2, oppCorrect2);

          return [
            {
              allyName: profile?.username ?? "You",
              allyAvatar: (profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig,
              allyScore: allyScore0,
              allyCorrect: allyCorrect0,
              allyIsPlayer: true,
              oppName: opponents[0].username,
              oppAvatar: opponents[0].avatar_config,
              oppIsBot: opponents[0].isBot,
              oppScore: oppScore0,
              oppCorrect: oppCorrect0,
              winner: w0,
            },
            {
              allyName: teamMembers[0]?.username ?? "Teammate 1",
              allyAvatar: teamMembers[0]?.avatar_config ?? DEFAULT_AVATAR_CONFIG,
              allyScore: allyScore1,
              allyCorrect: allyCorrect1,
              allyIsPlayer: false,
              oppName: opponents[1].username,
              oppAvatar: opponents[1].avatar_config,
              oppIsBot: opponents[1].isBot,
              oppScore: oppScore1,
              oppCorrect: oppCorrect1,
              winner: w1,
            },
            {
              allyName: teamMembers[1]?.username ?? "Teammate 2",
              allyAvatar: teamMembers[1]?.avatar_config ?? DEFAULT_AVATAR_CONFIG,
              allyScore: allyScore2,
              allyCorrect: allyCorrect2,
              allyIsPlayer: false,
              oppName: opponents[2].username,
              oppAvatar: opponents[2].avatar_config,
              oppIsBot: opponents[2].isBot,
              oppScore: oppScore2,
              oppCorrect: oppCorrect2,
              winner: w2,
            },
          ];
        })()
      : [];

    const matchupsWon = matchups.filter((m) => m.winner === "ally").length;
    const matchupsLost = matchups.filter((m) => m.winner === "opp").length;

    // 1v1: more correct wins; if tied, faster finish wins; exact tie stays draw.
    // 3v3: best-of-3 matchups.
    let youWin: boolean;
    let youLose: boolean;
    if (is3v3) {
      youWin = matchupsWon >= 2;
      youLose = matchupsLost >= 2;
    } else {
      const yourCorrect = result.correct;
      const yourElapsedMs = playerFinishMsState;
      const oppId = opponents[0]?.id;
      const oppSnapshot = oppId ? remoteFinalState[oppId] : undefined;
      const theirScore = hasBotResults && br
        ? calculateScore(br.opponents[0].correct)
        : oppSnapshot
        ? oppSnapshot.score
        : opponentScores[0] ?? 0;
      const theirCorrect = hasBotResults && br
        ? br.opponents[0].correct
        : oppSnapshot
        ? Math.round(oppSnapshot.score / 10)
        : Math.round(theirScore / 10);
      const theirElapsedMs = oppId ? (remoteFinishMsState[oppId] ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

      if (yourCorrect > theirCorrect) {
        youWin = true;
        youLose = false;
      } else if (yourCorrect < theirCorrect) {
        youWin = false;
        youLose = true;
      } else if (yourElapsedMs < theirElapsedMs) {
        youWin = true;
        youLose = false;
      } else if (yourElapsedMs > theirElapsedMs) {
        youWin = false;
        youLose = true;
      } else {
        youWin = false;
        youLose = false;
      }
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
                  <p className={`text-xs ${textMuted}`}>Best of 3 — {matchupsWon} won · {matchupsLost} lost · winner by most correct ({THREE_VS_THREE_QUESTIONS} q)</p>
                </div>
                <div className="space-y-2">
                  {matchups.map((m, i) => {
                    const allyWon = m.winner === "ally";
                    const oppWon = m.winner === "opp";
                    const tied = m.winner === "tie";
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
                            <p className={`text-sm font-extrabold ${allyWon ? "text-[#22C55E]" : text}`}>
                              {m.allyCorrect}/{THREE_VS_THREE_QUESTIONS}
                            </p>
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
                            <p className={`text-sm font-extrabold ${oppWon ? "text-[#EF4444]" : text}`}>
                              {m.oppCorrect}/{THREE_VS_THREE_QUESTIONS}
                            </p>
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

  // Static preview avatars for mode card illustrations
  const DEMO_BOTS: InkAvatarConfig[] = [
    { base: "droplet_01", color: "#94A3B8", eyes: "eyes_02", accessory: "headband_01", aura: "none" },
    { base: "droplet_02", color: "#D4AF37", eyes: "eyes_02", accessory: "crown_01",    aura: "none" },
    { base: "droplet_03", color: "#3B82F6", eyes: "eyes_05", accessory: "none",        aura: "none" },
    { base: "droplet_01", color: "#34D399", eyes: "eyes_03", accessory: "none",        aura: "none" },
    { base: "droplet_01", color: "#F97316", eyes: "eyes_04", accessory: "none",        aura: "none" },
  ];

  const modeAccent = mode === "1v1" ? BLUE : MINT;

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className="flex items-center justify-between px-5 py-4">
        <Link href="/" className={`flex items-center gap-1.5 text-sm font-bold ${textMuted} hover:opacity-80 transition-opacity`}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${light ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#3B82F6]/20 text-[#60A5FA]"}`}>
          Casual
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <GlobalNotificationBar />
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-5 py-6 flex flex-col gap-6">

        {/* Title */}
        <div className="text-center">
          <h1 className={`text-2xl sm:text-3xl font-extrabold ${text} leading-tight`}>
            Choose Your Battle
          </h1>
          <p className={`${textMuted} text-sm mt-1`}>No rank on the line · Pure glory</p>
        </div>

        {/* Party bar */}
        {members.length > 0 && (
          <div className={`rounded-xl px-4 py-2.5 flex items-center gap-3 ${cardBg} border ${cardBorder}`}>
            <div className="flex -space-x-2">
              {members.slice(0, 4).map((m, i) => (
                <div key={i} className={`ring-2 ${light ? "ring-white" : "ring-[#0F172A]"} rounded-full`}>
                  <InkAvatar
                    config={{ ...DEFAULT_AVATAR_CONFIG, ...(m.avatar_config as Partial<InkAvatarConfig>) } as InkAvatarConfig}
                    size={24}
                  />
                </div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${text}`}>Party · {members.length} member{members.length !== 1 ? "s" : ""}</p>
              {!isLeader && <p className="text-[10px] text-amber-500 font-semibold">Only the party leader can queue</p>}
              {isLeader && !canQueue1v1 && mode === "1v1" && (
                <p className="text-[10px] text-amber-500 font-semibold">Party too large for 1v1</p>
              )}
            </div>
          </div>
        )}

        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-3">

          {/* 1v1 card */}
          <button
            onClick={() => setMode("1v1")}
            className={`relative rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.98] ${
              mode === "1v1"
                ? ""
                : light ? "opacity-70 hover:opacity-90" : "opacity-60 hover:opacity-80"
            }`}
            style={{
              border: `2px solid ${mode === "1v1" ? BLUE : (light ? "#E2E8F0" : "rgba(255,255,255,0.08)")}`,
              backgroundColor: mode === "1v1"
                ? light ? `${BLUE}08` : `${BLUE}15`
                : light ? "#ffffff" : "#1E293B",
              boxShadow: mode === "1v1" ? `0 0 24px ${BLUE}35, 0 4px 16px rgba(0,0,0,0.1)` : "none",
            }}
          >
            {/* Selected checkmark */}
            {mode === "1v1" && (
              <div
                className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                style={{ backgroundColor: BLUE }}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            {/* Avatar art */}
            <div className="relative flex items-end justify-center pt-5 pb-2 gap-1 min-h-[90px]">
              {/* Glow */}
              {mode === "1v1" && (
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 100%, ${BLUE} 0%, transparent 70%)` }}
                />
              )}
              {/* Your avatar */}
              <div className="flex flex-col items-center gap-0.5">
                <InkAvatar
                  config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig}
                  size={42}
                />
              </div>
              {/* VS badge */}
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mb-1 font-extrabold text-[10px] text-white z-10"
                style={{ backgroundColor: mode === "1v1" ? BLUE : (light ? "#CBD5E1" : "#334155") }}
              >
                VS
              </div>
              {/* Mystery opponent */}
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className="rounded-2xl flex items-center justify-center"
                  style={{
                    width: 42, height: 42,
                    backgroundColor: mode === "1v1" ? `${BLUE}15` : (light ? "#F1F5F9" : "rgba(255,255,255,0.06)"),
                    border: `1.5px dashed ${mode === "1v1" ? `${BLUE}50` : (light ? "#CBD5E1" : "rgba(255,255,255,0.15)")}`,
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={mode === "1v1" ? BLUE : (light ? "#94A3B8" : "rgba(255,255,255,0.3)")} strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="px-3 pb-3">
              <p className={`text-base font-extrabold ${text} leading-tight`}>1v1 Duel</p>
              <p className={`text-[11px] font-semibold mt-0.5 ${textMuted}`}>60 seconds</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${BLUE}20`, color: BLUE }}
                >
                  1 opponent
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${BLUE}20`, color: BLUE }}
                >
                  Best score
                </span>
              </div>
            </div>
          </button>

          {/* 3v3 card */}
          <button
            onClick={() => setMode("3v3")}
            className={`relative rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.98] ${
              mode === "3v3"
                ? ""
                : light ? "opacity-70 hover:opacity-90" : "opacity-60 hover:opacity-80"
            }`}
            style={{
              border: `2px solid ${mode === "3v3" ? MINT : (light ? "#E2E8F0" : "rgba(255,255,255,0.08)")}`,
              backgroundColor: mode === "3v3"
                ? light ? `${MINT}08` : `${MINT}15`
                : light ? "#ffffff" : "#1E293B",
              boxShadow: mode === "3v3" ? `0 0 24px ${MINT}35, 0 4px 16px rgba(0,0,0,0.1)` : "none",
            }}
          >
            {mode === "3v3" && (
              <div
                className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                style={{ backgroundColor: MINT }}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            {/* Avatar art — two teams */}
            <div className="relative flex items-end justify-center pt-5 pb-2 gap-1.5 min-h-[90px]">
              {mode === "3v3" && (
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 100%, ${MINT} 0%, transparent 70%)` }}
                />
              )}
              {/* Team A: 3 inklings stacked */}
              <div className="flex flex-col items-center gap-0.5">
                {[
                  (profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig,
                  DEMO_BOTS[0],
                  DEMO_BOTS[1],
                ].map((cfg, i) => (
                  <div
                    key={i}
                    style={{
                      transform: `scale(${i === 0 ? 1 : 0.72})`,
                      transformOrigin: "center",
                      marginBottom: i < 2 ? -8 : 0,
                      opacity: i === 0 ? 1 : 0.75,
                      zIndex: 3 - i,
                    }}
                  >
                    <InkAvatar config={cfg} size={30} />
                  </div>
                ))}
              </div>
              {/* VS */}
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mb-2 font-extrabold text-[10px] text-white z-10"
                style={{ backgroundColor: mode === "3v3" ? MINT : (light ? "#CBD5E1" : "#334155") }}
              >
                VS
              </div>
              {/* Team B: 3 mystery opponents */}
              <div className="flex flex-col items-center gap-0.5">
                {[DEMO_BOTS[2], DEMO_BOTS[3], DEMO_BOTS[4]].map((cfg, i) => (
                  <div
                    key={i}
                    style={{
                      transform: `scale(${i === 0 ? 1 : 0.72})`,
                      transformOrigin: "center",
                      marginBottom: i < 2 ? -8 : 0,
                      opacity: i === 0 ? 1 : 0.75,
                      zIndex: 3 - i,
                    }}
                  >
                    <InkAvatar config={cfg} size={30} />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-3 pb-3">
              <p className={`text-base font-extrabold ${text} leading-tight`}>3v3 Battle</p>
              <p className={`text-[11px] font-semibold mt-0.5 ${textMuted}`}>15 questions</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${MINT}20`, color: MINT }}
                >
                  Team of 3
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${MINT}20`, color: MINT }}
                >
                  Best of 3
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Divider + subject label */}
        <div className="flex items-center gap-3">
          <div className={`flex-1 h-px ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`} />
          <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Pick a subject</p>
          <div className={`flex-1 h-px ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`} />
        </div>

        {/* Subject + play buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleStartVocab}
            disabled={!canQueue}
            className={`group relative flex items-center gap-4 rounded-2xl px-5 py-4 border-2 text-left transition-all duration-200 disabled:opacity-50 active:scale-[0.98]`}
            style={{
              borderColor: light ? "#E2E8F0" : "rgba(255,255,255,0.1)",
              backgroundColor: light ? "#ffffff" : "#1E293B",
            }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 16px ${BLUE}25`; }}}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = light ? "#E2E8F0" : "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${BLUE}18` }}
            >
              <BookIcon className="w-6 h-6" color={BLUE} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-extrabold text-base ${text}`}>Vocabulary</p>
              <p className={`text-xs font-semibold ${textMuted}`}>Definitions, synonyms, context clues</p>
            </div>
            <div
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-0.5"
              style={{ backgroundColor: `${BLUE}18` }}
            >
              <svg viewBox="0 0 20 20" fill={BLUE} className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </div>
          </button>

          <button
            onClick={handleStartPunctuation}
            disabled={!canQueue}
            className={`group relative flex items-center gap-4 rounded-2xl px-5 py-4 border-2 text-left transition-all duration-200 disabled:opacity-50 active:scale-[0.98]`}
            style={{
              borderColor: light ? "#E2E8F0" : "rgba(255,255,255,0.1)",
              backgroundColor: light ? "#ffffff" : "#1E293B",
            }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = MINT; e.currentTarget.style.boxShadow = `0 0 16px ${MINT}25`; }}}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = light ? "#E2E8F0" : "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${MINT}18` }}
            >
              <PencilIcon className="w-6 h-6" color={MINT} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-extrabold text-base ${text}`}>Punctuation</p>
              <p className={`text-xs font-semibold ${textMuted}`}>Commas, apostrophes, quotes</p>
            </div>
            <div
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-0.5"
              style={{ backgroundColor: `${MINT}18` }}
            >
              <svg viewBox="0 0 20 20" fill={MINT} className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        </div>

        {/* Can't queue message */}
        {!canQueue && (
          <p className={`text-center text-sm font-semibold ${textMuted}`}>
            {!isLeader && members.length > 0
              ? "Only the party leader can queue"
              : mode === "1v1"
                ? "Leave party or reduce to 2 players to queue 1v1"
                : "Invite friends to fill your party — bots fill empty slots"}
          </p>
        )}

        {/* Mode detail footer */}
        <div
          className={`rounded-xl px-4 py-3 flex items-center gap-3 border`}
          style={{
            borderColor: `${modeAccent}25`,
            backgroundColor: `${modeAccent}08`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${modeAccent}20` }}
          >
            {mode === "1v1" ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={modeAccent} strokeWidth="2">
                <circle cx="9" cy="7" r="4" />
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={modeAccent} strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )}
          </div>
          <p className={`text-xs font-semibold ${textMuted}`}>
            {mode === "1v1"
              ? "Head-to-head duel. Answer as many questions as possible in 60 seconds. Highest score wins."
              : "3 vs 3 team battle. Each player answers up to 15 questions. Best of 3 matchups decides the winner."}
          </p>
        </div>
      </div>
    </main>
  );
}
