'use client';

import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';

import HorizontalMarquee from '@/components/ui/HorizontalMarquee';
import ScrambleText from '@/components/ui/ScrambleText';
import TiltCard from '@/components/ui/TiltCard';
import { aboutCopy, audiences, principles, processSteps, techStack } from '@/content/agency';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Para quien trabajamos: cada perfil se inclina hacia el cursor y lleva a sus servicios. */
function Audiences() {
  return (
    <section aria-labelledby="audiencias-title" className="shell">
      <h2 id="audiencias-title" className="text-display-xs">
        {aboutCopy.audiencesTitle}
      </h2>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {audiences.map((audience) => (
          <li key={audience.title} className="sm:last:odd:col-span-2 lg:last:odd:col-span-1">
            <TiltCard
              className="h-full"
              innerClassName="border-border-editorial hover:border-accent-cyan/50 bg-bg-secondary border transition-colors duration-500"
            >
              <Link
                href={`/servicios#${audience.serviceGroupId}`}
                data-cursor="expand"
                className="group flex h-full min-h-72 flex-col p-7 md:p-8"
              >
                <p className="font-serif text-3xl leading-tight font-light tracking-[-0.02em]">{audience.title}</p>
                <p className="text-text-secondary mt-5 leading-relaxed">{audience.body}</p>
                <span className="text-micro text-accent-cyan group-hover:text-text-primary mt-auto inline-flex items-center gap-2 pt-10 transition-colors">
                  {aboutCopy.audienceLink}
                  <ArrowUpRight
                    size={13}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            </TiltCard>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Proceso: en pantallas anchas (xl) las 4 etapas van en fila y la que esta bajo
 * el cursor se ensancha y enciende su linea superior. En tablet es una
 * cuadricula 2x2 y en movil una lista: ahi no hay espacio para ceder ancho.
 */
function Process() {
  const [active, setActive] = useState(0);

  return (
    <section aria-labelledby="proceso-title" className="shell">
      <h2 id="proceso-title" className="text-display-xs">
        {aboutCopy.processTitle}
      </h2>

      <ol className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:flex xl:gap-4">
        {processSteps.map((step, index) => {
          const isActive = active === index;
          return (
            <motion.li
              key={step.index}
              onPointerEnter={() => setActive(index)}
              animate={{ flexGrow: isActive ? 2.1 : 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative min-w-0 pt-8 xl:basis-0"
            >
              <span aria-hidden="true" className="bg-border-editorial absolute top-0 left-0 h-px w-full" />
              <span
                aria-hidden="true"
                className={cn(
                  'bg-accent-cyan absolute top-0 left-0 h-px w-full origin-left transition-[scale] duration-700 ease-(--ease-editorial)',
                  isActive ? 'scale-x-100' : 'scale-x-0',
                )}
              />

              <span
                className={cn(
                  'text-data inline-flex h-9 min-w-9 items-center justify-center border px-2 tabular-nums transition-colors duration-500',
                  isActive ? 'border-accent-cyan text-accent-cyan' : 'border-border-editorial text-text-secondary',
                )}
              >
                {step.index}
              </span>
              <p
                className={cn(
                  'mt-6 font-serif leading-tight font-light tracking-[-0.02em] transition-colors duration-500',
                  'text-2xl xl:text-[1.75rem]',
                  isActive ? 'text-text-primary' : 'text-text-primary xl:text-text-secondary',
                )}
              >
                {step.title}
              </p>
              <p
                className="text-text-secondary mt-3 max-w-[40ch] leading-relaxed"
              >
                {step.body}
              </p>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

/** Principios: el titulo se descifra al pasar por la fila. */
function Principles() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section aria-labelledby="principios-title" className="shell grid gap-10 lg:grid-cols-12 lg:gap-16">
      <h2 id="principios-title" className="text-display-xs lg:col-span-4">
        {aboutCopy.principlesTitle}
      </h2>

      <ul className="lg:col-span-8" onPointerLeave={() => setHovered(null)}>
        {principles.map((principle) => (
          <li
            key={principle.title}
            onPointerEnter={() => setHovered(principle.title)}
            className="group border-border-editorial grid gap-3 border-t py-8 last:border-b md:grid-cols-12 md:gap-8"
          >
            <h3 className="text-text-primary group-hover:text-accent-cyan text-[0.9375rem] tracking-[0.08em] uppercase transition-colors md:col-span-5">
              <ScrambleText text={principle.title} active={hovered === principle.title} className="font-mono" />
            </h3>
            <p className="text-text-secondary leading-relaxed md:col-span-7">{principle.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AboutContent() {
  return (
    <div className="hairline-t space-y-24 pt-20 md:space-y-32 md:pt-28">
      <Audiences />
      <Process />
      <Principles />

      {/* Herramientas con las que trabajamos */}
      <div className="border-border-editorial border-t py-6">
        <HorizontalMarquee items={techStack} duration={46} />
      </div>
    </div>
  );
}

export default AboutContent;
