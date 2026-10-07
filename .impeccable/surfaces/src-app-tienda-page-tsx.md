---
version: 1
slug: "src-app-tienda-page-tsx"
primary_target: "src/app/tienda/page.tsx"
related_targets: ["src/app/checkout/page.tsx","src/app/carrito/page.tsx","src/app/cuenta/pedidos/page.tsx"]
---

# Tienda y checkout

Modo: Operate. Extensión del sitio editorial existente con catálogo y compra autenticada en Perú.

## Direction contract

THESIS: Elegir un equipo y confirmar su pedido sin perder el carrito al identificarse. Categorías y resumen permanecen visibles.

OWN-WORLD: Identidad AFCR heredada: navy, marfil, Fraunces en títulos, Inter en controles, geometría recta y bordes editoriales. Checkout usa el fondo #0F172A, panel #1E293B y azul #2563EB pedidos; naranja solo para recojo.

STORY: Elegir MiniPcs o Cámaras de seguridad, agregar productos reales, revisar carrito, identificarse y completar datos, envío y pedido pendiente de pago.

FIRST VIEWPORT: Título editorial y acceso al carrito; sidebar de dos categorías a la izquierda, cards grandes con fotografía de producto a la derecha. Móvil apila el índice sobre cards. Checkout presenta gate o stepper izquierdo y resumen derecho sticky, apilado en móvil. Firma: resumen estable mientras cambia el paso.

FORM: Estructura fijada por el usuario; sin concept-seed ni comp. Ejecución directa en el sistema existente. No se inventan productos, fotos comerciales, tarifas ni puntos Urbano.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Pendiente: catálogo real y fotos, política de envío y puntos Urbano. Hasta recibirlos, catálogo vacío honesto y recojo bloqueado. Ningún cobro online.

## Finish evidence

Revisión fresca: disposition `ship`; el verdict pass resolvió exclusivamente continuidad de pasos y jerarquía nombre → marca → descripción. Capturas en `.impeccable/review/`, 1440, 390 y 320 px; transiciones naturales móviles sin reposicionamiento manual. Documenter: No changes, extensión ordinaria contrastada con tokens/componentes heredados; ausencia preexistente de DESIGN.md y sidecar reportada, no reparada.

Verificación: typecheck, lint y build Hostinger con dependencias de producción; SQL de precios/RLS/idempotencia y HTTP reales 401/400/201 con fixtures eliminados. Navegador con datos sintéticos: carrito, gate, registro con/sin sesión, OTP de retorno y envío bloqueado cuando falta información. No prueba entrega de correo ni Google real. No hay nuevas imágenes comerciales; muestras visuales solo en pruebas.
