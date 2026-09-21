import type { Metric, NavItem } from '@/types';

/**
 * Constantes editables de AFCRtecnologia.
 * ---------------------------------------------------------------
 * Cambia aqui telefono, correo, redes y textos legales: son los
 * unicos datos duros del sitio y se consumen desde todas las secciones.
 */
export const agency = {
  name: 'AFCRtecnologia',
  legalName: 'AFCRtecnologia S.A.C.',
  role: 'Agencia de IA y Automatizacion Avanzada',
  tagline: 'AGENCIA DE IA · LIMA, PERÚ',
  status: 'ONLINE · LATAM & GLOBAL',
  founded: '2023',
  city: 'Lima',
  country: 'Perú',
  timezone: 'GMT-5',
  description:
    'Diseñamos agentes, automatizaciones y sistemas de IA que reducen trabajo operativo y generan resultados medibles.',
  longDescription:
    'AFCRtecnologia es una agencia boutique de inteligencia artificial con base en Lima. Construimos agentes autónomos, automatizaciones de procesos y software impulsado por IA para empresas que necesitan resultados operativos, no pilotos eternos.',

  /** Contacto — reemplaza con tus datos reales antes de publicar. */
  email: 'contacto@afcrtecnologia.com',
  salesEmail: 'proyectos@afcrtecnologia.com',
  phoneDisplay: '+51 987 654 321',

  whatsapp: {
    /** Formato internacional sin «+» ni espacios. */
    number: '51987654321',
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

  socials: [
    { label: 'LinkedIn', handle: '/company/afcrtecnologia', href: 'https://www.linkedin.com/company/afcrtecnologia' },
    { label: 'GitHub', handle: '/afcrtecnologia', href: 'https://github.com/afcrtecnologia' },
    { label: 'X', handle: '@afcrtecnologia', href: 'https://x.com/afcrtecnologia' },
    { label: 'YouTube', handle: '/@afcrtecnologia', href: 'https://youtube.com/@afcrtecnologia' },
  ],

  legal: {
    rights: 'Todos los derechos reservados.',
    privacy: 'Política de privacidad',
    terms: 'Términos de servicio',
    privacyNote:
      'Tus datos se usan únicamente para responder tu solicitud. No compartimos información con terceros ni entrenamos modelos con datos de clientes.',
  },
} as const;

/** URL de WhatsApp Business con mensaje precargado. */
export const whatsappUrl = `https://wa.me/${agency.whatsapp.number}?text=${encodeURIComponent(
  agency.whatsapp.message,
)}`;

/** Indice del menu fullscreen (01 — 07). */
export const navItems: NavItem[] = [
  { index: '01', label: 'Soluciones', href: '#soluciones', meta: 'Cuatro sistemas' },
  { index: '02', label: 'Método', href: '#metodo', meta: 'Siete etapas' },
  { index: '03', label: 'Casos de uso', href: '#casos', meta: 'IA en producción' },
  { index: '04', label: 'Servicios', href: '#servicios', meta: 'Cinco capacidades' },
  { index: '05', label: 'Capacidades', href: '#capacidades', meta: 'Directorio técnico' },
  { index: '06', label: 'Agencia', href: '#agencia', meta: 'Manifiesto y métricas' },
  { index: '07', label: 'Recursos', href: '#recursos', meta: 'Criterio y análisis' },
];

/** Contadores animados de la seccion 07. */
export const metrics: Metric[] = [
  {
    value: 15,
    suffix: '+',
    label: 'Automatizaciones desplegadas',
    caption: 'Flujos en producción con monitoreo activo',
  },
  {
    value: 99.4,
    suffix: '%',
    decimals: 1,
    label: 'Precisión operativa',
    caption: 'Medida sobre tareas críticas con evaluación continua',
  },
  {
    value: 350,
    suffix: '+',
    label: 'Horas/mes ahorradas',
    caption: 'Tiempo operativo devuelto a los equipos de nuestros clientes',
  },
  {
    value: 4.2,
    suffix: 'x',
    decimals: 1,
    label: 'Retorno de inversión',
    caption: 'Promedio a 12 meses sobre proyectos con línea base medida',
  },
];

/** Manifiesto de la seccion 07. */
export const manifesto = [
  {
    index: '01',
    title: 'Privacidad corporativa primero',
    body: 'Trabajamos con aislamiento de datos, despliegues privados y control total sobre lo que entra y sale de cada modelo. Ningún dato de cliente entrena modelos de terceros.',
  },
  {
    index: '02',
    title: 'Despliegue pragmático',
    body: 'Preferimos un proceso funcionando en seis semanas antes que una transformación perfecta en dieciocho meses. Cada entrega tiene una métrica antes y después.',
  },
  {
    index: '03',
    title: 'Arquitecturas sin dependencia',
    body: 'Diseñamos con capas intercambiables: si mañana cambia el proveedor de modelo, cambia una variable de entorno, no el sistema completo.',
  },
];

/** Marquesina tecnologica infinita. */
export const techStack = [
  'OPENAI',
  'ANTHROPIC CLAUDE',
  'GOOGLE GEMINI',
  'N8N',
  'MAKE',
  'PYTHON',
  'TYPESCRIPT',
  'DOCKER',
  'QDRANT',
  'POSTGRESQL',
  'AWS',
];
