'use client';

import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useEffect } from 'react';

import type { ToastMessage } from '@/types';
import { cn } from '@/lib/utils';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
  /** Milisegundos antes del cierre automatico. */
  duration?: number;
}

export function Toast({ toast, onDismiss, duration = 6500 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [toast, duration, onDismiss]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed right-4 bottom-4 z-[140] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:bottom-6"
    >
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'pointer-events-auto flex items-start gap-3 border bg-bg-darkest/95 p-4 backdrop-blur-md',
              toast.variant === 'success' ? 'border-accent-cyan/50' : 'border-red-400/50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 shrink-0',
                toast.variant === 'success' ? 'text-accent-cyan' : 'text-red-400',
              )}
            >
              {toast.variant === 'success' ? (
                <CircleCheck size={16} strokeWidth={1.5} />
              ) : (
                <CircleAlert size={16} strokeWidth={1.5} />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-micro text-text-primary">{toast.title}</p>
              {toast.description ? (
                <p className="text-text-secondary mt-1.5 text-sm leading-relaxed">{toast.description}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Cerrar notificación"
              data-cursor="expand"
              className="text-text-secondary hover:text-text-primary shrink-0 transition-colors"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default Toast;
