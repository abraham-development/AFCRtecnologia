import type { MethodStep } from '@/types';

export const methodSteps: MethodStep[] = [
  {
    index: '01',
    title: 'Descubrir',
    summary: 'Entendemos el negocio antes que la tecnología.',
    detail:
      'Sesiones con las personas que ejecutan el proceso hoy. Mapeamos entradas, salidas, excepciones y el costo real de cada paso manual.',
    deliverable: 'Mapa de proceso + línea base medible',
  },
  {
    index: '02',
    title: 'Auditar',
    summary: 'Datos, sistemas y riesgos sobre la mesa.',
    detail:
      'Revisamos calidad de datos, accesos, integraciones disponibles y restricciones legales. Identificamos qué es automatizable hoy y qué requiere preparación previa.',
    deliverable: 'Informe técnico de viabilidad',
  },
  {
    index: '03',
    title: 'Priorizar',
    summary: 'Primero lo que paga el proyecto.',
    detail:
      'Ordenamos oportunidades por impacto económico contra esfuerzo de implementación. Elegimos un caso inicial que demuestre retorno en semanas, no en trimestres.',
    deliverable: 'Backlog priorizado con ROI estimado',
  },
  {
    index: '04',
    title: 'Diseñar',
    summary: 'Arquitectura explícita, sin cajas negras.',
    detail:
      'Definimos el flujo del agente, las herramientas que puede invocar, los límites de autonomía, la estrategia de recuperación y el plan de evaluación.',
    deliverable: 'Diagrama de arquitectura + criterios de aceptación',
  },
  {
    index: '05',
    title: 'Construir',
    summary: 'Iteraciones cortas con demo funcional.',
    detail:
      'Desarrollo en ciclos de una a dos semanas. Cada ciclo cierra con algo ejecutándose sobre datos reales y con métricas comparables contra la línea base.',
    deliverable: 'Sistema funcionando en entorno de pruebas',
  },
  {
    index: '06',
    title: 'Integrar',
    summary: 'Donde tu equipo ya trabaja.',
    detail:
      'Conectamos con CRM, ERP, WhatsApp, correo y bases internas. Capacitamos al equipo y desplegamos con monitoreo, alertas y control de costos por token.',
    deliverable: 'Despliegue en producción + capacitación',
  },
  {
    index: '07',
    title: 'Optimizar',
    summary: 'La IA se mantiene, no se abandona.',
    detail:
      'Evaluación continua de precisión, revisión de casos fallidos, ajuste de prompts y modelos, y reporte mensual de horas ahorradas y retorno acumulado.',
    deliverable: 'Reporte mensual de rendimiento y ahorro',
  },
];
