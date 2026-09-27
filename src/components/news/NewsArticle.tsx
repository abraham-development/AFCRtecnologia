import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import CtaBand from '@/components/layout/CtaBand';
import { formatNewsDate, newsCopy } from '@/content/news';
import type { NewsPost } from '@/types';

interface NewsArticleProps {
  post: NewsPost;
  related: NewsPost[];
  /** Vista previa privada de un borrador: franja de aviso y sin CTA final. */
  preview?: boolean;
}

export function NewsArticle({ post, related, preview = false }: NewsArticleProps) {

  return (
    <>
      <article className="shell pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-3xl">
          {preview ? (
            <p role="status" className="text-micro border-accent-cyan/50 text-accent-cyan mb-8 border px-4 py-3">
              {newsCopy.previewNotice}
            </p>
          ) : null}
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

          {post.cover ? (
            <figure className="border-border-editorial bg-bg-darkest mt-10 aspect-[16/9] overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage; sin optimizador en Hostinger */}
              <img
                src={post.cover.src}
                alt={post.cover.alt}
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </figure>
          ) : null}

          <div className="mt-10 max-w-[68ch] space-y-6 text-[1.0625rem] leading-[1.75]">
            {post.body.map((paragraph, index) =>
              paragraph.startsWith('## ') ? (
                <h2 key={index} className="text-display-xs pt-6">
                  {paragraph.slice(3)}
                </h2>
              ) : (
                <p key={index} className="text-text-primary/90">
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

      {preview ? null : <CtaBand title={newsCopy.ctaTitle} body={newsCopy.ctaBody} cta={newsCopy.ctaButton} />}
    </>
  );
}

export default NewsArticle;
