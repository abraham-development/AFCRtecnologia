'use client';

import { useEffect, useRef } from 'react';

type Handler = (event: KeyboardEvent) => void;

interface Options {
  /** Permite disparar el atajo aunque haya modificadores pulsados. */
  allowModifiers?: boolean;
  /** Desactiva el listener sin desmontar el componente. */
  enabled?: boolean;
  /** Elemento donde se escucha. Por defecto `window`. */
  target?: Window | HTMLElement | null;
}

/** Tags donde un atajo de una sola tecla nunca debe interceptar. */
const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'OPTION']);

function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (EDITABLE.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[role="textbox"], [contenteditable="true"]'));
}

/**
 * Atajo de teclado global, desacoplado y seguro para formularios.
 *
 * @example
 * useKeyboardShortcut('e', () => scrollToSection('contacto'));
 */
export function useKeyboardShortcut(key: string, handler: Handler, options: Options = {}): void {
  const { allowModifiers = false, enabled = true, target } = options;
  const handlerRef = useRef(handler);

  // El ref se sincroniza fuera del render para no re-suscribir el listener
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const node: Window | HTMLElement = target ?? window;
    const expected = key.toLowerCase();

    const onKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key.toLowerCase() !== expected) return;
      if (!allowModifiers && (keyboardEvent.metaKey || keyboardEvent.ctrlKey || keyboardEvent.altKey)) return;
      if (keyboardEvent.repeat) return;
      if (isTypingContext(keyboardEvent.target)) return;

      handlerRef.current(keyboardEvent);
    };

    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [key, allowModifiers, enabled, target]);
}

export default useKeyboardShortcut;
