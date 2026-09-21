'use client';

import { useScrollProgress } from '@/hooks/useScrollProgress';

/**
 * Indicador de lectura: linea ultrafina superior + lectura numerica
 * monoespaciada flotante en el borde derecho.
 */
export function ReadingProgress() {
  const progress = useScrollProgress();
  const percent = Math.round(progress * 100);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 right-0 left-0 z-[125] h-px"
      >
        <span
          className="bg-accent-cyan block h-full w-full origin-left"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 right-4 z-[110] hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
      >
        <span className="text-micro text-text-secondary tabular-nums">
          {percent.toString().padStart(2, '0')}%
        </span>
        <span className="bg-border-editorial relative block h-24 w-px overflow-hidden">
          <span
            className="bg-accent-cyan absolute inset-x-0 top-0 block h-full origin-top"
            style={{ transform: `scaleY(${progress})` }}
          />
        </span>
      </div>
    </>
  );
}

export default ReadingProgress;
