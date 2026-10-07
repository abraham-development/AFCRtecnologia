import { storeCopy } from './store';

/**
 * Textos propios de cada pagina (cabeceras, metadatos y CTA).
 * El contenido de catalogo vive en `services.ts`, `resources.ts` y `agency.ts`.
 */

/** Home: hero + recursos. */
export const homeCopy = {
  /** El titular se dibuja con particulas palabra a palabra (una fila por linea). */
  headline: [
    { words: ['Inteligencia', 'artificial'], variant: 'primary' },
    { words: ['que', 'trabaja', 'contigo.'], variant: 'accent' },
  ] as const,
  primaryCta: 'Empieza un proyecto con nosotros',
  primaryCtaLabel: 'Empieza un proyecto con nosotros: ir al formulario de contacto',
  secondaryCta: 'Ver Servicios',
  /** Card de accion del hero: agrupa los dos CTA (a la derecha en escritorio). */
  actionCard: {
    eyebrow: 'Empecemos',
    title: 'Cuéntanos qué quieres resolver.',
  },
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
  store: {
    title: 'Tienda online',
    lede: storeCopy.lede,
    metaTitle: 'Tienda online',
    metaDescription:
      storeCopy.lede,
  },
  signIn: {
    title: 'Iniciar sesión',
    lede: 'Entra con tu cuenta de la tienda.',
    metaTitle: 'Iniciar sesión',
    metaDescription: 'Inicia sesión en tu cuenta de la tienda de AFCRtecnologia.',
  },
  signUp: {
    title: 'Crear una nueva cuenta',
    lede: 'Regístrate para usar la tienda.',
    metaTitle: 'Crear una nueva cuenta',
    metaDescription: 'Crea una cuenta en la tienda de AFCRtecnologia.',
  },
};

/** Cierre de la pagina de servicios. */
export const servicesCloser = {
  title: '¿No sabes por cuál empezar?',
  body: 'Cuéntanos qué quieres resolver y te recomendamos el camino más corto.',
  cta: 'Hablemos',
};

/** Cierre de la tienda: aun no hay catalogo publicado. */
export const storeCloser = {
  title: '¿Necesitas un equipo?',
  body: 'Cuéntanos para qué lo quieres y te decimos cuál corresponde, con disponibilidad y precio.',
  cta: 'Escríbenos',
};
