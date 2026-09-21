import type { Resource } from '@/types';

export const resources: Resource[] = [
  {
    id: 'rag-produccion',
    category: 'ARQUITECTURA RAG',
    title: 'Por qué tu RAG funciona en la demo y falla en producción',
    excerpt:
      'Chunking, reranking y evaluación: las tres decisiones que separan un prototipo simpático de un sistema en el que tu equipo confía.',
    date: '12.08.2026',
    readingTime: '9 min',
    href: '#recursos',
    visual: 'grid',
  },
  {
    id: 'automatizacion-roi',
    category: 'AUTOMATIZACIÓN',
    title: 'Cómo calcular el retorno real de una automatización',
    excerpt:
      'Una fórmula simple —y honesta— para decidir qué procesos automatizar primero, incluyendo el costo oculto del mantenimiento.',
    date: '29.07.2026',
    readingTime: '6 min',
    href: '#recursos',
    visual: 'wave',
  },
  {
    id: 'benchmark-agentes',
    category: 'BENCHMARKS',
    title: 'Benchmark interno: agentes con herramientas sobre datos reales',
    excerpt:
      'Comparamos modelos sobre 240 tareas operativas de clientes. Precisión, latencia y costo por tarea resuelta, sin marketing.',
    date: '05.07.2026',
    readingTime: '12 min',
    href: '#recursos',
    visual: 'orbit',
  },
];
