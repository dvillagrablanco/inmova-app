import { prisma } from './db';

/**
 * CATÁLOGO DE MÓDULOS DISPONIBLES
 * Cada módulo tiene:
 * - codigo: identificador único
 * - nombre: nombre visible
 * - descripcion: descripción del módulo
 * - categoria: agrupación lógica
 * - icono: icono de Lucide React
 * - ruta: ruta en la aplicación
 * - requiereModulos: módulos prerequisitos
 * - tiersIncluido: en qué planes está disponible
 * - esCore: si es un módulo esencial (siempre activo)
 */
// Tiers válidos del enum SubscriptionTier: STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE
const ALL_TIERS = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'];
const PRO_UP = ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'];
const BIZ_UP = ['BUSINESS', 'ENTERPRISE'];
const ENT_ONLY = ['ENTERPRISE'];

export const MODULOS_CATALOGO = [
  // ═══════════════════════════════════════════════════════════════
  // CORE (Siempre activos en todos los planes)
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'dashboard', nombre: 'Dashboard', descripcion: 'Panel principal con métricas y KPIs', categoria: 'core', icono: 'LayoutDashboard', ruta: '/dashboard', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: true, orden: 1 },
  { codigo: 'edificios', nombre: 'Gestión de Edificios', descripcion: 'Administración de propiedades y edificios', categoria: 'core', icono: 'Building2', ruta: '/edificios', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: true, orden: 2 },
  { codigo: 'unidades', nombre: 'Gestión de Unidades', descripcion: 'Administración de unidades y espacios', categoria: 'core', icono: 'Home', ruta: '/unidades', requiereModulos: ['edificios'], tiersIncluido: ALL_TIERS, esCore: true, orden: 3 },
  { codigo: 'inquilinos', nombre: 'Gestión de Inquilinos', descripcion: 'Administración de inquilinos y arrendatarios', categoria: 'core', icono: 'Users', ruta: '/inquilinos', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: true, orden: 4 },
  { codigo: 'contratos', nombre: 'Gestión de Contratos', descripcion: 'Administración de contratos de arrendamiento', categoria: 'core', icono: 'FileText', ruta: '/contratos', requiereModulos: ['inquilinos', 'unidades'], tiersIncluido: ALL_TIERS, esCore: true, orden: 5 },
  { codigo: 'pagos', nombre: 'Gestión de Pagos', descripcion: 'Control de pagos y rentas', categoria: 'core', icono: 'CreditCard', ruta: '/pagos', requiereModulos: ['contratos'], tiersIncluido: ALL_TIERS, esCore: true, orden: 6 },
  { codigo: 'mantenimiento', nombre: 'Mantenimiento', descripcion: 'Solicitudes y seguimiento de mantenimiento', categoria: 'core', icono: 'Wrench', ruta: '/mantenimiento', requiereModulos: ['edificios'], tiersIncluido: ALL_TIERS, esCore: true, orden: 7 },
  { codigo: 'calendario', nombre: 'Calendario Unificado', descripcion: 'Calendario con eventos y programaciones', categoria: 'core', icono: 'Calendar', ruta: '/calendario', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: true, orden: 8 },
  { codigo: 'chat', nombre: 'Chat con Inquilinos', descripcion: 'Sistema de mensajería con inquilinos', categoria: 'core', icono: 'MessageSquare', ruta: '/chat', requiereModulos: ['inquilinos'], tiersIncluido: ALL_TIERS, esCore: true, orden: 9 },
  { codigo: 'seguros', nombre: 'Seguros', descripcion: 'Gestión de pólizas, renovaciones y siniestros', categoria: 'core', icono: 'Shield', ruta: '/seguros', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: true, orden: 10 },

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN BÁSICA
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'documentos', nombre: 'Gestión Documental', descripcion: 'Almacenamiento y organización de documentos', categoria: 'gestion', icono: 'Folder', ruta: '/documentos', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: false, orden: 11 },
  { codigo: 'proveedores', nombre: 'Gestión de Proveedores', descripcion: 'Administración de proveedores de servicios', categoria: 'gestion', icono: 'UsersRound', ruta: '/proveedores', requiereModulos: [], tiersIncluido: PRO_UP, esCore: false, orden: 12 },
  { codigo: 'gastos', nombre: 'Gestión de Gastos', descripcion: 'Control de gastos operativos', categoria: 'gestion', icono: 'DollarSign', ruta: '/gastos', requiereModulos: [], tiersIncluido: PRO_UP, esCore: false, orden: 13 },
  { codigo: 'notificaciones', nombre: 'Notificaciones', descripcion: 'Sistema de notificaciones internas', categoria: 'gestion', icono: 'Bell', ruta: '/notificaciones', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: false, orden: 14 },

  // ═══════════════════════════════════════════════════════════════
  // FINANCIERO
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'reportes', nombre: 'Reportes Financieros', descripcion: 'Reportes y análisis financiero', categoria: 'financiero', icono: 'FileBarChart', ruta: '/reportes', requiereModulos: ['pagos'], tiersIncluido: PRO_UP, esCore: false, orden: 20 },
  { codigo: 'contabilidad', nombre: 'Contabilidad', descripcion: 'Módulo de contabilidad integrada', categoria: 'financiero', icono: 'DollarSign', ruta: '/contabilidad', requiereModulos: ['pagos', 'gastos'], tiersIncluido: BIZ_UP, esCore: false, orden: 21 },
  { codigo: 'analytics', nombre: 'Analytics & Predicciones', descripcion: 'Análisis predictivo y estadísticas', categoria: 'financiero', icono: 'BarChart2', ruta: '/analytics', requiereModulos: ['pagos'], tiersIncluido: BIZ_UP, esCore: false, orden: 22 },
  { codigo: 'bi', nombre: 'Business Intelligence', descripcion: 'Dashboard de BI con visualizaciones avanzadas', categoria: 'financiero', icono: 'LineChart', ruta: '/bi', requiereModulos: ['pagos', 'gastos'], tiersIncluido: BIZ_UP, esCore: false, orden: 23 },

  // ═══════════════════════════════════════════════════════════════
  // CRM & COMERCIAL
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'crm', nombre: 'CRM', descripcion: 'Gestión de relaciones con clientes y leads', categoria: 'crm', icono: 'TrendingUp', ruta: '/crm', requiereModulos: ['inquilinos'], tiersIncluido: BIZ_UP, esCore: false, orden: 30 },
  { codigo: 'screening', nombre: 'Screening de Candidatos', descripcion: 'Verificación de solvencia y puntuación de riesgo', categoria: 'crm', icono: 'Shield', ruta: '/screening', requiereModulos: ['inquilinos'], tiersIncluido: BIZ_UP, esCore: false, orden: 31 },
  { codigo: 'valoraciones', nombre: 'Valoraciones de Propiedades', descripcion: 'Valoración automática con IA y comparables', categoria: 'crm', icono: 'TrendingUp', ruta: '/valoraciones', requiereModulos: ['edificios'], tiersIncluido: BIZ_UP, esCore: false, orden: 32 },
  { codigo: 'publicaciones', nombre: 'Publicaciones Multi-portal', descripcion: 'Publicar en Idealista, Fotocasa, Habitaclia', categoria: 'crm', icono: 'Share2', ruta: '/publicaciones', requiereModulos: ['unidades'], tiersIncluido: BIZ_UP, esCore: false, orden: 33 },

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL: ALQUILER RESIDENCIAL
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'legal', nombre: 'Gestión Legal', descripcion: 'Administración legal, LAU y cumplimiento normativo', categoria: 'residencial', icono: 'Gavel', ruta: '/legal', requiereModulos: ['contratos'], tiersIncluido: BIZ_UP, esCore: false, orden: 40 },
  { codigo: 'sms', nombre: 'Mensajes SMS', descripcion: 'Envío de mensajes SMS y WhatsApp a inquilinos', categoria: 'residencial', icono: 'MessageSquare', ruta: '/sms', requiereModulos: ['inquilinos'], tiersIncluido: BIZ_UP, esCore: false, orden: 41 },

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL: STR / VACACIONAL
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'str_listings', nombre: 'Anuncios Turísticos', descripcion: 'Gestión de propiedades en Airbnb, Booking, VRBO', categoria: 'str', icono: 'Hotel', ruta: '/str/listings', requiereModulos: ['unidades'], tiersIncluido: PRO_UP, esCore: false, orden: 50 },
  { codigo: 'str_bookings', nombre: 'Reservas STR', descripcion: 'Calendario y gestión de reservas turísticas', categoria: 'str', icono: 'Calendar', ruta: '/str/bookings', requiereModulos: ['str_listings'], tiersIncluido: PRO_UP, esCore: false, orden: 51 },
  { codigo: 'str_channels', nombre: 'Channel Manager', descripcion: 'Sincronización automática con OTAs', categoria: 'str', icono: 'Cloud', ruta: '/str/channels', requiereModulos: ['str_listings'], tiersIncluido: BIZ_UP, esCore: false, orden: 52 },

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL: COLIVING & HABITACIONES
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'room_rental', nombre: 'Alquiler por Habitaciones', descripcion: 'Gestión de coliving: prorrateo suministros, normas convivencia, limpieza', categoria: 'coliving', icono: 'Home', ruta: '/coliving/propiedades', requiereModulos: ['unidades', 'inquilinos'], tiersIncluido: PRO_UP, esCore: false, orden: 55 },

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL: COMERCIAL (Oficinas, Locales, Naves, Coworking)
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'alquiler_comercial', nombre: 'Alquiler Comercial', descripcion: 'Gestión integral de oficinas, locales, naves y coworking. Contratos LAU comercial, CAM, escalado de rentas.', categoria: 'comercial', icono: 'Building2', ruta: '/comercial', requiereModulos: ['edificios'], tiersIncluido: PRO_UP, esCore: false, orden: 60 },

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL: CONSTRUCCIÓN & DESARROLLO
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'construction_projects', nombre: 'Proyectos de Construcción', descripcion: 'Gestión de obra nueva, reformas, Gantt, subcontratistas y certificaciones', categoria: 'construccion', icono: 'Building2', ruta: '/construccion/proyectos', requiereModulos: ['edificios'], tiersIncluido: BIZ_UP, esCore: false, orden: 65 },

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL: HOUSE FLIPPING
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'flipping_projects', nombre: 'House Flipping', descripcion: 'Pipeline inversión, renovación y reventa con cálculo ROI', categoria: 'flipping', icono: 'Hammer', ruta: '/flipping/projects', requiereModulos: ['edificios', 'unidades'], tiersIncluido: PRO_UP, esCore: false, orden: 70 },

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL: COMUNIDADES DE PROPIETARIOS
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'incidencias', nombre: 'Incidencias Comunitarias', descripcion: 'Gestión de incidencias de la comunidad', categoria: 'comunidades', icono: 'AlertTriangle', ruta: '/incidencias', requiereModulos: ['edificios'], tiersIncluido: PRO_UP, esCore: false, orden: 75 },
  { codigo: 'votaciones', nombre: 'Votaciones Comunitarias', descripcion: 'Sistema de votaciones para juntas', categoria: 'comunidades', icono: 'Vote', ruta: '/votaciones', requiereModulos: ['edificios'], tiersIncluido: BIZ_UP, esCore: false, orden: 76 },
  { codigo: 'anuncios', nombre: 'Anuncios y Avisos', descripcion: 'Tablero de anuncios comunitarios', categoria: 'comunidades', icono: 'Megaphone', ruta: '/anuncios', requiereModulos: ['edificios'], tiersIncluido: PRO_UP, esCore: false, orden: 77 },
  { codigo: 'reuniones', nombre: 'Actas de Reuniones', descripcion: 'Gestión de juntas y actas', categoria: 'comunidades', icono: 'Users', ruta: '/reuniones', requiereModulos: ['edificios'], tiersIncluido: BIZ_UP, esCore: false, orden: 78 },
  { codigo: 'reservas', nombre: 'Reserva de Espacios Comunes', descripcion: 'Sistema de reservas comunitarias', categoria: 'comunidades', icono: 'Calendar', ruta: '/reservas', requiereModulos: ['edificios'], tiersIncluido: PRO_UP, esCore: false, orden: 79 },
  { codigo: 'galerias', nombre: 'Galerías Multimedia', descripcion: 'Galerías de fotos y tours virtuales', categoria: 'comunidades', icono: 'ImageIcon', ruta: '/galerias', requiereModulos: ['unidades'], tiersIncluido: PRO_UP, esCore: false, orden: 80 },

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL: SERVICIOS PROFESIONALES
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'professional_projects', nombre: 'Servicios Profesionales', descripcion: 'Portfolio para arquitectos, aparejadores: proyectos, entregables', categoria: 'profesional', icono: 'Briefcase', ruta: '/professional/projects', requiereModulos: ['usuarios'], tiersIncluido: PRO_UP, esCore: false, orden: 85 },

  // ═══════════════════════════════════════════════════════════════
  // PORTALES EXTERNOS
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'portal_inquilino', nombre: 'Portal del Inquilino', descripcion: 'Portal de autoservicio para inquilinos', categoria: 'portales', icono: 'UserCheck', ruta: '/portal-inquilino', requiereModulos: ['inquilinos'], tiersIncluido: PRO_UP, esCore: false, orden: 90 },
  { codigo: 'portal_propietario', nombre: 'Portal del Propietario', descripcion: 'Portal para propietarios de inmuebles', categoria: 'portales', icono: 'Briefcase', ruta: '/portal-propietario', requiereModulos: ['edificios'], tiersIncluido: BIZ_UP, esCore: false, orden: 91 },
  { codigo: 'portal_proveedor', nombre: 'Portal del Proveedor', descripcion: 'Portal para proveedores de servicios', categoria: 'portales', icono: 'Briefcase', ruta: '/portal-proveedor', requiereModulos: ['proveedores'], tiersIncluido: BIZ_UP, esCore: false, orden: 92 },

  // ═══════════════════════════════════════════════════════════════
  // ADMINISTRACIÓN
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'usuarios', nombre: 'Gestión de Usuarios', descripcion: 'Administración de usuarios del sistema', categoria: 'admin', icono: 'Users', ruta: '/admin/usuarios', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: false, orden: 95 },
  { codigo: 'configuracion', nombre: 'Configuración General', descripcion: 'Configuración de la empresa', categoria: 'admin', icono: 'Settings', ruta: '/admin/configuracion', requiereModulos: [], tiersIncluido: ALL_TIERS, esCore: false, orden: 96 },
  { codigo: 'auditoria', nombre: 'Auditoría y Seguridad', descripcion: 'Registro de auditoría y seguridad', categoria: 'admin', icono: 'Shield', ruta: '/auditoria', requiereModulos: [], tiersIncluido: BIZ_UP, esCore: false, orden: 97 },

  // ═══════════════════════════════════════════════════════════════
  // AVANZADO / ADD-ONS
  // ═══════════════════════════════════════════════════════════════
  { codigo: 'esg', nombre: 'ESG y Sostenibilidad', descripcion: 'Huella de carbono, certificaciones ESG, reportes CSRD', categoria: 'avanzado', icono: 'Leaf', ruta: '/esg', requiereModulos: ['edificios'], tiersIncluido: ENT_ONLY, esCore: false, orden: 100 },
  { codigo: 'marketplace', nombre: 'Marketplace de Servicios', descripcion: 'Plataforma B2C para inquilinos: limpieza, reparaciones, seguros', categoria: 'avanzado', icono: 'ShoppingBag', ruta: '/marketplace', requiereModulos: ['inquilinos'], tiersIncluido: BIZ_UP, esCore: false, orden: 101 },
  { codigo: 'tours_virtuales', nombre: 'Tours Virtuales 360', descripcion: 'Tours inmersivos con integración Matterport', categoria: 'avanzado', icono: 'View', ruta: '/tours-virtuales', requiereModulos: ['unidades', 'galerias'], tiersIncluido: PRO_UP, esCore: false, orden: 102 },
  { codigo: 'pricing_dinamico', nombre: 'Pricing Dinámico IA', descripcion: 'Optimización de precios con IA: mercado, estacionalidad, demanda', categoria: 'avanzado', icono: 'TrendingUp', ruta: '/str/pricing', requiereModulos: ['unidades', 'contratos'], tiersIncluido: ENT_ONLY, esCore: false, orden: 103 },
  { codigo: 'iot', nombre: 'Edificios Inteligentes IoT', descripcion: 'Integración con termostatos, sensores, cerraduras inteligentes', categoria: 'avanzado', icono: 'Wifi', ruta: '/iot', requiereModulos: ['edificios', 'unidades'], tiersIncluido: ENT_ONLY, esCore: false, orden: 104 },
  { codigo: 'ai_assistant', nombre: 'Asistente IA', descripcion: 'Chatbot IA, automatización de tareas, análisis de sentimiento', categoria: 'avanzado', icono: 'Bot', ruta: '/asistente-ia', requiereModulos: ['usuarios', 'inquilinos'], tiersIncluido: PRO_UP, esCore: false, orden: 105 },
  { codigo: 'mantenimiento_pro', nombre: 'Mantenimiento Profesional', descripcion: 'Mantenimiento predictivo con IA y IoT', categoria: 'avanzado', icono: 'FileBarChart', ruta: '/mantenimiento-pro', requiereModulos: ['mantenimiento'], tiersIncluido: BIZ_UP, esCore: false, orden: 106 },
  { codigo: 'energia', nombre: 'Gestión de Energía', descripcion: 'Control y análisis de consumo energético', categoria: 'avanzado', icono: 'Zap', ruta: '/energia', requiereModulos: ['edificios'], tiersIncluido: ENT_ONLY, esCore: false, orden: 107 },
  { codigo: 'firma_digital', nombre: 'Firma Digital', descripcion: 'Firma electrónica avanzada con validez legal eIDAS', categoria: 'avanzado', icono: 'FileSignature', ruta: '/firma-digital', requiereModulos: ['contratos'], tiersIncluido: PRO_UP, esCore: false, orden: 108 },
  { codigo: 'open_banking', nombre: 'Open Banking', descripcion: 'Conciliación bancaria automática y PSD2', categoria: 'avanzado', icono: 'CreditCard', ruta: '/open-banking', requiereModulos: ['pagos'], tiersIncluido: BIZ_UP, esCore: false, orden: 109 },
  { codigo: 'ocr', nombre: 'OCR Documental', descripcion: 'Extracción automática de datos de documentos con IA', categoria: 'avanzado', icono: 'Scan', ruta: '/ocr', requiereModulos: ['documentos'], tiersIncluido: PRO_UP, esCore: false, orden: 110 },
  { codigo: 'tareas', nombre: 'Gestión de Tareas', descripcion: 'Tablero Kanban de tareas y asignaciones', categoria: 'avanzado', icono: 'CheckSquare', ruta: '/tareas', requiereModulos: [], tiersIncluido: PRO_UP, esCore: false, orden: 111 },
  { codigo: 'candidatos', nombre: 'Gestión de Candidatos', descripcion: 'Pipeline de candidatos a inquilino', categoria: 'avanzado', icono: 'UserPlus', ruta: '/candidatos', requiereModulos: ['inquilinos'], tiersIncluido: PRO_UP, esCore: false, orden: 112 },
];

