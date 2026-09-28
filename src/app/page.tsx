import { Suspense } from 'react';

import Hero from '@/components/home/Hero';
import NewsSection from '@/components/home/NewsSection';
import { NEWS_HOME_LIMIT } from '@/content/news';
import { newsMonths } from '@/lib/news/archive';
import { getPublishedNews } from '@/lib/news/repository';

/** Lo unico que espera a Supabase: el hero no depende de las noticias. */
async function LatestNews() {
  const posts = await getPublishedNews();
  // Al cliente solo viajan las notas visibles; el resto queda en el archivo por mes.
  return <NewsSection posts={posts.slice(0, NEWS_HOME_LIMIT)} months={newsMonths(posts)} />;
}

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* El hero se envia y se pinta sin esperar la consulta de noticias. */}
      <Suspense fallback={<div aria-hidden="true" className="min-h-[60vh]" />}>
        <LatestNews />
      </Suspense>
    </>
  );
}
