import type { ServiceGroup } from '@/types';

/**
 * Catalogo de servicios de AFCRtecnologia.
 * ---------------------------------------------------------------
 * Agrupados por el tipo de necesidad del cliente. No incluir plazos,
 * precios ni resultados: aun no estan definidos (ver PRODUCT.md).
 */
export const serviceGroups: ServiceGroup[] = [
  {
    id: 'software',
    title: 'Software a medida',
    summary: 'La base digital de tu negocio: sitios, aplicaciones y cumplimiento tributario.',
    services: [
      {
        id: 'aplicaciones',
        title: 'Aplicaciones web y móviles',
        shortTitle: 'Aplicaciones web y móviles',
        description:
          'Sistemas a medida para vender, gestionar inventario o atender clientes, en el navegador y en Android e iOS.',
        tags: ['Web', 'Android', 'iOS'],
      },
      {
        id: 'paginas-web',
        title: 'Diseño y desarrollo de páginas web',
        shortTitle: 'Páginas web',
        description:
          'Sitios rápidos y bien posicionados que explican lo que haces y convierten visitas en contactos.',
        tags: ['Diseño', 'SEO', 'Hosting'],
      },
      {
        id: 'sunat',
        title: 'Integraciones con la API de SUNAT: CPE y SIRE',
        shortTitle: 'Integraciones SUNAT',
        description:
          'Emisión de comprobantes de pago electrónicos desde tu sistema y declaración de registros de compras y ventas en el SIRE.',
        tags: ['Facturación electrónica', 'SIRE', 'API SUNAT'],
      },
    ],
  },
  {
    id: 'ia',
    title: 'Automatización e IA',
    summary: 'Procesos que se ejecutan solos y agentes que atienden, responden y deciden.',
    services: [
      {
        id: 'n8n',
        title: 'Automatizaciones con n8n',
        shortTitle: 'Automatizaciones n8n',
        description:
          'Conectamos tus herramientas —correo, hojas de cálculo, CRM, ERP— para que las tareas repetitivas corran sin intervención.',
        tags: ['n8n', 'Integraciones', 'Flujos'],
      },
      {
        id: 'whatsapp',
        title: 'Chatbots agénticos de WhatsApp',
        shortTitle: 'Chatbots de WhatsApp',
        description:
          'Un asistente que atiende a tus clientes en WhatsApp a toda hora: responde, cotiza, agenda y deriva a tu equipo cuando hace falta.',
        tags: ['WhatsApp Business', 'Atención 24/7'],
      },
      {
        id: 'agentes',
        title: 'Agentes de IA personalizados',
        shortTitle: 'Agentes de IA',
        description:
          'Agentes entrenados con la información de tu empresa que consultan tus sistemas y ejecutan tareas reales, con límites claros.',
        tags: ['LLM', 'RAG', 'Herramientas'],
      },
      {
        id: 'hermes',
        title: 'Agentes de IA con Hermes',
        shortTitle: 'Agentes con Hermes',
        description:
          'Implementamos Hermes Agent, el agente de código abierto de Nous Research, sobre tu infraestructura y con tus propias herramientas.',
        tags: ['Hermes Agent', 'Código abierto'],
      },
      {
        id: 'on-premise',
        title: 'IA local on-premise',
        shortTitle: 'IA on-premise',
        description:
          'Modelos de IA instalados en tus propios servidores: tus datos no salen de la empresa y no dependes de un proveedor externo.',
        tags: ['Privacidad', 'Modelos abiertos', 'Servidores propios'],
      },
    ],
  },
  {
    id: 'formacion',
    title: 'Formación y equipamiento',
    summary: 'Personas preparadas para usar la IA y equipos listos para trabajar.',
    services: [
      {
        id: 'capacitaciones',
        title: 'Capacitaciones y charlas sobre IA',
        shortTitle: 'Capacitaciones en IA',
        description:
          'Talleres para empresas e instituciones educativas sobre cómo usar la IA de forma útil, segura y responsable.',
        tags: ['Empresas', 'Instituciones educativas'],
      },
      {
        id: 'dispositivos',
        title: 'Venta de dispositivos tecnológicos',
        shortTitle: 'Dispositivos tecnológicos',
        description:
          'Equipos para tu oficina o tu proyecto, con asesoría para elegir lo que de verdad necesitas.',
        tags: ['Equipos', 'Asesoría'],
      },
    ],
  },
];

/** Textos de la seccion Servicios. */
export const servicesCopy = {
  directoryTitle: 'Catálogo de servicios',
  indexLabel: 'Categorías de servicios',
  /** Vista previa flotante: el mensaje que se abrira en WhatsApp. */
  previewLabel: 'MENSAJE LISTO PARA WHATSAPP',
  previewHint: 'Haz clic en Consultar y se abre la conversación.',
  inquiry: 'CONSULTAR',
  fallbackCta: '¿No lo ves en la lista? Escríbenos',
};

/** Todos los servicios en una lista plana (footer, datos estructurados). */
export const allServices = serviceGroups.flatMap((group) => group.services);
