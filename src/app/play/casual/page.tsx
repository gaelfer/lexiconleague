"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Subject, GameResult, VocabLevel, DEFAULT_AVATAR_CONFIG, InkAvatarConfig } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useParty, type PartyMember } from "@/context/PartyContext";
import { getProfile, createGuestProfile } from "@/lib/user/storage";
import { upsertProfile } from "@/lib/supabase/profile";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import InkAvatar from "@/components/InkAvatar";
import BookIcon from "@/components/icons/BookIcon";
import PencilIcon from "@/components/icons/PencilIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { generateBotOpponent, generateBotOpponents, generateBotScore } from "@/lib/game/matchmaking";
import { calculateScore } from "@/lib/game/rank";
import type { OpponentInfo } from "@/lib/game/matchmaking";

const BLUE = "#3B82F6";
const MINT = "#34D399";

type CasualMode = "1v1" | "3v3";
type Phase = "select" | "vocab-grade" | "matchmaking" | "playing" | "results";

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

const MATCHMAKING_SECONDS = 10;

export default function CasualPage() {
  const { user } = useAuth();
  const { light } = useTheme();
  const { members, canQueue1v1, canQueue3v3 } = useParty();
  const [phase, setPhase] = useState<Phase>("select");
  const [mode, setMode] = useState<CasualMode>("1v1");
  const [subject, setSubject] = useState<Subject>("vocabulary");
  const [vocabGrade, setVocabGrade] = useState<VocabLevel | undefined>(undefined);
  const [result, setResult] = useState<GameResult | null>(null);
  const [resultMetadata, setResultMetadata] = useState<import("@/types").GameResultMetadata | undefined>(undefined);
  const [matchmakingSeconds, setMatchmakingSeconds] = useState(MATCHMAKING_SECONDS);
  const [opponents, setOpponents] = useState<OpponentInfo[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[]>([]);
  const [opponentScores, setOpponentScores] = useState<number[]>([]);
  const [opponentAnswered, setOpponentAnswered] = useState<number[]>([]);
  const [teammateScores, setTeammateScores] = useState<number[]>([]);
  const [teammateAnswered, setTeammateAnswered] = useState<number[]>([]);
  const botResultsRef = useRef<{
    opponents: { correct: number; total: number }[];
    teammates: { correct: number; total: number }[];
  } | null>(null);
  const profile = getProfile() ?? createGuestProfile();

  const canQueue = mode === "1v1" ? canQueue1v1 : canQueue3v3;

  useEffect(() => {
    if (phase !== "matchmaking") return;
    setMatchmakingSeconds(MATCHMAKING_SECONDS);
    const interval = setInterval(() => {
      setMatchmakingSeconds((s) => {
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

  function handleStartVocab() {
    setSubject("vocabulary");
    setPhase("vocab-grade");
  }

  function assignOpponents() {
    const tier = profile?.rank_tier ?? "Bronze";
    if (mode === "1v1") {
      const bot = generateBotOpponent(tier);
      const botResult = generateBotScore(tier);
      botResultsRef.current = { opponents: [{ correct: botResult.correct, total: botResult.total }], teammates: [] };
      setOpponents([bot]);
      setTeamMembers([]);
      setOpponentScores([]);
      setOpponentAnswered([]);
      setTeammateScores([]);
      setTeammateAnswered([]);
    } else {
      const bots = generateBotOpponents(tier, 3);
      const oppResults = bots.map(() => generateBotScore(tier));
      const partyTeammates = members.slice(0, 2).map((m: PartyMember) => ({
        username: m.username,
        avatar_config: { ...DEFAULT_AVATAR_CONFIG, ...(m.avatar_config as Partial<InkAvatarConfig>) } as InkAvatarConfig,
        isBot: false,
      }));
      const slotsNeeded = 2;
      const botTeammates = Array.from({ length: slotsNeeded - partyTeammates.length }, () => {
        const bot = generateBotOpponent(tier);
        return { username: bot.username, avatar_config: bot.avatar_config, isBot: true };
      });
      const allTeammates = [...partyTeammates, ...botTeammates];
      const teammateResults = allTeammates.map(() => generateBotScore(tier));
      botResultsRef.current = {
        opponents: oppResults.map((r) => ({ correct: r.correct, total: r.total })),
        teammates: teammateResults.map((r) => ({ correct: r.correct, total: r.total })),
      };
      setOpponents(bots);
      setTeamMembers(allTeammates.map((t) => ({ username: t.username, avatar_config: t.avatar_config, isBot: t.isBot })));
      setOpponentScores([]);
      setOpponentAnswered([]);
      setTeammateScores([]);
      setTeammateAnswered([]);
    }
  }

  function handleStartPunctuation() {
    setSubject("punctuation");
    setVocabGrade(undefined);
    if (canQueue) {
      assignOpponents();
      setPhase("matchmaking");
    }
  }

  function handleStartWithGrade(level: VocabLevel) {
    setVocabGrade(level);
    if (canQueue) {
      assignOpponents();
      setPhase("matchmaking");
    }
  }

  function handleUseDefault() {
    const defaultLevel = profile?.vocab_grade ?? 8;
    setVocabGrade(defaultLevel);
    if (canQueue) {
      assignOpponents();
      setPhase("matchmaking");
    }
  }

  function handleComplete(r: GameResult, metadata?: import("@/types").GameResultMetadata) {
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
      if (updated) upsertProfile(user.id, updated);
    }
  }

  function handlePlayAgain() {
    setResult(null);
    setResultMetadata(undefined);
    setVocabGrade(undefined);
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
      />
    );
  }

  if (phase === "matchmaking" && opponents.length > 0) {
    const cardBg = light ? "bg-white" : "bg-[#1E293B]";
    const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
    const yourTeam = mode === "3v3"
      ? [
          { config: (profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig, name: profile?.username ?? "You", isBot: false },
          ...teamMembers.map((m) => ({ config: m.avatar_config, name: m.username, isBot: m.isBot ?? false })),
        ]
      : [{ config: (profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig, name: profile?.username ?? "You", isBot: false }];
    const theirTeam = opponents;

    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col items-center justify-center px-4 sm:px-6 py-6 overflow-x-hidden`}>
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className={`flex-1 flex flex-col items-center gap-2 rounded-2xl ${cardBg} border ${cardBorder} p-3 sm:p-4 min-w-0`}>
              <p className={`text-xs font-bold ${textMuted} mb-1`}>Your team</p>
              <div className={`flex ${mode === "3v3" ? "gap-1 sm:gap-2 justify-center" : "-space-x-3 sm:-space-x-2"}`}>
                {yourTeam.map((p, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...p.config }} size={mode === "3v3" ? "sm" : "lg"} className={mode === "3v3" ? "ring-2 ring-[#1E293B] rounded-full shrink-0" : "ring-2 ring-[#1E293B] rounded-full"} />
                    <p className={`text-[10px] sm:text-xs font-extrabold truncate max-w-[50px] mt-1 ${text}`}>
                      {p.name}{p.isBot && " BOT"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: mode === "3v3" ? MINT : BLUE }}>
                <span className="text-white font-extrabold text-sm sm:text-base">VS</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${text}`}>{matchmakingSeconds}s</p>
            </div>
            <div className={`flex-1 flex flex-col items-center gap-2 rounded-2xl ${cardBg} border ${cardBorder} p-3 sm:p-4 min-w-0`}>
              <p className={`text-xs font-bold ${textMuted} mb-1`}>Their team</p>
              <div className={`flex ${mode === "3v3" ? "gap-1 sm:gap-2 justify-center" : "-space-x-3 sm:-space-x-2"}`}>
                {theirTeam.map((o, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...o.avatar_config }} size={mode === "3v3" ? "sm" : "lg"} className="ring-2 ring-[#1E293B] rounded-full shrink-0" />
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
            <p className={`text-lg font-bold ${text}`}>Finding opponent{mode === "3v3" ? "s" : ""}...</p>
            <p className={`text-sm ${textMuted} mt-1`}>
              {matchmakingSeconds > 0 ? (mode === "3v3" ? "3v3 team match · bot fallback" : "Match with another player or bot fallback") : "Starting match..."}
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
          <ThemeToggle />
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
    const yourTeamTotal = mode === "3v3" && br?.teammates.length === 2
      ? result.score + calculateScore(br.teammates[0].correct) + calculateScore(br.teammates[1].correct)
      : result.score;
    const theirTeamTotal = br
      ? br.opponents.reduce((sum, o) => sum + calculateScore(o.correct), 0)
      : opponentScores.reduce((a, b) => a + b, 0);
    const youWin = yourTeamTotal > theirTeamTotal;
    const youLose = yourTeamTotal < theirTeamTotal;

    return (
      <div>
        {(opponents.length > 0) && (
          <div className={`${light ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#1E293B] border-white/10"} border-b px-3 sm:px-4 py-3 sm:py-4 overflow-x-hidden`}>
            <div className="max-w-lg mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {mode === "3v3" ? (
                  <div className="flex -space-x-2">
                    <InkAvatar config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig} size="sm" className="ring-2 ring-[#1E293B]" />
                    {teamMembers.map((m, i) => (
                      <InkAvatar key={i} config={{ ...DEFAULT_AVATAR_CONFIG, ...m.avatar_config }} size="sm" className="ring-2 ring-[#1E293B]" />
                    ))}
                  </div>
                ) : (
                  <InkAvatar config={(profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG) as InkAvatarConfig} size="sm" />
                )}
                <div>
                  <p className={`text-xs font-bold ${textMuted}`}>{mode === "3v3" ? "Your team" : "You"}</p>
                  <p className={`text-lg font-extrabold ${text}`}>{yourTeamTotal}</p>
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
                    {mode === "3v3" ? "Their team" : `${opponents[0].username}${opponents[0].isBot ? " BOT" : ""}`}
                  </p>
                  <p className={`text-lg font-extrabold ${text}`}>{theirTeamTotal}</p>
                </div>
                {mode === "3v3" ? (
                  <div className="flex -space-x-2">
                    {opponents.map((o, i) => (
                      <InkAvatar key={i} config={{ ...DEFAULT_AVATAR_CONFIG, ...o.avatar_config }} size="sm" className="ring-2 ring-[#1E293B]" />
                    ))}
                  </div>
                ) : (
                  <InkAvatar config={{ ...DEFAULT_AVATAR_CONFIG, ...opponents[0].avatar_config }} size="sm" />
                )}
              </div>
            </div>
          </div>
        )}
        <ResultsScreen result={result} onPlayAgain={handlePlayAgain} metadata={resultMetadata} />
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
        <ThemeToggle />
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-5 py-8">
        <div className="text-center space-y-2 mb-6">
          <h1 className={`text-2xl sm:text-3xl font-extrabold ${text}`}>Choose Your Sprint</h1>
          <p className={`${textMuted} text-sm`}>1v1 or 3v3 · No rank impact</p>
        </div>

        {members.length > 0 && (
          <div className={`rounded-xl p-3 mb-4 ${cardBg} border ${cardBorder}`}>
            <p className={`text-xs font-bold ${textMuted}`}>Party ({members.length}/6)</p>
            {!canQueue1v1 && <p className="text-xs text-amber-600 mt-1">Party too large for 1v1</p>}
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
            {mode === "1v1" ? "Leave party or reduce to 2 to queue 1v1" : "Add friends to party — bots fill empty slots"}
          </p>
        )}
      </div>
    </main>
  );
}
