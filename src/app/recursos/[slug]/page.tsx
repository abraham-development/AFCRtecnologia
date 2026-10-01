import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ResourceArticleView from '@/components/resources/ResourceArticleView';
import { agency } from '@/content/agency';
import {
  coverSources,
  getResourceArticle,
  relatedResourceArticles,
  resourceArticles,
  resourceHref,
  resourcesCopy,
} from '@/content/resources';
import { siteUrl } from '@/lib/seo/site-url';

/** Contenido estatico: se prerenderiza en ambos builds (Node y export). */
export const dynamicParams = false;

export function generateStaticParams() {
  return resourceArticles.map((article) => ({ slug: article.slug }));
}

interface ResourcePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getResourceArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: resourceHref(article.slug) },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      authors: [resourcesCopy.author],
      ...(article.cover ? { images: [{ url: coverSources(article.cover).og, alt: article.cover.alt }] } : {}),
    },
  };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const article = getResourceArticle(slug);
  if (!article) notFound();

  const url = `${siteUrl}${resourceHref(article.slug)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    inLanguage: 'es-PE',
    mainEntityOfPage: url,
    url,
    author: { '@type': 'Organization', name: resourcesCopy.author, url: siteUrl },
    publisher: { '@type': 'Organization', name: agency.name, logo: `${siteUrl}/brand/afcr-logotipo.png` },
    ...(article.cover ? { image: `${siteUrl}${coverSources(article.cover).og}` } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // El JSON-LD es estatico y generado en el servidor.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ResourceArticleView article={article} related={relatedResourceArticles(article)} />
    </>
  );
}
