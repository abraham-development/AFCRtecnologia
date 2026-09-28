# AGENTS.md — memoria operativa de AFCRtecnologia

Sitio corporativo de AFCRtecnologia, agencia de software e IA de Lima, Perú.
Estética editorial tecnológica, sin CMS. El objetivo del sitio es que el
visitante identifique su servicio y contacte, preferentemente por WhatsApp.

Este archivo es la fuente canónica de contexto técnico y decisiones persistentes
para cualquier agente. La verdad de producto, audiencias, servicios confirmados
y afirmaciones permitidas vive en `PRODUCT.md`. No existe un `CLAUDE.md`
duplicado: si una herramienta necesita un adaptador, debe limitarse a referenciar
este archivo.

## Protocolo de memoria entre sesiones

Un hilo nuevo no ve los chats anteriores. Este archivo es la única memoria que
cruza sesiones: Cursor lo inyecta al empezar. No buscar el contexto en
transcripciones, en `CLAUDE.md` ni en el hilo previo.

### Al comenzar

1. Tratar lo escrito aquí como vigente hasta que el código lo desmienta.
2. Leer `PRODUCT.md` después de este archivo.
3. Ejecutar `git status --short` y revisar los diffs relacionados antes de
   editar. El worktree puede contener cambios del usuario: no sobrescribirlos,
   revertirlos ni incluirlos en un commit ajeno.
4. Si el código, `package.json`, `package-lock.json` o Git contradicen una
   frase de aquí, manda el código y se corrige esta frase en el mismo cambio.
5. Para tareas de Next.js, leer primero la guía relevante de
   `node_modules/next/dist/docs/`; esta versión tiene cambios incompatibles con
   conocimiento histórico de Next.

### Qué escribir antes de cerrar el hilo

Actualizar la sección afectada en el mismo cambio, sustituyendo la frase que
dejó de ser cierta. No añadir una bitácora ni un diario de tareas. Entra aquí
solo lo que otro hilo repetiría mal si no lo lee:

- Decisiones explícitas del usuario sobre copy visible, logo, navegación,
  contacto y qué no debe reintroducirse.
- Arquitectura, invariantes, trampas ya verificadas y el procedimiento de
  build o despliegue.
- La fecha de «Estado estable actual» solo cuando ese bloque se recontrasta
  con el código.

No guardar secretos, valores de `.env*`, teléfonos, tokens, PIDs, URLs de
preview temporales ni si un servidor local sigue encendido.

`.agents/`, `.claude/`, `.codex/`, `.cursor/`, `.impeccable/` y
`skills-lock.json` son artefactos de herramientas. No agregarlos a commits de
producto salvo petición explícita.

### Antes de entregar

1. Ejecutar `npm run typecheck && npm run lint && npm run build`.
2. Si el cambio se desplegará en Hostinger, ejecutar además la simulación de
   producción descrita en «Despliegue».
3. Revisar `git diff --check` y `git status --short`.
4. Informar con claridad qué quedó local, qué se confirmó visualmente y si hubo
   commit, push o despliegue. Nunca asumir que una de esas acciones ocurrió.

---

## Estado estable actual — verificado en código el 2026-09-28

- El sitio tiene Home, Servicios, Nosotros, Contáctanos y notas individuales.
- El logotipo oficial es la imagen entregada por la empresa
  (`recursos_internos/Logotipo.png`, placa oscura y wordmark marfil). `BrandLogo`
  lo muestra en header, footer y preloader con un `<img srcSet>` sobre
  `public/brand/afcr-logotipo-{200,300,400,600,900,1200}.webp`; cada consumidor
  fija la altura con `h-*` y su ancho máximo con `sizes`. Trampa verificada: si
  el navegador reduce una imagen grande ~6×, con la página quieta los trazos
  finos quedan grises y desiguales. Por eso las variantes se generan ya al
  tamaño final con promedio por área (`BOX`) en luz lineal y alfa
  premultiplicado; Lanczos crea halos y `next/image` no aplicaría ese escalado.
  Si cambia el logo, regenerar todas las variantes igual.
