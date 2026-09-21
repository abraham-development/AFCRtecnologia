'use client';

import { ArrowUp, ArrowUpRight } from 'lucide-react';

import { agency, navItems, whatsappUrl } from '@/content/agency';
import { scrollToSection } from '@/lib/utils';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-bg-darkest noise border-border-editorial relative border-t">
      <div className="shell py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Marca + descripcion */}
          <div className="lg:col-span-5">
            <p className="font-serif text-3xl leading-none tracking-[-0.03em] md:text-4xl">
              AFCR<span className="text-text-secondary">tecnologia</span>
            </p>
            <p className="text-text-secondary mt-5 max-w-sm text-sm leading-relaxed">
              {agency.description}
            </p>
            <p className="text-micro text-text-secondary mt-8 flex items-center gap-2">
              <span className="bg-accent-cyan status-dot inline-block h-1.5 w-1.5 rounded-full" />
              {agency.status}
            </p>
          </div>

          {/* Indice */}
          <nav aria-label="Secciones del sitio" className="lg:col-span-3">
            <p className="text-micro text-text-secondary mb-5">ÍNDICE</p>
            <ul className="space-y-2.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    data-cursor="expand"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection(item.href, -72);
                    }}
                    className="text-text-primary hover:text-accent-cyan flex items-baseline gap-3 text-sm transition-colors"
                  >
                    <span className="text-micro text-text-secondary">{item.index}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacto */}
          <div className="lg:col-span-2">
            <p className="text-micro text-text-secondary mb-5">CONTACTO</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${agency.email}`}
                  data-cursor="expand"
                  className="text-text-primary hover:text-accent-cyan break-words transition-colors"
                >
                  {agency.email}
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="expand"
                  className="text-text-primary hover:text-accent-cyan inline-flex items-center gap-1.5 transition-colors"
                >
                  WhatsApp
                  <ArrowUpRight size={13} strokeWidth={1.5} />
                </a>
              </li>
              <li className="text-text-secondary">{agency.phoneDisplay}</li>
              <li className="text-text-secondary">
                {agency.address.locality}, {agency.country}
              </li>
            </ul>
          </div>

          {/* Redes */}
          <div className="lg:col-span-2">
            <p className="text-micro text-text-secondary mb-5">REDES</p>
            <ul className="space-y-2.5 text-sm">
              {agency.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="expand"
                    className="text-text-primary hover:text-accent-cyan inline-flex items-center gap-1.5 transition-colors"
                  >
                    {social.label}
                    <ArrowUpRight size={13} strokeWidth={1.5} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Barra legal */}
        <div className="border-border-editorial mt-16 flex flex-col gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-micro text-text-secondary">
            © {year} {agency.legalName} · {agency.legal.rights}
          </p>

          <div className="text-micro text-text-secondary flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>{agency.legal.privacy}</span>
            <span>{agency.legal.terms}</span>
            <span>
              {agency.city.toUpperCase()} · {agency.timezone}
            </span>
          </div>

          <button
            type="button"
            data-cursor="expand"
            onClick={() => scrollToSection('hero')}
            className="text-micro text-text-primary hover:text-accent-cyan flex items-center gap-2 self-start transition-colors md:self-auto"
          >
            VOLVER ARRIBA
            <ArrowUp size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
