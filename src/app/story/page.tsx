"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CHAPTERS, REGIONS } from '@/lib/story/chapters';
import { getStoryProgress, isChapterUnlocked } from '@/lib/story/progress';
import type { StoryProgress } from '@/lib/story/progress';

export default function StoryWorldMap() {
  const [progress, setProgress] = useState<StoryProgress | null>(null);

  useEffect(() => {
    setProgress(getStoryProgress());
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#080f1a',
        color: '#e2e8f0',
        fontFamily: 'Outfit, sans-serif',
        padding: '40px 24px 80px',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <Link
          href="/"
          style={{
            fontSize: '13px',
            color: '#475569',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '24px',
          }}
        >
          ← Back
        </Link>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '32px',
            fontWeight: 700,
            color: '#f1f5f9',
            marginBottom: '8px',
          }}
        >
          Story Mode
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          A Zelda-style dungeon crawler. Answer vocabulary questions to unlock doors, defeat bosses,
          and save the world of language.
        </p>
      </div>

      {/* Regions + chapters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {REGIONS.map((region) => {
          const regionChapters = CHAPTERS.filter((c) => region.chapters.includes(c.id as never));

          return (
            <section key={region.index}>
              {/* Region header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: `1px solid ${region.color}22`,
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: region.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <h2
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: region.color,
                      margin: 0,
                    }}
                  >
                    {region.name}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                    {region.vibe}
                  </p>
                </div>
              </div>

              {/* Chapter cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '14px',
                }}
              >
                {regionChapters.map((chapter) => {
                  const unlocked = progress ? isChapterUnlocked(chapter.id) : chapter.id === 1;
                  const completed = progress?.completedChapters.includes(chapter.id) ?? false;

                  return (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      unlocked={unlocked}
                      completed={completed}
                      regionColor={region.color}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function ChapterCard({
  chapter,
  unlocked,
  completed,
  regionColor,
}: {
  chapter: (typeof CHAPTERS)[number];
  unlocked: boolean;
  completed: boolean;
  regionColor: string;
}) {
  const borderColor = completed
    ? regionColor
    : unlocked
    ? '#1e3a5f'
    : '#0f1f33';

  return (
    <div
      style={{
        background: '#0d1b2a',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '18px',
        opacity: unlocked ? 1 : 0.45,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Completion badge */}
      {completed && (
        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            fontSize: '14px',
            color: regionColor,
          }}
        >
          ✓
        </span>
      )}

      <p
        style={{
          fontSize: '11px',
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: '6px',
          fontWeight: 600,
        }}
      >
        Chapter {chapter.id}
        {chapter.hasBoss && (
          <span style={{ color: '#ef4444', marginLeft: '6px' }}>Boss</span>
        )}
      </p>

      <h3
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#e2e8f0',
          marginBottom: '8px',
        }}
      >
        {chapter.title}
      </h3>

      <p
        style={{
          fontSize: '12px',
          color: '#64748b',
          lineHeight: 1.5,
          marginBottom: '14px',
        }}
      >
        {chapter.teaser}
      </p>

      {unlocked ? (
        <Link
          href={`/story/${chapter.id}`}
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: completed ? 'transparent' : regionColor,
            color: completed ? regionColor : '#080f1a',
            border: `1.5px solid ${regionColor}`,
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {completed ? 'Replay' : 'Play'}
        </Link>
      ) : (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            color: '#475569',
          }}
        >
          🔒 Complete previous chapter
        </span>
      )}
    </div>
  );
}
