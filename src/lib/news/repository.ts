import 'server-only';

import { unstable_cache } from 'next/cache';

import { getNewsPost, sortedNews } from '@/content/news';
import { bodyToParagraphs, readingTimeFor } from '@/lib/news/format';
import { coverPublicUrl, getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import type { NewsCategory, NewsPost } from '@/types';

/**
 * Lectura de noticias para el sitio.
 *
 * Fuente: Supabase (`news_posts`), que el MCP de `/api/mcp` escribe. Las
 * lecturas publicas van en cache con el tag `news`; el MCP lo invalida al
 * publicar o editar, y el resto de procesos se refresca cada 60 s: los cambios
 * salen sin recompilar.
 *
 * Sin claves de Supabase (build estatico o desarrollo) se usan las notas de
 * ejemplo de `src/content/news.ts`.
 */

export const NEWS_CACHE_TAG = 'news';
/** Debe coincidir con `export const revalidate = 60` de Home, notas y sitemap. */
export const NEWS_REVALIDATE_SECONDS = 60;

/** Fila de `news_posts` (ver supabase/migrations/0001_news.sql). */
export interface NewsRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  body: string;
  status: 'draft' | 'published';
  published_on: string | null;
  cover_path: string | null;
  cover_alt: string | null;
  preview_token: string;
  sample: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToPost(row: NewsRow): NewsPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    // Un borrador aun no tiene fecha: se muestra la de su ultima edicion.
    date: row.published_on ?? row.updated_at.slice(0, 10),
    readingTime: readingTimeFor(row.body),
    body: bodyToParagraphs(row.body),
    sample: row.sample,
    cover: row.cover_path ? { src: coverPublicUrl(row.cover_path), alt: row.cover_alt ?? '' } : undefined,
  };
}

const PUBLIC_COLUMNS =
  'id, slug, title, excerpt, category, body, status, published_on, cover_path, cover_alt, sample, updated_at';

const fetchPublished = unstable_cache(
  async (): Promise<NewsPost[]> => {
    const { data, error } = await getSupabaseAdmin()
      .from('news_posts')
      .select(PUBLIC_COLUMNS)
      .eq('status', 'published')
      .order('published_on', { ascending: false })
      .order('created_at', { ascending: false });
    // Lanzar (y no devolver []) evita que un fallo quede guardado en la cache.
    if (error) throw new Error(`news_posts: ${error.message}`);
    return (data as NewsRow[]).map(rowToPost);
  },
  ['news-published'],
  // Hostinger corre varios procesos Node y `revalidateTag` solo invalida el
  // proceso que atendio al MCP (Next no coordina tags entre instancias). Los
  // demas se ponen al dia por tiempo: como maximo NEWS_REVALIDATE_SECONDS.
  { tags: [NEWS_CACHE_TAG], revalidate: NEWS_REVALIDATE_SECONDS },
);

/**
 * Notas publicadas, de la mas reciente a la mas antigua.
 *
 * Un fallo de Supabase se propaga a proposito: si devolvieramos [], la pagina
 * vacia quedaria en cache. Al lanzar, Next conserva la ultima version buena de
 * la pagina y un build sin conexion falla de forma visible.
 */
export async function getPublishedNews(): Promise<NewsPost[]> {
  if (!isSupabaseConfigured()) return sortedNews;
  return fetchPublished();
}

export async function getPublishedNewsBySlug(slug: string): Promise<NewsPost | undefined> {
  if (!isSupabaseConfigured()) return getNewsPost(slug);
  const posts = await getPublishedNews();
  return posts.find((post) => post.slug === slug);
}

/** Borrador para la vista previa privada. Sin cache: siempre la version actual. */
export async function getPostByPreviewToken(
  token: string,
): Promise<{ post: NewsPost; status: NewsRow['status'] } | undefined> {
  if (!isSupabaseConfigured() || !/^[A-Za-z0-9_-]{20,}$/.test(token)) return undefined;
  const { data, error } = await getSupabaseAdmin()
    .from('news_posts')
    .select('*')
    .eq('preview_token', token)
    .maybeSingle();
  if (error || !data) return undefined;
  const row = data as NewsRow;
  return { post: rowToPost(row), status: row.status };
}

/** Dos notas relacionadas: primero de la misma categoria, luego las mas recientes. */
export function relatedPosts(post: NewsPost, all: NewsPost[]): NewsPost[] {
  const others = all.filter((item) => item.slug !== post.slug);
  const sameCategory = others.filter((item) => item.category === post.category);
  const rest = others.filter((item) => item.category !== post.category);
  return [...sameCategory, ...rest].slice(0, 2);
}
