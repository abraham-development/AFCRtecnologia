'use client';

import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import ScrambleText from '@/components/ui/ScrambleText';
import TiltCard from '@/components/ui/TiltCard';
import { formatNewsDate, newsCopy } from '@/content/news';
import type { NewsPost } from '@/types';
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

/**
 * Portada de la card. Con foto (subida por el MCP) se muestra la foto; sin ella,
 * la portada generada: una marca tipografica propia del sitio -la categoria, en
 * Fraunces, a gran escala y recortada- en vez de una foto de stock generica.
 * `noise` exige que el consumidor ya este posicionado (ver AGENTS.md, trampas
 * de Tailwind v4).
 */
function NewsCover({ post, className }: { post: NewsPost; className?: string }) {
  // En móvil la portada conserva su proporción. Desde sm el cuadro se estira
  // a la altura de la nota: si no, el texto deja un vacío debajo de la imagen.
  const frame = 'border-border-editorial bg-bg-darkest relative aspect-[4/3] overflow-hidden border sm:absolute sm:inset-0 sm:aspect-auto';

  if (post.cover) {
    return (
      <div className={cn(frame, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage; sin optimizador en Hostinger */}
        <img
          src={post.cover.src}
          alt={post.cover.alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-[scale] duration-700 ease-(--ease-editorial) group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn('noise', frame, className)}
    >
      <span className="text-accent-cyan/25 absolute top-3 left-4 font-serif text-[3.75rem] leading-[0.9] font-light tracking-tighter whitespace-nowrap sm:text-[3rem] lg:text-[4.5rem]">
        {post.category}
      </span>
      <span aria-hidden="true" className="border-accent-cyan/40 absolute right-3 bottom-3 h-3 w-3 border-r border-b" />
    </div>
  );
}

/** Card uniforme: la portada sola; fecha y autor en la metadata de la nota. */
function NewsCard({ post, isLatest }: { post: NewsPost; isLatest: boolean }) {
  return (
    <TiltCard
      max={3}
      innerClassName="border-border-editorial hover:border-accent-cyan/50 bg-bg-secondary border transition-colors duration-500"
    >
      <Link
        href={`/noticias/${post.slug}`}
        data-cursor="expand"
        className="group grid gap-[1.2rem] px-6 py-[1.2rem] sm:grid-cols-12 sm:gap-8 md:px-8 md:py-6"
      >
        <div className="relative sm:col-span-4">
          <NewsCover post={post} />
        </div>

        <div className="flex flex-col sm:col-span-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <time dateTime={post.date} className="text-data text-text-primary">
                {formatNewsDate(post.date)}
              </time>
              {isLatest ? (
                <span className="text-micro border-accent-cyan/50 text-accent-cyan border px-2 py-1">
                  {newsCopy.latestLabel}
                </span>
              ) : null}
              <SampleTag post={post} />
            </div>
            <p className="text-data text-text-secondary mt-1">
              <span className="sr-only">Autor: </span>
              {newsCopy.author}
            </p>
          </div>

          <h3 className="mt-[0.8rem] font-serif text-2xl leading-[1.15] font-light tracking-[-0.02em] text-balance transition-colors duration-300 group-hover:text-accent-cyan md:text-[1.65rem]">
            {post.title}
          </h3>
          <p className="text-text-secondary mt-[0.6rem] max-w-[60ch] leading-[1.5]">{post.excerpt}</p>

          <span className="mt-auto flex flex-wrap items-center gap-3 pt-[1.15rem]">
            <ScrambleText text={post.category.toUpperCase()} playOnView className="text-micro text-accent-cyan" />
            <span aria-hidden="true" className="text-text-secondary">
              ·
            </span>
            <span className="text-micro text-text-secondary">{post.readingTime}</span>
            <span className="text-micro text-text-primary group-hover:text-accent-cyan ml-auto inline-flex items-center gap-2 transition-colors">
              {newsCopy.readMore}
              <ArrowUpRight
                size={14}
                strokeWidth={1.5}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </span>
        </div>
      </Link>
    </TiltCard>
  );
}

export function NewsSection({ posts }: { posts: NewsPost[] }) {
  return (
    <section aria-labelledby="noticias-title" className="pb-chapter">
      <div className="shell">
        {posts.length > 0 ? (
          <ul className="mt-8 space-y-6 md:mt-10 md:space-y-8">
            {posts.map((post, index) => (
              <motion.li
                key={post.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 3) * 0.06 }}
              >
                <NewsCard post={post} isLatest={index === 0} />
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary mt-10">{newsCopy.empty}</p>
        )}
      </div>
    </section>
  );
}

export default NewsSection;
