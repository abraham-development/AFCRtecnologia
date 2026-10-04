'use client';

/**
 * Script en linea que corre al llegar el HTML, sin el aviso de React 19.
 * ---------------------------------------------------------------
 * React avisa («Encountered a script tag while rendering React component»)
 * cada vez que crea un <script> en el navegador: alli nunca se ejecutaria.
 * Pasa en desarrollo al recargar en caliente el layout. Por eso el servidor
 * emite el script ejecutable (corre durante el parseo, antes de React) y en
 * el cliente se declara como bloque de datos inerte (`text/plain`), que React
 * no considera script. Al hidratar se conserva el nodo del servidor: React no
 * corrige atributos, y `suppressHydrationWarning` calla la diferencia de tipo.
 */
export function InlineScript({ code }: { code: string }) {
  const onServer = typeof window === 'undefined';

  return (
    <script
      type={onServer ? undefined : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}

export default InlineScript;
