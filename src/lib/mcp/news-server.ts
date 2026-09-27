import 'server-only';

import { randomBytes } from 'node:crypto';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { editorialGuide, NEWS_LIMITS } from '@/content/news-editorial';
import type { AgentIdentity } from '@/lib/mcp/auth';
import { readingTimeFor, slugify, todayInLima } from '@/lib/news/format';
import { invalidateNewsMemo, type NewsRow } from '@/lib/news/repository';
import { coverPublicUrl, getSupabaseAdmin, NEWS_COVERS_BUCKET } from '@/lib/supabase/server';
import { NEWS_CATEGORIES } from '@/types';

/**
 * Servidor MCP de noticias. Se crea uno por request (modo sin estado) con la
 * identidad del agente ya autenticada en `src/app/api/mcp/route.node.ts`.
 *
 * Las rutas de noticias leen Supabase en cada visita (ver repository.ts), asi
 * que Home, notas y sitemap muestran el cambio en ≤ 10 s, sin recompilar.
 */

const COVER_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;
type CoverType = keyof typeof COVER_TYPES;

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_COVER_BYTES = 2 * 1024 * 1024;

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido: minúsculas, dígitos y guiones.')
  .max(80);
const titleSchema = z.string().trim().min(NEWS_LIMITS.title.min).max(NEWS_LIMITS.title.max);
const excerptSchema = z.string().trim().min(NEWS_LIMITS.excerpt.min).max(NEWS_LIMITS.excerpt.max);
const bodySchema = z.string().trim().min(NEWS_LIMITS.body.min).max(NEWS_LIMITS.body.max);
const categorySchema = z.enum(NEWS_CATEGORIES);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha AAAA-MM-DD.');
const altSchema = z.string().trim().min(NEWS_LIMITS.coverAlt.min).max(NEWS_LIMITS.coverAlt.max);
const coverTypeSchema = z.enum(Object.keys(COVER_TYPES) as [CoverType, ...CoverType[]]);

/* -------------------------------------------------------------------------- */
/*  Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

class ToolError extends Error {}

function ok(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string): CallToolResult {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

/** Envuelve cada herramienta: los `ToolError` llegan al agente; el resto se registra. */
function run<A>(handler: (args: A) => Promise<CallToolResult>) {
  return async (args: A): Promise<CallToolResult> => {
    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      console.error('[mcp] Error interno:', error);
      return fail('Error interno del servidor. Inténtalo de nuevo o revisa los logs del sitio.');
    }
  };
}

/** Este proceso se pone al dia al instante; los demas, en ≤ NEWS_MEMO_MS. */
function invalidateNews() {
  invalidateNewsMemo();
}

function newPreviewToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Cabecera binaria real del archivo: no se confia en la extension ni en el tipo declarado. */
function sniffImageType(bytes: Uint8Array): CoverType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  return riff === 'RIFF' && webp === 'WEBP' ? 'image/webp' : null;
}

