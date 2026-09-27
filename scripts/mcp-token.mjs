#!/usr/bin/env node
/**
 * Gestiona los tokens de los agentes que usan el MCP de noticias.
 *
 *   npm run mcp:token -- create --name "Claude Code"
 *   npm run mcp:token -- list
 *   npm run mcp:token -- revoke --name "Claude Code"
 *
 * Lee SUPABASE_URL y SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY) de
 * `.env.local` o del entorno; nunca imprime sus valores. En la base solo se
 * guarda el SHA-256 del token: el token en claro se muestra una unica vez.
 */
import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { createClient } from '@supabase/supabase-js';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local (o en el entorno).');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const {
  positionals: [command],
  values: { name },
} = parseArgs({ allowPositionals: true, options: { name: { type: 'string' } } });

function requireName() {
  const clean = name?.trim();
  if (!clean || clean.length > 60) {
    console.error('Indica --name "Nombre del agente" (máx. 60 caracteres).');
    process.exit(1);
  }
  return clean;
}

async function create() {
  const agentName = requireName();
  const token = `afcr_${randomBytes(32).toString('base64url')}`;
  const tokenHash = createHash('sha256').update(token, 'utf8').digest('hex');
  const { error } = await supabase.from('agent_tokens').insert({ name: agentName, token_hash: tokenHash });
  if (error) throw new Error(error.message);
  console.log(`\nToken creado para «${agentName}». Cópialo ahora: no se vuelve a mostrar.\n`);
  console.log(`  ${token}\n`);
  console.log('Guárdalo como variable de entorno AFCR_MCP_TOKEN en la máquina del agente (ver docs/mcp.md).');
}

async function list() {
  const { data, error } = await supabase
    .from('agent_tokens')
    .select('name, created_at, last_used_at, revoked_at')
    .order('created_at');
  if (error) throw new Error(error.message);
  if (!data.length) return console.log('No hay tokens.');
  console.table(
    data.map((row) => ({
      agente: row.name,
      creado: row.created_at?.slice(0, 16).replace('T', ' '),
      'último uso': row.last_used_at?.slice(0, 16).replace('T', ' ') ?? '—',
      estado: row.revoked_at ? 'revocado' : 'activo',
    })),
  );
}

async function revoke() {
  const agentName = requireName();
  const { data, error } = await supabase
    .from('agent_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('name', agentName)
    .is('revoked_at', null)
    .select('id');
  if (error) throw new Error(error.message);
  console.log(data.length ? `Revocados ${data.length} token(s) de «${agentName}».` : `«${agentName}» no tiene tokens activos.`);
}

const commands = { create, list, revoke };
if (!commands[command]) {
  console.error('Uso: npm run mcp:token -- <create|list|revoke> [--name "Agente"]');
  process.exit(1);
}
commands[command]().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
