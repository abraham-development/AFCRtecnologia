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

- El sitio tiene Home, Servicios, Nosotros, Contáctanos y 8 artículos en
  `/recursos/[slug]`; todas las páginas son estáticas.
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
  solo lo delimitan sus líneas `border-editorial` superior e inferior. La
  página activa se marca con un contorno cian alrededor de su nombre, sin
  subrayado.
- El texto del CTA del header es «Contacta con un asesor por WhatsApp» y abre
  `wa.me` en una pestaña nueva. La estructura y el contenido del menú
  fullscreen no se alteran al retocar la hamburguesa.
- En el hero, el botón principal dice «Empieza un proyecto con nosotros» y el
  secundario «Ver Servicios». No hay atajos de una sola letra: el usuario los
  retiró porque una pulsación accidental cambiaba de página.
- El footer compartido comienza con el directorio del sitio y termina en la
  barra legal. La franja «¿Prefieres conversar?» se retiró por decisión del
  usuario; WhatsApp y correo siguen disponibles en la columna de contacto.
- En Servicios, las cuatro categorías principales forman un índice vertical:
  una categoría por fila a cualquier ancho. No volver a presentarlas en grilla
  ni añadir conteos junto a sus nombres.
- El cursor personalizado es una flecha de alto contraste de 20 × 24 px (negra
  con borde claro); sobre enlaces, botones y `[data-cursor="expand"]` pasa a
  verde con halo. Es una **imagen de cursor nativa** en CSS (`globals.css`,
  `@layer base`), no un elemento movido con JavaScript: el usuario lo notaba
  pesado porque un cursor pintado por JS siempre va 1–2 cuadros detrás del
  sistema y compite con el WebGL. No volver a un cursor JS. Fuentes SVG en
  `public/cursors/`; si cambian, regenerar los PNG 1x/2x (Chrome headless) y
  los hotspots (punta: 3 3 y 7 7). El de enlace no debe pasar de 32 × 32 px:
  Chrome descarta cursores mayores cerca de la interfaz del navegador. En
  campos de texto vuelve el cursor de sistema.
- `RootLayout` usa `suppressHydrationWarning` tanto en `<html>` como en
  `<body>`. El segundo evita falsos positivos cuando una extensión modifica la
  clase del body antes de hidratar (caso observado: `expansion-alids-init`).
- Noticias y MCP eliminados por decisión del usuario (2026-09-29): no existen
  `/noticias/*`, `/api/mcp`, ni el código de Supabase del sitio, y los tokens
  `afcr_…` quedaron revocados en `agent_tokens`. Las tablas (`news_posts`,
  `agent_tokens`) y el bucket `news-covers` siguen en Supabase sin uso; las
  migraciones de `supabase/` documentan ese esquema. No reintroducir noticias
  ni el MCP sin pedido.
- En su lugar, la Home muestra «RECURSOS» (pedido del usuario, 2026-10-01):
  8 artículos, uno por servicio, que explican el problema y la solución y solo
  invitan a contactar en el cierre (promoción indirecta). Temas, en este orden:
  RAG, agente de IA para WhatsApp, automatizaciones, agentes de IA
  personalizados, páginas web, capacitaciones, software a medida y venta de
  dispositivos (mini PC y cámaras de seguridad). El título va al pie del hero,
  entre dos líneas editoriales, en mayúsculas por CSS y con una bajada.
  Debajo, un artículo por fila con la card editorial: portada a la izquierda
  (alto fijo de 240 px, `h-60`, pedido del usuario; no volver a 4:3) y
  autor «Equipo de AFCRtecnologia», título, resumen, tema y lectura. **Sin
  fecha** (decisión del usuario: son atemporales). Cada card abre
  `/recursos/[slug]` con el texto completo, «Sigue leyendo» y `CtaBand`.
- El artículo de RAG es texto del usuario (2026-10-01): no reescribirlo sin
  pedido. Su cuerpo usa la sintaxis completa de `ResourceArticle.body`
  (`##`, `###`, `- `, `1. `, tabla con `| ` y `**negrita**`); la tabla se
  muestra apilada por fila en celular y completa desde `sm`.
- Portadas: las entrega el usuario. Se exportan desde el original con PIL a
  `public/recursos/<name>-{800,1600,<ancho original>}.webp` (q 84, compuestas
  sobre blanco si traen alfa) y `<name>-og.jpg` de 1200 px para redes; en el
  artículo se añade `cover: { name, alt, width, height }`. En la card se
  recortan al centro (240 px de alto, imagen decorativa); en el artículo van
  enteras con su proporción y un enlace a tamaño completo. Sin portada,
  `ResourceCover` muestra la tipográfica (tema en Fraunces, recortado, con
  grano). No usar fotos de stock.
