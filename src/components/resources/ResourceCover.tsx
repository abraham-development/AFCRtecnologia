import { coverSources } from '@/content/resources';
import { cn } from '@/lib/utils';
import type { ResourceArticle } from '@/types';

interface ResourceCoverProps {
  article: ResourceArticle;
  className?: string;
  /** Ancho que ocupa la portada (atributo `sizes`): elige el archivo adecuado. */
  sizes: string;
  /**
   * `crop`: llena la caja del consumidor y recorta el centro (card de la Home).
   * `full`: imagen entera con su proporcion real (pagina del articulo).
   */
  fit?: 'crop' | 'full';
  /** La portada del articulo abierto se pide primero; las de la lista, en diferido. */
  priority?: boolean;
  /** Dentro de un enlace que ya nombra el titulo, la imagen no repite su texto alternativo. */
  decorative?: boolean;
}

/**
 * Portada de un articulo. Con imagen (`public/recursos/`) se muestra la imagen;
 * sin ella, la portada tipografica: el tema en Fraunces, gigante y recortado,
 * sobre un panel con grano. `noise` exige que el consumidor ya este posicionado
 * (ver AGENTS.md, trampas de Tailwind v4).
 */
export function ResourceCover({
  article,
  className,
  sizes,
  fit = 'crop',
  priority = false,
  decorative = false,
}: ResourceCoverProps) {
  if (article.cover) {
    const { src, srcSet } = coverSources(article.cover);
    const image = (
      // eslint-disable-next-line @next/next/no-img-element -- variantes ya exportadas en public/, igual en el export
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={decorative ? '' : article.cover.alt}
        width={article.cover.width}
        height={article.cover.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={
          fit === 'full'
            ? 'block h-auto w-full'
            : 'absolute inset-0 h-full w-full object-cover transition-[scale] duration-700 ease-(--ease-editorial) group-hover:scale-[1.03]'
        }
      />
    );

    return (
      <div className={cn('border-border-editorial bg-bg-darkest relative overflow-hidden border', className)}>
        {image}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-bg-darkest noise border-border-editorial relative overflow-hidden border',
        fit === 'full' && 'aspect-[16/9]',
        className,
      )}
    >
      <span className="text-accent-cyan/25 absolute top-3 left-4 font-serif text-[3.75rem] leading-[0.9] font-light tracking-tighter whitespace-nowrap sm:text-[3rem] lg:text-[4.5rem]">
        {article.topic}
      </span>
      <span aria-hidden="true" className="border-accent-cyan/40 absolute right-3 bottom-3 h-3 w-3 border-r border-b" />
    </div>
  );
}

export default ResourceCover;
