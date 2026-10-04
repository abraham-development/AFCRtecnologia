'use client';

import { useRef } from 'react';

import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import { CONTACT_FORM_HREF } from '@/content/agency';
import { homeCopy } from '@/content/pages';
import { useGlowPause } from '@/hooks/useGlowPause';

/**
 * Card de accion del hero: reune los dos CTA bajo un contorno de luz en loop.
 * El resplandor es CSS (`.glow-card` en globals.css); aqui solo se pausa
 * cuando la card sale de pantalla o la pestana se oculta.
 */
export function HeroActionCard() {
  const ref = useRef<HTMLDivElement>(null);

  useGlowPause(ref);

  return (
    <div ref={ref} role="group" aria-labelledby="hero-action-title" className="glow-card relative isolate">
      {/* Capas de luz: halo difuso detras y anillo nitido encima de la superficie */}
      <span aria-hidden="true" className="glow-card-halo" />

      <div className="noise bg-bg-darkest relative rounded-xs p-6 sm:p-8 lg:p-6 xl:p-8 short:p-5">
        <p className="text-micro text-accent-cyan">{homeCopy.actionCard.eyebrow}</p>
        <p id="hero-action-title" className="text-display-xs mt-4 text-balance">
          {homeCopy.actionCard.title}
        </p>

        <div className="mt-8 flex flex-col gap-3 short:mt-5">
          <ButtonMagnetic
            variant="solid"
            href={CONTACT_FORM_HREF}
            aria-label={homeCopy.primaryCtaLabel}
            strength={0.15}
            className="w-full"
          >
            {homeCopy.primaryCta}
          </ButtonMagnetic>

          <ButtonMagnetic
            variant="ghost"
            href="/servicios"
            aria-label={homeCopy.secondaryCta}
            strength={0.15}
            className="w-full"
          >
            {homeCopy.secondaryCta}
          </ButtonMagnetic>
        </div>
      </div>

      <span aria-hidden="true" className="glow-card-ring" />
    </div>
  );
}

export default HeroActionCard;
