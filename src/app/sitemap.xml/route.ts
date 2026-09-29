import { sitemapResponse } from '@/lib/seo/sitemap';

/** Solo paginas institucionales: se genera al compilar en ambos builds. */
export const dynamic = 'force-static';

export const GET = sitemapResponse;
