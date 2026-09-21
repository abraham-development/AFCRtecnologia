'use client';

import Lenis from 'lenis';
import { useEffect, type ReactNode } from 'react';

import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Scroll suave global (Lenis). Se expone en `window.__afcrLenis`
 * para que el menu y los atajos de teclado puedan controlarlo.
 * Con `prefers-reduced-motion` no se instancia: scroll nativo.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
      gestureOrientation: 'vertical',
    });

    window.__afcrLenis = lenis;

    let frame = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete window.__afcrLenis;
    };
  }, [reduced]);

  return <>{children}</>;
}

export default SmoothScrollProvider;
