'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import HorizontalMarquee from '@/components/ui/HorizontalMarquee';
import SectionBadge from '@/components/ui/SectionBadge';
import { manifesto, metrics, techStack } from '@/content/agency';
import type { Metric } from '@/types';

const EASE = [0.16, 1, 0.3, 1] as const;
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Contador animado al entrar al viewport (IntersectionObserver). */
function MetricCounter({ metric }: { metric: Metric }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        if (reduced) {
          setValue(metric.value);
          return;
        }

        const duration = 1700;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          setValue(metric.value * easeOutExpo(progress));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [metric.value]);

  return (
    <div ref={ref} className="border-border-editorial border-t pt-5">
      <p className="text-accent-cyan font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-none font-light tracking-[-0.04em] tabular-nums">
        {metric.prefix}
        {value.toFixed(metric.decimals ?? 0)}
        {metric.suffix}
      </p>
      <p className="text-text-primary mt-4 text-sm">{metric.label}</p>
      <p className="text-text-secondary mt-1.5 text-xs leading-relaxed">{metric.caption}</p>
    </div>
  );
}

export function Agency() {
  return (
    <section id="agencia" aria-labelledby="agencia-title" className="hairline-t py-chapter scroll-mt-20">
      <div className="shell">
        <SectionBadge index="07" title="AGENCIA" meta="MANIFIESTO · MÉTRICAS · STACK" />

        <h2 id="agencia-title" className="text-display-sm mt-10 max-w-[18ch] md:mt-14">
          Tecnología avanzada. Impacto medible.
        </h2>

        {/* Metricas */}
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {metrics.map((metric) => (
            <MetricCounter key={metric.label} metric={metric} />
          ))}
        </div>

        {/* Manifiesto */}
        <div className="mt-20 grid gap-10 md:mt-28 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-micro text-accent-cyan">MANIFIESTO</p>
            <p className="text-display-xs mt-5">
              Cómo trabajamos cuando nadie está mirando.
            </p>
          </div>

          <div className="lg:col-span-8">
            {manifesto.map((principle, index) => (
              <motion.article
                key={principle.index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: EASE, delay: index * 0.08 }}
                className="border-border-editorial grid gap-4 border-t py-7 md:grid-cols-12 md:gap-8"
              >
                <p className="text-micro text-text-secondary md:col-span-1">{principle.index}</p>
                <h3 className="text-text-primary text-lg md:col-span-4">{principle.title}</h3>
                <p className="text-text-secondary leading-relaxed md:col-span-7">{principle.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>

      {/* Marquesina tecnologica */}
      <div className="border-border-editorial mt-20 border-y py-6 md:mt-28">
        <HorizontalMarquee items={techStack} duration={46} />
      </div>
    </section>
  );
}

export default Agency;
