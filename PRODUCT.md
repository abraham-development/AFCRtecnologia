# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Pymes peruanas** que necesitan presencia web, facturación electrónica con
  SUNAT, atención por WhatsApp y automatizar tareas repetitivas.
- **Empresas medianas y grandes** que buscan agentes de IA a medida,
  integraciones entre sistemas o IA desplegada en su propia infraestructura.
- **Instituciones educativas** (y equipos corporativos) que contratan
  capacitaciones y charlas sobre el uso adecuado de la IA.

El visitante llega a la landing para entender qué hace AFCR, comprobar que
cubre su necesidad concreta y contactar, preferentemente por WhatsApp.

## Product Purpose

AFCRtecnologia es una agencia de tecnología e IA con base en Lima. La landing
existe para convertir visitas en conversaciones comerciales (WhatsApp o
formulario). Éxito = el visitante identifica su servicio en segundos y escribe.

## Positioning

Una sola agencia local que cubre desde el software de base (web, apps móviles,
integración con SUNAT CPE y SIRE) hasta IA avanzada (agentes, Hermes Agent,
IA on-premise), además de formación y venta de equipos. Combinación de
cumplimiento tributario peruano + IA aplicada.

## Capabilities and Constraints

Servicios confirmados (2026-09-24):

1. Desarrollo de software: aplicaciones web y aplicaciones móviles
2. Diseño y desarrollo de páginas web
3. Integraciones con la API de SUNAT (CPE) y declaración en el SIRE
4. Automatizaciones con n8n
5. Chatbots agénticos de WhatsApp para negocios
6. Agentes de IA personalizados
7. Agentes de IA con Hermes (Hermes Agent de Nous Research)
8. Desarrollo local (on-premise) con inteligencia artificial
9. Capacitaciones y charlas sobre el manejo adecuado de la IA
10. Venta de dispositivos tecnológicos (mini PC y cámaras de seguridad)
11. Sistemas RAG: IA que responde con los documentos de la empresa (confirmado 2026-10-01)

Estructura del sitio: una página por ítem del navbar —Home, Servicios,
Tienda online, Nosotros, Contáctanos (tienda añadida el 2026-10-05; aún sin
catálogo comercial confirmado). La Home muestra «Recursos»: 8 artículos del
«Equipo de AFCRtecnologia», uno por servicio (RAG, agente de IA para WhatsApp,
automatizaciones, agentes de IA personalizados, páginas web, capacitaciones,
software a medida y venta de mini PC y cámaras de seguridad), cada uno con su
página en `/recursos/<slug>`. La sección de noticias y su MCP se retiraron el
2026-09-29.
La tienda será un ecommerce con solo dos categorías: MiniPcs y cámaras de
seguridad. Sidebar en escritorio, índice apilado en celular y cards de equipos.
El carrito sobrevive a login, registro y verificación. La cuenta se resuelve
mediante un gate dentro de `/checkout`, seguido de datos, envío, pago y
confirmación. El pedido requiere cuenta; aún no se cobra online. Lima y Callao
usan delivery con distrito oficial, calle y referencia. Provincias usa puntos
Urbano confirmados; sin ellos no se permite continuar. Catálogo de productos,
fotografías, tarifas de envío y puntos reales pendientes del usuario: no
inventarlos ni publicar ejemplos como productos a la venta.
Restricciones técnicas en `AGENTS.md`.

El administrador autorizado gestionará la tienda desde `/admin`: fichas,
fotografías, publicación, stock, pedidos y pagos manuales, clientes de pedidos,
puntos Urbano confirmados e historial de cambios. El acceso exige su cuenta
verificada y permisos comprobados en la base. Panel local preparado; aplicación
remota pendiente de aprobación de las políticas de stock y almacenamiento.
No incluye cobro online, reembolso automático ni inventa catálogo o agencias.

Al iniciar sesión, el topbar muestra «Hola, <correo>» con un desplegable para
perfil, pedidos y seguridad, junto a «Cerrar sesión» (pedido del usuario, 2026-10-07).
El perfil permite editar nombres, apellidos y celular; los cambios no alteran
los datos históricos de pedidos ni conceden permisos de administración.

Las cuentas de la tienda deben ofrecer registro con contraseña y control para
mostrarla, confirmación de correo por código de 6 dígitos y acceso con Google.
El usuario exige un solo método activo por cuenta: pasar a contraseña desactiva
Google y pasar a Google desactiva contraseña. El cambio se hace explícitamente
desde «Mi cuenta», verificando un código de 6 dígitos; el método anterior se
desactiva cuando el nuevo queda listo. La configuración SMTP corresponde
al buzón de Hostinger; no presentar el flujo como terminado antes de verificar
los correos y la restricción de método en Supabase.

## Brand Commitments

- Nombre: AFCRtecnologia (marca «AFCR» + «tecnologia»).
- En la web el logotipo es la imagen oficial «AFCRtecnologia» (placa oscura y
  letras marfil), servida por `BrandLogo` en header, footer, preloader y la
  imagen para redes sociales. La placa metálica sigue en
  `public/brand/afcr-logotipo-plateado.png` y no se muestra en el sitio.
- Idioma: español de Perú, tuteo.
- Canal principal de contacto: WhatsApp (número real vía variables de entorno).
- Redes a mostrar: WhatsApp, Facebook, Instagram, LinkedIn.

## Evidence on Hand

- No hay casos de clientes, testimonios ni métricas reales.
  Las métricas antiguas del repositorio eran ilustrativas: no inventar nuevas.
- URLs de Facebook, Instagram y LinkedIn: aún no confirmadas (marcadores).
- Correo `contacto@afcrtecnologia.com` y dirección postal: marcadores.
- Duraciones y precios de servicios: no definidos; no publicarlos.

## Product Principles

1. Que cada visitante encuentre su servicio concreto sin leer toda la página.
2. WhatsApp primero: toda decisión de diseño acerca al visitante a escribir.
3. Nada de afirmaciones sin respaldo: sin métricas ni clientes inventados.
4. Lenguaje de negocio antes que jerga técnica.
