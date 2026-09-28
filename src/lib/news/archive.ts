import { newsMonthNames } from '@/content/news';
import type { NewsMonth, NewsPost } from '@/types';

/**
 * Archivo de noticias por mes. Utilidades puras: las usan la Home, las paginas
 * `/noticias/mes/[month]` y el sitemap. Se parte de la fecha ISO como texto
 * (AAAA-MM-DD), asi que la zona horaria del servidor no puede mover una nota
 * de mes.
 */

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: string): boolean {
  return MONTH_KEY.test(value);
}

export function monthKeyOf(post: NewsPost): string {
  return post.date.slice(0, 7);
}

/** «2026-09» → «Septiembre 2026». */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return `${newsMonthNames[(month ?? 1) - 1]} ${year}`;
}

/** Meses con notas, del mas reciente al mas antiguo. `posts` ya viene ordenado. */
export function newsMonths(posts: NewsPost[]): NewsMonth[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const key = monthKeyOf(post);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, count]) => ({ key, label: monthLabel(key), count }));
}

export function postsInMonth(posts: NewsPost[], key: string): NewsPost[] {
  return posts.filter((post) => monthKeyOf(post) === key);
}

export function monthHref(key: string): string {
  return `/noticias/mes/${key}`;
}
