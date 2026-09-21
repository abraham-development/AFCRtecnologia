'use client';

import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

import SectionBadge from '@/components/ui/SectionBadge';
import { resources } from '@/content/resources';
import type { Resource } from '@/types';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Visual generativo monocromatico: sin imagenes, sin peticiones extra. */
function ResourceVisual({ kind }: { kind: Resource['visual'] }) {
  return (
    <svg
      viewBox="0 0 480 360"
      aria-hidden="true"
      className="h-full w-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {kind === 'grid' ? (
        <>
          {Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: 12 }, (_, col) => (
              <rect
                key={`${row}-${col}`}
                x={col * 40}
                y={row * 40}
                width="40"
                height="40"
                opacity={((row * 7 + col * 3) % 5) / 9 + 0.08}
              />
            )),
          )}
          <circle cx="240" cy="180" r="92" opacity="0.9" />
          <circle cx="240" cy="180" r="52" opacity="0.5" />
          <line x1="0" y1="180" x2="480" y2="180" opacity="0.35" />
        </>
      ) : null}

      {kind === 'wave' ? (
        <>
          {Array.from({ length: 22 }, (_, index) => {
            const y = 20 + index * 15;
            const amplitude = 26 - Math.abs(index - 11) * 1.6;
            return (
              <path
                key={index}
                d={`M0 ${y} C 120 ${y - amplitude}, 240 ${y + amplitude}, 480 ${y - amplitude * 0.6}`}
                opacity={0.3 + (11 - Math.abs(index - 11)) / 22}
              />
            );
          })}
        </>
      ) : null}

      {kind === 'orbit' ? (
        <>
          {[40, 80, 120, 160].map((radius, index) => (
            <ellipse
              key={radius}
              cx="240"
              cy="180"
              rx={radius}
              ry={radius * 0.52}
              opacity={0.6 - index * 0.1}
              transform={`rotate(${index * 22} 240 180)`}
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (index * 60 * Math.PI) / 180;
            return (
              <circle
                key={index}
                cx={240 + Math.cos(angle) * 150}
                cy={180 + Math.sin(angle) * 78}
                r="4"
                fill="currentColor"
                opacity="0.8"
              />
            );
          })}
          <circle cx="240" cy="180" r="10" fill="currentColor" opacity="0.9" />
        </>
      ) : null}
    </svg>
  );
}

export function Resources() {
  return (
    <section id="recursos" aria-labelledby="recursos-title" className="hairline-t py-chapter scroll-mt-20">
      <div className="shell">
        <SectionBadge index="08" title="RECURSOS & CRITERIO" meta="NOTAS TÉCNICAS DEL EQUIPO" />

        <h2 id="recursos-title" className="text-display-sm mt-10 max-w-[22ch] md:mt-14">
          Análisis, perspectivas y guías de arquitectura.
        </h2>

        <div className="mt-12 grid gap-px md:mt-16 md:grid-cols-3">
          {resources.map((resource, index) => (
            <motion.article
              key={resource.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, ease: EASE, delay: index * 0.08 }}
              className="border-border-editorial bg-bg-primary group border"
            >
              <a
                href={resource.href}
                data-cursor="expand"
                className="flex h-full flex-col"
                aria-label={`Leer: ${resource.title}`}
              >
                {/* Visual */}
                <div className="border-border-editorial relative aspect-[4/3] overflow-hidden border-b">
                  <div className="text-border-editorial absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-104">
                    <ResourceVisual kind={resource.visual} />
                  </div>
                  <div className="bg-accent-cyan/0 group-hover:bg-accent-cyan/10 absolute inset-0 transition-colors duration-500" />
                </div>

                {/* Contenido */}
                <div className="flex flex-1 flex-col p-6 md:p-7">
                  <p className="text-micro text-accent-cyan">{resource.category}</p>

                  <h3 className="text-display-xs group-hover:text-accent-cyan mt-4 transition-colors duration-300">
                    {resource.title}
                  </h3>

                  <p className="text-text-secondary mt-4 flex-1 text-sm leading-relaxed">
                    {resource.excerpt}
                  </p>

                  <div className="border-border-editorial mt-6 flex items-center justify-between border-t pt-4">
                    <p className="text-micro text-text-secondary">
                      {resource.date} · {resource.readingTime}
                    </p>
                    <ArrowUpRight
                      size={15}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="text-text-secondary group-hover:text-accent-cyan transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </div>
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Resources;