- Hover del logotipo (pedido del usuario, en todos sus usos): sobre la imagen
  va la variante `afcr-logotipo-cian-*.webp` (mismas letras en `#5bc2d8`, placa
  y borde intactos) y aparece con un fundido de opacidad al pasar el cursor
  (`group/logo`) o al enfocar con teclado el enlace que lo contiene
  (`in-focus-visible`). Tailwind v4 aplica `hover:` solo con
  `@media (hover: hover)`: para probarlo en Chrome headless lanzar con
  `--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4`.
  `afcr-logotipo.png` alimenta el `logo` del JSON-LD y
  `src/app/opengraph-image.png` / `twitter-image.png` lo muestran al compartir.
  No redibujarlo en CSS. La placa metálica de
  `public/brand/afcr-logotipo-plateado.png` no se muestra. El header conserva el CTA a WhatsApp —solo si existe la variable— y una
  hamburguesa visible de tres líneas. La frase «ONLINE - LATAM & GLOBAL» se
  eliminó intencionalmente y no debe reintroducirse.
- El header de dos niveles tiene un solo fondo, propio y constante (no
  transparente sobre el hero): token `--color-bg-header` (`#1a2539`, pizarra
  algo más clara que el hero, pedido del usuario) al 95 % con grano y blur en
  todo el `<header>`. La placa del logotipo conserva su propio fondo oscuro. El navbar no lleva fondo propio (el usuario pidió un único color);
  solo lo delimitan sus líneas `border-editorial` superior e inferior.
- El texto del CTA del header es «Contacta con un asesor por WhatsApp» y abre
  `wa.me` en una pestaña nueva. La estructura y el contenido del menú
  fullscreen no se alteran al retocar la hamburguesa.
- En el hero, el botón principal dice «Empieza un proyecto con nosotros» y el
  secundario «Ver Servicios». Ninguno muestra la tecla de atajo. `E` y `S`
  siguen funcionando; la insignia `E` solo permanece en el envío del
  formulario de contacto.
- El footer compartido comienza con el directorio del sitio y termina en la
  barra legal. La franja «¿Prefieres conversar?» se retiró por decisión del
  usuario; WhatsApp y correo siguen disponibles en la columna de contacto.
- En Servicios, las cuatro categorías principales forman un índice vertical:
  una categoría por fila a cualquier ancho. No volver a presentarlas en grilla
  ni añadir conteos junto a sus nombres.
- El cursor personalizado es una flecha de alto contraste de 20 × 24 px. Tiene
  halo cian solo sobre controles interactivos, conserva el hotspot exacto,
  vuelve al cursor nativo en campos de texto y se desactiva con puntero táctil
  o `prefers-reduced-motion`.
- `RootLayout` usa `suppressHydrationWarning` tanto en `<html>` como en
  `<body>`. El segundo evita falsos positivos cuando una extensión modifica la
  clase del body antes de hidratar (caso observado: `expansion-alids-init`).
- Las noticias viven en Supabase (`news_posts`) y se publican con el **MCP del
  sitio** (`/api/mcp`, guía de conexión en `docs/mcp.md`), no editando código ni
  con un panel: decisión del usuario. `src/content/news.ts` queda solo como
  respaldo (sin claves de Supabase: build estático o dev) y fue el seed inicial.
  Las cinco notas de ejemplo siguen en la tabla con `sample = true`. La nota
  mockup sobre SIRE/SUNAT fue eliminada intencionalmente; no reintroducirla sin
  pedido. SUNAT sigue siendo un servicio confirmado.
- La sección se titula «Noticias relevantes de inteligencia artificial y
  tecnología». Ese título está al pie del hero, entre dos líneas editoriales,
  en el lugar de la franja BASE / ENFOQUE / RESPUESTA y del salto «NOTICIAS»,
  que se retiraron: no reintroducirlos. No lleva bajada ni filtros por
  categoría. Las notas siguen
  justo debajo, una por una, de la más reciente a la más
  antigua, con la misma card: portada a la izquierda y, al costado, fecha
  publicada bien visible, título, resumen, categoría y lectura. La más reciente
  lleva la etiqueta «Más reciente».
