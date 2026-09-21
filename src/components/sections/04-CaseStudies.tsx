'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import SectionBadge from '@/components/ui/SectionBadge';
import { caseStudies } from '@/content/cases';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;
/** Transicion rapida del panel maestro: 280ms exactos. */
const PANEL_TRANSITION = { duration: 0.28, ease: EASE };

export function CaseStudies() {
  const [active, setActive] = useState(0);
  const study = caseStudies[active]!;

  return (
    <section id="casos" aria-labelledby="casos-title" className="hairline-t py-chapter scroll-mt-20">
      <div className="shell">
        <SectionBadge index="04" title="CASOS DE USO" meta="SISTEMAS EN PRODUCCIÓN" />

        <h2 id="casos-title" className="text-display-sm mt-10 max-w-[18ch] md:mt-14">
          IA trabajando en el mundo real.
        </h2>

        <div className="border-border-editorial mt-12 grid border-t lg:grid-cols-12 lg:gap-0 md:mt-16">
          {/* Indice de proyectos */}
          <nav
            aria-label="Índice de casos de uso"
            className="border-border-editorial lg:col-span-5 lg:border-r"
          >
            <ul>
              {caseStudies.map((item, index) => {
                const selected = index === active;
                return (
                  <li key={item.id} className="border-border-editorial border-b">
                    <button
                      type="button"
                      data-cursor="expand"
                      aria-current={selected}
                      onClick={() => setActive(index)}
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      className="group block w-full py-6 pr-6 text-left transition-colors lg:py-7"
                    >
                      <span className="flex items-baseline gap-4">
                        <span
                          className={cn(
                            'text-micro shrink-0 transition-colors',
                            selected ? 'text-accent-cyan' : 'text-text-secondary',
                          )}
                        >
                          {item.index}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'text-display-xs block transition-all duration-300',
                              selected
                                ? 'text-accent-cyan translate-x-1.5'
                                : 'text-text-primary group-hover:translate-x-1',
                            )}
                          >
                            {item.title}
                          </span>
                          <span className="text-micro text-text-secondary mt-2 block">
                            {item.sector}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Panel maestro */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.article
                key={study.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={PANEL_TRANSITION}
                aria-live="polite"
                className="flex h-full flex-col justify-between gap-10 py-8 lg:py-10 lg:pl-12"
              >
                <div>
                  <p className="text-micro text-accent-cyan">EL PROBLEMA</p>
                  <p className="text-text-primary mt-3 max-w-2xl leading-relaxed">{study.problem}</p>

                  <p className="text-micro text-accent-cyan mt-8">LA ARQUITECTURA</p>
                  <p className="text-text-secondary mt-3 max-w-2xl leading-relaxed">
                    {study.architecture}
                  </p>

                  <p className="text-micro text-text-secondary mt-8">STACK</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {study.stack.map((tech) => (
                      <li
                        key={tech}
                        className="text-micro text-text-primary border-border-editorial bg-bg-secondary/50 border px-2.5 py-1.5"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resultado */}
                <dl className="border-border-editorial grid grid-cols-3 gap-6 border-t pt-6">
                  {study.metrics.map((metric) => (
                    <div key={metric.label} className="flex flex-col-reverse">
                      <dt className="text-micro text-text-secondary mt-2">{metric.label}</dt>
                      <dd className="text-accent-cyan font-serif text-3xl leading-none tracking-[-0.03em] md:text-4xl">
                        {metric.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CaseStudies;
