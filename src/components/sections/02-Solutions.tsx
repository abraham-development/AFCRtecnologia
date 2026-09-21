'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useCallback, useState } from 'react';

import SectionBadge from '@/components/ui/SectionBadge';
import { solutions } from '@/content/solutions';
import type { GlyphKey } from '@/types';
import { cn, scrollToSection } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/* -------------------------------------------------------------------------- */
/*  Grafico abstracto por solucion                                             */
/* -------------------------------------------------------------------------- */

function SolutionGlyph({ kind }: { kind: GlyphKey }) {
  const reduced = useReducedMotion();
  const spin = reduced
    ? undefined
    : { rotate: 360, transition: { duration: 58, ease: 'linear' as const, repeat: Infinity } };

  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-hidden="true"
      className="text-border-editorial h-auto w-full"
      fill="none"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    >
      <rect x="0.5" y="0.5" width="399" height="399" stroke="currentColor" opacity="0.6" />

      {kind === 'agents' ? (
        <>
          <motion.g animate={spin} style={{ originX: '200px', originY: '200px' }}>
            <circle cx="200" cy="200" r="150" stroke="currentColor" strokeDasharray="2 10" />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const radians = (angle * Math.PI) / 180;
              const x = 200 + Math.cos(radians) * 150;
              const y = 200 + Math.sin(radians) * 150;
              return (
                <g key={angle}>
                  <line x1="200" y1="200" x2={x} y2={y} stroke="currentColor" opacity="0.7" />
                  <circle cx={x} cy={y} r="5" fill="#5BC2D8" opacity="0.85" />
                </g>
              );
            })}
          </motion.g>
          <circle cx="200" cy="200" r="42" stroke="#5BC2D8" />
          <circle cx="200" cy="200" r="7" fill="#5BC2D8" />
        </>
      ) : null}

      {kind === 'automation' ? (
        <>
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={70 + col * 100}
                y={70 + row * 100}
                width="60"
                height="60"
                stroke="currentColor"
                opacity={row === col ? 0 : 0.8}
              />
            )),
          )}
          <motion.path
            d="M100 100 H230 V200 H330 V300 H130"
            stroke="#5BC2D8"
            strokeDasharray="6 8"
            animate={reduced ? undefined : { strokeDashoffset: [0, -56] }}
            transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
          />
          <circle cx="100" cy="100" r="5" fill="#5BC2D8" />
          <rect x="70" y="70" width="60" height="60" stroke="#5BC2D8" />
          <rect x="270" y="270" width="60" height="60" stroke="#5BC2D8" />
        </>
      ) : null}

      {kind === 'sales' ? (
        <>
          <line x1="60" y1="330" x2="340" y2="330" stroke="currentColor" />
          <line x1="60" y1="330" x2="60" y2="60" stroke="currentColor" />
          {[
            [100, 250],
            [150, 205],
            [200, 220],
            [250, 150],
            [300, 95],
          ].map(([x, y], index) => (
            <motion.rect
              key={x}
              x={(x as number) - 14}
              y={y as number}
              width="28"
              height={330 - (y as number)}
              stroke={index >= 3 ? '#5BC2D8' : 'currentColor'}
              initial={reduced ? undefined : { scaleY: 0 }}
              whileInView={reduced ? undefined : { scaleY: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: EASE, delay: index * 0.08 }}
              style={{ originY: '330px' }}
            />
          ))}
          <path d="M100 250 L150 205 L200 220 L250 150 L300 95" stroke="#5BC2D8" opacity="0.5" />
          <circle cx="300" cy="95" r="6" fill="#5BC2D8" />
        </>
      ) : null}

      {kind === 'software' ? (
        <>
          <rect x="70" y="70" width="260" height="260" stroke="currentColor" />
          <motion.rect
            x="110"
            y="110"
            width="180"
            height="180"
            stroke="#5BC2D8"
            opacity="0.85"
            animate={reduced ? undefined : { rotate: [0, 90] }}
            transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
            style={{ originX: '200px', originY: '200px' }}
          />
          <rect x="160" y="160" width="80" height="80" stroke="currentColor" />
          <path d="M70 200 H110 M290 200 H330 M200 70 V110 M200 290 V330" stroke="#5BC2D8" />
          <circle cx="200" cy="200" r="4" fill="#5BC2D8" />
        </>
      ) : null}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Carrusel editorial                                                         */
