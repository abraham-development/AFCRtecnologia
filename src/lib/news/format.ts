/**
 * Utilidades puras de noticias: sin dependencias de servidor, se usan tanto en
 * el sitio como en el MCP.
 */

/** Separa el cuerpo en parrafos (linea en blanco). «## » marca un subtitulo. */
export function bodyToParagraphs(body: string): string[] {
  return body
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

export function paragraphsToBody(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}

/** Tiempo de lectura a ~200 palabras por minuto, minimo 1. */
export function readingTimeFor(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

/** «Qué es n8n» → «que-es-n8n». Solo minusculas ASCII, digitos y guiones. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Fecha de hoy en Lima (AAAA-MM-DD), independiente de la zona del servidor. */
export function todayInLima(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
