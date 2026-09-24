'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import BrandIcon from '@/components/ui/BrandIcon';
import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import CursorPreview from '@/components/ui/CursorPreview';
import {
  CONTACT_FORM_HREF,
  hasWhatsApp,
  serviceInquiry,
  whatsappLink,
  whatsappUrl,
} from '@/content/agency';
import { allServices, serviceGroups, servicesCopy } from '@/content/services';
import type { Service } from '@/types';
import { cn, HEADER_OFFSET, pad, scrollToSection } from '@/lib/utils';

const INQUIRY_CLASS =
  'text-micro text-text-primary group-hover/row:text-accent-cyan hover:text-accent-cyan -mx-3 inline-flex min-h-11 shrink-0 items-center gap-2 px-3 transition-colors';

/** Accion de cada fila: WhatsApp con el servicio precargado o, sin numero, el formulario. */
function InquiryLink({ service }: { service: Service }) {
  if (hasWhatsApp) {
    return (
      <a
        href={whatsappLink(serviceInquiry(service.title))}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="expand"
        aria-label={`Consultar por WhatsApp sobre ${service.title}`}
        className={INQUIRY_CLASS}
      >
        {servicesCopy.inquiry}
        <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link
      href={CONTACT_FORM_HREF}
      data-cursor="expand"
      aria-label={`Consultar sobre ${service.title}`}
      className={INQUIRY_CLASS}
    >
      {servicesCopy.inquiry}
      <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
    </Link>
  );
}

const jumpTo = (groupId: string) => scrollToSection(groupId, HEADER_OFFSET - 16);

export function ServicesDirectory() {
  const [activeGroup, setActiveGroup] = useState(serviceGroups[0]!.id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hovered = allServices.find((service) => service.id === hoveredId);

  /* El indice lateral marca el ultimo grupo cuyo inicio ya cruzo el 30 % superior
     del viewport; por encima del directorio vuelve al primero. */
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = serviceGroups[0]!.id;
      for (const group of serviceGroups) {
        const node = document.getElementById(group.id);
        if (node && node.getBoundingClientRect().top <= line) current = group.id;
      }
      setActiveGroup(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section aria-labelledby="catalogo-title" className="hairline-t py-chapter">
      <h2 id="catalogo-title" className="sr-only">
        {servicesCopy.directoryTitle}
      </h2>

      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
        {/* Columna fija: indice de grupos y salida directa */}
        <div className="lg:sticky lg:top-40 lg:col-span-4 lg:self-start">
          {/* Movil y tablet: saltos directos a cada grupo */}
          <nav aria-label={servicesCopy.indexLabel} className="lg:hidden">
            <ul className="border-border-editorial grid grid-cols-3 border-y">
              {serviceGroups.map((group) => (
                <li
                  key={group.id}
                  className="border-border-editorial border-l first:border-l-0 [&:first-child>a]:pl-0"
                >
                  <a
                    href={`#${group.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      jumpTo(group.id);
                    }}
                    className="hover:text-accent-cyan flex h-full min-h-16 flex-col justify-between gap-2 px-2.5 py-3 text-[0.8125rem] leading-snug hyphens-auto transition-colors"
                  >
                    {group.title}
                    <span className="text-data text-accent-cyan tabular-nums">{pad(group.services.length)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={servicesCopy.indexLabel} className="hidden lg:block">
            <ul className="border-border-editorial border-t">
              {serviceGroups.map((group) => {
                const active = activeGroup === group.id;
                return (
                  <li key={group.id} className="border-border-editorial border-b">
                    <a
                      href={`#${group.id}`}
                      data-cursor="expand"
                      aria-current={active ? 'true' : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        jumpTo(group.id);
                      }}
                      className={cn(
                        'flex items-center justify-between gap-4 py-5 transition-colors duration-300',
                        active ? 'text-accent-cyan' : 'text-text-secondary hover:text-text-primary',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'bg-accent-cyan block h-px transition-[width] duration-500 ease-(--ease-editorial)',
                            active ? 'w-8' : 'w-0',
                          )}
                        />
                        {group.title}
                      </span>
                      <span className="text-data tabular-nums">{pad(group.services.length)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {hasWhatsApp ? (
            <ButtonMagnetic
              variant="ghost"
              href={whatsappUrl}
              external
              className="mt-10 w-full sm:w-auto"
              aria-label="Escribir por WhatsApp si no encuentras el servicio que buscas"
            >
              <BrandIcon network="whatsapp" size={15} />
              {servicesCopy.fallbackCta}
            </ButtonMagnetic>
          ) : null}
        </div>

        {/* Directorio. La vista previa muestra el mensaje que se enviara por WhatsApp. */}
        <CursorPreview
          activeKey={hasWhatsApp && hovered ? hovered.id : null}
          width={320}
          className="lg:col-span-8"
          preview={
            hovered ? (
              <>
                <p className="text-micro text-accent-cyan flex items-center gap-2">
                  <BrandIcon network="whatsapp" size={12} />
                  {servicesCopy.previewLabel}
                </p>
                <p className="text-text-primary mt-4 text-sm leading-relaxed">
                  “{serviceInquiry(hovered.title)}”
                </p>
                <p className="text-text-secondary mt-4 text-xs">{servicesCopy.previewHint}</p>
              </>
            ) : null
          }
        >
          <div className="space-y-20 md:space-y-24" onPointerLeave={() => setHoveredId(null)}>
            {serviceGroups.map((group) => (
              <div key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} role="group" className="scroll-mt-40">
                <div className="flex flex-col gap-3 pb-6 md:flex-row md:items-end md:justify-between md:gap-10">
                  <h3 id={`${group.id}-title`} className="text-display-xs text-accent-cyan">
                    {group.title}
                  </h3>
                  <p className="text-text-secondary max-w-sm text-sm leading-relaxed md:text-right">
                    {group.summary}
                  </p>
                </div>

                <ul>
                  {group.services.map((service) => (
                    <li
                      key={service.id}
                      onPointerEnter={() => setHoveredId(service.id)}
                      className="group/row border-border-editorial relative grid gap-5 border-t py-8 md:grid-cols-12 md:gap-8 md:py-10"
                    >
                      {/* Barrido cian sobre la linea al pasar el cursor */}
                      <span
                        aria-hidden="true"
                        className="bg-accent-cyan absolute -top-px left-0 h-px w-full origin-left scale-x-0 transition-[scale] duration-700 ease-(--ease-editorial) group-hover/row:scale-x-100"
                      />

                      <div className="md:col-span-8">
                        <h4 className="text-text-primary group-hover/row:text-accent-cyan font-serif text-[1.625rem] leading-tight font-light tracking-[-0.02em] transition-[color,translate] duration-300 group-hover/row:translate-x-1 md:text-[2rem]">
                          {service.title}
                        </h4>
                        <p className="text-text-secondary mt-3 max-w-[58ch] leading-relaxed">
                          {service.description}
                        </p>
                        <p className="text-data text-text-secondary mt-4">{service.tags.join(' · ')}</p>
                      </div>

                      <div className="flex items-center md:col-span-4 md:justify-end">
                        <InquiryLink service={service} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CursorPreview>
      </div>
    </section>
  );
}

export default ServicesDirectory;
