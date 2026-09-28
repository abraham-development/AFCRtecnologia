import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { NewsList } from '@/components/home/NewsSection';
import NewsMonthNav from '@/components/news/NewsMonthNav';
import { newsCopy } from '@/content/news';
import type { NewsMonth, NewsPost } from '@/types';

interface NewsMonthPageProps {
  title: string;
  month: string;
  posts: NewsPost[];
  months: NewsMonth[];
  latestSlug?: string;
}

/** Todas las notas de un mes, con el mismo archivo por mes a la derecha que la Home. */
export function NewsMonthPage({ title, month, posts, months, latestSlug }: NewsMonthPageProps) {
  return (
    <section aria-labelledby="noticias-mes-title" className="shell pt-40 pb-chapter md:pt-48">
      <Link
        href="/#noticias"
        data-cursor="expand"
        className="text-micro text-text-secondary hover:text-accent-cyan group inline-flex min-h-11 items-center gap-2 transition-colors"
      >
        <ArrowLeft
          size={13}
          strokeWidth={1.5}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:-translate-x-0.5"
        />
        {newsCopy.back}
      </Link>

      <h1
        id="noticias-mes-title"
        className="border-border-editorial mt-8 border-b pb-10 font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1.02] font-light tracking-[-0.035em] text-balance"
      >
        {title}
      </h1>

      <div className="mt-10 grid gap-6 md:mt-12 lg:grid-cols-12 lg:gap-10">
        <NewsMonthNav
          months={months}
          current={month}
          className="lg:sticky lg:top-44 lg:order-2 lg:col-span-3 lg:self-start"
        />
        <div className="lg:order-1 lg:col-span-9">
          <NewsList posts={posts} latestSlug={latestSlug} />
        </div>
      </div>
    </section>
  );
}

export default NewsMonthPage;
