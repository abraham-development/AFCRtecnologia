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

Un hilo nuevo no ve los chats anteriores. Cursor inyecta este archivo al
empezar: es la única memoria que cruza sesiones. No buscar el contexto en
transcripciones, en `CLAUDE.md` ni en el hilo previo. `PRODUCT.md` guarda la
verdad de producto; este archivo guarda cómo está hecho el sitio y qué no
debe reintroducirse.

La memoria es el texto vigente de cada sección, no un historial. Otro hilo
solo acierta si la frase que leería sigue siendo cierta.

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

Si el hilo cambió una decisión, una trampa, una ruta, el build o cualquier
frase que otro hilo repetiría mal, sustituir esa frase en la sección dueña,
dentro del mismo cambio. Hacerlo aunque el usuario no lo pida. No añadir una
bitácora, un diario de tareas ni un resumen de la sesión.

Entra aquí solo esto:

- Decisiones explícitas del usuario sobre copy visible, logo, navegación,
  contacto y qué no debe reintroducirse.
- Arquitectura, invariantes, trampas ya verificadas y el procedimiento de
  build o despliegue.
- La fecha de «Estado estable actual» solo cuando ese bloque entero se
  recontrasta con el código. Un hecho nuevo dentro del bloque lleva su propia
  fecha («pedido del usuario, YYYY-MM-DD») y no mueve la del encabezado.

No guardar secretos, valores de `.env*`, teléfonos, tokens, PIDs, URLs de
preview temporales ni si un servidor local sigue encendido.

`.agents/`, `.claude/`, `.codex/`, `.cursor/`, `.impeccable/` y
`skills-lock.json` son artefactos de herramientas. No agregarlos a commits de
producto salvo petición explícita.

### Dónde anotar cada recuerdo

Sustituir la frase vigente en una sola sección. No copiarla en otra.

| Si otro hilo lo repetiría mal | Sección dueña |
| --- | --- |
| Copy, logo, navegación, contacto, layout pedido y qué no reintroducir | Estado estable actual |
| Rutas y qué renderiza cada página | Mapa del sitio |
| Dónde vive el código | Mapa de código |
| Versiones y comandos | Comandos y stack |
| Build, Hostinger y export estático | Compilación y despliegue |
| Variables y datos sensibles | Variables, datos y seguridad |
| Accesibilidad, rendimiento y teclado | Invariantes de accesibilidad y rendimiento |
| Bug o límite ya comprobado | Trampas verificadas |
| Audiencias, servicios y afirmaciones comerciales | `PRODUCT.md` |

### Antes de entregar

1. Dejar ya sustituida, en la sección dueña, cualquier frase que este hilo
   haya dejado de hacer cierta.
2. Ejecutar `npm run typecheck && npm run lint && npm run build`.
3. Si el cambio se desplegará en Hostinger, ejecutar además la simulación de
   producción descrita en «Despliegue».
4. Revisar `git diff --check` y `git status --short`.
5. Informar con claridad qué quedó local, qué se confirmó visualmente y si hubo
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
  `public/brand/afcr-logotipo-plateado.png` no se muestra. El header conserva el CTA a WhatsApp —solo si existe la variable— en el
  navbar, a la derecha. En el topbar, a la derecha, van «Iniciar sesión» y
  «Crear una nueva cuenta» (`/iniciar-sesion` y `/crear-cuenta`); bajo `sm` bajan
  a una segunda fila porque no caben junto al logo y la hamburguesa. La
  hamburguesa de tres líneas solo aparece en celular
  (bajo `lg`) y cuando la barra no cabe por poca altura (`short`); en laptop
  y escritorio desaparece. La frase «ONLINE - LATAM & GLOBAL» se
  eliminó intencionalmente y no debe reintroducirse.
- El header de dos niveles tiene un solo fondo, propio y constante (no
  transparente sobre el hero): token `--color-bg-header` (`#1a2539`, pizarra
  algo más clara que el hero, pedido del usuario) al 95 % con grano y blur en
  todo el `<header>`. La placa del logotipo conserva su propio fondo oscuro. El navbar no lleva fondo propio (el usuario pidió un único color);
  solo lo delimitan sus líneas `border-editorial` superior e inferior. La
  página activa se marca con un contorno cian alrededor de su nombre, sin
  subrayado.
