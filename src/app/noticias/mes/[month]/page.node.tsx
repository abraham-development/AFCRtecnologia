import { NewsMonthRoute, newsMonthMetadata } from '@/lib/news/news-month-route';

/** Build Node (Hostinger): lee Supabase en cada visita, igual que la Home. */
export const dynamic = 'force-dynamic';

export const generateMetadata = newsMonthMetadata;
export default NewsMonthRoute;
