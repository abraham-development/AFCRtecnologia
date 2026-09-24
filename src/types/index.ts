/**
 * Contratos de datos de AFCRtecnologia.
 * Todo el contenido editorial vive en `src/content/*` y se tipa aqui.
 */

export interface Service {
  id: string;
  title: string;
  /** Version corta para listas compactas (footer). */
  shortTitle: string;
  description: string;
  tags: string[];
}

export interface ServiceGroup {
  id: string;
  title: string;
  summary: string;
  services: Service[];
}

/** Perfil de cliente de la seccion Nosotros. */
export interface Audience {
  title: string;
  body: string;
  /** Grupo de servicios que le corresponde (ancla `#servicios-<id>`). */
  serviceGroupId: string;
}

/** Etapa del proceso de trabajo (la secuencia si importa). */
export interface ProcessStep {
  index: string;
  title: string;
  body: string;
}

export interface Principle {
  title: string;
  body: string;
}

export type SocialNetwork = 'whatsapp' | 'facebook' | 'instagram' | 'linkedin';

export interface SocialLink {
  network: SocialNetwork;
  label: string;
  handle: string;
  href: string;
}

/** Enlace de navegacion: navbar, menu fullscreen y footer. */
export interface NavItem {
  index: string;
  label: string;
  /** Ruta de la pagina destino (`/`, `/servicios`...). */
  href: string;
  meta: string;
}

export type NewsCategory = 'IA' | 'Automatización' | 'Software' | 'Negocio';

/** Nota de la seccion Noticias (escrita por AFCR). */
export interface NewsPost {
  slug: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  /** Fecha ISO (AAAA-MM-DD). */
  date: string;
  readingTime: string;
  /** Parrafos del cuerpo; los que empiezan por «## » se muestran como subtitulo. */
  body: string[];
  /** ⚠ Nota de ejemplo para ver el diseño: se muestra con etiqueta EJEMPLO. */
  sample?: boolean;
}

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  variant: 'success' | 'error';
  title: string;
  description?: string;
}
