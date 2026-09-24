import type { MetadataRoute } from 'next';

import { navItems } from '@/content/agency';
import { newsPosts } from '@/content/news';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afcrtecnologia.com';

/** Se genera en tiempo de build: necesario para `output: 'export'`. */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = navItems.map((item) => ({
    url: `${siteUrl}${item.href === '/' ? '' : item.href}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: item.href === '/' ? 1 : 0.8,
  }));

  const posts = newsPosts.map((post) => ({
    url: `${siteUrl}/noticias/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }));

  return [...pages, ...posts];
}
