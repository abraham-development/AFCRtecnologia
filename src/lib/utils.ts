/** Utilidades compartidas (sin dependencias externas). */

/** Concatena clases condicionales sin traer clsx/tailwind-merge. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Interpolacion lineal. */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/** Restringe un valor a un rango. */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

/** Normaliza un valor dentro de un rango a 0..1. */
export function mapRange(value: number, inMin: number, inMax: number): number {
  if (inMax === inMin) return 0;
  return clamp((value - inMin) / (inMax - inMin));
}

/** Formatea un indice numerico como capitulo editorial: 1 -> "01". */
export function pad(index: number): string {
  return index.toString().padStart(2, '0');
}

/* -------------------------------------------------------------------------- */
/*  Scroll                                                                     */
/* -------------------------------------------------------------------------- */

type LenisLike = {
  scrollTo: (target: HTMLElement | string | number, options?: Record<string, unknown>) => void;
  stop?: () => void;
  start?: () => void;
};

declare global {
  interface Window {
    __afcrLenis?: LenisLike;
    __afcrReady?: boolean;
  }
}

/**
 * Scroll suave hacia una seccion. Usa Lenis si esta disponible;
 * si no (o con `prefers-reduced-motion`), cae a la API nativa.
 */
export function scrollToSection(id: string, offset = 0): void {
  if (typeof window === 'undefined') return;
  const target = document.getElementById(id.replace('#', ''));
  if (!target) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lenis = window.__afcrLenis;

  if (lenis && !reduced) {
    lenis.scrollTo(target, { offset, duration: 1.2 });
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}

/* -------------------------------------------------------------------------- */
/*  Ciclo de arranque (Preloader -> Hero)                                      */
/* -------------------------------------------------------------------------- */

export const READY_EVENT = 'afcr:ready';

/** El preloader anuncia que la pagina puede animar su entrada. */
export function markAppReady(): void {
  if (typeof window === 'undefined' || window.__afcrReady) return;
  window.__afcrReady = true;
  window.dispatchEvent(new Event(READY_EVENT));
}

export function isAppReady(): boolean {
  return typeof window !== 'undefined' && window.__afcrReady === true;
}

/** Suscripcion para `useSyncExternalStore`: evita setState dentro de efectos. */
export function subscribeAppReady(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(READY_EVENT, onChange);
  return () => window.removeEventListener(READY_EVENT, onChange);
}

/* -------------------------------------------------------------------------- */
/*  Entorno                                                                    */
/* -------------------------------------------------------------------------- */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches;
}

/** Deteccion de WebGL sin instanciar Three.js. */
export function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}
