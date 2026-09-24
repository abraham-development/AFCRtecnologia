import type { NewsCategory, NewsPost } from '@/types';

/**
 * Noticias y notas de AFCRtecnologia.
 * ---------------------------------------------------------------
 * Se escriben a mano aqui. ⚠ Todas las notas actuales son EJEMPLOS
 * (`sample: true`) para ver el diseño: reemplazarlas por notas reales
 * antes de publicar. No inventar cifras, clientes ni citas.
 *
 * En `body`, un parrafo que empieza por «## » se muestra como subtitulo.
 */
export const newsPosts: NewsPost[] = [
  {
    slug: 'hermes-agent-agente-de-ia-de-codigo-abierto',
    title: 'Hermes Agent: un agente de IA de código abierto que puedes alojar tú',
    excerpt:
      'Nous Research publicó un agente abierto que se ejecuta en tu propia infraestructura. Qué es, para qué sirve y cuándo tiene sentido usarlo en una empresa.',
    category: 'IA',
    date: '2026-09-11',
    readingTime: '5 min',
    sample: true,
    body: [
      'Hermes Agent es un agente de inteligencia artificial de código abierto desarrollado por Nous Research. A diferencia de un chatbot que solo responde, un agente puede usar herramientas: consultar sistemas, leer documentos y ejecutar tareas en varios pasos.',
      '## Por qué importa que sea abierto',
      'Al ser de código abierto, puede instalarse en servidores de la empresa. Eso da control sobre dónde viven los datos, qué herramientas puede tocar el agente y qué modelo de lenguaje usa por debajo.',
      '## Cuándo conviene',
      'Tiene sentido cuando la información es sensible, cuando necesitas integrarlo con sistemas internos o cuando quieres evitar depender de un único proveedor. Requiere, eso sí, una implementación cuidadosa: permisos claros, límites de autonomía y monitoreo.',
    ],
  },
  {
    slug: 'ia-on-premise-cuando-conviene',
    title: 'IA on-premise: cuándo conviene tener los modelos en tus propios servidores',
    excerpt:
      'No todos los datos deberían salir de la empresa. Una guía para decidir entre IA en la nube e IA instalada en tu infraestructura.',
    category: 'IA',
    date: '2026-09-04',
    readingTime: '7 min',
    sample: true,
    body: [
      'Los modelos de lenguaje abiertos han mejorado lo suficiente como para ejecutarse en servidores propios con buenos resultados en tareas concretas: clasificar documentos, responder sobre información interna o extraer datos de formularios.',
      '## Señales de que te conviene',
      'Manejas información confidencial de clientes, estás en un sector regulado, necesitas que el sistema funcione aunque falle la conexión o el volumen de uso hace que pagar por consulta a un proveedor externo salga caro.',
      '## Lo que hay que considerar',
      'La IA local requiere hardware adecuado, mantenimiento y una elección cuidadosa del modelo para cada tarea. Muchas veces la mejor solución es mixta: lo sensible en casa y lo general en la nube.',
    ],
  },
  {
    slug: 'chatbots-de-whatsapp-que-pueden-hacer',
    title: 'Chatbots de WhatsApp con IA: qué pueden hacer por tu negocio (y qué no)',
    excerpt:
      'Un asistente agéntico puede cotizar, agendar y derivar conversaciones. Pero hay tareas que conviene dejar a una persona.',
    category: 'Automatización',
    date: '2026-08-27',
    readingTime: '5 min',
    sample: true,
    body: [
      'Los chatbots de antes seguían un menú de opciones. Un asistente agéntico entiende lo que el cliente escribe, consulta tu catálogo o tu agenda y responde con información real de tu negocio.',
      '## Lo que hace bien',
      'Responder preguntas frecuentes a cualquier hora, tomar datos para una cotización, agendar citas, confirmar pedidos y avisar a tu equipo cuando una conversación necesita atención humana.',
      '## Lo que conviene dejar a una persona',
      'Reclamos delicados, negociaciones de precio y decisiones que comprometen a la empresa. Un buen diseño define desde el inicio cuándo el asistente debe derivar la conversación.',
    ],
  },
  {
    slug: 'automatizaciones-n8n-para-pymes',
    title: 'Cinco tareas que una pyme puede automatizar con n8n esta semana',
    excerpt:
      'Correos, hojas de cálculo y avisos que hoy se hacen a mano pueden correr solos. Ideas concretas para empezar sin grandes inversiones.',
    category: 'Automatización',
    date: '2026-08-20',
    readingTime: '4 min',
    sample: true,
    body: [
      'n8n es una herramienta de automatización que conecta aplicaciones entre sí mediante flujos visuales. Puede instalarse en tu propio servidor, lo que la hace atractiva para empresas que cuidan sus datos.',
      '## Ideas para empezar',
      'Registrar automáticamente en una hoja de cálculo cada formulario recibido. Enviar un correo de bienvenida a cada cliente nuevo. Avisar por WhatsApp o correo cuando un pedido cambia de estado. Consolidar reportes semanales de varias fuentes. Respaldar archivos importantes en la nube.',
      '## El siguiente paso',
      'Cuando los flujos simples funcionan, se pueden sumar pasos con IA: clasificar correos, resumir documentos o responder consultas con información de la empresa.',
    ],
  },
  {
    slug: 'capacitar-a-tu-equipo-en-ia',
    title: 'Cómo capacitar a tu equipo en IA sin miedo y con criterio',
    excerpt:
      'Usar IA bien no es solo saber escribir prompts. Es entender sus límites, proteger la información y saber cuándo verificar.',
    category: 'Negocio',
    date: '2026-08-13',
    readingTime: '5 min',
    sample: true,
    body: [
      'Muchos equipos ya usan herramientas de IA por su cuenta, sin reglas claras. Una capacitación ordena ese uso: qué herramientas usar, para qué tareas y con qué cuidados.',
      '## Qué debería cubrir',
      'Cómo formular buenas instrucciones, cómo verificar lo que responde la IA, qué información nunca debe compartirse con servicios externos y cómo integrar estas herramientas en el trabajo diario.',
      '## Para instituciones educativas',
      'En colegios y universidades el reto es doble: aprovechar la IA como apoyo al aprendizaje y, al mismo tiempo, formar criterio para usarla de manera honesta y responsable.',
    ],
  },
];

