/**
 * Textos propios de cada pagina (cabeceras, metadatos y CTA).
 * El contenido de catalogo vive en `services.ts`, `news.ts` y `agency.ts`.
 */

/** Home: hero + noticias. */
export const homeCopy = {
  /** El titular se dibuja con particulas palabra a palabra (una fila por linea). */
  headline: [
    { words: ['Inteligencia', 'artificial'], variant: 'primary' },
    { words: ['que', 'trabaja.'], variant: 'accent' },
  ] as const,
  primaryCta: 'Empezar un proyecto',
  primaryCtaLabel: 'Empezar un proyecto: ir al formulario de contacto',
  secondaryCta: 'Ver servicios',
  facts: [
    { label: 'BASE', value: 'Lima, Perú' },
    { label: 'ENFOQUE', value: 'Agentes · Automatización · Software' },
    { label: 'RESPUESTA', value: '< 24 horas hábiles' },
  ],
  scroll: 'NOTICIAS',
  scrollLabel: 'Bajar a las noticias',
};

/** Cabeceras de las paginas interiores. */
export const pageIntros = {
  services: {
    title: 'Diez servicios. Un solo equipo.',
    lede: 'Software a medida, páginas web e integraciones; automatización e IA con n8n, WhatsApp, agentes y servidores propios; capacitaciones y dispositivos. Elige por dónde empezar.',
    metaTitle: 'Servicios',
    metaDescription:
      'Desarrollo de software (web y móvil), páginas web, integraciones con APIs, automatizaciones con n8n, chatbots de WhatsApp, agentes de IA personalizados y con Hermes, IA on-premise, capacitaciones y venta de dispositivos.',
  },
  about: {
    title: 'Tecnología hecha en Lima para negocios reales.',
    metaTitle: 'Nosotros',
    metaDescription:
      'AFCRtecnologia es una agencia de tecnología e inteligencia artificial con base en Lima que trabaja con pymes, empresas e instituciones educativas.',
  },
  contact: {
    title: '¿Conversamos?',
    lede: 'Elige el canal que te quede más cómodo. WhatsApp es el más rápido; el formulario es ideal si prefieres contarnos todo con calma.',
    metaTitle: 'Contáctanos',
    metaDescription:
      'Escríbenos por WhatsApp o déjanos tu mensaje: te respondemos en menos de 24 horas hábiles.',
  },
  news: {
    metaTitle: 'Noticias',
  },
};

/** Cierre de la pagina de servicios. */
export const servicesCloser = {
  title: '¿No sabes por cuál empezar?',
  body: 'Cuéntanos qué quieres resolver y te recomendamos el camino más corto.',
  cta: 'Hablemos',
};
