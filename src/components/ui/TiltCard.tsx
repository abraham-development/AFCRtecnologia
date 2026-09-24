'use client';

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import type { PointerEvent, ReactNode } from 'react';

import { useIsFinePointer } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: ReactNode;
  /** Clases del contenedor exterior (lleva la perspectiva y el layout). */
  className?: string;
  /** Clases de la superficie que se inclina (borde, fondo, padding). */
  innerClassName?: string;
  /** Inclinacion maxima en grados. */
  max?: number;
}

const SPRING = { stiffness: 220, damping: 20, mass: 0.4 };

/**
 * Superficie que se inclina hacia el cursor con un brillo cian que lo sigue.
 * El contenedor lleva la perspectiva y el hijo la rotacion: asi no chocan con
 * utilidades `scale-*`/`translate-*` de Tailwind v4 (ver AGENTS.md).
 * Sin efecto en punteros tactiles o con `prefers-reduced-motion`.
 */
export function TiltCard({ children, className, innerClassName, max = 6 }: TiltCardProps) {
  const reduced = useReducedMotion();
  const finePointer = useIsFinePointer();
  const enabled = finePointer && !reduced;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, SPRING);
  const rotateY = useSpring(rawY, SPRING);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, rgba(91, 194, 216, 0.13), transparent 62%)`;

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rawY.set((px - 0.5) * 2 * max);
    rawX.set(-(py - 0.5) * 2 * max);
    glareX.set(px * 100);
    glareY.set(py * 100);
  };

  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn('group/tilt [perspective:1000px]', className)}
    >
      <motion.div
        style={enabled ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
        className={cn('relative h-full', innerClassName)}
      >
        {children}
        {enabled ? (
          <motion.span
            aria-hidden="true"
            style={{ background: glare }}
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
          />
        ) : null}
      </motion.div>
    </div>
  );
}

export default TiltCard;