- El texto del CTA del header es «Contacta con un asesor por WhatsApp» y abre
  `wa.me` en una pestaña nueva. Vive en el navbar, alineado a la derecha.
  La estructura del menú fullscreen no se altera al retocar la hamburguesa;
  sus ítems salen de `navItems`, igual que el navbar y el footer. Al pie del
  menú se repiten «Iniciar sesión» y «Crear una nueva cuenta», porque la
  cortina tapa el topbar.
- En el hero, el botón principal dice «Empieza un proyecto con nosotros» y el
  secundario «Ver Servicios». No hay atajos de una sola letra: el usuario los
  retiró porque una pulsación accidental cambiaba de página.
- Ambos botones viven en `HeroActionCard` (pedido del usuario, 2026-10-03),
  con «Empecemos» y «Cuéntanos qué quieres resolver.» encima: desde `lg` es
  la columna derecha del hero (21rem; 25rem desde `xl`, para que el titular no
  se parta en 4 líneas a 1024); debajo, va bajo la bajada. Por su contorno
  corren en loop dos haces de luz tipo cometa (cian→verde y coral→ámbar, con
  cabeza casi blanca) sobre un borde base cian tenue, más su halo difuso.
  Ritmo pedido por el usuario (2026-10-03): una vuelta cada 8,31 s y
  respiración del halo de 4,42 s, igual en la card del hero y en Servicios.
  Un conic-gradient con todos los colores a la vez se leía como borde arcoíris
  quieto: el usuario no veía movimiento. CSS puro en `globals.css`
  (`.glow-card-*`, `@property --glow-angle`); la superficie es opaca para que
  el halo no manche los botones. Corre siempre que
  la card se ve —también en celular, donde no hay hover—, se pausa fuera de
  pantalla o con la pestaña oculta y queda fijo con movimiento reducido. El
  gradiente se declara en cada capa: `--glow-angle` no se hereda.
- El footer compartido comienza con el directorio del sitio y termina en la
  barra legal. La franja «¿Prefieres conversar?» se retiró por decisión del
  usuario; WhatsApp y correo siguen disponibles en la columna de contacto.
- En Servicios, las cuatro categorías principales forman un índice vertical:
  una categoría por fila a cualquier ancho. No volver a presentarlas en grilla
  ni añadir conteos junto a sus nombres.
- La categoría activa del índice lleva la luz de Home (pedido del usuario,
  2026-10-03): mismos dos cometas y colores, con fondo opaco `bg-bg-darkest`
  (no volver a `bg-accent-cyan-glow`). Al seleccionarla, la luz se enciende:
  los cometas salen disparados, destellan y se asientan en 0,9 s (el usuario
  pidió no alargarlo), y luego corren en loop al ritmo de la card del hero. Se hace con
  `GlowBeams` (`src/components/ui/`, SVG con `pathLength` y `--beam-t`), no
  con conic-gradient. Trampa verificada: en una fila tan apaisada el giro por
  ángulo se arrastra por el centro de los lados largos y se dispara en los
  extremos; por perímetro la velocidad es constante. El halo va con `-z-10`
  dentro del `nav` `isolate`: si no, pinta sobre las filas vecinas. La pausa
  por visibilidad es `useGlowPause` (`src/hooks/`), compartida con la card
  del hero.
- En Nosotros, la franja de herramientas (marquesina) es la segunda sección,
  justo bajo la cabecera (pedido del usuario, 2026-10-03). Sus dos líneas
  divisorias llevan los colores de la luz de Home como degradado fijo
  (`.glow-divider`: cian → verde → ámbar → coral). Sin cometas: se probaron
  en ambos sentidos y a la velocidad de la marquesina, y el usuario los
  retiró porque mareaban y tapaban las herramientas. No reintroducirlos. La
  línea inferior hace de divisor: el contenido que sigue no lleva `hairline-t`.
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
- Noticias y el MCP del sitio eliminados por decisión del usuario (2026-09-29): no existen
  `/noticias/*` ni `/api/mcp`, y los tokens
  `afcr_…` quedaron revocados en `agent_tokens`. No reintroducir noticias ni
  el MCP sin pedido.
