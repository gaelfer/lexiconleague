"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Subject, GameResult } from "@/types";
import { getProfile, createGuestProfile } from "@/lib/storage";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import RankBadge from "@/components/RankBadge";
import ProgressBar from "@/components/ProgressBar";
import TrophyIcon from "@/components/icons/TrophyIcon";
import BookIcon from "@/components/icons/BookIcon";
import PencilIcon from "@/components/icons/PencilIcon";
import { getTierProgress, getTrophiesNeededForNextTier } from "@/lib/rank";
import { RANK_TIERS } from "@/types";

type Phase = "lobby" | "playing" | "results";

export default function RankedPage() {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [subject, setSubject] = useState<Subject>("vocabulary");
  const [result, setResult] = useState<GameResult | null>(null);
  const [profile, setProfile] = useState(getProfile() ?? createGuestProfile());

  useEffect(() => {
    const p = getProfile() ?? createGuestProfile();
    setProfile(p);
    const goldTierIdx = RANK_TIERS.indexOf("Gold");
    const playerTierIdx = RANK_TIERS.indexOf(p.rank_tier);
    if (playerTierIdx >= goldTierIdx) {
      setSubject(Math.random() > 0.5 ? "vocabulary" : "punctuation");
    } else {
      setSubject("vocabulary");
    }
  }, []);

  function handleComplete(r: GameResult) {
    setResult(r);
    setPhase("results");
  }

  function handlePlayAgain() {
    const fresh = getProfile() ?? createGuestProfile();
    setProfile(fresh);
    setResult(null);
    setPhase("lobby");
  }

  if (phase === "playing") {
    return <GameScreen mode="ranked" subject={subject} onComplete={handleComplete} />;
  }

  if (phase === "results" && result) {
    return <ResultsScreen result={result} onPlayAgain={handlePlayAgain} />;
  }

  const tierIdx = RANK_TIERS.indexOf(profile.rank_tier);
  const isGoldPlus = tierIdx >= RANK_TIERS.indexOf("Gold");
  const tierProgress = getTierProgress(profile.trophies, profile.rank_tier);
  const winTrophies = profile.rank_tier === "Bronze" ? 20 : profile.rank_tier === "Silver" ? 18 : profile.rank_tier === "Gold" ? 16 : 14;
  const lossTrophies = profile.rank_tier === "Bronze" ? 10 : profile.rank_tier === "Silver" ? 12 : profile.rank_tier === "Gold" ? 14 : 16;

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

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ECFDF5] border border-[#34D399]/50 text-sm font-bold text-[#059669] mb-4">
            <TrophyIcon className="w-4 h-4" color="#34D399" />
            Ranked Mode
          </div>
          <h1 className="text-4xl font-extrabold text-[#0F172A] mb-2">Enter the Ladder</h1>
          <p className="text-[#64748B] font-medium">Trophies on the line. Every answer matters!</p>
        </div>

        <div className="rounded-3xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-1">Your Rank</p>
              <RankBadge tier={profile.rank_tier} size="lg" />
            </div>
            <div className="text-right">
              <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-1">Trophies</p>
              <p className="text-[#0F172A] font-extrabold text-2xl">{profile.trophies}</p>
            </div>
          </div>

          <ProgressBar value={tierProgress} height="h-3" color={profile.rank_tier === "Gold" ? "#D4AF37" : profile.rank_tier === "Silver" ? "#C0C0C0" : profile.rank_tier === "Platinum" ? "#7DD3FC" : profile.rank_tier === "Diamond" ? "#A78BFA" : "#CD7F32"} />

          <p className="text-[#64748B] text-xs font-semibold text-center mt-2">
            {tierProgress}% through {profile.rank_tier}
            {tierIdx < RANK_TIERS.length - 1 && ` · ${RANK_TIERS[tierIdx + 1]} at ${getTrophiesNeededForNextTier(profile.rank_tier) ?? ""} trophies`}
          </p>
        </div>

        <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-[#E2E8F0] shadow-md">
          <p className="text-[#0F172A] font-bold text-sm mb-3">This match</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-[#64748B]">
              {subject === "vocabulary" ? <BookIcon className="w-4 h-4" color="#3B82F6" /> : <PencilIcon className="w-4 h-4" color="#34D399" />}
              <span>{isGoldPlus ? `Subject: ${subject}` : "Vocabulary only"}</span>
            </div>
            <div className="flex items-center gap-2 text-[#5B5B7B]">
              <span className="font-bold">60s</span>
              <span>sprint</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#22C55E] font-bold">Win: +{winTrophies}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold">Loss: -{lossTrophies}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setPhase("playing")}
          className="w-full py-4 rounded-2xl font-extrabold text-lg text-white bg-[#34D399] hover:bg-[#10B981] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <TrophyIcon className="w-6 h-6" color="white" />
          Start Ranked Match
        </button>

        <p className="text-center text-[#64748B] text-xs font-semibold">
          Win threshold: 60% accuracy · Ghost opponent system
        </p>
      </div>
    </main>
  );
}
