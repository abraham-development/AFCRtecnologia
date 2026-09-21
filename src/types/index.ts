/**
 * Contratos de datos de AFCRtecnologia.
 * Todo el contenido editorial vive en `src/content/*` y se tipa aqui.
 */

export type GlyphKey = 'agents' | 'automation' | 'sales' | 'software';

export interface Solution {
  id: string;
  index: string;
  title: string;
  description: string;
  impact: string;
  glyph: GlyphKey;
  href: string;
}

export interface MethodStep {
  index: string;
  title: string;
  summary: string;
  detail: string;
  deliverable: string;
}

export interface CaseStudy {
  id: string;
  index: string;
  title: string;
  sector: string;
  problem: string;
  architecture: string;
  stack: string[];
  metrics: { label: string; value: string }[];
}

export interface Service {
  id: string;
  index: string;
  title: string;
  description: string;
  bullets: string[];
  duration: string;
}

export interface Capability {
  index: string;
  title: string;
  preview: string;
  href: string;
}

export interface Resource {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  href: string;
  visual: 'grid' | 'wave' | 'orbit';
}

export interface Metric {
  value: number;
  suffix: string;
  prefix?: string;
  decimals?: number;
  label: string;
  caption: string;
}

export interface NavItem {
  index: string;
  label: string;
  href: string;
  meta: string;
}

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  variant: 'success' | 'error';
  title: string;
  description?: string;
}
