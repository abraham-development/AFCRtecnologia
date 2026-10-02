import type { ResourceArticle, ResourceCoverImage } from '@/types';

/**
 * Recursos de AFCRtecnologia: un articulo por servicio, firmado por el equipo.
 * ---------------------------------------------------------------
 * Explican el problema y la solucion de forma educativa; la invitacion a
 * conversar va solo en el cierre. No inventar clientes, metricas, precios,
 * plazos ni resultados (PRODUCT.md). Sin fecha visible: son atemporales.
 *
 * El articulo de RAG es texto del usuario: no reescribirlo sin pedido.
 *
 * Portadas en `public/recursos/` como `<name>-{800,1600,<ancho>}.webp` y
 * `<name>-og.jpg` (ver `ResourceCoverImage`). Sin portada se muestra la
 * tipografica con el `topic`.
 */
export const resourceArticles: ResourceArticle[] = [
  {
    slug: 'para-que-sirve-el-rag-en-tu-negocio-empresa-o-institucion-publica',
    topic: 'RAG',
    title: '¿Para qué sirve el RAG dentro de tu negocio, empresa o institución pública?',
    excerpt:
      'Un modelo de IA genérico desconoce tu organización y puede inventar datos con total seguridad. RAG conecta la IA con tus documentos oficiales para responder con sustento y citar la fuente.',
    cover: {
      name: 'rag',
      alt: 'Infografía «LLM aislado vs. arquitectura RAG»: a la izquierda, un modelo aislado que inventa datos, desconoce el contexto interno y expone información confidencial; a la derecha, una arquitectura RAG que consulta los documentos oficiales, cita la fuente exacta y se actualiza al subir un archivo, con una tabla comparativa al pie.',
      width: 2752,
      height: 1536,
    },
    body: [
      'Durante los últimos años, la adopción masiva de la Inteligencia Artificial generativa despertó grandes expectativas en directorios, gerencias y despachos públicos. La promesa de automatizar tareas complejas, redactar informes y atender consultas al instante motivó a miles de organizaciones a experimentar con modelos fundacionales de lenguaje (LLMs) como ChatGPT, Claude o Gemini.',
      'Sin embargo, tras el entusiasmo inicial, la gran mayoría de las organizaciones se topó con una pared: un modelo de lenguaje genérico, por sí solo, es incapaz de operar con la realidad cotidiana de un negocio o de una institución pública.',
      '## El problema de fondo: los riesgos de usar LLMs aislados',
      'Un LLM comercial estándar es un extraordinario motor de lenguaje y razonamiento, pero fue entrenado con información pública de internet. Cuando se le pide que resuelva tareas del día a día en una entidad, surgen cinco problemas estructurales:',
      '### 1. Ceguera total del contexto interno',
      'El modelo desconoce por completo lo que ocurre dentro de la organización:',
      '- No tiene acceso a manuales de procedimientos, directivas internas, tarifas vigentes ni inventarios.',
      '- En el sector privado, ignora acuerdos con proveedores, contratos con clientes y márgenes comerciales.',
      '- En el sector público, desconoce directivas administrativas internas, resoluciones directorales y el Texto Único de Procedimientos Administrativos (TUPA) actualizado.',
      'Al carecer de estos datos, el modelo solo devuelve generalidades teóricas que no resuelven la necesidad real.',
      '### 2. Alucinaciones con apariencia de certeza',
      'El mayor peligro de un LLM no es que reconozca que no sabe algo, sino que inventa datos con un tono persuasivo, elocuente y formal:',
      '- Puede inventar condiciones de garantía que la empresa jamás ofreció, obligándola a asumir sobrecostos o litigios por publicidad engañosa.',
      '- Puede citar normativas derogadas o requisitos inexistentes para un trámite ciudadano, viciando procedimientos administrativos y exponiendo a los funcionarios a quejas y sanciones.',
      '### 3. Obsolescencia temporal y datos congelados',
      'Los modelos base tienen una fecha de corte en su entrenamiento:',
      '- No conocen leyes, ordenanzas ni disposiciones tributarias publicadas recientemente.',
      '- No reflejan cambios de precios, nuevos lanzamientos de productos ni reestructuraciones organizacionales.',
      'Mantener un LLM aislado como fuente de consulta equivale a pedir asesoría a un colaborador cuya memoria se detuvo hace un año.',
      '### 4. Imposibilidad de auditar y verificar fuentes',
      'En la gestión corporativa y en la administración pública, una afirmación sin sustento carece de valor:',
      '- Un LLM no puede indicar en qué folio, artículo de directiva o cláusula contractual basa su afirmación.',
      '- Ningún área de asesoría jurídica, auditoría interna o contabilidad puede validar una decisión basada en un texto que no ofrece trazabilidad documental verificable.',
      '### 5. Fuga de información confidencial',
      'Ante la falta de herramientas institucionales, los colaboradores suelen recurrir a interfaces públicas de IA copiando estados financieros, listas de clientes, códigos fuente o datos sensibles de ciudadanos. Esto vulnera leyes de protección de datos personales y expone secretos comerciales sin ningún control de ciberseguridad.',
      '## La solución: ¿qué es RAG y cómo transforma la IA?',
      'RAG (Retrieval-Augmented Generation o Generación Aumentada por Recuperación) es la arquitectura que resuelve de raíz esta desconexión.',
      'Para entenderlo de forma sencilla:',
      '- Un **LLM aislado** rinde un examen profesional confiando exclusivamente en lo que memorizó en el pasado; si algo se le olvida, lo inventa.',
      '- Un **sistema RAG** permite que el modelo rinda el examen con todos los libros, manuales, directivas y reglamentos de la institución abiertos frente a él.',
      '### ¿Cómo opera el flujo de RAG en la práctica?',
      '1. **Indexación de la base de conocimiento:** los documentos oficiales de la entidad (manuales, contratos, reglamentos, bases de datos, resoluciones) se transforman en representaciones semánticas estructuradas dentro de una base de datos vectorial protegida.',
      '2. **Recuperación en tiempo real:** cuando un usuario realiza una consulta, el sistema busca de inmediato los fragmentos exactos de los documentos que contienen la respuesta oficial.',
      '3. **Generación con sustento:** el sistema le entrega al LLM la pregunta del usuario junto con los fragmentos documentales recuperados bajo una orden estricta: «Responde utilizando únicamente esta información y cita la fuente exacta».',
      '## ¿Para qué sirve el RAG dentro de tu organización?',
      'Implementar RAG convierte a la Inteligencia Artificial en un activo operativo con cuatro ventajas estratégicas inmediatas:',
      '- **Eliminación práctica de alucinaciones:** la IA ya no responde con lo que «cree», sino con lo que dicen los documentos oficiales aprobados por la entidad. Si la respuesta no figura en los archivos, el sistema lo declara abiertamente.',
      '- **Trazabilidad y auditoría total:** cada respuesta generada viene acompañada de la cita exacta (por ejemplo: «Extraído del Artículo 14 de la Directiva N° 003-2026»), permitiendo validar la información al instante.',
      '- **Actualización inmediata y bajo costo:** para actualizar el conocimiento del sistema no se requiere reentrenar modelos (proceso que toma semanas y miles de dólares). Basta con subir una nueva directiva o catálogo al repositorio para que la IA la aplique de inmediato.',
      '- **Gobernanza y control de accesos:** permite definir permisos según el perfil del usuario. Un colaborador de nivel operativo, un auditor y un gerente pueden consultar el mismo asistente, pero cada uno solo obtendrá respuestas derivadas de los documentos a los que tiene autorización explícita.',
      '## Casos de uso de alto impacto por sector',
      '### 1. Pequeños negocios y startups (MYPEs)',
      '- **Atención al cliente 24/7 sin fallas:** chatbots conectados a catálogos vigentes, tiempos de entrega, políticas de devolución y métodos de pago que atienden y cierran ventas por canales digitales con total precisión.',
      '- **Onboarding y manual de operaciones vivo:** centralización del conocimiento del negocio para que nuevos trabajadores consulten procedimientos de caja, inventario o recetas sin consumir tiempo del dueño o administrador.',
      '### 2. Medianas y grandes empresas (corporativo)',
      '- **Copilotos para áreas legales y de compras:** comparación instantánea de cláusulas contractuales con proveedores, detección de penalidades y análisis de pliegos de licitaciones en minutos.',
      '- **Soporte técnico y mesa de ayuda interna:** resolución automatizada de incidencias de TI y operaciones mediante la consulta directa de manuales de maquinaria o guías de sistemas.',
      '- **Unificación de silos de datos:** conexión de repositorios dispersos (archivos en la nube, intranets, correos y sistemas de tickets) en una única barra de búsqueda inteligente.',
      '### 3. Instituciones públicas y gobierno',
      '- **Ventanilla única de atención ciudadana:** asistentes para responder consultas sobre requisitos, costos y plazos del Texto Único de Procedimientos Administrativos (TUPA), orientando al ciudadano con lenguaje claro y base legal vigente.',
      '- **Apoyo a la labor resolutiva de funcionarios:** búsqueda rápida de precedentes administrativos, decretos supremos y ordenanzas entre decenas de miles de páginas digitalizadas.',
      '- **Estandarización y transparencia:** respuestas uniformes ante consultas ciudadanas similares, evitando interpretaciones arbitrarias y fortaleciendo la probidad administrativa.',
      '## Matriz de decisión: ¿por qué RAG sobre otras alternativas?',
      '| Factor evaluado | LLM aislado (genérico) | Fine-tuning (reentrenamiento) | Arquitectura RAG',
      '| Conocimiento de tu organización | Cero | Requiere semanas de ingeniería | Inmediato y directo',
      '| Riesgo de inventar datos | Muy alto | Medio a alto | Mínimo y controlado',
      '| Cita de documentos y fuentes | No disponible | No disponible | Nativa y verificable',
      '| Costo y complejidad técnica | Mínimo (solo suscripción) | Muy alto (alto consumo de GPU) | Moderado y predecible',
      '| Velocidad de actualización | Desfasado por meses | Lenta (reentrenamiento) | Instantánea (subir archivo)',
      '| Seguridad de datos privados | Riesgo de filtración | Riesgo en servidores externos | Alta gobernanza y control',
      '## Conclusión',
      'El verdadero valor de la Inteligencia Artificial en el entorno profesional no reside en crear modelos gigantescos, sino en conectar la capacidad analítica de la IA con el conocimiento exclusivo y confidencial de tu organización.',
      'RAG transforma archivos pasivos (PDFs, directivas, contratos y manuales que nadie lee por falta de tiempo) en un cerebro institucional activo. Para un negocio, significa mayor conversión y cero errores comerciales; para una institución pública, representa transparencia, eficiencia y una atención ciudadana moderna y confiable.',
    ],
  },
  {
    slug: 'agente-de-ia-para-whatsapp-atencion-a-cualquier-hora',
    topic: 'WhatsApp',
    title: 'Atención por WhatsApp a cualquier hora: qué puede hacer un agente de IA por tu negocio',
    excerpt:
      'Tus clientes escriben por WhatsApp a toda hora y esperan una respuesta rápida. Un agente de IA atiende, cotiza y agenda, y deriva a una persona cuando hace falta.',
    cover: {
      name: 'whatsapp',
      alt: 'Lámina «Atención por mensajería a cualquier hora»: los mensajes llegan de noche y en fin de semana; un bot de menú con solo tres opciones corta la conversación; un agente de IA responde con datos del negocio, cotiza, agenda y registra al cliente; y deriva a una persona con el historial completo.',
      width: 1280,
      height: 720,
    },
    body: [
      'Para muchos negocios en el Perú, WhatsApp es el canal principal de ventas. Por ahí llegan las preguntas por precios, horarios, stock y formas de pago. El problema es que los mensajes no respetan el horario de oficina: llegan de noche, los fines de semana o todos al mismo tiempo. Y cada mensaje que se queda sin respuesta es un cliente que puede escribirle a la competencia.',
      '## Chatbot de menú o agente de IA',
      'Los bots tradicionales funcionan con menús rígidos: «escriba 1 para precios, 2 para horarios». Si el cliente pregunta algo distinto, el bot no entiende y la conversación se frustra. Un agente de IA, en cambio, entiende lenguaje natural, incluso con errores de escritura o abreviaturas. Recuerda lo que se habló antes en la misma conversación y puede consultar tus sistemas para responder con datos reales.',
      'La diferencia se nota en la experiencia del cliente: no siente que habla con una máquina que le pone obstáculos, sino con un asistente que le resuelve la duda.',
      '## Qué tareas puede asumir',
      '- Responder preguntas frecuentes con información actualizada de tu negocio.',
      '- Preparar cotizaciones según tu catálogo y tus reglas de precios.',
      '- Agendar citas o reservas directamente en tu calendario.',
      '- Registrar los datos del cliente en tu CRM o en una hoja de cálculo.',
      '- Informar el estado de un pedido o enviar recordatorios.',
      '## Lo que conviene dejar a una persona',
      'Un buen agente sabe reconocer sus límites. Un reclamo delicado, una negociación especial o un caso fuera de tus políticas deben pasar a alguien de tu equipo. Lo importante es que esa derivación sea fluida: la persona que toma la conversación recibe el historial completo y el cliente no tiene que repetir todo desde el principio.',
      'También es una buena práctica ser transparente: el cliente debe saber que está hablando con un asistente virtual y que puede pedir hablar con una persona.',
      '## Requisitos para hacerlo bien',
      'La base es usar la API oficial de WhatsApp Business. Las aplicaciones no oficiales pueden llevar al bloqueo del número, algo que ningún negocio quiere arriesgar. Además, el agente necesita una base de conocimiento clara, reglas definidas sobre qué puede decidir solo y cuándo derivar, y una revisión periódica de las conversaciones para seguir mejorando sus respuestas.',
      '## Cómo empezar',
      'Revisa las conversaciones de las últimas semanas e identifica las preguntas que más se repiten. Ese suele ser el mejor punto de partida: un agente que resuelve bien lo frecuente libera a tu equipo para atender lo que de verdad necesita su criterio.',
      'En AFCRtecnologia desarrollamos agentes de IA para WhatsApp conectados a los sistemas de cada negocio. Si quieres ver cómo funcionaría con tus clientes, escríbenos y lo conversamos.',
    ],
  },
  {
    slug: 'automatizaciones-tareas-repetitivas-que-tu-equipo-puede-dejar',
    topic: 'Automatización',
    title: 'Las tareas repetitivas que tu equipo podría dejar de hacer a mano',
    excerpt:
      'Copiar datos entre sistemas, enviar recordatorios, armar reportes. Cuando estas tareas se automatizan, tu equipo recupera tiempo para el trabajo que sí requiere criterio.',
    cover: {
      name: 'automatizacion',
      alt: 'Lámina «De la tarea manual al flujo»: el ciclo de copiar un formulario, reenviar un correo y armar el reporte del lunes; el flujo en que llega un formulario, se crea el contacto y se avisa al vendedor, con factura, recordatorio y reporte semanal; y las tareas con IA de clasificar correos, extraer datos y resumir.',
      width: 1280,
      height: 720,
    },
    body: [
      'En casi todas las empresas hay tareas que nadie disfruta: copiar los datos de un formulario a una hoja de cálculo, reenviar correos al área correcta, armar el mismo reporte cada lunes o recordarle a un cliente que tiene un pago pendiente. Cada una toma pocos minutos, pero sumadas a lo largo de la semana consumen horas valiosas. Y como se hacen a mano, también son una fuente constante de errores.',
      '## Qué significa automatizar',
      'Automatizar es crear flujos que conectan tus aplicaciones y ejecutan acciones por sí solos: «cuando pase esto, haz aquello». Cuando llega un formulario, se registra en el CRM y se avisa al vendedor. Cuando se emite una factura, se guarda en la carpeta correcta y se notifica al cliente. Herramientas como n8n permiten construir estos flujos y conectar cientos de servicios sin desarrollar un sistema desde cero.',
      '## Ejemplos comunes',
      '- Un formulario de tu web que crea el contacto en tu CRM y avisa al vendedor por WhatsApp o correo.',
      '- Facturas o comprobantes recibidos por correo que se registran automáticamente en una hoja de control.',
      '- Recordatorios de citas, pagos o renovaciones que se envían solos en la fecha indicada.',
      '- Un reporte semanal que reúne datos de varias fuentes y llega listo a tu bandeja.',
      '- Inventario sincronizado entre tu tienda en línea y tu sistema interno.',
      '## Cuando la automatización se combina con IA',
      'Las automatizaciones tradicionales siguen reglas fijas. Al sumar inteligencia artificial pueden encargarse de tareas que antes exigían leer y entender: clasificar correos según su intención, extraer datos de documentos escaneados, resumir conversaciones largas o redactar un primer borrador de respuesta para que una persona lo revise.',
      '## Cómo identificar qué automatizar',
      'Un ejercicio sencillo es pedirle a tu equipo que anote durante una semana las tareas repetitivas que realiza. Las mejores candidatas son las que se hacen con frecuencia, siguen reglas claras y suelen generar errores cuando se hacen a mano. Empieza por una de ellas, mide el resultado y avanza a la siguiente.',
      '## Errores que conviene evitar',
      '- Automatizar un proceso desordenado: primero hay que entenderlo y simplificarlo.',
      '- No prever fallas: un buen flujo avisa cuando algo sale mal, en lugar de detenerse en silencio.',
      '- Depender de una sola persona: los flujos deben estar documentados para que cualquiera pueda mantenerlos.',
      'En AFCRtecnologia diseñamos automatizaciones a la medida de cada operación, con n8n e inteligencia artificial cuando aporta valor. Si tienes en mente una tarea que te gustaría dejar de hacer a mano, cuéntanosla y vemos juntos cómo resolverla.',
    ],
  },
  {
    slug: 'agentes-de-ia-personalizados-mas-alla-del-chatbot',
    topic: 'Agentes',
    title: 'Agentes de IA personalizados: cuando un chatbot genérico ya no es suficiente',
    excerpt:
      'Un agente de IA no solo conversa: consulta tus sistemas, sigue tus reglas y ejecuta tareas. Así se diferencia de un asistente genérico y así se diseña uno para tu empresa.',
    cover: {
      name: 'agentes',
      alt: 'Lámina «Del chatbot al agente que actúa»: un chatbot genérico que solo conversa; un agente unido al CRM, al correo, a documentos y a tickets que prepara una propuesta con las plantillas del negocio; y una compuerta de aprobación humana para enviar, borrar o hablar con un cliente importante.',
      width: 1280,
      height: 720,
    },
    body: [
      'Muchas empresas ya probaron asistentes de IA genéricos: ayudan a redactar un correo o a resumir un documento, pero se quedan cortos cuando el trabajo depende de los sistemas, los datos y las reglas propias del negocio. Ahí es donde entran los agentes de IA personalizados.',
      '## De responder a actuar',
      'Un chatbot conversa. Un agente, además, actúa. Puede consultar una base de datos, crear un ticket, enviar un correo, generar un documento o actualizar un registro, y encadenar varios de esos pasos para completar una tarea. Le das un objetivo, como «prepara la propuesta para este cliente», y el agente reúne la información, aplica tus plantillas y te entrega el resultado para revisar.',
      '## Por qué personalizado',
      'Cada empresa tiene sus procesos, su vocabulario y sus permisos. Un agente personalizado se conecta con tus herramientas, como tu ERP, tu CRM o tus hojas de cálculo, y trabaja con tus reglas. Un asistente genérico no puede hacer eso, porque no tiene acceso a tus sistemas ni conoce la forma en que tu equipo toma decisiones.',
      '## Algunos ejemplos',
      '- Un agente comercial que prepara propuestas con tus plantillas y precios vigentes.',
      '- Un agente de soporte interno que resuelve consultas frecuentes de TI o de recursos humanos.',
      '- Un agente que revisa expedientes o documentos y marca la información que falta.',
      '- Un agente que monitorea indicadores y te envía un resumen cuando algo se sale de lo normal.',
      '## Control y seguridad',
      'Darle autonomía a una IA exige poner límites claros. Las acciones sensibles, como enviar dinero, borrar datos o comunicarse con un cliente importante, deben requerir la aprobación de una persona. Cada acción del agente debe quedar registrada para poder revisarla. Y hay que decidir dónde vive la información: para datos sensibles existen alternativas abiertas, como Hermes Agent de Nous Research, que pueden ejecutarse en la infraestructura de la propia empresa.',
      '## Cómo empezar',
      'El mejor primer agente resuelve un proceso concreto y bien conocido, no «todo a la vez». Conviene empezar con un piloto en un área, definir qué significa que funcione bien y ampliar sus responsabilidades a medida que demuestra que es confiable.',
      'En AFCRtecnologia diseñamos agentes de IA personalizados, desde la definición del proceso hasta la puesta en marcha y el monitoreo. Si tienes un proceso que te gustaría delegar a un agente, conversemos sobre cómo hacerlo de forma segura.',
    ],
  },
  {
    slug: 'pagina-web-profesional-tu-primera-impresion',
    topic: 'Web',
    title: 'Tu página web es tu primera impresión: lo que un cliente decide en pocos segundos',
    excerpt:
      'Antes de escribirte, un cliente revisa tu web. La velocidad, la claridad y la confianza deciden si te contacta o vuelve a Google a buscar otra opción.',
    cover: {
      name: 'web',
      alt: 'Lámina «La web como primera impresión»: las tres preguntas de qué haces, si es para el visitante y cómo contactarte; un celular que tarda frente a una página clara; y las señales de dominio propio, candado, contacto real e información al día, con el camino del formulario al correo o al CRM.',
      width: 1280,
      height: 720,
    },
    body: [
      'Las redes sociales son útiles para darte a conocer, pero no son tu casa: no controlas el algoritmo, el formato ni las reglas, que pueden cambiar en cualquier momento. Tu página web es el único espacio digital que es completamente tuyo. Y en la mayoría de los casos es lo primero que revisa un cliente antes de decidir si te escribe.',
      '## Lo que el visitante necesita encontrar',
      'Quien llega a tu web quiere responder tres preguntas casi de inmediato: qué haces, si eso es para él y cómo contactarte. Si tiene que buscar demasiado, se va. Una buena web no intenta decirlo todo en la portada: ordena la información para que cada visitante encuentre rápido lo que necesita y sepa cuál es el siguiente paso.',
      '## Rapidez y celular',
      'Gran parte de las visitas llega desde el celular, muchas veces con conexión móvil. Una web lenta o que se ve mal en una pantalla pequeña pierde clientes antes de que lean una sola línea. Por eso el diseño debe pensarse primero para el celular, con imágenes optimizadas y botones que se puedan tocar con comodidad.',
      '## Señales de confianza',
      '- Un dominio propio y una conexión segura (el candado del navegador).',
      '- Datos de contacto reales y fáciles de encontrar.',
      '- Información actualizada: una web abandonada transmite un negocio abandonado.',
      '- Un diseño cuidado y coherente con tu marca.',
      '## Que te encuentren',
      'Una web que nadie visita no cumple su función. Una buena estructura, títulos y descripciones bien escritos y contenido útil para tus clientes ayudan a que Google te muestre cuando alguien busca lo que ofreces. Si tienes un local, conviene complementarla con un perfil de empresa en Google bien configurado.',
      '## Una web que trabaja para ti',
      'La web no debería ser solo una vitrina. Puede recibir solicitudes con un formulario conectado a tu correo o a tu CRM, llevar al cliente directo a WhatsApp y medir cuántas personas te visitan y desde dónde. Así deja de ser un gasto y se convierte en una herramienta de ventas.',
      'En AFCRtecnologia diseñamos y desarrollamos páginas web rápidas, claras y pensadas para que tus visitantes te contacten. Si tu web actual no te representa o todavía no tienes una, conversemos sobre lo que necesitas.',
    ],
  },
  {
    slug: 'capacitacion-en-ia-para-equipos',
    topic: 'Capacitación',
    title: 'Usar la IA bien en tu equipo: por qué la capacitación va antes que la herramienta',
    excerpt:
      'Es probable que tu equipo ya use IA, con o sin permiso. Capacitarlo convierte ese uso improvisado en productividad real y evita riesgos con información sensible.',
    cover: {
      name: 'capacitacion',
      alt: 'Lámina «Capacitar antes que comprar la herramienta»: el uso improvisado que mete un contrato y una lista de clientes en una herramienta pública; qué aprender, incluidos los límites, las instrucciones, la verificación y qué no se comparte; y la práctica con el informe mensual y una guía interna.',
      width: 1280,
      height: 720,
    },
    body: [
      'Aunque tu empresa no haya adoptado oficialmente la inteligencia artificial, es muy probable que tu equipo ya la esté usando: para redactar correos, resumir documentos o resolver dudas. Eso no es malo en sí mismo, pero cuando el uso es improvisado aparecen riesgos que muchas organizaciones no ven hasta que es tarde.',
      '## Los riesgos del uso improvisado',
      '- Copiar datos de clientes, contratos o información financiera en herramientas públicas sin saber dónde terminan.',
      '- Confiar en respuestas que suenan seguras, pero que son incorrectas o están desactualizadas.',
      '- Resultados muy distintos entre personas, porque cada una usa la herramienta a su manera.',
      '- Perder oportunidades: muchos solo usan una fracción de lo que estas herramientas pueden hacer.',
      '## Qué debería aprender un equipo',
      'Una buena capacitación no se trata de memorizar comandos. Busca que las personas entiendan cómo funcionan estas herramientas y dónde están sus límites, que sepan dar instrucciones claras, que verifiquen lo que reciben antes de usarlo y que tengan claro qué información nunca deben compartir. Sobre todo, debe mostrar casos prácticos del trabajo diario de cada área.',
      '## Práctica, no teoría',
      'Lo que más funciona es trabajar con tareas reales del equipo: el informe que preparan cada mes, los correos que responden a diario, los documentos que revisan. Cuando una persona ve que la IA le ahorra trabajo en su propia tarea, la adopción es natural. Por eso conviene adaptar el contenido por áreas y por nivel: no necesita lo mismo la gerencia que el equipo operativo.',
      '## Reglas claras de uso',
      'La capacitación funciona mejor si viene acompañada de una guía interna: qué herramientas están aprobadas, qué tipo de información se puede usar con ellas y quién responde las dudas. Esa guía protege a la empresa y da tranquilidad al equipo, porque sabe exactamente qué está permitido.',
      '## En instituciones educativas',
      'Colegios, institutos y universidades enfrentan un reto particular: los estudiantes ya usan IA. Capacitar a docentes y directivos les permite aprovecharla para preparar clases y materiales, y a la vez definir criterios claros sobre su uso en tareas y evaluaciones.',
      'En AFCRtecnologia damos capacitaciones y charlas sobre el uso adecuado de la IA, adaptadas a cada organización y a cada equipo. Si quieres que tu equipo la use con criterio y seguridad, conversemos sobre el formato que mejor le sirve.',
    ],
  },
  {
    slug: 'software-a-medida-o-solucion-de-paquete',
    topic: 'Software',
    title: 'Software a medida o solución de paquete: cómo saber qué necesita tu empresa',
    excerpt:
      'Un sistema estándar sirve hasta que tu operación empieza a adaptarse a él. Estas son las señales de que conviene desarrollar software propio y cómo hacerlo con menos riesgo.',
    cover: {
      name: 'software',
      alt: 'Lámina «Paquete o software a medida»: contabilidad y correo como procesos que ya cubre un paquete; el mismo registro copiado en varios lugares cuando hace falta algo propio; aplicación web desde el navegador y aplicación móvil con cámara, ubicación o sin conexión; y el camino de una primera versión, entregas por etapas y código y datos propios.',
      width: 1280,
      height: 720,
    },
    body: [
      'Muchas empresas funcionan con una mezcla de hojas de cálculo, aplicaciones sueltas y un sistema comprado que cubre parte del trabajo. Al inicio basta. Con el crecimiento aparecen los parches: datos que se copian a mano de un lugar a otro, procesos que dependen de una sola persona y reportes que toman horas en armarse.',
      '## Cuándo basta una solución estándar',
      'No todo necesita desarrollarse desde cero. Para procesos comunes, como la contabilidad o el correo, las soluciones existentes suelen ser la mejor opción: están probadas y se actualizan solas. El software a medida tiene sentido cuando tu forma de trabajar es distinta y esa diferencia importa.',
      '## Señales de que necesitas algo propio',
      '- Tu equipo hace trabajo manual para «puentear» lo que tus sistemas no hacen.',
      '- La misma información se registra en varios lugares y nunca coincide.',
      '- Pagas licencias por funciones que no usas, mientras te faltan las que sí necesitas.',
      '- Necesitas una aplicación para tus clientes o para tu personal de campo.',
      '- Tu manera de operar es parte de tu ventaja frente a la competencia.',
      '## Aplicación web o móvil',
      'Una aplicación web funciona desde cualquier navegador, sin instalar nada, y es ideal para sistemas internos y portales de clientes. Una aplicación móvil tiene sentido cuando necesitas la cámara, la ubicación, notificaciones o trabajar sin conexión, como ocurre con el personal de campo o con las aplicaciones que tus clientes usan a diario. Muchas veces la respuesta es una combinación de ambas.',
      '## Cómo reducir el riesgo',
      'El temor más común con el software a medida es que el proyecto se alargue o no resuelva el problema. La forma de evitarlo es empezar con una primera versión enfocada en lo esencial, entregar por etapas para validar cada avance con quienes lo van a usar y ajustar sobre la marcha. También es clave que el código y los datos sean tuyos, que el sistema quede documentado y que se integre con lo que ya tienes, incluida la facturación electrónica.',
      '## Una inversión en tu forma de trabajar',
      'Un buen sistema a medida no solo automatiza: ordena. Obliga a definir cómo se hacen las cosas, deja la información en un solo lugar y te permite tomar decisiones con datos confiables.',
      'En AFCRtecnologia desarrollamos aplicaciones web y móviles a la medida de cada negocio. Si sientes que tus sistemas actuales te frenan, conversemos y te ayudamos a definir el camino más conveniente, incluso si la respuesta es una solución que ya existe.',
    ],
  },
  {
    slug: 'mini-pcs-y-camaras-de-seguridad-para-tu-negocio',
    topic: 'Dispositivos',
    title: 'Mini PCs y cámaras de seguridad: tecnología compacta que ordena y protege tu negocio',
    excerpt:
      'Un mini PC ocupa poco espacio y suele consumir menos energía que una torre; las cámaras te dejan ver tu local desde el celular. Bien elegidos e instalados, simplifican el día a día.',
    cover: {
      name: 'dispositivos',
      alt: 'Lámina «Mini PC y cámaras para el local»: un mini PC en caja o recepción, silencioso y de poco espacio; el plano de una tienda con cámaras en caja, estanterías, almacén y entrada, y la vista desde el celular; y el cartel de zona de videovigilancia, con aviso, contraseña de fábrica e instalación.',
      width: 1280,
      height: 720,
    },
    body: [
      'No toda la tecnología de una empresa es software. Los equipos donde trabaja tu equipo y los dispositivos que protegen tu local también influyen en la productividad y en la tranquilidad del día a día. Dos opciones que se han vuelto muy populares son los mini PC y los sistemas de cámaras de seguridad.',
      '## Qué es un mini PC y dónde encaja',
      'Un mini PC es una computadora completa en un formato muy pequeño, que incluso puede montarse detrás del monitor. Suele ser silencioso y consumir menos energía que una computadora de torre. Es una buena opción para recepción, caja o punto de venta, pantallas informativas, oficinas con poco espacio y puestos de trabajo administrativo.',
      '## También para tecnología propia',
      'Un mini PC también puede funcionar como un pequeño servidor: ejecutar automatizaciones, alojar herramientas internas o, según su capacidad, correr modelos de inteligencia artificial de forma local para tareas puntuales. Es una manera accesible de tener servicios propios sin depender por completo de la nube.',
      '## Cámaras de seguridad: más que grabar',
      'Los sistemas actuales permiten ver tu local en tiempo real desde el celular, recibir alertas cuando detectan movimiento en horarios definidos y revisar las grabaciones cuando ocurre un incidente. Para que realmente sirvan, hay que pensar bien la ubicación de cada cámara, la visión nocturna y dónde se guardan las grabaciones: en un equipo local, en la nube o en ambos.',
      '## Cómo elegir bien',
      '- No decidas solo por precio: revisa la garantía, el soporte y la disponibilidad de repuestos.',
      '- Elige la resolución según lo que necesitas ver, por ejemplo un rostro o una placa.',
      '- Verifica que los equipos sean compatibles con tu red y con los sistemas que ya usas.',
      '- Piensa en el crecimiento: cuántas cámaras o equipos podrías necesitar más adelante.',
      '## Privacidad y buenas prácticas',
      'En el Perú, la normativa de protección de datos personales pide informar a las personas que están siendo grabadas, por ejemplo con carteles visibles de videovigilancia. Además, es fundamental cambiar las contraseñas que vienen de fábrica, mantener los equipos actualizados y limitar quién puede acceder a las grabaciones. Una cámara mal configurada puede quedar expuesta en internet.',
      '## La instalación también cuenta',
      'Un buen equipo mal instalado rinde poco. La configuración de la red, el cableado, el ángulo de cada cámara y la puesta a punto del mini PC marcan la diferencia entre una compra que funciona y una que genera problemas.',
      'En AFCRtecnologia vendemos mini PC y cámaras de seguridad, y te ayudamos a elegir los equipos adecuados para tu negocio. Si estás evaluando renovar tus equipos o proteger tu local, escríbenos y te orientamos.',
    ],
  },
];

