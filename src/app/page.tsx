import Hero from '@/components/home/Hero';
import NewsSection from '@/components/home/NewsSection';
import { getPublishedNews } from '@/lib/news/repository';

export default async function HomePage() {
  const posts = await getPublishedNews();
  return (
    <>
      <Hero />
      <NewsSection posts={posts} />
    </>
  );
}
