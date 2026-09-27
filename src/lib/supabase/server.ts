import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con la clave secreta. Solo servidor: la clave nunca
 * lleva prefijo `NEXT_PUBLIC_` y `server-only` rompe el build si un componente
 * cliente llegara a importar este modulo.
 */

export const NEWS_COVERS_BUCKET = 'news-covers';

function readEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

/** `false` en el build estatico o en desarrollo sin claves: se usan las notas de respaldo. */
export function isSupabaseConfigured(): boolean {
  return readEnv() !== null;
}

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const env = readEnv();
  if (!env) throw new Error('Supabase no esta configurado (SUPABASE_URL / SUPABASE_SECRET_KEY).');
  client ??= createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

/** URL publica de una foto del bucket de portadas. */
export function coverPublicUrl(path: string): string {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, '') ?? '';
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${NEWS_COVERS_BUCKET}/${encoded}`;
}
