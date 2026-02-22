import { notFound } from 'next/navigation';
import { getChapter } from '@/lib/story/chapters';
import StoryGameLoader from '@/components/story/StoryGameLoader';

interface ChapterPageProps {
  params: Promise<{ chapterId: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { chapterId: raw } = await params;
  const chapterId = parseInt(raw, 10);

  if (isNaN(chapterId) || !getChapter(chapterId)) {
    notFound();
  }

  return <StoryGameLoader chapterId={chapterId} />;
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ chapterId: String(i + 1) }));
}