export function createNewsMcpServer(agent: AgentIdentity, siteUrl: string): McpServer {
  const supabase = getSupabaseAdmin();
  const server = new McpServer(
    { name: 'afcrtecnologia-noticias', version: '1.0.0' },
    {
      instructions:
        'Publica y gestiona las noticias del sitio afcrtecnologia.com. Antes de redactar, llama a ' +
        'get_editorial_guide y síguela. Crea siempre un borrador (create_draft), comparte la URL de ' +
        'vista previa y publica (publish_news) solo cuando la persona responsable lo pida explícitamente.',
    },
  );

  const publicUrl = (slug: string) => `${siteUrl}/noticias/${slug}`;
  const previewUrl = (token: string) => `${siteUrl}/noticias/vista-previa/${token}`;

  async function findBySlug(slug: string): Promise<NewsRow> {
    const { data, error } = await supabase.from('news_posts').select('*').eq('slug', slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new ToolError(`No existe una nota con el slug «${slug}». Usa list_news para ver los slugs.`);
    return data as NewsRow;
  }

  async function uniqueSlug(base: string): Promise<string> {
    const root = slugify(base) || 'nota';
    const { data, error } = await supabase.from('news_posts').select('slug').like('slug', `${root}%`);
    if (error) throw new Error(error.message);
    const taken = new Set((data ?? []).map((row) => row.slug as string));
    if (!taken.has(root)) return root;
    for (let n = 2; ; n += 1) if (!taken.has(`${root}-${n}`)) return `${root}-${n}`;
  }

  function summary(row: NewsRow) {
    return {
      slug: row.slug,
      title: row.title,
      category: row.category,
      status: row.status,
      publishedOn: row.published_on,
      hasCover: Boolean(row.cover_path),
      sample: row.sample,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      url: row.status === 'published' ? publicUrl(row.slug) : null,
      previewUrl: previewUrl(row.preview_token),
    };
  }

  async function removeStoredCovers(postId: string, keep?: string) {
    const { data } = await supabase.storage.from(NEWS_COVERS_BUCKET).list(postId);
    const paths = (data ?? []).map((file) => `${postId}/${file.name}`).filter((path) => path !== keep);
    if (paths.length > 0) await supabase.storage.from(NEWS_COVERS_BUCKET).remove(paths);
  }

  /* ------------------------------------------------------------------------ */
  /*  Guia                                                                     */
  /* ------------------------------------------------------------------------ */

  server.registerTool(
    'get_editorial_guide',
    {
      title: 'Guía editorial',
      description: 'Reglas de voz, veracidad y formato para redactar noticias de AFCRtecnologia. Léela antes de crear una nota.',
      annotations: { readOnlyHint: true },
    },
    run(async () => ({ content: [{ type: 'text', text: editorialGuide }] })),
  );

  server.registerPrompt(
    'redactar_noticia',
    {
      title: 'Redactar una noticia',
      description: 'Redacta un borrador de noticia para afcrtecnologia.com sobre un tema.',
      argsSchema: { tema: z.string().describe('Tema o enlace de la noticia') },
    },
    ({ tema }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `${editorialGuide}\n\n---\n\nRedacta una noticia sobre: ${tema}\n\nVerifica los hechos, crea el borrador con create_draft y devuélveme la URL de vista previa. No publiques sin mi aprobación.`,
          },
        },
      ],
    }),
  );

  /* ------------------------------------------------------------------------ */
  /*  Lectura                                                                  */
  /* ------------------------------------------------------------------------ */

  server.registerTool(
    'list_news',
    {
      title: 'Listar noticias',
      description: 'Lista las notas del sitio con su estado, fecha y URLs.',
      inputSchema: { status: z.enum(['draft', 'published', 'all']).default('all') },
      annotations: { readOnlyHint: true },
    },
    run(async ({ status }) => {
      let query = supabase
        .from('news_posts')
        .select('*')
        .order('published_on', { ascending: false, nullsFirst: true })
        .order('updated_at', { ascending: false });
      if (status !== 'all') query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return ok((data as NewsRow[]).map(summary));
    }),
  );

  server.registerTool(
    'get_news',
    {
      title: 'Ver una noticia',
      description: 'Devuelve una nota completa (incluido el cuerpo) por su slug.',
      inputSchema: { slug: slugSchema },
      annotations: { readOnlyHint: true },
    },
    run(async ({ slug }) => {
      const row = await findBySlug(slug);
      return ok({
        ...summary(row),
        excerpt: row.excerpt,
        body: row.body,
        readingTime: readingTimeFor(row.body),
        cover: row.cover_path ? { url: coverPublicUrl(row.cover_path), alt: row.cover_alt } : null,
      });
    }),
  );

  /* ------------------------------------------------------------------------ */
  /*  Escritura                                                                */
  /* ------------------------------------------------------------------------ */

  server.registerTool(
    'create_draft',
    {
      title: 'Crear borrador',
      description:
        'Crea una nota en borrador (no es pública). Devuelve el slug y una URL privada de vista previa para revisarla.',
      inputSchema: {
        title: titleSchema,
        excerpt: excerptSchema.describe('Resumen de una o dos frases'),
        category: categorySchema,
        body: bodySchema.describe('Texto plano: párrafos separados por línea en blanco; «## » inicia un subtítulo'),
        slug: slugSchema.optional().describe('Opcional; por defecto se genera desde el título'),
      },
    },
    run(async ({ title, excerpt, category, body, slug }) => {
      const finalSlug = await uniqueSlug(slug ?? title);
      const { data, error } = await supabase
        .from('news_posts')
        .insert({
          slug: finalSlug,
          title,
          excerpt,
          category,
          body,
          status: 'draft',
          preview_token: newPreviewToken(),
          sample: false,
          created_by: agent.name,
          updated_by: agent.name,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      const row = data as NewsRow;
      return ok({ ...summary(row), next: 'Comparte previewUrl para su revisión; publica con publish_news cuando lo aprueben.' });
    }),
  );

  server.registerTool(
    'update_news',
    {
      title: 'Editar noticia',
      description:
        'Modifica los campos enviados de una nota (borrador o publicada). Si está publicada, el cambio se ve en el sitio en unos segundos.',
      inputSchema: {
        slug: slugSchema,
        title: titleSchema.optional(),
        excerpt: excerptSchema.optional(),
        category: categorySchema.optional(),
        body: bodySchema.optional(),
        newSlug: slugSchema.optional().describe('Cambia la URL; evita hacerlo en notas ya publicadas'),
      },
    },
    run(async ({ slug, newSlug, ...fields }) => {
      const row = await findBySlug(slug);
      const changes: Record<string, unknown> = { ...fields, updated_by: agent.name };
      if (newSlug && newSlug !== slug) {
        const { data: clash } = await supabase.from('news_posts').select('id').eq('slug', newSlug).maybeSingle();
        if (clash) throw new ToolError(`El slug «${newSlug}» ya está en uso.`);
        changes.slug = newSlug;
      }
      if (Object.keys(changes).length === 1) throw new ToolError('No enviaste ningún campo para cambiar.');
      const { data, error } = await supabase.from('news_posts').update(changes).eq('id', row.id).select('*').single();
      if (error) throw new Error(error.message);
      if (row.status === 'published') invalidateNews();
      return ok(summary(data as NewsRow));
    }),
  );

  server.registerTool(
    'publish_news',
    {
      title: 'Publicar noticia',
      description:
        'Publica una nota: aparece en la Home, en su URL y en el sitemap. Úsala solo cuando la persona responsable lo pida.',
      inputSchema: {
        slug: slugSchema,
        date: dateSchema.optional().describe('Fecha de publicación visible; por defecto, hoy en Lima'),
      },
    },
    run(async ({ slug, date }) => {
      const row = await findBySlug(slug);
      const { data, error } = await supabase
        .from('news_posts')
        .update({ status: 'published', published_on: date ?? row.published_on ?? todayInLima(), updated_by: agent.name })
        .eq('id', row.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      invalidateNews();
      return ok(summary(data as NewsRow));
    }),
  );

  server.registerTool(
    'unpublish_news',
    {
      title: 'Despublicar noticia',
      description: 'Retira una nota del sitio y la devuelve a borrador (no la borra).',
      inputSchema: { slug: slugSchema },
    },
    run(async ({ slug }) => {
      const row = await findBySlug(slug);
      const { data, error } = await supabase
        .from('news_posts')
        .update({ status: 'draft', updated_by: agent.name })
        .eq('id', row.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      invalidateNews();
      return ok(summary(data as NewsRow));
    }),
  );

  server.registerTool(
    'delete_news',
    {
      title: 'Eliminar noticia',
      description: 'Elimina una nota y su foto de forma definitiva. Requiere confirm: true.',
      inputSchema: { slug: slugSchema, confirm: z.literal(true).describe('Debe ser true para confirmar') },
      annotations: { destructiveHint: true },
    },
    run(async ({ slug }) => {
      const row = await findBySlug(slug);
      await removeStoredCovers(row.id);
      const { error } = await supabase.from('news_posts').delete().eq('id', row.id);
      if (error) throw new Error(error.message);
      if (row.status === 'published') invalidateNews();
      return ok({ deleted: slug });
    }),
  );

  /* ------------------------------------------------------------------------ */
  /*  Portada                                                                  */
  /* ------------------------------------------------------------------------ */

  server.registerTool(
    'request_cover_upload',
    {
      title: 'Preparar subida de portada',
      description:
        'Devuelve una URL firmada (válida 2 horas) para subir la foto de portada con curl. Después llama a attach_cover con el path devuelto.',
      inputSchema: { slug: slugSchema, contentType: coverTypeSchema },
    },
    run(async ({ slug, contentType }) => {
      const row = await findBySlug(slug);
      const path = `${row.id}/${randomBytes(8).toString('hex')}.${COVER_TYPES[contentType]}`;
      const { data, error } = await supabase.storage.from(NEWS_COVERS_BUCKET).createSignedUploadUrl(path);
      if (error) throw new Error(error.message);
      return ok({
        path,
        uploadUrl: data.signedUrl,
        curl: `curl -X PUT -H "Content-Type: ${contentType}" --data-binary @RUTA_DE_LA_IMAGEN "${data.signedUrl}"`,
        maxBytes: MAX_COVER_BYTES,
        next: 'Sube el archivo con el comando curl y luego llama a attach_cover con este path y un texto alt.',
      });
    }),
  );

  server.registerTool(
    'attach_cover',
    {
      title: 'Asignar portada',
      description:
        'Asigna la foto de portada a una nota: con el path de request_cover_upload (recomendado) o con imageBase64 (máx. 2 MB). Reemplaza la anterior.',
      inputSchema: {
        slug: slugSchema,
        alt: altSchema.describe('Descripción de la imagen para accesibilidad'),
        path: z.string().max(200).optional(),
        imageBase64: z.string().max(Math.ceil((MAX_BASE64_COVER_BYTES * 4) / 3) + 4).optional(),
      },
    },
    run(async ({ slug, alt, path, imageBase64 }) => {
      if (Boolean(path) === Boolean(imageBase64)) throw new ToolError('Envía path o imageBase64, uno de los dos.');
      const row = await findBySlug(slug);
      const bucket = supabase.storage.from(NEWS_COVERS_BUCKET);
      let finalPath: string;

      if (imageBase64) {
        const bytes = Buffer.from(imageBase64.replace(/^data:[^,]+,/, ''), 'base64');
        const type = sniffImageType(bytes);
        if (!type) throw new ToolError('La imagen debe ser JPEG, PNG o WebP.');
        if (bytes.byteLength > MAX_BASE64_COVER_BYTES) throw new ToolError('La imagen supera 2 MB; usa request_cover_upload.');
        finalPath = `${row.id}/${randomBytes(8).toString('hex')}.${COVER_TYPES[type]}`;
        const { error } = await bucket.upload(finalPath, bytes, { contentType: type, upsert: false });
        if (error) throw new Error(error.message);
      } else {
        if (!path!.startsWith(`${row.id}/`)) throw new ToolError('Ese path no pertenece a esta nota.');
        // Se comprueba el archivo real: existe, pesa lo permitido y es una imagen valida.
        const { data: file, error } = await bucket.download(path!);
        if (error || !file) throw new ToolError('No se encontró el archivo: ¿se completó la subida con curl?');
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (bytes.byteLength > MAX_COVER_BYTES || !sniffImageType(bytes)) {
          await bucket.remove([path!]);
          throw new ToolError('El archivo no es una imagen JPEG, PNG o WebP de hasta 5 MB; se eliminó.');
        }
        finalPath = path!;
      }

      const { data, error } = await supabase
        .from('news_posts')
        .update({ cover_path: finalPath, cover_alt: alt, updated_by: agent.name })
        .eq('id', row.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await removeStoredCovers(row.id, finalPath);
      if (row.status === 'published') invalidateNews();
      return ok({ ...summary(data as NewsRow), coverUrl: coverPublicUrl(finalPath) });
    }),
  );

  server.registerTool(
    'remove_cover',
    {
      title: 'Quitar portada',
      description: 'Quita la foto de una nota; vuelve a la portada tipográfica del sitio.',
      inputSchema: { slug: slugSchema },
    },
    run(async ({ slug }) => {
      const row = await findBySlug(slug);
      const { data, error } = await supabase
        .from('news_posts')
        .update({ cover_path: null, cover_alt: null, updated_by: agent.name })
        .eq('id', row.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await removeStoredCovers(row.id);
      if (row.status === 'published') invalidateNews();
      return ok(summary(data as NewsRow));
    }),
  );

  return server;
}
