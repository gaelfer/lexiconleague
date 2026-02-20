"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GameResult, RANK_COLORS, GameResultMetadata } from "@/types";
import { getProfile, getPersonalBests } from "@/lib/user/storage";
import { addPendingNotification } from "@/lib/user/pending-notifications";
import RankBadge from "./RankBadge";
import ProgressBar from "./ProgressBar";
import InkAvatar from "./InkAvatar";
import SparkIcon from "./icons/SparkIcon";
import TrophyIcon from "./icons/TrophyIcon";
import InkDropIcon from "./icons/InkDropIcon";
import { getTierProgress, GAME_DURATION, getWinStreakMultiplier } from "@/lib/game/rank";

interface ResultsScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  /** Set when this was a placement match; shows grade assignment. */
  placementGrade?: number;
  /** Metadata for rank-up/level-up popups */
  metadata?: GameResultMetadata;
  /** For casual mode: win/loss against opponent(s) */
  casualOutcome?: "win" | "loss" | "draw";
}

export default function ResultsScreen({ result, onPlayAgain, placementGrade, metadata, casualOutcome }: ResultsScreenProps) {
  const [profile, setProfile] = useState(getProfile());
  const [bests, setBests] = useState(getPersonalBests());
  const [visible, setVisible] = useState(false);
  const [rankUpPopup, setRankUpPopup] = useState(metadata?.rankUp ?? null);
  const [levelUpPopup, setLevelUpPopup] = useState(metadata?.levelUp ?? null);

  useEffect(() => {
    setProfile(getProfile());
    setBests(getPersonalBests());
    setRankUpPopup(metadata?.rankUp ?? null);
    setLevelUpPopup(metadata?.levelUp ?? null);
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [metadata?.rankUp, metadata?.levelUp]);

  function dismissRankUpPopup() {
    if (rankUpPopup) {
      addPendingNotification("rank_up", { tier: rankUpPopup.newTier });
      setRankUpPopup(null);
    }
  }

  function dismissLevelUpPopup() {
    if (levelUpPopup) {
      if (levelUpPopup.hasUnclaimedRewards) {
        addPendingNotification("level_up", { level: levelUpPopup.newLevel });
      }
      setLevelUpPopup(null);
    }
  }

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
  if (placementGrade != null) {
    outcomeLabel = "Placement Complete";
    outcomeColor = "text-[#3B82F6]";
    OutcomeIcon = SparkIcon;
  } else if (result.mode === "casual" && casualOutcome) {
    outcomeLabel = casualOutcome === "win" ? "Win" : casualOutcome === "loss" ? "Lose" : "Tie";
    outcomeColor = casualOutcome === "win" ? "text-[#22C55E]" : casualOutcome === "loss" ? "text-[#EF4444]" : "text-[#64748B]";
    OutcomeIcon = TrophyIcon;
  } else if (result.mode === "casual") {
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
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8 relative">
      {/* Rank-up popup */}
      {rankUpPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-[#D4AF37]">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-[#D4AF37]">Rank Up!</p>
              <p className="mt-2 text-[#0F172A] font-bold">You reached {rankUpPopup.newTier}!</p>
              <p className="mt-1 text-sm text-[#64748B]">Keep climbing the leaderboard</p>
            </div>
            <div className="mt-6 flex gap-3">
              <Link
                href="/ranked"
                onClick={() => setRankUpPopup(null)}
                className="flex-1 py-3 rounded-xl font-bold text-white text-center bg-[#34D399] hover:opacity-90"
              >
                View Ranked
              </Link>
              <button
                onClick={dismissRankUpPopup}
                className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level-up popup */}
      {levelUpPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-[#8B5CF6]">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-[#8B5CF6]">Level Up!</p>
              <p className="mt-2 text-[#0F172A] font-bold">You reached Level {levelUpPopup.newLevel}!</p>
              {levelUpPopup.hasUnclaimedRewards && (
                <p className="mt-1 text-sm text-[#64748B]">You have rewards to claim</p>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              {levelUpPopup.hasUnclaimedRewards ? (
                <Link
                  href="/levels"
                  onClick={() => setLevelUpPopup(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-center bg-[#8B5CF6] hover:opacity-90"
                >
                  Claim Rewards
                </Link>
              ) : null}
              <button
                onClick={dismissLevelUpPopup}
                className={`flex-1 py-3 rounded-xl font-bold ${levelUpPopup.hasUnclaimedRewards ? "text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0]" : "text-white bg-[#8B5CF6] hover:opacity-90"}`}
              >
                {levelUpPopup.hasUnclaimedRewards ? "Close" : "Nice!"}
              </button>
            </div>
          </div>
        </div>
      )}
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
          {placementGrade != null && (
            <p className="mt-2 text-sm font-medium text-[#64748B]">
              You&apos;ll get <span className="font-bold text-[#0F172A]">Grade {placementGrade}</span> vocabulary in ranked. Climb to face harder questions!
            </p>
          )}
          {isPersonalBest && !placementGrade && (
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
              placementGrade != null
                ? "bg-[#DBEAFE] border-[#3B82F6]/40"
                : isWin
                ? "bg-[#ECFDF5] border-[#22C55E]"
                : isLoss
                ? "bg-red-50 border-red-200"
                : "bg-[#F8FAFC] border-[#E2E8F0]"
            }`}
          >
            <span className="text-[#0F172A] font-bold">
              {placementGrade != null ? "Placement" : "Trophies"}
            </span>
            <span
              className={`text-xl font-extrabold ${
                placementGrade != null ? "text-[#3B82F6]" : isWin ? "text-[#22C55E]" : isLoss ? "text-[#EF4444]" : "text-[#64748B]"
              }`}
            >
              {placementGrade != null ? "Grade " + placementGrade : `${result.trophiesChange > 0 ? "+" : ""}${result.trophiesChange}`}
            </span>
          </div>
        )}

        {result.mode === "ranked" && profile && (
          <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-[#E2E8F0] shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <RankBadge tier={profile.rank_tier} size="md" />
              <span className="text-[#0F172A] font-bold">{profile.trophies} trophies</span>
            </div>
            <ProgressBar value={tierProgress} height="h-2.5" color={RANK_COLORS[profile.rank_tier]} />
          </div>
        )}

        {result.mode === "ranked" && !placementGrade && (() => {
          const streak = profile?.ranked_win_streak ?? 0;
          if (isWin) {
            return (
              <div className="rounded-2xl px-4 py-3 bg-amber-50 border border-amber-200 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="#F59E0B" className="w-5 h-5 shrink-0">
                  <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.498 9.75 9.75 0 1010.5 14.25.75.75 0 00.75-.75v-4.133a.75.75 0 00-.75-.75 9.75 9.75 0 01-9.75-9.75.75.75 0 01.136-1.071z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <span className="font-extrabold text-amber-700 text-sm">
                    {streak === 1 ? "Streak started!" : `${streak} win streak!`}
                  </span>
                  {streak > 0 && (
                    <span className="ml-2 text-xs font-bold text-amber-600">
                      {streak >= 10 ? "MAX 3×" : `Next win: ${getWinStreakMultiplier(streak).toFixed(1)}× trophies`}
                    </span>
                  )}
                </div>
              </div>
            );
          }
          if (isLoss) {
            return (
              <div className="rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="#94A3B8" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.498 9.75 9.75 0 1010.5 14.25.75.75 0 00.75-.75v-4.133a.75.75 0 00-.75-.75 9.75 9.75 0 01-9.75-9.75.75.75 0 01.136-1.071z" clipRule="evenodd" />
                </svg>
                <span className="text-[#64748B] font-bold text-sm">Streak reset. Win again to start a new one.</span>
              </div>
            );
          }
          return null;
        })()}

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
