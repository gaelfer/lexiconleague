"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import type Phaser from 'phaser';
import { EventBus } from '@/game/EventBus';
import { createGame } from '@/game/PhaserGame';
import { getChapterQuestions } from '@/lib/story/chapters';
import HUDOverlay from './HUDOverlay';
import WordLockModal from './WordLockModal';
import type { Question } from '@/types';

interface StoryGameCanvasProps {
  chapterId: number;
}

interface WordLockState {
  doorId: string;
  question: Question;
}

/**
 * StoryGameCanvas — React wrapper for the Phaser game.
 *
 * This component is always dynamic-imported with `ssr: false`, so it is safe
 * to reference browser globals (window, Phaser) without guards.
 */
export default function StoryGameCanvas({ chapterId }: StoryGameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // HUD state (mirrors Phaser-side values)
  const [hearts, setHearts] = useState(3);
  const [maxHearts] = useState(3);
  const [lexicoins, setLexicoins] = useState(0);

  // Word lock overlay state
  const [wordLock, setWordLock] = useState<WordLockState | null>(null);

  // Chapter complete overlay
  const [chapterDone, setChapterDone] = useState(false);

  // ── Game lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = createGame(containerRef.current, chapterId);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [chapterId]);

  // ── EventBus subscriptions ──────────────────────────────────────────────────

  useEffect(() => {
    const onHealthChanged = ({ hearts: h }: { hearts: number }) => setHearts(h);
    const onLexicoinsChanged = ({ amount }: { amount: number }) => setLexicoins(amount);

    const onNearDoor = ({ doorId, questionType }: { doorId: string; questionType: string }) => {
      const questions = getChapterQuestions(chapterId);
      if (!questions.length) return;
      // Pick a random question each time a door is opened
      const q = questions[Math.floor(Math.random() * questions.length)];
      setWordLock({ doorId, question: q });
      void questionType; // used in Phase 2 for targeted question types
    };

    const onChapterComplete = () => setChapterDone(true);

    EventBus.on('health-changed', onHealthChanged);
    EventBus.on('lexicoins-changed', onLexicoinsChanged);
    EventBus.on('player-near-door', onNearDoor);
    EventBus.on('chapter-complete', onChapterComplete);

    return () => {
      EventBus.off('health-changed', onHealthChanged);
      EventBus.off('lexicoins-changed', onLexicoinsChanged);
      EventBus.off('player-near-door', onNearDoor);
      EventBus.off('chapter-complete', onChapterComplete);
    };
  }, [chapterId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const closeWordLock = useCallback(() => setWordLock(null), []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#080f1a',
      }}
    >
      {/* Phaser canvas container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* HUD */}
      <HUDOverlay hearts={hearts} maxHearts={maxHearts} lexicoins={lexicoins} />

      {/* Word lock modal */}
      {wordLock && (
        <WordLockModal
          doorId={wordLock.doorId}
          question={wordLock.question}
          onClose={closeWordLock}
        />
      )}

      {/* Chapter complete banner */}
      {chapterDone && (
        <ChapterCompleteBanner chapterId={chapterId} />
      )}
    </div>
  );
}

function ChapterCompleteBanner({ chapterId }: { chapterId: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        gap: '20px',
      }}
    >
      <p
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          color: '#34d399',
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        Chapter {chapterId} Complete!
      </p>
      <p
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '16px',
          color: '#94a3b8',
        }}
      >
        The corruption retreats. For now.
      </p>
      <a
        href="/story"
        style={{
          marginTop: '12px',
          padding: '12px 28px',
          background: '#34d399',
          color: '#080f1a',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 700,
          fontSize: '15px',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Return to World Map
      </a>
    </div>
  );
}
