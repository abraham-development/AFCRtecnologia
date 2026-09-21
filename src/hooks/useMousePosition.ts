'use client';

import { useEffect, useRef, useState } from 'react';

export interface MousePosition {
  /** Coordenadas absolutas en pixeles (viewport). */
  x: number;
  y: number;
  /** Coordenadas normalizadas de -1 a 1, con origen en el centro. */
  nx: number;
  ny: number;
}

const INITIAL: MousePosition = { x: 0, y: 0, nx: 0, ny: 0 };

/**
 * Posicion del puntero. Por defecto devuelve una ref (sin re-render)
 * y, si `reactive` es true, tambien estado de React.
 */
export function useMousePosition(reactive = true) {
  const ref = useRef<MousePosition>(INITIAL);
  const [position, setPosition] = useState<MousePosition>(INITIAL);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      const next: MousePosition = {
        x: event.clientX,
        y: event.clientY,
        nx: (event.clientX / window.innerWidth) * 2 - 1,
        ny: (event.clientY / window.innerHeight) * 2 - 1,
      };
      ref.current = next;

      if (!reactive || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setPosition(next);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reactive]);

  return { position, ref };
}

export default useMousePosition;