/**
 * MAPEO DE MODELOS DE NEGOCIO A MÓDULOS RECOMENDADOS
 * Cada modelo de negocio tiene módulos específicos que son más relevantes
 */
/**
 * MAPEO DE MODELOS DE NEGOCIO A MÓDULOS RECOMENDADOS
 * Los 7 verticales de INMOVA + modelos adicionales
 */
export const BUSINESS_MODEL_MODULES: Record<string, string[]> = {
  // Vertical 1: Alquiler Residencial Largo Plazo
  RESIDENCIAL_LARGA: [
    'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos', 'pagos',
    'mantenimiento', 'chat', 'calendario', 'seguros', 'documentos',
    'proveedores', 'gastos', 'reportes', 'notificaciones',
    'incidencias', 'anuncios', 'reservas', 'portal_inquilino',
    'crm', 'screening', 'valoraciones', 'publicaciones', 'legal',
    'firma_digital', 'tareas', 'candidatos',
  ],
  // Vertical 2: STR / Vacacional
  TURISTICO_STR: [
    'dashboard', 'edificios', 'unidades', 'calendario', 'chat', 'seguros',
    'str_listings', 'str_bookings', 'str_channels',
    'documentos', 'reportes', 'notificaciones', 'gastos',
    'pricing_dinamico', 'galerias', 'tours_virtuales',
    'analytics', 'bi', 'portal_inquilino',
  ],
  // Vertical 3: Coliving & Media Estancia
  COLIVING_MEDIA: [
    'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos', 'pagos',
    'mantenimiento', 'chat', 'calendario', 'seguros',
    'room_rental', 'reservas', 'anuncios', 'galerias', 'marketplace',
    'portal_inquilino', 'documentos', 'reportes', 'notificaciones',
    'candidatos', 'screening',
  ],
  // Vertical 4: Alquiler Comercial (Oficinas, Locales, Naves, Coworking)
  ALQUILER_COMERCIAL: [
    'dashboard', 'edificios', 'calendario', 'chat', 'seguros',
    'alquiler_comercial', 'contratos', 'pagos', 'documentos',
    'mantenimiento', 'proveedores', 'gastos',
    'crm', 'valoraciones', 'galerias', 'tours_virtuales',
    'reportes', 'analytics', 'bi', 'notificaciones',
    'firma_digital', 'legal', 'portal_propietario',
  ],
  // Vertical 5: Construcción & Desarrollo
  CONSTRUCCION: [
    'dashboard', 'edificios', 'unidades', 'calendario',
    'construction_projects', 'proveedores', 'gastos', 'documentos',
    'mantenimiento', 'reportes', 'valoraciones', 'galerias',
    'legal', 'crm', 'notificaciones', 'analytics', 'tareas',
  ],
  // Vertical 6: House Flipping
  HOUSE_FLIPPING: [
    'dashboard', 'edificios', 'unidades', 'calendario',
    'flipping_projects', 'proveedores', 'gastos', 'documentos',
    'mantenimiento', 'reportes', 'analytics', 'bi',
    'valoraciones', 'galerias', 'tours_virtuales',
    'crm', 'notificaciones',
  ],
  // Vertical 7: Servicios Profesionales
  SERVICIOS_PROF: [
    'dashboard', 'calendario', 'chat', 'documentos',
    'professional_projects', 'crm', 'reportes', 'notificaciones',
    'valoraciones', 'galerias', 'tours_virtuales', 'marketplace',
    'edificios', 'unidades', 'proveedores', 'tareas',
  ],
  // Adicional: Hotel / Aparthotel
  HOTEL_APARTHOT: [
    'dashboard', 'edificios', 'unidades', 'calendario', 'seguros',
    'str_bookings', 'str_channels', 'pricing_dinamico',
    'mantenimiento', 'proveedores', 'gastos', 'reportes',
    'analytics', 'bi', 'documentos', 'notificaciones',
  ],
};

