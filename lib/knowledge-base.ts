// Base de conocimiento completa para el chatbot IA

export interface KnowledgeArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  videoUrl?: string;
  relatedArticles?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  relatedArticles: string[];
}

export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: 'kb-001',
    title: 'Primeros pasos con INMOVA',
    excerpt: 'Guía completa para comenzar a usar INMOVA desde cero.',
    content: `# Primeros pasos con INMOVA

Bienvenido a INMOVA, la plataforma integral de gestión inmobiliaria.

## 1. Configuración inicial
- Completa tu perfil de empresa
- Añade tu primer edificio
- Registra las unidades disponibles

## 2. Gestión básica
- Crea contratos de alquiler
- Registra inquilinos
- Configura pagos recurrentes

## 3. Automatizaciones
- Activa recordatorios de pago
- Configura alertas de vencimiento
- Programa reportes automáticos`,
    category: 'Onboarding',
    tags: ['inicio', 'primeros-pasos', 'configuración'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-002', 'kb-003'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
  },
  {
    id: 'kb-002',
    title: 'Cómo crear tu primer edificio',
    excerpt: 'Paso a paso para registrar edificios y propiedades.',
    content: `# Cómo crear tu primer edificio

## Datos básicos requeridos
1. Nombre del edificio
2. Dirección completa
3. Número total de unidades
4. Datos del propietario

## Información adicional (opcional)
- Fotos del edificio
- Planos
- Amenidades
- Historia del edificio

## Configuración avanzada
- Gastos comunes
- Servicios incluidos
- Normativas específicas`,
    category: 'Edificios',
    tags: ['edificios', 'propiedades', 'registro'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-001', 'kb-004'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
  },
  {
    id: 'kb-003',
    title: 'Gestión de unidades y apartamentos',
    excerpt: 'Administra las unidades dentro de cada edificio.',
    content: `# Gestión de unidades

## Tipos de unidades
- Apartamentos
- Locales comerciales
- Oficinas
- Habitaciones (alquiler compartido)

## Estados de ocupación
- Disponible
- Ocupado
- En mantenimiento
- Reservado

## Configuración por unidad
- Precio de alquiler
- Fianza requerida
- Servicios incluidos
- Restricciones (mascotas, fumar, etc.)`,
    category: 'Unidades',
    tags: ['unidades', 'apartamentos', 'disponibilidad'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-002', 'kb-005'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
  },
  {
    id: 'kb-004',
    title: 'Registro y verificación de inquilinos',
    excerpt: 'Cómo dar de alta inquilinos y verificar su idoneidad.',
    content: `# Registro de inquilinos

## Datos personales
- Nombre completo
- Documento de identidad
- Información de contacto
- Datos laborales

## Verificación automática
El sistema de INMOVA incluye:
- Scoring de solvencia
- Verificación de documentos
- Historial de pagos
- Referencias automáticas

## Documentación requerida
- DNI/Pasaporte
- Última nómina o declaración de renta
- Carta de recomendación laboral
- Referencias personales`,
    category: 'Inquilinos',
    tags: ['inquilinos', 'verificación', 'screening'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-005', 'kb-006'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
  },
  {
    id: 'kb-005',
    title: 'Contratos digitales y firma electrónica',
    excerpt: 'Crea y firma contratos con validez legal completa.',
    content: `# Contratos digitales

## Tipos de contratos
- Alquiler residencial
- Alquiler comercial
- Alquiler turístico
- Alquiler por habitaciones

## Proceso de creación
1. Selecciona plantilla
2. Completa datos automáticamente
3. Personaliza cláusulas
4. Envía para firma digital

## Firma electrónica
- Validez legal completa
- Notificaciones automáticas
- Seguimiento en tiempo real
- Certificado con timestamp`,
    category: 'Contratos',
    tags: ['contratos', 'firma-digital', 'legal'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-004', 'kb-007'],
    difficulty: 'intermediate',
    estimatedReadTime: 7,
  },
  {
    id: 'kb-006',
    title: 'Sistema de pagos y cobranza',
    excerpt: 'Gestiona pagos, recibos y morosidad automáticamente.',
    content: `# Sistema de pagos

## Métodos de pago
- Transferencia bancaria
- Tarjeta de crédito/débito
- Domiciliación bancaria
- Pago en efectivo

## Automatización
- Cargos recurrentes mensuales
- Recordatorios automáticos
- Recibos generados automáticamente
- Notificaciones de pago recibido

## Gestión de morosidad
- Alertas tempranas de riesgo
- Recordatorios escalonados
- Bloqueo de acceso automático
- Gestión de pagos atrasados`,
    category: 'Pagos',
    tags: ['pagos', 'cobros', 'morosidad'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-007', 'kb-008'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
  },
  {
    id: 'kb-007',
    title: 'Mantenimiento preventivo y correctivo',
    excerpt: 'Programa mantenimientos y gestiona incidencias.',
    content: `# Sistema de mantenimiento

## Mantenimiento preventivo
- Revisiones programadas
- Inspecciones periódicas
- Alertas automáticas
- Historial completo

## Gestión de incidencias
1. Inquilino reporta problema
2. Sistema categoriza y prioriza
3. Asigna a proveedor adecuado
4. Seguimiento automático
5. Cierre y valoración

## Red de proveedores
- Base de datos de proveedores
- Sistema de valoraciones
- Asignación automática
- Portal para proveedores`,
    category: 'Mantenimiento',
    tags: ['mantenimiento', 'incidencias', 'proveedores'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-008', 'kb-009'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
  },
  {
    id: 'kb-008',
    title: 'Business Intelligence y analítica',
    excerpt: 'Aprovecha el poder de los datos para tomar mejores decisiones.',
    content: `# Business Intelligence

## KPIs principales
- Tasa de ocupación
- Ingresos totales y netos
- ROI por propiedad
- Tiempo medio de alquiler
- Tasa de morosidad

## Análisis predictivo
- Predicción de morosidad
- Forecast de ingresos
- Análisis de rotación
- Optimización de precios

## Visualizaciones
- Dashboards interactivos
- Gráficos personalizables
- Mapas de calor
- Tendencias históricas`,
    category: 'BI',
    tags: ['analytics', 'reportes', 'datos'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-009', 'kb-010'],
    difficulty: 'advanced',
    estimatedReadTime: 8,
  },
  {
    id: 'kb-009',
    title: 'Automatizaciones y workflows',
    excerpt: 'Configura automatizaciones para ahorrar tiempo.',
    content: `# Sistema de automatizaciones

## Automatizaciones disponibles
- Recordatorios de pago
- Alertas de vencimiento de contratos
- Seguimiento de morosidad
- Mantenimiento programado
- Reportes automáticos

## Workflows personalizados
- Proceso de onboarding de inquilinos
- Gestión de solicitudes de mantenimiento
- Renovación de contratos
- Proceso de desahucio

## Configuración
1. Selecciona trigger
2. Define condiciones
3. Configura acciones
4. Activa workflow`,
    category: 'Automatización',
    tags: ['automatización', 'workflows', 'productividad'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-010', 'kb-011'],
    difficulty: 'advanced',
    estimatedReadTime: 7,
  },
  {
    id: 'kb-010',
    title: 'Integración con sistemas externos',
    excerpt: 'Conecta INMOVA con tus herramientas favoritas.',
    content: `# Integraciones

## Integraciones disponibles
- Contabilidad (Sage, ContaPlus)
- Banca (API PSD2, Redsys)
- Firma digital (DocuSign)
- Email marketing
- WhatsApp Business

## API de INMOVA
- REST API completa
- Webhooks en tiempo real
- Documentación detallada
- SDKs en varios lenguajes

## Casos de uso
- Sincronización contable
- Pagos automáticos
- Notificaciones multicanal
- Importación de datos`,
    category: 'Integraciones',
    tags: ['api', 'integraciones', 'webhooks'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-009', 'kb-011'],
    difficulty: 'advanced',
    estimatedReadTime: 9,
  },
  {
    id: 'kb-011',
    title: 'Seguridad y cumplimiento GDPR',
    excerpt: 'Protección de datos y cumplimiento normativo.',
    content: `# Seguridad y privacidad

## Medidas de seguridad
- Cifrado end-to-end
- Autenticación de dos factores
- Auditoría de accesos
- Backups automáticos

## Cumplimiento GDPR
- Consentimiento explícito
- Derecho al olvido
- Portabilidad de datos
- Registro de tratamientos

## Buenas prácticas
- Contraseñas seguras
- Permisos granulares
- Revisión periódica de accesos
- Formación en seguridad`,
    category: 'Seguridad',
    tags: ['seguridad', 'gdpr', 'privacidad'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-001', 'kb-010'],
    difficulty: 'advanced',
    estimatedReadTime: 10,
  },
  {
    id: 'kb-012',
    title: 'Portal del inquilino',
    excerpt: 'Funcionalidades disponibles para tus inquilinos.',
    content: `# Portal del inquilino

## Acceso al portal
- Credenciales automáticas por email
- Login con email y contraseña
- Recuperación de contraseña

## Funcionalidades
- Ver contrato y documentos
- Historial de pagos
- Descargar recibos
- Reportar incidencias
- Comunicación con gestor
- Solicitar servicios del marketplace

## Notificaciones
- Recordatorios de pago
- Actualizaciones de mantenimiento
- Mensajes del gestor
- Renovación de contrato`,
    category: 'Portal Inquilino',
    tags: ['portal', 'inquilinos', 'autoservicio'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-004', 'kb-013'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
  },
  {
    id: 'kb-013',
    title: 'Marketplace de servicios',
    excerpt: 'Ofrece servicios adicionales a tus inquilinos.',
    content: `# Marketplace de servicios

## Servicios disponibles
- Limpieza profesional
- Reparaciones del hogar
- Instalaciones (TV, internet)
- Seguros de hogar
- Mudanzas
- Almacenamiento

## Beneficios
- Ingresos adicionales por comisión
- Mayor satisfacción del inquilino
- Red de proveedores verificados
- Gestión simplificada

## Para gestores
- Panel de administración
- Gestión de cotizaciones
- Seguimiento de trabajos
- Sistema de comisiones`,
    category: 'Marketplace',
    tags: ['marketplace', 'servicios', 'proveedores'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-007', 'kb-014'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
  },
  {
    id: 'kb-014',
    title: 'CRM y gestión comercial',
    excerpt: 'Convierte leads en clientes con el CRM integrado.',
    content: `# CRM y ventas

## Pipeline de ventas
- Visualización Kanban
- Etapas personalizables
- Scoring automático de leads
- Seguimiento de conversiones

## Gestión de leads
- Captura desde web
- Importación masiva
- Asignación automática
- Nurturing automatizado

## Comunicación
- Emails predefinidos
- WhatsApp integrado
- Registro de llamadas
- Historial completo

## Análisis
- Tasa de conversión
- Valor del pipeline
- Performance por comercial
- Reportes ejecutivos`,
    category: 'CRM',
    tags: ['crm', 'ventas', 'leads'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-015', 'kb-008'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
  },
  {
    id: 'kb-015',
    title: 'Alquiler por habitaciones',
    excerpt: 'Gestiona pisos compartidos y co-living spaces.',
    content: `# Alquiler por habitaciones

## Configuración
- Divide unidades en habitaciones
- Asigna características por habitación
- Define áreas comunes
- Establece reglas de convivencia

## Prorrateo de gastos
- Configuración de método
- Cálculo automático
- Pagos individualizados
- Transparencia total

## Gestión de convivencia
- Calendarios de limpieza
- Turnos automáticos
- Notificaciones a inquilinos
- Registro de cumplimiento

## Comunicación grupal
- Chat de grupo
- Tablón de anuncios
- Votaciones
- Resolución de conflictos`,
    category: 'Habitaciones',
    tags: ['habitaciones', 'co-living', 'compartido'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['kb-003', 'kb-006'],
    difficulty: 'advanced',
    estimatedReadTime: 7,
  },
];

export const faqs: FAQ[] = [
  {
    id: 'faq-001',
    question: '¿Cómo empiezo a usar INMOVA?',
    answer:
      'Primero completa tu perfil de empresa, luego añade tu primer edificio con sus unidades. Después, podrás registrar inquilinos y crear contratos. Te recomendamos seguir nuestro tour de onboarding que te guiará paso a paso.',
    category: 'Onboarding',
    keywords: ['inicio', 'primeros pasos', 'comenzar', 'empezar'],
    relatedArticles: ['kb-001', 'kb-002'],
  },
  {
    id: 'faq-002',
    question: '¿Puedo importar mis datos existentes?',
    answer:
      'Sí, INMOVA permite importar datos desde Excel o CSV. Ve a Configuración > Importación de datos y sigue las instrucciones. También ofrecemos servicio de migración asistida para grandes volúmenes de datos.',
    category: 'Configuración',
    keywords: ['importar', 'migración', 'datos', 'excel', 'csv'],
    relatedArticles: ['kb-010', 'kb-001'],
  },
  {
    id: 'faq-003',
    question: '¿Los contratos digitales tienen validez legal?',
    answer:
      'Sí, absolutamente. Los contratos firmados digitalmente en INMOVA tienen la misma validez legal que los manuscritos según la normativa europea eIDAS. Cada firma incluye certificado con timestamp y es admisible como prueba en tribunales.',
    category: 'Contratos',
    keywords: ['firma digital', 'validez', 'legal', 'contratos'],
    relatedArticles: ['kb-005', 'kb-011'],
  },
  {
    id: 'faq-004',
    question: '¿Cómo funcionan los pagos automáticos?',
    answer:
      'Puedes configurar pagos recurrentes mensuales vinculados a cada contrato. El sistema generará automáticamente los cargos, enviará recordatorios al inquilino y registrará el pago cuando se complete. Soporta domiciliación bancaria, tarjeta y transferencias.',
    category: 'Pagos',
    keywords: ['pagos', 'automático', 'recurrente', 'domiciliación'],
    relatedArticles: ['kb-006', 'kb-005'],
  },
  {
    id: 'faq-005',
    question: '¿Qué hago si un inquilino no paga?',
    answer:
      'El sistema de INMOVA incluye gestión automatizada de morosidad: 1) Alertas tempranas de riesgo, 2) Recordatorios automáticos escalonados, 3) Bloqueo de acceso al portal, 4) Generación de documentación legal, 5) Gestión de procesos de cobro.',
    category: 'Morosidad',
    keywords: ['morosidad', 'impago', 'no paga', 'deuda'],
    relatedArticles: ['kb-006', 'kb-005'],
  },
  {
    id: 'faq-006',
    question: '¿Puedo gestionar múltiples propiedades?',
    answer:
      'Sí, INMOVA está diseñado para gestionar desde 1 hasta miles de propiedades. Puedes organizar tus edificios por zonas, crear grupos, aplicar filtros avanzados y generar reportes consolidados o individuales.',
    category: 'Edificios',
    keywords: ['múltiples propiedades', 'varios edificios', 'portfolio'],
    relatedArticles: ['kb-002', 'kb-008'],
  },
  {
    id: 'faq-007',
    question: '¿Los inquilinos tienen acceso a la plataforma?',
    answer:
      'Sí, cada inquilino recibe acceso a su portal personal donde puede: ver su contrato, descargar recibos, reportar incidencias, comunicarse contigo, y solicitar servicios del marketplace. Todo desde su móvil o computadora.',
    category: 'Portal Inquilino',
    keywords: ['portal inquilino', 'acceso', 'autoservicio'],
    relatedArticles: ['kb-012', 'kb-004'],
  },
  {
    id: 'faq-008',
    question: '¿Cómo reportan incidencias los inquilinos?',
    answer:
      'Los inquilinos pueden reportar incidencias desde su portal con fotos, descripción y prioridad. El sistema categoriza automáticamente, asigna a un proveedor de tu red, y envía notificaciones de progreso. Tú mantienes control total del proceso.',
    category: 'Mantenimiento',
    keywords: ['incidencias', 'averías', 'mantenimiento', 'reportar'],
    relatedArticles: ['kb-007', 'kb-012'],
  },
  {
    id: 'faq-009',
    question: '¿Qué reportes puedo generar?',
    answer:
      'INMOVA incluye más de 50 tipos de reportes: financieros (ingresos, gastos, ROI), operativos (ocupación, rotación), de morosidad, mantenimiento, y más. Puedes exportarlos en Excel o PDF y programar envíos automáticos por email.',
    category: 'Reportes',
    keywords: ['reportes', 'informes', 'estadísticas', 'exportar'],
    relatedArticles: ['kb-008', 'kb-009'],
  },
  {
    id: 'faq-010',
    question: '¿Es seguro almacenar datos en INMOVA?',
    answer:
      'Totalmente seguro. Usamos cifrado de grado bancario, backups diarios automáticos, autenticación de dos factores, y cumplimos estrictamente con GDPR. Nuestros servidores están en Europa y auditados regularmente.',
    category: 'Seguridad',
    keywords: ['seguridad', 'privacidad', 'datos', 'gdpr'],
    relatedArticles: ['kb-011', 'kb-001'],
  },
  {
    id: 'faq-011',
    question: '¿Puedo personalizar los contratos?',
    answer:
      'Sí, puedes usar nuestras plantillas predefinidas (que cumplen toda la normativa) y personalizarlas añadiendo o modificando cláusulas. También puedes crear tus propias plantillas desde cero para reutilizarlas.',
    category: 'Contratos',
    keywords: ['personalizar', 'plantillas', 'contratos', 'cláusulas'],
    relatedArticles: ['kb-005', 'kb-009'],
  },
  {
    id: 'faq-012',
    question: '¿Cómo funciona el marketplace de servicios?',
    answer:
      'El marketplace conecta a tus inquilinos con servicios adicionales (limpieza, reparaciones, seguros). Tú ganas una comisión por cada servicio contratado, aumentas la satisfacción del inquilino, y todo se gestiona desde INMOVA.',
    category: 'Marketplace',
    keywords: ['marketplace', 'servicios', 'comisión', 'proveedores'],
    relatedArticles: ['kb-013', 'kb-007'],
  },
  {
    id: 'faq-013',
    question: '¿Puedo gestionar alquiler por habitaciones?',
    answer:
      'Sí, INMOVA incluye un módulo completo para alquiler por habitaciones con: contratos individuales, prorrateo automático de gastos, calendarios de limpieza, reglas de convivencia, y comunicación grupal.',
    category: 'Habitaciones',
    keywords: ['habitaciones', 'compartido', 'co-living', 'prorrateo'],
    relatedArticles: ['kb-015', 'kb-003'],
  },
  {
    id: 'faq-014',
    question: '¿Hay límite de usuarios o edificios?',
    answer:
      'No, INMOVA no tiene límites. Puedes añadir tantos edificios, unidades, inquilinos y usuarios del equipo como necesites. El precio se ajusta según el volumen, contacta con ventas para planes enterprise.',
    category: 'Pricing',
    keywords: ['límites', 'usuarios', 'edificios', 'precio'],
    relatedArticles: ['kb-001', 'kb-002'],
  },
  {
    id: 'faq-015',
    question: '¿Ofrecen formación y soporte?',
    answer:
      'Sí, incluimos: 1) Tour interactivo al registrarte, 2) Base de conocimiento con guías y videos, 3) Chatbot IA 24/7, 4) Soporte por email, 5) Webinars mensuales, 6) Formación personalizada para planes enterprise.',
    category: 'Soporte',
    keywords: ['formación', 'soporte', 'ayuda', 'capacitación'],
    relatedArticles: ['kb-001', 'kb-011'],
  },
  {
    id: 'faq-016',
    question: '¿Puedo automatizar recordatorios de pago?',
    answer:
      'Sí, puedes configurar recordatorios automáticos que se envían X días antes del vencimiento, el día del vencimiento, y X días después. Los recordatorios se envían por email, SMS o WhatsApp según tu configuración.',
    category: 'Automatización',
    keywords: ['recordatorios', 'pago', 'automático', 'alertas'],
    relatedArticles: ['kb-006', 'kb-009'],
  },
  {
    id: 'faq-017',
    question: '¿Cómo funciona el análisis predictivo?',
    answer:
      'Nuestro módulo de BI usa IA para: predecir qué inquilinos tienen riesgo de morosidad, forecast de ingresos futuros, análisis de rotación, y optimización de precios de alquiler según el mercado. Todo basado en datos históricos.',
    category: 'BI',
    keywords: ['predictivo', 'ia', 'análisis', 'forecast'],
    relatedArticles: ['kb-008', 'kb-009'],
  },
  {
    id: 'faq-018',
    question: '¿Puedo conectar mi software de contabilidad?',
    answer:
      'Sí, INMOVA se integra con los principales software de contabilidad (Sage, ContaPlus, A3). Los movimientos se sincronizan automáticamente. También disponemos de API REST para integraciones personalizadas.',
    category: 'Integraciones',
    keywords: ['contabilidad', 'integración', 'api', 'sincronización'],
    relatedArticles: ['kb-010', 'kb-008'],
  },
  {
    id: 'faq-019',
    question: '¿Qué pasa si cancelo mi suscripción?',
    answer:
      'Puedes cancelar cuando quieras sin penalización. Antes de cancelar, te permitimos exportar todos tus datos en formato Excel o CSV. Mantenemos tus datos por 90 días adicionales por si decides volver.',
    category: 'Cuenta',
    keywords: ['cancelar', 'baja', 'exportar datos', 'suscripción'],
    relatedArticles: ['kb-011', 'kb-010'],
  },
  {
    id: 'faq-020',
    question: '¿Funciona en móvil?',
    answer:
      'Sí, INMOVA es 100% responsive y funciona perfectamente en móviles y tablets. También estamos desarrollando apps nativas para iOS y Android que estarán disponibles próximamente.',
    category: 'Plataforma',
    keywords: ['móvil', 'app', 'responsive', 'tablet'],
    relatedArticles: ['kb-001', 'kb-012'],
  },
];

export function searchKnowledgeBase(query: string, limit: number = 5): KnowledgeArticle[] {
  const lowerQuery = query.toLowerCase();
  const results = knowledgeBase
    .map((article) => {
      let score = 0;

      // Búsqueda en título (peso mayor)
      if (article.title.toLowerCase().includes(lowerQuery)) score += 10;

      // Búsqueda en tags
      article.tags.forEach((tag) => {
        if (tag.includes(lowerQuery)) score += 5;
      });

      // Búsqueda en contenido y excerpt
      if (article.content.toLowerCase().includes(lowerQuery)) score += 2;
      if (article.excerpt.toLowerCase().includes(lowerQuery)) score += 3;

      return { article, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.article);

  return results;
}

export function searchFAQs(query: string, limit: number = 5): FAQ[] {
  const lowerQuery = query.toLowerCase();
  const results = faqs
    .map((faq) => {
      let score = 0;

      // Búsqueda en pregunta (peso mayor)
      if (faq.question.toLowerCase().includes(lowerQuery)) score += 10;

      // Búsqueda en keywords
      faq.keywords.forEach((keyword) => {
        if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) score += 5;
      });

      // Búsqueda en respuesta
      if (faq.answer.toLowerCase().includes(lowerQuery)) score += 2;

      return { faq, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.faq);

  return results;
}

export function getArticleById(id: string): KnowledgeArticle | undefined {
  return knowledgeBase.find((article) => article.id === id);
}

export function getFAQById(id: string): FAQ | undefined {
  return faqs.find((faq) => faq.id === id);
}

export function getArticlesByCategory(category: string): KnowledgeArticle[] {
  return knowledgeBase.filter((article) => article.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(knowledgeBase.map((article) => article.category)));
}
