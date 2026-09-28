import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import NewsMonthPage from '@/components/news/NewsMonthPage';
import { newsCopy } from '@/content/news';
import { isMonthKey, monthHref, monthLabel, newsMonths, postsInMonth } from '@/lib/news/archive';
import { getPublishedNews } from '@/lib/news/repository';

/**
 * Logica comun de `/noticias/mes/[month]` (month = AAAA-MM). Como la nota
 * individual, tiene `page.node.tsx` (dinamica, Supabase) y `page.static.tsx`
 * (export, notas de respaldo); `pageExtensions` elige uno por build.
 */
export interface NewsMonthRouteProps {
  params: Promise<{ month: string }>;
}

export async function newsMonthMetadata({ params }: NewsMonthRouteProps): Promise<Metadata> {
  const { month } = await params;
  if (!isMonthKey(month)) return {};
  const label = monthLabel(month);
  return {
    title: newsCopy.monthTitle(label),
    description: newsCopy.monthDescription(label),
    alternates: { canonical: monthHref(month) },
  };
}

export async function NewsMonthRoute({ params }: NewsMonthRouteProps) {
  const { month } = await params;
  if (!isMonthKey(month)) notFound();
  const all = await getPublishedNews();
  const posts = postsInMonth(all, month);
  if (posts.length === 0) notFound();
  return (
    <NewsMonthPage
      title={newsCopy.monthTitle(monthLabel(month))}
      month={month}
      posts={posts}
      months={newsMonths(all)}
      latestSlug={all[0]?.slug}
    />
  );
}
