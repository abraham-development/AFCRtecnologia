-- Seed: las notas de ejemplo de src/content/news.ts (sample = true).
-- Se pueden borrar con el MCP (delete_news) cuando haya notas reales.
insert into public.news_posts
  (slug, title, excerpt, category, body, status, published_on, sample, created_by, updated_by)
values
  ('hermes-agent-agente-de-ia-de-codigo-abierto', 'Hermes Agent: un agente de IA de código abierto que puedes alojar tú', 'Nous Research publicó un agente abierto que se ejecuta en tu propia infraestructura. Qué es, para qué sirve y cuándo tiene sentido usarlo en una empresa.', 'IA',
   'Hermes Agent es un agente de inteligencia artificial de código abierto desarrollado por Nous Research. A diferencia de un chatbot que solo responde, un agente puede usar herramientas: consultar sistemas, leer documentos y ejecutar tareas en varios pasos.

## Por qué importa que sea abierto

Al ser de código abierto, puede instalarse en servidores de la empresa. Eso da control sobre dónde viven los datos, qué herramientas puede tocar el agente y qué modelo de lenguaje usa por debajo.

## Cuándo conviene

Tiene sentido cuando la información es sensible, cuando necesitas integrarlo con sistemas internos o cuando quieres evitar depender de un único proveedor. Requiere, eso sí, una implementación cuidadosa: permisos claros, límites de autonomía y monitoreo.',
   'published', '2026-09-11', true, 'seed', 'seed'),
  ('ia-on-premise-cuando-conviene', 'IA on-premise: cuándo conviene tener los modelos en tus propios servidores', 'No todos los datos deberían salir de la empresa. Una guía para decidir entre IA en la nube e IA instalada en tu infraestructura.', 'IA',
   'Los modelos de lenguaje abiertos han mejorado lo suficiente como para ejecutarse en servidores propios con buenos resultados en tareas concretas: clasificar documentos, responder sobre información interna o extraer datos de formularios.

## Señales de que te conviene

Manejas información confidencial de clientes, estás en un sector regulado, necesitas que el sistema funcione aunque falle la conexión o el volumen de uso hace que pagar por consulta a un proveedor externo salga caro.

## Lo que hay que considerar

La IA local requiere hardware adecuado, mantenimiento y una elección cuidadosa del modelo para cada tarea. Muchas veces la mejor solución es mixta: lo sensible en casa y lo general en la nube.',
   'published', '2026-09-04', true, 'seed', 'seed'),
  ('chatbots-de-whatsapp-que-pueden-hacer', 'Chatbots de WhatsApp con IA: qué pueden hacer por tu negocio (y qué no)', 'Un asistente agéntico puede cotizar, agendar y derivar conversaciones. Pero hay tareas que conviene dejar a una persona.', 'Automatización',
   'Los chatbots de antes seguían un menú de opciones. Un asistente agéntico entiende lo que el cliente escribe, consulta tu catálogo o tu agenda y responde con información real de tu negocio.

## Lo que hace bien

Responder preguntas frecuentes a cualquier hora, tomar datos para una cotización, agendar citas, confirmar pedidos y avisar a tu equipo cuando una conversación necesita atención humana.

## Lo que conviene dejar a una persona

Reclamos delicados, negociaciones de precio y decisiones que comprometen a la empresa. Un buen diseño define desde el inicio cuándo el asistente debe derivar la conversación.',
   'published', '2026-08-27', true, 'seed', 'seed'),
  ('automatizaciones-n8n-para-pymes', 'Cinco tareas que una pyme puede automatizar con n8n esta semana', 'Correos, hojas de cálculo y avisos que hoy se hacen a mano pueden correr solos. Ideas concretas para empezar sin grandes inversiones.', 'Automatización',
   'n8n es una herramienta de automatización que conecta aplicaciones entre sí mediante flujos visuales. Puede instalarse en tu propio servidor, lo que la hace atractiva para empresas que cuidan sus datos.

## Ideas para empezar

Registrar automáticamente en una hoja de cálculo cada formulario recibido. Enviar un correo de bienvenida a cada cliente nuevo. Avisar por WhatsApp o correo cuando un pedido cambia de estado. Consolidar reportes semanales de varias fuentes. Respaldar archivos importantes en la nube.

## El siguiente paso

Cuando los flujos simples funcionan, se pueden sumar pasos con IA: clasificar correos, resumir documentos o responder consultas con información de la empresa.',
   'published', '2026-08-20', true, 'seed', 'seed'),
  ('capacitar-a-tu-equipo-en-ia', 'Cómo capacitar a tu equipo en IA sin miedo y con criterio', 'Usar IA bien no es solo saber escribir prompts. Es entender sus límites, proteger la información y saber cuándo verificar.', 'Negocio',
   'Muchos equipos ya usan herramientas de IA por su cuenta, sin reglas claras. Una capacitación ordena ese uso: qué herramientas usar, para qué tareas y con qué cuidados.

## Qué debería cubrir

Cómo formular buenas instrucciones, cómo verificar lo que responde la IA, qué información nunca debe compartirse con servicios externos y cómo integrar estas herramientas en el trabajo diario.

## Para instituciones educativas

En colegios y universidades el reto es doble: aprovechar la IA como apoyo al aprendizaje y, al mismo tiempo, formar criterio para usarla de manera honesta y responsable.',
   'published', '2026-08-13', true, 'seed', 'seed')
on conflict (slug) do nothing;
