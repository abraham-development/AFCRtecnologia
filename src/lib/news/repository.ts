import 'server-only';

import { connection } from 'next/server';

import { getNewsPost, sortedNews } from '@/content/news';
import { bodyToParagraphs, readingTimeFor } from '@/lib/news/format';
import { coverPublicUrl, getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import type { NewsCategory, NewsPost } from '@/types';

/**
 * Lectura de noticias para el sitio.
 *
 * Fuente: Supabase (`news_posts`), que el MCP de `/api/mcp` escribe.
 *
 * Trampa verificada en produccion (Hostinger): el sitio corre en varios
 * procesos Node y el entorno no completa el trabajo que Next deja en segundo
 * plano, asi que ni `revalidateTag` (solo invalida un proceso) ni la
 * revalidacion ISR por tiempo (stale-while-revalidate) llegaban a refrescar
 * la Home: seguia mostrando notas ya borradas. Por eso con Supabase las rutas
 * de noticias son dinamicas (`connection()`) y cada proceso guarda la lista
 * solo NEWS_MEMO_MS en memoria: un cambio se ve en todo el sitio en ≤ 10 s.
 *
 * Sin claves de Supabase (build estatico o desarrollo) se usan las notas de
 * ejemplo de `src/content/news.ts` y las rutas siguen siendo estaticas.
 */

/** Memoria por proceso de la lista publicada: absorbe rafagas de trafico. */
export const NEWS_MEMO_MS = 10_000;

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

let memo: { at: number; posts: NewsPost[] } | null = null;

/** El MCP la llama tras cada escritura: el proceso que la atendio se pone al dia al instante. */
export function invalidateNewsMemo(): void {
  memo = null;
}

async function fetchPublished(): Promise<NewsPost[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('news_posts')
    .select(PUBLIC_COLUMNS)
    .eq('status', 'published')
    .order('published_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(`news_posts: ${error.message}`);
  return (data as NewsRow[]).map(rowToPost);
}

/**
 * Notas publicadas, de la mas reciente a la mas antigua.
 *
 * Un fallo de Supabase se propaga a proposito: la pagina muestra el error en
 * vez de una seccion de noticias vacia que pareceria correcta.
 */
export async function getPublishedNews(): Promise<NewsPost[]> {
  if (!isSupabaseConfigured()) return sortedNews;
  // Marca la ruta como dinamica: nunca se sirve una copia prerenderizada.
  await connection();
  if (memo && Date.now() - memo.at < NEWS_MEMO_MS) return memo.posts;
  const posts = await fetchPublished();
  memo = { at: Date.now(), posts };
  return posts;
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