/* -------------------------------------------------------------------------- */

export function Solutions() {
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);
  const total = solutions.length;
  const solution = solutions[index]!;

  const paginate = useCallback(
    (step: number) => {
      setState(([current]) => [(current + step + total) % total, step]);
    },
    [total],
  );

  return (
    <section
      id="soluciones"
      aria-labelledby="soluciones-title"
      className="hairline-t py-chapter relative scroll-mt-20"
    >
      <div className="shell">
        <SectionBadge index="02" title="SOLUCIONES" meta={`${total} SISTEMAS · 01–0${total}`} />

        <h2 id="soluciones-title" className="text-display-sm mt-10 max-w-[18ch] md:mt-14">
          Cuatro sistemas. Un solo objetivo.
        </h2>

        {/* Carrusel */}
        <div
          role="group"
          aria-roledescription="carrusel"
          aria-label="Soluciones de IA"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              paginate(1);
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              paginate(-1);
            }
          }}
          className="border-border-editorial mt-12 border-t md:mt-16"
        >
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.article
              key={solution.id}
              custom={direction}
              initial={{ opacity: 0, x: direction >= 0 ? 48 : -48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -32 : 32 }}
              transition={{ duration: 0.45, ease: EASE }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70) paginate(1);
                else if (info.offset.x > 70) paginate(-1);
              }}
              className="grid cursor-grab touch-pan-y items-center gap-10 py-10 active:cursor-grabbing lg:grid-cols-12 lg:gap-16 lg:py-14"
            >
              <div className="lg:col-span-7">
                <span className="text-border-editorial block font-mono text-6xl leading-none font-light md:text-8xl">
                  {solution.index}
                </span>

                <h3 className="text-display-xs mt-5 md:mt-6">{solution.title}</h3>

                <p className="text-text-secondary mt-5 max-w-xl text-base leading-relaxed">
                  {solution.description}
                </p>

                <div className="border-accent-cyan mt-8 border-l pl-5">
                  <p className="text-micro text-accent-cyan">IMPACTO DE NEGOCIO</p>
                  <p className="text-text-primary mt-2 text-sm leading-relaxed">{solution.impact}</p>
                </div>

                <button
                  type="button"
                  data-cursor="expand"
                  onClick={() => scrollToSection(solution.href, -72)}
                  className="text-micro text-text-primary hover:text-accent-cyan group mt-8 inline-flex items-center gap-2 transition-colors"
                >
                  EXPLORAR SOLUCIÓN
                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.5}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </button>
              </div>

              <div className="lg:col-span-5">
                <div className="bg-bg-secondary/40 border-border-editorial mx-auto max-w-sm border p-6 lg:max-w-none">
                  <SolutionGlyph kind={solution.glyph} />
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          {/* Controles */}
          <div className="border-border-editorial flex items-center justify-between gap-6 border-t py-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-cursor="expand"
                onClick={() => paginate(-1)}
                aria-label="Solución anterior"
                className="border-border-editorial text-text-primary hover:border-accent-cyan hover:text-accent-cyan flex h-11 w-11 items-center justify-center border transition-colors"
              >
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                data-cursor="expand"
                onClick={() => paginate(1)}
                aria-label="Siguiente solución"
                className="border-border-editorial text-text-primary hover:border-accent-cyan hover:text-accent-cyan flex h-11 w-11 items-center justify-center border transition-colors"
              >
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-1 items-center gap-2">
              {solutions.map((item, position) => (
                <button
                  key={item.id}
                  type="button"
                  data-cursor="expand"
                  onClick={() => setState([position, position > index ? 1 : -1])}
                  aria-label={`Ver ${item.title}`}
                  aria-current={position === index}
                  className="group h-8 flex-1"
                >
                  <span
                    className={cn(
                      'block h-px w-full transition-colors duration-300',
                      position === index
                        ? 'bg-accent-cyan'
                        : 'bg-border-editorial group-hover:bg-text-secondary',
                    )}
                  />
                </button>
              ))}
            </div>

            <p className="text-micro text-text-secondary tabular-nums" aria-live="polite">
              <span className="text-text-primary">{solution.index}</span> / 0{total}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Solutions;
