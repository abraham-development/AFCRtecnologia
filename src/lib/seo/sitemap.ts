import { navItems } from '@/content/agency';
import { monthHref, newsMonths, postsInMonth } from '@/lib/news/archive';
import { getPublishedNews } from '@/lib/news/repository';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afcrtecnologia.com';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * sitemap.xml del sitio. Se sirve desde dos route handlers con la misma logica:
 * `src/app/sitemap.xml/route.node.ts` (build Node: dinamico, incluye las notas
 * recien publicadas por el MCP) y `route.static.ts` (export estatico, que exige
 * `force-static`). Next no admite extensiones propias en el archivo de
 * metadatos `sitemap.ts`, por eso se genera el XML aqui.
 */
export async function sitemapResponse(): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const posts = await getPublishedNews();
  const entries = [
    ...navItems.map((item) => ({
      loc: `${siteUrl}${item.href === '/' ? '' : item.href}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: item.href === '/' ? '1' : '0.8',
    })),
    ...posts.map((post) => ({
      loc: `${siteUrl}/noticias/${post.slug}`,
      lastmod: post.date,
      changefreq: 'yearly',
      priority: '0.5',
    })),
    // Archivo por mes: su fecha es la de la nota mas reciente del mes.
    ...newsMonths(posts).map((month) => ({
      loc: `${siteUrl}${monthHref(month.key)}`,
      lastmod: postsInMonth(posts, month.key)[0]?.date ?? today,
      changefreq: 'monthly',
      priority: '0.4',
    })),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (entry) =>
        `<url><loc>${escapeXml(entry.loc)}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
    ),
    '</urlset>',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