/**
 * DEFINICIÓN DE PACKS DE SUSCRIPCIÓN
 */
/**
 * PACKS DE SUSCRIPCIÓN - Alineados con landing (precios reales)
 * Source of truth: PricingSection.tsx + pricing-config.ts
 */
export const SUBSCRIPTION_PACKS = [
  {
    tier: 'STARTER',
    nombre: 'Starter',
    descripcion: 'Para propietarios particulares con 1-5 propiedades',
    precioMensual: 35,
    maxUsuarios: 1,
    maxPropiedades: 5,
    modulosIncluidos: MODULOS_CATALOGO.filter(m => m.esCore || m.tiersIncluido.includes('STARTER')).map(m => m.codigo),
    caracteristicas: ['1 usuario', 'Hasta 5 propiedades', 'Gestión completa de alquileres', '2 firmas digitales/mes', '1GB almacenamiento', 'Soporte por email'],
  },
  {
    tier: 'PROFESSIONAL',
    nombre: 'Professional',
    descripcion: 'Para propietarios activos y pequeñas agencias',
    precioMensual: 59,
    maxUsuarios: 3,
    maxPropiedades: 25,
    modulosIncluidos: MODULOS_CATALOGO.filter(m => m.esCore || m.tiersIncluido.includes('PROFESSIONAL')).map(m => m.codigo),
    caracteristicas: ['3 usuarios', 'Hasta 25 propiedades', '5 firmas/mes', 'CRM y reportes', 'Portal inquilinos y propietarios', 'Hasta 3 verticales', 'Soporte prioritario'],
  },
  {
    tier: 'BUSINESS',
    nombre: 'Business',
    descripcion: 'Para gestoras profesionales y agencias',
    precioMensual: 129,
    maxUsuarios: 10,
    maxPropiedades: 100,
    modulosIncluidos: MODULOS_CATALOGO.filter(m => m.esCore || m.tiersIncluido.includes('BUSINESS')).map(m => m.codigo),
    caracteristicas: ['10 usuarios', 'Hasta 100 propiedades', '15 firmas/mes', 'Los 7 verticales', 'API integración', 'BI y analytics', 'Account manager dedicado'],
  },
  {
    tier: 'ENTERPRISE',
    nombre: 'Enterprise',
    descripcion: 'Para grandes empresas y SOCIMIs',
    precioMensual: 299,
    maxUsuarios: -1,
    maxPropiedades: -1,
    modulosIncluidos: MODULOS_CATALOGO.map(m => m.codigo),
    caracteristicas: ['Usuarios ilimitados', 'Propiedades ilimitadas', 'Todos los módulos', 'White-label', 'API ilimitada', 'SLA 99.9%', 'Todos los add-ons incluidos', 'Soporte 24/7'],
  },
];