- La portada es generada, no fotográfica: la palabra de categoría en Fraunces,
  gigante y recortada, sobre un panel con grano. Es decisión del usuario; no
  sustituirla por fotos de stock. Se usa fecha absoluta y no «hace X días»,
  porque un texto relativo se congelaría en el build y quedaría falso.
- Las notas restantes llevan `sample: true` y muestran «EJEMPLO»: no deben
  presentarse como publicaciones reales de AFCR.

---

## Mapa del sitio

| Ruta | Contenido | Implementación principal |
| --- | --- | --- |
| `/` | Hero de partículas + Noticias | `src/components/home/` |
| `/servicios` | Directorio de 10 servicios, sin conteo junto a cada categoría | `src/components/services/` |
| `/nosotros` | Audiencias, proceso, principios, herramientas | `src/components/about/` |
| `/contacto` | Canales + formulario `#formulario` | `src/components/contact/` |
| `/noticias/[slug]` | Nota publicada: `page.node.tsx` (dinámica) / `page.static.tsx` (export) | `src/lib/news/news-route.tsx` |
| `/noticias/vista-previa/[token]` | Borrador privado, `noindex`, solo build Node | `page.node.tsx` |
| `/api/mcp` | MCP de noticias para agentes, solo build Node | `route.node.ts` |

- Las páginas institucionales se prerenderizan. Con Supabase, Home, cada nota
  y `sitemap.xml` son dinámicas (leen la base en cada visita); todo funciona
  también con `build:static`, que prerenderiza las notas de respaldo.
  `/api/contact` y `/api/mcp` solo existen en el build Node.
- Cada página exporta `metadata`. El sitemap (`src/lib/seo/sitemap.ts`) deriva
  rutas desde `navItems` y las notas publicadas. El tiempo de lectura se
  calcula del cuerpo (~200 palabras/min); no se escribe a mano.
- La navegación usa `next/link`. Las anclas entre páginas llevan ruta y hash,
  por ejemplo `/servicios#ia`; `SmoothScrollProvider` gestiona inicio/ancla.
- Copy y datos editables viven en `src/content/*.ts`; contratos en
  `src/types/index.ts`. No duplicar copy entre componentes.

## Mapa de código

| Área | Fuente |
| --- | --- |
| Layout, metadata y JSON-LD | `src/app/layout.tsx` |
| Tokens, Tailwind y estilos globales | `src/app/globals.css` |
| Header, menú, footer y scroll | `src/components/layout/` |
| Cursor, preloader, partículas, WebGL | `src/components/effects/` |
| Microinteracciones compartidas | `src/components/ui/` |
| Logotipo web | `src/components/ui/BrandLogo.tsx` |
| Empresa, navegación y contacto | `src/content/agency.ts` |
| Catálogo de servicios | `src/content/services.ts` |
| Noticias: lectura y caché (tag `news`) | `src/lib/news/repository.ts` |
| MCP: auth por token y herramientas | `src/lib/mcp/` · `src/app/api/mcp/route.node.ts` |
| Guía editorial que reciben los agentes | `src/content/news-editorial.ts` |
| Esquema Supabase, RLS y bucket | `supabase/migrations/` · `supabase/seed.sql` |
| Notas de respaldo | `src/content/news.ts` |
| Validación compartida | `src/lib/validations.ts` |
| Endpoint Node | `src/app/api/contact/route.node.ts` |
| Fallback PHP estático | `public/contact.php` |

---

## Comandos y stack

```bash
npm run dev             # Next en desarrollo
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint + reglas React Compiler
npm run build           # servidor Node con Turbopack
npm run build:hostinger # servidor Node con webpack; producción real
npm run start           # sirve .next
npm run build:static    # export alternativo → out/
npm run package:static  # export + ZIP para hosting sin Node
npm run mcp:token -- create|list|revoke --name "Agente"  # tokens del MCP
AFCR_MCP_TOKEN=… node scripts/mcp-smoke.mjs --url http://localhost:3000
```

Node local 22 · Node Hostinger 24 · npm. No usar pnpm.

