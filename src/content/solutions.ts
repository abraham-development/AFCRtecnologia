import type { Solution } from '@/types';

export const solutions: Solution[] = [
  {
    id: 'agentes',
    index: '01',
    title: 'Agentes de IA',
    description:
      'Asistentes autónomos multitarea conectados a tus bases de datos, CRM y herramientas de negocio. Razonan sobre contexto real, ejecutan acciones y escalan a un humano cuando corresponde.',
    impact: 'Hasta 70% de las consultas resueltas sin intervención humana.',
    glyph: 'agents',
    href: '#servicios',
  },
  {
    id: 'automatizacion',
    index: '02',
    title: 'Automatización de Procesos',
    description:
      'Orquestación end-to-end con n8n, Make y microservicios propios. Convertimos cadenas de correos, hojas de cálculo y copiar-pegar en flujos observables con reintentos y alertas.',
    impact: 'De 4 horas diarias de trabajo manual a 12 minutos de supervisión.',
    glyph: 'automation',
    href: '#metodo',
  },
  {
    id: 'ventas',
    index: '03',
    title: 'Atención y Ventas Inteligentes',
    description:
      'Calificación instantánea de leads, seguimiento omnicanal y agendamiento 24/7 sobre WhatsApp, web y correo. Cada conversación queda registrada y puntuada en tu CRM.',
    impact: 'Tiempo de primera respuesta por debajo de 30 segundos, todos los días.',
    glyph: 'sales',
    href: '#casos',
  },
  {
    id: 'software',
    index: '04',
    title: 'Software Impulsado por IA',
    description:
      'Aplicaciones a medida integradas con LLMs, RAG y modelos locales. Producto real: autenticación, permisos, trazabilidad, costos por token y panel de evaluación incluidos.',
    impact: 'Un sistema propio, no una suscripción más que no controlas.',
    glyph: 'software',
    href: '#contacto',
  },
];
