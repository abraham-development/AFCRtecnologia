'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useState, type MouseEvent } from 'react';

import SectionBadge from '@/components/ui/SectionBadge';
import { capabilities } from '@/content/capabilities';
import { useIsFinePointer } from '@/hooks/useMediaQuery';
import { cn, scrollToSection } from '@/lib/utils';

export function Capabilities() {
  const [hovered, setHovered] = useState<number | null>(null);
  const finePointer = useIsFinePointer();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 320, damping: 30, mass: 0.4 });
  const y = useSpring(pointerY, { stiffness: 320, damping: 30, mass: 0.4 });

  const trackPointer = (event: MouseEvent<HTMLDivElement>) => {
    if (!finePointer) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(event.clientX - rect.left + 28);
    pointerY.set(event.clientY - rect.top - 28);
  };

  return (
    <section
      id="capacidades"
      aria-labelledby="capacidades-title"
      className="hairline-t py-chapter scroll-mt-20"
    >
      <div className="shell">
        <SectionBadge index="06" title="CAPACIDADES" meta="DIRECTORIO TÉCNICO · 01–07" />

        <h2 id="capacidades-title" className="sr-only">
          Capacidades técnicas de AFCRtecnologia
        </h2>
      </div>

      <div
        className="relative mt-12 md:mt-16"
        onMouseMove={trackPointer}
        onMouseLeave={() => setHovered(null)}
      >
        <ul className="border-border-editorial border-t">
          {capabilities.map((capability, index) => {
            const isActive = hovered === index;

            return (
              <li key={capability.index} className="border-border-editorial border-b">
                <a
                  href={capability.href}
                  data-cursor="expand"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection(capability.href, -72);
                  }}
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  className="group shell flex items-center gap-6 py-6 md:gap-10 md:py-8"
                >
                  <span
                    className={cn(
                      'text-micro w-8 shrink-0 transition-colors duration-300',
                      isActive ? 'text-accent-cyan' : 'text-text-secondary',
                    )}
                  >
                    {capability.index}
                  </span>

                  <span
                    className={cn(
                      'text-display-xs flex-1 transition-[color,transform] duration-300 ease-out',
                      isActive
                        ? 'text-accent-cyan translate-x-2.5'
                        : 'text-text-primary group-focus-visible:translate-x-2.5',
                    )}
                  >
                    {capability.title}
                  </span>

                  <span className="text-text-secondary hidden max-w-xs flex-1 text-sm lg:block">
                    {capability.preview}
                  </span>

                  <ArrowRight
                    size={18}
                    strokeWidth={1.25}
                    aria-hidden="true"
                    className={cn(
                      'shrink-0 transition-all duration-300',
                      isActive ? 'text-accent-cyan -rotate-45' : 'text-text-secondary',
                    )}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        {/* Previsualizacion flotante (solo puntero fino) */}
        {finePointer ? (
          <motion.div
            aria-hidden="true"
            style={{ x, y }}
            animate={{ opacity: hovered === null ? 0 : 1, scale: hovered === null ? 0.94 : 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="border-accent-cyan/40 bg-bg-darkest/90 pointer-events-none absolute top-0 left-0 z-20 hidden w-64 border p-4 backdrop-blur-sm lg:block"
          >
            <p className="text-micro text-accent-cyan">
              {hovered === null ? '' : `CAPACIDAD ${capabilities[hovered]!.index}`}
            </p>
            <p className="text-text-primary mt-2 text-sm leading-relaxed">
              {hovered === null ? '' : capabilities[hovered]!.preview}
            </p>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

export default Capabilities;
