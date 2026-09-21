'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

interface HorizontalMarqueeProps {
  items: string[];
  /** Duracion de un ciclo completo en segundos. */
  duration?: number;
  className?: string;
  separator?: string;
}

/**
 * Marquesina infinita por CSS (sin coste de JS por frame).
 * La pista se duplica y se traslada -50%: el bucle es invisible.
 */
export function HorizontalMarquee({
  items,
  duration = 42,
  className,
  separator = '·',
}: HorizontalMarqueeProps) {
  const [paused, setPaused] = useState(false);
  const track = [...items, ...items];

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Desvanecidos laterales */}
      <div className="from-bg-primary pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r to-transparent sm:w-32" />
      <div className="from-bg-primary pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l to-transparent sm:w-32" />

      <div
        className="marquee-track"
        data-paused={paused ? 'true' : 'false'}
        style={{ ['--marquee-duration' as string]: `${duration}s` }}
      >
        {track.map((item, index) => (
          <span
            key={`${item}-${index}`}
            aria-hidden={index >= items.length ? 'true' : undefined}
            className="text-micro text-text-secondary flex shrink-0 items-center gap-6 pr-6 sm:gap-10 sm:pr-10"
          >
            {item}
            <span className="text-accent-cyan/50">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default HorizontalMarquee;
