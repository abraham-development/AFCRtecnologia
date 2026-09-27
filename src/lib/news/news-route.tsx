import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import NewsArticle from '@/components/news/NewsArticle';
import { getPublishedNews, getPublishedNewsBySlug, relatedPosts } from '@/lib/news/repository';

/**
 * Logica comun de `/noticias/[slug]`. La ruta tiene dos archivos, cada uno
 * solo existe en su build (ver `pageExtensions` en next.config.mjs):
 * - `page.node.tsx` (Hostinger): dinamica, lee Supabase en cada visita.
 * - `page.static.tsx` (export): prerenderiza las notas de respaldo.
 */
export interface NewsRouteProps {
  params: Promise<{ slug: string }>;
}

export async function newsRouteMetadata({ params }: NewsRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedNewsBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/noticias/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      ...(post.cover ? { images: [{ url: post.cover.src, alt: post.cover.alt }] } : {}),
    },
  };
}

export async function NewsRoute({ params }: NewsRouteProps) {
  const { slug } = await params;
  const post = await getPublishedNewsBySlug(slug);
  if (!post) notFound();
  const related = relatedPosts(post, await getPublishedNews());
  return <NewsArticle post={post} related={related} />;
}
