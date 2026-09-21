'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import FullscreenMenu from '@/components/layout/FullscreenMenu';
import KeyBadge from '@/components/ui/KeyBadge';
import { agency } from '@/content/agency';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { cn, scrollToSection } from '@/lib/utils';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Atajos globales: E -> contacto (y foco en el formulario), S -> soluciones */
  useKeyboardShortcut('e', () => {
    setMenuOpen(false);
    scrollToSection('contacto', -40);
    window.setTimeout(() => {
      document.getElementById('contact-name')?.focus({ preventScroll: true });
    }, 1100);
  });

  useKeyboardShortcut('s', () => {
    setMenuOpen(false);
    scrollToSection('soluciones', -72);
  });

  const closeMenu = () => {
    setMenuOpen(false);
    window.setTimeout(() => toggleRef.current?.focus(), 80);
  };

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={cn(
          'fixed top-0 right-0 left-0 z-[120] transition-[background-color,border-color,backdrop-filter] duration-500',
          scrolled
            ? 'bg-bg-primary/80 border-border-editorial border-b backdrop-blur-md'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="shell flex h-16 items-center justify-between gap-4 md:h-20">
          {/* Marca */}
          <a
            href="#hero"
            data-cursor="expand"
            aria-label={`${agency.name}, ir al inicio`}
            onClick={(event) => {
              event.preventDefault();
              scrollToSection('hero');
            }}
            className="group flex shrink-0 items-baseline gap-2"
          >
            <span className="font-serif text-xl leading-none font-normal tracking-[-0.03em] md:text-2xl">
              AFCR
            </span>
            <span className="text-micro text-text-secondary group-hover:text-accent-cyan transition-colors">
              TECNOLOGIA
            </span>
          </a>

          {/* Etiqueta editorial */}
          <span className="text-micro text-text-secondary border-border-editorial hidden border-l pl-5 lg:block">
            {agency.tagline}
          </span>

          <span aria-hidden="true" className="bg-border-editorial hidden h-px flex-1 lg:block" />

          {/* Estado del sistema */}
          <span className="text-micro text-text-secondary hidden items-center gap-2 md:flex">
            <span className="bg-accent-cyan status-dot inline-block h-1.5 w-1.5 rounded-full" />
            {agency.status}
          </span>

          {/* Acceso rapido + hamburguesa */}
          <div className="flex shrink-0 items-center gap-4 md:gap-6">
            <button
              type="button"
              data-cursor="expand"
              onClick={() => {
                scrollToSection('contacto', -40);
                window.setTimeout(
                  () => document.getElementById('contact-name')?.focus({ preventScroll: true }),
                  1100,
                );
              }}
              className="text-micro text-text-primary hover:text-accent-cyan hidden items-center gap-2 transition-colors sm:flex"
            >
              EMPEZAR
              <KeyBadge keyLabel="E" />
            </button>

            <button
              ref={toggleRef}
              type="button"
              data-cursor="expand"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-label="Abrir menú"
              className="group flex h-10 w-10 items-center justify-center"
            >
              <span aria-hidden="true" className="flex w-6 flex-col items-end gap-[5px]">
                <span className="bg-text-primary group-hover:bg-accent-cyan block h-px w-6 transition-all duration-300" />
                <span className="bg-text-primary group-hover:bg-accent-cyan block h-px w-4 transition-all duration-300 group-hover:w-6" />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <FullscreenMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}

export default Header;
