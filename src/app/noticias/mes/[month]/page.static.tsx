import { sortedNews } from '@/content/news';
import { newsMonths } from '@/lib/news/archive';
import { NewsMonthRoute, newsMonthMetadata } from '@/lib/news/news-month-route';

/** Export estatico: un mes por cada mes con notas de respaldo. */
export const dynamicParams = false;

export function generateStaticParams() {
  return newsMonths(sortedNews).map((month) => ({ month: month.key }));
}

export const generateMetadata = newsMonthMetadata;
export default NewsMonthRoute;