/**
 * Verifica si un módulo está activo para una empresa
 */
export async function isModuleActiveForCompany(
  companyId: string,
  moduloCodigo: string
): Promise<boolean> {
  // Verificar si el módulo es core (siempre activo)
  const moduloDefinicion = MODULOS_CATALOGO.find(m => m.codigo === moduloCodigo);
  if (moduloDefinicion?.esCore) {
    return true;
  }

  // Verificar si el módulo está activo en CompanyModule
  const companyModule = await prisma.companyModule.findUnique({
    where: {
      companyId_moduloCodigo: {
        companyId,
        moduloCodigo
      }
    }
  });

  return companyModule?.activo || false;
}

/**
 * Obtiene todos los módulos activos de una empresa
 * Considera: 1) Módulos core, 2) Modelos de negocio activos, 3) Módulos activados manualmente
 */
export async function getActiveModulesForCompany(companyId: string): Promise<string[]> {
  // 1. Obtener módulos core (siempre activos)
  const coreModules = MODULOS_CATALOGO
    .filter(m => m.esCore)
    .map(m => m.codigo);

  // 2. Obtener modelos de negocio activos de la empresa
  const businessModels = await prisma.companyBusinessModel.findMany({
    where: {
      companyId,
      activo: true
    },
    select: {
      businessModel: true
    }
  });

  // Obtener módulos según los modelos de negocio activos
  const businessModelModules: string[] = [];
  for (const bm of businessModels) {
    const modules = BUSINESS_MODEL_MODULES[bm.businessModel] || [];
    businessModelModules.push(...modules);
  }

  // 3. Obtener módulos activados manualmente
  const activeModules = await prisma.companyModule.findMany({
    where: {
      companyId,
      activo: true
    },
    select: {
      moduloCodigo: true
    }
  });

  const activatedModules = activeModules.map(m => m.moduloCodigo);

  // 4. Combinar todas las fuentes y eliminar duplicados
  const allModules = [
    ...coreModules,
    ...businessModelModules,
    ...activatedModules
  ];

  return Array.from(new Set(allModules));
}

