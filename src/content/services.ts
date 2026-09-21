import type { Service } from '@/types';

export const services: Service[] = [
  {
    id: 'auditoria',
    index: '01',
    title: 'Auditoría y Estrategia de Adopción de IA',
    description:
      'Diagnóstico completo de procesos, datos y sistemas para determinar dónde la IA genera retorno real y dónde todavía no conviene tocarla.',
    bullets: [
      'Mapa de oportunidades con impacto económico estimado',
      'Evaluación de madurez de datos e integraciones',
      'Hoja de ruta por trimestres con presupuesto asociado',
    ],
    duration: '2 a 3 semanas',
  },
  {
    id: 'agentes',
    index: '02',
    title: 'Desarrollo de Agentes Autónomos',
    description:
      'Construcción de agentes que razonan sobre tu contexto, invocan herramientas reales y operan con límites de autonomía explícitos.',
    bullets: [
      'Diseño de herramientas, memoria y políticas de escalamiento',
      'Evaluación automatizada con casos dorados y regresión',
      'Observabilidad de costos, latencia y tasa de acierto',
    ],
    duration: '4 a 8 semanas',
  },
  {
    id: 'automatizacion',
    index: '03',
    title: 'Automatización de Flujos Empresariales',
    description:
      'Orquestación de procesos completos entre sistemas que hoy no se hablan, con reintentos, trazabilidad y alertas en cada paso.',
    bullets: [
      'Integración con CRM, ERP, correo, WhatsApp y bases internas',
      'Flujos idempotentes con manejo explícito de excepciones',
      'Panel de control operativo para el equipo de negocio',
    ],
    duration: '3 a 6 semanas',
  },
  {
    id: 'integracion',
    index: '04',
    title: 'Integración de Modelos (LLMs & APIs Privadas)',
    description:
      'Capa de modelos intercambiable sobre tu infraestructura: proveedores comerciales, modelos abiertos o despliegue local según el dato que se procesa.',
    bullets: [
      'Enrutamiento por costo, latencia y sensibilidad del dato',
      'RAG con control de permisos y citación de fuentes',
      'Despliegue privado en tu nube o servidores propios',
    ],
    duration: '3 a 5 semanas',
  },
  {
    id: 'optimizacion',
    index: '05',
    title: 'Mantenimiento, Evaluación y Optimización Continua',
    description:
      'Un sistema de IA sin evaluación se degrada en silencio. Medimos, corregimos y reportamos mes a mes.',
    bullets: [
      'Suite de evaluación versionada y ejecutada en cada cambio',
      'Revisión de casos fallidos y ajuste de prompts y modelos',
      'Reporte mensual de precisión, ahorro y retorno acumulado',
    ],
    duration: 'Retainer mensual',
  },
];

export const editorialQuote = 'La IA no es una promesa. Es una capacidad operativa.';
