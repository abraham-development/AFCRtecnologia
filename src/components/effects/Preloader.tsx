'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { agency } from '@/content/agency';
import { markAppReady } from '@/lib/utils';

const STORAGE_KEY = 'afcr:preloaded';
const DURATION = 1400;

/** easeOutCubic: el contador desacelera al acercarse a 100. */
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Cortina de carga. Cuenta 00 -> 100 en 1.4s como maximo y se abre
 * verticalmente con una mascara. Solo se muestra una vez por sesion.
 */
export function Preloader() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  /** Visita recurrente o movimiento reducido: se desmonta sin animar. */
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      alreadySeen = false;
    }

    if (alreadySeen || reduced) {
      markAppReady();
      // En el siguiente frame, fuera del efecto: nada de renders en cascada.
      const immediate = requestAnimationFrame(() => setSkip(true));
      return () => cancelAnimationFrame(immediate);
    }

    document.body.style.overflow = 'hidden';
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / DURATION);
      setCount(Math.round(ease(raw) * 100));

      if (raw < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }

      try {
        window.sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* modo privado: no persistimos, no pasa nada */
      }
      setDone(true);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!done || skip) return;
    document.body.style.overflow = '';
    // El hero empieza a animar en cuanto la cortina comienza a abrirse.
    const timer = window.setTimeout(markAppReady, 180);
    return () => window.clearTimeout(timer);
  }, [done, skip]);

  return (
    <>
      {/* Sin JavaScript no hay cortina que abrir */}
      <noscript>
        <style>{`.afcr-preloader{display:none !important}`}</style>
      </noscript>

      <AnimatePresence>
        {!done && !skip ? (
          <motion.div
            key="preloader"
            className="afcr-preloader bg-bg-darkest noise fixed inset-0 z-[200] flex flex-col justify-between p-6 md:p-10"
            initial={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            aria-hidden="true"
          >
            <span className="text-micro text-text-secondary">{agency.tagline}</span>

            <div className="flex items-end justify-between gap-6">
              <p className="font-serif text-2xl leading-none tracking-[-0.03em] md:text-3xl">
                AFCR<span className="text-text-secondary">tecnologia</span>
              </p>

              <p className="font-mono text-[clamp(3rem,14vw,9rem)] leading-[0.8] font-light tabular-nums">
                {count.toString().padStart(2, '0')}
              </p>
            </div>

            {/* Barra de progreso */}
            <div className="bg-border-editorial relative mt-6 h-px w-full overflow-hidden">
              <motion.span
                className="bg-accent-cyan absolute inset-y-0 left-0 block w-full origin-left"
                style={{ scaleX: count / 100 }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default Preloader;