- El contenido corporativo sigue siendo estático. A pedido del usuario,
  las cuentas de la tienda usan Supabase Auth con `@supabase/supabase-js`.
  El cliente vive en `src/lib/auth/`; las pantallas incluyen registro con
  contraseña y ojito, confirmación y recuperación con código de 6 dígitos,
  callback OAuth con PKCE y cuenta. La sesión es de cliente, sin cookies SSR:
  `/cuenta` no entrega datos privados desde Next ni sustituye autorización
  mediante RLS o controles de servidor. Se conserva el export estático.
  SMTP de Hostinger y las cinco plantillas de confirmación, recuperación,
  acceso, cambio de correo y reautenticación se configuran por la CLI con
  `npm run auth:configure`: `--check`, `--diff`, `--apply` y `--verify`.
  El script carga `.env.local` con el parser de Next, genera un fragmento
  temporal solo de Auth, oculta secretos y conserva ajustes no declarados.
  La autenticación del buzón SMTP está verificada por TLS también desde Edge;
  eso no prueba la recepción de los mensajes enviados por Supabase.
  Supabase está configurado para OTP de 6 dígitos con vencimiento de 600 s
  y contraseñas de al menos 12 caracteres, con mayúsculas, minúsculas y números.
  Google OAuth está habilitado: se verificó que Auth redirige a Google con
  el cliente configurado y el callback correcto para el sitio y localhost.
  Falta probar un acceso completo con una cuenta de Google y la entrega real
  de correo antes de validar el flujo completo. La exclusividad entre Google
  y contraseña está aplicada mediante `afcr_private.enforce_auth_method`,
  un hook SQL `security invoker` de emisión de tokens. El método inicial se
  registra al insertar `auth.users`; no deriva de `user_metadata`. Las tablas
  privadas tienen RLS y ningún permiso para `anon` ni `authenticated`.
  `/cuenta` permite el cambio explícito con un OTP de 6 dígitos: vence en
  600 s, admite cinco intentos y seis envíos por hora, con 60 s entre envíos.
  `auth-method` valida el usuario, sesión y revisión antes de operar; su RPC
  es exclusiva de `service_role`. Guarda HMAC del código, nunca el código.
  Al pasar a Google se exige una identidad Google verificada con el mismo
  correo; el hook cambia el método solo después del OTP y OAuth exitosos.
  Al pasar a contraseña, una reserva impide escrituras simultáneas; el método
  anterior sigue activo hasta que la API administrativa guarda la contraseña.
  Esa API revoca todas las sesiones antes de retornar: la finalización solo
  admite la reserva y prueba verificadas de la solicitud, sin exigir la sesión
  ya revocada. La revisión invalida los refresh y operaciones de sesiones viejas;
  los futuros datos privados deben comprobar sesión y revisión además de `auth.uid()`.
  Auth identifica como `otp` tanto signup como recovery por código: se admite
  en cuentas de contraseña y se rechaza en cuentas Google. La recuperación
  nunca cambia el método de una cuenta Google.
  `npm run auth:deploy-method` publica la función y el secreto SMTP desde un
  workdir nuevo; un deploy de la CLI desde el workdir original devolvió éxito
  conservando un bundle anterior. Verificar siempre los archivos remotos y
  probar el endpoint, no solo el resultado de deploy. El secreto de correo
  está en Edge, separado de las variables públicas del build de Hostinger.
  Se verificaron registro/recuperación OTP, permisos y conexión SMTP reales,
  y el cambio real a contraseña con el estado inicial Google simulado.
  `supabase/tests/auth_methods.sql` verifica la exclusividad y límites con
  fixtures descartables dentro de una transacción; no enviar correos de prueba.
  Las migraciones de Auth locales coinciden con las versiones remotas; la
  migración antigua de noticias solo existe en el historial remoto, así que
  no ejecutar `db push` ignorando ese desfase ni restaurar noticias como solución.
  Las tablas antiguas
  `news_posts`, `agent_tokens` y el bucket `news-covers` siguen sin uso.
  Codex mantiene una conexión MCP en `.codex/config.toml` limitada al proyecto
  `zuqxtogggkundznzwulg`. La CLI 2.120.0 es una dependencia de desarrollo:
  se ejecuta con `npx supabase`; `supabase/` conserva la configuración local
  generada por `init`, y `.temp/` mantiene el vínculo remoto fuera de Git.
  Trampa de la CLI 2.120.0: `config pull` no incluyó SMTP ni cuerpos de
  plantillas en el archivo recuperado; no usarlo como respaldo completo de Auth.
  No pushear el config local completo con sus valores por defecto a producción;
  usar el script específico de Auth. En la terminal del agente, el login
  interactivo exige `--agent no --output-format text` con TTY.
