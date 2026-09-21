'use client';

import { ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { useEffect, useSyncExternalStore } from 'react';

import ParticleText from '@/components/effects/ParticleText';
import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import KeyBadge from '@/components/ui/KeyBadge';
import SectionBadge from '@/components/ui/SectionBadge';
import { agency } from '@/content/agency';
import { isAppReady, markAppReady, scrollToSection, subscribeAppReady } from '@/lib/utils';

/** Three.js solo en cliente: fuera del bundle inicial y del HTML del servidor. */
const WebGLHeroBackground = dynamic(() => import('@/components/effects/WebGLHeroBackground'), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="webgl-fallback noise absolute inset-0" />,
});

const EASE = [0.16, 1, 0.3, 1] as const;

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
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-24 pb-8 md:pt-28 md:pb-10"
    >
      <WebGLHeroBackground />

      {/* Lecho de contraste para garantizar AA sobre el WebGL */}
      <div
        aria-hidden="true"
        className="from-bg-primary via-bg-primary/45 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent"
      />

      <div className="shell relative z-10">
        <motion.div initial="hidden" animate={animate} variants={rise} custom={0.05}>
          <SectionBadge index="01" title="HERO" meta={`${agency.city.toUpperCase()} · ${agency.timezone}`} />
        </motion.div>
      </div>

      <div className="shell relative z-10 flex flex-1 flex-col justify-center py-12 md:py-16">
        <h1 className="text-display max-w-[16ch]">
          <motion.span
            className="block"
            initial="hidden"
            animate={animate}
            variants={rise}
            custom={0.15}
          >
            Inteligencia artificial
          </motion.span>

          <motion.span
            className="block"
            initial={{ opacity: 0, y: 34, filter: 'blur(10px)' }}
            animate={
              ready
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 34, filter: 'blur(10px)' }
            }
            transition={{ duration: 1.1, ease: EASE, delay: 0.32 }}
          >
            <ParticleText text="que trabaja." active={ready} />
          </motion.span>
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
          <ButtonMagnetic
            variant="solid"
            aria-label="Empezar un proyecto: ir al formulario de contacto"
            onClick={() => {
              scrollToSection('contacto', -40);
              window.setTimeout(
                () => document.getElementById('contact-name')?.focus({ preventScroll: true }),
                1100,
              );
            }}
          >
            Empezar un proyecto
            <KeyBadge keyLabel="E" tone="dark" />
          </ButtonMagnetic>

          <ButtonMagnetic
            variant="ghost"
            aria-label="Ver soluciones"
            onClick={() => scrollToSection('soluciones', -72)}
          >
            Ver soluciones
            <KeyBadge keyLabel="S" />
          </ButtonMagnetic>
        </motion.div>
      </div>

      {/* Pie del hero: datos duros + invitacion a bajar */}
      <motion.div
        initial="hidden"
        animate={animate}
        variants={rise}
        custom={0.8}
        className="shell relative z-10"
      >
        <div className="border-border-editorial grid grid-cols-2 gap-x-6 gap-y-6 border-t pt-6 md:grid-cols-4">
          <div>
            <p className="text-micro text-text-secondary">BASE</p>
            <p className="text-data text-text-primary mt-2">
              {agency.city}, {agency.country}
            </p>
          </div>
          <div>
            <p className="text-micro text-text-secondary">ENFOQUE</p>
            <p className="text-data text-text-primary mt-2">Agentes · Automatización · Software</p>
          </div>
          <div>
            <p className="text-micro text-text-secondary">RESPUESTA</p>
            <p className="text-data text-text-primary mt-2">&lt; 24 horas hábiles</p>
          </div>
          <div className="flex items-end md:justify-end">
            <button
              type="button"
              data-cursor="expand"
              onClick={() => scrollToSection('soluciones', -72)}
              className="text-micro text-text-secondary hover:text-accent-cyan group flex items-center gap-2 transition-colors"
              aria-label="Desplazarse a la siguiente sección"
            >
              DESPLAZAR
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
