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

/** Articulo de la seccion Recursos: uno por servicio, escrito por el equipo de AFCR. */
export interface ResourceArticle {
  slug: string;
  /** Tema corto: etiqueta de la ficha y palabra de la portada tipografica. */
  topic: string;
  title: string;
  excerpt: string;
  /**
   * Bloques del cuerpo: «## » y «### » abren subtitulos; las lineas seguidas que
   * empiezan por «- » o «1. » forman una lista; las que empiezan por «| » forman
   * una tabla (la primera fila es la cabecera). «**texto**» va en negrita.
   */
  body: string[];
  /** Portada en `public/recursos/`. Sin ella se muestra la portada tipografica. */
  cover?: ResourceCoverImage;
}

/**
 * Portada exportada como `public/recursos/<name>-{800,1600,<width>}.webp` y
 * `<name>-og.jpg` (redes sociales). `width`/`height` son los del original.
 */
export interface ResourceCoverImage {
  name: string;
  alt: string;
  width: number;
  height: number;
}

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  variant: 'success' | 'error';
  title: string;
  description?: string;
}
