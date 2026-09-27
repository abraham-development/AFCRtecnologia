import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import NewsArticle from '@/components/news/NewsArticle';
import { getPublishedNews, getPublishedNewsBySlug, relatedPosts } from '@/lib/news/repository';

interface NewsPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Las notas publicadas al compilar se prerenderizan; las que publique el MCP
 * despues se generan en su primera visita (dynamicParams por defecto) y
 * quedan en cache con el tag `news`.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPublishedNews();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
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

export default async function NewsPage({ params }: NewsPageProps) {
  const { slug } = await params;
  const post = await getPublishedNewsBySlug(slug);
  if (!post) notFound();
  const related = relatedPosts(post, await getPublishedNews());
  return <NewsArticle post={post} related={related} />;
}