/**
 * Activa un módulo para una empresa
 */
export async function activateModuleForCompany(
  companyId: string,
  moduloCodigo: string,
  activadoPor: string
): Promise<void> {
  await prisma.companyModule.upsert({
    where: {
      companyId_moduloCodigo: {
        companyId,
        moduloCodigo
      }
    },
    update: {
      activo: true,
      activadoPor,
      updatedAt: new Date()
    },
    create: {
      companyId,
      moduloCodigo,
      activo: true,
      activadoPor
    }
  });
}

/**
 * Desactiva un módulo para una empresa
 */
export async function deactivateModuleForCompany(
  companyId: string,
  moduloCodigo: string
): Promise<void> {
  // No se pueden desactivar módulos core
  const moduloDefinicion = MODULOS_CATALOGO.find(m => m.codigo === moduloCodigo);
  if (moduloDefinicion?.esCore) {
    throw new Error('No se pueden desactivar módulos esenciales');
  }

  await prisma.companyModule.update({
    where: {
      companyId_moduloCodigo: {
        companyId,
        moduloCodigo
      }
    },
    data: {
      activo: false,
      updatedAt: new Date()
    }
  });
}

/**
 * Inicializa los módulos según el plan de suscripción
 */
export async function initializeModulesForCompany(
  companyId: string,
  tier: string,
  activadoPor: string
): Promise<void> {
  // Normalizar tier (soportar legacy y nuevos)
  const tierMap: Record<string, string> = {
    basico: 'STARTER', profesional: 'PROFESSIONAL', empresarial: 'BUSINESS',
    STARTER: 'STARTER', PROFESSIONAL: 'PROFESSIONAL', BUSINESS: 'BUSINESS', ENTERPRISE: 'ENTERPRISE',
  };
  const normalizedTier = tierMap[tier] || 'STARTER';
  const pack = SUBSCRIPTION_PACKS.find(p => p.tier === normalizedTier);
  if (!pack) {
    throw new Error(`Plan de suscripción no encontrado: ${tier}`);
  }

  // Activar todos los módulos del pack
  for (const moduloCodigo of pack.modulosIncluidos) {
    await activateModuleForCompany(companyId, moduloCodigo, activadoPor);
  }
}

