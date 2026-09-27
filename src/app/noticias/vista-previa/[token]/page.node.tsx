import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import NewsArticle from '@/components/news/NewsArticle';
import { newsCopy } from '@/content/news';
import { getPostByPreviewToken, getPublishedNews, relatedPosts } from '@/lib/news/repository';

/**
 * Vista previa privada de un borrador: la URL la entrega el MCP (create_draft).
 * El token de 32 caracteres aleatorios es la unica llave; la pagina no se
 * indexa ni se cachea. Solo existe en el build Node (extension `.node.tsx`).
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: newsCopy.previewTitle,
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

interface PreviewPageProps {
  params: Promise<{ token: string }>;
}

export default async function NewsPreviewPage({ params }: PreviewPageProps) {
  const { token } = await params;
  const result = await getPostByPreviewToken(token);
  if (!result) notFound();
  const related = relatedPosts(result.post, await getPublishedNews());
  return <NewsArticle post={result.post} related={related} preview={result.status === 'draft'} />;
}
