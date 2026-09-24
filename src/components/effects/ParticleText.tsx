'use client';

import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface Particle {
  /** Posicion de reposo (CSS px dentro del canvas). */
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 = cian, 1 = blanco hueso. */
  tone: 0 | 1;
}

interface ParticleTextProps {
  text: string;
  /** Arranca el ensamblado (lo dispara el preloader a traves del Hero). */
  active?: boolean;
  className?: string;
  /**
   * Tono dominante: `accent` = mayormente cian (texto de respaldo cian),
   * `primary` = mayormente blanco hueso (texto de respaldo claro).
   */
  variant?: 'accent' | 'primary';
  /** Presupuesto de particulas: varias instancias en pantalla se lo reparten. */
  maxParticles?: number;
}

/** Proporcion de particulas en tono hueso y opacidad de ese tono, por variante. */
const VARIANTS = {
  accent: { boneRatio: 0.22, boneAlpha: 0.55, fallback: 'text-accent-cyan' },
  primary: { boneRatio: 0.84, boneAlpha: 0.94, fallback: 'text-text-primary' },
} as const;

/** Margen alrededor del texto para que las particulas puedan salirse sin recorte. */
const PAD = 32;
const REPEL_RADIUS = 110;
const REPEL_FORCE = 620;
const SPRING = 0.085;
const DAMPING = 0.8;
const DEFAULT_MAX_PARTICLES = 7000;

/**
 * Texto compuesto por particulas cian que se dispersan al paso del cursor
 * y vuelven a agruparse. El texto real permanece en el DOM (invisible pero
 * accesible); si el canvas no puede montarse, se muestra con acento cian.
 */
