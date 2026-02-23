"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { VOCAB_LEVEL_LABELS, getSeededQuestionsForMode } from "@/lib/game/questions";
import { generateMatchSeed } from "@/lib/game/matchmaking";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { createGuestProfile, getProfile, INITIAL_PROFILE } from "@/lib/user/storage";
import { BLUE, MINT, DISPLAY_FONT, BODY_FONT } from "@/lib/design-tokens";
import GameScreen from "@/components/GameScreen";
import InkAvatar from "@/components/InkAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalNotificationBar from "@/components/GlobalNotificationBar";
import type { GameResult, InkAvatarConfig, Question, VocabLevel, Subject, PunctuationLevel } from "@/types";

type Phase = "entry" | "lobby" | "countdown" | "playing" | "hosting" | "results";

interface ClassroomPlayer {
  id: string;
  username: string;
  avatar_config: InkAvatarConfig;
  isHost: boolean;
  joinedAt: number;
}

interface StartPayload {
  seed: string;
  startedAt: number;
  questionCount: number;
  subject: Subject;
  vocabLevel: VocabLevel;
  punctuationLevel: PunctuationLevel;
  hostPlays: boolean;
}

interface ScorePayload {
  seed: string;
  playerId: string;
  username: string;
  avatar_config: InkAvatarConfig;
  score: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  finishedAt: number;
}

type ControlPayload =
  | { action: "kick"; targetId: string; by: string }
  | { action: "lock"; locked: boolean; by: string }
  | { action: "end-match"; seed: string; by: string }
  | { action: "recreate-lobby"; by: string };

const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

const MAX_CLASSROOM_PLAYERS = 30;
const CLASSROOM_CODE_LEN = 6;
const QUESTION_COUNT = 30;
const PREMATCH_DELAY_MS = 4000;
const CLASSROOM_START_EVENT = "classroom_start";
const CLASSROOM_SCORE_EVENT = "classroom_score";
const CLASSROOM_CONTROL_EVENT = "classroom_control";
const DEFAULT_VOCAB_LEVEL: VocabLevel = 5;
const DEFAULT_SUBJECT: Subject = "vocabulary";
const DEFAULT_PUNCTUATION_LEVEL: PunctuationLevel = 2;
const VOCAB_OPTIONS: VocabLevel[] = [3, 4, 5, 6, 7, "english1", "english2", "english3", "ap-lang", "ap-lit"];
const PUNCTUATION_LEVEL_LABELS: Record<PunctuationLevel, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};
const PUNCTUATION_OPTIONS: PunctuationLevel[] = [1, 2, 3];

function generateClassroomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < CLASSROOM_CODE_LEN; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function normalizeCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CLASSROOM_CODE_LEN);
}

function parsePresenceState(
  state: Record<string, Array<Record<string, unknown>>>
): ClassroomPlayer[] {
  const players: ClassroomPlayer[] = [];
  for (const metas of Object.values(state)) {
    for (const meta of metas) {
      const id = typeof meta.id === "string" ? meta.id : "";
      const username = typeof meta.username === "string" ? meta.username : "Player";
      const avatar_config = (meta.avatar_config ?? {}) as InkAvatarConfig;
      const isHost = Boolean(meta.isHost);
      const joinedAt = typeof meta.joinedAt === "number" ? meta.joinedAt : Date.now();
      if (!id) continue;
      players.push({ id, username, avatar_config, isHost, joinedAt });
    }
  }

  const deduped = new Map<string, ClassroomPlayer>();
  for (const p of players) {
    const prev = deduped.get(p.id);
    if (!prev || p.joinedAt < prev.joinedAt) deduped.set(p.id, p);
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return a.joinedAt - b.joinedAt;
  });
}

function placementLabel(position: number, total: number): string {
  const ratio = total > 0 ? position / total : 1;
  if (ratio <= 0.1) return "Crown";
  if (ratio <= 0.35) return "Elite";
  if (ratio <= 0.7) return "Survived";
  return "Eliminated";
}

function isVocabLevel(value: unknown): value is VocabLevel {
  if (typeof value === "number") return value >= 3 && value <= 7;
  return value === "english1" || value === "english2" || value === "english3" || value === "ap-lang" || value === "ap-lit";
}

function parseVocabLevel(value: string): VocabLevel {
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && isVocabLevel(asNumber)) return asNumber;
  return isVocabLevel(value) ? value : DEFAULT_VOCAB_LEVEL;
}

function parsePunctuationLevel(value: string): PunctuationLevel {
  const asNumber = Number(value);
  if (asNumber === 1 || asNumber === 3) return asNumber;
  return DEFAULT_PUNCTUATION_LEVEL;
}

function parseHostSettings(
  state: Record<string, Array<Record<string, unknown>>>
): { roomLocked: boolean; vocabLevel: VocabLevel; subject: Subject; punctuationLevel: PunctuationLevel; hostPlays: boolean } {
  for (const metas of Object.values(state)) {
    for (const meta of metas) {
      if (!meta.isHost) continue;
      const roomLocked = Boolean(meta.roomLocked);
      const vocabLevel = isVocabLevel(meta.selectedVocab) ? meta.selectedVocab : DEFAULT_VOCAB_LEVEL;
      const subject: Subject = meta.selectedSubject === "punctuation" ? "punctuation" : "vocabulary";
      const punctuationLevel: PunctuationLevel = meta.selectedPunctuation === 1 || meta.selectedPunctuation === 3 ? meta.selectedPunctuation : 2;
      const hostPlays = typeof meta.hostPlays === "boolean" ? meta.hostPlays : true;
      return { roomLocked, vocabLevel, subject, punctuationLevel, hostPlays };
    }
  }
  return {
    roomLocked: false,
    vocabLevel: DEFAULT_VOCAB_LEVEL,
    subject: DEFAULT_SUBJECT,
    punctuationLevel: DEFAULT_PUNCTUATION_LEVEL,
    hostPlays: true,
  };
}

