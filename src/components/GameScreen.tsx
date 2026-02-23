"use client";

import { useMemo, useEffect } from "react";
import { Subject, GameMode, GameResult, DEFAULT_AVATAR_CONFIG, InkAvatarConfig, VocabLevel, Question } from "@/types";
import type { OpponentInfo } from "@/lib/game/matchmaking";
import { getQuestionsForMode } from "@/lib/game/questions";
import { useGame } from "@/hooks/useGame";
import { applyGameResult, updatePersonalBest, getProfile } from "@/lib/user/storage";
import { getLevel, LEVEL_REWARDS } from "@/lib/user/levels";
import { isLevelRewardClaimed } from "@/lib/user/storage";
import TimerRing from "./TimerRing";
import InkAvatar from "./InkAvatar";

interface TeamMemberDisplay {
  username: string;
  avatar_config: InkAvatarConfig;
}

interface GameScreenProps {
  mode: GameMode;
  subject: Subject;
  onComplete: (result: GameResult, metadata?: import("@/types").GameResultMetadata) => void;
  /** Incrementing signal to force-end the game with current stats. */
  forceFinishSignal?: number;
  /** Called each time the player answers a question (for ranked live opponent sync) */
  onAnswerProgress?: (answered: number, score: number) => void;
  /** Opponent's answered count (for ranked live display). For 3v3, combined total. */
  opponentAnswered?: number | null;
  /** Opponent's score (for ranked live display). For 3v3, combined team score. */
  opponentScore?: number | null;
  /** Opponent info for VS bar. For 3v3, pass all 3 opponents. */
  opponent?: OpponentInfo | null;
  /** For 3v3: all opponents (replaces opponent when length > 1) */
  opponents?: OpponentInfo[];
  /** For 3v3: your 2 teammates (avatar + name) */
  teamMembers?: TeamMemberDisplay[];
  /** For 3v3: teammate scores (2 values) */
  teammateScores?: number[];
  /** Player's avatar config for VS bar (shows on "You" side) */
  playerAvatarConfig?: InkAvatarConfig;
  /** For ranked: returns opponent's final score (used for win/loss & trophies) */
  getOpponentScore?: () => number | null;
  /** For casual vocabulary: grade level (3-7), english1-3, ap-lang, ap-lit to filter questions */
  vocabGrade?: VocabLevel;
  /** Pre-computed questions (e.g. for party sync - same match for all) */
  questionsOverride?: Question[];
  /** Override game duration in seconds (e.g. 45 for daily challenge). Defaults to GAME_DURATION. */
  gameDuration?: number;
}

