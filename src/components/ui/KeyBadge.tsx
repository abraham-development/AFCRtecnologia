import { cn } from '@/lib/utils';

interface KeyBadgeProps {
  keyLabel: string;
  tone?: 'dark' | 'light';
  className?: string;
}

/**
 * Tecla en miniatura que documenta un atajo de teclado.
 * Se oculta en pantallas tactiles, donde el atajo no aplica.
 */
export function KeyBadge({ keyLabel, tone = 'light', className }: KeyBadgeProps) {
  return (
    <kbd
      aria-hidden="true"
      className={cn(
        'text-micro hidden h-5 min-w-5 select-none items-center justify-center rounded-xs border px-1.5 pt-px leading-none [@media(pointer:fine)]:inline-flex',
        tone === 'dark'
          ? 'border-bg-darkest/25 bg-bg-darkest/10 text-bg-darkest'
          : 'border-border-editorial bg-bg-darkest/60 text-text-secondary',
        className,
      )}
    >
      {keyLabel}
    </kbd>
  );
}

export default KeyBadge;
