import type { Resource } from '@/types';

/**
 * Recursos de AFCRtecnologia: desarrollos propios (software, agentes de IA y
 * otros recursos) que muestra la Home bajo el titulo «Recursos».
 * ---------------------------------------------------------------
 * ⚠ Las tres fichas actuales son EJEMPLOS (`sample: true`) para ver el diseño:
 * se muestran con la etiqueta EJEMPLO. Sustituirlas por desarrollos reales y
 * quitar `sample`. No inventar clientes, métricas ni resultados (PRODUCT.md).
 */
export const resources: Resource[] = [
  {
    slug: 'agente-ia-personalizado-24-7',
    kind: 'Agente de IA',
    name: 'Agente de IA personalizado 24/7',
    description:
      'Agente entrenado con la información de tu negocio que atiende consultas a cualquier hora y deriva a tu equipo lo que requiere una persona.',
    sample: true,
  },
  {
    slug: 'asistente-whatsapp-ia',
    kind: 'Agente de IA',
    name: 'Asistente de WhatsApp con IA',
    description:
      'Agente que responde consultas frecuentes, agenda citas y deriva la conversación a una persona cuando hace falta.',
    sample: true,
  },
  {
    slug: 'plantillas-n8n',
    kind: 'Recurso',
    name: 'Plantillas de automatización con n8n',
    description:
      'Flujos listos para conectar formularios, hojas de cálculo y WhatsApp sin programar desde cero.',
    sample: true,
  },
];

/** Textos de la seccion Recursos (Home). */
export const resourcesCopy = {
  /** Se muestra en mayusculas con CSS (pedido del usuario: «RECURSOS»). */
  sectionTitle: 'Recursos',
  lede: 'Software, agentes de IA y otros recursos desarrollados por AFCRtecnologia.',
  sampleLabel: 'EJEMPLO',
  contactCta: 'Consultar',
  empty: 'Muy pronto compartiremos aquí nuestros desarrollos.',
};
