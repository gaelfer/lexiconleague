"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GameResult } from "@/types";
import { getProfile, getPersonalBests } from "@/lib/storage";
import RankBadge from "./RankBadge";
import ProgressBar from "./ProgressBar";
import InkAvatar from "./InkAvatar";
import SparkIcon from "./icons/SparkIcon";
import TrophyIcon from "./icons/TrophyIcon";
import InkDropIcon from "./icons/InkDropIcon";
import { getTierProgress, GAME_DURATION } from "@/lib/rank";

interface ResultsScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
}

export default function ResultsScreen({ result, onPlayAgain }: ResultsScreenProps) {
  const [profile, setProfile] = useState(getProfile());
  const [bests, setBests] = useState(getPersonalBests());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setBests(getPersonalBests());
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const isWin = result.trophiesChange > 0;
  const isDraw = result.trophiesChange === 0 && result.mode === "ranked";
  const isLoss = result.trophiesChange < 0;

  const personalBestKey =
    result.mode === "ranked"
      ? bests.ranked
      : result.subject === "punctuation"
      ? bests.casual_punctuation
      : bests.casual_vocab;

  const isPersonalBest = result.score >= personalBestKey && result.score > 0;

  let outcomeLabel = "";
  let outcomeColor = "";
  let OutcomeIcon = SparkIcon;
  if (result.mode === "casual") {
    outcomeLabel = "Sprint Complete";
    outcomeColor = "text-[#3B82F6]";
    OutcomeIcon = SparkIcon;
  } else if (isWin) {
    outcomeLabel = "Victory";
    outcomeColor = "text-[#22C55E]";
    OutcomeIcon = TrophyIcon;
  } else if (isDraw) {
    outcomeLabel = "Draw";
    outcomeColor = "text-[#34D399]";
    OutcomeIcon = TrophyIcon;
  } else {
    outcomeLabel = "Defeat";
    outcomeColor = "text-[#EF4444]";
    OutcomeIcon = TrophyIcon;
  }

  const tierProgress = profile ? getTierProgress(profile.trophies, profile.rank_tier) : 0;
  const dropsEarned = result.correct * 2 + (result.trophiesChange > 0 ? 5 : 0);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      <div
        className={`w-full max-w-md space-y-5 transition-all duration-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="text-center">
          <div className="mx-auto mb-3">
            {profile ? (
              <InkAvatar config={profile.avatar_config} size="lg" className="mx-auto" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-[#F8FAFC] border-2 border-[#E2E8F0] shadow-lg">
                <OutcomeIcon className="w-10 h-10" color={outcomeColor.includes("22C55E") ? "#22C55E" : outcomeColor.includes("EF4444") ? "#EF4444" : outcomeColor.includes("34D399") ? "#34D399" : "#3B82F6"} />
              </div>
            )}
          </div>
          <h1 className={`text-4xl font-extrabold ${outcomeColor}`}>{outcomeLabel}</h1>
          {isPersonalBest && (
            <div className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#34D399]/50 text-[#059669] text-xs font-bold uppercase tracking-wider">
              New Personal Best!
            </div>
          )}
        </div>

        <div className="rounded-3xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-1">Score</p>
            <p className="text-[#0F172A] font-extrabold text-3xl">{result.score}</p>
          </div>
          <div>
            <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-1">Accuracy</p>
            <p
              className={`font-extrabold text-3xl ${
                result.accuracy >= 70 ? "text-[#22C55E]" : result.accuracy >= 50 ? "text-[#34D399]" : "text-[#EF4444]"
              }`}
            >
              {result.accuracy}%
            </p>
          </div>
          <div>
            <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-1">Correct</p>
            <p className="text-[#0F172A] font-extrabold text-3xl">{result.correct}/{result.totalQuestions}</p>
          </div>
        </div>

        {result.mode === "ranked" && (
          <div
            className={`flex items-center justify-between rounded-2xl px-5 py-4 border-2 ${
              isWin
                ? "bg-[#ECFDF5] border-[#22C55E]"
                : isLoss
                ? "bg-red-50 border-red-200"
                : "bg-[#F8FAFC] border-[#E2E8F0]"
            }`}
          >
            <span className="text-[#0F172A] font-bold">Trophies</span>
            <span
              className={`text-xl font-extrabold ${
                isWin ? "text-[#22C55E]" : isLoss ? "text-[#EF4444]" : "text-[#64748B]"
              }`}
            >
              {result.trophiesChange > 0 ? "+" : ""}
              {result.trophiesChange}
            </span>
          </div>
        )}

        {result.mode === "ranked" && profile && (
          <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-[#E2E8F0] shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <RankBadge tier={profile.rank_tier} size="md" />
              <span className="text-[#0F172A] font-bold">{profile.trophies} trophies</span>
            </div>
            <ProgressBar value={tierProgress} height="h-2.5" color={profile.rank_tier === "Gold" ? "#D4AF37" : profile.rank_tier === "Silver" ? "#C0C0C0" : "#3B82F6"} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2">
            <span className="text-[#22C55E] font-bold">Correct</span>
            <span className="text-[#0F172A] font-semibold">{result.correct}</span>
          </div>
          <div className="rounded-2xl px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2">
            <span className="text-[#EF4444] font-bold">Wrong</span>
            <span className="text-[#0F172A] font-semibold">{result.incorrect}</span>
          </div>
          <div className="rounded-2xl px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2">
            <span className="text-[#3B82F6] font-bold">Sprint</span>
            <span className="text-[#0F172A] font-semibold">{GAME_DURATION}s</span>
          </div>
          <div className="rounded-2xl px-4 py-3 bg-[#DBEAFE] border border-[#3B82F6]/20 flex items-center gap-2">
            <InkDropIcon className="w-4 h-4" color="#3B82F6" />
            <span className="text-[#3B82F6] font-bold">+{dropsEarned}</span>
            <span className="text-[#64748B] text-xs font-medium">Ink Drops</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 rounded-2xl font-extrabold text-lg text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <SparkIcon className="w-5 h-5" color="white" />
            Play Again
          </button>
          <Link
            href="/"
            className="w-full py-3 text-center text-[#64748B] hover:text-[#0F172A] font-bold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
