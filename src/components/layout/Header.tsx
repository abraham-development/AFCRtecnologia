'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import AccountActions from '@/components/layout/AccountActions';
import FullscreenMenu from '@/components/layout/FullscreenMenu';
import BrandIcon from '@/components/ui/BrandIcon';
import BrandLogo from '@/components/ui/BrandLogo';
import { agency, hasWhatsApp, headerCopy, navItems, whatsappUrl } from '@/content/agency';
import { cn } from '@/lib/utils';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          // Fondo propio y constante, un solo tono para los dos niveles: pizarra
          // algo mas clara que el hero para separarlo sin salir de la paleta.
          'noise bg-bg-header/95 fixed top-0 right-0 left-0 z-[120] backdrop-blur-md transition-[background-color] duration-500',
          scrolled && 'bg-bg-header/98',
        )}
      >
        <div className="shell flex h-16 items-center justify-between gap-4 md:h-20 short:h-14">
          {/* Marca */}
          <Link
            href="/"
            data-cursor="expand"
            aria-label={`${agency.name}, ir al inicio`}
            className="shrink-0 py-2"
          >
            <BrandLogo priority sizes="193px" className="h-[clamp(2.5rem,3.8vw,3.25rem)] short:h-8" />
          </Link>

          <span
            aria-hidden="true"
            className="bg-border-editorial hidden h-px min-w-4 flex-1 sm:block short:!hidden"
          />

          <AccountActions className="hidden sm:flex" />

          {/* Solo celular, y tambien si la barra de enlaces no cabe (poca altura). */}
          <button
            ref={toggleRef}
            type="button"
            data-cursor="expand"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-label="Abrir menú"
            className="group border-accent-cyan/70 bg-bg-darkest/80 hover:border-accent-cyan hover:bg-accent-cyan focus-visible:bg-accent-cyan flex h-12 w-12 shrink-0 items-center justify-center border transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0 lg:hidden short:!flex"
          >
            <span aria-hidden="true" className="flex w-6 flex-col items-end gap-1.5">
              <span className="bg-accent-cyan group-hover:bg-bg-darkest group-focus-visible:bg-bg-darkest block h-0.5 w-6 transition-colors duration-300" />
              <span className="bg-accent-cyan group-hover:bg-bg-darkest group-focus-visible:bg-bg-darkest block h-0.5 w-4 transition-all duration-300 group-hover:w-6" />
              <span className="bg-accent-cyan group-hover:bg-bg-darkest group-focus-visible:bg-bg-darkest block h-0.5 w-6 transition-colors duration-300" />
            </span>
          </button>
        </div>

        {/* En pantallas estrechas los dos botones no caben junto al logo. */}
        <div className="shell flex justify-end pb-3 sm:hidden">
          <AccountActions />
        </div>

        {/* Segundo nivel: enlaces a la izquierda, WhatsApp a la derecha.
            En celular y en pantallas bajas lo reemplaza la hamburguesa. */}
        <nav
          aria-label="Navegación principal"
          className="border-border-editorial hidden border-y lg:block short:!hidden"
        >
          <div className="shell flex h-11 items-center justify-between gap-6">
            <ul className="flex min-w-0 items-center gap-6 xl:gap-10">
              {navItems.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href} className="shrink-0">
                    <Link
                      href={link.href}
                      data-cursor="expand"
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex h-11 items-center text-[0.8125rem] font-medium tracking-[-0.005em] whitespace-nowrap transition-colors xl:text-[0.9375rem]',
                        active ? 'text-text-primary' : 'text-text-primary/75 hover:text-text-primary',
                      )}
                    >
                      {link.label}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="border-accent-cyan pointer-events-none absolute -inset-x-1 inset-y-1.5 border"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {hasWhatsApp ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="expand"
                className="group border-accent-cyan/70 bg-bg-darkest/80 text-text-primary hover:border-accent-cyan hover:bg-accent-cyan hover:text-bg-darkest focus-visible:bg-accent-cyan focus-visible:text-bg-darkest inline-flex h-9 shrink-0 items-center gap-2.5 border px-3.5 text-[0.8125rem] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-300 xl:px-4 xl:text-[0.875rem]"
              >
                {headerCopy.advisorCta}
                <BrandIcon
                  network="whatsapp"
                  size={16}
                  className="text-accent-cyan group-hover:text-bg-darkest group-focus-visible:text-bg-darkest shrink-0"
                />
              </a>
            ) : null}
          </div>
        </nav>
      </motion.header>

      <FullscreenMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}

export default Header;
