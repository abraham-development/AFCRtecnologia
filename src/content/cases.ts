import type { CaseStudy } from '@/types';

/**
 * Casos de uso. Sustituye metricas por resultados verificables de tus
 * propios proyectos antes de publicar.
 */
export const caseStudies: CaseStudy[] = [
  {
    id: 'agente-comercial',
    index: '01',
    title: 'Agente comercial 24/7',
    sector: 'Banca y retail',
    problem:
      'El equipo comercial perdía oportunidades fuera de horario: los leads de WhatsApp y web esperaban hasta 14 horas por una primera respuesta y el 38% se enfriaba antes del primer contacto.',
    architecture:
      'Agente conversacional con acceso a catálogo y reglas de negocio, calificación por scoring, agendamiento directo en el calendario del asesor y handoff a humano con el contexto completo de la conversación.',
    stack: ['FastAPI', 'LangChain', 'Qdrant', 'WhatsApp Cloud API', 'PostgreSQL'],
    metrics: [
      { value: '+64%', label: 'Velocidad de respuesta' },
      { value: '−38%', label: 'Leads enfriados' },
      { value: '24/7', label: 'Cobertura real' },
    ],
  },
  {
    id: 'soporte-n1',
    index: '02',
    title: 'Automatización de soporte técnico nivel 1',
    sector: 'Telecomunicaciones',
    problem:
      'El 71% de los tickets eran repetitivos —restablecer contraseñas, estado de servicio, guías de configuración— y consumían al equipo senior que debía resolver incidencias críticas.',
    architecture:
      'Clasificador de intención sobre el correo y el portal, resolución automática con base de conocimiento vectorial, ejecución de acciones en el sistema interno y escalamiento con resumen para nivel 2.',
    stack: ['Python', 'Claude API', 'Qdrant', 'n8n', 'Zendesk API'],
    metrics: [
      { value: '71%', label: 'Tickets auto-resueltos' },
      { value: '−52%', label: 'Tiempo medio de cierre' },
      { value: '+19 pts', label: 'CSAT' },
    ],
  },
  {
    id: 'documentos',
    index: '03',
    title: 'Procesamiento inteligente de documentos',
    sector: 'Logística y comercio exterior',
    problem:
      'Facturas, guías de remisión y certificados llegaban en PDF escaneado y formatos inconsistentes. Tres personas dedicaban su jornada a transcribir datos al ERP, con errores costosos en aduanas.',
    architecture:
      'Pipeline de ingesta con OCR, extracción estructurada validada contra esquema, reglas de negocio para detectar inconsistencias y cola de revisión humana solo para los casos de baja confianza.',
    stack: ['Python', 'OpenAI Vision', 'Pydantic', 'Docker', 'PostgreSQL'],
    metrics: [
      { value: '96.8%', label: 'Precisión de extracción' },
      { value: '−83%', label: 'Tiempo por documento' },
      { value: '3 FTE', label: 'Reasignados a análisis' },
    ],
  },
  {
    id: 'asistente-interno',
    index: '04',
    title: 'Asistente interno sobre conocimiento privado',
    sector: 'Servicios profesionales',
    problem:
      'Políticas, contratos y procedimientos vivían en carpetas dispersas. Cada consulta interna tomaba entre 20 y 40 minutos de búsqueda, y las respuestas variaban según a quién se preguntara.',
    architecture:
      'RAG sobre repositorio privado con permisos por área, citación obligatoria de la fuente, evaluación semanal de respuestas y despliegue en infraestructura del cliente sin salida de datos a terceros.',
    stack: ['TypeScript', 'Next.js', 'Qdrant', 'Claude API', 'AWS'],
    metrics: [
      { value: '−87%', label: 'Tiempo de búsqueda' },
      { value: '100%', label: 'Respuestas con fuente citada' },
      { value: '0', label: 'Datos fuera del perímetro' },
    ],
  },
];
