# MCP de noticias — publicar con Claude Code, Codex o Cursor

El sitio expone un servidor MCP en **`https://afcrtecnologia.com/api/mcp`**
(Streamable HTTP). Un agente conectado puede redactar, revisar, publicar y
retirar noticias sin tocar código ni desplegar: los cambios aparecen en la Home,
en `/noticias/<slug>` y en el sitemap en unos segundos (máximo 10).

## 1. Crear un token por agente

Cada agente usa su propio token, que se puede revocar por separado. Se crea
desde el repositorio, con las claves de Supabase en `.env.local`:

```bash
npm run mcp:token -- create --name "Claude Code"
npm run mcp:token -- create --name "Codex"
npm run mcp:token -- create --name "Cursor"
npm run mcp:token -- list                      # agentes, último uso, estado
npm run mcp:token -- revoke --name "Cursor"    # corta el acceso al instante
```

El token (`afcr_…`) se muestra **una sola vez**. Guárdalo como variable de
entorno `AFCR_MCP_TOKEN` en la máquina del agente, por ejemplo en `~/.bashrc`
o `~/.zshrc`:

```bash
export AFCR_MCP_TOKEN="afcr_…"
```

No lo pegues en archivos del repositorio ni en chats.

## 2. Conectar el agente

### Claude Code

```bash
claude mcp add --scope user --transport http afcr https://afcrtecnologia.com/api/mcp \
  --header "Authorization: Bearer ${AFCR_MCP_TOKEN}"
```

Compruébalo con `/mcp`: debe aparecer `afcr` conectado con 11 herramientas.

### Codex (`~/.codex/config.toml`)

```toml
[mcp_servers.afcr]
url = "https://afcrtecnologia.com/api/mcp"
bearer_token_env_var = "AFCR_MCP_TOKEN"
```

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "afcr": {
      "url": "https://afcrtecnologia.com/api/mcp",
      "headers": { "Authorization": "Bearer ${env:AFCR_MCP_TOKEN}" }
    }
  }
}
```

## 3. Flujo de trabajo

Pídeselo al agente en lenguaje natural, por ejemplo:

> Usa el MCP afcr: redacta una noticia sobre el lanzamiento de X, verifica los
> datos y déjala en borrador. Pásame la vista previa.

1. El agente lee la guía (`get_editorial_guide`) y crea el borrador
   (`create_draft`).
2. Te devuelve una **URL de vista previa privada**. Esa página no se indexa y
   solo la ve quien tenga el enlace.
3. Pides cambios (`update_news`) o una foto de portada
   (`request_cover_upload` + `attach_cover`).
4. Dices «publícala» (`publish_news`). Para retirarla: «despublícala»
   (`unpublish_news`).

| Herramienta | Uso |
| --- | --- |
| `get_editorial_guide` | Reglas de voz, veracidad y formato (también es el prompt `redactar_noticia`) |
| `list_news` / `get_news` | Ver las notas y su estado |
| `create_draft` | Nueva nota en borrador, con URL de vista previa |
| `update_news` | Editar campos; si la nota está publicada, el cambio se ve en unos segundos |
| `request_cover_upload` | URL firmada + comando `curl` para subir una foto (JPEG, PNG o WebP, hasta 5 MB) |
| `attach_cover` | Asignar la foto subida (o una en base64 de hasta 2 MB) con su texto `alt` |
| `remove_cover` | Volver a la portada tipográfica |
| `publish_news` / `unpublish_news` | Publicar o retirar |
| `delete_news` | Borrar definitivamente (pide `confirm: true`) |

**Formato del cuerpo:** texto plano, con párrafos separados por una línea en
blanco. Un párrafo que empieza con `## ` es un subtítulo.

## Seguridad

- Solo se acepta `Authorization: Bearer afcr_…`. En Supabase se guarda el
  SHA-256 del token, nunca el token en claro. Hay un rate limit de 120
  solicitudes por minuto por token.
- `SUPABASE_URL` y `SUPABASE_SECRET_KEY` viven solo en el servidor (`.env.local`
  y variables de Hostinger), nunca con el prefijo `NEXT_PUBLIC_`.
- Las tablas tienen RLS sin políticas: la API pública de Supabase no puede leer
  borradores, tokens de vista previa ni hashes.
- Las notas de agentes siguen las reglas de afirmaciones de `PRODUCT.md`: nada
  de métricas, clientes ni citas inventadas.

## Verificar

```bash
AFCR_MCP_TOKEN=afcr_… node scripts/mcp-smoke.mjs --url http://localhost:3000
```

Crea una nota de prueba y recorre la vista previa, la portada, la publicación,
el retiro y el borrado. Al final la elimina.
