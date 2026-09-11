"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type Phaser from 'phaser';
import { EventBus } from '@/game/EventBus';
import { createGame } from '@/game/PhaserGame';
import { getChapterQuestions } from '@/lib/story/chapters';
import HUDOverlay from './HUDOverlay';
import WordLockModal from './WordLockModal';
import type { Question } from '@/types';
import { createGuestProfile, getProfile } from '@/lib/user/storage';
import { markChapterComplete, getStoryProgress, isChapterUnlocked, saveStoryProgress } from '@/lib/story/progress';
import { areaForChapter, getStorySettings } from '@/lib/story/adventure';
import AdventureMenu from './AdventureMenu';
import {getStoryInventory} from '@/lib/story/progress';
import {toolSlots,TOOL_KEYS} from '@/lib/story/equipment';

interface StoryGameCanvasProps {
  chapterId: number;
}

interface WordLockState {
  doorId: string;
  question: Pick<Question, 'prompt' | 'choices' | 'answer_index' | 'skill_tag'>;
  gateNumber: number;
  title?: string;
  repository?: boolean;
}

const TOTAL_CHAPTER_GATES = 3;

/**
 * StoryGameCanvas — React wrapper for the Phaser game.
 *
 * This component is always dynamic-imported with `ssr: false`, so it is safe
 * to reference browser globals (window, Phaser) without guards.
 */
export default function StoryGameCanvas({ chapterId }: StoryGameCanvasProps) {
  const [slots,setSlots]=useState(()=>toolSlots(getStoryInventory()));
  useEffect(()=>{const refresh=()=>setSlots(toolSlots(getStoryInventory()));window.addEventListener('story-save',refresh);return()=>window.removeEventListener('story-save',refresh);},[]);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const questionsByDoorRef = useRef(new Map<string, Question>());

  // HUD state (mirrors Phaser-side values)
  const [hearts, setHearts] = useState(3);
  const [maxHearts] = useState(3);
  const [lexicoins, setLexicoins] = useState(0);
  const [openedGates, setOpenedGates] = useState(0);

  // Word lock overlay state
  const [wordLock, setWordLock] = useState<WordLockState | null>(null);

  // Chapter complete overlay
  const [chapterDone, setChapterDone] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // ── Game lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    if (chapterId === 0 ? !getStoryProgress().completedChapters.includes(1) : !isChapterUnlocked(chapterId)) {
      setAccessDenied(true);
      return;
    }

    const profile = getProfile() ?? createGuestProfile();
    questionsByDoorRef.current.clear();
    setOpenedGates(0);
    gameRef.current = createGame(containerRef.current, chapterId, profile.avatar_config);
    const settings=getStorySettings();
    gameRef.current.sound.mute=!settings.sound;
    gameRef.current.sound.volume=settings.volume;
    saveStoryProgress({resumeArea:areaForChapter(chapterId),startedAt:getStoryProgress().startedAt??Date.now()});

    return () => {
      gameRef.current?.destroy(true);
      // Destruction is deferred to a frame, including when the journal stopped the loop.
      gameRef.current?.loop.wake();
      gameRef.current = null;
    };
  }, [chapterId]);

  // ── EventBus subscriptions ──────────────────────────────────────────────────

  useEffect(() => {
    const onHealthChanged = ({ hearts: h }: { hearts: number }) => setHearts(h);
    const onLexicoinsChanged = ({ amount }: { amount: number }) => setLexicoins(amount);
    const onWordGatesChanged = ({ opened }: { opened: number; total: number }) => setOpenedGates(opened);
    const onRepositoryQuestion = (payload: WordLockState) => setWordLock({...payload, repository:true});
    const onRepositoryQuestionClosed = () => setWordLock(current => current?.repository ? null : current);

    const onNearDoor = ({ doorId, questionType }: { doorId: string; questionType: string }) => {
      const questions = getChapterQuestions(chapterId);
      if (!questions.length) return;
      const gateNumber = Number.parseInt(doorId.replace('word-seal-', ''), 10) || 1;
      // Keep the same question on a failed attempt so feedback can become mastery.
      const existingQuestion = questionsByDoorRef.current.get(doorId);
      const question = existingQuestion ?? questions[(gateNumber - 1) % questions.length];
      questionsByDoorRef.current.set(doorId, question);
      setWordLock({ doorId, question, gateNumber });
      void questionType; // used in Phase 2 for targeted question types
    };

    // Recording the completion is what actually unlocks the next chapter on the
    // world map; without it the banner was a dead end.
    const onChapterComplete = () => {
      markChapterComplete(chapterId);
      setChapterDone(true);
    };

    EventBus.on('health-changed', onHealthChanged);
    EventBus.on('repository-question', onRepositoryQuestion);
    EventBus.on('repository-question-closed', onRepositoryQuestionClosed);
    EventBus.on('lexicoins-changed', onLexicoinsChanged);
    EventBus.on('word-gates-changed', onWordGatesChanged);
    EventBus.on('player-near-door', onNearDoor);
    EventBus.on('chapter-complete', onChapterComplete);

    return () => {
      EventBus.off('health-changed', onHealthChanged);
      EventBus.off('repository-question', onRepositoryQuestion);
      EventBus.off('repository-question-closed', onRepositoryQuestionClosed);
      EventBus.off('lexicoins-changed', onLexicoinsChanged);
      EventBus.off('word-gates-changed', onWordGatesChanged);
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
      {chapterId !== 0 && <HUDOverlay
        hearts={hearts}
        maxHearts={maxHearts}
        lexicoins={lexicoins}
        openedGates={openedGates}
        totalGates={TOTAL_CHAPTER_GATES}
        healthOnly={chapterId === 2}
      />}
      {accessDenied && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', color: '#e8d8b0' }}>This route hasn’t opened yet. <Link href="/story">Continue your adventure</Link></div>}

      {!accessDenied&&<AdventureMenu game={gameRef} chapterId={chapterId} blocked={!!wordLock} hearts={hearts}/>}

      <div
        aria-label="Game controls"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 14,
          transform: 'translateX(-50%)',
          zIndex: 30,
          color: '#94a3b8',
          background: 'rgba(8, 15, 26, 0.82)',
          border: '1px solid #1e3a5f',
          borderRadius: 999,
          padding: '7px 13px',
          fontFamily: 'Outfit, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {`WASD · MOVE   ${TOOL_KEYS.filter(key=>slots[key]).map(key=>`${key} · ${slots[key]?.toUpperCase()}`).join('   ')}   E · INTERACT   M · INVENTORY / SKILLS`}
      </div>

      {/* Word lock modal */}
      {wordLock && (
        <WordLockModal
          key={wordLock.doorId}
          title={wordLock.title}
          repository={wordLock.repository}
          doorId={wordLock.doorId}
          question={wordLock.question}
          gateNumber={wordLock.gateNumber}
          totalGates={TOTAL_CHAPTER_GATES}
          onClose={closeWordLock}
        />
      )}

      {/* Chapter complete banner */}
      {chapterDone && (
        <ChapterCompleteBanner />
      )}
    </div>
  );
}

function ChapterCompleteBanner() {
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
        The way is clear.
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
      <Link
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
        Return to title screen
      </Link>
    </div>
  );
}
