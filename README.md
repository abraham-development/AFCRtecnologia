# AFCRtecnologia — Landing page

Landing page corporativa de **AFCRtecnologia**, agencia boutique de inteligencia
artificial y automatización avanzada con base en Lima, Perú.

Estética editorial tecnológica: fondo azul medianoche, acento cian, contraste
tipográfico radical (serif de gran formato + microtipografía monoespaciada),
WebGL atmosférico, microinteracciones magnéticas y atajos de teclado operativos.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Lenguaje | TypeScript en modo estricto |
| Estilos | Tailwind CSS v4 (tokens CSS-first en `globals.css`) |
| Animación | Motion (`motion/react`) + Lucide React |
| WebGL | Three.js con shaders GLSL propios (sin R3F: menos peso, control total) |
| Scroll suave | Lenis |
| Formularios | React Hook Form + Zod + Route Handler |

> **Nota sobre Tailwind v4:** ya no existe `tailwind.config.ts`. Los tokens de
> diseño viven en el bloque `@theme` de `src/app/globals.css` y generan las
> utilidades (`bg-bg-primary`, `text-accent-cyan`, `border-border-editorial`…).

---

## Arranque

```bash
npm install
cp .env.example .env.local     # opcional
npm run dev                    # http://localhost:3000
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint (incluye reglas del React Compiler) |
| `npm run typecheck` | `tsc --noEmit` |

---

## Qué editar primero

1. **`src/content/agency.ts`** — WhatsApp, correo, teléfono, dirección, redes y
   textos legales. **Los datos actuales son marcadores: reemplázalos.**
2. **`src/content/cases.ts`** — sustituye las métricas por resultados
   verificables de tus propios proyectos antes de publicar.
3. **`.env.local`** — `NEXT_PUBLIC_SITE_URL` y el destino de los leads.
4. **`src/app/globals.css`** — paleta y tipografía, si cambias la identidad.

### Paleta

| Token | Valor | Uso |
| --- | --- | --- |
| `bg-primary` | `#0D1828` | Fondo base |
| `bg-secondary` | `#101B2D` | Superficies elevadas |
| `bg-darkest` | `#080F1C` | Contraste absoluto (menú, footer, preloader) |
| `text-primary` | `#E8E5DD` | Texto principal |
| `text-secondary` | `#9DA8B8` | Texto de apoyo (7.4:1 → AAA) |
| `accent-cyan` | `#5BC2D8` | Acento (8.6:1 → AAA) |
| `border-editorial` | `#243049` | Líneas de 1px |

---

## Arquitectura

```
src/
├── app/                     layout, page, globals.css, robots, sitemap, icon
│   └── api/contact/route.ts endpoint del formulario (Zod + rate limit)
├── components/
│   ├── layout/              Header, Footer, FullscreenMenu, SmoothScrollProvider
│   ├── effects/             Preloader, CustomCursor, WebGLHeroBackground,
│   │                        ParticleText, ReadingProgress
│   ├── sections/            01-Hero … 09-Contact
│   └── ui/                  ButtonMagnetic, SectionBadge, KeyBadge,
│                            HorizontalMarquee, Toast
├── content/                 todo el copy y los datos (sin texto en los componentes)
├── hooks/                   useKeyboardShortcut, useScrollProgress,
│                            useMediaQuery, useMousePosition
├── lib/                     utils (scroll, lerp, WebGL) y validations (Zod)
└── types/                   contratos de datos
```

### Capítulos

`01` Hero · `02` Soluciones · `03` Método · `04` Casos de uso · `05` Servicios
`06` Capacidades · `07` Agencia · `08` Recursos · `09` Contacto

---

## Recepción de leads

`POST /api/contact` valida con Zod y devuelve `200 / 400 / 405 / 429 / 500`.
Incluye honeypot anti-spam y limitación de 5 solicitudes por minuto por IP.

Sin variables de entorno, el lead se registra en el log del servidor. Con ellas:

- `CONTACT_WEBHOOK_URL` → envía el lead como JSON (n8n, Make, Zapier, Slack).
- `RESEND_API_KEY` + `CONTACT_FROM_EMAIL` → envía el correo vía Resend
  (con `reply_to` apuntando al contacto).

> El rate limit vive en memoria de la instancia. Para despliegues multi-región
> usa Upstash Redis o Vercel KV.

---

## Interacciones

- **Atajos:** `E` salta al formulario y enfoca el primer campo, `S` a Soluciones.
  Nunca se disparan dentro de un input, textarea, select o `contenteditable`.
- **Preloader:** cuenta 00→100 en 1.4 s y se abre con máscara vertical. Solo
  en la primera visita de la sesión (`sessionStorage`).