| Paquete | Versión verificada | Restricción |
| --- | --- | --- |
| Next | 16.3.5 | App Router; Turbopack local, webpack en Hostinger |
| React / React DOM | 19.3.0 | React Compiler vigilado por ESLint |
| Tailwind CSS | 4.3.3 | CSS-first, sin `tailwind.config.ts` |
| Motion | 13.4.0 | importar desde `motion/react` |
| Three.js | 0.186.0 | API plana, sin React Three Fiber |
| Lenis | 1.3.26 | scroll suave |
| Zod | 4.6.5 | esquema cliente/servidor |
| React Hook Form | 7.88.0 | resolver 5.9.1 |
| TypeScript | 5.9.3 | modo estricto |
| MCP SDK | 1.30.x | transporte web-standard sin estado |
| supabase-js | 2.117.x | solo servidor, clave secreta |

---

## Decisiones de arquitectura

1. **Tailwind v4 CSS-first.** Los tokens están en `@theme` de
   `src/app/globals.css`. No crear `tailwind.config.ts`.
2. **Three.js sin React Three Fiber.** `WebGLHeroBackground` se carga con
   `next/dynamic` y `ssr: false`; Three no entra al bundle inicial.
3. **Contenido centralizado.** Todo copy nuevo o modificado debe residir en
   `src/content/*.ts`; componentes y nombres de archivo en inglés, copy,
   comentarios y `aria-label` en español.
4. **Geometría editorial.** Bordes de 1 px `#243049`, radios mínimos, sin
   sombras decorativas; jerarquía mediante espacio, opacidad y cian.
5. **Fuentes.** Fraunces usa `opsz: 72` en display. El `h1` del hero usa la
   fuente estática `src/fonts/fraunces-display-opsz72-300-latin.woff2` porque
   Canvas 2D no reproduce ejes variables con precisión.
6. **Responsive.** Debe funcionar de 320 a 2560 px sin scroll horizontal y
   con áreas táctiles ≥ 44 px hasta 1024 px. La variante CSS `short:`
   (`max-height: 480px`) compacta el header y oculta el segundo navbar.

---

## Compilación y despliegue

### Producción actual: Hostinger Business + Git

La producción real ejecuta Next.js sobre Node; **no** usa el export estático.

| Dato | Valor |
| --- | --- |
| Dominio | `afcrtecnologia.com` |
| Usuario hosting | `u574572243` |
| Repositorio | `abraham-development/AFCRtecnologia` |
| Rama | `main` |
| Tipo | `app_type: next` |
| Build | `npm run build:hostinger` |
| Salida | `.next` · raíz `/` · Node 24 · npm |

Reglas críticas:

- La configuración se llama `next.config.mjs`, nunca `.ts`. El contenedor de
  Hostinger tiene una glibc antigua; SWC nativo falla y el fallback WASM no
  transpila configuraciones TypeScript.
- Hostinger no soporta Turbopack: allí se usa `next build --webpack` mediante
  `build:hostinger`.
- Hostinger instala solo `dependencies`. `tailwindcss`,
  `@tailwindcss/postcss`, `typescript` y `@types/*` deben permanecer allí;
  únicamente ESLint y `eslint-config-next` van en `devDependencies`.
- Antes de pushear un cambio que afecte el build, copiar a un temporal,
  ejecutar `npm install --omit=dev` y después `npm run build:hostinger`.
- No desplegar en `magenta-flamingo-697303.hostingersite.com`: pertenece al
  proyecto `creciendo_juntos` y se sobrescribiría.

### Export estático: solo alternativa

`BUILD_TARGET=static` activa `output: 'export'`, genera `out/`, desactiva el
route handler y usa `/contact.php`. Mantener estas condiciones:

- Lo que exige servidor lleva extensión `.node.ts(x)` (`/api/contact`,
  `/api/mcp`, vista previa de borradores); `pageExtensions` las excluye del modo
  estático. Ese build muestra las notas publicadas al compilar (o el respaldo).
- `robots.ts` conserva `dynamic = 'force-static'`. El sitemap y la página de
  cada nota tienen dos archivos: `.node.ts(x)` (dinámico) y `.static.ts(x)`
  (`force-static` / `generateStaticParams`); `pageExtensions` elige uno por
  build. Next no acepta estas extensiones en el archivo de metadatos
  `sitemap.ts`, por eso el sitemap es un route handler en `sitemap.xml/`.
