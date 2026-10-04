'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { PRELOAD_DONE_EVENT, PRELOADER_ID } from '@/components/effects/preloader-script';
import BrandLogo from '@/components/ui/BrandLogo';
import { agency } from '@/content/agency';
import { markAppReady } from '@/lib/utils';

declare global {
  interface Window {
    /** Estado del conteo que publica PRELOADER_SCRIPT (layout.tsx). */
    __afcrPreload?: { done: boolean };
  }
}

/**
 * Cortina de carga en cada carga completa del sitio (navegar entre paginas no
 * la repite: vive en el layout). El conteo 00 -> 100 y la barra los mueve
 * PRELOADER_SCRIPT, en linea justo despues de este componente, para que corran
 * desde el primer cuadro sin esperar a la hidratacion. Aqui solo se abre la
 * cortina con una mascara vertical cuando el conteo avisa que llego a 100.
 */
export function Preloader() {
  const [done, setDone] = useState(false);
  /** Movimiento reducido: el script ya la oculto; se desmonta sin animar. */
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const finish = () => {
      // En el siguiente frame, fuera del efecto: nada de renders en cascada.
      frame = requestAnimationFrame(() => (reduced ? setSkip(true) : setDone(true)));
    };

    if (reduced) markAppReady();

    // El conteo pudo terminar antes de hidratar (telefono lento) o despues.
    if (window.__afcrPreload?.done) finish();
    else window.addEventListener(PRELOAD_DONE_EVENT, finish, { once: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(PRELOAD_DONE_EVENT, finish);
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
            id={PRELOADER_ID}
            className="afcr-preloader bg-bg-darkest noise fixed inset-0 z-[200] flex flex-col justify-between p-6 md:p-10"
            initial={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            aria-hidden="true"
          >
            <span className="text-micro text-text-secondary">{agency.tagline}</span>

            <div className="flex items-end justify-between gap-6">
              <BrandLogo priority sizes="296px" className="h-[clamp(2.75rem,9vw,5rem)] min-w-0 shrink" />

              {/* El texto lo escribe el script: React no debe corregirlo al hidratar */}
              <p
                data-preload-count
                suppressHydrationWarning
                className="font-mono text-[clamp(3rem,14vw,9rem)] leading-[0.8] font-light tabular-nums"
              >
                00
              </p>
            </div>

            {/* Barra de progreso (escala la mueve el script) */}
            <div className="bg-border-editorial relative mt-6 h-px w-full overflow-hidden">
              <span
                data-preload-bar
                suppressHydrationWarning
                className="bg-accent-cyan absolute inset-y-0 left-0 block w-full origin-left"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default Preloader;
