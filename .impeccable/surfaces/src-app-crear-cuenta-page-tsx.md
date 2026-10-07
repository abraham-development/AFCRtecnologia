---
version: 1
slug: "src-app-crear-cuenta-page-tsx"
primary_target: "src/app/crear-cuenta/page.tsx"
related_targets: ["src/app/iniciar-sesion/page.tsx","src/app/recuperar-contrasena/page.tsx","src/app/cuenta/page.tsx"]
---

## Direction contract
THESIS: Formularios de acceso claros dentro del sitio corporativo existente; una sola tarea principal por paso.
OWN-WORLD: Heredar navy, cian, marfil, Fraunces e Inter, líneas editoriales y geometría recta del código y AGENTS.md.
STORY: Elegir Google o correo; registrar contraseña, revisar código, acceder; recuperar acceso en pasos con mensajes claros.
FIRST VIEWPORT: En escritorio, título y bajada a la izquierda y formulario limitado a la derecha; en móvil, título seguido de formulario de ancho completo. Botones táctiles de 48px y divisores sencillos.
FORM: Extensión específica de las pantallas de cuenta existentes; no concept-seed por alcance acotado. Firma funcional: mostrar u ocultar contraseña, código único pegable y confirmación del cambio de contraseña.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Alcance: interfaz de acceso y cambio explícito de método desde Mi cuenta, con OTP6 y aviso de la consecuencia. Confirmación principal cian; tienda secundaria con contorno. El control de métodos está desplegado en Supabase. Las pruebas visuales usan API simulada; no confirman Google OAuth real ni recepción de correo. Las pruebas de servidor verificaron registro/recuperación, permisos y cambio a contraseña con estado inicial Google simulado.