export function getResourceArticle(slug: string): ResourceArticle | undefined {
  return resourceArticles.find((article) => article.slug === slug);
}

/** Dos articulos para seguir leyendo: los siguientes en el orden de la lista. */
export function relatedResourceArticles(article: ResourceArticle): ResourceArticle[] {
  const index = resourceArticles.findIndex((item) => item.slug === article.slug);
  return [1, 2]
    .map((offset) => resourceArticles[(index + offset) % resourceArticles.length])
    .filter((item): item is ResourceArticle => item !== undefined && item.slug !== article.slug);
}

/** Rutas publicas de cada tamano de una portada. */
export function coverSources(cover: ResourceCoverImage) {
  const base = `/recursos/${cover.name}`;
  return {
    src: `${base}-1600.webp`,
    srcSet: `${base}-800.webp 800w, ${base}-1600.webp 1600w, ${base}-${cover.width}.webp ${cover.width}w`,
    full: `${base}-${cover.width}.webp`,
    og: `${base}-og.jpg`,
  };
}

export function resourceHref(slug: string): string {
  return `/recursos/${slug}`;
}

/** Textos de la seccion Recursos (Home) y de cada articulo. */
export const resourcesCopy = {
  /** Se muestra en mayusculas con CSS (pedido del usuario: «RECURSOS»). */
  sectionTitle: 'Recursos',
  lede: 'Artículos del equipo de AFCRtecnologia para entender cómo la tecnología y la IA pueden ayudar a tu negocio.',
  author: 'Equipo de AFCRtecnologia',
  authorLabel: 'Autor',
  readingLabel: 'de lectura',
  readMore: 'Leer artículo',
  /** Enlace bajo la portada: las infografias se leen mejor a tamano completo. */
  coverFull: 'Ver imagen en tamaño completo',
  back: 'Volver a recursos',
  relatedTitle: 'Sigue leyendo',
  ctaTitle: '¿Quieres aplicar esto en tu negocio?',
  ctaBody: 'Cuéntanos qué necesitas y te respondemos con los siguientes pasos.',
  ctaButton: 'Hablemos',
};
