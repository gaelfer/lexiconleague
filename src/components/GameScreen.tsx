"use client";

import { useMemo, useEffect } from "react";
import { Subject, GameMode, GameResult, DEFAULT_AVATAR_CONFIG, InkAvatarConfig } from "@/types";
import type { OpponentInfo } from "@/lib/game/matchmaking";
import { getQuestionsForMode } from "@/lib/game/questions";
import { useGame } from "@/hooks/useGame";
import { applyGameResult, updatePersonalBest } from "@/lib/user/storage";
import TimerRing from "./TimerRing";
import InkAvatar from "./InkAvatar";
import { GAME_DURATION } from "@/lib/game/rank";

interface GameScreenProps {
  mode: GameMode;
  subject: Subject;
  onComplete: (result: GameResult) => void;
  /** Called each time the player answers a question (for ranked live opponent sync) */
  onAnswerProgress?: (answered: number, score: number) => void;
  /** Opponent's answered count (for ranked live display) */
  opponentAnswered?: number | null;
  /** Opponent's score (for ranked live display, when available) */
  opponentScore?: number | null;
  /** Opponent info for ranked VS bar */
  opponent?: OpponentInfo | null;
  /** Player's avatar config for ranked VS bar (shows on "You" side) */
  playerAvatarConfig?: InkAvatarConfig;
  /** For ranked: returns opponent's final score (used for win/loss & trophies) */
  getOpponentScore?: () => number | null;
}

export default function GameScreen({ mode, subject, onComplete, onAnswerProgress, opponentAnswered, opponentScore, opponent, playerAvatarConfig, getOpponentScore }: GameScreenProps) {
  const questions = useMemo(() => getQuestionsForMode(subject, 30), [subject]);

  const {
    currentQuestion,
    currentIndex,
    timeLeft,
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
    onComplete: (result) => {
      applyGameResult(result);
      updatePersonalBest(result);
      onComplete(result);
    },
    onAnswerProgress,
    getOpponentScore,
  });

  useEffect(() => {
    const t = setTimeout(() => startGame(), 300);
    return () => clearTimeout(t);
  }, [startGame]);

  if (!currentQuestion || !isStarted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#64748B] text-lg font-semibold animate-pulse">Loading…</div>
      </div>
    );
  }

  const totalAnswered = correctCount + incorrectCount;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;
  const isRanked = mode === "ranked" && opponent;
  const questionCount = totalQuestions || 30;
  const playerDotsFilled = Math.min(10, Math.floor((totalAnswered / questionCount) * 10));
  const opponentDotsFilled = Math.min(10, Math.floor(((opponentAnswered ?? 0) / questionCount) * 10));

  return (
    <main className="min-h-[100dvh] min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Ranked VS bar - live opponent progress */}
      {isRanked && (
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border-b border-[#334155] min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <InkAvatar config={playerAvatarConfig ? { ...DEFAULT_AVATAR_CONFIG, ...playerAvatarConfig } : undefined} size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">You</p>
              <p className="text-base sm:text-lg font-extrabold text-white tabular-nums">{correctCount * 10}</p>
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
            <p className="text-[10px] sm:text-xs font-semibold text-[#94A3B8]">Live</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end">
            <div className="flex gap-0.5 sm:gap-1 shrink-0">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${i < opponentDotsFilled ? "bg-[#34D399]" : "bg-[#334155]"}`} />
              ))}
            </div>
            <div className="text-right min-w-0">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase truncate max-w-[60px] sm:max-w-[80px]">
                {opponent.username}
                {opponent.isBot && " BOT"}
              </p>
              <p className="text-base sm:text-lg font-extrabold text-white tabular-nums">
                {opponentScore != null ? opponentScore : "—"}
              </p>
              <p className="text-[10px] text-[#94A3B8] tabular-nums">
                {opponentAnswered != null ? `${opponentAnswered}/${questionCount} q` : "—"}
              </p>
            </div>
            <InkAvatar config={opponent.avatar_config ? { ...DEFAULT_AVATAR_CONFIG, ...opponent.avatar_config } : undefined} size="sm" className="shrink-0" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pt-4 pb-2 border-b border-[#E2E8F0] bg-[#F8FAFC] min-w-0">
        <div className="text-left min-w-0 flex-1">
          <p className="text-[#64748B] text-[10px] sm:text-xs font-bold uppercase tracking-wider">Score</p>
          <p className="text-[#0F172A] font-extrabold text-xl sm:text-2xl tabular-nums">{correctCount * 10}</p>
        </div>

        <TimerRing timeLeft={timeLeft} totalTime={GAME_DURATION} />

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
