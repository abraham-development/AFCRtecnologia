import { NEWS_CATEGORIES } from '@/types';

/**
 * Guia editorial que el MCP de noticias entrega a los agentes
 * (herramienta `get_editorial_guide` y prompt `redactar_noticia`).
 * Resume las reglas de afirmaciones de PRODUCT.md: si cambian alli, cambian aqui.
 */
export const NEWS_LIMITS = {
  title: { min: 10, max: 120 },
  excerpt: { min: 40, max: 280 },
  body: { min: 200, max: 20_000 },
  coverAlt: { min: 5, max: 200 },
} as const;

export const editorialGuide = `# Guía editorial — Noticias de AFCRtecnologia

AFCRtecnologia es una agencia de tecnología e IA de Lima, Perú. La sección
«Información relevante y actualizada de inteligencia artificial y tecnología» publica notas
breves para pymes, empresas e instituciones educativas del Perú.

## Voz
- Español de Perú, tuteo («puedes», «tu negocio»).
- Lenguaje de negocio antes que jerga técnica; explica los términos técnicos.
- Tono sobrio y útil: qué es, por qué importa y qué puede hacer el lector.

## Veracidad (obligatorio)
- No inventes métricas, porcentajes, clientes, testimonios, citas, precios ni
  plazos. AFCR no tiene casos de clientes publicables.
- Si mencionas un hecho externo (un lanzamiento, una versión, una norma),
  debe ser verificable y de una fuente confiable; nombra la fuente en el texto.
- No presentes a AFCR como autora de productos de terceros.
- Nunca marques una nota real como ejemplo: el campo «sample» no existe en el
  MCP a propósito.

## Formato
- Título: ${NEWS_LIMITS.title.min}–${NEWS_LIMITS.title.max} caracteres, sin punto final.
- Resumen (excerpt): ${NEWS_LIMITS.excerpt.min}–${NEWS_LIMITS.excerpt.max} caracteres, una o dos frases.
- Categoría: una de ${NEWS_CATEGORIES.map((category) => `«${category}»`).join(', ')}.
- Cuerpo en texto plano: párrafos separados por una línea en blanco. Un
  párrafo que empieza con «## » es un subtítulo. No uses HTML, listas con
  viñetas, negritas ni enlaces markdown: se muestran como texto literal.
- Extensión sugerida: 300–900 palabras (3–7 min de lectura).
- Cierra, cuando encaje, conectando el tema con lo que un negocio peruano
  puede hacer; sin venta agresiva.

## Portada
- Sin foto, la nota usa la portada tipográfica del sitio (la categoría en
  grande). Es la opción por defecto y está bien.
- Solo sube una foto si tienes derechos de uso; describe la imagen en «alt».

## Flujo
1. create_draft → devuelve una URL de vista previa privada.
2. Comparte esa URL con la persona responsable y espera su aprobación.
3. publish_news solo cuando te lo pidan explícitamente.
`;
