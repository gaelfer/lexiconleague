"use client";

import { useState, useEffect, useCallback } from 'react';
import { EventBus } from '@/game/EventBus';
import type { Question } from '@/types';

interface WordLockModalProps {
  doorId: string;
  question: Question;
  onClose: () => void;
}

export default function WordLockModal({ doorId, question, onClose }: WordLockModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  const handleAnswer = useCallback(
    (index: number) => {
      if (result !== null) return;

      const correct = index === question.answer_index;
      setSelected(index);
      setResult(correct ? 'correct' : 'wrong');

      // Give the player time to see the result before closing
      const delay = correct ? 700 : 1200;
      setTimeout(() => {
        EventBus.emit('question-result', { correct, doorId });
        onClose();
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
        background: 'rgba(0,0,0,0.7)',
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
          background: '#0d1b2a',
          border: '1.5px solid #1e3a5f',
          borderRadius: '12px',
          padding: '28px 32px',
          maxWidth: '520px',
          width: '90%',
          boxShadow: '0 0 40px rgba(52,211,153,0.1)',
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
          <span
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#34d399',
            }}
          >
            Word Lock
          </span>
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
                borderRadius: '8px',
                padding: '11px 16px',
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
            {result === 'correct' ? '✓ Door unlocked! +10 Lexicoins' : '✗ Try again in a moment…'}
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
