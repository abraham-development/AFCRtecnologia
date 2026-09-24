import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import NewsArticle from '@/components/news/NewsArticle';
import { getNewsPost, newsPosts } from '@/content/news';

interface NewsPageProps {
  params: Promise<{ slug: string }>;
}

/** Todas las notas se generan en el build (tambien en el export estatico). */
export const dynamicParams = false;

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getNewsPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/noticias/${post.slug}` },
    openGraph: { type: 'article', title: post.title, description: post.excerpt, publishedTime: post.date },
  };
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { slug } = await params;
  const post = getNewsPost(slug);
  if (!post) notFound();
  return <NewsArticle post={post} />;
}