export function ParticleText({
  text,
  active = true,
  className,
  variant = 'accent',
  maxParticles = DEFAULT_MAX_PARTICLES,
}: ParticleTextProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sampled, setSampled] = useState(false);
  const reduced = usePrefersReducedMotion();

  /** El canvas solo sustituye al texto si hay particulas y el motor corre. */
  const enabled = sampled && active && !reduced;

  useEffect(() => {
    if (reduced || !active) return;

    const wrap = wrapRef.current;
    const textEl = textRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !textEl || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { boneRatio, boneAlpha } = VARIANTS[variant];
    let particles: Particle[] = [];
    let frame = 0;
    let dpr = 1;
    let cssWidth = 0;
    let cssHeight = 0;
    let rect = canvas.getBoundingClientRect();
    let rectDirty = true;
    let inView = true;
    let disposed = false;

    const pointer = { x: -9999, y: -9999 };

    /* ----- Muestreo del texto -------------------------------------------- */
    const build = () => {
      if (disposed) return;

      const styles = window.getComputedStyle(textEl);
      const fontSize = parseFloat(styles.fontSize) || 16;
      const lineHeight =
        styles.lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(styles.lineHeight) || fontSize * 1.2;
      const font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
      // Canvas 2D ignora `letter-spacing`: sin esto el trazado saldria mas
      // ancho que el texto real y no calzaria con la linea superior.
      const tracking = styles.letterSpacing === 'normal' ? '0px' : styles.letterSpacing;

      dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Metricas: necesitamos la linea base exacta para calzar con el DOM
      const measureCtx = document.createElement('canvas').getContext('2d');
      if (!measureCtx) return;
      measureCtx.font = font;
      if ('letterSpacing' in measureCtx) measureCtx.letterSpacing = tracking;
      const metrics = measureCtx.measureText(text);

      const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || fontSize * 0.8;
      const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || fontSize * 0.2;
      const textWidth = Math.ceil(metrics.width);
      const halfLeading = (lineHeight - (ascent + descent)) / 2;
      const baseline = PAD + halfLeading + ascent;

      cssWidth = textWidth + PAD * 2;
      cssHeight = Math.ceil(lineHeight) + PAD * 2;

      canvas.style.left = `${-PAD}px`;
      canvas.style.top = `${-PAD}px`;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);

      // Render fuera de pantalla para leer los pixeles con tinta
      const off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      const offCtx = off.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.scale(dpr, dpr);
      offCtx.font = font;
      if ('letterSpacing' in offCtx) offCtx.letterSpacing = tracking;
      offCtx.textBaseline = 'alphabetic';
      offCtx.fillStyle = '#ffffff';
      offCtx.fillText(text, PAD, baseline);

      // Paso de muestreo: cuanto menor, mas densa la letra. Se ajusta solo
      // hacia arriba si el presupuesto de particulas se desborda.
      let step = Math.max(2, Math.round((fontSize / 60) * dpr));
      let sampled: Particle[] = [];

      // Si el muestreo se dispara, aumentamos el paso hasta entrar en presupuesto
      for (let attempt = 0; attempt < 4; attempt += 1) {
        sampled = [];
        const image = offCtx.getImageData(0, 0, off.width, off.height).data;

        for (let y = 0; y < off.height; y += step) {
          for (let x = 0; x < off.width; x += step) {
            const alpha = image[(y * off.width + x) * 4 + 3] ?? 0;
            // Umbral bajo: los trazos finos de Fraunces (travesaño de la «e») tambien reciben particulas
            if (alpha < 48) continue;

            const hx = x / dpr;
            const hy = y / dpr;
            sampled.push({
              hx,
              hy,
              x: hx + (Math.random() - 0.5) * cssWidth * 0.35,
              y: hy + (Math.random() - 0.5) * cssHeight * 1.1,
              vx: 0,
              vy: 0,
              tone: Math.random() < boneRatio ? 1 : 0,
            });
          }
        }

        if (sampled.length <= maxParticles) break;
        step += 1;
      }

      particles = sampled;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rectDirty = true;
      setSampled(particles.length > 0);
    };

    /* ----- Bucle de animacion -------------------------------------------- */
    const draw = () => {
      if (rectDirty) {
        rect = canvas.getBoundingClientRect();
        rectDirty = false;
      }

      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;
      const radiusSq = REPEL_RADIUS * REPEL_RADIUS;

      ctx.clearRect(0, 0, cssWidth, cssHeight);

      for (const particle of particles) {
        const dx = particle.x - px;
        const dy = particle.y - py;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < radiusSq && distanceSq > 0.01) {
          const distance = Math.sqrt(distanceSq);
          const force = (1 - distance / REPEL_RADIUS) * (REPEL_FORCE / distance);
          particle.vx += (dx / distance) * force * 0.016;
          particle.vy += (dy / distance) * force * 0.016;
        }

        particle.vx = (particle.vx + (particle.hx - particle.x) * SPRING) * DAMPING;
        particle.vy = (particle.vy + (particle.hy - particle.y) * SPRING) * DAMPING;
        particle.x += particle.vx;
        particle.y += particle.vy;
      }

      // Dos pasadas: una por tono, para no cambiar fillStyle por particula
      ctx.fillStyle = 'rgba(91, 194, 216, 0.92)';
      for (const particle of particles) {
        if (particle.tone === 0) ctx.fillRect(particle.x, particle.y, 1.7, 1.7);
      }

      ctx.fillStyle = `rgba(232, 229, 221, ${boneAlpha})`;
      for (const particle of particles) {
        if (particle.tone === 1) ctx.fillRect(particle.x, particle.y, 1.7, 1.7);
      }

      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (frame || !inView || document.hidden || particles.length === 0) return;
      frame = requestAnimationFrame(draw);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    /* ----- Eventos -------------------------------------------------------- */
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const invalidateRect = () => {
      rectDirty = true;
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    let resizeTimer = 0;
    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        start();
      }, 180);
    });

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting);
        if (inView) start();
        else stop();
      },
      { threshold: 0 },
    );

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('scroll', invalidateRect, { passive: true });
    window.addEventListener('resize', invalidateRect, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    resizeObserver.observe(wrap);
    intersectionObserver.observe(wrap);

    // Las metricas solo son fiables con la tipografia ya cargada
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const ready = fonts?.ready ?? Promise.resolve();
    void ready.then(() => {
      if (disposed) return;
      build();
      start();
    });

    return () => {
      disposed = true;
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('scroll', invalidateRect);
      window.removeEventListener('resize', invalidateRect);
      document.removeEventListener('visibilitychange', onVisibility);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [text, active, reduced, variant, maxParticles]);

  return (
    <span ref={wrapRef} className={cn('relative inline-block align-baseline', className)}>
      <span
        ref={textRef}
        className={cn(
          'relative z-10 block transition-opacity duration-700',
          enabled ? 'opacity-0' : cn(VARIANTS[variant].fallback, 'opacity-100'),
        )}
      >
        {text}
      </span>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute z-0 max-w-none"
      />
    </span>
  );
}

export default ParticleText;
