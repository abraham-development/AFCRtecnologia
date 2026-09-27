import { sortedNews } from '@/content/news';
import { NewsRoute, newsRouteMetadata } from '@/lib/news/news-route';

/** Export estatico: sin Supabase se prerenderizan las notas de respaldo. */
export const dynamicParams = false;

export function generateStaticParams() {
  return sortedNews.map((post) => ({ slug: post.slug }));
}

export const generateMetadata = newsRouteMetadata;
export default NewsRoute;
