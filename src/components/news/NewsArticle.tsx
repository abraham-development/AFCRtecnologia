import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import CtaBand from '@/components/layout/CtaBand';
import { formatNewsDate, newsCopy, sortedNews } from '@/content/news';
import type { NewsPost } from '@/types';

/** Dos notas relacionadas: primero de la misma categoria, luego las mas recientes. */
function relatedTo(post: NewsPost): NewsPost[] {
  const others = sortedNews.filter((item) => item.slug !== post.slug);
  const sameCategory = others.filter((item) => item.category === post.category);
  const rest = others.filter((item) => item.category !== post.category);
  return [...sameCategory, ...rest].slice(0, 2);
}

export function NewsArticle({ post }: { post: NewsPost }) {
  const related = relatedTo(post);

  return (
    <>
      <article className="shell pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-3xl">
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

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-micro text-accent-cyan">{post.category.toUpperCase()}</span>
            <span className="text-data text-text-secondary">
              <time dateTime={post.date}>{formatNewsDate(post.date)}</time> · {post.readingTime}
            </span>
            {post.sample ? (
              <span className="text-micro border-border-editorial text-text-secondary border px-2 py-1">
                {newsCopy.sampleLabel}
              </span>
            ) : null}
          </div>

          <h1 className="mt-8 font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1.02] font-light tracking-[-0.035em] text-balance">
            {post.title}
          </h1>
          <p className="text-text-secondary border-border-editorial mt-8 border-b pb-10 text-lg leading-relaxed md:text-xl">
            {post.excerpt}
          </p>

          <div className="mt-10 max-w-[68ch] space-y-6 text-[1.0625rem] leading-[1.75]">
            {post.body.map((paragraph) =>
              paragraph.startsWith('## ') ? (
                <h2 key={paragraph} className="text-display-xs pt-6">
                  {paragraph.slice(3)}
                </h2>
              ) : (
                <p key={paragraph} className="text-text-primary/90">
                  {paragraph}
                </p>
              ),
            )}
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section aria-labelledby="relacionadas-title" className="hairline-t">
          <div className="shell py-16 md:py-20">
            <h2 id="relacionadas-title" className="text-display-xs">
              {newsCopy.relatedTitle}
            </h2>
            <ul className="border-border-editorial mt-8 border-t">
              {related.map((item) => (
                <li key={item.slug} className="border-border-editorial border-b">
                  <Link
                    href={`/noticias/${item.slug}`}
                    data-cursor="expand"
                    className="group grid gap-3 py-7 lg:grid-cols-12 lg:items-baseline lg:gap-8"
                  >
                    <span className="text-data text-text-secondary lg:col-span-2">{formatNewsDate(item.date)}</span>
                    <span className="font-serif text-2xl leading-tight font-light tracking-[-0.02em] text-balance transition-[color,translate] duration-300 group-hover:translate-x-2 group-hover:text-accent-cyan lg:col-span-8">
                      {item.title}
                    </span>
                    <span className="flex items-center gap-3 lg:col-span-2 lg:justify-end">
                      <span className="text-micro text-text-secondary">{item.category}</span>
                      <ArrowUpRight
                        size={16}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="text-text-secondary group-hover:text-accent-cyan transition-colors"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CtaBand title={newsCopy.ctaTitle} body={newsCopy.ctaBody} cta={newsCopy.ctaButton} />
    </>
  );
}

export default NewsArticle;