- **Cursor:** punto de 4px + anillo cian con amortiguación `lerp 0.15`; se
  expande a 64px con `mix-blend-difference` sobre elementos interactivos.
  Solo con `pointer: fine`.
- **Hero:** «que trabaja.» se dibuja con ~5 000 partículas muestreadas del texto
  real (respeta `letter-spacing` y la línea base del DOM), con repulsión al
  cursor y reagrupación elástica. El texto real sigue en el DOM para lectores
  de pantalla y como respaldo visual.

---

## Rendimiento

- Three.js se carga con `next/dynamic` + `ssr: false`: **no entra en el bundle
  inicial** (chunk aparte de ~528 KB, solo bajo demanda).
- El canvas se pausa con `document.hidden` y fuera del viewport, y **degrada su
  calidad solo** si no sostiene 40 FPS (primero apaga la niebla, luego reduce
  partículas a la mitad).
- Si WebGL falla o no está disponible, queda el degradado CSS + grano SVG.
- `prefers-reduced-motion` desactiva Lenis, el cursor, las partículas y el
  preloader.
- Medido en el build actual: **CSS 10 KB gzip**, JS inicial ~310 KB gzip
  (más 38 KB de polyfills que los navegadores modernos ignoran con `noModule`).
  Si necesitas bajarlo: `LazyMotion` de Motion, `zod/mini` en el cliente o
  validación nativa de React Hook Form.

---

## Accesibilidad

- Marcado semántico, `aria-label` en controles, `aria-live` en el panel de casos
  y en los estados del formulario.
- Foco visible en cian (`:focus-visible`) y enlace «Saltar al contenido».
- El recorrido sticky del Método es decorativo (`aria-hidden`); la lista
  completa de las 7 etapas queda disponible para lectores de pantalla.
- Contraste verificado: texto de apoyo 7.4:1 y acento cian 8.6:1 sobre el fondo.

---

## Despliegue

El proyecto compila de dos formas. La producción actual es la primera.

### A) Hostinger — hosting compartido (hPanel)

Hostinger compartido no ejecuta Node, así que se publica como **export
estático** y el formulario lo atiende un endpoint **PHP**.

```bash
# 1. Pon tu dominio real (afecta canonical, robots y sitemap)
echo "NEXT_PUBLIC_SITE_URL=https://tudominio.com" >> .env.local

# 2. Genera el paquete
npm run package:static      # → out/ + afcrtecnologia-hostinger.zip
```

En hPanel → **Sitios web → Administrador de archivos**:

1. Entra en `public_html` y **vacíala** (borra el `default.php` o el
   `index.html` de bienvenida que trae Hostinger).
2. Sube `afcrtecnologia-hostinger.zip` y usa **Extraer**.
3. Comprueba que en la raíz de `public_html` quedan `index.html`,
   `contact.php`, `.htaccess` y la carpeta `_next`. Si el ZIP creó una
   subcarpeta, mueve su contenido a la raíz.
   > El Administrador de archivos oculta los archivos que empiezan por punto:
   > activa **Configuración → Mostrar archivos ocultos** para ver `.htaccess`.
4. Abre `public_html/contact.php` con el editor y ajusta el bloque de
   configuración del principio: `DESTINO`, `REMITENTE` (debe ser una cuenta de
   tu dominio, creada en hPanel → Correos) y, si quieres, `WEBHOOK_URL`.
5. hPanel → **SSL** → activa el certificado y **Forzar HTTPS**.

Comprobación rápida desde tu terminal:

```bash
curl -I https://tudominio.com                       # 200 + cabeceras de .htaccess
curl -X POST https://tudominio.com/contact.php \
  -H 'Content-Type: application/json' \
  -d '{"name":"Prueba","company":"Test","email":"tu@correo.com","message":"Mensaje de prueba con mas de veinte caracteres."}'
# → {"ok":true,"message":"Solicitud recibida..."}
```

Cada lead se guarda además en `afcr-leads.jsonl`, **un nivel por encima de
public_html** (no es accesible desde la web), para que ningún contacto se
pierda si `mail()` falla.

**Para actualizar el sitio:** `npm run package:static` y vuelve a subir. Basta
con reemplazar `index.html` y la carpeta `_next`; `contact.php` conserva tu
configuración si no lo sobrescribes.

### B) Servidor Node (Vercel o VPS)

```bash
npm run build && npm run start
```

Incluye `/api/contact` (el route handler de `route.node.ts`) y las cabeceras de
seguridad desde `next.config.ts`. En Vercel basta con importar el repositorio.
