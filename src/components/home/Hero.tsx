'use client';

import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { useEffect, useSyncExternalStore } from 'react';

import ParticleText from '@/components/effects/ParticleText';
import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import { agency, CONTACT_FORM_HREF } from '@/content/agency';
import { newsCopy } from '@/content/news';
import { homeCopy } from '@/content/pages';
import { isAppReady, markAppReady, subscribeAppReady } from '@/lib/utils';

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
          </ButtonMagnetic>

          <ButtonMagnetic variant="ghost" href="/servicios" aria-label={homeCopy.secondaryCta}>
            {homeCopy.secondaryCta}
          </ButtonMagnetic>
        </motion.div>
      </div>

      {/* Pie del hero: el titulo de noticias ocupa el lugar de la franja de datos. */}
      <motion.div
        id="noticias"
        initial="hidden"
        animate={animate}
        variants={rise}
        custom={0.8}
        className="shell relative z-10 scroll-mt-28"
      >
        <div className="border-border-editorial border-y py-8 md:py-9">
          <h2
            id="noticias-title"
            className="mx-auto max-w-5xl font-serif text-[clamp(2rem,3.2vw,2.75rem)] leading-[1.08] font-light tracking-[-0.03em] text-balance text-center"
          >
            {newsCopy.sectionTitle}
          </h2>
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;
