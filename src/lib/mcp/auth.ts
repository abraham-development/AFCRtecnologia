import 'server-only';

import { createHash } from 'node:crypto';

import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * Tokens de agente: `afcr_` + 43 caracteres base64url (32 bytes aleatorios).
 * En `agent_tokens` solo se guarda su SHA-256; el token en claro se muestra una
 * sola vez al crearlo con `npm run mcp:token -- create --name "..."`.
 */

export const TOKEN_PATTERN = /^afcr_[A-Za-z0-9_-]{43}$/;

export interface AgentIdentity {
  tokenId: string;
  /** Nombre legible del agente, p. ej. «Claude Code». Queda en `updated_by`. */
  name: string;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function bearerFrom(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, value] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === 'bearer' && value ? value.trim() : null;
}

/** Devuelve el agente si el token existe y no esta revocado; si no, `null`. */
export async function authenticateAgent(request: Request): Promise<AgentIdentity | null> {
  const token = bearerFrom(request);
  // Se descarta sin consultar la base si el formato no es el de un token nuestro.
  if (!token || !TOKEN_PATTERN.test(token) || !isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('agent_tokens')
    .select('id, name')
    .eq('token_hash', hashToken(token))
    .is('revoked_at', null)
    .maybeSingle();
  if (error || !data) return null;

  // Registro de uso: no bloquea la respuesta y un fallo aqui no niega el acceso.
  void supabase
    .from('agent_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(({ error: updateError }) => {
      if (updateError) console.error('[mcp] last_used_at:', updateError.message);
    });

  return { tokenId: data.id as string, name: data.name as string };
}