- `headers()` solo se declara en modo Node; Apache usa `public/.htaccess`.
- `NEXT_PUBLIC_CONTACT_ENDPOINT` vale `/api/contact` por defecto y el script
  estático lo fija en `/contact.php`.

### Builds dentro de sandboxes

- No ejecutar un build sobre el mismo `.next` mientras `next dev` esté activo.
  Usar una copia temporal para no detener el servidor ni alterar sus locks.
- Turbopack puede fallar en sandboxes que impiden abrir puertos internos. Si
  ocurre, conservar el error original, ejecutar igualmente las verificaciones
  posibles y validar el artefacto real con `build:hostinger` en un temporal.
  No convertir una limitación del sandbox en un cambio permanente del proyecto.

---

## Variables, datos y seguridad

- `.env.local` y `.env.production` están ignorados por Git. Nunca imprimirlos,
  copiarlos a documentación ni versionar sus valores.
- WhatsApp llega por `NEXT_PUBLIC_WHATSAPP_NUMBER`. Si falta, ocultar el CTA
  mediante `hasWhatsApp`; no generar enlaces vacíos. `NEXT_PUBLIC_PHONE_DISPLAY`
  existe, pero la interfaz actual no muestra el teléfono.
- No hay `.env.example` (el usuario lo retiró a propósito). Variables:
  `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PHONE_DISPLAY`,
  `NEXT_PUBLIC_WHATSAPP_NUMBER`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` y,
  opcionales, `CONTACT_WEBHOOK_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
  `CONTACT_FROM_EMAIL`. En Hostinger se cargan en hPanel; la API de variables
  hace un reemplazo total y devuelve valores enmascarados.
- `NEXT_PUBLIC_*` se incrusta en el HTML. Cambiar esas variables exige un build
  nuevo, no solo reiniciar la app.
- Datos aún marcadores: correo y dirección en `src/content/agency.ts`; URLs de
  Facebook, Instagram y LinkedIn; páginas legales del footer.
- `SUPABASE_URL` y `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`, o
  `SUPABASE_API_KEY` si contiene una clave secreta: es el nombre que impone la
  integración de Supabase de hPanel, que además reemplazó una vez todo el
  conjunto de variables y borró `SUPABASE_SECRET_KEY`) son solo de servidor: nunca `NEXT_PUBLIC_`. `src/lib/supabase/server.ts` importa
  `server-only`. Hostinger las necesita en build y runtime.
- MCP de noticias: tokens `afcr_…` por agente; en `agent_tokens` solo se guarda
  su SHA-256. Las tablas tienen RLS **sin políticas** y sin privilegios para
  `anon`/`authenticated`: no añadir lectura pública, porque expondría
  borradores y `preview_token`. El bucket `news-covers` es público de solo
  lectura (5 MB, JPEG/PNG/WebP).
- `getPublishedNews()` propaga los errores de Supabase a propósito: mejor un
  error visible que una sección de noticias vacía que parezca correcta.
- Trampa verificada en producción: Hostinger corre **varios procesos Node** y
  no completa el trabajo que Next deja en segundo plano. Resultado probado:
  `revalidateTag` solo refrescaba un proceso y el ISR por tiempo
  (stale-while-revalidate) se quedaba en `STALE` sirviendo notas ya borradas.
  Por eso las rutas de noticias no usan caché de Next: `getPublishedNews()`
  llama a `connection()` (ruta dinámica) y guarda la lista 10 s por proceso
  (`NEWS_MEMO_MS`); el MCP limpia esa memoria con `invalidateNewsMemo()`. Un
  cambio se ve en todo el sitio en ≤ 10 s. No volver a `unstable_cache`, ISR
  ni `revalidateTag` para noticias sin un `cacheHandler` compartido (Redis).
- Consecuencia verificada: al ser dinámica, Next no precarga Home y cada vuelta
  al inicio esperaba al servidor (lento en celular). Por eso el `<Link>` del
  logotipo del header lleva `prefetch` (precarga completa, caché cliente de
  5 min) y `page.tsx` deja solo las noticias dentro de `<Suspense>`, para que
  el hero no espere a Supabase. No quitar ninguno de los dos. Recargar la
  página siempre trae la lista actual.
