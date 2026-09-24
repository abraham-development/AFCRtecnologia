'use client';

import { ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { useEffect, useSyncExternalStore } from 'react';

import ParticleText from '@/components/effects/ParticleText';
import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import KeyBadge from '@/components/ui/KeyBadge';
import { agency, CONTACT_FORM_HREF } from '@/content/agency';
import { homeCopy } from '@/content/pages';
import { HEADER_OFFSET, isAppReady, markAppReady, scrollToSection, subscribeAppReady } from '@/lib/utils';

/** Three.js solo en cliente: fuera del bundle inicial y del HTML del servidor. */
const WebGLHeroBackground = dynamic(() => import('@/components/effects/WebGLHeroBackground'), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="webgl-fallback noise absolute inset-0" />,
});

const EASE = [0.16, 1, 0.3, 1] as const;

/** Presupuesto total de particulas, repartido por longitud de palabra. */
const PARTICLE_BUDGET = 9000;
const TOTAL_LETTERS = homeCopy.headline.reduce(
  (sum, line) => sum + line.words.reduce((count, word) => count + word.length, 0),
  0,
);

const rise = {
  hidden: { opacity: 0, y: 34 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE, delay },
  }),
};

export function Hero() {
  // El estado vive fuera de React (lo publica el preloader), asi que lo leemos
  // como un store externo: sin setState en efectos ni desajustes de hidratacion.
  const ready = useSyncExternalStore(subscribeAppReady, isAppReady, () => false);

  useEffect(() => {
    // Red de seguridad: si el preloader falla, el hero entra igual.
    const fallback = window.setTimeout(markAppReady, 2600);
    return () => window.clearTimeout(fallback);
  }, []);

  const animate = ready ? 'visible' : 'hidden';

  return (
    <section
      id="hero"
      aria-label="Inicio"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-34 pb-8 md:pt-38 md:pb-10"
    >
      <WebGLHeroBackground />

      {/* Lecho de contraste para garantizar AA sobre el WebGL */}
      <div
        aria-hidden="true"
        className="from-bg-primary via-bg-primary/45 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent"
      />

      <div className="shell relative z-10 flex flex-1 flex-col justify-center py-12 md:py-16">
        {/* Todo el titular es de particulas: cada palabra es un lienzo propio
            para que el texto pueda partirse en lineas en pantallas estrechas.
            Usa la Fraunces estatica (font-hero): Canvas 2D no admite ejes
            variables y asi particulas y texto real miden y dibujan lo mismo. */}
        <h1 className="text-display font-hero max-w-[16ch]">
          {homeCopy.headline.map((line, lineIndex) => (
            <motion.span
              key={line.words.join(' ')}
              className="block"
              initial={{ opacity: 0, y: 34, filter: 'blur(10px)' }}
              animate={
                ready
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : { opacity: 0, y: 34, filter: 'blur(10px)' }
              }
              transition={{ duration: 1.1, ease: EASE, delay: 0.15 + lineIndex * 0.17 }}
            >
              {line.words.map((word, wordIndex) => (
                <span key={word}>
                  {wordIndex > 0 ? ' ' : null}
                  <ParticleText
                    text={word}
                    active={ready}
                    variant={line.variant}
                    maxParticles={Math.round((PARTICLE_BUDGET * word.length) / TOTAL_LETTERS)}
                  />
                </span>
              ))}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial="hidden"
          animate={animate}
          variants={rise}
          custom={0.5}
          className="text-text-secondary mt-8 max-w-xl text-base leading-relaxed md:mt-10 md:text-lg"
        >
          {agency.description}
        </motion.p>

        <motion.div
          initial="hidden"
          animate={animate}
          variants={rise}
          custom={0.62}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-12"
        >
          <ButtonMagnetic variant="solid" href={CONTACT_FORM_HREF} aria-label={homeCopy.primaryCtaLabel}>
            {homeCopy.primaryCta}
            <KeyBadge keyLabel="E" tone="dark" />
          </ButtonMagnetic>

          <ButtonMagnetic variant="ghost" href="/servicios" aria-label={homeCopy.secondaryCta}>
            {homeCopy.secondaryCta}
            <KeyBadge keyLabel="S" />
          </ButtonMagnetic>
        </motion.div>
      </div>

      {/* Pie del hero: datos duros + invitacion a bajar a las noticias */}
      <motion.div
        initial="hidden"
        animate={animate}
        variants={rise}
        custom={0.8}
        className="shell relative z-10"
      >
        <div className="border-border-editorial grid grid-cols-2 gap-x-6 gap-y-6 border-t pt-6 md:grid-cols-4">
          {homeCopy.facts.map((fact) => (
            <div key={fact.label}>
              <p className="text-micro text-text-secondary">{fact.label}</p>
              <p className="text-data text-text-primary mt-2">{fact.value}</p>
            </div>
          ))}
          <div className="flex items-end md:justify-end">
            <button
              type="button"
              data-cursor="expand"
              onClick={() => scrollToSection('noticias', HEADER_OFFSET)}
              className="text-micro text-text-secondary hover:text-accent-cyan group flex min-h-11 items-center gap-2 transition-colors"
              aria-label={homeCopy.scrollLabel}
            >
              {homeCopy.scroll}
              <ArrowDown
                size={14}
                strokeWidth={1.5}
                className="transition-transform duration-500 group-hover:translate-y-1"
              />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;
