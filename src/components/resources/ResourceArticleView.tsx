import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import CtaBand from '@/components/layout/CtaBand';
import ResourceCover from '@/components/resources/ResourceCover';
import { coverSources, resourceHref, resourcesCopy } from '@/content/resources';
import { readingTimeFor } from '@/lib/reading-time';
import type { ResourceArticle } from '@/types';

/** «**texto**» en negrita; el resto del texto queda tal cual. */
function inline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="text-text-primary font-medium">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

const cellsOf = (row: string) =>
  row
    .slice(1)
    .split('|')
    .map((cell) => cell.trim());

/**
 * Bloques del cuerpo (ver `ResourceArticle.body`): «## » y «### » son
 * subtitulos; las lineas seguidas con «- », «1. » o «| » forman una lista
 * con vinetas, una lista numerada o una tabla.
 */
function renderBody(paragraphs: string[]): ReactNode[] {
  const blocks: ReactNode[] = [];
  let group: { kind: 'ul' | 'ol' | 'table'; rows: string[] } | null = null;

  const flush = () => {
    if (!group) return;
    const key = `bloque-${blocks.length}`;
    if (group.kind === 'ul') {
      blocks.push(
        <ul key={key} className="border-border-editorial space-y-3 border-l pl-6">
          {group.rows.map((item) => (
            <li key={item} className="text-text-primary/90 relative">
              <span aria-hidden="true" className="bg-accent-cyan absolute top-[0.8em] -left-[1.6rem] h-px w-3" />
              {inline(item)}
            </li>
          ))}
        </ul>,
      );
    } else if (group.kind === 'ol') {
      blocks.push(
        <ol key={key} className="space-y-5">
          {group.rows.map((item, index) => (
            <li key={item} className="text-text-primary/90 grid grid-cols-[2.5rem_1fr] gap-x-3">
              <span aria-hidden="true" className="text-data text-accent-cyan pt-[0.3em]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{inline(item.replace(/^\d+\.\s+/, ''))}</span>
            </li>
          ))}
        </ol>,
      );
    } else {
      const [head = [], ...body] = group.rows.map(cellsOf);
      const last = head.length - 1;
      // En celular cada fila es un bloque (la columna clave quedaria fuera de la
      // pantalla); desde `sm`, tabla completa. La oculta sale del arbol accesible.
      blocks.push(
        <div key={`${key}-movil`} className="border-border-editorial divide-border-editorial divide-y border sm:hidden">
          {body.map((row) => (
            <dl key={row[0]} className="px-4 py-4">
              <dt className="text-text-primary font-medium">{row[0]}</dt>
              {row.slice(1).map((cell, index) => (
                <dd
                  key={index}
                  className={`mt-2 grid grid-cols-[minmax(0,9rem)_1fr] gap-3 text-[0.9375rem] leading-snug ${index + 1 === last ? 'text-accent-cyan' : 'text-text-secondary'}`}
                >
                  <span className="text-micro pt-[0.2em] opacity-80">{head[index + 1]}</span>
                  <span>{cell}</span>
                </dd>
              ))}
            </dl>
          ))}
        </div>,
      );
      blocks.push(
        <div
          key={key}
          role="region"
          aria-label={head[0]}
          tabIndex={0}
          className="border-border-editorial hidden overflow-x-auto border sm:block"
        >
          <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem] leading-snug">
            <thead>
              <tr className="border-border-editorial bg-bg-secondary border-b">
                {head.map((cell, index) => (
                  <th
                    key={cell}
                    scope="col"
                    className={`text-micro px-4 py-3 align-bottom font-normal ${index === last ? 'text-accent-cyan' : 'text-text-secondary'}`}
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row) => (
                <tr key={row[0]} className="border-border-editorial border-b last:border-b-0">
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th key={index} scope="row" className="text-text-primary px-4 py-3 align-top font-medium">
                        {cell}
                      </th>
                    ) : (
                      <td
                        key={index}
                        className={`px-4 py-3 align-top ${index === last ? 'text-accent-cyan bg-accent-cyan/5' : 'text-text-secondary'}`}
                      >
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    }
    group = null;
  };

  paragraphs.forEach((paragraph, index) => {
    const kind = paragraph.startsWith('- ')
      ? 'ul'
      : /^\d+\.\s/.test(paragraph)
        ? 'ol'
        : paragraph.startsWith('| ')
          ? 'table'
          : null;
    if (kind) {
      if (group?.kind !== kind) flush();
      group ??= { kind, rows: [] };
      group.rows.push(kind === 'ul' ? paragraph.slice(2) : paragraph);
      return;
    }
    flush();
    if (paragraph.startsWith('### ')) {
      blocks.push(
        <h3 key={index} className="pt-2 font-serif text-[1.375rem] leading-snug font-normal tracking-[-0.01em]">
          {paragraph.slice(4)}
        </h3>,
      );
    } else if (paragraph.startsWith('## ')) {
      blocks.push(
        <h2 key={index} className="text-display-xs pt-6">
          {paragraph.slice(3)}
        </h2>,
      );
    } else {
      blocks.push(
        <p key={index} className="text-text-primary/90">
          {inline(paragraph)}
        </p>,
      );
    }
  });
  flush();
  return blocks;
}

interface ResourceArticleViewProps {
  article: ResourceArticle;
  related: ResourceArticle[];
}

export function ResourceArticleView({ article, related }: ResourceArticleViewProps) {
  return (
    <>
      <article className="shell pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/#recursos"
            data-cursor="expand"
            className="text-micro text-text-secondary hover:text-accent-cyan group inline-flex min-h-11 items-center gap-2 transition-colors"
          >
            <ArrowLeft
              size={13}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            {resourcesCopy.back}
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-micro text-accent-cyan">{article.topic.toUpperCase()}</span>
            <span className="text-data text-text-secondary">
              {readingTimeFor(article.body)} {resourcesCopy.readingLabel}
            </span>
          </div>

          <h1 className="mt-6 font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1.02] font-light tracking-[-0.035em] text-balance">
            {article.title}
          </h1>
          <p className="text-data text-text-primary mt-6">
            <span className="sr-only">{resourcesCopy.authorLabel}: </span>
            {resourcesCopy.author}
          </p>
          <p className="text-text-secondary border-border-editorial mt-8 border-b pb-10 text-lg leading-relaxed md:text-xl">
            {article.excerpt}
          </p>

          <figure className="mt-10">
            <ResourceCover article={article} priority fit="full" sizes="(min-width: 820px) 768px, 100vw" />
            {article.cover ? (
              <figcaption className="mt-3 flex justify-end">
                <a
                  href={coverSources(article.cover).full}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="expand"
                  className="text-micro text-text-secondary hover:text-accent-cyan group inline-flex min-h-11 items-center gap-2 transition-colors"
                >
                  {resourcesCopy.coverFull}
                  <ArrowUpRight
                    size={13}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              </figcaption>
            ) : null}
          </figure>

          <div className="mt-12 max-w-[68ch] space-y-6 text-[1.0625rem] leading-[1.75]">{renderBody(article.body)}</div>
        </div>
      </article>

      {related.length > 0 ? (
        <section aria-labelledby="relacionados-title" className="hairline-t">
          <div className="shell py-16 md:py-20">
            <h2 id="relacionados-title" className="text-display-xs">
              {resourcesCopy.relatedTitle}
            </h2>
            <ul className="border-border-editorial mt-8 border-t">
              {related.map((item) => (
                <li key={item.slug} className="border-border-editorial border-b">
                  <Link
                    href={resourceHref(item.slug)}
                    data-cursor="expand"
                    className="group grid gap-3 py-7 lg:grid-cols-12 lg:items-baseline lg:gap-8"
                  >
                    <span className="text-micro text-accent-cyan lg:col-span-2">{item.topic.toUpperCase()}</span>
                    <span className="font-serif text-2xl leading-tight font-light tracking-[-0.02em] text-balance transition-[color,translate] duration-300 group-hover:translate-x-2 group-hover:text-accent-cyan lg:col-span-9">
                      {item.title}
                    </span>
                    <span className="flex lg:col-span-1 lg:justify-end">
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

      <CtaBand title={resourcesCopy.ctaTitle} body={resourcesCopy.ctaBody} cta={resourcesCopy.ctaButton} />
    </>
  );
}

export default ResourceArticleView;
