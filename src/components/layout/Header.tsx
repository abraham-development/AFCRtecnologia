'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import FullscreenMenu from '@/components/layout/FullscreenMenu';
import BrandIcon from '@/components/ui/BrandIcon';
import { agency, CONTACT_FORM_HREF, headerCopy, navItems } from '@/content/agency';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { cn } from '@/lib/utils';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Atajos globales: E -> formulario de contacto (con foco), S -> servicios */
  useKeyboardShortcut('e', () => {
    setMenuOpen(false);
    if (pathname === '/contacto') {
      document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('contact-name')?.focus({ preventScroll: true });
      return;
    }
    router.push(CONTACT_FORM_HREF);
  });

  useKeyboardShortcut('s', () => {
    setMenuOpen(false);
    router.push('/servicios');
  });

  /** Una ruta esta activa si coincide exacta (Home) o es su prefijo. */
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

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
          'fixed top-0 right-0 left-0 z-[120] transition-[background-color,backdrop-filter] duration-500',
          scrolled ? 'bg-bg-primary/80 backdrop-blur-md' : 'bg-transparent',
        )}
      >
        <div className="shell flex h-16 items-center justify-between gap-4 md:h-20 [@media(max-height:480px)]:h-14">
          {/* Marca */}
          <Link
            href="/"
            data-cursor="expand"
            aria-label={`${agency.name}, ir al inicio`}
            className="group flex shrink-0 items-baseline gap-2 py-3"
          >
            <span className="font-serif text-xl leading-none font-normal tracking-[-0.03em] md:text-2xl">
              AFCR
            </span>
            <span className="text-micro text-text-secondary group-hover:text-accent-cyan transition-colors">
              TECNOLOGIA
            </span>
          </Link>

          {/* Etiqueta editorial */}
          <span className="text-micro text-text-secondary border-border-editorial hidden border-l pl-5 lg:block">
            {agency.tagline}
          </span>

          <span aria-hidden="true" className="bg-border-editorial hidden h-px flex-1 lg:block" />

          {/* Acceso rapido + hamburguesa */}
          <div className="flex shrink-0 items-center gap-4 md:gap-6">
            <Link
              href={CONTACT_FORM_HREF}
              data-cursor="expand"
              aria-label={headerCopy.advisorCta}
              className="text-micro text-text-primary hover:text-accent-cyan group hidden items-center gap-2.5 transition-colors sm:flex"
            >
              {headerCopy.advisorCta}
              <BrandIcon
                network="whatsapp"
                size={17}
                className="text-accent-cyan transition-transform duration-300 group-hover:scale-110"
              />
            </Link>

            <button
              ref={toggleRef}
              type="button"
              data-cursor="expand"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-label="Abrir menú"
              className="group border-accent-cyan/70 bg-bg-darkest/80 hover:border-accent-cyan hover:bg-accent-cyan focus-visible:bg-accent-cyan flex h-12 w-12 items-center justify-center border transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span aria-hidden="true" className="flex w-6 flex-col items-end gap-1.5">
                <span className="bg-accent-cyan group-hover:bg-bg-darkest group-focus-visible:bg-bg-darkest block h-0.5 w-6 transition-colors duration-300" />
                <span className="bg-accent-cyan group-hover:bg-bg-darkest group-focus-visible:bg-bg-darkest block h-0.5 w-4 transition-all duration-300 group-hover:w-6" />
                <span className="bg-accent-cyan group-hover:bg-bg-darkest group-focus-visible:bg-bg-darkest block h-0.5 w-6 transition-colors duration-300" />
              </span>
            </button>
          </div>
        </div>

        {/* Segundo nivel: navbar, entre dos lineas divisorias */}
        {/* En moviles apaisados (poca altura) se oculta: queda el menu hamburguesa */}
        <nav
          aria-label="Navegación principal"
          className={cn(
            'border-y transition-colors duration-500 [@media(max-height:480px)]:hidden',
            scrolled ? 'border-border-editorial' : 'border-border-editorial/60',
          )}
        >
          <ul className="shell flex h-11 items-center justify-between sm:justify-start sm:gap-10 md:gap-14">
            {navItems.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-cursor="expand"
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'text-micro group flex h-11 items-center gap-2 transition-colors',
                      active ? 'text-accent-cyan' : 'text-text-secondary hover:text-text-primary',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'bg-accent-cyan hidden h-1 w-1 transition-opacity duration-300 sm:inline-block',
                        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
                      )}
                    />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </motion.header>

      <FullscreenMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}

export default Header;
