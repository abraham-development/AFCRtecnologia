'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { agency, hasWhatsApp, navItems, whatsappUrl } from '@/content/agency';

interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function FullscreenMenu({ open, onClose }: FullscreenMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  /* Bloqueo de scroll (body + Lenis) y cierre con Escape */
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarGap > 0) body.style.paddingRight = `${scrollbarGap}px`;
    window.__afcrLenis?.stop?.();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Focus trap minimo dentro del panel
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 240);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      window.__afcrLenis?.start?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.72, ease: EASE }}
          className="bg-bg-darkest noise fixed inset-0 z-[130] flex flex-col overflow-y-auto"
        >
          {/* Cabecera del menu */}
          <div className="shell hairline-b flex h-16 shrink-0 items-center justify-between md:h-20">
            <span className="text-micro text-text-secondary">{agency.tagline}</span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              data-cursor="expand"
              aria-label="Cerrar menú"
              className="text-micro text-text-primary hover:text-accent-cyan flex items-center gap-3 transition-colors"
            >
              CERRAR
              <span aria-hidden="true" className="relative block h-4 w-4">
                <span className="bg-current absolute top-1/2 left-0 h-px w-4 rotate-45" />
                <span className="bg-current absolute top-1/2 left-0 h-px w-4 -rotate-45" />
              </span>
            </button>
          </div>

          {/* Indice 01 — 04 */}
          <nav aria-label="Secciones" className="shell flex flex-1 flex-col justify-center py-10">
            <ul className="w-full">
              {navItems.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.22 + index * 0.05 }}
                  className="border-border-editorial border-b last:border-b-0"
                >
                  <Link
                    href={item.href}
                    data-cursor="expand"
                    onClick={onClose}
                    className="group flex items-baseline gap-5 py-4 transition-colors sm:gap-8 md:py-5"
                  >
                    <span className="text-micro text-text-secondary group-hover:text-accent-cyan w-8 shrink-0 transition-colors">
                      {item.index}
                    </span>
                    <span className="text-display-sm text-text-primary group-hover:text-accent-cyan flex-1 transition-colors duration-300 group-hover:translate-x-2 motion-safe:transition-transform">
                      {item.label}
                    </span>
                    <span className="text-micro text-text-secondary hidden shrink-0 md:block">
                      {item.meta}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Pie del menu */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="shell hairline-t grid shrink-0 gap-6 py-8 md:grid-cols-2"
          >
            <div>
              <p className="text-micro text-text-secondary mb-3">CONTACTO DIRECTO</p>
              <a
                href={`mailto:${agency.email}`}
                data-cursor="expand"
                className="text-text-primary hover:text-accent-cyan block text-sm transition-colors"
              >
                {agency.email}
              </a>
              {hasWhatsApp ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="expand"
                  className="text-text-primary hover:text-accent-cyan mt-1 flex items-center gap-1.5 text-sm transition-colors"
                >
                  WhatsApp Business
                  <ArrowUpRight size={13} strokeWidth={1.5} />
                </a>
              ) : null}
            </div>

            <div className="md:text-right">
              <p className="text-micro text-text-secondary mb-3">REDES</p>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 md:justify-end">
                {agency.socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="expand"
                      className="text-text-primary hover:text-accent-cyan text-sm transition-colors"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default FullscreenMenu;
