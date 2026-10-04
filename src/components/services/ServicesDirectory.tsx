'use client';

import { ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import BrandIcon from '@/components/ui/BrandIcon';
import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import GlowBeams from '@/components/ui/GlowBeams';
import {
  CONTACT_FORM_HREF,
  hasWhatsApp,
  serviceInquiry,
  whatsappLink,
  whatsappUrl,
} from '@/content/agency';
import { serviceGroups, servicesCopy } from '@/content/services';
import { useGlowPause } from '@/hooks/useGlowPause';
import { cn } from '@/lib/utils';
import type { Service } from '@/types';

const EASE = [0.16, 1, 0.3, 1] as const;

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

function FallbackContact({ className }: { className?: string }) {
  return (
    <ButtonMagnetic
      variant="ghost"
      href={whatsappUrl}
      external
      className={className}
      aria-label="Escribir por WhatsApp si no encuentras el servicio que buscas"
    >
      <BrandIcon network="whatsapp" size={15} />
      {servicesCopy.fallbackCta}
    </ButtonMagnetic>
  );
}

const VALID_IDS = new Set(serviceGroups.map((group) => group.id));

export function ServicesDirectory() {
  // Arranca en la primera categoria (coincide con el HTML del servidor).
  const [activeId, setActiveId] = useState(serviceGroups[0]!.id);
  const indexRef = useRef<HTMLElement>(null);
  useGlowPause(indexRef);

  // Tras hidratar: si la URL trae un ancla valida (/servicios#ia, enlazada
  // desde Nosotros o el footer), abre esa categoria en vez de la primera.
  // Diferido a un frame: el React Compiler prohibe setState sincrono en el
  // cuerpo del efecto (AGENTS.md).
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!VALID_IDS.has(hash)) return;
    const frame = requestAnimationFrame(() => setActiveId(hash));
    return () => cancelAnimationFrame(frame);
  }, []);

  const select = (id: string) => {
    setActiveId(id);
    // No usa router.push: es un filtro, no una navegacion — no debe apilar
    // entradas en el historial. Solo deja el enlace compartible actualizado.
    window.history.replaceState(null, '', `#${id}`);
  };

  const active = serviceGroups.find((group) => group.id === activeId) ?? serviceGroups[0]!;

  return (
    <section aria-labelledby="catalogo-title" className="hairline-t py-chapter">
      <h2 id="catalogo-title" className="shell text-display-sm mb-10 md:mb-14">
        {servicesCopy.directoryTitle}
      </h2>

      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Las cuatro categorias son el indice principal en todos los anchos. */}
        <div className="lg:sticky lg:top-40 lg:col-span-4 lg:self-start">
          <nav ref={indexRef} aria-label={servicesCopy.indexLabel} className="isolate">
            <ul className="border-border-editorial border-y">
              {serviceGroups.map((group) => {
                const isActive = group.id === activeId;
                return (
                  <li key={group.id} className="border-border-editorial border-b last:border-b-0">
                    {/* La categoria activa lleva la luz de contorno de Home (GlowBeams,
                        por perimetro): el halo va detras de todas las filas (-z-10
                        dentro del nav aislado) y el anillo encima del boton opaco.
                        Las capas se montan con la fila activa, asi el encendido
                        arranca en cada cambio. */}
                    <div className="glow-card relative">
                      {isActive ? <GlowBeams layer="halo" className="-z-10" /> : null}

                      <button
                        type="button"
                        data-cursor="expand"
                        aria-pressed={isActive}
                        aria-controls="services-panel"
                        onClick={() => select(group.id)}
                        className={cn(
                          'relative flex min-h-20 w-full items-center gap-4 rounded-xs px-4 py-4 text-left font-serif text-[1.375rem] leading-tight font-light tracking-[-0.02em] transition-colors duration-300 lg:px-3',
                          isActive
                            ? 'bg-bg-darkest text-accent-cyan'
                            : 'text-text-primary hover:text-accent-cyan',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn('h-px w-6 shrink-0', isActive ? 'bg-accent-cyan' : 'bg-border-editorial')}
                        />
                        <span>{group.title}</span>
                      </button>

                      {isActive ? <GlowBeams layer="ring" /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          {hasWhatsApp ? (
            <div className="mt-10 hidden lg:block">
              <FallbackContact />
            </div>
          ) : null}
        </div>

        {/* Panel: solo la categoria seleccionada */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              id="services-panel"
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, ease: EASE }}
              role="group"
              aria-labelledby={`${active.id}-title`}
            >
              {/* Marco del encabezado: mismo borde/radio/relleno que ButtonMagnetic, mas
                  el fondo accent-cyan-glow — el mismo tono que el sistema ya usa para
                  "activar" un boton ghost al pasar el cursor, aqui fijo — para contrastar
                  de verdad con el fondo primario (bg-secondary quedaba casi identico).
                  Es un <div> sin onClick, sin data-cursor ni estados hover — no debe
                  leerse como interactivo. */}
              <div className="border-border-editorial bg-accent-cyan-glow rounded-xs mb-8 border p-7 md:mb-10 md:p-9">
                <div className="grid gap-4 md:grid-cols-12 md:items-end md:gap-10">
                  <h3 id={`${active.id}-title`} className="text-display-sm md:col-span-8">
                    {active.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed md:col-span-4 md:text-right">
                    {active.summary}
                  </p>
                </div>
              </div>

              {/* Sangria + riel vertical: marca que estos servicios son contenido
                  subordinado, anidado bajo la categoria del marco de arriba. */}
              <ul className="border-border-editorial ml-3 border-l pl-5 [&>li:first-child]:border-t-0 md:ml-8 md:pl-8">
                {active.services.map((service) => (
                  <li
                    key={service.id}
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
            </motion.div>
          </AnimatePresence>
        </div>

        {hasWhatsApp ? (
          <div className="lg:hidden">
            <FallbackContact className="w-full" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ServicesDirectory;
