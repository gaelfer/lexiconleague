"use client";

import { useState } from "react";
import Link from "next/link";
import { Subject, GameResult } from "@/types";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import BookIcon from "@/components/icons/BookIcon";
import PencilIcon from "@/components/icons/PencilIcon";
import SparkIcon from "@/components/icons/SparkIcon";

type Phase = "select" | "playing" | "results";

export default function CasualPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [subject, setSubject] = useState<Subject>("vocabulary");
  const [result, setResult] = useState<GameResult | null>(null);

  function handleStart(s: Subject) {
    setSubject(s);
    setPhase("playing");
  }

  function handleComplete(r: GameResult) {
    setResult(r);
    setPhase("results");
  }

  function handlePlayAgain() {
    setResult(null);
    setPhase("select");
  }

  if (phase === "playing") {
    return <GameScreen mode="casual" subject={subject} onComplete={handleComplete} />;
  }

  if (phase === "results" && result) {
    return <ResultsScreen result={result} onPlayAgain={handlePlayAgain} />;
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="absolute top-5 left-5 text-[#64748B] hover:text-[#0F172A] text-sm font-bold transition-colors flex items-center gap-1"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Back
      </Link>

      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm text-sm font-bold text-[#3B82F6] mb-4">
            <SparkIcon className="w-4 h-4" color="#3B82F6" />
            Casual Mode
          </div>
          <h1 className="text-4xl font-extrabold text-[#0F172A] mb-2">Choose Your Sprint</h1>
          <p className="text-[#64748B] font-medium">60 seconds. Go as fast as you can. No rank impact—just fun!</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleStart("vocabulary")}
            className="group rounded-3xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg hover:shadow-xl hover:-translate-y-1 text-left transition-all"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[#DBEAFE] group-hover:bg-[#BFDBFE] transition-colors">
              <BookIcon className="w-7 h-7" color="#3B82F6" />
            </div>
            <h3 className="text-[#0F172A] font-extrabold text-lg mb-1">Vocabulary</h3>
            <p className="text-[#64748B] text-sm font-medium">
              Definitions, synonyms, antonyms & context clues.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-[#3B82F6] font-bold text-sm group-hover:gap-2 transition-all">
              Start
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </span>
          </button>

          <button
            onClick={() => handleStart("punctuation")}
            className="group rounded-3xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg hover:shadow-xl hover:-translate-y-1 text-left transition-all"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[#D1FAE5] group-hover:bg-[#A7F3D0] transition-colors">
              <PencilIcon className="w-7 h-7" color="#34D399" />
            </div>
            <h3 className="text-[#0F172A] font-extrabold text-lg mb-1">Punctuation</h3>
            <p className="text-[#64748B] text-sm font-medium">
              Commas, apostrophes, quotation marks & more.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-[#34D399] font-bold text-sm group-hover:gap-2 transition-all">
              Start
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </span>
          </button>
        </div>

        <p className="text-[#64748B] text-xs font-semibold">
          +5 XP per correct answer · Personal best tracked
        </p>
      </div>
    </main>
  );
}
