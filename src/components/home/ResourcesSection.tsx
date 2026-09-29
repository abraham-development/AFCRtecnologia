'use client';

import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import TiltCard from '@/components/ui/TiltCard';
import { CONTACT_FORM_HREF } from '@/content/agency';
import { resources, resourcesCopy } from '@/content/resources';
import type { Resource } from '@/types';

const EASE = [0.16, 1, 0.3, 1] as const;

const CARD =
  'group flex h-full flex-col px-6 py-6 md:px-8 md:py-7';

function ResourceCardBody({ resource }: { resource: Resource }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-micro text-accent-cyan">{resource.kind.toUpperCase()}</span>
        {resource.sample ? (
          <span className="text-micro border-border-editorial text-text-secondary border px-2 py-1">
            {resourcesCopy.sampleLabel}
          </span>
        ) : null}
      </div>
      <h3 className="mt-6 font-serif text-2xl leading-[1.15] font-light tracking-[-0.02em] text-balance transition-colors duration-300 group-hover:text-accent-cyan md:text-[1.65rem]">
        {resource.name}
      </h3>
      <p className="text-text-secondary mt-3 leading-[1.5]">{resource.description}</p>
      <span className="text-micro text-text-primary group-hover:text-accent-cyan mt-auto inline-flex items-center gap-2 pt-8 transition-colors">
        {resource.cta ?? resourcesCopy.contactCta}
        <ArrowUpRight
          size={14}
          strokeWidth={1.5}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
    </>
  );
}

/** Ficha: con `href` abre el enlace externo; sin el, lleva al formulario de contacto. */
function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <TiltCard
      max={3}
      className="h-full"
      innerClassName="border-border-editorial hover:border-accent-cyan/50 bg-bg-secondary h-full border transition-colors duration-500"
    >
      {resource.href ? (
        <a href={resource.href} target="_blank" rel="noopener noreferrer" data-cursor="expand" className={CARD}>
          <ResourceCardBody resource={resource} />
        </a>
      ) : (
        <Link href={CONTACT_FORM_HREF} data-cursor="expand" className={CARD}>
          <ResourceCardBody resource={resource} />
        </Link>
      )}
    </TiltCard>
  );
}

/** Seccion de la Home bajo el titulo «Recursos» del pie del hero. */
export function ResourcesSection() {
  return (
    <section aria-labelledby="recursos-title" className="pb-chapter">
      <div className="shell mt-8 md:mt-10">
        {resources.length > 0 ? (
          <ul className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {resources.map((resource, index) => (
              <motion.li
                key={resource.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 3) * 0.06 }}
              >
                <ResourceCard resource={resource} />
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary">{resourcesCopy.empty}</p>
        )}
      </div>
    </section>
  );
}

export default ResourcesSection;
