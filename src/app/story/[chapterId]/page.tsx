import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { getChapter } from '@/lib/story/chapters';

/**
 * StoryGameCanvas is dynamically imported with `ssr: false` because Phaser
 * accesses window / document and cannot run on the server.
 */
const StoryGameCanvas = dynamic(
  () => import('@/components/story/StoryGameCanvas'),
  { ssr: false },
);

interface ChapterPageProps {
  params: Promise<{ chapterId: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { chapterId: raw } = await params;
  const chapterId = parseInt(raw, 10);

  if (isNaN(chapterId) || !getChapter(chapterId)) {
    notFound();
  }

  return (
    // Full-viewport, no scrollbars — Phaser owns this space
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <StoryGameCanvas chapterId={chapterId} />
    </div>
  );
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ chapterId: String(i + 1) }));
}
