'use client';

import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import ResourceCover from '@/components/resources/ResourceCover';
import ScrambleText from '@/components/ui/ScrambleText';
import TiltCard from '@/components/ui/TiltCard';
import { resourceArticles, resourceHref, resourcesCopy } from '@/content/resources';
import { readingTimeFor } from '@/lib/reading-time';
import type { ResourceArticle } from '@/types';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Card de un articulo: portada a la izquierda y, al costado, autor, titulo y resumen. */
function ResourceCard({ article }: { article: ResourceArticle }) {
  return (
    <TiltCard
      max={3}
      innerClassName="border-border-editorial hover:border-accent-cyan/50 bg-bg-secondary border transition-colors duration-500"
    >
      <Link
        href={resourceHref(article.slug)}
        data-cursor="expand"
        className="group grid gap-[1.2rem] px-6 py-[1.2rem] sm:grid-cols-12 sm:gap-8 md:px-8 md:py-6"
      >
        <div className="relative sm:col-span-4">
          {/* Celular: portada entera en 16:9. Desde sm: alto de 240 px con recorte
              central (las portadas llevan el motivo en el cuadrado central). */}
          <ResourceCover
            article={article}
            decorative
            sizes="(min-width: 640px) 30vw, 100vw"
            className="aspect-video sm:aspect-auto sm:h-60"
          />
        </div>

        <div className="flex flex-col sm:col-span-8">
          <p className="text-data text-text-primary">
            <span className="sr-only">{resourcesCopy.authorLabel}: </span>
            {resourcesCopy.author}
          </p>

          <h3 className="mt-[0.8rem] font-serif text-2xl leading-[1.15] font-light tracking-[-0.02em] text-balance transition-colors duration-300 group-hover:text-accent-cyan md:text-[1.65rem]">
            {article.title}
          </h3>
          <p className="text-text-secondary mt-[0.6rem] max-w-[60ch] leading-[1.5]">{article.excerpt}</p>

          <span className="mt-auto flex flex-wrap items-center gap-3 pt-[1.15rem]">
            <ScrambleText text={article.topic.toUpperCase()} playOnView className="text-micro text-accent-cyan" />
            <span aria-hidden="true" className="text-text-secondary">
              ·
            </span>
            <span className="text-micro text-text-secondary">
              {readingTimeFor(article.body)} {resourcesCopy.readingLabel}
            </span>
            <span className="text-micro text-text-primary group-hover:text-accent-cyan ml-auto inline-flex items-center gap-2 transition-colors">
              {resourcesCopy.readMore}
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

/** Seccion de la Home bajo el titulo «Recursos» del pie del hero: un articulo por fila. */
export function ResourcesSection() {
  return (
    <section aria-labelledby="recursos-title" className="pb-chapter">
      <div className="shell mt-8 md:mt-10">
        <ul className="space-y-6 md:space-y-8">
          {resourceArticles.map((article, index) => (
            <motion.li
              key={article.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 3) * 0.06 }}
            >
              <ResourceCard article={article} />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default ResourcesSection;
