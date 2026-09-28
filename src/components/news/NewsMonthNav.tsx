'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';

import { newsCopy } from '@/content/news';
import { monthHref, monthLabel } from '@/lib/news/archive';
import { cn } from '@/lib/utils';
import type { NewsMonth } from '@/types';

interface NewsMonthNavProps {
  months: NewsMonth[];
  /** Mes abierto (AAAA-MM) en `/noticias/mes/[month]`; en la Home no hay. */
  current?: string;
  className?: string;
}

/**
 * Archivo por mes. Desde `lg` es la columna derecha, siempre abierta. Por debajo
 * va antes de las notas como un boton desplegable (pedido del usuario: al final
 * de la lista nadie lo encontraba). No usa icono de hamburguesa para no
 * confundirse con el menu principal del header.
 */
export function NewsMonthNav({ months, current, className }: NewsMonthNavProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  if (months.length === 0) return null;

  return (
    <nav
      aria-labelledby="noticias-por-mes"
      className={cn('border-border-editorial border lg:border-0', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <h2 id="noticias-por-mes" className="lg:text-micro lg:text-text-secondary lg:border-border-editorial lg:border-b lg:pb-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-12 w-full items-center justify-between gap-4 px-4 text-left lg:hidden"
        >
          {current ? (
            <span className="font-serif text-xl font-light tracking-[-0.01em]">
              <span className="sr-only">{newsCopy.archiveTitle}: </span>
              {monthLabel(current)}
            </span>
          ) : (
            <span className="text-micro text-text-primary">{newsCopy.archiveTitle}</span>
          )}
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            className={cn('text-accent-cyan shrink-0 transition-transform duration-300', open && 'rotate-180')}
          />
        </button>
        <span className="hidden lg:inline">{newsCopy.archiveTitle}</span>
      </h2>

      <ul
        id={listId}
        className={cn('border-border-editorial border-t px-4 lg:block lg:border-t-0 lg:px-0', !open && 'hidden')}
      >
        {months.map((month) => {
          const active = month.key === current;
          return (
            <li key={month.key} className="border-border-editorial border-b last:border-b-0 lg:last:border-b">
              <Link
                href={monthHref(month.key)}
                aria-current={active ? 'page' : undefined}
                data-cursor="expand"
                onClick={() => setOpen(false)}
                className={cn(
                  'group flex min-h-11 items-baseline justify-between gap-4 py-3 transition-colors',
                  active ? 'text-accent-cyan' : 'text-text-primary hover:text-accent-cyan',
                )}
              >
                <span className="font-serif text-xl font-light tracking-[-0.01em]">{month.label}</span>
                <span className="text-data text-text-secondary group-hover:text-accent-cyan shrink-0 transition-colors">
                  {newsCopy.archiveCount(month.count)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default NewsMonthNav;
