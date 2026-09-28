import { Suspense } from 'react';

import Hero from '@/components/home/Hero';
import NewsSection from '@/components/home/NewsSection';
import { getPublishedNews } from '@/lib/news/repository';

/** Lo unico que espera a Supabase: el hero no depende de las noticias. */
async function LatestNews() {
  const posts = await getPublishedNews();
  return <NewsSection posts={posts} />;
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
