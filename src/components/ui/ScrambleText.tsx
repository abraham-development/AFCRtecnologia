'use client';

import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#_-';

interface ScrambleTextProps {
  text: string;
  /** Cada vez que pasa a `true`, el texto se vuelve a descifrar (p. ej. hover del padre). */
  active?: boolean;
  /** Descifra una vez al entrar en pantalla. */
  playOnView?: boolean;
  /** Duracion total del descifrado en ms. */
  duration?: number;
  className?: string;
}

/**
 * Texto que se «descifra» letra a letra. Pensado para etiquetas mono.
 * El texto real va en `sr-only`; la version animada es decorativa.
 */
export function ScrambleText({
  text,
  active = false,
  playOnView = false,
  duration = 650,
  className,
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(text);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    let observer: IntersectionObserver | undefined;

    const run = () => {
      cancelAnimationFrame(frame);
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const revealed = Math.floor(progress * text.length);
        let output = '';
        for (let index = 0; index < text.length; index += 1) {
          const char = text[index]!;
          output +=
            char === ' ' || index < revealed ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setDisplay(output);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    };

    if (active) run();

    const node = ref.current;
    if (playOnView && node) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          observer?.disconnect();
          run();
        },
        { threshold: 0.6 },
      );
      observer.observe(node);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [active, playOnView, duration, reduced, text]);

  return (
    <span ref={ref} className={cn('relative', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{reduced ? text : display}</span>
    </span>
  );
}

export default ScrambleText;
