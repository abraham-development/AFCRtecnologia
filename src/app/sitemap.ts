import type { MetadataRoute } from 'next';

import { navItems } from '@/content/agency';
import { getPublishedNews } from '@/lib/news/repository';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afcrtecnologia.com';

/**
 * `force-static` es necesario para `output: 'export'`. En el build Node el
 * sitemap queda en cache y se regenera al invalidar el tag `news` (MCP).
 */
export const dynamic = 'force-static';
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = navItems.map((item) => ({
    url: `${siteUrl}${item.href === '/' ? '' : item.href}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: item.href === '/' ? 1 : 0.8,
  }));

  const posts = (await getPublishedNews()).map((post) => ({
    url: `${siteUrl}/noticias/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }));

  return [...pages, ...posts];
}
