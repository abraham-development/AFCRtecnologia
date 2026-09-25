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

### Al comenzar

1. Leer `AGENTS.md` y después `PRODUCT.md`.
2. Ejecutar `git status --short` y revisar los diffs relacionados antes de
   editar. El worktree puede contener cambios del usuario: no sobrescribirlos,
   revertirlos ni incluirlos en un commit ajeno.
3. Verificar en el código cualquier dato que pueda haber cambiado. Este archivo
   orienta; el código, `package.json`, `package-lock.json` y Git confirman.
4. Para tareas de Next.js, leer primero la guía relevante de
   `node_modules/next/dist/docs/`; esta versión tiene cambios incompatibles con
   conocimiento histórico de Next.

### Qué conservar aquí

- Arquitectura, invariantes, decisiones explícitas del usuario, trampas ya
  verificadas y procedimientos de build/despliegue.
- Actualizar este archivo en el mismo cambio cuando una decisión persistente
  deje de ser cierta. No usarlo como changelog ni diario de tareas.
- No guardar secretos, valores de `.env*`, teléfonos, tokens, PIDs, URLs de
  preview temporales ni estados efímeros de servidores.
- `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `.impeccable/` y
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

## Estado estable actual — verificado en código el 2026-09-25

- El sitio tiene Home, Servicios, Nosotros, Contáctanos y notas individuales.
- El header muestra el logotipo textual «AFCRtecnologia», un CTA directo a
  WhatsApp —solo si existe la variable— y una hamburguesa visible de tres
  líneas. La frase «ONLINE - LATAM & GLOBAL» se eliminó intencionalmente y no
  debe reintroducirse.
- El texto del CTA es «Contacta con un asesor por WhatsApp» y abre `wa.me` en
  una pestaña nueva. La estructura y el contenido del menú fullscreen no se
  alteran al retocar la hamburguesa.
- El cursor personalizado es una flecha de alto contraste de 20 × 24 px. Tiene
  halo cian solo sobre controles interactivos, conserva el hotspot exacto,
  vuelve al cursor nativo en campos de texto y se desactiva con puntero táctil
  o `prefers-reduced-motion`.
- `RootLayout` usa `suppressHydrationWarning` tanto en `<html>` como en
  `<body>`. El segundo evita falsos positivos cuando una extensión modifica la
  clase del body antes de hidratar (caso observado: `expansion-alids-init`).
- Home contiene cinco notas de ejemplo. La nota mockup sobre SIRE/SUNAT fue
  eliminada intencionalmente; no reintroducirla sin pedido. SUNAT sigue siendo
  un servicio confirmado. La nota más reciente se vuelve destacada de forma
  automática; actualmente es la de Hermes Agent.
- Las notas restantes llevan `sample: true` y muestran «EJEMPLO»: no deben
  presentarse como publicaciones reales de AFCR.

---

## Mapa del sitio

| Ruta | Contenido | Implementación principal |
| --- | --- | --- |
| `/` | Hero de partículas + Noticias | `src/components/home/` |
| `/servicios` | Directorio de 10 servicios | `src/components/services/` |
| `/nosotros` | Audiencias, proceso, principios, herramientas | `src/components/about/` |
| `/contacto` | Canales + formulario `#formulario` | `src/components/contact/` |
| `/noticias/[slug]` | Nota completa con `generateStaticParams` | `src/components/news/` |

- Las páginas se prerenderizan y también funcionan con `build:static`.
  `/api/contact` solo existe en el build Node.
- Cada `page.tsx` exporta `metadata`. `sitemap.ts` deriva rutas desde
  `navItems` y `newsPosts`.
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
| Empresa, navegación y contacto | `src/content/agency.ts` |
| Catálogo de servicios | `src/content/services.ts` |
| Noticias | `src/content/news.ts` |
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

- El handler debe seguir llamándose `route.node.ts`; `pageExtensions` excluye
  `node.ts` del modo estático.
- `robots.ts` y `sitemap.ts` conservan `dynamic = 'force-static'`.
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
  mediante `hasWhatsApp`; no generar enlaces vacíos. `.env.example` conserva
  `NEXT_PUBLIC_PHONE_DISPLAY`, pero la interfaz actual no muestra el teléfono.
- `NEXT_PUBLIC_*` se incrusta en el HTML. Cambiar esas variables exige un build
  nuevo, no solo reiniciar la app.
- Datos aún marcadores: correo y dirección en `src/content/agency.ts`; URLs de
  Facebook, Instagram y LinkedIn; páginas legales del footer.
- Todas las noticias actuales son ejemplos. No inventar métricas, clientes,
  testimonios, precios, plazos ni resultados. Ver `PRODUCT.md` antes de tocar
  afirmaciones comerciales.

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
