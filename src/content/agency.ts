import type { Audience, NavItem, Principle, ProcessStep, SocialLink } from '@/types';

/**
 * Constantes editables de AFCRtecnologia.
 * ---------------------------------------------------------------
 * Cambia aqui telefono, correo, redes y textos legales: son los
 * unicos datos duros del sitio y se consumen desde todas las secciones.
 */
export const agency = {
  name: 'AFCRtecnologia',
  legalName: 'AFCRtecnologia S.A.C.',
  role: 'Software, automatización e inteligencia artificial',
  tagline: 'AGENCIA DE IA · LIMA, PERÚ',
  founded: '2023',
  city: 'Lima',
  country: 'Perú',
  timezone: 'GMT-5',
  description:
    'Diseñamos agentes, automatizaciones y sistemas de IA que reducen trabajo operativo y generan resultados medibles.',
  /** Resumen del catalogo completo (footer). */
  summary:
    'Desarrollamos software, automatizaciones y agentes de inteligencia artificial para que tu negocio atienda, venda y opere mejor.',
  longDescription:
    'AFCRtecnologia es una agencia de tecnología con base en Lima. Construimos aplicaciones web y móviles, integramos tus sistemas, automatizamos procesos con n8n y desarrollamos agentes de IA —en la nube o en tus propios servidores— para pymes, empresas e instituciones educativas.',

  /** Contacto. El correo aún es marcador; WhatsApp vive en el entorno. */
  email: 'contacto@afcrtecnologia.com',
  salesEmail: 'proyectos@afcrtecnologia.com',

  /**
   * WhatsApp llega por variable de entorno para no quedar escrito
   * en el repositorio (que es público).
   *
   * El número no se muestra: solo arma el enlace `wa.me`.
   * `NEXT_PUBLIC_*` se incrusta en ese enlace durante el build.
   * Si falta, la interfaz oculta el botón en lugar de publicar un enlace roto.
   */
  whatsapp: {
    /** Formato internacional sin «+» ni espacios. */
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
    message:
      'Hola AFCRtecnologia, me gustaría agendar una llamada de diagnóstico de IA para mi empresa.',
  },

  address: {
    street: 'Av. Javier Prado Este 123, Of. 802',
    locality: 'San Isidro, Lima',
    region: 'Lima',
    postalCode: '15046',
    country: 'PE',
  },

  /**
   * ⚠ MARCADORES: las URLs de Facebook, Instagram y LinkedIn aun no estan
   * confirmadas. Reemplazar antes de publicar. WhatsApp se agrega aparte
   * (ver `socialLinks`) porque depende de la variable de entorno.
   */
  socials: [
    { network: 'facebook', label: 'Facebook', handle: '/afcrtecnologia', href: 'https://www.facebook.com/afcrtecnologia' },
    { network: 'instagram', label: 'Instagram', handle: '@afcrtecnologia', href: 'https://www.instagram.com/afcrtecnologia' },
    { network: 'linkedin', label: 'LinkedIn', handle: '/company/afcrtecnologia', href: 'https://www.linkedin.com/company/afcrtecnologia' },
  ] satisfies SocialLink[],

  legal: {
    rights: 'Todos los derechos reservados.',
    privacy: 'Política de privacidad',
    terms: 'Términos de servicio',
    complaints: 'Libro de Reclamaciones',
    privacyNote:
      'Tus datos se usan únicamente para responder tu solicitud. No compartimos información con terceros ni entrenamos modelos con datos de clientes.',
  },
} as const;

/** ¿Hay número configurado? Si no, la interfaz no muestra el botón. */
export const hasWhatsApp = agency.whatsapp.number.trim().length > 0;