export default function ClassroomPage() {
  const { user } = useAuth();
  const { light } = useTheme();
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [phase, setPhase] = useState<Phase>("entry");
  const [joinCode, setJoinCode] = useState("");
  const [classroomCode, setClassroomCode] = useState("");
  const [players, setPlayers] = useState<ClassroomPlayer[]>([]);
  const [scores, setScores] = useState<Record<string, ScorePayload>>({});
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(DEFAULT_SUBJECT);
  const [selectedVocab, setSelectedVocab] = useState<VocabLevel>(DEFAULT_VOCAB_LEVEL);
  const [selectedPunctuation, setSelectedPunctuation] = useState<PunctuationLevel>(DEFAULT_PUNCTUATION_LEVEL);
  const [hostPlays, setHostPlays] = useState(true);
  const [roomLocked, setRoomLocked] = useState(false);
  const [forceFinishSignal, setForceFinishSignal] = useState(0);
  const [waitingForTeacherReset, setWaitingForTeacherReset] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSeedRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("entry");
  const joinedAtRef = useRef<number>(0);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    const p = getProfile() ?? createGuestProfile();
    setProfile(p);
  }, []);

  const playerId = useMemo(() => user?.id ?? profile.id ?? "guest", [user?.id, profile.id]);
  const playerName = useMemo(() => {
    if (profile.username && profile.username.trim()) return profile.username.trim();
    if (user?.email) return user.email.split("@")[0];
    return "Guest";
  }, [profile.username, user?.email]);
  const playerAvatar = useMemo<InkAvatarConfig>(
    () => ({ ...profile.avatar_config }),
    [profile.avatar_config]
  );

  const cleanupTimers = useCallback(() => {
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const cleanupChannel = useCallback(() => {
    cleanupTimers();
    if (channelRef.current) {
      try {
        createClient().removeChannel(channelRef.current);
      } catch {}
      channelRef.current = null;
    }
    isSubscribedRef.current = false;
  }, [cleanupTimers]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => cleanupChannel();
  }, [cleanupChannel]);

  const resetRoomState = useCallback(() => {
    cleanupTimers();
    activeSeedRef.current = null;
    setScores({});
    setResult(null);
    setQuestions([]);
    setCountdown(0);
    setForceFinishSignal(0);
  }, [cleanupTimers]);

  const trackSelfPresence = useCallback(() => {
    if (!channelRef.current || !isSubscribedRef.current) return;
    channelRef.current.track({
      id: playerId,
      username: playerName,
      avatar_config: playerAvatar,
      isHost,
      joinedAt: joinedAtRef.current,
      roomLocked: isHost ? roomLocked : undefined,
      selectedSubject: isHost ? selectedSubject : undefined,
      selectedVocab: isHost ? selectedVocab : undefined,
      selectedPunctuation: isHost ? selectedPunctuation : undefined,
      hostPlays: isHost ? hostPlays : undefined,
    });
  }, [hostPlays, isHost, playerAvatar, playerId, playerName, roomLocked, selectedSubject, selectedVocab, selectedPunctuation]);

  const enterLobby = useCallback(
    async (code: string, host: boolean) => {
      if (!isSupabaseConfigured) {
        setError("Classroom mode needs Supabase realtime to be configured.");
        return;
      }

      const normalized = normalizeCode(code);
      if (normalized.length !== CLASSROOM_CODE_LEN) {
        setError("Classroom code must be 6 characters.");
        return;
      }

      cleanupChannel();
      resetRoomState();
      setError(null);
      setCopied(false);
      setClassroomCode(normalized);
      setIsHost(host);
      setRoomLocked(false);
      setSelectedSubject(DEFAULT_SUBJECT);
      setSelectedVocab(DEFAULT_VOCAB_LEVEL);
      setSelectedPunctuation(DEFAULT_PUNCTUATION_LEVEL);
      setHostPlays(true);
      setWaitingForTeacherReset(false);
      setPhase("lobby");
      joinedAtRef.current = Date.now();

      const supabase = createClient();
      const channel = supabase.channel(`classroom:${normalized}`, {
        config: { presence: { key: playerId } },
      });

      channelRef.current = channel;

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, Array<Record<string, unknown>>>;
        const parsed = parsePresenceState(state);
        const hostSettings = parseHostSettings(state);
        const amInRoom = parsed.some((p) => p.id === playerId);

        if (!host && parsed.length > MAX_CLASSROOM_PLAYERS && amInRoom) {
          cleanupChannel();
          setPhase("entry");
          setError("That classroom is full (30 players max).");
          return;
        }

        if (
          parsed.length > 0 &&
          !parsed.some((p) => p.isHost) &&
          phaseRef.current !== "playing" &&
          phaseRef.current !== "results"
        ) {
          cleanupChannel();
          setPhase("entry");
          setError("The host ended this classroom.");
          return;
        }

        setRoomLocked(hostSettings.roomLocked);
        setSelectedSubject(hostSettings.subject);
        setSelectedVocab(hostSettings.vocabLevel);
        setSelectedPunctuation(hostSettings.punctuationLevel);
        setHostPlays(hostSettings.hostPlays);
        setPlayers(parsed.slice(0, MAX_CLASSROOM_PLAYERS));
      });

      channel.on("broadcast", { event: CLASSROOM_START_EVENT }, (msg: { payload?: StartPayload }) => {
        const payload = msg.payload;
        if (!payload?.seed || typeof payload.startedAt !== "number") return;

        if (payload.seed === activeSeedRef.current) {
          return;
        }

        activeSeedRef.current = payload.seed;
        setScores({});
        setResult(null);
        const subject: Subject = payload.subject === "punctuation" ? "punctuation" : "vocabulary";
        const punctuationLevel: PunctuationLevel =
          payload.punctuationLevel === 1 || payload.punctuationLevel === 3 ? payload.punctuationLevel : DEFAULT_PUNCTUATION_LEVEL;
        setSelectedSubject(subject);
        setSelectedVocab(payload.vocabLevel);
        setSelectedPunctuation(punctuationLevel);
        setHostPlays(payload.hostPlays);
        if (isHost && !payload.hostPlays) {
          setQuestions([]);
        } else {
          setQuestions(
            getSeededQuestionsForMode(
              subject,
              payload.seed,
              payload.questionCount,
              payload.vocabLevel,
              punctuationLevel
            )
          );
        }

        const delay = Math.max(0, payload.startedAt - Date.now());
        setPhase("countdown");
        setCountdown(Math.max(1, Math.ceil(delay / 1000)));

        cleanupTimers();
        countdownTimerRef.current = setInterval(() => {
          const remaining = Math.ceil((payload.startedAt - Date.now()) / 1000);
          setCountdown(Math.max(0, remaining));
        }, 200);

        playTimerRef.current = setTimeout(() => {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setPhase(isHost && !payload.hostPlays ? "hosting" : "playing");
        }, delay);
      });

      channel.on("broadcast", { event: CLASSROOM_SCORE_EVENT }, (msg: { payload?: ScorePayload }) => {
        const payload = msg.payload;
        if (!payload || !payload.seed || !payload.playerId) return;
        if (activeSeedRef.current && payload.seed !== activeSeedRef.current) return;
        setScores((prev) => ({ ...prev, [payload.playerId]: payload }));
      });

      channel.on("broadcast", { event: CLASSROOM_CONTROL_EVENT }, (msg: { payload?: ControlPayload }) => {
        const payload = msg.payload;
        if (!payload) return;

        if (payload.action === "kick" && payload.targetId === playerId) {
          cleanupChannel();
          resetRoomState();
          setPlayers([]);
          setClassroomCode("");
          setJoinCode("");
          setPhase("entry");
          setIsHost(false);
          setError("The host removed you from this classroom.");
          return;
        }

        if (payload.action === "lock") {
          setRoomLocked(payload.locked);
          return;
        }

        if (payload.action === "end-match") {
          if (payload.seed && activeSeedRef.current && payload.seed !== activeSeedRef.current) return;
          if (phaseRef.current === "playing") {
            setForceFinishSignal((prev) => prev + 1);
          } else if (phaseRef.current === "hosting") {
            setPhase("results");
          } else if (phaseRef.current === "countdown") {
            resetRoomState();
            setPhase("lobby");
          }
          return;
        }

        if (payload.action === "recreate-lobby") {
          setWaitingForTeacherReset(false);
          resetRoomState();
          setPhase("lobby");
        }
      });

      channel.subscribe(async (status: string) => {
        if (status !== "SUBSCRIBED") return;
        isSubscribedRef.current = true;
        const state = channel.presenceState() as Record<string, Array<Record<string, unknown>>>;
        const existing = parsePresenceState(state);
        const hostSettings = parseHostSettings(state);
        if (!host && existing.length >= MAX_CLASSROOM_PLAYERS) {
          cleanupChannel();
          setPhase("entry");
          setError("That classroom is full (30 players max).");
          return;
        }
        if (!host && hostSettings.roomLocked) {
          cleanupChannel();
          setPhase("entry");
          setError("This classroom is locked by the host.");
          return;
        }
        if (!host) {
          setSelectedSubject(hostSettings.subject);
          setSelectedVocab(hostSettings.vocabLevel);
          setSelectedPunctuation(hostSettings.punctuationLevel);
          setRoomLocked(hostSettings.roomLocked);
          setHostPlays(hostSettings.hostPlays);
        }
        await channel.track({
          id: playerId,
          username: playerName,
          avatar_config: playerAvatar,
          isHost: host,
          joinedAt: joinedAtRef.current,
          roomLocked: host ? false : undefined,
          selectedSubject: host ? DEFAULT_SUBJECT : undefined,
          selectedVocab: host ? DEFAULT_VOCAB_LEVEL : undefined,
          selectedPunctuation: host ? DEFAULT_PUNCTUATION_LEVEL : undefined,
          hostPlays: host ? true : undefined,
        });
      });
    },
    [cleanupChannel, cleanupTimers, isHost, playerAvatar, playerId, playerName, resetRoomState]
  );

  function createClassroom() {
    setError(null);
    void enterLobby(generateClassroomCode(), true);
  }

  function joinClassroom() {
    setError(null);
    void enterLobby(joinCode, false);
  }

  function leaveClassroom() {
    cleanupChannel();
    resetRoomState();
    setPlayers([]);
    setClassroomCode("");
    setJoinCode("");
    setPhase("entry");
    setIsHost(false);
    setRoomLocked(false);
    setSelectedSubject(DEFAULT_SUBJECT);
    setSelectedPunctuation(DEFAULT_PUNCTUATION_LEVEL);
    setHostPlays(true);
    setWaitingForTeacherReset(false);
  }

  function startBattleRoyale() {
    if (!isHost || !channelRef.current) return;
    const seed = generateMatchSeed();
    const payload: StartPayload = {
      seed,
      questionCount: QUESTION_COUNT,
      startedAt: Date.now() + PREMATCH_DELAY_MS,
      subject: selectedSubject,
      vocabLevel: selectedVocab,
      punctuationLevel: selectedPunctuation,
      hostPlays,
    };

    activeSeedRef.current = seed;
    setWaitingForTeacherReset(false);
    setScores({});
    setResult(null);
    if (hostPlays) {
      setQuestions(
        getSeededQuestionsForMode(
          selectedSubject,
          seed,
          QUESTION_COUNT,
          selectedVocab,
          selectedPunctuation
        )
      );
    } else {
      setQuestions([]);
    }
    setPhase("countdown");
    setCountdown(Math.ceil(PREMATCH_DELAY_MS / 1000));

    cleanupTimers();
    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((payload.startedAt - Date.now()) / 1000);
      setCountdown(Math.max(0, remaining));
    }, 200);

    playTimerRef.current = setTimeout(() => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setPhase(hostPlays ? "playing" : "hosting");
    }, PREMATCH_DELAY_MS);

    channelRef.current.send({
      type: "broadcast",
      event: CLASSROOM_START_EVENT,
      payload,
    });
  }

  function toggleRoomLock() {
    if (!isHost || !channelRef.current) return;
    const nextLocked = !roomLocked;
    setRoomLocked(nextLocked);
    channelRef.current.send({
      type: "broadcast",
      event: CLASSROOM_CONTROL_EVENT,
      payload: { action: "lock", locked: nextLocked, by: playerId } satisfies ControlPayload,
    });
  }

  function kickPlayer(targetId: string) {
    if (!isHost || !channelRef.current) return;
    if (!targetId || targetId === playerId) return;
    channelRef.current.send({
      type: "broadcast",
      event: CLASSROOM_CONTROL_EVENT,
      payload: { action: "kick", targetId, by: playerId } satisfies ControlPayload,
    });
  }

  function endMatchNow() {
    if (!isHost || !channelRef.current) return;
    const seed = activeSeedRef.current;
    if (!seed) return;
    channelRef.current.send({
      type: "broadcast",
      event: CLASSROOM_CONTROL_EVENT,
      payload: { action: "end-match", seed, by: playerId } satisfies ControlPayload,
    });
    if (phaseRef.current === "playing") {
      setForceFinishSignal((prev) => prev + 1);
    } else if (phaseRef.current === "hosting") {
      setPhase("results");
    } else if (phaseRef.current === "countdown") {
      resetRoomState();
      setPhase("lobby");
    }
  }

  async function copyCode() {
    if (!classroomCode) return;
    try {
      await navigator.clipboard.writeText(classroomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  }

  function handleComplete(gameResult: GameResult) {
    setResult(gameResult);
    setPhase("results");

    const seed = activeSeedRef.current;
    if (!seed) return;

    const payload: ScorePayload = {
      seed,
      playerId,
      username: playerName,
      avatar_config: playerAvatar,
      score: gameResult.score,
      correct: gameResult.correct,
      incorrect: gameResult.incorrect,
      accuracy: gameResult.accuracy,
      finishedAt: Date.now(),
    };

    setScores((prev) => ({ ...prev, [playerId]: payload }));

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: CLASSROOM_SCORE_EVENT,
          payload,
        });
      } catch {}
    }
  }

  function backToLobby() {
    if (!isHost) {
      setWaitingForTeacherReset(true);
      setPhase("lobby");
      return;
    }
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: CLASSROOM_CONTROL_EVENT,
        payload: { action: "recreate-lobby", by: playerId } satisfies ControlPayload,
      });
    }
    setWaitingForTeacherReset(false);
    resetRoomState();
    setPhase("lobby");
  }

  useEffect(() => {
    if (!isHost) return;
    trackSelfPresence();
  }, [hostPlays, isHost, roomLocked, selectedSubject, selectedVocab, selectedPunctuation, trackSelfPresence]);

  const activePlayers = useMemo(
    () => (hostPlays ? players : players.filter((p) => !p.isHost)),
    [hostPlays, players]
  );

  const activePlayerIds = useMemo(() => new Set(activePlayers.map((p) => p.id)), [activePlayers]);

  useEffect(() => {
    if (phase !== "hosting") return;
    if (activePlayers.length === 0) return;
    const finished = activePlayers.filter((p) => scores[p.id]).length;
    if (finished >= activePlayers.length) {
      setPhase("results");
    }
  }, [activePlayers, phase, scores]);

  const standings = useMemo(() => {
    const allPlayers = activePlayers.map((p) => ({
      ...p,
      scorePayload: scores[p.id] ?? null,
    }));

    return allPlayers.sort((a, b) => {
      if (a.scorePayload && !b.scorePayload) return -1;
      if (!a.scorePayload && b.scorePayload) return 1;
      if (!a.scorePayload && !b.scorePayload) return a.joinedAt - b.joinedAt;

      const scoreDiff = (b.scorePayload?.score ?? 0) - (a.scorePayload?.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;

      const correctDiff = (b.scorePayload?.correct ?? 0) - (a.scorePayload?.correct ?? 0);
      if (correctDiff !== 0) return correctDiff;

      return (a.scorePayload?.finishedAt ?? Number.MAX_SAFE_INTEGER) - (b.scorePayload?.finishedAt ?? Number.MAX_SAFE_INTEGER);
    });
  }, [activePlayers, scores]);

  const localPlacement = useMemo(
    () => standings.findIndex((row) => row.id === playerId) + 1,
    [standings, playerId]
  );

  // ── Design tokens ──────────────────────────────────────────────────────────
  const D = {
    bg: light ? "#F1F5F9" : "#04091A",
    surface: light ? "#FFFFFF" : "#0A1525",
    card: light ? "#FFFFFF" : "#0F1D2E",
    cardAlt: light ? "#F8FAFC" : "#0D1927",
    border: light ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.07)",
    borderMed: light ? "rgba(15,23,42,0.13)" : "rgba(255,255,255,0.11)",
    borderStrong: light ? "rgba(15,23,42,0.2)" : "rgba(255,255,255,0.18)",
    text: light ? "#0F172A" : "#EDF2FF",
    textMuted: light ? "#64748B" : "#94A3B8",
    textFaint: light ? "#94A3B8" : "#3D5068",
    pinColor: light ? "#1E3A8A" : "#FCD34D",
    pinGlow: "0 0 40px rgba(252,211,77,0.28), 0 0 80px rgba(252,211,77,0.12)",
    accent: BLUE,
    accentDim: light ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.16)",
    accentGlow: "0 4px 16px rgba(59,130,246,0.4)",
    success: "#10B981",
    successDim: light ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.14)",
    danger: "#EF4444",
    dangerDim: light ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.14)",
    amber: "#F59E0B",
    gold: "#F59E0B",
    silver: "#94A3B8",
    bronze: "#CD7C3A",
  };

  // ── Playing phase ──────────────────────────────────────────────────────────
  if (phase === "playing" && questions.length > 0) {
    return (
      <div className="relative min-h-[100dvh]">
        {isHost && (
          <button
            onClick={endMatchNow}
            className="fixed top-4 right-4 z-40 rounded-xl px-3 py-2 text-sm font-bold text-white shadow-lg"
            style={{ backgroundColor: D.danger }}
          >
            End Match
          </button>
        )}
        <GameScreen
          mode="casual"
          subject={selectedSubject}
          questionsOverride={questions}
          onComplete={handleComplete}
          playerAvatarConfig={playerAvatar}
          forceFinishSignal={forceFinishSignal}
        />
      </div>
    );
  }

  // ── Hosting / spectator phase ──────────────────────────────────────────────
  if (phase === "hosting") {
    const finishedCount = activePlayers.filter((p) => scores[p.id]).length;
    return (
      <main style={{ minHeight: "100dvh", background: D.bg, display: "flex", flexDirection: "column", fontFamily: BODY_FONT }}>
        <style>{`
          @keyframes cr-livepulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          .cr-livepulse { animation: cr-livepulse 1.8s ease-in-out infinite; }
        `}</style>

        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", maxWidth: 1000, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <Link href="/dashboard" style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: `1px solid ${D.borderMed}`, color: D.textMuted, textDecoration: "none", background: D.card }}>
            ← Dashboard
          </Link>
          <button
            onClick={endMatchNow}
            style={{ padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: D.danger, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(239,68,68,0.35)" }}
          >
            End Match
          </button>
        </header>

        <section style={{ flex: 1, padding: "0 24px 48px", maxWidth: 1000, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {/* Console header */}
          <div style={{ background: D.card, border: `1px solid ${D.borderMed}`, borderRadius: 18, padding: "20px 24px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: D.textMuted, margin: "0 0 4px" }}>
                  Host Console
                </p>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: D.text, fontFamily: DISPLAY_FONT, lineHeight: 1.1 }}>
                  Round In Progress
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: D.textMuted }}>
                  Students are playing · {finishedCount} of {activePlayers.length} finished
                </p>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: D.textMuted, margin: "0 0 2px" }}>Game PIN</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "0.22em", color: D.pinColor, fontFamily: "'Courier New', monospace", textShadow: !light ? D.pinGlow : "none" }}>
                    {classroomCode}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: D.textMuted, margin: "0 0 2px" }}>Subject</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: D.text }}>
                    {selectedSubject === "punctuation"
                      ? `Punctuation (${PUNCTUATION_LEVEL_LABELS[selectedPunctuation]})`
                      : `Vocabulary (${VOCAB_LEVEL_LABELS[selectedVocab]})`}
                  </p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 16, height: 6, borderRadius: 999, background: D.borderMed, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${D.accent}, ${MINT})`, width: `${activePlayers.length > 0 ? (finishedCount / activePlayers.length) * 100 : 0}%`, transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* Live leaderboard */}
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 18, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 90px 90px", padding: "10px 16px", borderBottom: `1px solid ${D.border}` }}>
              {["#", "Player", "Score", "Status"].map((h, i) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: D.textMuted, textAlign: i >= 2 ? "right" : "left" }}>
                  {h}
                </span>
              ))}
            </div>
            {activePlayers.map((p, i) => {
              const done = Boolean(scores[p.id]);
              return (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr 90px 90px",
                    padding: "10px 16px",
                    alignItems: "center",
                    borderTop: `1px solid ${D.border}`,
                    background: done ? (light ? "rgba(16,185,129,0.04)" : "rgba(16,185,129,0.07)") : "transparent",
                    transition: "background 0.4s ease",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: D.textMuted }}>#{i + 1}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <InkAvatar config={p.avatar_config} size="xs" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.username}
                    </span>
                  </div>
                  <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: done ? D.text : D.textFaint }}>
                    {done ? scores[p.id].score : "—"}
                  </span>
                  <span style={{ textAlign: "right" }}>
                    {done ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: D.success, background: D.successDim, padding: "3px 8px", borderRadius: 999 }}>Done</span>
                    ) : (
                      <span className="cr-livepulse" style={{ fontSize: 11, fontWeight: 700, color: D.amber }}>Playing…</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  // ── Main render: entry / lobby / countdown / results ──────────────────────
  return (
    <>
      <style>{`
        @keyframes cr-slideup {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cr-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cr-glow {
          0%,100% { text-shadow: 0 0 36px rgba(252,211,77,0.3), 0 0 60px rgba(252,211,77,0.12); }
          50%     { text-shadow: 0 0 56px rgba(252,211,77,0.48), 0 0 90px rgba(252,211,77,0.2); }
        }
        @keyframes cr-countpop {
          0%   { transform: scale(1.5); opacity: 0; }
          18%  { transform: scale(1);   opacity: 1; }
          82%  { transform: scale(1);   opacity: 1; }
          100% { transform: scale(0.75); opacity: 0; }
        }
        @keyframes cr-playerjoin {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cr-rankreveal {
          from { opacity: 0; transform: translateX(-14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .cr-slideup  { animation: cr-slideup 0.48s cubic-bezier(0.2,0,0,1) both; }
        .cr-glow     { animation: cr-glow 3.2s ease-in-out infinite; }
        .cr-countpop { animation: cr-countpop 0.95s ease both; }
        .cr-join     { animation: cr-playerjoin 0.32s ease both; }
        .cr-rank     { animation: cr-rankreveal 0.4s ease both; }
        .cr-btn {
          cursor: pointer;
          border: none;
          transition: transform 0.1s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        }
        .cr-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .cr-btn:active:not(:disabled) { transform: translateY(0px); }
        .cr-btn:disabled { opacity: 0.42; cursor: not-allowed; }
        .cr-input { outline: none; }
        .cr-input:focus { border-color: ${D.accent} !important; box-shadow: 0 0 0 3px ${D.accentDim}; }
        .cr-select { outline: none; cursor: pointer; }
        .cr-select option { background: ${D.card}; color: ${D.text}; }
      `}</style>

      <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: D.bg, overflowX: "hidden", fontFamily: BODY_FONT }}>

        {/* Dark mode grid texture */}
        {!light && (
          <div
            aria-hidden
            style={{
              position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
              backgroundImage: "linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />
        )}

        {/* Header */}
        <header style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", maxWidth: 920, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {phase === "entry" ? (
            <Link
              href="/dashboard"
              style={{ fontSize: 13, fontWeight: 600, color: D.textMuted, textDecoration: "none", padding: "8px 14px", borderRadius: 10, border: `1px solid ${D.borderMed}`, background: D.card }}
            >
              ← Dashboard
            </Link>
          ) : (
            <button
              onClick={leaveClassroom}
              className="cr-btn"
              style={{ fontSize: 13, fontWeight: 600, color: D.textMuted, padding: "8px 14px", borderRadius: 10, border: `1px solid ${D.borderMed}`, background: D.card }}
            >
              ← Leave
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThemeToggle />
            <GlobalNotificationBar />
          </div>
        </header>

        <section
          className="cr-slideup"
          style={{ position: "relative", zIndex: 10, flex: 1, padding: "0 20px 52px", maxWidth: 920, margin: "0 auto", width: "100%", boxSizing: "border-box" }}
        >
          {/* Error banner */}
          {error && (
            <div style={{ background: D.dangerDim, border: `1px solid rgba(239,68,68,0.28)`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, fontWeight: 600, color: D.danger }}>
              {error}
            </div>
          )}

          {/* ── ENTRY ── */}
          {phase === "entry" && (
            <div>
              <div style={{ marginBottom: 36, paddingTop: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: D.accent, margin: "0 0 10px" }}>
                  Lexicon League
                </p>
                <h1 style={{ fontSize: "clamp(30px, 5.5vw, 48px)", fontWeight: 900, color: D.text, margin: "0 0 10px", fontFamily: DISPLAY_FONT, lineHeight: 1.08, letterSpacing: "-0.02em" }}>
                  Classroom Battle Royale
                </h1>
                <p style={{ fontSize: 15, color: D.textMuted, margin: 0, lineHeight: 1.6 }}>
                  Up to {MAX_CLASSROOM_PLAYERS} players · One shared question set · Real-time leaderboard
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16 }}>
                {/* Create card */}
                <button
                  onClick={createClassroom}
                  className="cr-btn"
                  style={{
                    background: light
                      ? "linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%)"
                      : "linear-gradient(145deg, #0D1D35 0%, #0A1A2E 100%)",
                    border: `1px solid ${light ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.2)"}`,
                    borderRadius: 22,
                    padding: "28px",
                    textAlign: "left",
                    boxShadow: light ? "0 4px 24px rgba(59,130,246,0.1)" : "0 4px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: D.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, border: `1px solid ${light ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.18)"}` }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 21, fontWeight: 800, margin: "0 0 8px", fontFamily: DISPLAY_FONT, color: D.text, letterSpacing: "-0.01em" }}>
                    Host a Round
                  </p>
                  <p style={{ fontSize: 13, color: D.textMuted, margin: "0 0 22px", lineHeight: 1.55 }}>
                    Generate a game PIN and control your classroom. Choose vocabulary or punctuation, then start when ready.
                  </p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: D.accent }}>
                    Create Classroom
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>

                {/* Join card */}
                <div style={{
                  background: light
                    ? "linear-gradient(145deg, #F0FDF4 0%, #ECFDF5 100%)"
                    : "linear-gradient(145deg, #0B1D16 0%, #091710 100%)",
                  border: `1px solid ${light ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.18)"}`,
                  borderRadius: 22,
                  padding: "28px",
                  boxShadow: light ? "0 4px 24px rgba(16,185,129,0.08)" : "0 4px 24px rgba(0,0,0,0.4)",
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: D.successDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, border: `1px solid ${light ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.18)"}` }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={D.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 21, fontWeight: 800, margin: "0 0 8px", fontFamily: DISPLAY_FONT, color: D.text, letterSpacing: "-0.01em" }}>
                    Join a Class
                  </p>
                  <p style={{ fontSize: 13, color: D.textMuted, margin: "0 0 18px", lineHeight: 1.55 }}>
                    Enter the game PIN from your teacher to jump into the battle royale.
                  </p>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(normalizeCode(e.target.value))}
                    placeholder="ABC123"
                    className="cr-input"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      borderRadius: 13,
                      padding: "13px 16px",
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      textAlign: "center",
                      fontFamily: "'Courier New', 'Lucida Console', monospace",
                      border: `2px solid ${joinCode.length === CLASSROOM_CODE_LEN ? D.success : D.borderStrong}`,
                      background: D.cardAlt,
                      color: D.text,
                      transition: "border-color 0.2s ease",
                    }}
                    maxLength={CLASSROOM_CODE_LEN}
                    onKeyDown={(e) => { if (e.key === "Enter" && normalizeCode(joinCode).length === CLASSROOM_CODE_LEN) joinClassroom(); }}
                  />
                  <button
                    onClick={joinClassroom}
                    disabled={normalizeCode(joinCode).length !== CLASSROOM_CODE_LEN}
                    className="cr-btn"
                    style={{
                      width: "100%",
                      marginTop: 10,
                      padding: "13px",
                      borderRadius: 13,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#fff",
                      background: normalizeCode(joinCode).length === CLASSROOM_CODE_LEN
                        ? `linear-gradient(135deg, ${D.success}, #059669)`
                        : D.borderMed,
                      boxShadow: normalizeCode(joinCode).length === CLASSROOM_CODE_LEN ? "0 4px 14px rgba(16,185,129,0.4)" : "none",
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}
                  >
                    Join Classroom
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── LOBBY + COUNTDOWN ── */}
          {(phase === "lobby" || phase === "countdown") && (
            <div>
              {/* PIN / Countdown hero */}
              <div style={{
                background: light
                  ? "linear-gradient(145deg, #EFF6FF, #F0FDF4)"
                  : "linear-gradient(145deg, #091828, #091A10)",
                border: `1px solid ${D.borderMed}`,
                borderRadius: 22,
                padding: "32px 28px 28px",
                marginBottom: 20,
                textAlign: "center",
                boxShadow: !light ? "0 8px 40px rgba(0,0,0,0.5)" : "0 4px 24px rgba(0,0,0,0.06)",
              }}>
                {phase === "countdown" ? (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: D.textMuted, margin: "0 0 16px" }}>
                      Round starting
                    </p>
                    <div
                      key={countdown}
                      className="cr-countpop"
                      style={{
                        fontSize: "clamp(80px, 20vw, 140px)",
                        fontWeight: 900,
                        lineHeight: 1,
                        fontFamily: DISPLAY_FONT,
                        color: D.pinColor,
                        textShadow: !light ? D.pinGlow : "none",
                        margin: "0 0 16px",
                      }}
                    >
                      {countdown}
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: D.accent, margin: 0, letterSpacing: "0.02em" }}>
                      Get ready — round begins now!
                    </p>
                    {isHost && (
                      <button
                        onClick={endMatchNow}
                        className="cr-btn"
                        style={{ marginTop: 20, padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: D.dangerDim, color: D.danger, border: `1px solid rgba(239,68,68,0.28)` }}
                      >
                        Cancel Round
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: D.textMuted, margin: "0 0 12px" }}>
                      Game PIN
                    </p>
                    <p
                      className={!light ? "cr-glow" : ""}
                      style={{
                        fontSize: "clamp(44px, 11vw, 80px)",
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: "0.2em",
                        fontFamily: "'Courier New', 'Lucida Console', monospace",
                        color: D.pinColor,
                        textShadow: !light ? D.pinGlow : "none",
                        margin: "0 0 20px",
                      }}
                    >
                      {classroomCode}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={copyCode}
                        className="cr-btn"
                        style={{
                          padding: "8px 18px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          background: copied ? `linear-gradient(135deg, ${D.success}, #059669)` : D.accentDim,
                          color: copied ? "#fff" : D.accent,
                          border: `1px solid ${copied ? "transparent" : D.borderMed}`,
                          transition: "all 0.2s",
                          boxShadow: copied ? "0 4px 12px rgba(16,185,129,0.35)" : "none",
                        }}
                      >
                        {copied ? "Copied!" : "Copy PIN"}
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 600, color: D.textMuted }}>
                        {activePlayers.length}/{MAX_CLASSROOM_PLAYERS} joined
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isHost ? D.accent : D.textMuted }}>
                        {isHost ? "You are host" : "Waiting for host…"}
                      </span>
                      {roomLocked && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: D.amber, padding: "4px 10px", borderRadius: 999, background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.28)" }}>
                          Locked
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Two-column: roster + settings (lobby only) */}
              {phase === "lobby" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(255px, 1fr))", gap: 16 }}>
                  {/* Player roster */}
                  <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 18, padding: "20px", boxShadow: light ? "0 2px 16px rgba(0,0,0,0.04)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: D.textMuted, margin: 0 }}>
                        Participants
                      </p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: D.accent, padding: "3px 10px", borderRadius: 999, background: D.accentDim }}>
                        {activePlayers.length} joined
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 7, maxHeight: 340, overflowY: "auto" }}>
                      {activePlayers.length === 0 ? (
                        <p style={{ fontSize: 13, color: D.textFaint, gridColumn: "1 / -1", padding: "16px 0", margin: 0 }}>
                          Waiting for players to join…
                        </p>
                      ) : (
                        activePlayers.map((p) => (
                          <div
                            key={p.id}
                            className="cr-join"
                            style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 12, background: D.cardAlt, border: `1px solid ${D.border}` }}
                          >
                            <InkAvatar config={p.avatar_config} size="sm" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.username}
                              </p>
                              <p style={{ fontSize: 10, color: D.textMuted, margin: 0 }}>{p.isHost ? "Host" : "Player"}</p>
                            </div>
                            {isHost && !p.isHost && p.id !== playerId && (
                              <button
                                onClick={() => kickPlayer(p.id)}
                                className="cr-btn"
                                style={{ padding: "3px 8px", borderRadius: 7, fontSize: 10, fontWeight: 700, background: D.dangerDim, color: D.danger, border: `1px solid rgba(239,68,68,0.22)` }}
                              >
                                Kick
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Settings / status panel */}
                  <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 18, padding: "20px", display: "flex", flexDirection: "column", gap: 14, boxShadow: light ? "0 2px 16px rgba(0,0,0,0.04)" : "none" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: D.textMuted, margin: 0 }}>
                      {isHost ? "Game Settings" : "Lobby Status"}
                    </p>

                    {/* Subject + level */}
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, margin: "0 0 8px" }}>Subject</p>
                      {isHost ? (
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value === "punctuation" ? "punctuation" : "vocabulary")}
                          className="cr-select"
                          style={{ width: "100%", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 600, color: D.text, background: D.cardAlt, border: `1px solid ${D.borderMed}` }}
                        >
                          <option value="vocabulary">Vocabulary</option>
                          <option value="punctuation">Punctuation</option>
                        </select>
                      ) : (
                        <p style={{ fontSize: 14, fontWeight: 700, color: D.text, margin: 0 }}>
                          {selectedSubject === "punctuation" ? "Punctuation" : "Vocabulary"}
                        </p>
                      )}
                    </div>

                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, margin: "0 0 8px" }}>
                        {selectedSubject === "punctuation" ? "Punctuation Level" : "Vocabulary Level"}
                      </p>
                      {isHost ? (
                        selectedSubject === "punctuation" ? (
                          <select
                            value={selectedPunctuation}
                            onChange={(e) => setSelectedPunctuation(parsePunctuationLevel(e.target.value))}
                            className="cr-select"
                            style={{ width: "100%", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 600, color: D.text, background: D.cardAlt, border: `1px solid ${D.borderMed}` }}
                          >
                            {PUNCTUATION_OPTIONS.map((level) => (
                              <option key={level} value={level}>
                                {`Level ${level} · ${PUNCTUATION_LEVEL_LABELS[level]}`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={selectedVocab}
                            onChange={(e) => setSelectedVocab(parseVocabLevel(e.target.value))}
                            className="cr-select"
                            style={{ width: "100%", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 600, color: D.text, background: D.cardAlt, border: `1px solid ${D.borderMed}` }}
                          >
                            {VOCAB_OPTIONS.map((level) => (
                              <option key={String(level)} value={level}>
                                {VOCAB_LEVEL_LABELS[level]}
                              </option>
                            ))}
                          </select>
                        )
                      ) : (
                        <p style={{ fontSize: 14, fontWeight: 700, color: D.text, margin: 0 }}>
                          {selectedSubject === "punctuation"
                            ? `Level ${selectedPunctuation} · ${PUNCTUATION_LEVEL_LABELS[selectedPunctuation]}`
                            : VOCAB_LEVEL_LABELS[selectedVocab]}
                        </p>
                      )}
                    </div>

                    {/* Host mode toggle */}
                    {isHost && (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, margin: "0 0 8px" }}>Host Mode</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: 10, border: `1px solid ${D.borderMed}`, overflow: "hidden" }}>
                          {([{ label: "Play Along", value: true }, { label: "Spectate", value: false }] as const).map(({ label, value }) => (
                            <button
                              key={label}
                              onClick={() => setHostPlays(value)}
                              className="cr-btn"
                              style={{
                                padding: "9px 4px",
                                fontSize: 13,
                                fontWeight: 700,
                                background: hostPlays === value ? `linear-gradient(135deg, ${D.accent}, #2563EB)` : "transparent",
                                color: hostPlays === value ? "#fff" : D.textMuted,
                                transition: "all 0.2s",
                                boxShadow: hostPlays === value ? D.accentGlow : "none",
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student waiting message */}
                    {!isHost && waitingForTeacherReset && (
                      <p style={{ fontSize: 13, fontWeight: 600, color: D.accent, margin: 0, textAlign: "center" }}>
                        Waiting for teacher to restart the lobby…
                      </p>
                    )}

                    {/* Action buttons */}
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                      {isHost && (
                        <button
                          onClick={startBattleRoyale}
                          className="cr-btn"
                          style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg, ${D.accent}, #2563EB)`, boxShadow: D.accentGlow }}
                        >
                          Start Battle Royale
                        </button>
                      )}
                      {isHost && (
                        <button
                          onClick={toggleRoomLock}
                          className="cr-btn"
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 700,
                            background: roomLocked ? D.successDim : D.accentDim,
                            color: roomLocked ? D.success : D.accent,
                            border: `1px solid ${roomLocked ? "rgba(16,185,129,0.28)" : D.borderMed}`,
                          }}
                        >
                          {roomLocked ? "Unlock Room" : "Lock Room"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RESULTS ── */}
          {phase === "results" && (
            <div>
              {/* Placement hero */}
              <div
                style={{
                  background: light
                    ? "linear-gradient(145deg, #FFFBEB, #FEF3C7)"
                    : "linear-gradient(145deg, #181108, #130E05)",
                  border: `1px solid ${light ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)"}`,
                  borderRadius: 22,
                  padding: "28px",
                  marginBottom: 18,
                  boxShadow: !light ? "0 8px 40px rgba(0,0,0,0.5)" : "0 4px 24px rgba(245,158,11,0.08)",
                }}
              >
                {activePlayerIds.has(playerId) ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: D.textMuted, margin: "0 0 8px" }}>
                        Your Result
                      </p>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                        <span
                          style={{
                            fontSize: "clamp(42px, 10vw, 64px)",
                            fontWeight: 900,
                            fontFamily: DISPLAY_FONT,
                            lineHeight: 1,
                            color: localPlacement === 1 ? D.gold : localPlacement <= 3 ? D.silver : D.text,
                            textShadow: localPlacement === 1 && !light ? `0 0 30px rgba(245,158,11,0.5)` : "none",
                          }}
                        >
                          #{Math.max(1, localPlacement)}
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 600, color: D.textMuted }}>
                          of {Math.max(1, standings.length)}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: D.textMuted, margin: "6px 0 0" }}>
                        {placementLabel(Math.max(1, localPlacement), Math.max(1, standings.length))}
                        {result ? ` · ${result.score} pts · ${result.accuracy}% accuracy` : ""}
                      </p>
                    </div>
                    {result && (
                      <div style={{ display: "flex", gap: 20 }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 26, fontWeight: 900, color: D.success, margin: 0 }}>{result.correct}</p>
                          <p style={{ fontSize: 11, color: D.textMuted, margin: "2px 0 0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Correct</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 26, fontWeight: 900, color: D.danger, margin: 0 }}>{result.incorrect}</p>
                          <p style={{ fontSize: 11, color: D.textMuted, margin: "2px 0 0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Wrong</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: D.textMuted, margin: "0 0 6px" }}>
                      Host Mode
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 800, fontFamily: DISPLAY_FONT, color: D.text, margin: "0 0 4px" }}>
                      Round Complete
                    </p>
                    <p style={{ fontSize: 13, color: D.textMuted, margin: 0 }}>You spectated this round.</p>
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 18, overflow: "hidden", marginBottom: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 88px 76px", padding: "10px 16px", borderBottom: `1px solid ${D.border}` }}>
                  {["Rank", "Player", "Score", "Acc"].map((h, i) => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: D.textMuted, textAlign: i >= 2 ? "right" : "left" }}>
                      {h}
                    </span>
                  ))}
                </div>
                {standings.map((row, i) => {
                  const isMe = row.id === playerId;
                  const medalColor = i === 0 ? D.gold : i === 1 ? D.silver : i === 2 ? D.bronze : null;
                  const medalEmoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                  return (
                    <div
                      key={row.id}
                      className="cr-rank"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "50px 1fr 88px 76px",
                        padding: "11px 16px",
                        alignItems: "center",
                        borderTop: `1px solid ${D.border}`,
                        animationDelay: `${i * 0.055}s`,
                        background: isMe
                          ? (light ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.09)")
                          : "transparent",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 800, color: medalColor ?? D.textMuted, textShadow: medalColor && !light ? `0 0 10px ${medalColor}55` : "none" }}>
                        {medalEmoji ?? `#${i + 1}`}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <InkAvatar config={row.avatar_config} size="xs" />
                        <span style={{ fontSize: 13, fontWeight: isMe ? 800 : 600, color: isMe ? D.accent : D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {row.username}{isMe ? " (you)" : ""}
                        </span>
                      </div>
                      <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: D.text }}>
                        {row.scorePayload ? row.scorePayload.score : "…"}
                      </span>
                      <span style={{ textAlign: "right", fontSize: 12, color: D.textMuted }}>
                        {row.scorePayload ? `${row.scorePayload.accuracy}%` : "…"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={backToLobby}
                  className="cr-btn"
                  style={{ padding: "12px 26px", borderRadius: 13, fontSize: 14, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg, ${D.accent}, #2563EB)`, boxShadow: D.accentGlow }}
                >
                  {isHost ? "Back to Lobby" : "Back to Room"}
                </button>
                <button
                  onClick={leaveClassroom}
                  className="cr-btn"
                  style={{ padding: "12px 26px", borderRadius: 13, fontSize: 14, fontWeight: 700, background: D.cardAlt, color: D.textMuted, border: `1px solid ${D.borderMed}` }}
                >
                  Exit Classroom
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
