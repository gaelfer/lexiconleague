"use client";

import { useMemo, useEffect } from "react";
import { Subject, GameMode, GameResult } from "@/types";
import { getQuestionsForMode } from "@/lib/questions";
import { useGame } from "@/hooks/useGame";
import { applyGameResult, updatePersonalBest } from "@/lib/storage";
import TimerRing from "./TimerRing";
import { GAME_DURATION } from "@/lib/rank";

interface GameScreenProps {
  mode: GameMode;
  subject: Subject;
  onComplete: (result: GameResult) => void;
}

export default function GameScreen({ mode, subject, onComplete }: GameScreenProps) {
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

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="text-left min-w-[80px]">
          <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Score</p>
          <p className="text-[#0F172A] font-extrabold text-2xl tabular-nums">{correctCount * 10}</p>
        </div>

        <TimerRing timeLeft={timeLeft} totalTime={GAME_DURATION} />

        <div className="text-right min-w-[80px]">
          <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Accuracy</p>
          <p
            className={`font-extrabold text-2xl tabular-nums ${
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

      <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-xl mx-auto w-full gap-6">
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

      <div className="px-4 pb-6 flex justify-center gap-8 text-center bg-[#F8FAFC] border-t border-[#E2E8F0]">
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