- La tienda es un ecommerce (pedido del usuario, 2026-10-06): sidebar con solo
  «MiniPcs» y «Cámaras de seguridad», cards de productos a la derecha y categorías
  apiladas en celular. `products` en Supabase es la fuente de precio y stock;
  empieza vacío hasta recibir catálogo, fotografías y precios reales. No publicar
  productos de muestra. `src/content/store.ts` centraliza el copy.
  El carrito usa Zustand 5.0.15 y localStorage (`afcr-store-cart-v1`), con
  hidratación explícita para evitar divergencias SSR. `/carrito` y el drawer
  llevan a `/checkout` sin exigir login. Auth no limpia el carrito.
  `/checkout` resuelve la sesión antes de mostrar gate o stepper. El gate reutiliza
  `AuthForm` con `onSuccess`, nombres/apellidos y tabs; el login continúa sin
  navegar. Registro con sesión inmediata continúa; sin ella guarda correo
  pendiente en sessionStorage y abre `/verificar?next=/checkout`. OTP, recuperación
  y OAuth admiten retorno exclusivamente a `/checkout` o `/admin` (sin redirect libre).
  El stepper es datos → envío → pago → confirmación, sin cobro online. Lima/Callao
  exige uno de los 50 distritos metropolitanos, calle y referencia; provincias
  usa selector de departamento y un punto Urbano real. El catálogo publicado se
  carga por `store_pickup_points`; el servidor lo consulta y la RPC de pedido
  valida otra vez el punto dentro de la transacción. Sin puntos o ante un error
  no se continúa. La RPC nueva necesita la migración de administración pendiente.
  Ubigeos: `src/data/peru-locations.json`, fuente
  INEI indicada en el archivo contiguo; contiene códigos del censo 2017. Actualizar
  con fuente oficial antes de incorporar puntos en distritos posteriores.
  `/api/orders` (`route.node.ts`, solo Node) exige bearer y `getUser()`, valida
  el body con Zod y normaliza la dirección. La RPC pública es invoker; delega en
  un definer privado que exige `auth.uid()`, sesión existente y revisión del
  método activo. RLS de perfiles, pedidos, ítems y carrito comprueba lo mismo:
  un JWT anterior al cambio de método no obtiene datos privados.
  La RPC inserta perfil/pedido/ítems y borra `cart_items` atómicamente; resuelve
  ubicación en la tabla privada, precios y stock en `products`, y recalcula el
  importe. Un `request_id` por confirmación permite reintentar sin duplicar;
  rechaza reutilizarlo con otro payload. Solo la RPC puede crear pedidos; no
  conceder inserción directa que eluda precios o dirección. Al confirmar, el
  cliente limpia el carrito y conserva el recibo canónico para el resumen.
  `/cuenta/pedidos` muestra solo órdenes propias. El importe confirmado corresponde
  a productos; envío pendiente y cobro posterior se muestran expresamente.
  La política/tarifa de envío todavía necesita respuesta del usuario. No hay
  reserva ni descuento de stock en el remoto mientras la migración de administración
  siga pendiente. Esa migración propone reservar en checkout y reintegrar al cancelar
  o devolver; requiere la aprobación solicitada antes de aplicarse. Los puntos se
  gestionarán en la tabla privada desde el panel; no insertar agencias inventadas.
  `supabase/tests/store_checkout.sql` prueba precios, direcciones, aislamiento,
  idempotencia y revocación dentro de BEGIN/ROLLBACK. También se verificaron
  HTTP 401/400/201 y limpieza del carrito con cuenta/producto/orden descartables,
  eliminados al terminar y sin correos. La revisión de navegador usa datos
  sintéticos y API simulada; no certifica recepción de OTP ni Google real.
  El export estático conserva las pantallas, pero no tiene `/api/orders`:
  el checkout operativo requiere el build Node de Hostinger.
