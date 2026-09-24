'use client';

import { ArrowUpRight } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';

import CursorPreview from '@/components/ui/CursorPreview';
import ScrambleText from '@/components/ui/ScrambleText';
import TiltCard from '@/components/ui/TiltCard';
import { formatNewsDate, newsCategories, newsCopy, sortedNews } from '@/content/news';
import type { NewsCategory, NewsPost } from '@/types';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

function SampleTag({ post }: { post: NewsPost }) {
  if (!post.sample) return null;
  return (
    <span className="text-micro border-border-editorial text-text-secondary border px-2 py-1">
      {newsCopy.sampleLabel}
    </span>
  );
}

/** Nota mas reciente del filtro activo, en gran formato. */
function FeaturedPost({ post }: { post: NewsPost }) {
  const [hovered, setHovered] = useState(false);

  return (
    <TiltCard
      max={4}
      className="h-full"
      innerClassName="border-border-editorial hover:border-accent-cyan/50 bg-bg-secondary border transition-colors duration-500"
    >
      <Link
        href={`/noticias/${post.slug}`}
        data-cursor="expand"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="group grid h-full gap-10 p-7 md:p-10 lg:grid-cols-12 lg:gap-12"
      >
        <div className="flex flex-col lg:col-span-8">
          <h3 className="font-serif text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.04] font-light tracking-[-0.03em] text-balance transition-colors duration-300 group-hover:text-accent-cyan">
            {post.title}
          </h3>
          <p className="text-text-secondary mt-6 max-w-[60ch] leading-relaxed">{post.excerpt}</p>

          <span className="text-micro text-text-primary group-hover:text-accent-cyan mt-auto inline-flex items-center gap-2 pt-10 transition-colors">
            {newsCopy.readMore}
            <ArrowUpRight
              size={14}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>

        <dl className="border-border-editorial grid grid-cols-2 content-start gap-6 border-t pt-6 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1">
            <dt className="sr-only">{newsCopy.categoryLabel}</dt>
            <dd>
              <ScrambleText
                text={post.category.toUpperCase()}
                active={hovered}
                playOnView
                className="text-micro text-accent-cyan"
              />
            </dd>
            <dd>
              <SampleTag post={post} />
            </dd>
          </div>
          <div>
            <dt className="text-micro text-text-secondary">{newsCopy.dateLabel}</dt>
            <dd className="text-data text-text-primary mt-2">{formatNewsDate(post.date)}</dd>
          </div>
          <div>
            <dt className="text-micro text-text-secondary">{newsCopy.readingLabel}</dt>
            <dd className="text-data text-text-primary mt-2">{post.readingTime}</dd>
          </div>
        </dl>
      </Link>
    </TiltCard>
  );
}

export function NewsSection() {
  const [category, setCategory] = useState<NewsCategory | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const filtered = category ? sortedNews.filter((post) => post.category === category) : sortedNews;
  const [featured, ...rest] = filtered;
  const hoveredPost = rest.find((post) => post.slug === hoveredSlug);

  /* Solo se muestran las categorias que tienen notas */
  const usedCategories = newsCategories.filter((name) => sortedNews.some((post) => post.category === name));
  const filters: { key: string; label: string; value: NewsCategory | null }[] = [
    { key: 'all', label: newsCopy.filterAll, value: null },
    ...usedCategories.map((name) => ({ key: name, label: name, value: name })),
  ];

  return (
    <section id="noticias" aria-labelledby="noticias-title" className="hairline-t py-chapter scroll-mt-28">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
          <h2 id="noticias-title" className="text-display-sm max-w-[16ch] lg:col-span-7">
            {newsCopy.sectionTitle}
          </h2>
          <p className="text-text-secondary max-w-md leading-relaxed lg:col-span-5 lg:justify-self-end">
            {newsCopy.sectionLede}
          </p>
        </div>

        {/* Filtros: el subrayado cian se desliza entre categorias */}
        <LayoutGroup>
          <div
            role="group"
            aria-label={newsCopy.filterLabel}
            className="border-border-editorial mt-12 flex flex-wrap gap-x-7 gap-y-2 border-b md:mt-16"
          >
            {filters.map((filter) => {
              const active = category === filter.value;
              return (
                <button
                  key={filter.key}
                  type="button"
                  data-cursor="expand"
                  aria-pressed={active}
                  onClick={() => setCategory(filter.value)}
                  className={cn(
                    'relative min-h-11 py-3 text-sm transition-colors',
                    active ? 'text-accent-cyan' : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {filter.label}
                  {active ? (
                    <motion.span
                      layoutId="news-filter"
                      aria-hidden="true"
                      transition={{ duration: 0.45, ease: EASE }}
                      className="bg-accent-cyan absolute right-0 -bottom-px left-0 h-px"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {featured ? (
          <div className="mt-10 md:mt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={featured.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <FeaturedPost post={featured} />
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-text-secondary mt-12">{newsCopy.empty}</p>
        )}

        {rest.length > 0 ? (
          <CursorPreview
            activeKey={hoveredPost ? hoveredPost.slug : null}
            className="mt-6"
            preview={
              hoveredPost ? (
                <>
                  <p className="text-micro text-accent-cyan">{hoveredPost.category.toUpperCase()}</p>
                  <p className="text-text-secondary mt-3 text-sm leading-relaxed">{hoveredPost.excerpt}</p>
                </>
              ) : null
            }
          >
            <ul onPointerLeave={() => setHoveredSlug(null)}>
              <AnimatePresence initial={false}>
                {rest.map((post) => (
                  <motion.li
                    key={post.slug}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="border-border-editorial border-b"
                  >
                    <Link
                      href={`/noticias/${post.slug}`}
                      data-cursor="expand"
                      onPointerEnter={() => setHoveredSlug(post.slug)}
                      className="group grid gap-3 py-7 lg:grid-cols-12 lg:items-baseline lg:gap-8"
                    >
                      <span className="text-data text-text-secondary lg:col-span-2">
                        {formatNewsDate(post.date)}
                      </span>
                      <span className="font-serif text-2xl leading-tight font-light tracking-[-0.02em] text-balance transition-[color,translate] duration-300 group-hover:translate-x-2 group-hover:text-accent-cyan md:text-[1.75rem] lg:col-span-7">
                        {post.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-3 lg:col-span-3 lg:justify-end">
                        <span className="text-micro text-text-secondary">
                          {post.category} · {post.readingTime}
                        </span>
                        <SampleTag post={post} />
                        <ArrowUpRight
                          size={16}
                          strokeWidth={1.5}
                          aria-hidden="true"
                          className="text-text-secondary group-hover:text-accent-cyan transition-[color,translate] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </CursorPreview>
        ) : null}
      </div>
    </section>
  );
}

export default NewsSection;
