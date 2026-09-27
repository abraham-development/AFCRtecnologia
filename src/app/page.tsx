import Hero from '@/components/home/Hero';
import NewsSection from '@/components/home/NewsSection';
import { getPublishedNews } from '@/lib/news/repository';

/** Ver NEWS_REVALIDATE_SECONDS: con varios procesos, publicar se ve en ≤ 60 s. */
export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPublishedNews();
  return (
    <>
      <Hero />
      <NewsSection posts={posts} />
    </>
  );
}
