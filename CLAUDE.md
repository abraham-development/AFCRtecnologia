# CLAUDE.md

Contexto del proyecto, comandos, decisiones de arquitectura y trampas ya
verificadas: están en AGENTS.md, que es la fuente canónica compartida con los
demás agentes del repo. Se importa aquí para no duplicar (ni desincronizar).

@AGENTS.md

---

## Cómo trabajar en este repo

- **Lee `src/content/*.ts` antes de tocar una sección.** Los componentes solo
  maquetan; el copy y los datos viven ahí.
- **Un cambio no está terminado hasta que pasan los tres:**
  `npm run typecheck && npm run lint && npm run build`.
- Al añadir una utilidad nueva a `globals.css`, compruébala de verdad antes de
  usarla en 12 sitios: Tailwind v4 no avisa de clases inexistentes, simplemente
  no genera CSS. Sirve un `postcss` puntual con `@source` apuntando a un HTML
  de prueba y un `grep` del selector en la salida.

## Verificación visual (sin Puppeteer)

Esta máquina tiene `/usr/bin/google-chrome` pero **no** Puppeteer ni Playwright.
No hacen falta: Node 22 trae `WebSocket` global, así que se habla CDP directo.

```bash
google-chrome --headless=new --remote-debugging-port=9222 --no-sandbox \
  --enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader \
  --hide-scrollbars --user-data-dir=<scratchpad>/chrome-profile about:blank &
```

`--use-angle=swiftshader` es imprescindible: sin él no hay WebGL en headless y
el hero cae al degradado de respaldo, lo que da un falso negativo.

Desde Node: `GET http://localhost:9222/json/list` → `webSocketDebuggerUrl` →
`Page.navigate`, `Runtime.evaluate`, `Page.captureScreenshot`. Los scripts de
sondeo van al **scratchpad**, nunca al repo.

**Qué comprobar siempre** (todo esto detectó bugs reales aquí):
1. `document.documentElement.scrollWidth - clientWidth === 0` en 1440×900 y
   390×844, **y también después de hacer scroll**.
2. Rects de los hijos de `#hero`: el fondo WebGL debe medir exactamente el alto
   de la sección. Si mide menos y la sección crece, algo lo sacó del flujo.
3. `Log.entryAdded` + `Runtime.exceptionThrown`: la consola debe quedar vacía.
4. Partículas del hero: comparar la caja de tinta del canvas
   (`getImageData` → bbox de alfa) con el `getBoundingClientRect()` del texto
   del DOM. Deben coincidir dentro de unos pocos píxeles.
5. Mirar las capturas. El HTML puede ser correcto y la página verse rota: el
   bug del hero invisible solo se vio en la imagen.

Al terminar: matar Chrome y el servidor de pruebas.

## Cosas que NO debes hacer aquí

- Crear `tailwind.config.ts` "porque falta" (ver AGENTS.md).
- Renombrar `route.node.ts` a `route.ts` "para arreglarlo": rompe el build
  estático, que es el que va a producción.
- Cambiar el esquema de `src/lib/validations.ts` sin actualizar
  `public/contact.php` en el mismo commit.
- Reintroducir `@react-three/fiber` / `@react-three/drei`.
- Silenciar reglas de `react-hooks/*` con `eslint-disable` en vez de corregir
  el patrón; hay una solución idiomática para cada caso en el repo.
- Importar Three.js de forma estática en un componente de servidor o cliente
  que entre al bundle inicial.
- Tratar los datos marcador de `agency.ts` y `cases.ts` como cifras reales.
- Hacer commits o `git push` sin que te lo pidan. El repo tiene un `.git`
  inicializado en rama `main` y **sin ningún commit todavía**.
