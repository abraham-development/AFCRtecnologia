'use client';

import { useEffect, useState } from 'react';

/**
 * Media query reactiva y segura para SSR: devuelve `false` en el
 * primer render y se sincroniza tras la hidratacion.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const list = window.matchMedia(query);
    const update = (event: MediaQueryList | MediaQueryListEvent) => setMatches(event.matches);

    update(list);
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsFinePointer = () => useMediaQuery('(pointer: fine)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

export default useMediaQuery;
