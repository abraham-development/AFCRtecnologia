'use client';

import { useEffect, useRef } from 'react';

import { useIsFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery';

const INTERACTIVE = 'a, button, summary, [data-cursor="expand"]';
const TEXT_ENTRY = 'input, textarea, select, [contenteditable="true"]';

const LEAN_MAX = 14;

/**
 * Puntero de un trazo: la punta es el hotspot y el cuerpo no la persigue.
 * Solo en punteros finos y sin `prefers-reduced-motion`.
 */
export function CustomCursor() {
  const finePointer = useIsFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = finePointer && !reduced;

  const posRef = useRef<HTMLSpanElement | null>(null);
  const glyphRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const pos = posRef.current;
    const glyph = glyphRef.current;
    if (!pos || !glyph) return;

    const root = document.documentElement;
    root.classList.add('afcr-cursor');

    const target = { x: 0, y: 0 };
    const previous = { x: 0, y: 0 };
    let lean = 0;
    let visible = false;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;

      const node = event.target instanceof Element ? event.target : null;
      const typing = Boolean(node?.closest(TEXT_ENTRY));
      const active = Boolean(node?.closest(INTERACTIVE));

      pos.dataset.expanded = !typing && active ? 'true' : 'false';
      pos.dataset.typing = typing ? 'true' : 'false';

      if (!visible) {
        visible = true;
        previous.x = target.x;
        previous.y = target.y;
      }

      pos.style.opacity = typing ? '0' : '1';
    };

    const onLeave = () => {
      visible = false;
      pos.style.opacity = '0';
    };

    const onDown = () => {
      pos.dataset.pressed = 'true';
    };
    const onUp = () => {
      pos.dataset.pressed = 'false';
    };

    const render = () => {
      const dx = target.x - previous.x;
      const dy = target.y - previous.y;
      previous.x = target.x;
      previous.y = target.y;

      pos.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;

      const speed = Math.hypot(dx, dy);
      let desired = 0;
      if (speed > 0.6) {
        const motion = Math.atan2(dy, dx);
        const rest = Math.atan2(1, 0.28);
        const delta = Math.atan2(Math.sin(motion - rest), Math.cos(motion - rest));
        desired = Math.max(-LEAN_MAX, Math.min(LEAN_MAX, (delta * 180) / Math.PI * 0.28));
      }

      lean += (desired - lean) * (speed > 0.6 ? 0.5 : 0.28);
      glyph.style.transform = `rotate(${lean.toFixed(2)}deg)`;

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
      {/* Wrapper = posicion (transform). Hijo = inclinacion y escala. */}
      <span
        ref={posRef}
        data-expanded="false"
        data-pressed="false"
        data-typing="false"
        className="group absolute top-0 left-0 block opacity-0 transition-opacity duration-150 will-change-transform"
      >
        <span
          ref={glyphRef}
          className="block origin-top-left transition-[scale] duration-150 ease-editorial will-change-transform group-data-[pressed=true]:scale-90"
        >
          <svg
            width="14"
            height="16"
            viewBox="0 0 14 16"
            fill="none"
            className="overflow-visible text-text-primary"
          >
            <path d="M0.5 0.5 L10.2 6.6 L3.4 10.4 Z" fill="currentColor" />
            <path d="M6.2 8.2 L9.4 13.2" stroke="currentColor" strokeWidth="1" />
            <path
              d="M0.5 0.5 L8.6 2.4"
              strokeWidth="1"
              className="stroke-accent-cyan opacity-0 transition-opacity duration-150 group-data-[expanded=true]:opacity-100"
            />
          </svg>
        </span>
      </span>
    </div>
  );
}

export default CustomCursor;
