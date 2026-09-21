# AGENTS.md — AFCRtecnologia

Landing page corporativa de AFCRtecnologia (agencia de IA, Lima, Perú).
Una sola página de 9 capítulos, estética editorial tecnológica, sin CMS.

Este archivo es la **fuente canónica** de contexto para cualquier agente
(Claude Code, Codex, Cursor…). `CLAUDE.md` lo importa en vez de duplicarlo.

---

## Comandos

```bash
npm run dev             # desarrollo
npm run build           # build de producción para servidor Node (incluye /api/contact)
npm run start           # sirve ese build
npm run build:static    # export estático para hosting compartido → out/
npm run package:static  # build estático + ZIP listo para subir a Hostinger
npm run lint            # ESLint — incluye reglas del React Compiler (son ERRORES)
npm run typecheck       # tsc --noEmit
```

**Antes de dar por terminado un cambio:** `npm run typecheck && npm run lint && npm run build`.
Los tres deben pasar limpios. El lint no es opcional: las reglas
`react-hooks/*` del React Compiler fallan el comando, no solo avisan.

---

## Stack (versiones verificadas en este repo)

| Paquete | Versión | Nota |
| --- | --- | --- |
| next | 16.3.5 | App Router + Turbopack |
| react / react-dom | 19.3.0 | React Compiler activo vía lint |
| tailwindcss | 4.3.3 | **CSS-first** |
| motion | 13.4.0 | reexporta `framer-motion`; se importa de `motion/react` |
| three | 0.186.0 | sin `@react-three/fiber` |
| lenis | 1.3.26 | scroll suave |
| zod | 4.6.5 | validación cliente + servidor |
| react-hook-form | 7.88.0 | con `@hookform/resolvers` 5.9.1 |
| lucide-react | 1.47.0 | iconos |
| typescript | 5.9.3 | estricto |

Node 22 · npm. No mezclar con pnpm aunque esté instalado en la máquina.

---

## Decisiones de arquitectura (no revertir sin motivo)

1. **No existe `tailwind.config.ts` y no debe crearse.** Tailwind v4 es
   CSS-first: los tokens viven en el bloque `@theme` de `src/app/globals.css`
   y generan las utilidades (`bg-bg-primary`, `text-accent-cyan`,
   `border-border-editorial`, `py-chapter`, `text-display`…).
2. **Three.js plano, sin React Three Fiber.** Menos dependencias y control
   directo del shader GLSL. `WebGLHeroBackground` se carga con
   `next/dynamic` + `ssr: false`: Three **no debe entrar al bundle inicial**.
3. **Todo el copy vive en `src/content/*.ts`.** Ningún texto visible se
   escribe dentro de un componente. Los tipos están en `src/types/index.ts`.
4. **Idioma:** identificadores y nombres de archivo en inglés
   (`01-Hero.tsx`, `caseStudies`); comentarios, copy y `aria-label` en español.
5. **Geometría editorial:** bordes de 1px `#243049`, `rounded-none`/`rounded-xs`,
   sin sombras. La jerarquía se construye con opacidad y luminancia cian.

---

## Dos objetivos de compilación

El sitio se publica en **Hostinger hosting compartido**, que no ejecuta Node.
Por eso hay dos modos, controlados por `BUILD_TARGET` en `next.config.ts`:

| | `npm run build` | `npm run build:static` |
| --- | --- | --- |
| Salida | servidor Node (`.next`) | estático (`out/`) |
| Formulario | `/api/contact` (route handler) | `/contact.php` |
| Cabeceras | `headers()` de `next.config.ts` | `public/.htaccess` |
| Uso | Vercel / VPS | **producción actual** |

Reglas que lo sostienen — no deshacerlas:

- **El route handler se llama `src/app/api/contact/route.node.ts`, no `route.ts`.**
  `pageExtensions` solo incluye `node.ts` fuera del modo estático, así queda
  excluido del export (Next no admite handlers dinámicos con `output: 'export'`).
  Si se renombra a `route.ts`, **el build estático falla**.