- Los artículos no inventan clientes, métricas, precios ni plazos.

---

## Mapa del sitio

| Ruta | Contenido | Implementación principal |
| --- | --- | --- |
| `/` | Hero de partículas + Recursos (8 artículos) | `src/components/home/` |
| `/recursos/[slug]` | Artículo completo; `generateStaticParams` en ambos builds | `src/app/recursos/[slug]/page.tsx` · `src/components/resources/` |
| `/servicios` | Directorio de 10 servicios, sin conteo junto a cada categoría | `src/components/services/` |
| `/nosotros` | Audiencias, proceso, principios, herramientas | `src/components/about/` |
| `/contacto` | Canales + formulario `#formulario` | `src/components/contact/` |

- Todas las páginas y `sitemap.xml` se prerenderizan. `/api/contact` solo
  existe en el build Node.
- Cada página exporta `metadata`; cada artículo además publica JSON-LD
  `Article`. El sitemap (`src/lib/seo/sitemap.ts`) deriva sus rutas de
  `navItems` y de los artículos. `siteUrl` vive en `src/lib/seo/site-url.ts`.
  El tiempo de lectura se calcula del cuerpo (~200 palabras/min).
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
| Preloader, partículas, WebGL | `src/components/effects/` |
| Microinteracciones compartidas | `src/components/ui/` |
| Logotipo web | `src/components/ui/BrandLogo.tsx` |
| Empresa, navegación y contacto | `src/content/agency.ts` |
| Catálogo de servicios | `src/content/services.ts` |
| Recursos: artículos y copy | `src/content/resources.ts` |
| Recursos: lista, portada y artículo | `src/components/home/ResourcesSection.tsx` · `src/components/resources/` |
| Esquema Supabase sin uso (noticias/MCP retirados) | `supabase/migrations/` · `supabase/seed.sql` |
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

- Lo que exige servidor lleva extensión `.node.ts(x)` (hoy solo
  `/api/contact`); `pageExtensions` la excluye del modo estático.
- `robots.ts` y `sitemap.xml/route.ts` conservan `dynamic = 'force-static'`,
  que exige `output: 'export'`.
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
  `NEXT_PUBLIC_WHATSAPP_NUMBER` y, opcionales, `CONTACT_WEBHOOK_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
  `CONTACT_FROM_EMAIL`. En Hostinger se cargan en hPanel; la API de variables
  hace un reemplazo total y devuelve valores enmascarados.
- `NEXT_PUBLIC_*` se incrusta en el HTML. Cambiar esas variables exige un build
  nuevo, no solo reiniciar la app.
- Datos aún marcadores: correo y dirección en `src/content/agency.ts`; URLs de
  Facebook, Instagram y LinkedIn; páginas legales del footer.
- Las variables `SUPABASE_*` de hPanel ya no las usa el sitio; pueden
  retirarse allí (recordar que la API de variables reemplaza el conjunto).
- Trampa verificada en producción, útil si vuelve algún contenido dinámico:
  Hostinger corre **varios procesos Node** y no completa el trabajo que Next
  deja en segundo plano: `revalidateTag` solo refrescaba un proceso y el ISR
  por tiempo se quedaba en `STALE`. Además, Next no precarga una página
  dinámica sin `loading.tsx`, así que navegar a ella espera al servidor.
- No inventar métricas, clientes, testimonios, precios, plazos ni resultados.
  Ver `PRODUCT.md` antes de tocar afirmaciones comerciales.

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
- `prefers-reduced-motion` desactiva Lenis, partículas y preloader (el cursor
  es una imagen estática y se mantiene).
- Para contener el ancho usar `overflow-x: clip`, no `hidden`, porque este
  último rompe `position: sticky`.

### Teclado

- No hay atajos de una sola letra. `E` y `S` se retiraron a pedido del usuario
  (2026-09-29): una pulsación casual llevaba a Contacto o Servicios. No
  reintroducirlos.
- Con el menú fullscreen abierto, Escape lo cierra y Tab recorre sus enlaces.
  Eso es el comportamiento del diálogo, no un atajo de navegación.

---

## Trampas verificadas — no repetir

### Tailwind v4

- `scale-*` y `translate-*` usan propiedades CSS independientes: un elemento
  que se mueve con `transform` y además escala o rota necesita un wrapper para
  cada responsabilidad.
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
