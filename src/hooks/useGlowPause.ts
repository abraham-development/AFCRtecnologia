'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Pausa la luz de contorno (`.glow-card-*` en globals.css) cuando su
 * contenedor sale de pantalla o la pestana se oculta. Escribe
 * `data-paused` en el elemento: sin setState, compatible con React Compiler.
 */
export function useGlowPause(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let inView = true;
    const sync = () => {
      element.dataset.paused = String(!inView || document.hidden);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting);
        sync();
      },
      { threshold: 0 },
    );

    document.addEventListener('visibilitychange', sync);
    observer.observe(element);

    return () => {
      document.removeEventListener('visibilitychange', sync);
      observer.disconnect();
    };
  }, [ref]);
}
