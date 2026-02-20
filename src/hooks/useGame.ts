"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Question, GameMode, Subject, GameResult, RankTier } from "@/types";
import {
  calculateScore,
  calculateAccuracy,
  determineResult,
  calculateTrophyChange,
  GAME_DURATION,
} from "@/lib/game/rank";
import { getProfile, createGuestProfile } from "@/lib/user/storage";

interface UseGameOptions {
  mode: GameMode;
  subject: Subject;
  questions: Question[];
  onComplete: (result: GameResult) => void;
  onAnswerProgress?: (answered: number, score: number) => void;
  /** For ranked: returns opponent's final score. Win/loss/trophies use score comparison. */
  getOpponentScore?: () => number | null;
}

export function useGame({ mode, subject, questions, onComplete, onAnswerProgress, getOpponentScore }: UseGameOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const finishGame = useCallback(
    (correct: number, incorrect: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      if (timerRef.current) clearInterval(timerRef.current);

      const total = correct + incorrect;
      const score = calculateScore(correct);
      const accuracy = calculateAccuracy(correct, total);
      const opponentScore = mode === "ranked" ? getOpponentScore?.() ?? null : null;
      const result =
        mode === "ranked" && opponentScore != null
          ? score > opponentScore
            ? "win"
            : score < opponentScore
            ? "loss"
            : "draw"
          : determineResult(correct, total);
      const profile = getProfile() ?? createGuestProfile();
      const winStreak = mode === "ranked" ? (profile.ranked_win_streak ?? 0) : 0;
      const trophiesChange = calculateTrophyChange(result, profile.rank_tier, mode, winStreak);

      const gameResult: GameResult = {
        score,
        correct,
        incorrect,
        accuracy,
        totalQuestions: total,
        mode,
        subject,
        trophiesChange,
        newTier: profile.rank_tier as RankTier,
      };

      setIsFinished(true);
      onComplete(gameResult);
    },
    [mode, subject, onComplete, getOpponentScore]
  );

  // Countdown timer
  useEffect(() => {
    if (!isStarted || isFinished) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isFinished]);

  // When timer hits 0, finish
  useEffect(() => {
    if (timeLeft === 0 && isStarted && !isFinished) {
      finishGame(correctCount, incorrectCount);
    }
  }, [timeLeft, isStarted, isFinished, finishGame, correctCount, incorrectCount]);

  const startGame = useCallback(() => {
    setIsStarted(true);
  }, []);

  const submitAnswer = useCallback(
    (choiceIndex: number) => {
      if (answerState !== "idle" || isFinished || !isStarted) return;

      const current = questions[currentIndex];
      const isCorrect = choiceIndex === current.answer_index;

      setSelectedAnswer(choiceIndex);
      setAnswerState(isCorrect ? "correct" : "incorrect");

      const newCorrect = isCorrect ? correctCount + 1 : correctCount;
      const newIncorrect = !isCorrect ? incorrectCount + 1 : incorrectCount;

      if (isCorrect) setCorrectCount(newCorrect);
      else setIncorrectCount(newIncorrect);

      const totalAnswered = newCorrect + newIncorrect;
      const newScore = calculateScore(newCorrect);
      onAnswerProgress?.(totalAnswered, newScore);

      // Short pause, then advance
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
          finishGame(newCorrect, newIncorrect);
        } else {
          setCurrentIndex(nextIndex);
          setSelectedAnswer(null);
          setAnswerState("idle");
        }
      }, 500);
    },
    [
      answerState,
      isFinished,
      isStarted,
      questions,
      currentIndex,
      correctCount,
      incorrectCount,
      finishGame,
      onAnswerProgress,
    ]
  );

  return {
    currentQuestion: questions[currentIndex] ?? null,
    currentIndex,
    timeLeft,
    correctCount,
    incorrectCount,
    selectedAnswer,
    answerState,
    isFinished,
    isStarted,
    startGame,
    submitAnswer,
    totalQuestions: questions.length,
  };
}
