'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

interface PageIntroProps {
  title: string;
  lede?: string;
  /** Pieza propia de cada pagina a la derecha del titular (contador, canal, etc.). */
  aside?: ReactNode;
  /** Id del h1 para `aria-labelledby` de la seccion. */
  titleId?: string;
}

/**
 * Cabecera de las paginas interiores. El titular entra desde una mascara
 * (clip-path) una sola vez: es el momento de entrada de cada pagina.
 */
export function PageIntro({ title, lede, aside, titleId }: PageIntroProps) {
  return (
    <header className="shell pt-40 pb-16 md:pt-48 md:pb-24">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-8">
          <motion.h1
            id={titleId}
            initial={{ clipPath: 'inset(0 0 100% 0)', y: 24 }}
            animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.1 }}
            className="font-serif text-[clamp(2.75rem,7vw,6rem)] leading-[0.98] font-light tracking-[-0.04em] text-balance"
          >
            {title}
          </motion.h1>

          {lede ? (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
              className="text-text-secondary mt-8 max-w-[56ch] text-lg leading-relaxed md:text-xl"
            >
              {lede}
            </motion.p>
          ) : null}
        </div>

        {aside ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
            className="lg:col-span-4"
          >
            {aside}
          </motion.div>
        ) : null}
      </div>
    </header>
  );
}

export default PageIntro;
