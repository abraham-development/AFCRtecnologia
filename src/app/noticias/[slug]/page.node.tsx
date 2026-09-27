import { NewsRoute, newsRouteMetadata } from '@/lib/news/news-route';

/**
 * Build Node (Hostinger): la nota se lee de Supabase en cada visita, asi que
 * publicar, editar o retirar se ve en segundos en todos los procesos.
 */
export const dynamic = 'force-dynamic';

export const generateMetadata = newsRouteMetadata;
export default NewsRoute;
