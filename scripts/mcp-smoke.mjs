#!/usr/bin/env node
/**
 * Prueba de punta a punta del MCP de noticias contra un servidor en marcha.
 *
 *   AFCR_MCP_TOKEN=afcr_… node scripts/mcp-smoke.mjs --url http://localhost:3000
 *
 * Crea una nota de prueba, verifica vista previa, portada, publicacion,
 * despublicacion y borrado, y la elimina al final aunque algo falle.
 */
import { parseArgs } from 'node:util';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const { values } = parseArgs({ options: { url: { type: 'string', default: 'http://localhost:3000' } } });
const base = values.url.replace(/\/+$/, '');
const token = process.env.AFCR_MCP_TOKEN;
if (!token) {
  console.error('Define AFCR_MCP_TOKEN con un token creado por npm run mcp:token.');
  process.exit(1);
}

let failures = 0;
function check(label, condition, detail = '') {
  console.log(`${condition ? '✓' : '✗'} ${label}${condition || !detail ? '' : ` — ${detail}`}`);
  if (!condition) failures += 1;
}

/** Las URLs que devuelve el MCP usan NEXT_PUBLIC_SITE_URL; se prueban contra `base`. */
const local = (url) => `${base}${new URL(url).pathname}`;
const html = async (url) => {
  const response = await fetch(local(url), { cache: 'no-store' });
  return { status: response.status, text: await response.text() };
};

/**
 * Con varios procesos Node (Hostinger) cada uno guarda la lista 10 s en
 * memoria (NEWS_MEMO_MS). Reintenta hasta 90 s antes de fallar.
 */
async function eventually(predicate, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await predicate()) return true;
    if (Date.now() > deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

// 1. Sin token o con uno falso → 401
for (const [label, auth] of [['sin token', null], ['token falso', `Bearer afcr_${'x'.repeat(43)}`]]) {
  const response = await fetch(`${base}/api/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(auth ? { Authorization: auth } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  check(`401 ${label}`, response.status === 401, `status ${response.status}`);
}

// 2. Cliente MCP real
const client = new Client({ name: 'afcr-smoke', version: '1.0.0' });
await client.connect(
  new StreamableHTTPClientTransport(new URL(`${base}/api/mcp`), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  }),
);
const call = async (name, args = {}) => {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text ?? '';
  if (result.isError) throw new Error(`${name}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const { tools } = await client.listTools();
check('herramientas listadas', tools.length >= 11, tools.map((tool) => tool.name).join(', '));
check('guía editorial', (await call('get_editorial_guide')).includes('No inventes métricas'));

const title = `Prueba del MCP ${Date.now()}`;
let slug;
try {
  const draft = await call('create_draft', {
    title,
    excerpt: 'Nota de prueba automática del MCP de noticias; se elimina al terminar la verificación.',
    category: 'Software',
    body: `Primer párrafo de prueba con suficiente texto para cumplir el mínimo de longitud del cuerpo de la nota.\n\n## Subtítulo de prueba\n\n${'Texto de relleno para la prueba. '.repeat(8)}`,
  });
  slug = draft.slug;
  check('borrador creado', draft.status === 'draft' && Boolean(draft.previewUrl));

  const preview = await html(draft.previewUrl);
  check('vista previa 200', preview.status === 200, `status ${preview.status}`);
  check('vista previa noindex', /<meta name="robots" content="noindex/.test(preview.text));
  check('borrador fuera de la Home', !(await html(`${base}/`)).text.includes(title));
  check('borrador sin URL pública', (await html(`${base}/noticias/${slug}`)).status === 404);

  // PNG valido de 1×1 px
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const covered = await call('attach_cover', { slug, alt: 'Imagen de prueba', imageBase64: png });
  check('portada asignada', covered.hasCover === true);

  const published = await call('publish_news', { slug });
  check('publicada', published.status === 'published' && Boolean(published.publishedOn));
  check('aparece en la Home', await eventually(async () => (await html(`${base}/`)).text.includes(title)));
  check('URL pública 200', await eventually(async () => (await html(`${base}/noticias/${slug}`)).status === 200));
  check('en el sitemap', await eventually(async () => (await html(`${base}/sitemap.xml`)).text.includes(`/noticias/${slug}`)));

  await call('unpublish_news', { slug });
  check('despublicada: fuera de la Home', await eventually(async () => !(await html(`${base}/`)).text.includes(title)));
  check('despublicada: URL 404', await eventually(async () => (await html(`${base}/noticias/${slug}`)).status === 404));
} finally {
  if (slug) {
    await call('delete_news', { slug, confirm: true });
    const listed = await call('list_news', { status: 'all' });
    check('eliminada', !listed.some((post) => post.slug === slug));
  }
  await client.close();
}

console.log(failures ? `\n${failures} verificación(es) fallaron.` : '\nTodo en orden.');
process.exit(failures ? 1 : 0);