/**
 * Obtiene los modelos de negocio activos de una empresa
 */
export async function getBusinessModelsForCompany(companyId: string): Promise<string[]> {
  const businessModels = await prisma.companyBusinessModel.findMany({
    where: {
      companyId,
      activo: true
    },
    select: {
      businessModel: true
    }
  });

  return businessModels.map(bm => bm.businessModel);
}

/**
 * Activa un modelo de negocio para una empresa
 * Esto automáticamente activará los módulos relevantes
 */
export async function activateBusinessModelForCompany(
  companyId: string,
  businessModel: string
): Promise<void> {
  await prisma.companyBusinessModel.upsert({
    where: {
      companyId_businessModel: {
        companyId,
        businessModel: businessModel as any
      }
    },
    update: {
      activo: true,
      updatedAt: new Date()
    },
    create: {
      companyId,
      businessModel: businessModel as any,
      activo: true
    }
  });
}

/**
 * Desactiva un modelo de negocio para una empresa
 */
export async function deactivateBusinessModelForCompany(
  companyId: string,
  businessModel: string
): Promise<void> {
  await prisma.companyBusinessModel.update({
    where: {
      companyId_businessModel: {
        companyId,
        businessModel: businessModel as any
      }
    },
    data: {
      activo: false,
      updatedAt: new Date()
    }
  });
}

/**
 * Obtiene los módulos recomendados para un modelo de negocio específico
 */
export function getModulesForBusinessModel(businessModel: string): string[] {
  return BUSINESS_MODEL_MODULES[businessModel] || [];
}