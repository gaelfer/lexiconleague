"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Subject, GameResult, VocabLevel } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useParty } from "@/context/PartyContext";
import { getProfile } from "@/lib/user/storage";
import { upsertProfile } from "@/lib/supabase/profile";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import InkAvatar from "@/components/InkAvatar";
import BookIcon from "@/components/icons/BookIcon";
import PencilIcon from "@/components/icons/PencilIcon";
import ThemeToggle from "@/components/ThemeToggle";

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
  const profile = getProfile();

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

  function handleStartVocab() {
    setSubject("vocabulary");
    setPhase("vocab-grade");
  }

  function handleStartPunctuation() {
    setSubject("punctuation");
    setVocabGrade(undefined);
    if (canQueue) setPhase("matchmaking");
  }

  function handleStartWithGrade(level: VocabLevel) {
    setVocabGrade(level);
    if (canQueue) setPhase("matchmaking");
  }

  function handleUseDefault() {
    const defaultLevel = profile?.vocab_grade ?? 8;
    setVocabGrade(defaultLevel);
    if (canQueue) setPhase("matchmaking");
  }

  function handleComplete(r: GameResult, metadata?: import("@/types").GameResultMetadata) {
    setResult(r);
    setResultMetadata(metadata);
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
    setPhase("select");
  }

  const bg = light ? "bg-[#F8FAFC]" : "bg-[#0F172A]";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";

  if (phase === "playing") {
    return (
      <GameScreen
        mode="casual"
        subject={subject}
        onComplete={handleComplete}
        vocabGrade={subject === "vocabulary" ? vocabGrade : undefined}
      />
    );
  }

  if (phase === "matchmaking") {
    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col items-center justify-center px-4`}>
        <ThemeToggle />
        <div className="text-center">
          <p className={`text-lg font-bold ${text} mb-2`}>Finding opponent{mode === "3v3" ? "s" : ""}...</p>
          <p className={`text-4xl font-extrabold ${text}`}>{matchmakingSeconds}s</p>
          <p className={`text-sm ${textMuted} mt-4`}>
            {matchmakingSeconds > 0 ? "Match with another player or bot fallback" : "Starting with bot..."}
          </p>
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
    return <ResultsScreen result={result} onPlayAgain={handlePlayAgain} metadata={resultMetadata} />;
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
            {mode === "1v1" ? "Leave party or reduce to 2 to queue 1v1" : "Add friends to party for 3v3"}
          </p>
        )}
      </div>
    </main>
  );
}