- `robots.ts` y `sitemap.ts` exportan `dynamic = 'force-static'`. Sin eso el
  export falla porque `new Date()` los vuelve dinámicos.
- `headers()` no puede coexistir con `output: 'export'`: por eso el bloque va
  en un spread condicional.
- El endpoint del formulario se lee de `NEXT_PUBLIC_CONTACT_ENDPOINT`
  (por defecto `/api/contact`); el script estático lo fija a `/contact.php`.

### Despliegue real: Hostinger + Git (producción)

El plan es **Hostinger Business**, que sí ejecuta Node: la app se publica como
aplicación Next.js (`app_type: next`, salida `.next`), **no** como export
estático. El formulario usa por tanto `/api/contact`, y `contact.php` queda
como alternativa documentada por si se migra a un plan sin Node.

| Dato | Valor |
| --- | --- |
| Sitio | `afcrtecnologia.com` (vhost addon) |
| Usuario hosting | `u574572243` |
| Repo | `abraham-development/AFCRtecnologia`, rama `main` |
| Build script | `build:hostinger` |
| Output | `.next` · Root: `/` · Node 24 · npm |

- **⚠ La configuración debe ser `next.config.mjs`, nunca `.ts`.** El contenedor
  de build de Hostinger tiene una glibc antigua: `@next/swc-linux-x64-gnu` no
  carga (`GLIBC_2.29 not found`), Next cae al fallback WASM y ese fallback no
  transpila configs en TypeScript. El build muere con «Failed to load
  next.config.ts». Verificado en un build real.
- **⚠ El builder de Hostinger no soporta Turbopack.** `npm run build` (Next 16
  lo usa por defecto) falla allí. Por eso existe
  `build:hostinger` = `next build --webpack`, que es el script que Hostinger
  ejecuta. Verificado: el mismo problema obligó a `--webpack` en el proyecto
  hermano `creciendo_juntos`.
- El otro sitio del plan, `magenta-flamingo-697303.hostingersite.com`, es de
  **creciendo_juntos**. No tocarlo: desplegar AFCR ahí lo borraría.

### ⚠ Acoplamiento a vigilar

**`public/contact.php` duplica las reglas de `src/lib/validations.ts`.**
Si cambias el esquema Zod (campos, longitudes, mensajes de error), hay que
actualizar el PHP en el mismo commit o la validación de cliente y servidor
dejarán de coincidir en producción. El PHP devuelve el mismo JSON
(`{ ok, message, fieldErrors }`) y los mismos códigos 200/400/405/429/500.

No hay PHP instalado en esta máquina. Para comprobar la sintaxis sin Docker:
`npm i php-parser` en un directorio temporal y parsear el archivo.

---

## Trampas ya pisadas (verificadas en navegador — no repetirlas)

### Tailwind v4
- **`scale-*` y `translate-*` usan las propiedades CSS `scale`/`translate`, no
  `transform`.** Si un elemento lleva una utilidad `scale-*` de Tailwind y
  además un `transform: translate3d(...)` por JS, la escala **multiplica** esa
  traslación y el elemento se descoloca. Solución usada en `CustomCursor`:
  wrapper con el `transform` (posición) + hijo con las utilidades (forma).
- **Una `@utility` propia nunca debe declarar `position`.** La utilidad `noise`
  tenía `position: relative` y ganaba en la cascada a `absolute` del mismo
  elemento: sacó el fondo WebGL del flujo y empujó todo el hero fuera de
  pantalla. `noise` hoy solo pinta el grano en `::after` y exige que el
  consumidor ya esté posicionado.

### Canvas 2D
- **Canvas ignora `letter-spacing` del CSS.** Hay que copiarlo con
  `ctx.letterSpacing = getComputedStyle(el).letterSpacing` en el contexto de
  medición y en el de dibujo, o el trazado sale más ancho que el texto del DOM.
