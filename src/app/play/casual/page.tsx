"use client";

import { useState } from "react";
import Link from "next/link";
import { Subject, GameResult, VocabLevel } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
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

type Phase = "select" | "vocab-grade" | "playing" | "results";

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

export default function CasualPage() {
  const { user } = useAuth();
  const { light } = useTheme();
  const [phase, setPhase] = useState<Phase>("select");
  const [subject, setSubject] = useState<Subject>("vocabulary");
  const [vocabGrade, setVocabGrade] = useState<VocabLevel | undefined>(undefined);
  const [result, setResult] = useState<GameResult | null>(null);
  const profile = getProfile();

  function handleStartVocab() {
    setSubject("vocabulary");
    setPhase("vocab-grade");
  }

  function handleStartPunctuation() {
    setSubject("punctuation");
    setVocabGrade(undefined);
    setPhase("playing");
  }

  function handleStartWithGrade(level: VocabLevel) {
    setVocabGrade(level);
    setPhase("playing");
  }

  function handleUseDefault() {
    const defaultLevel = profile?.vocab_grade ?? 8;
    setVocabGrade(defaultLevel);
    setPhase("playing");
  }

  function handleComplete(r: GameResult) {
    setResult(r);
    setPhase("results");
    if (user) {
      const updated = getProfile();
      if (updated) upsertProfile(user.id, updated);
    }
  }

  function handlePlayAgain() {
    setResult(null);
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

  if (phase === "vocab-grade") {
    return (
      <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
        <header className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setPhase("select")}
            className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${textMuted} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${light ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#3B82F6]/20 text-[#3B82F6]"}`}>
              Vocabulary
            </span>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-5 py-8 flex flex-col items-center justify-center">
          <div className="text-center space-y-2 mb-6">
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${text}`}>Pick Your Level</h1>
            <p className={`${textMuted} text-sm font-medium`}>
              Grades 3–8, or PSAT/SAT for advanced test prep
            </p>
          </div>
          {profile?.vocab_grade && (
            <button
              onClick={handleUseDefault}
              className="w-full mb-4 py-3 rounded-2xl font-bold text-white transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#3B82F6" }}
            >
              Use my default ({VOCAB_LEVELS.find((l) => l.level === profile.vocab_grade)?.label ?? profile.vocab_grade})
            </button>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            {VOCAB_LEVELS.map(({ level, label }) => (
              <button
                key={String(level)}
                onClick={() => handleStartWithGrade(level)}
                className={`rounded-2xl p-4 border-2 text-center font-bold transition-all active:scale-[0.97] ${cardBg} ${cardBorder} hover:border-[#3B82F6]/50 hover:shadow-lg`}
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
    return <ResultsScreen result={result} onPlayAgain={handlePlayAgain} />;
  }

  return (
    <main className={`min-h-[100dvh] ${bg} flex flex-col overflow-x-hidden`}>
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${textMuted} ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${light ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#3B82F6]/20 text-[#3B82F6]"}`}>
            Casual
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-5 py-8 flex flex-col items-center justify-center">
        <div className="text-center space-y-2 mb-8 relative">
          <div className="absolute -top-4 -right-8 sm:-right-12 opacity-80 pointer-events-none" style={{ transform: "rotate(15deg)" }}>
            <InkAvatar config={{ base: "droplet_02", color: "#8B5CF6", eyes: "eyes_05", accessory: "glasses_01", aura: "none" }} size={72} />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold ${text}`}>Choose Your Sprint</h1>
          <p className={`${textMuted} text-sm font-medium`}>
            60 seconds. No rank impact—just fun!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={handleStartVocab}
            className={`group rounded-2xl p-5 border text-left transition-all active:scale-[0.97] ${cardBg} ${cardBorder} hover:border-[#3B82F6]/40 hover:shadow-lg relative overflow-visible`}
          >
            <div className="absolute -bottom-2 -left-3 opacity-70 pointer-events-none" style={{ transform: "rotate(-10deg)" }}>
              <InkAvatar config={{ base: "droplet_01", color: "#3B82F6", eyes: "eyes_04", accessory: "glasses_01", aura: "none" }} size={56} />
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${light ? "bg-[#DBEAFE]" : "bg-[#3B82F6]/20"} group-hover:scale-110 transition-transform`}>
              <BookIcon className="w-6 h-6" color={BLUE} />
            </div>
            <h3 className={`${text} font-extrabold text-base mb-1`}>Vocabulary</h3>
            <p className={`${textMuted} text-xs font-medium leading-relaxed`}>
              Definitions, synonyms, antonyms & context clues
            </p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-bold group-hover:gap-2 transition-all" style={{ color: BLUE }}>
              Play
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </span>
          </button>

          <button
            onClick={handleStartPunctuation}
            className={`group rounded-2xl p-5 border text-left transition-all active:scale-[0.97] ${cardBg} ${cardBorder} hover:border-[#34D399]/40 hover:shadow-lg relative overflow-visible`}
          >
            <div className="absolute -bottom-2 -right-3 opacity-70 pointer-events-none" style={{ transform: "rotate(8deg)" }}>
              <InkAvatar config={{ base: "droplet_02", color: "#22C55E", eyes: "eyes_07", accessory: "quill_01", aura: "none" }} size={56} />
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${light ? "bg-[#D1FAE5]" : "bg-[#34D399]/20"} group-hover:scale-110 transition-transform`}>
              <PencilIcon className="w-6 h-6" color={MINT} />
            </div>
            <h3 className={`${text} font-extrabold text-base mb-1`}>Punctuation</h3>
            <p className={`${textMuted} text-xs font-medium leading-relaxed`}>
              Commas, apostrophes, quotation marks & more
            </p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-bold group-hover:gap-2 transition-all" style={{ color: MINT }}>
              Play
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