- Administración de ecommerce (pedido del usuario, 2026-10-06): `/admin`, acceso
  desde `/cuenta` solo al recibir `store_is_admin=true`. Implementación local
  preparada; `20261007033005_store_administration.sql` **no aplicada**:
  la revisión automática rechazó los cambios remotos de stock/pedidos/Storage
  pendientes de confirmación del usuario. No desplegar estos cambios de frontend
  antes de aplicar y verificar la migración aprobada. El correo configurado
  todavía no tenía una cuenta al inspeccionarlo; no crear una contraseña por el usuario.
  La migración liga el correo permitido a un UUID solo después de verificarlo,
  en `afcr_private.store_admins`; las consultas vuelven a comprobar sesión,
  revisión, UUID y correo verificado actual. Nunca conceder permisos mediante
  `user_metadata` ni solo escondiendo el enlace.
  Panel: resumen real, productos con SKU/galería/borrador/publicación/archivo,
  inventario y motivos de ajuste, pedidos y pagos manuales, clientes de pedidos,
  puntos Urbano y actividad. Las escrituras pasan por RPC invoker y definer
  privado con comprobación explícita de administrador. Productos/pedidos/puntos
  usan revisión para impedir sobrescrituras; ajustes de stock también idempotencia.
  Las notas internas de pedidos no tienen permiso SELECT para clientes.
  Reserva propuesta: trigger transaccional al insertar ítems, stock disponible
  reducido y movimiento registrado; cancelación/devolución reintegra una sola vez.
  Preparación → reparto/recojo → entrega, con pasos válidos; no hay cobros ni
  reembolsos automáticos. Pago manual exige costo de envío y referencia; registrar
  reembolso exige cancelación/devolución y motivo.
  Fotos: bucket público `store-products`, carga/borrado solo para administrador
  vigente, JPG/PNG/WebP de hasta 5 MB, máximo 8 por ficha. Nombres UUID sin upsert.
  La política de borrado conserva cualquier archivo referenciado por un producto;
  el editor intenta limpiar nuevas cargas no usadas al cerrarse.
  `supabase/tests/store_administration.sql` y pruebas temporales pasaron en
  PostgreSQL local PGlite con adaptadores de Auth/Storage; **no** certifican el
  remoto ni el servicio real de archivos. UI verificada con API/datos sintéticos,
  sin publicar productos, agencias ni métricas de muestra.
- En su lugar, la Home muestra «RECURSOS» (pedido del usuario, 2026-10-01):
  8 artículos, uno por servicio, que explican el problema y la solución y solo
  invitan a contactar en el cierre (promoción indirecta). Temas, en este orden:
  RAG, agente de IA para WhatsApp, automatizaciones, agentes de IA
  personalizados, páginas web, capacitaciones, software a medida y venta de
  dispositivos (mini PC y cámaras de seguridad). El título va al pie del hero,
  entre dos líneas editoriales, en mayúsculas por CSS y con una bajada.
  Debajo, un artículo por fila con la card editorial: portada a la izquierda
  (desde `sm`, alto fijo de 240 px, `h-60`, pedido del usuario; no volver a
  4:3; en celular, entera en 16:9 con `aspect-video`) y
  autor «Equipo de AFCRtecnologia», título, resumen, tema y lectura. **Sin
  fecha** (decisión del usuario: son atemporales). Cada card abre
  `/recursos/[slug]` con el texto completo, «Sigue leyendo» y `CtaBand`.
- El artículo de RAG es texto del usuario (2026-10-01): no reescribirlo sin
  pedido. Su cuerpo usa la sintaxis completa de `ResourceArticle.body`
  (`##`, `###`, `- `, `1. `, tabla con `| ` y `**negrita**`); la tabla se
  muestra apilada por fila en celular y completa desde `sm`.
