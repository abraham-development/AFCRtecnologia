'use client';

import { ArrowUp, ArrowUpRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import BrandIcon from '@/components/ui/BrandIcon';
import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import {
  agency,
  CONTACT_FORM_HREF,
  footerCopy,
  hasWhatsApp,
  navItems,
  socialLinks,
  whatsappUrl,
} from '@/content/agency';
import { serviceGroups } from '@/content/services';
import { scrollToTop } from '@/lib/utils';

const COLUMN_TITLE = 'text-micro text-text-secondary mb-6';
const LINK = 'text-text-primary hover:text-accent-cyan transition-colors';
/** Enlaces de lista: 44px de alto tactil en movil y tablet, compactos en escritorio. */
const LIST_LINK = `${LINK} inline-flex min-h-11 items-center lg:min-h-0`;

/** Paginas con cierre propio (CtaBand o canales): no repiten la banda del footer. */
const ROUTES_WITH_OWN_CLOSER = ['/servicios', '/contacto', '/noticias'];

export function Footer() {
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const showBand = !ROUTES_WITH_OWN_CLOSER.some((route) => pathname.startsWith(route));

  return (
    <footer className="bg-bg-darkest noise border-border-editorial relative border-t">
      {/* Cierre: llamada a la accion */}
      {showBand ? (
        <div className="shell grid gap-10 py-20 md:py-28 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.02] font-light tracking-[-0.035em]">
              {footerCopy.titleStart}
              <span className="text-accent-cyan">{footerCopy.titleAccent}</span>
              {footerCopy.titleEnd}
            </h2>
            <p className="text-text-secondary mt-6 max-w-md leading-relaxed">{footerCopy.body}</p>
          </div>

          <div className="flex flex-col items-stretch gap-5 sm:items-start lg:col-span-5 lg:items-end">
            {hasWhatsApp ? (
              <ButtonMagnetic
                variant="solid"
                href={whatsappUrl}
                external
                className="w-full px-8 py-5 text-base sm:w-auto"
                aria-label="Escribir a AFCRtecnologia por WhatsApp"
              >
                <BrandIcon network="whatsapp" size={18} />
                {footerCopy.whatsappCta}
                <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </ButtonMagnetic>
            ) : (
              <ButtonMagnetic
                variant="solid"
                href={CONTACT_FORM_HREF}
                className="w-full px-8 py-5 text-base sm:w-auto"
                aria-label="Ir al formulario de contacto"
              >
                {footerCopy.fallbackCta}
                <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </ButtonMagnetic>
            )}

            <div className="text-data text-text-secondary flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-end">
              <a
                href={`mailto:${agency.email}`}
                data-cursor="expand"
                className={`${LINK} inline-flex min-h-11 items-center gap-2 break-all`}
              >
                <Mail size={13} strokeWidth={1.5} aria-hidden="true" />
                {agency.email}
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {/* Directorio del sitio */}
      <div className={showBand ? 'border-border-editorial border-t' : undefined}>
        <div className="shell grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Marca + redes */}
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="font-serif text-3xl leading-none tracking-[-0.03em]">
              AFCR<span className="text-text-secondary">tecnologia</span>
            </p>
            <p className="text-text-secondary mt-5 max-w-sm text-sm leading-relaxed">
              {agency.summary}
            </p>

            <ul aria-label="Redes sociales" className="mt-8 flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <li key={social.network}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="expand"
                    aria-label={`${agency.name} en ${social.label}`}
                    className="border-border-editorial text-text-secondary hover:border-accent-cyan hover:text-accent-cyan hover:bg-accent-cyan-glow flex h-11 w-11 items-center justify-center border transition-colors"
                  >
                    <BrandIcon network={social.network} size={17} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navegacion */}
          <nav aria-labelledby="footer-nav" className="lg:col-span-2">
            <h2 id="footer-nav" className={COLUMN_TITLE}>
              {footerCopy.columns.nav}
            </h2>
            <ul className="text-sm lg:space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} data-cursor="expand" className={LIST_LINK}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Servicios */}
          <nav aria-labelledby="footer-services" className="lg:col-span-3">
            <h2 id="footer-services" className={COLUMN_TITLE}>
              {footerCopy.columns.services}
            </h2>
            <ul className="text-sm lg:space-y-3">
              {serviceGroups.flatMap((group) =>
                group.services.map((service) => (
                  <li key={service.id}>
                    <Link href={`/servicios#${group.id}`} data-cursor="expand" className={LIST_LINK}>
                      {service.shortTitle}
                    </Link>
                  </li>
                )),
              )}
            </ul>
          </nav>

          {/* Contacto */}
          <div className="lg:col-span-3">
            <h2 className={COLUMN_TITLE}>{footerCopy.columns.contact}</h2>
            <dl className="space-y-5 text-sm">
              {hasWhatsApp ? (
                <div>
                  <dt className="text-micro text-text-secondary">{footerCopy.labels.whatsapp}</dt>
                  <dd className="lg:mt-1.5">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="expand"
                      className={`${LIST_LINK} gap-2`}
                    >
                      <BrandIcon network="whatsapp" size={15} />
                      {footerCopy.whatsappCta}
                      <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-micro text-text-secondary">{footerCopy.labels.email}</dt>
                <dd className="lg:mt-1.5">
                  <a href={`mailto:${agency.email}`} data-cursor="expand" className={`${LIST_LINK} break-all`}>
                    {agency.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-micro text-text-secondary">{footerCopy.labels.location}</dt>
                <dd className="text-text-primary mt-1.5">
                  {agency.address.locality}, {agency.country}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Barra legal */}
      <div className="border-border-editorial border-t">
        <div className="shell flex flex-col gap-5 py-8 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-micro text-text-secondary">
            © {year} {agency.legalName} · {agency.legal.rights}
          </p>

          <ul className="text-micro text-text-secondary flex flex-wrap items-center gap-x-6 gap-y-2">
            <li>{agency.legal.privacy}</li>
            <li>{agency.legal.terms}</li>
            <li>{agency.legal.complaints}</li>
          </ul>

          <button
            type="button"
            data-cursor="expand"
            onClick={() => scrollToTop()}
            className="text-micro text-text-primary hover:text-accent-cyan flex min-h-11 items-center gap-2 self-start whitespace-nowrap transition-colors xl:self-auto"
          >
            {footerCopy.backToTop}
            <ArrowUp size={13} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
