"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { EventBus } from '@/game/EventBus';
import type { Question } from '@/types';

interface WordLockModalProps {
  doorId: string;
  question: Question;
  gateNumber: number;
  totalGates: number;
  onClose: () => void;
}

export default function WordLockModal({
  doorId,
  question,
  gateNumber,
  totalGates,
  onClose,
}: WordLockModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If the modal is ever torn down by anything other than its own timer, the
  // pending emit would fire into a scene that is no longer expecting it and
  // leave the door's input lock stuck.
  useEffect(() => () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
  }, []);

  const handleAnswer = useCallback(
    (index: number) => {
      if (result !== null) return;

      const correct = index === question.answer_index;
      setSelected(index);
      setResult(correct ? 'correct' : 'wrong');

      // Give the player time to see the result before closing
      const delay = correct ? 700 : 1200;
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null;
        onClose();
        EventBus.emit('question-result', { correct, doorId });
      }, delay);
    },
    [doorId, question.answer_index, result, onClose],
  );

  // Keyboard shortcuts 1-4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= question.choices.length) {
        handleAnswer(num - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleAnswer, question.choices.length]);

  const choiceColor = (i: number) => {
    if (result === null) return '#1e293b';
    if (i === question.answer_index) return '#064e3b';
    if (i === selected && result === 'wrong') return '#7f1d1d';
    return '#1e293b';
  };

  const choiceBorder = (i: number) => {
    if (result === null) return '1.5px solid #334155';
    if (i === question.answer_index) return '1.5px solid #34d399';
    if (i === selected && result === 'wrong') return '1.5px solid #ef4444';
    return '1.5px solid #334155';
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(14, 54, 58, 0.72), rgba(2, 8, 15, 0.9))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Modal card */}
      <div
        style={{
          background: 'linear-gradient(145deg, #142d35 0%, #0b1c2b 65%, #10263a 100%)',
          border: '1.5px solid rgba(244, 201, 107, 0.6)',
          borderRadius: '18px',
          padding: '30px 32px 26px',
          maxWidth: '520px',
          width: '90%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.48), 0 0 50px rgba(88,224,176,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <LockIcon />
          <div>
            <span
              style={{
                display: 'block',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#f4c96b',
              }}
            >
              Restore Word Seal {gateNumber}/{totalGates}
            </span>
            <span style={{ display: 'block', marginTop: 3, fontFamily: 'Outfit, sans-serif', fontSize: 11, color: '#75bda7' }}>
              Choose the correct answer to open the path
            </span>
          </div>
        </div>

        {/* Question */}
        <p
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '17px',
            fontWeight: 600,
            color: '#e2e8f0',
            lineHeight: 1.5,
            marginBottom: '20px',
          }}
        >
          {question.prompt}
        </p>

        <div
          style={{
            display: 'inline-flex',
            marginBottom: 16,
            padding: '4px 9px',
            borderRadius: 999,
            background: 'rgba(88,224,176,0.1)',
            border: '1px solid rgba(88,224,176,0.2)',
            color: '#8fcfb7',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Skill · {question.skill_tag.replaceAll('-', ' ')}
        </div>

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={result !== null}
              style={{
                background: choiceColor(i),
                border: choiceBorder(i),
                borderRadius: '10px',
                padding: '13px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: result !== null ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  minWidth: '18px',
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px',
                  color: '#cbd5e1',
                }}
              >
                {choice}
              </span>
              {result !== null && i === question.answer_index && (
                <span style={{ marginLeft: 'auto', color: '#34d399', fontSize: '16px' }}>✓</span>
              )}
              {result === 'wrong' && i === selected && i !== question.answer_index && (
                <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '16px' }}>✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Result feedback */}
        {result !== null && (
          <p
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
              textAlign: 'center',
              marginTop: '16px',
              color: result === 'correct' ? '#34d399' : '#f87171',
              fontWeight: 600,
            }}
          >
            {result === 'correct'
              ? '✓ Seal restored! The path is open. +10 Lexicoins'
              : 'Study the highlighted answer, then try this seal again.'}
          </p>
        )}

        {/* Hint: keyboard shortcut */}
        {result === null && (
          <p
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '11px',
              color: '#334155',
              textAlign: 'center',
              marginTop: '14px',
            }}
          >
            Press 1 – 4 to answer
          </p>
        )}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="#34d399" fillOpacity="0.2" stroke="#34d399" strokeWidth="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="#34d399" />
    </svg>
  );
}
