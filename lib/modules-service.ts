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
export const MODULOS_CATALOGO = [
  // === MÓDULOS CORE (Siempre activos) ===
  {
    codigo: 'dashboard',
    nombre: 'Dashboard',
    descripcion: 'Panel principal con métricas y KPIs',
    categoria: 'core',
    icono: 'LayoutDashboard',
    ruta: '/dashboard',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 1
  },
  {
    codigo: 'edificios',
    nombre: 'Gestión de Edificios',
    descripcion: 'Administración de propiedades y edificios',
    categoria: 'core',
    icono: 'Building2',
    ruta: '/edificios',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 2
  },
  {
    codigo: 'unidades',
    nombre: 'Gestión de Unidades',
    descripcion: 'Administración de unidades y espacios',
    categoria: 'core',
    icono: 'Home',
    ruta: '/unidades',
    requiereModulos: ['edificios'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 3
  },
  {
    codigo: 'inquilinos',
    nombre: 'Gestión de Inquilinos',
    descripcion: 'Administración de inquilinos y arrendatarios',
    categoria: 'core',
    icono: 'Users',
    ruta: '/inquilinos',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 4
  },
  {
    codigo: 'contratos',
    nombre: 'Gestión de Contratos',
    descripcion: 'Administración de contratos de arrendamiento',
    categoria: 'core',
    icono: 'FileText',
    ruta: '/contratos',
    requiereModulos: ['inquilinos', 'unidades'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 5
  },
  {
    codigo: 'pagos',
    nombre: 'Gestión de Pagos',
    descripcion: 'Control de pagos y rentas',
    categoria: 'core',
    icono: 'CreditCard',
    ruta: '/pagos',
    requiereModulos: ['contratos'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 6
  },

  // === MÓDULOS DE GESTIÓN BÁSICA ===
  {
    codigo: 'documentos',
    nombre: 'Gestión Documental',
    descripcion: 'Almacenamiento y organización de documentos',
    categoria: 'gestion',
    icono: 'Folder',
    ruta: '/documentos',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 10
  },
  {
    codigo: 'mantenimiento',
    nombre: 'Mantenimiento',
    descripcion: 'Solicitudes y seguimiento de mantenimiento',
    categoria: 'core',
    icono: 'Wrench',
    ruta: '/mantenimiento',
    requiereModulos: ['edificios'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 7
  },
  {
    codigo: 'proveedores',
    nombre: 'Gestión de Proveedores',
    descripcion: 'Administración de proveedores de servicios',
    categoria: 'gestion',
    icono: 'UsersRound',
    ruta: '/proveedores',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 12
  },
  {
    codigo: 'gastos',
    nombre: 'Gestión de Gastos',
    descripcion: 'Control de gastos operativos',
    categoria: 'gestion',
    icono: 'DollarSign',
    ruta: '/gastos',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 13
  },

  // === MÓDULOS FINANCIEROS ===
  {
    codigo: 'reportes',
    nombre: 'Reportes Financieros',
    descripcion: 'Reportes y análisis financiero',
    categoria: 'financiero',
    icono: 'FileBarChart',
    ruta: '/reportes',
    requiereModulos: ['pagos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 20
  },
  {
    codigo: 'contabilidad',
    nombre: 'Contabilidad',
    descripcion: 'Módulo de contabilidad integrada',
    categoria: 'financiero',
    icono: 'DollarSign',
    ruta: '/contabilidad',
    requiereModulos: ['pagos', 'gastos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 21
  },
  {
    codigo: 'analytics',
    nombre: 'Analytics & Predicciones',
    descripcion: 'Análisis predictivo y estadísticas',
    categoria: 'financiero',
    icono: 'BarChart2',
    ruta: '/analytics',
    requiereModulos: ['pagos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 22
  },
  {
    codigo: 'bi',
    nombre: 'Business Intelligence',
    descripcion: 'Dashboard de BI con visualizaciones avanzadas',
    categoria: 'financiero',
    icono: 'LineChart',
    ruta: '/bi',
    requiereModulos: ['pagos', 'gastos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 23
  },

  // === MÓDULOS DE COMUNICACIÓN ===
  {
    codigo: 'notificaciones',
    nombre: 'Notificaciones',
    descripcion: 'Sistema de notificaciones internas',
    categoria: 'comunicacion',
    icono: 'Bell',
    ruta: '/notificaciones',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 30
  },
  {
    codigo: 'chat',
    nombre: 'Chat con Inquilinos',
    descripcion: 'Sistema de mensajería con inquilinos',
    categoria: 'core',
    icono: 'MessageSquare',
    ruta: '/chat',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 9
  },
  {
    codigo: 'sms',
    nombre: 'Mensajes SMS',
    descripcion: 'Envío de mensajes SMS',
    categoria: 'comunicacion',
    icono: 'MessageSquare',
    ruta: '/sms',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 32
  },

  // === MÓDULOS AVANZADOS ===
  {
    codigo: 'crm',
    nombre: 'CRM',
    descripcion: 'Gestión de relaciones con clientes',
    categoria: 'avanzado',
    icono: 'TrendingUp',
    ruta: '/crm',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 40
  },
  {
    codigo: 'legal',
    nombre: 'Gestión Legal',
    descripcion: 'Administración legal y cumplimiento',
    categoria: 'avanzado',
    icono: 'Gavel',
    ruta: '/legal',
    requiereModulos: ['contratos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 41
  },
  {
    codigo: 'seguros',
    nombre: 'Seguros',
    descripcion: 'Gestión de pólizas, renovaciones y siniestros',
    categoria: 'avanzado',
    icono: 'Shield',
    ruta: '/seguros',
    requiereModulos: ['documentos'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 41.1
  },
  {
    codigo: 'marketplace',
    nombre: 'Marketplace',
    descripcion: 'Mercado de servicios y proveedores',
    categoria: 'avanzado',
    icono: 'Store',
    ruta: '/marketplace',
    requiereModulos: ['proveedores'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 42
  },
  {
    codigo: 'mantenimiento_pro',
    nombre: 'Mantenimiento Profesional',
    descripcion: 'Sistema avanzado de mantenimiento con predicciones',
    categoria: 'avanzado',
    icono: 'FileBarChart',
    ruta: '/mantenimiento-pro',
    requiereModulos: ['mantenimiento'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 43
  },
  {
    codigo: 'calendario',
    nombre: 'Calendario Unificado',
    descripcion: 'Calendario con eventos y programaciones',
    categoria: 'core',
    icono: 'Calendar',
    ruta: '/calendario',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 8
  },
  {
    codigo: 'valoraciones',
    nombre: 'Valoraciones de Propiedades',
    descripcion: 'Sistema de valoración de propiedades',
    categoria: 'avanzado',
    icono: 'TrendingUp',
    ruta: '/valoraciones',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 45
  },
  {
    codigo: 'publicaciones',
    nombre: 'Publicaciones Multi-portal',
    descripcion: 'Gestión de anuncios en múltiples portales',
    categoria: 'avanzado',
    icono: 'Share2',
    ruta: '/publicaciones',
    requiereModulos: ['unidades'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 46
  },
  {
    codigo: 'screening',
    nombre: 'Screening de Candidatos',
    descripcion: 'Sistema de verificación de candidatos',
    categoria: 'avanzado',
    icono: 'Shield',
    ruta: '/screening',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 47
  },
  {
    codigo: 'energia',
    nombre: 'Gestión de Energía',
    descripcion: 'Control y análisis de consumo energético',
    categoria: 'avanzado',
    icono: 'Zap',
    ruta: '/energia',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 48
  },

  // === MÓDULOS COMUNITARIOS (FASE 3-4) ===
  {
    codigo: 'incidencias',
    nombre: 'Incidencias Comunitarias',
    descripcion: 'Gestión de incidencias de la comunidad',
    categoria: 'comunidad',
    icono: 'AlertTriangle',
    ruta: '/incidencias',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 50
  },
  {
    codigo: 'votaciones',
    nombre: 'Votaciones Comunitarias',
    descripcion: 'Sistema de votaciones para juntas',
    categoria: 'comunidad',
    icono: 'Vote',
    ruta: '/votaciones',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 51
  },
  {
    codigo: 'anuncios',
    nombre: 'Anuncios y Avisos',
    descripcion: 'Tablero de anuncios comunitarios',
    categoria: 'comunidad',
    icono: 'Megaphone',
    ruta: '/anuncios',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 52
  },
  {
    codigo: 'reuniones',
    nombre: 'Actas de Reuniones',
    descripcion: 'Gestión de reuniones y actas',
    categoria: 'comunidad',
    icono: 'Users',
    ruta: '/reuniones',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 53
  },
  {
    codigo: 'reservas',
    nombre: 'Reserva de Espacios Comunes',
    descripcion: 'Sistema de reservas de espacios comunitarios',
    categoria: 'comunidad',
    icono: 'Calendar',
    ruta: '/reservas',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 54
  },
  {
    codigo: 'galerias',
    nombre: 'Galerías Multimedia',
    descripcion: 'Galerías de fotos y tours virtuales',
    categoria: 'comunidad',
    icono: 'ImageIcon',
    ruta: '/galerias',
    requiereModulos: ['unidades'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 55
  },

  // === MÓDULOS DE PORTALES ===
  {
    codigo: 'portal_inquilino',
    nombre: 'Portal del Inquilino',
    descripcion: 'Portal de autoservicio para inquilinos',
    categoria: 'portales',
    icono: 'UserCheck',
    ruta: '/portal-inquilino',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 60
  },
  {
    codigo: 'portal_propietario',
    nombre: 'Portal del Propietario',
    descripcion: 'Portal para propietarios de inmuebles',
    categoria: 'portales',
    icono: 'Briefcase',
    ruta: '/portal-propietario',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 61
  },
  {
    codigo: 'portal_proveedor',
    nombre: 'Portal del Proveedor',
    descripcion: 'Portal para proveedores de servicios',
    categoria: 'portales',
    icono: 'Briefcase',
    ruta: '/portal-proveedor',
    requiereModulos: ['proveedores'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 62
  },

  // === MÓDULOS DE ADMINISTRACIÓN ===
  {
    codigo: 'usuarios',
    nombre: 'Gestión de Usuarios',
    descripcion: 'Administración de usuarios del sistema',
    categoria: 'admin',
    icono: 'Users',
    ruta: '/admin/usuarios',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 70
  },
  {
    codigo: 'configuracion',
    nombre: 'Configuración General',
    descripcion: 'Configuración de la empresa',
    categoria: 'admin',
    icono: 'Settings',
    ruta: '/admin/configuracion',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 71
  },
  {
    codigo: 'auditoria',
    nombre: 'Auditoría y Seguridad',
    descripcion: 'Registro de auditoría y seguridad',
    categoria: 'admin',
    icono: 'Shield',
    ruta: '/auditoria',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 72
  },
  
  // ========================================
  // NUEVOS MÓDULOS ESTRATÉGICOS 🚀
  // ========================================
  
  {
    codigo: 'esg',
    nombre: 'ESG y Sostenibilidad',
    descripcion: 'Gestión de huella de carbono, planes de descarbonización, certificaciones ESG y reportes de sostenibilidad conforme CSRD',
    categoria: 'avanzado',
    icono: 'Leaf',
    ruta: '/esg',
    requiereModulos: ['edificios', 'energia'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 73
  },
  {
    codigo: 'marketplace',
    nombre: 'Marketplace de Servicios',
    descripcion: 'Plataforma B2C para que inquilinos contraten servicios verificados (limpieza, reparaciones, internet, seguros) con programa de fidelización',
    categoria: 'avanzado',
    icono: 'ShoppingBag',
    ruta: '/marketplace-servicios',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 74
  },
  {
    codigo: 'tours_virtuales',
    nombre: 'Tours Virtuales AR/VR',
    descripcion: 'Tours 360° inmersivos, visualización AR de reformas, decoración virtual y medición de engagement para maximizar conversiones',
    categoria: 'avanzado',
    icono: 'View',
    ruta: '/tours-virtuales',
    requiereModulos: ['unidades', 'galerias'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 75
  },
  {
    codigo: 'pricing_dinamico',
    nombre: 'Pricing Dinámico IA',
    descripcion: 'Optimización automática de precios con IA basada en análisis de mercado, estacionalidad, eventos y demanda en tiempo real',
    categoria: 'avanzado',
    icono: 'TrendingUp',
    ruta: '/pricing-dinamico',
    requiereModulos: ['unidades', 'contratos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 76
  },
  {
    codigo: 'iot',
    nombre: 'Edificios Inteligentes IoT',
    descripcion: 'Integración con dispositivos IoT (termostatos, sensores, cerraduras), automatizaciones inteligentes y monitoreo en tiempo real',
    categoria: 'avanzado',
    icono: 'Wifi',
    ruta: '/edificios-inteligentes',
    requiereModulos: ['edificios', 'unidades'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 77
  },
  // ========== NUEVOS M\u00d3DULOS ESTRAT\u00c9GICOS FASE 2 ==========
  {
    codigo: 'blockchain',
    nombre: 'Blockchain y Tokenizaci\u00f3n',
    descripcion: 'Tokenizaci\u00f3n de propiedades, inversi\u00f3n fraccionada, Smart Contracts, distribuci\u00f3n autom\u00e1tica de rentas y NFT de certificados',
    categoria: 'avanzado',
    icono: 'Link',
    ruta: '/blockchain',
    requiereModulos: ['edificios', 'unidades', 'contratos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 78
  },
  {
    codigo: 'ai_assistant',
    nombre: 'Asistente IA Conversacional',
    descripcion: 'Chatbot GPT-4 con comandos de voz, automatizaci\u00f3n de tareas administrativas, integraci\u00f3n WhatsApp y an\u00e1lisis de sentimiento',
    categoria: 'avanzado',
    icono: 'Bot',
    ruta: '/asistente-ia',
    requiereModulos: ['usuarios', 'inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 79
  },
  {
    codigo: 'economia_circular',
    nombre: 'Econom\u00eda Circular y Sostenibilidad Social',
    descripcion: 'Marketplace de intercambio, huertos urbanos, gesti\u00f3n de residuos, reciclaje gamificado y certificaci\u00f3n de econom\u00eda circular',
    categoria: 'comunidad',
    icono: 'Recycle',
    ruta: '/economia-circular',
    requiereModulos: ['edificios', 'inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 80
  },
  {
    codigo: 'comunidad_social',
    nombre: 'Plataforma de Comunidad Social',
    descripcion: 'Red social interna, marketplace P2P de servicios, gamificaci\u00f3n, eventos comunitarios y programa de embajadores',
    categoria: 'comunidad',
    icono: 'Users',
    ruta: '/comunidad-social',
    requiereModulos: ['inquilinos', 'edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 81
  },
  {
    codigo: 'seguridad_compliance',
    nombre: 'Seguridad y Compliance Avanzado',
    descripcion: 'Verificaci\u00f3n biom\u00e9trica, cumplimiento GDPR automatizado, detecci\u00f3n de fraude con ML, auditor\u00edas de seguridad y SIEM',
    categoria: 'administracion',
    icono: 'Shield',
    ruta: '/seguridad-compliance',
    requiereModulos: ['usuarios', 'inquilinos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 82
  },

  // ============================================
  // MÓDULOS MULTI-VERTICAL (FASE 3)
  // ============================================
  {
    codigo: 'str_listings',
    nombre: 'Anuncios Turísticos STR',
    descripcion: 'Gestión de propiedades en plataformas como Airbnb, Booking, VRBO con sincronización multi-canal',
    categoria: 'gestion',
    icono: 'Hotel',
    ruta: '/str/listings',
    requiereModulos: ['unidades', 'edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 83
  },
  {
    codigo: 'str_bookings',
    nombre: 'Reservas STR',
    descripcion: 'Calendario y gestión de reservas de alquiler turístico de corta estancia',
    categoria: 'gestion',
    icono: 'Calendar',
    ruta: '/str/bookings',
    requiereModulos: ['str_listings'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 84
  },
  {
    codigo: 'str_channels',
    nombre: 'Channel Manager',
    descripcion: 'Sincronización automática con Airbnb, Booking, VRBO y otras plataformas OTA',
    categoria: 'gestion',
    icono: 'Cloud',
    ruta: '/str/channels',
    requiereModulos: ['str_listings'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 85
  },
  {
    codigo: 'flipping_projects',
    nombre: 'Proyectos House Flipping',
    descripcion: 'Pipeline de inversión, renovación y reventa con cálculo automático de ROI',
    categoria: 'gestion',
    icono: 'Hammer',
    ruta: '/flipping/projects',
    requiereModulos: ['edificios', 'unidades'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 86
  },
  {
    codigo: 'construction_projects',
    nombre: 'Proyectos de Construcción',
    descripcion: 'Gestión de obra nueva, promoción, subcontratistas y certificaciones',
    categoria: 'gestion',
    icono: 'Building2',
    ruta: '/construction/projects',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 87
  },
  {
    codigo: 'professional_projects',
    nombre: 'Servicios Profesionales',
    descripcion: 'Portfolio para arquitectos, aparejadores: proyectos, entregables, reuniones',
    categoria: 'gestion',
    icono: 'Briefcase',
    ruta: '/professional/projects',
    requiereModulos: ['usuarios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 88
  },
  {
    codigo: 'room_rental',
    nombre: 'Alquiler por Habitaciones',
    descripcion: 'Gestión completa de coliving y alquiler por habitaciones: prorrateo de suministros, normas de convivencia, calendario de limpieza',
    categoria: 'gestion',
    icono: 'Home',
    ruta: '/room-rental',
    requiereModulos: ['unidades', 'inquilinos', 'contratos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 89
  },

  // ============================================
  // ALQUILER COMERCIAL - Oficinas, Locales, Naves, Coworking
  // ============================================
  {
    codigo: 'alquiler_comercial',
    nombre: 'Alquiler Comercial',
    descripcion: 'Gestión integral de oficinas, locales comerciales, naves industriales y espacios de coworking. Incluye contratos comerciales LAU, CAM, escalado de rentas, licencias de actividad y gestión de leads.',
    categoria: 'vertical',
    icono: 'Building2',
    ruta: '/comercial',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 90
  },
];

/**
 * MAPEO DE MODELOS DE NEGOCIO A MÓDULOS RECOMENDADOS
 * Cada modelo de negocio tiene módulos específicos que son más relevantes
 */
export const BUSINESS_MODEL_MODULES: Record<string, string[]> = {
  RESIDENCIAL_LARGA: [
    // Core
    'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos', 'pagos',
    'mantenimiento', 'chat', 'calendario',
    // Específicos
    'documentos', 'proveedores', 'gastos', 'reportes', 'notificaciones',
    'incidencias', 'anuncios', 'reservas', 'portal_inquilino',
    'crm', 'screening', 'valoraciones', 'publicaciones'
  ],
  TURISTICO_STR: [
    // Core
    'dashboard', 'edificios', 'unidades', 'calendario', 'chat',
    // STR Específicos
    'str_listings', 'str_bookings', 'str_channels',
    'documentos', 'reportes', 'notificaciones',
    'pricing_dinamico', 'galerias', 'tours_virtuales',
    'analytics', 'bi', 'portal_inquilino'
  ],
  COLIVING_MEDIA: [
    // Core
    'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos', 'pagos',
    'mantenimiento', 'chat', 'calendario',
    // Coliving Específicos
    'room_rental', 'reservas', 'anuncios', 'galerias',
    'comunidad_social', 'economia_circular', 'marketplace',
    'portal_inquilino', 'documentos', 'reportes', 'notificaciones'
  ],
  HOTEL_APARTHOT: [
    // Core
    'dashboard', 'edificios', 'unidades', 'calendario',
    // Hotel Específicos
    'str_bookings', 'str_channels', 'pricing_dinamico',
    'mantenimiento', 'proveedores', 'gastos', 'reportes',
    'analytics', 'bi', 'documentos', 'notificaciones'
  ],
  HOUSE_FLIPPING: [
    // Core
    'dashboard', 'edificios', 'unidades',
    // Flipping Específicos
    'flipping_projects', 'proveedores', 'gastos', 'documentos',
    'mantenimiento', 'reportes', 'analytics', 'bi',
    'valoraciones', 'galerias', 'tours_virtuales',
    'crm', 'notificaciones', 'calendario'
  ],
  CONSTRUCCION: [
    // Core
    'dashboard', 'edificios', 'unidades',
    // Construcción Específicos
    'construction_projects', 'proveedores', 'gastos', 'documentos',
    'mantenimiento', 'reportes', 'calendario',
    'valoraciones', 'galerias', 'legal',
    'crm', 'notificaciones', 'analytics'
  ],
  SERVICIOS_PROF: [
    // Core
    'dashboard', 'calendario', 'chat',
    // Profesional Específicos
    'professional_projects', 'crm', 'documentos',
    'valoraciones', 'galerias', 'tours_virtuales',
    'reportes', 'notificaciones', 'marketplace',
    'edificios', 'unidades', 'proveedores'
  ],
  // ALQUILER COMERCIAL - Oficinas, Locales, Naves, Coworking
  ALQUILER_COMERCIAL: [
    // Core
    'dashboard', 'edificios', 'calendario', 'chat',
    // Comercial Específicos
    'alquiler_comercial', // Módulo principal de la vertical
    'contratos', 'pagos', 'documentos',
    'mantenimiento', 'proveedores', 'gastos',
    'crm', 'valoraciones', 'galerias', 'tours_virtuales',
    'reportes', 'analytics', 'bi', 'notificaciones',
    'firma_digital', 'legal', 'portal_propietario'
  ]
};

/**
 * DEFINICIÓN DE PACKS DE SUSCRIPCIÓN
 */
export const SUBSCRIPTION_PACKS = [
  {
    tier: 'basico',
    nombre: 'Plan Básico',
    descripcion: 'Ideal para pequeñas inmobiliarias o propietarios individuales',
    precioMensual: 29.99,
    maxUsuarios: 3,
    maxPropiedades: 20,
    modulosIncluidos: [
      'dashboard',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'documentos',
      'mantenimiento',
      'notificaciones',
      'usuarios',
      'configuracion'
    ],
    caracteristicas: [
      'Hasta 3 usuarios',
      'Hasta 20 propiedades',
      'Gestión básica de propiedades',
      'Control de pagos y contratos',
      'Almacenamiento de documentos',
      'Soporte por email'
    ]
  },
  {
    tier: 'profesional',
    nombre: 'Plan Profesional',
    descripcion: 'Para inmobiliarias en crecimiento con necesidades avanzadas',
    precioMensual: 79.99,
    maxUsuarios: 10,
    maxPropiedades: 100,
    modulosIncluidos: [
      ...[
        'dashboard',
        'edificios',
        'unidades',
        'inquilinos',
        'contratos',
        'pagos',
        'documentos',
        'mantenimiento',
        'notificaciones',
        'usuarios',
        'configuracion'
      ],
      'proveedores',
      'gastos',
      'reportes',
      'chat',
      'calendario',
      'incidencias',
      'anuncios',
      'reservas',
      'galerias',
      'portal_inquilino'
    ],
    caracteristicas: [
      'Hasta 10 usuarios',
      'Hasta 100 propiedades',
      'Todos los módulos del Plan Básico',
      'Gestión de proveedores y gastos',
      'Reportes financieros',
      'Chat con inquilinos',
      'Portal del inquilino',
      'Calendario unificado',
      'Espacios comunes y reservas',
      'Soporte prioritario'
    ]
  },
  {
    tier: 'empresarial',
    nombre: 'Plan Empresarial',
    descripcion: 'Solución completa para grandes inmobiliarias',
    precioMensual: 149.99,
    maxUsuarios: -1, // Ilimitado
    maxPropiedades: -1, // Ilimitado
    modulosIncluidos: MODULOS_CATALOGO.map(m => m.codigo), // Todos los módulos
    caracteristicas: [
      'Usuarios ilimitados',
      'Propiedades ilimitadas',
      'Todos los módulos disponibles',
      'Business Intelligence',
      'Analytics y predicciones',
      'CRM avanzado',
      'Gestión legal',
      'Marketplace',
      'Screening de candidatos',
      'Mantenimiento predictivo',
      'Múltiples portales (inquilino, propietario, proveedor)',
      'Auditoría y seguridad',
      'Soporte 24/7',
      'API personalizada'
    ]
  }
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
  // 1. Obtener módulos core (activos por defecto)
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

  const businessModelModules: string[] = [];
  for (const bm of businessModels) {
    const modules = BUSINESS_MODEL_MODULES[bm.businessModel] || [];
    businessModelModules.push(...modules);
  }

  // 3. Obtener TODOS los módulos de la empresa (activos e inactivos)
  const companyModules = await prisma.companyModule.findMany({
    where: { companyId },
    select: { moduloCodigo: true, activo: true }
  });

  const activatedModules = companyModules.filter(m => m.activo).map(m => m.moduloCodigo);
  const deactivatedModules = new Set(companyModules.filter(m => !m.activo).map(m => m.moduloCodigo));

  // 4. Combinar fuentes y eliminar duplicados
  const allModules = [
    ...coreModules,
    ...businessModelModules,
    ...activatedModules
  ];

  // 5. Respetar desactivaciones explícitas del administrador
  // Si un módulo fue desactivado manualmente (activo=false en CompanyModule),
  // se excluye aunque sea core o de modelo de negocio
  const finalModules = Array.from(new Set(allModules))
    .filter(m => !deactivatedModules.has(m));

  return finalModules;
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
  tier: 'basico' | 'profesional' | 'empresarial',
  activadoPor: string
): Promise<void> {
  const pack = SUBSCRIPTION_PACKS.find(p => p.tier === tier);
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