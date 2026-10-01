/** Tiempo de lectura a ~200 palabras por minuto, minimo 1. */
export function readingTimeFor(paragraphs: string[]): string {
  const words = paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}
