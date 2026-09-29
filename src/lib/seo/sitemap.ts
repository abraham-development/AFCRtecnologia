import { navItems } from '@/content/agency';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afcrtecnologia.com';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * sitemap.xml del sitio, servido por `src/app/sitemap.xml/route.ts`. Se genera
 * aqui (y no con el archivo de metadatos `sitemap.ts`) para conservar el mismo
 * XML que ya indexan los buscadores.
 */
export function sitemapResponse(): Response {
  const today = new Date().toISOString().slice(0, 10);
  const entries = navItems.map((item) => ({
    loc: `${siteUrl}${item.href === '/' ? '' : item.href}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: item.href === '/' ? '1' : '0.8',
  }));

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
