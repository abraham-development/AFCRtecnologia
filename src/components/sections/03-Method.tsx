'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { useRef, useState } from 'react';

import SectionBadge from '@/components/ui/SectionBadge';
import { methodSteps } from '@/content/method';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/* Nodos del recorrido en coordenadas del viewBox (260 x 660). */
const VIEWBOX_CENTER = 130;
const NODES: [number, number][] = [
  [130, 30],
  [198, 130],
  [62, 230],
  [190, 330],
  [58, 430],
  [186, 530],
  [128, 630],
];

/** Catmull-Rom -> Bezier: la curva pasa exactamente por cada nodo. */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return '';

  let d = `M ${points[0][0]} ${points[0][1]}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }

  return d;
}

const PATH = smoothPath(NODES);

export function Method() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  const drawn = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.min(methodSteps.length - 1, Math.max(0, Math.floor(value * methodSteps.length)));
    setActive((current) => (current === next ? current : next));
  });

  const step = methodSteps[active]!;

  return (
    <section id="metodo" aria-labelledby="metodo-title" className="hairline-t relative scroll-mt-20">
      <div className="shell pt-chapter pb-12 md:pb-16">
        <SectionBadge index="03" title="MÉTODO" meta="7 ETAPAS · DESCUBRIR → OPTIMIZAR" />

        <h2 id="metodo-title" className="text-display-sm mt-10 max-w-[20ch] md:mt-14">
          Un sistema claro. De la idea al resultado.
        </h2>
      </div>

      {/* ---------------- Desktop: recorrido sticky ---------------- */}
      <div
        ref={trackRef}
        className="relative hidden h-[700vh] lg:block"
        aria-hidden="true"
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="shell grid w-full grid-cols-12 items-center gap-16">
            {/* Linea vectorial + nodos */}
            <div className="col-span-5 flex justify-center">
              <svg
                viewBox="0 0 260 660"
                className="h-[62vh] w-auto overflow-visible"
                fill="none"
              >
                <path d={PATH} stroke="var(--color-border-editorial)" strokeWidth="1" />

                <motion.path
                  d={PATH}
                  stroke="var(--color-accent-cyan)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  style={{ pathLength: drawn }}
                />

                {NODES.map(([cx, cy], index) => {
                  const reached = index <= active;
                  return (
                    <g key={methodSteps[index]!.index}>
                      {reached ? (
                        <circle cx={cx} cy={cy} r="14" fill="var(--color-accent-cyan)" opacity="0.12" />
                      ) : null}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="5"
                        fill={reached ? 'var(--color-accent-cyan)' : 'var(--color-bg-primary)'}
                        stroke={reached ? 'var(--color-accent-cyan)' : 'var(--color-border-editorial)'}
                        strokeWidth="1"
                        className="transition-all duration-500"
                      />
                      <text
                        x={cx < VIEWBOX_CENTER ? cx - 16 : cx + 16}
                        y={cy + 4}
                        textAnchor={cx < VIEWBOX_CENTER ? 'end' : 'start'}
                        className="font-mono text-[11px] tracking-[0.16em]"
                        fill={
                          reached ? 'var(--color-text-primary)' : 'var(--color-border-editorial)'
                        }
                      >
                        {methodSteps[index]!.index}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Etapa activa */}
            <div className="col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.index}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <p className="text-micro text-accent-cyan">
                    ETAPA {step.index} DE 0{methodSteps.length}
                  </p>

                  <h3 className="text-display-sm mt-5">{step.title}</h3>

                  <p className="text-text-primary mt-6 max-w-2xl text-lg leading-relaxed">
                    {step.summary}
                  </p>

                  <p className="text-text-secondary mt-4 max-w-2xl leading-relaxed">{step.detail}</p>

                  <div className="border-border-editorial mt-10 border-t pt-5">
                    <p className="text-micro text-text-secondary">ENTREGABLE</p>
                    <p className="text-text-primary mt-2 text-sm">{step.deliverable}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Indicador de avance */}
              <div className="mt-12 flex items-center gap-2">
                {methodSteps.map((item, index) => (
                  <span
                    key={item.index}
                    className={cn(
                      'h-px flex-1 transition-colors duration-500',
                      index <= active ? 'bg-accent-cyan' : 'bg-border-editorial',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Mobile + lectores de pantalla ----------------
          En desktop pasa a `sr-only`: el recorrido sticky es decorativo,
          asi que el contenido completo sigue disponible para asistencia. */}
      <ol className="shell pb-chapter space-y-0 lg:sr-only">
        {methodSteps.map((item, index) => (
          <motion.li
            key={item.index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: EASE, delay: index * 0.04 }}
            className="border-border-editorial relative border-l py-6 pl-8 last:pb-0"
          >
            <span className="border-accent-cyan bg-bg-primary absolute top-8 -left-[5px] block h-2.5 w-2.5 rounded-full border" />

            <p className="text-micro text-accent-cyan">{item.index}</p>
            <h3 className="text-display-xs mt-3">{item.title}</h3>
            <p className="text-text-primary mt-3 leading-relaxed">{item.summary}</p>
            <p className="text-text-secondary mt-2 text-sm leading-relaxed">{item.detail}</p>

            <p className="text-micro text-text-secondary mt-4">
              ENTREGABLE · <span className="text-text-primary normal-case">{item.deliverable}</span>
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

export default Method;
