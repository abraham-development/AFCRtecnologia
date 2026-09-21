'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useRef, type MouseEvent, type PointerEvent, type ReactNode } from 'react';

import { useIsFinePointer } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface ButtonMagneticProps {
  children: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  variant?: 'solid' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  external?: boolean;
  className?: string;
  'aria-label'?: string;
  /** Intensidad del efecto magnetico (0 lo desactiva). */
  strength?: number;
}

const BASE =
  'group relative inline-flex items-center justify-center gap-3 rounded-xs px-6 py-4 text-sm tracking-[0.02em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS = {
  solid: 'bg-text-primary text-bg-darkest hover:bg-accent-cyan',
  ghost:
    'border border-border-editorial text-text-primary hover:border-accent-cyan/60 hover:bg-accent-cyan-glow',
} as const;

/**
 * Boton con atraccion magnetica al cursor.
 * Se desactiva en punteros gruesos y con `prefers-reduced-motion`.
 */
export function ButtonMagnetic({
  children,
  href,
  onClick,
  variant = 'solid',
  type = 'button',
  disabled = false,
  external = false,
  className,
  strength = 0.32,
  ...rest
}: ButtonMagneticProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const finePointer = useIsFinePointer();
  const magnetic = Boolean(strength) && !reduced && finePointer && !disabled;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 22, mass: 0.35 });
  const y = useSpring(rawY, { stiffness: 260, damping: 22, mass: 0.35 });

  const handleMove = (event: PointerEvent<HTMLElement>) => {
    if (!magnetic || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rawX.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    rawY.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const shared = {
    ref: ref as never,
    className: cn(BASE, VARIANTS[variant], className),
    style: { x, y },
    onPointerMove: handleMove,
    onPointerLeave: reset,
    onBlur: reset,
    'data-cursor': 'expand' as const,
    ...rest,
  };

  if (href) {
    return (
      <motion.a
        {...shared}
        href={href}
        onClick={onClick}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button {...shared} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </motion.button>
  );
}

export default ButtonMagnetic;