/** Enlace de WhatsApp con un mensaje precargado (vacío si no hay número). */
export function whatsappLink(message: string): string {
  if (!hasWhatsApp) return '';
  return `https://wa.me/${agency.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

/** URL de WhatsApp Business con el mensaje general. */
export const whatsappUrl = whatsappLink(agency.whatsapp.message);

/** Mensaje precargado cuando el visitante consulta un servicio concreto. */
export function serviceInquiry(serviceTitle: string): string {
  return `Hola AFCRtecnologia, me interesa el servicio «${serviceTitle}». ¿Podemos conversar?`;
}

/** Redes para iconos: WhatsApp primero (canal principal) si esta configurado. */
export const socialLinks: SocialLink[] = [
  ...(hasWhatsApp
    ? [{ network: 'whatsapp' as const, label: 'WhatsApp', handle: 'WhatsApp', href: whatsappUrl }]
    : []),
  ...agency.socials,
];

/** Navegacion principal: navbar, menu fullscreen y footer (una ruta por item). */
export const navItems: NavItem[] = [
  { index: '01', label: 'Home', href: '/', meta: 'Inicio y noticias' },
  { index: '02', label: 'Servicios', href: '/servicios', meta: 'Diez servicios' },
  { index: '03', label: 'Nosotros', href: '/nosotros', meta: 'Quiénes somos' },
  { index: '04', label: 'Contáctanos', href: '/contacto', meta: 'Respuesta < 24 h' },
];

/** Textos del encabezado. */
export const headerCopy = {
  advisorCta: 'Contacta con un asesor por WhatsApp',
};

/** Destino del atajo E y de los CTA «Empezar un proyecto». */
export const CONTACT_FORM_HREF = '/contacto#formulario';

/** Seccion Nosotros: para quien trabajamos. */
export const audiences: Audience[] = [
  {
    title: 'Pymes',
    body: 'Tu página web, la facturación electrónica con SUNAT y un asistente de WhatsApp que atiende mientras tú te enfocas en vender.',
    serviceGroupId: 'software',
  },
  {
    title: 'Empresas',
    body: 'Agentes de IA, automatizaciones entre sistemas e IA instalada en tus propios servidores cuando los datos no pueden salir.',
    serviceGroupId: 'ia',
  },
  {
    title: 'Instituciones educativas',
    body: 'Capacitaciones y charlas para que docentes, estudiantes y equipos usen la IA con criterio y responsabilidad.',
    serviceGroupId: 'formacion',
  },
];

/** Seccion Nosotros: como trabajamos. */
export const processSteps: ProcessStep[] = [
  {
    index: '01',
    title: 'Conversamos',
    body: 'Nos cuentas qué quieres resolver. Entendemos tu operación antes de proponer tecnología.',
  },
  {
    index: '02',
    title: 'Proponemos',
    body: 'Te enviamos un alcance claro: qué construimos, con qué herramientas y qué recibirás.',
  },
  {
    index: '03',
    title: 'Construimos',
    body: 'Avances frecuentes que puedes probar. Nada de meses sin ver resultados.',
  },
  {
    index: '04',
    title: 'Acompañamos',
    body: 'Capacitamos a tu equipo y seguimos disponibles para soporte y mejoras.',
  },
];

/** Seccion Nosotros: principios. */
export const principles: Principle[] = [
  {
    title: 'Tus datos son tuyos',
    body: 'Trabajamos con accesos controlados y, cuando hace falta, con IA instalada en tus servidores. Ningún dato de cliente entrena modelos de terceros.',
  },
  {
    title: 'Soluciones que se usan',
    body: 'Preferimos un sistema funcionando en semanas antes que un proyecto perfecto que nunca sale. Cada entrega resuelve algo concreto.',
  },
  {
    title: 'Sin dependencia de un proveedor',
    body: 'Diseñamos con piezas intercambiables: si mañana conviene otro modelo de IA u otra herramienta, se cambia sin rehacer todo.',
  },
];

/** Marquesina de herramientas con las que trabajamos. */
export const techStack = [
  'N8N',
  'WHATSAPP BUSINESS',
  'API SUNAT',
  'OPENAI',
  'ANTHROPIC CLAUDE',
  'GOOGLE GEMINI',
  'HERMES AGENT',
  'PYTHON',
  'TYPESCRIPT',
  'DOCKER',
  'POSTGRESQL',
];

/** Textos de la seccion Nosotros. */
export const aboutCopy = {
  title: 'Tecnología hecha en Lima para negocios reales.',
  audiencesTitle: 'Para quién trabajamos',
  audienceLink: 'Ver sus servicios',
  processTitle: 'Cómo trabajamos',
  principlesTitle: 'Lo que no negociamos',
};

/** Textos de la seccion Contacto (encabezado). */
export const contactCopy = {
  channelsTitle: 'Canales directos',
  channels: {
    whatsapp: {
      label: 'WhatsApp',
      value: 'Chatea con nosotros',
      action: 'Abrir conversación',
    },
    email: { label: 'Correo', action: 'Escribir un correo' },
  },
  asideResponse: { label: 'RESPUESTA', value: '< 24 horas hábiles' },
  asideBase: { label: 'BASE' },
  formTitle: 'Déjanos tu mensaje.',
  formLede:
    'Una web, una integración con SUNAT, un chatbot o un agente de IA: cuéntanos qué necesitas y te respondemos con los siguientes pasos.',
  formHint: 'LOS CAMPOS CON * SON OBLIGATORIOS',
};

/** Textos del footer. La banda final empuja a WhatsApp: conversar sin formulario. */
export const footerCopy = {
  titleStart: '¿Prefieres ',
  titleAccent: 'conversar',
  titleEnd: '?',
  body: 'WhatsApp es la vía más rápida: escríbenos y conversa directamente con nuestro equipo.',
  whatsappCta: 'Escribir por WhatsApp',
  whatsappShort: 'WhatsApp',
  fallbackCta: 'Ir al formulario',
  columns: { nav: 'NAVEGACIÓN', services: 'SERVICIOS', contact: 'CONTACTO' },
  labels: { whatsapp: 'WHATSAPP', email: 'CORREO', location: 'UBICACIÓN' },
  backToTop: 'VOLVER ARRIBA',
};