- Las notas de ejemplo llevan `sample = true`. No inventar métricas, clientes,
  testimonios, precios, plazos ni resultados; la guía editorial del MCP lo
  exige a los agentes. Ver `PRODUCT.md` antes de tocar afirmaciones comerciales.

---

## Invariantes de accesibilidad y rendimiento

### Accesibilidad

- Todo control interactivo tiene nombre accesible; `:focus-visible` usa el
  contorno cian global.
- Contraste mínimo de texto: 4.5:1, incluso en estados inactivos.
- El cursor nativo debe reaparecer en `input`, `textarea`, `select` y
  `contenteditable`.
- El contenido y los controles siguen siendo utilizables con teclado,
  JavaScript reducido y `prefers-reduced-motion`.

### Rendimiento

- Canvas y WebGL se pausan con `document.hidden` e `IntersectionObserver`.
- `WebGLHeroBackground` apaga niebla y reduce partículas si no sostiene
  aproximadamente 40 FPS. No retirar esa degradación.
- `prefers-reduced-motion` desactiva Lenis, cursor, partículas y preloader.
- Para contener el ancho usar `overflow-x: clip`, no `hidden`, porque este
  último rompe `position: sticky`.

### Atajos

- `E` → `/contacto#formulario` y foco en `#contact-name`.
- `S` → `/servicios`.
- Esos atajos no se anuncian en los botones del hero. La insignia `E` solo va
  en el botón de envío del formulario.
- Nunca se activan dentro de `input`, `textarea`, `select` o
  `contenteditable`; lógica en `src/hooks/useKeyboardShortcut.ts`.

---

## Trampas verificadas — no repetir

### Tailwind v4

- `scale-*` y `translate-*` usan propiedades CSS independientes. En
  `CustomCursor`, el wrapper posee `translate3d(...)` y el hijo recibe escala o
  rotación; no unir ambas responsabilidades.
- Una `@utility` propia nunca declara `position`. `noise` solo pinta grano en
  `::after`; el consumidor aporta su posición.
- Las carpetas de agentes están excluidas con `@source not` para impedir que
  Tailwind extraiga clases corruptas desde documentación o binarios.
- Usar la variante `short:` ya declarada; no repetir variantes arbitrarias de
  `max-height` en JSX.

### Canvas 2D

- Canvas ignora `letter-spacing` CSS: copiarlo al contexto de medición y dibujo.
- El reset `canvas { max-width: 100% }` comprime lienzos calculados por JS;
  esos canvas necesitan `max-w-none`.
- Alinear con el DOM mediante `fontBoundingBoxAscent/Descent` y el
  medio-interlineado, no con métricas de tinta.

### React 19 / React Compiler

- No llamar `setState` síncronamente dentro de un efecto. Usar los patrones ya
  presentes: `useSyncExternalStore`, `requestAnimationFrame` o `dataset` por ref.
- No escribir refs durante render ni llamar `Date.now()` / `Math.random()` en
  el cuerpo del componente.
- Con RHF usar `useWatch({ control, name })`, no `watch()`.
- `suppressHydrationWarning` en body responde a modificaciones externas del DOM;
  no oculta divergencias de datos dentro de componentes.

### Zod y formulario

- `src/lib/validations.ts` no usa `.transform()`: normalizar en el handler para
  no separar los tipos de entrada/salida del resolver.
- `public/contact.php` duplica las reglas Zod. Cambiar campos, límites o
  mensajes exige actualizar ambos en el mismo commit. Deben conservar el mismo
  JSON `{ ok, message, fieldErrors }` y códigos 200/400/405/429/500.
- No hay PHP local. Para validar sintaxis, instalar `php-parser` únicamente en
  un temporal.

### Entrega de leads

`POST /api/contact` aplica Zod, honeypot y rate limit en memoria de 5 solicitudes
por minuto e IP. Sin integración, registra el lead en logs. Con
`CONTACT_WEBHOOK_URL` reenvía JSON; con `RESEND_API_KEY` + `CONTACT_FROM_EMAIL`
envía correo. El rate limit es por instancia; multi-región requiere Redis/KV.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