- Portadas (pedido del usuario, 2026-10-04): serie de 8 renders 3D
  editoriales oscuros, generados con APIMart (`gpt-image-2`, 16:9, 2K).
  Reemplazaron por completo las infografías en papel marfil, incluida la de
  RAG: no volver a infografías ni a láminas claras.
  - Estilo común: navy profundo, vidrio esmerilado y metal oscuro, luz
    volumétrica y acentos de la paleta de los cometas (cian, verde, ámbar,
    coral). **Sin texto, letras, logos ni caras.** El motivo va dentro del
    cuadrado central: desde `sm` la card recorta casi a 1:1.
  - La RAG elegida sirvió de referencia de estilo para las demás. Agentes usa
    otra composición para no repetir la de RAG.
  - Archivos `public/recursos/<tema>-portada-{800,1600,2048}.webp` (q 84) y
    `<tema>-portada-og.jpg` de 1200 px para redes; en el artículo,
    `cover: { name, alt, width, height }` con un `alt` que describe la escena.
    Si una imagen trae alfa, se compone sobre `#0d1828`.
  - `ResourceCover` las enmarca con un marco doble editorial (borde, paspartú
    navy y línea interior) en la card y en el artículo; en el artículo van
    enteras y ya no hay enlace «Ver imagen en tamaño completo».
  - Sin portada, `ResourceCover` muestra la tipográfica (tema en Fraunces,
    recortado, con grano), con el mismo marco. No usar fotos de stock.
  - Para generar más: key en `APIMART_API_KEY` de `.env.local`; scripts y
    candidatas fuera del repo (`~/Proyectos/AFCRtecnologia-portadas-candidatas/`).
    API: `POST https://api.apimart.ai/v1/images/generations` (`model`,
    `prompt`, `size: "16:9"`, `resolution`) devuelve un `task_id`; se consulta
    `GET /v1/tasks/{id}` hasta `completed` y se descarga de
    `data.result.images[0].url[0]`. Las URL caducan en 24–72 h. La red hacia
    APIMart corta a veces (ETIMEDOUT): reintentar la consulta, no la creación.
- Los artículos no inventan clientes, métricas, precios ni plazos.

---

## Mapa del sitio

| Ruta | Contenido | Implementación principal |
| --- | --- | --- |
| `/` | Hero de partículas + Recursos (8 artículos) | `src/components/home/` |
| `/recursos/[slug]` | Artículo completo; `generateStaticParams` en ambos builds | `src/app/recursos/[slug]/page.tsx` · `src/components/resources/` |
| `/servicios` | Directorio de 10 servicios, sin conteo junto a cada categoría | `src/components/services/` |
| `/nosotros` | Cabecera, franja de herramientas, audiencias, proceso, principios | `src/components/about/` |
| `/contacto` | Canales + formulario `#formulario` | `src/components/contact/` |
| `/tienda` | Catálogo: MiniPcs y cámaras de seguridad (pendiente de productos reales) | `src/app/tienda/page.tsx` |
| `/iniciar-sesion` | Entrar a la cuenta de la tienda | `src/app/iniciar-sesion/page.tsx` |
| `/crear-cuenta` | Crear cuenta de la tienda | `src/app/crear-cuenta/page.tsx` |
| `/recuperar-contrasena` | Código de recuperación y nueva contraseña | `src/app/recuperar-contrasena/page.tsx` |
| `/auth/callback` | Retorno de Google; intercambio PKCE en cliente | `src/app/auth/callback/page.tsx` |
| `/cuenta` | Sesión, cambio de método y acceso al historial; sin datos privados renderizados en servidor | `src/app/cuenta/page.tsx` |
| `/carrito` | Carrito persistente en el cliente | `src/app/carrito/page.tsx` |
| `/checkout` | Gate de cuenta y stepper de cuatro pasos | `src/app/checkout/page.tsx` |
| `/verificar` | Confirmación OTP y retorno al checkout | `src/app/verificar/page.tsx` |
| `/cuenta/pedidos` | Historial privado mediante RLS | `src/app/cuenta/pedidos/page.tsx` |
| `/admin` | Administración de ecommerce; migración remota pendiente | `src/app/admin/page.tsx` · `src/components/admin/` |

- Todas las páginas y `sitemap.xml` se prerenderizan. `/api/contact` y
  `/api/orders` solo existen en el build Node.
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
  ESLint, `eslint-config-next` y la CLI de Supabase van en `devDependencies`.
- Antes de pushear un cambio que afecte el build, copiar a un temporal,
  ejecutar `npm install --omit=dev` y después `npm run build:hostinger`.
- No desplegar en `magenta-flamingo-697303.hostingersite.com`: pertenece al
  proyecto `creciendo_juntos` y se sobrescribiría.

### Export estático: solo alternativa

`BUILD_TARGET=static` activa `output: 'export'`, genera `out/`, desactiva el
route handler y usa `/contact.php`. Mantener estas condiciones:

