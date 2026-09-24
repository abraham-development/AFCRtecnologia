'use client';

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import type { PointerEvent, ReactNode } from 'react';

import { useIsFinePointer } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface CursorPreviewProps {
  /** Clave de la fila bajo el cursor; `null` oculta el panel. */
  activeKey: string | null;
  /** Contenido del panel para la fila activa. */
  preview: ReactNode;
  children: ReactNode;
  className?: string;
  /** Ancho del panel en px (para que no se salga del contenedor). */
  width?: number;
}

const OFFSET = 28;
const SPRING = { stiffness: 320, damping: 32, mass: 0.5 };

/**
 * Panel flotante que sigue al cursor dentro de una lista y muestra una
 * vista previa de la fila activa. Es decorativo (`aria-hidden`): repite
 * informacion que ya esta en la fila. Solo con puntero fino y sin
 * `prefers-reduced-motion`.
 *
 * Posicion en el wrapper (transform) y forma en el hijo (escala/opacidad),
 * la misma separacion que usa `CustomCursor`.
 */
export function CursorPreview({ activeKey, preview, children, className, width = 300 }: CursorPreviewProps) {
  const reduced = useReducedMotion();
  const finePointer = useIsFinePointer();
  const enabled = finePointer && !reduced;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    // Si no cabe a la derecha del cursor, el panel pasa a la izquierda
    rawX.set(localX + OFFSET + width > rect.width ? localX - OFFSET - width : localX + OFFSET);
    rawY.set(localY + OFFSET);
  };

  return (
    <div onPointerMove={handleMove} className={cn('relative', className)}>
      {children}

      {enabled ? (
        <motion.div
          aria-hidden="true"
          style={{ x, y, width }}
          className="pointer-events-none absolute top-0 left-0 z-20 hidden lg:block"
        >
          <AnimatePresence mode="wait">
            {activeKey ? (
              <motion.div
                key={activeKey}
                initial={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.15 } }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="border-accent-cyan/40 bg-bg-darkest origin-top-left border p-5"
              >
                {preview}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </div>
  );
}

export default CursorPreview;
