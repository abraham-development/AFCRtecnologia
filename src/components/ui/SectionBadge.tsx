import { cn } from '@/lib/utils';

interface SectionBadgeProps {
  /** Numero de capitulo: 01 — 09. */
  index: string;
  /** Titulo del capitulo en mayusculas. */
  title: string;
  /** Dato tecnico contextual alineado a la derecha. */
  meta?: string;
  className?: string;
}

/**
 * Encabezado editorial estandarizado:
 * [linea cian 24px] [numero] [TITULO MONO] ......... [dato tecnico]
 */
export function SectionBadge({ index, title, meta, className }: SectionBadgeProps) {
  return (
    <div className={cn('flex w-full items-center gap-4 sm:gap-5', className)}>
      <span aria-hidden="true" className="bg-accent-cyan h-px w-6 shrink-0" />

      <span className="text-micro border-border-editorial text-accent-cyan shrink-0 border px-2 py-1">
        {index}
      </span>

      <h2 className="text-micro text-text-primary shrink-0">{title}</h2>

      <span aria-hidden="true" className="bg-border-editorial hidden h-px flex-1 sm:block" />

      {meta ? (
        <span className="text-micro text-text-secondary hidden shrink-0 text-right md:block">{meta}</span>
      ) : null}
    </div>
  );
}

export default SectionBadge;