- Lo que exige servidor lleva extensión `.node.ts(x)` (hoy `/api/contact` y `/api/orders`); `pageExtensions` la excluye del modo estático.
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
- Auth añade `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, públicas y necesarias en cada build.
  `.env.local` reserva campos `HOSTINGER_SMTP_*`, `AUTH_EMAIL_*`,
  `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
  `SUPABASE_ACCESS_TOKEN` (opcional si la CLI ya tiene sesión), `AUTH_SITE_URL`
  y `AUTH_REDIRECT_URLS` para configurar
  el servicio remoto. Los secretos de SMTP, Google y Management API son solo
  para herramientas locales: nunca prefijarlos con `NEXT_PUBLIC_` ni
  incorporarlos al cliente. Guardarlos en `.env.local` no configura Auth por sí solo.
- Datos aún marcadores: correo y dirección en `src/content/agency.ts`; URLs de
  Facebook, Instagram y LinkedIn; páginas legales del footer.
- `APIMART_API_KEY` (solo en `.env.local`) sirve para generar las portadas
  de Recursos en local. **No va a Hostinger** y ningún código del sitio la
  lee; los scripts de generación viven fuera del repo.
- Para cambiar variables en Hostinger: la API reemplaza el conjunto completo
  y devuelve los valores enmascarados. Con un solo cambio, es más seguro
  hacerlo a mano en hPanel.
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
- Hero en celular (pedido del usuario, 2026-10-03: notaba latencia):
  - En ≤ 768 px el fondo WebGL va sin niebla desde el inicio (la atmósfera
    la pone el degradado `webgl-fallback` a través del lienzo transparente),
    con 700 partículas, ~30 fps y umbral de degradación de 45 ms.
  - En ≤ 768 px el titular del hero es texto real, sin partículas (pedido del
    usuario, 2026-10-04): `ParticleText` sale del efecto antes de muestrear y
    queda el texto de respaldo (marfil y cian, Fraunces estática). Arriba de
    ese ancho, las palabras apagan su bucle al quedar en reposo y solo las
    despierta un mouse cercano (`(hover: hover) and (pointer: fine)`); en
    tablets táctiles se arman una vez y quedan quietas.
  - Para probar el despertar en Chrome headless hay que lanzar con los
    `--blink-settings` de puntero fino (ver el hover del logotipo): sin ellos
    no hay puntero fino y el listener no se registra.
  - Preloader (pedido del usuario, 2026-10-04): la cortina cuenta 00 → 100
    en **cada carga completa**; navegar entre páginas no la repite, porque
    vive en el layout. Ya no hay marca de sesión.
    - El conteo y la barra los mueve `PRELOADER_SCRIPT`
      (`src/components/effects/preloader-script.ts`), en línea en `layout.tsx`
      justo después de `<Preloader />`. `Preloader` solo abre la cortina
      cuando el script avisa con `afcr:preload-done`.
    - Trampa verificada: si el conteo depende de React, en un teléfono la
      hidratación tarda 2–3 s. En recargas se veía un «00» congelado y luego
      la página; en la primera visita el conteo saltaba (00 → 88, incluso
      negativos). El script corre al llegar el HTML y avanza por cuadros
      pintados (máximo 50 ms por cuadro, así nunca salta), y sostiene el 100
      120 ms antes de avisar.
    - El número y la barra llevan `suppressHydrationWarning`: React no debe
      corregir lo que escribió el script.
    - El script se incrusta con `InlineScript` (`src/components/ui/`), no con
      un `<script>` directo ni con `next/script`. React 19 avisa
      («Encountered a script tag…») cada vez que crea un `<script>` en el
      navegador, por ejemplo al recargar en caliente el layout en desarrollo.
      `next/script` con `beforeInteractive` tampoco lo evita y además retrasa
      la ejecución hasta que carga el runtime de Next. `InlineScript` emite el
      script ejecutable en el servidor y lo declara `text/plain` (inerte) en
      el cliente.
    - Medido en móvil emulado (CPU 1× y 6×, primera carga y recarga): 33–43
      números pintados en subida y la cortina se abre siempre en «100».
  - Los cometas de la card son el mayor costo restante. El usuario decidió
    no tocarlos: no optimizarlos sin pedido.
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
