"use client";

import dynamic from 'next/dynamic';

/**
 * Client-only wrapper that dynamically loads StoryGameCanvas with ssr: false.
 * Phaser requires window/document and cannot run during SSR.
 */
const StoryGameCanvas = dynamic(
  () => import('./StoryGameCanvas'),
  { ssr: false },
);

interface StoryGameLoaderProps {
  chapterId: number;
}

export default function StoryGameLoader({ chapterId }: StoryGameLoaderProps) {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <StoryGameCanvas chapterId={chapterId} />
    </div>
  );
}
