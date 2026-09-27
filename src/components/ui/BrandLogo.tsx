import { cn } from '@/lib/utils';

/** Anchos pre-escalados en `public/brand/` (desde recursos_internos/Logotipo.png). */
const LOGO_WIDTHS = [200, 300, 400, 600, 900, 1200] as const;
const LOGO_WIDTH = 1200;
const LOGO_HEIGHT = 324;

const srcSetFor = (variant: string) =>
  LOGO_WIDTHS.map((w) => `/brand/afcr-logotipo${variant}-${w}.webp ${w}w`).join(', ');

type BrandLogoProps = {
  /** Altura mediante utilidades `h-*`; el ancho se deriva de la proporcion. */
  className?: string;
  /** Ancho maximo que ocupa en pantalla (atributo `sizes`), p. ej. `'200px'`. */
  sizes: string;
  /** Solo para el logo visible al cargar (header). */
  priority?: boolean;
};

/**
 * Logotipo oficial de AFCRtecnologia.
 *
 * Los trazos del wordmark son muy finos: si el navegador reduce una imagen
 * grande seis veces, con la pagina quieta los deja grises y desiguales. Por eso
 * se sirven versiones ya escaladas en luz lineal (ver AGENTS.md) y un `srcSet`
 * para que el navegador casi no tenga que escalar. Se usa `<img>` y no
 * `next/image` porque el optimizador no aplicaria ese escalado y ademas no
 * existe en `build:static`. El `alt` va vacio: los enlaces que lo contienen ya
 * llevan `aria-label`.
 *
 * Hover: encima va la variante con letras cian (`-cian`), que aparece al pasar
 * el cursor por el logo o al enfocar con teclado el enlace que lo contiene.
 */
export function BrandLogo({ className, sizes, priority = false }: BrandLogoProps) {
  const imgProps = {
    sizes,
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    decoding: 'async' as const,
    draggable: false,
  };

  return (
    <span className={cn('group/logo relative block w-fit max-w-full select-none', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...imgProps}
        alt=""
        src={`/brand/afcr-logotipo-${LOGO_WIDTH}.webp`}
        srcSet={srcSetFor('')}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className="block h-full w-auto max-w-full object-contain object-left"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...imgProps}
        alt=""
        aria-hidden="true"
        src={`/brand/afcr-logotipo-cian-${LOGO_WIDTH}.webp`}
        srcSet={srcSetFor('-cian')}
        loading="lazy"
        className="ease-(--ease-editorial) pointer-events-none absolute inset-0 h-full w-full object-contain object-left opacity-0 transition-opacity duration-500 group-hover/logo:opacity-100 in-focus-visible:opacity-100 motion-reduce:transition-none"
      />
    </span>
  );
}

export default BrandLogo;