export default function GameScreen({ mode, subject, onComplete, forceFinishSignal, onAnswerProgress, opponentAnswered, opponentScore, opponent, opponents, teamMembers, teammateScores, playerAvatarConfig, getOpponentScore, vocabGrade, questionsOverride, gameDuration }: GameScreenProps) {
  const questions = useMemo(
    () => questionsOverride ?? getQuestionsForMode(subject, 30, vocabGrade),
    [subject, vocabGrade, questionsOverride]
  );

  const {
    currentQuestion,
    currentIndex,
    timeLeft,
    totalTime,
    correctCount,
    incorrectCount,
    selectedAnswer,
    isStarted,
    startGame,
    submitAnswer,
    totalQuestions,
  } = useGame({
    mode,
    subject,
    questions,
    duration: gameDuration,
    onComplete: (result) => {
      const prevProfile = getProfile();
      const prevTier = prevProfile?.rank_tier;
      const prevLevel = prevProfile ? getLevel(prevProfile.xp) : 1;
      applyGameResult(result);
      updatePersonalBest(result);
      const newProfile = getProfile();
      const newTier = newProfile?.rank_tier;
      const newLevel = newProfile ? getLevel(newProfile.xp) : 1;
      const rankUp = result.mode === "ranked" && prevTier && newTier && prevTier !== newTier
        ? { newTier: newTier }
        : undefined;
      const unclaimed = newProfile
        ? LEVEL_REWARDS.filter((r) => r.level <= newLevel && !isLevelRewardClaimed(r.level, newProfile))
        : [];
      const levelUp = newLevel > prevLevel
        ? { newLevel, hasUnclaimedRewards: unclaimed.length > 0 }
        : undefined;
      onComplete(result, { rankUp, levelUp });
    },
    forceFinishSignal,
    onAnswerProgress,
    getOpponentScore,
  });

  useEffect(() => {
    const t = setTimeout(() => startGame(), 300);
    return () => clearTimeout(t);
  }, [startGame]);

  // A=1, B=2, C=3, D=4 keybinds for answer selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selectedAnswer !== null || !currentQuestion) return;
      const key = e.key.toLowerCase();
      const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
      const idx = map[key];
      if (idx !== undefined && idx < currentQuestion.choices.length) {
        e.preventDefault();
        submitAnswer(idx);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedAnswer, currentQuestion, submitAnswer]);

  if (!currentQuestion || !isStarted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#64748B] text-lg font-semibold animate-pulse">Loading…</div>
      </div>
    );
  }

  const totalAnswered = correctCount + incorrectCount;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;
  const is3v3 = opponents && opponents.length === 3 && teamMembers && teamMembers.length === 2;
  const showVsBar = !!opponent || (opponents && opponents.length > 0);
  const questionCount = totalQuestions || 30;
  const playerScore = correctCount * 10;
  const yourTeamScore = is3v3 && teammateScores
    ? playerScore + teammateScores[0] + teammateScores[1]
    : playerScore;
  const theirTeamScore = opponentScore ?? 0;
  const playerDotsFilled = Math.min(10, Math.floor((totalAnswered / questionCount) * 10));
  const opponentDotsFilled = Math.min(10, Math.floor(((opponentAnswered ?? 0) / questionCount) * 10));

  return (
    <main className="min-h-[100dvh] min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* VS bar - player vs opponent (ranked & casual 1v1) or team vs team (3v3) */}
      {showVsBar && (opponent || opponents) && (
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border-b border-[#334155] min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {is3v3 ? (
              <div className="flex -space-x-2 sm:-space-x-1.5">
                <InkAvatar config={playerAvatarConfig ? { ...DEFAULT_AVATAR_CONFIG, ...playerAvatarConfig } : undefined} size="sm" className="shrink-0 ring-2 ring-[#1E293B]" />
                {teamMembers!.map((m, i) => (
                  <InkAvatar key={i} config={{ ...DEFAULT_AVATAR_CONFIG, ...m.avatar_config }} size="sm" className="shrink-0 ring-2 ring-[#1E293B]" />
                ))}
              </div>
            ) : (
              <InkAvatar config={playerAvatarConfig ? { ...DEFAULT_AVATAR_CONFIG, ...playerAvatarConfig } : undefined} size="sm" className="shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">{is3v3 ? "Your team" : "You"}</p>
              <p className="text-base sm:text-lg font-extrabold text-white tabular-nums">{is3v3 ? yourTeamScore : playerScore}</p>
              <p className="text-[10px] text-[#94A3B8] tabular-nums">{totalAnswered}/{questionCount} q</p>
            </div>
            <div className="flex gap-0.5 sm:gap-1 shrink-0">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${i < playerDotsFilled ? "bg-[#3B82F6]" : "bg-[#334155]"}`} />
              ))}
            </div>
          </div>
          <div className="text-center shrink-0 px-1">
            <p className="text-[10px] font-bold text-[#34D399] uppercase">VS</p>
            {mode === "ranked" && <p className="text-[10px] sm:text-xs font-semibold text-[#94A3B8]">Live</p>}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end">
            <div className="flex gap-0.5 sm:gap-1 shrink-0">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${i < opponentDotsFilled ? "bg-[#34D399]" : "bg-[#334155]"}`} />
              ))}
            </div>
            <div className="text-right min-w-0">
              {is3v3 ? (
                <>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Their team</p>
                  <p className="text-base sm:text-lg font-extrabold text-white tabular-nums">{theirTeamScore}</p>
                  <p className="text-[10px] text-[#94A3B8] tabular-nums">3 players</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase truncate max-w-[60px] sm:max-w-[80px]">
                    {(opponent || opponents![0]).username}
                    {(opponent || opponents![0]).isBot && " BOT"}
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-white tabular-nums">
                    {opponentScore != null ? opponentScore : "—"}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] tabular-nums">
                    {opponentAnswered != null ? `${opponentAnswered}/${questionCount} q` : "—"}
                  </p>
                </>
              )}
            </div>
            {is3v3 ? (
              <div className="flex -space-x-2 sm:-space-x-1.5">
                {opponents!.map((o, i) => (
                  <InkAvatar key={i} config={{ ...DEFAULT_AVATAR_CONFIG, ...o.avatar_config }} size="sm" className="shrink-0 ring-2 ring-[#1E293B]" />
                ))}
              </div>
            ) : (
              <InkAvatar config={(opponent || opponents![0]).avatar_config ? { ...DEFAULT_AVATAR_CONFIG, ...(opponent || opponents![0]).avatar_config } : undefined} size="sm" className="shrink-0" />
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pt-4 pb-2 border-b border-[#E2E8F0] bg-[#F8FAFC] min-w-0">
        <div className="text-left min-w-0 flex-1">
          <p className="text-[#64748B] text-[10px] sm:text-xs font-bold uppercase tracking-wider">Score</p>
          <p className="text-[#0F172A] font-extrabold text-xl sm:text-2xl tabular-nums">{correctCount * 10}</p>
        </div>

        <TimerRing timeLeft={timeLeft} totalTime={totalTime} />

        <div className="text-right min-w-0 flex-1">
          <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Accuracy</p>
          <p
            className={`font-extrabold text-xl sm:text-2xl tabular-nums ${
              accuracy >= 70 ? "text-[#22C55E]" : accuracy >= 50 ? "text-[#34D399]" : "text-[#EF4444]"
            }`}
          >
            {accuracy}%
          </p>
        </div>
      </div>

      <div className="px-4 pt-3 flex gap-1.5 flex-wrap justify-center">
        {questions.slice(0, Math.min(20, totalQuestions)).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < totalAnswered ? "bg-[#3B82F6]" : i === currentIndex ? "bg-[#0F172A]" : "bg-[#E2E8F0]"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 py-4 sm:py-6 max-w-xl mx-auto w-full gap-4 sm:gap-6 min-w-0">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-[#DBEAFE] text-[#64748B] text-xs font-bold capitalize">
            {currentQuestion.skill_tag.replace("-", " ")}
          </span>
          <span className="text-[#64748B] text-xs font-semibold">
            {"●".repeat(currentQuestion.difficulty)}{"○".repeat(5 - currentQuestion.difficulty)}
          </span>
        </div>

        <div
          key={currentIndex}
          className="animate-slide-up rounded-2xl p-6 bg-[#F8FAFC] border border-[#E2E8F0] shadow-lg"
        >
          <p className="text-[#0F172A] text-xl font-bold leading-relaxed">
            {currentQuestion.prompt}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.choices.map((choice, i) => {
            let style =
              "rounded-2xl px-5 py-4 font-medium transition-all border-2 text-left cursor-pointer " +
              "bg-white border-[#E2E8F0] hover:border-[#3B82F6] hover:bg-[#F8FAFC] text-[#0F172A]";

            if (selectedAnswer !== null) {
              if (i === currentQuestion.answer_index) {
                style =
                  "rounded-2xl px-5 py-4 font-medium border-2 text-left cursor-default " +
                  "bg-[#ECFDF5] border-[#22C55E] text-[#059669]";
              } else if (i === selectedAnswer) {
                style =
                  "rounded-2xl px-5 py-4 font-medium border-2 text-left cursor-default animate-wiggle " +
                  "bg-red-50 border-red-200 text-red-600";
              } else {
                style =
                  "rounded-2xl px-5 py-4 font-medium border-2 text-left cursor-default " +
                  "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]";
              }
            }

            return (
              <button
                key={i}
                onClick={() => submitAnswer(i)}
                disabled={selectedAnswer !== null}
                className={style}
              >
                <span className="text-[#64748B] mr-3 font-mono text-sm font-bold">
                  {String.fromCharCode(65 + i)}.
                </span>
                {choice}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 sm:px-4 pb-4 sm:pb-6 flex justify-center gap-4 sm:gap-8 text-center bg-[#F8FAFC] border-t border-[#E2E8F0] flex-wrap">
        <div>
          <p className="text-[#22C55E] font-extrabold text-xl">{correctCount}</p>
          <p className="text-[#64748B] text-xs font-bold">Correct</p>
        </div>
        <div>
          <p className="text-[#EF4444] font-extrabold text-xl">{incorrectCount}</p>
          <p className="text-[#64748B] text-xs font-bold">Wrong</p>
        </div>
        <div>
          <p className="text-[#0F172A] font-extrabold text-xl">
            {currentIndex + 1}/{Math.min(totalQuestions, 30)}
          </p>
          <p className="text-[#64748B] text-xs font-bold">Question</p>
        </div>
      </div>
    </main>
  );
}
