'use client';

import { useEffect, useRef } from 'react';

import { useIsFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { lerp } from '@/lib/utils';

const INTERACTIVE = 'a, button, input, textarea, select, summary, [data-cursor="expand"]';

/**
 * Cursor compuesto: punto de 4px + anillo cian de 32px con amortiguacion.
 * Solo en punteros finos y sin `prefers-reduced-motion`.
 */
export function CustomCursor() {
  const finePointer = useIsFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = finePointer && !reduced;

  const dotRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const root = document.documentElement;
    root.classList.add('afcr-cursor');

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    let visible = false;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;

      if (!visible) {
        visible = true;
        ringPos.x = target.x;
        ringPos.y = target.y;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }

      const node = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
      ring.dataset.expanded = node ? 'true' : 'false';
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const onDown = () => {
      ring.dataset.pressed = 'true';
    };
    const onUp = () => {
      ring.dataset.pressed = 'false';
    };

    const render = () => {
      // El punto sigue al puntero con casi cero latencia
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;

      // El anillo lo persigue con amortiguacion (lerp 0.15)
      ringPos.x = lerp(ringPos.x, target.x, 0.15);
      ringPos.y = lerp(ringPos.y, target.y, 0.15);
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      root.classList.remove('afcr-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[190]">
      {/* Wrapper = posicion (transform). Hijo = forma (translate/scale de Tailwind). */}
      <span
        ref={dotRef}
        className="absolute top-0 left-0 block opacity-0 transition-opacity duration-300 will-change-transform"
      >
        <span className="block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </span>

      <span
        ref={ringRef}
        data-expanded="false"
        data-pressed="false"
        className="group absolute top-0 left-0 block opacity-0 transition-opacity duration-300 will-change-transform"
      >
        <span className="border-accent-cyan block h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[scale,background-color,border-color] duration-300 ease-out group-data-[expanded=true]:scale-200 group-data-[expanded=true]:border-white/70 group-data-[expanded=true]:bg-white/10 group-data-[expanded=true]:mix-blend-difference group-data-[pressed=true]:scale-75" />
      </span>
    </div>
  );
}

export default CustomCursor;