export const newsCategories: NewsCategory[] = ['IA', 'Automatización', 'Software', 'Negocio'];

/** Notas ordenadas de la mas reciente a la mas antigua. */
export const sortedNews = [...newsPosts].sort((a, b) => b.date.localeCompare(a.date));

export function getNewsPost(slug: string): NewsPost | undefined {
  return newsPosts.find((post) => post.slug === slug);
}

/** Fecha legible en español de Peru, sin depender de la zona horaria del servidor. */
export function formatNewsDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  return `${day} ${months[(month ?? 1) - 1]} ${year}`;
}

/** Textos de la seccion Noticias (Home) y de cada nota. */
export const newsCopy = {
  sectionTitle: 'Lo que está pasando en IA y tecnología.',
  sectionLede:
    'Notas breves de nuestro equipo sobre inteligencia artificial, automatización y tecnología para negocios en el Perú.',
  filterAll: 'Todas',
  filterLabel: 'Filtrar noticias por categoría',
  readMore: 'Leer nota',
  sampleLabel: 'EJEMPLO',
  categoryLabel: 'Categoría',
  dateLabel: 'FECHA',
  readingLabel: 'LECTURA',
  empty: 'Todavía no hay notas en esta categoría.',
  back: 'Volver a noticias',
  relatedTitle: 'Sigue leyendo',
  ctaTitle: '¿Quieres aplicar esto en tu negocio?',
  ctaBody: 'Cuéntanos qué necesitas y te respondemos con los siguientes pasos.',
  ctaButton: 'Hablemos',
};
