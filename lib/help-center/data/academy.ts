import type { HelpArticle } from '../types';

export const academyArticles: HelpArticle[] = [
  {
    id: 'aca-001',
    slug: 'tour-completo-inmova',
    title: 'Tour completo de Inmova',
    excerpt:
      'Recorrido por todas las funcionalidades principales de la plataforma Inmova.',
    content: `## Contenido del video

En este **tour de 15 minutos** recorremos la plataforma de punta a punta: dashboard principal, menú de navegación, módulos de inmuebles, contratos, inquilinos, pagos e incidencias. Ideal para nuevos usuarios que quieren una visión general antes de profundizar.

## Qué aprenderás

- Estructura del dashboard y widgets principales
- Navegación entre secciones
- Dónde encontrar cada funcionalidad
- Atajos y trucos de productividad
- Primeros pasos recomendados tras el registro`,
    collection: 'academy',
    tags: ['academy', 'tour', 'introducción'],
    difficulty: 'beginner',
    estimatedReadTime: 15,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-002', 'aca-006'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-002',
    slug: 'configurar-pagos-automaticos',
    title: 'Configurar pagos automáticos paso a paso',
    excerpt:
      'Tutorial para activar la pasarela de pagos y domiciliaciones con Stripe.',
    content: `## Contenido del video

Guía paso a paso para **configurar tu cuenta de Stripe** en Inmova: conexión de la cuenta, activación de cobros recurrentes, configuración de SEPA y tarjetas, y pruebas en modo test. Incluye la configuración de emails para recordatorios de pago.

## Qué aprenderás

- Conectar Stripe a Inmova
- Activar domiciliación bancaria (SEPA)
- Configurar cobros con tarjeta
- Probar pagos en modo sandbox
- Configurar notificaciones automáticas`,
    collection: 'academy',
    tags: ['academy', 'pagos', 'Stripe'],
    difficulty: 'beginner',
    estimatedReadTime: 10,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-001', 'aca-004', 'por-002'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-003',
    slug: 'gestion-incidencias-ia',
    title: 'Gestión de incidencias con IA',
    excerpt:
      'Uso de la clasificación automática de incidencias con inteligencia artificial.',
    content: `## Contenido del video

En este **tutorial de 8 minutos** aprenderás a aprovechar la **clasificación IA** de incidencias: cómo interpreta descripciones y fotos, sugiere categoría y urgencia, y estima costes. Incluye ejemplos prácticos y cómo corregir o ajustar las sugerencias.

## Qué aprenderás

- Activar la clasificación automática
- Interpretar las sugerencias de la IA
- Asignar proveedores basados en la clasificación
- Mejorar resultados con feedback
- Casos límite y cuándo clasificar manualmente`,
    collection: 'academy',
    tags: ['academy', 'incidencias', 'IA'],
    difficulty: 'intermediate',
    estimatedReadTime: 8,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-001', 'inc-007', 'aca-009'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-004',
    slug: 'contabilidad-facturacion',
    title: 'Contabilidad y facturación',
    excerpt:
      'Módulo de facturación, liquidaciones a propietarios e informes fiscales.',
    content: `## Contenido del video

Tutorial completo sobre **contabilidad y facturación** en Inmova: emisión de facturas para propietarios y comisiones, liquidaciones mensuales, retenciones IRPF, exportación a Excel y CSV para tu gestoría o software contable, e informes fiscales preconfigurados.

## Qué aprenderás

- Crear facturas y liquidaciones
- Configurar retenciones y tipos impositivos
- Exportar datos para contabilidad
- Informes de IVA e IRPF
- Integración con programas externos`,
    collection: 'academy',
    tags: ['academy', 'contabilidad', 'facturación'],
    difficulty: 'intermediate',
    estimatedReadTime: 12,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-002', 'aca-008', 'por-006'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-005',
    slug: 'gestion-habitaciones-coliving',
    title: 'Gestión por habitaciones y coliving',
    excerpt:
      'Configuración y gestión de inmuebles por habitaciones con modelo coliving.',
    content: `## Contenido del video

En este **tutorial de 10 minutos** verás cómo configurar inmuebles con **modelo por habitaciones**: creación de habitaciones, precios individuales, paquetes de coliving (incluye wifi, limpieza, etc.), eventos y matching de inquilinos. Incluye el dashboard específico de coliving.

## Qué aprenderás

- Crear inmuebles por habitaciones
- Configurar paquetes y precios
- Gestionar inquilinos por habitación
- Eventos y comunidad coliving
- Informes de ocupación por habitación`,
    collection: 'academy',
    tags: ['academy', 'coliving', 'habitaciones'],
    difficulty: 'intermediate',
    estimatedReadTime: 10,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-001', 'aca-008'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-006',
    slug: 'firma-digital-contratos',
    title: 'Firma digital de contratos',
    excerpt:
      'Proceso de firma electrónica de contratos con Signaturit o DocuSign.',
    content: `## Contenido del video

En este **tutorial de 8 minutos** aprenderás a enviar contratos para **firma digital**: desde la plantilla hasta la firma completada. Incluye configuración de firmantes (propietario, inquilino, avalista), recordatorios automáticos y validez legal (eIDAS).

## Qué aprenderás

- Generar contrato desde plantilla
- Añadir campos de firma
- Enviar a firmantes
- Seguimiento del estado
- Descargar contrato firmado`,
    collection: 'academy',
    tags: ['academy', 'contratos', 'firma digital'],
    difficulty: 'beginner',
    estimatedReadTime: 8,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-001', 'inc-006'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-007',
    slug: 'oportunidades-inversion',
    title: 'Oportunidades de inversión',
    excerpt:
      'Módulo de oportunidades: fuentes de mercado, scoring IA y pipeline Kanban.',
    content: `## Contenido del video

Tutorial sobre el **módulo de oportunidades de inversión**: subastas BOE, inmuebles de banca, detector de divergencia IA, tendencias emergentes y crowdfunding. Incluye el pipeline Kanban, scoring unificado, chat IA contextual, análisis profundo y calculadoras (hipoteca, fiscal, sensibilidad).

## Qué aprenderás

- Navegar las 5 fuentes de oportunidades
- Usar el scoring y filtros avanzados
- Pipeline Kanban y funnel metrics
- Chat IA contextual por oportunidad
- Calculadoras de inversión`,
    collection: 'academy',
    tags: ['academy', 'inversión', 'oportunidades'],
    difficulty: 'intermediate',
    estimatedReadTime: 10,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-008', 'aca-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-008',
    slug: 'dashboard-bi-analitica',
    title: 'Dashboard de BI y analítica',
    excerpt:
      'Paneles de negocio, KPIs y métricas avanzadas en Inmova.',
    content: `## Contenido del video

En este **tutorial de 8 minutos** exploramos el **dashboard de BI**: KPIs personalizables, gráficos de evolución, comparativas por periodo, filtros por inmueble/empresa y exportación de datos. Incluye métricas de rentabilidad, ocupación y rendimiento.

## Qué aprenderás

- Configurar widgets del dashboard
- KPIs principales y personalizados
- Gráficos y tendencias
- Exportar informes
- Compartir dashboards con el equipo`,
    collection: 'academy',
    tags: ['academy', 'BI', 'analítica', 'dashboard'],
    difficulty: 'intermediate',
    estimatedReadTime: 8,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-001', 'aca-004', 'aca-007', 'por-005'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-009',
    slug: 'administracion-fincas',
    title: 'Administración de fincas',
    excerpt:
      'Gestión de comunidades de propietarios: votaciones, gastos y convocatorias.',
    content: `## Contenido del video

Tutorial sobre **gestión de fincas y comunidades**: creación de edificios y unidades, gastos comunes, convocatorias de juntas, votaciones online, actas y comunicaciones a vecinos. Incluye el módulo de seguros y cobertura edificio→unidad.

## Qué aprenderás

- Configurar edificios y comunidades
- Gastos comunes y reparto
- Convocatorias y votaciones
- Actas y documentación
- Seguros y coberturas`,
    collection: 'academy',
    tags: ['academy', 'fincas', 'comunidades'],
    difficulty: 'intermediate',
    estimatedReadTime: 10,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-003', 'aca-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'aca-010',
    slug: 'api-integraciones',
    title: 'API e integraciones',
    excerpt:
      'Documentación de la API REST, webhooks y conexiones con sistemas externos.',
    content: `## Contenido del video

En este **tutorial avanzado** verás la **API REST** de Inmova: autenticación, endpoints principales (inmuebles, contratos, pagos, incidencias), webhooks para eventos en tiempo real, rate limiting y ejemplos de integración con CRM, contabilidad o ERP externos.

## Qué aprenderás

- Autenticación y tokens
- Endpoints disponibles
- Webhooks y eventos
- Límites y buenas prácticas
- Ejemplos de integración`,
    collection: 'academy',
    tags: ['academy', 'API', 'integraciones'],
    difficulty: 'advanced',
    estimatedReadTime: 12,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    relatedArticles: ['aca-004', 'aca-008'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
];
