/**
 * Dos haces de luz que recorren un contorno a velocidad constante.
 * ---------------------------------------------------------------
 * Misma paleta y lenguaje que la card del hero, pero por perimetro y no por
 * angulo: en elementos muy apaisados (filas del indice de Servicios) un
 * conic-gradient se arrastra por el centro de los lados largos y se dispara
 * en los extremos. Aqui cada cometa es una pila de trazos con `pathLength`
 * 100 alineados por la cabeza; `--beam-t` (globals.css) los hace avanzar.
 * `layer="halo"` va detras de la superficie (difuminado) y `layer="ring"`
 * encima, como borde nitido.
 */

import { useId, type CSSProperties } from 'react';

/** Escalones de la cola: trazos superpuestos cada vez mas cortos, con la
    misma opacidad baja; al apilarse forman un degradado hacia la cabeza. */
const TAIL_STEPS = 8;
const TAIL_LENGTH = 36;
const STEP_OPACITY = 0.15;

/** Cometa: cola del primer color que vira al segundo y cabeza casi blanca. */
function comet(phase: number, from: string, to: string, head: string) {
  const tail = Array.from({ length: TAIL_STEPS }, (_, step) => ({
    length: Number((TAIL_LENGTH * (1 - step / TAIL_STEPS)).toFixed(2)),
    color: step < TAIL_STEPS / 2 ? from : to,
    opacity: STEP_OPACITY,
  }));
  return { phase, segments: [...tail, { length: 1.4, color: head, opacity: 1 }] };
}

/** Longitudes en % del perimetro; los dos cometas van en lados opuestos. */
const COMETS = [
  comet(0, '#5bc2d8', '#8deb7e', '#effff0'),
  comet(50, '#ff7a6b', '#f4b860', '#fff4dc'),
];

interface GlowBeamsProps {
  layer: 'halo' | 'ring';
  className?: string;
}

export function GlowBeams({ layer, className }: GlowBeamsProps) {
  const halo = layer === 'halo';
  // useId trae caracteres no validos para url(#...): se dejan solo los seguros
  const filterId = `glow-beams-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`glow-beams glow-beams-${layer}${className ? ` ${className}` : ''}`}
    >
      {halo ? (
        <defs>
          <filter id={filterId} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
      ) : (
        /* Borde base cian tenue: el contorno nunca desaparece entre cometas */
        <rect className="glow-beams-base" width="100%" height="100%" rx="2" />
      )}

      <g filter={halo ? `url(#${filterId})` : undefined}>
        {COMETS.map((comet) =>
          comet.segments.map((segment) => (
            <rect
              key={`${comet.phase}-${segment.length}`}
              className="glow-beams-segment"
              width="100%"
              height="100%"
              rx="2"
              pathLength={100}
              stroke={segment.color}
              strokeOpacity={segment.opacity}
              strokeDasharray={`${segment.length} ${100 - segment.length}`}
              style={
                {
                  '--beam-len': segment.length,
                  '--beam-phase': comet.phase,
                } as CSSProperties
              }
            />
          )),
        )}
      </g>
    </svg>
  );
}

export default GlowBeams;
