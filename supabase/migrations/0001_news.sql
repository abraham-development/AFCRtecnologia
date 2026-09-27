-- Noticias de AFCRtecnologia + tokens del MCP de agentes.
--
-- Todo el acceso pasa por el servidor Next con la clave secreta (service role),
-- que omite RLS. RLS queda activado y SIN politicas: la API publica de
-- Supabase (anon / authenticated) no puede leer ni escribir estas tablas.
-- Asi no se exponen borradores, preview_token ni hashes de tokens.

-- ---------------------------------------------------------------------------
-- Noticias
-- ---------------------------------------------------------------------------
create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 10 and 120),
  excerpt text not null check (char_length(excerpt) between 40 and 280),
  category text not null check (category in ('IA', 'Automatización', 'Software', 'Negocio')),
  -- Texto plano: parrafos separados por linea en blanco; «## » = subtitulo.
  body text not null check (char_length(body) between 200 and 20000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_on date,
  cover_path text,
  cover_alt text check (cover_alt is null or char_length(cover_alt) between 5 and 200),
  -- Llave de la vista previa privada: 64 hex de gen_random_uuid (aleatorio fuerte).
  preview_token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
    check (char_length(preview_token) >= 32),
  sample boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_posts_published_has_date check (status = 'draft' or published_on is not null),
  constraint news_posts_cover_has_alt check (cover_path is null or cover_alt is not null)
);

comment on table public.news_posts is
  'Noticias del sitio. Se escriben con el MCP /api/mcp; el sitio solo muestra status = published.';

create index news_posts_published_idx
  on public.news_posts (published_on desc, created_at desc)
  where status = 'published';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger news_posts_touch_updated_at
  before update on public.news_posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Tokens de agentes (solo el SHA-256; el token en claro nunca se guarda)
-- ---------------------------------------------------------------------------
create table public.agent_tokens (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

comment on table public.agent_tokens is
  'Tokens Bearer del MCP de noticias. Gestionar con: npm run mcp:token -- create|list|revoke';

-- ---------------------------------------------------------------------------
-- Seguridad: RLS sin politicas + sin privilegios para roles publicos
-- ---------------------------------------------------------------------------
alter table public.news_posts enable row level security;
alter table public.agent_tokens enable row level security;

revoke all on public.news_posts from anon, authenticated;
revoke all on public.agent_tokens from anon, authenticated;
revoke all on function public.touch_updated_at() from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Fotos de portada: bucket publico de solo lectura
-- (las escrituras usan la service role o URLs firmadas que genera el MCP)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-covers', 'news-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