- **El reset global `canvas { max-width: 100% }` comprime lienzos dimensionados
  por JS.** Todo canvas con ancho calculado necesita `max-w-none`.
- Para calzar con el DOM se usa `fontBoundingBoxAscent/Descent` y el
  medio-interlineado `(lineHeight - (asc + desc)) / 2`, no las métricas de tinta.

### React 19 / React Compiler (Next 16)
- Prohibido `setState` **síncrono** dentro de un efecto. Patrones usados:
  `useSyncExternalStore` (estado del preloader en `01-Hero`), o diferirlo a
  `requestAnimationFrame` (`Preloader`), o eliminar el estado y escribir un
  `dataset` por ref (`WebGLHeroBackground`).
- Prohibido escribir un ref durante el render → sincronizarlo en un efecto.
- Prohibidas las llamadas impuras (`Date.now()`, `Math.random()`) en el cuerpo
  del componente → helper a nivel de módulo (ver `createToast` en `09-Contact`).
- RHF: usar `useWatch({ control, name })`, no `watch()` (el compilador no puede
  memoizar la función que devuelve).

### Zod + React Hook Form
- El esquema de `src/lib/validations.ts` **no debe usar `.transform()`**: haría
  divergir el tipo de entrada del de salida y rompería el tipado del resolver.
  Las normalizaciones (p. ej. minúsculas del correo) se hacen en el route handler.

### ESLint
- `eslint.config.mjs` ignora `.agents/`, `.claude/`, `.codex/`, `.cursor/` e
  `.impeccable/`: son herramientas del entorno, no código de la landing.
  Sin esos ignores aparecen ~280 avisos falsos.

---

## Invariantes que no se deben romper

**Accesibilidad**
- El recorrido sticky del Método (desktop) es decorativo → `aria-hidden`.
  La lista completa de las 7 etapas existe siempre y pasa a `lg:sr-only`:
  si se cambia a `lg:hidden`, los lectores de pantalla pierden la sección.
- Todo control interactivo lleva `aria-label` descriptivo; el foco visible es
  el contorno cian de `:focus-visible` definido en `globals.css`.
- Contrastes verificados sobre `#0D1828`: `text-secondary` 7.4:1, cian 8.6:1.

**Rendimiento**
- Canvas y WebGL se pausan con `document.hidden` y con `IntersectionObserver`.
- `WebGLHeroBackground` degrada solo: apaga la niebla y luego reduce partículas
  si no sostiene ~40 FPS. No quitar esa lógica.
- `prefers-reduced-motion` desactiva Lenis, cursor, partículas y preloader.
- Nada debe superar `100vw`: los contenedores usan `overflow-x: clip` (no
  `hidden`, que rompería `position: sticky`).

**Atajos de teclado**
- `E` → contacto + foco en `#contact-name`; `S` → soluciones. Nunca se disparan
  dentro de input, textarea, select o `contenteditable`
  (ver `src/hooks/useKeyboardShortcut.ts`).

---

## Datos marcador (NO son reales)

Antes de publicar hay que reemplazar:
- `src/content/agency.ts` → WhatsApp `51987654321`, `contacto@afcrtecnologia.com`,
  `+51 987 654 321`, dirección y redes.
- `src/content/cases.ts` → todas las métricas (+64 %, 96.8 %, 71 %…) son
  ilustrativas. No presentarlas como resultados reales.
- `src/content/agency.ts` → métricas de la sección 07 (15+, 99.4 %, 350+, 4.2x).

Un agente no debe inventar métricas nuevas ni convertir estos marcadores en
afirmaciones verificadas.

---

## Entrega de leads

`POST /api/contact` (Zod + honeypot + rate limit de 5/min por IP en memoria).
Sin variables de entorno el lead solo queda en el log. Con
`CONTACT_WEBHOOK_URL` se reenvía como JSON; con `RESEND_API_KEY` +
`CONTACT_FROM_EMAIL` se envía por correo. El rate limit es por instancia:
para multi-región hace falta Redis/KV.
