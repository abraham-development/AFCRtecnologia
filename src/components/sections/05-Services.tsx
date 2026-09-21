'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import SectionBadge from '@/components/ui/SectionBadge';
import { editorialQuote, services } from '@/content/services';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Services() {
  const [open, setOpen] = useState<string | null>(services[0]!.id);

  return (
    <section id="servicios" aria-labelledby="servicios-title" className="hairline-t py-chapter scroll-mt-20">
      <div className="shell">
        <SectionBadge index="05" title="SERVICIOS DE IA" meta="5 CAPACIDADES · UNA CAPA" />

        <h2 id="servicios-title" className="text-display-sm mt-10 max-w-[18ch] md:mt-14">
          Una capa de IA. Cinco capacidades.
        </h2>

        {/* Acordeon de gran formato */}
        <div className="border-border-editorial mt-12 border-t md:mt-16">
          {services.map((service) => {
            const expanded = open === service.id;

            return (
              <div key={service.id} className="border-border-editorial border-b">
                <h3>
                  <button
                    type="button"
                    data-cursor="expand"
                    aria-expanded={expanded}
                    aria-controls={`panel-${service.id}`}
                    id={`accordion-${service.id}`}
                    onClick={() => setOpen(expanded ? null : service.id)}
                    className="group flex w-full items-center gap-5 py-6 text-left md:gap-8 md:py-8"
                  >
                    <span
                      className={cn(
                        'text-micro shrink-0 transition-colors',
                        expanded ? 'text-accent-cyan' : 'text-text-secondary',
                      )}
                    >
                      {service.index}
                    </span>

                    <span
                      className={cn(
                        'text-display-xs flex-1 transition-colors duration-300',
                        expanded ? 'text-accent-cyan' : 'text-text-primary group-hover:text-accent-cyan',
                      )}
                    >
                      {service.title}
                    </span>

                    <span
                      className={cn(
                        'border-border-editorial flex h-9 w-9 shrink-0 items-center justify-center border transition-colors',
                        expanded
                          ? 'border-accent-cyan text-accent-cyan'
                          : 'text-text-secondary group-hover:border-accent-cyan/60',
                      )}
                    >
                      {expanded ? (
                        <Minus size={15} strokeWidth={1.5} />
                      ) : (
                        <Plus size={15} strokeWidth={1.5} />
                      )}
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      key={`panel-${service.id}`}
                      id={`panel-${service.id}`}
                      role="region"
                      aria-labelledby={`accordion-${service.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-8 pb-10 md:grid-cols-12 md:gap-12 md:pl-[4.5rem]">
                        <p className="text-text-secondary leading-relaxed md:col-span-6">
                          {service.description}
                        </p>

                        <ul className="md:col-span-4">
                          {service.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="text-text-primary border-border-editorial flex gap-3 border-b py-2.5 text-sm last:border-b-0"
                            >
                              <span aria-hidden="true" className="text-accent-cyan mt-1.5 block h-px w-3 bg-current" />
                              {bullet}
                            </li>
                          ))}
                        </ul>

                        <div className="md:col-span-2">
                          <p className="text-micro text-text-secondary">DURACIÓN</p>
                          <p className="text-text-primary mt-2 text-sm">{service.duration}</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Cita editorial */}
        <motion.figure
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mx-auto mt-20 max-w-4xl text-center md:mt-28"
        >
          <span aria-hidden="true" className="bg-accent-cyan mx-auto block h-px w-10" />

          <blockquote className="text-display-sm mt-8 text-balance">
            <p>“{editorialQuote}”</p>
          </blockquote>

          <figcaption className="text-micro text-text-secondary mt-8">
            AFCRTECNOLOGIA · PRINCIPIO OPERATIVO
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}

export default Services;
