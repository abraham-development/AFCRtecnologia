'use client';

import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { HEADER_OFFSET, scrollToSection, scrollToTop } from '@/lib/utils';

/**
 * Scroll suave global (Lenis). Se expone en `window.__afcrLenis`
 * para que el menu y los atajos de teclado puedan controlarlo.
 * Con `prefers-reduced-motion` no se instancia: scroll nativo.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();

  /* Cambio de pagina: cada ruta empieza arriba, salvo que traiga un ancla
     (p. ej. /servicios#ia o /contacto#formulario). Se espera un frame para
     que la pagina nueva ya este en el DOM. */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const frame = requestAnimationFrame(() => {
      if (hash) scrollToSection(hash, HEADER_OFFSET);
      else scrollToTop(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

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
