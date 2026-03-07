import { getPrismaClient } from './db';
const prisma = getPrismaClient();

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
  // portal_propietario eliminado — los propietarios acceden como administradores
  {
    codigo: 'portal_propietario',
    nombre: 'Portal del Propietario (Integrado en Admin)',
    descripcion: 'Los propietarios acceden directamente como administradores del sistema',
    categoria: 'portales',
    icono: 'Briefcase',
    ruta: '/dashboard',
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

  // ============================================
  // MÓDULOS ADICIONALES (añadidos para completar toggles)
  // ============================================
  {
    codigo: 'tareas',
    nombre: 'Gestión de Tareas',
    descripcion: 'Asignación y seguimiento de tareas para el equipo de gestión',
    categoria: 'gestion',
    icono: 'CheckSquare',
    ruta: '/tareas',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 91
  },
  {
    codigo: 'candidatos',
    nombre: 'Candidatos e Inquilinos Potenciales',
    descripcion: 'Gestión de candidatos a inquilino, solicitudes y proceso de selección',
    categoria: 'gestion',
    icono: 'UserPlus',
    ruta: '/candidatos',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 92
  },
  {
    codigo: 'firma_digital',
    nombre: 'Firma Digital de Contratos',
    descripcion: 'Firma electrónica avanzada de contratos vía DocuSign o Signaturit',
    categoria: 'avanzado',
    icono: 'FileSignature',
    ruta: '/firma-digital',
    requiereModulos: ['contratos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 93
  },
  {
    codigo: 'open_banking',
    nombre: 'Open Banking (PSD2)',
    descripcion: 'Conexión directa con cuentas bancarias vía Redsys/GoCardless para cobros y conciliación',
    categoria: 'financiero',
    icono: 'Landmark',
    ruta: '/open-banking',
    requiereModulos: ['pagos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 94
  },
  {
    codigo: 'inspecciones',
    nombre: 'Inspecciones de Inmuebles',
    descripcion: 'Inspecciones técnicas (ITE, IEE), check-in/check-out y estado de conservación',
    categoria: 'gestion',
    icono: 'ClipboardList',
    ruta: '/inspecciones',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 95
  },
  {
    codigo: 'certificaciones',
    nombre: 'Certificaciones y Cumplimiento',
    descripcion: 'Certificados energéticos, cédulas de habitabilidad, licencias y cumplimiento normativo',
    categoria: 'gestion',
    icono: 'Award',
    ruta: '/certificaciones',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 96
  },
  {
    codigo: 'visitas',
    nombre: 'Gestión de Visitas',
    descripcion: 'Programación y seguimiento de visitas a inmuebles para candidatos e inquilinos',
    categoria: 'gestion',
    icono: 'Eye',
    ruta: '/visitas',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 97
  },
  {
    codigo: 'ordenes_trabajo',
    nombre: 'Órdenes de Trabajo',
    descripcion: 'Creación, asignación y seguimiento de órdenes de trabajo para mantenimiento y reparaciones',
    categoria: 'gestion',
    icono: 'Wrench',
    ruta: '/ordenes-trabajo',
    requiereModulos: ['mantenimiento'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 98
  },
  {
    codigo: 'ocr',
    nombre: 'OCR e Importación Documental',
    descripcion: 'Digitalización automática de facturas y documentos con reconocimiento óptico (OCR)',
    categoria: 'avanzado',
    icono: 'Scan',
    ruta: '/ocr',
    requiereModulos: ['documentos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 99
  },

  // ============================================
  // MÓDULOS ADICIONALES - Cobertura completa sidebar
  // ============================================

  // Alquiler Residencial
  {
    codigo: 'alquiler_residencial',
    nombre: 'Alquiler Residencial - Dashboard',
    descripcion: 'Panel principal de la vertical de alquiler residencial tradicional',
    categoria: 'gestion',
    icono: 'Home',
    ruta: '/traditional-rental',
    requiereModulos: ['edificios', 'inquilinos'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 100
  },
  {
    codigo: 'garantias',
    nombre: 'Garantías de Alquiler',
    descripcion: 'Gestión de fianzas, avales y garantías de los contratos de arrendamiento',
    categoria: 'gestion',
    icono: 'Shield',
    ruta: '/garantias',
    requiereModulos: ['contratos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 101
  },

  // STR
  {
    codigo: 'str',
    nombre: 'STR Dashboard',
    descripcion: 'Panel principal de alquiler turístico de corta estancia',
    categoria: 'gestion',
    icono: 'Hotel',
    ruta: '/str',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 102
  },
  {
    codigo: 'str_reviews',
    nombre: 'Reviews STR',
    descripcion: 'Gestión de reseñas y valoraciones de huéspedes',
    categoria: 'gestion',
    icono: 'Star',
    ruta: '/str/reviews',
    requiereModulos: ['str_listings'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 103
  },

  // Hospitality
  {
    codigo: 'hospitality',
    nombre: 'Hospitality',
    descripcion: 'Gestión de apart-hotels, B&B y serviced apartments con check-in/out y servicios al huésped',
    categoria: 'gestion',
    icono: 'Hotel',
    ruta: '/hospitality',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 104
  },

  // Coliving
  {
    codigo: 'coliving',
    nombre: 'Coliving',
    descripcion: 'Gestión de espacios coliving: propiedades, comunidad, matching y eventos',
    categoria: 'gestion',
    icono: 'Users2',
    ruta: '/coliving/propiedades',
    requiereModulos: ['edificios', 'inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 105
  },

  // Holding / Grupo Societario
  {
    codigo: 'holding_grupo',
    nombre: 'Holding / Grupo Societario',
    descripcion: 'Consolidación de sociedades patrimoniales, análisis de inversiones, comparativa, hipotecas y fiscal del grupo',
    categoria: 'financiero',
    icono: 'Crown',
    ruta: '/inversiones',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 106
  },

  // Finanzas
  {
    codigo: 'finanzas',
    nombre: 'Panel de Finanzas',
    descripcion: 'Panel principal financiero con overview de pagos, gastos y flujo de caja',
    categoria: 'financiero',
    icono: 'Euro',
    ruta: '/finanzas',
    requiereModulos: ['pagos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 107
  },
  {
    codigo: 'estadisticas',
    nombre: 'Estadísticas',
    descripcion: 'Estadísticas generales de rendimiento y ocupación',
    categoria: 'financiero',
    icono: 'TrendingUp',
    ruta: '/estadisticas',
    requiereModulos: ['pagos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 109
  },
  {
    codigo: 'presupuestos',
    nombre: 'Presupuestos',
    descripcion: 'Creación y seguimiento de presupuestos anuales y por propiedad',
    categoria: 'financiero',
    icono: 'DollarSign',
    ruta: '/presupuestos',
    requiereModulos: ['pagos', 'gastos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 110
  },
  {
    codigo: 'facturacion',
    nombre: 'Facturación',
    descripcion: 'Emisión y gestión de facturas para servicios y alquileres',
    categoria: 'financiero',
    icono: 'FileText',
    ruta: '/facturacion',
    requiereModulos: ['pagos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 111
  },

  // Analytics
  {
    codigo: 'informes',
    nombre: 'Informes',
    descripcion: 'Generación de informes personalizados y exportación de datos',
    categoria: 'financiero',
    icono: 'FileText',
    ruta: '/informes',
    requiereModulos: ['reportes'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 112
  },

  // Operaciones
  {
    codigo: 'servicios_limpieza',
    nombre: 'Servicios de Limpieza',
    descripcion: 'Programación y seguimiento de servicios de limpieza para propiedades',
    categoria: 'gestion',
    icono: 'ClipboardList',
    ruta: '/servicios-limpieza',
    requiereModulos: ['mantenimiento'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 114
  },
  {
    codigo: 'servicios',
    nombre: 'Marketplace de Servicios',
    descripcion: 'Servicios adicionales contratables por inquilinos y propietarios',
    categoria: 'avanzado',
    icono: 'ShoppingBag',
    ruta: '/dashboard/servicios',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 115
  },

  // Documentos y Legal
  {
    codigo: 'plantillas',
    nombre: 'Plantillas de Documentos',
    descripcion: 'Plantillas reutilizables para contratos, actas y documentos legales',
    categoria: 'gestion',
    icono: 'FileText',
    ruta: '/plantillas',
    requiereModulos: ['documentos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 116
  },

  // CRM y Marketing
  {
    codigo: 'portal_comercial',
    nombre: 'Portal Comercial',
    descripcion: 'Portal de venta y alquiler de propiedades para clientes externos',
    categoria: 'avanzado',
    icono: 'Briefcase',
    ruta: '/portal-comercial',
    requiereModulos: ['crm'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 117
  },
  {
    codigo: 'promociones',
    nombre: 'Promociones',
    descripcion: 'Gestión de ofertas, descuentos y promociones para captación de inquilinos',
    categoria: 'avanzado',
    icono: 'Tag',
    ruta: '/promociones',
    requiereModulos: ['crm'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 118
  },
  {
    codigo: 'reviews',
    nombre: 'Reviews',
    descripcion: 'Gestión de reseñas y valoraciones de propiedades e inquilinos',
    categoria: 'avanzado',
    icono: 'Star',
    ruta: '/reviews',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 119
  },
  {
    codigo: 'red_agentes',
    nombre: 'Red de Agentes',
    descripcion: 'Gestión de agentes inmobiliarios colaboradores y comisiones',
    categoria: 'avanzado',
    icono: 'Users2',
    ruta: '/red-agentes',
    requiereModulos: ['crm'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 120
  },

  // Automatización
  {
    codigo: 'automatizacion',
    nombre: 'Automatización',
    descripcion: 'Panel de automatización de procesos, reglas y triggers',
    categoria: 'avanzado',
    icono: 'Zap',
    ruta: '/automatizacion',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 121
  },
  {
    codigo: 'workflows',
    nombre: 'Workflows',
    descripcion: 'Diseño y ejecución de flujos de trabajo automatizados',
    categoria: 'avanzado',
    icono: 'Zap',
    ruta: '/workflows',
    requiereModulos: ['automatizacion'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 122
  },
  {
    codigo: 'sincronizacion',
    nombre: 'Sincronización',
    descripcion: 'Sincronización de datos con plataformas externas',
    categoria: 'avanzado',
    icono: 'Share2',
    ruta: '/sincronizacion',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 123
  },
  {
    codigo: 'sincronizacion_avanzada',
    nombre: 'Sincronización Avanzada',
    descripcion: 'Sincronización bidireccional avanzada con portales y ERPs',
    categoria: 'avanzado',
    icono: 'Share2',
    ruta: '/sincronizacion-avanzada',
    requiereModulos: ['sincronizacion'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 124
  },
  {
    codigo: 'recordatorios',
    nombre: 'Recordatorios',
    descripcion: 'Sistema de recordatorios automáticos para vencimientos, pagos y tareas',
    categoria: 'avanzado',
    icono: 'Bell',
    ruta: '/recordatorios',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 125
  },

  // Innovación
  {
    codigo: 'puntos_carga',
    nombre: 'Puntos de Carga EV',
    descripcion: 'Gestión de estaciones de carga para vehículos eléctricos',
    categoria: 'avanzado',
    icono: 'Zap',
    ruta: '/puntos-carga',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 127
  },
  {
    codigo: 'instalaciones_deportivas',
    nombre: 'Instalaciones Deportivas',
    descripcion: 'Gestión de piscinas, gimnasios, pistas y espacios deportivos comunitarios',
    categoria: 'comunidad',
    icono: 'Activity',
    ruta: '/instalaciones-deportivas',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 128
  },

  // Soporte
  {
    codigo: 'soporte',
    nombre: 'Soporte',
    descripcion: 'Centro de soporte y asistencia técnica',
    categoria: 'admin',
    icono: 'HeadphonesIcon',
    ruta: '/soporte',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 129
  },
  {
    codigo: 'knowledge_base',
    nombre: 'Base de Conocimientos',
    descripcion: 'Artículos de ayuda, guías y documentación para usuarios',
    categoria: 'admin',
    icono: 'BookOpen',
    ruta: '/knowledge-base',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 130
  },
  {
    codigo: 'sugerencias',
    nombre: 'Sugerencias',
    descripcion: 'Buzón de sugerencias y feedback de usuarios',
    categoria: 'admin',
    icono: 'MessageCircle',
    ruta: '/sugerencias',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 131
  },

  // Herramientas de Inversión
  {
    codigo: 'herramientas_inversion',
    nombre: 'Herramientas de Inversión',
    descripcion: 'Calculadoras de rentabilidad, hipotecas y gastos de compraventa',
    categoria: 'financiero',
    icono: 'Calculator',
    ruta: '/dashboard/herramientas',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 132
  },

  // Licitaciones
  {
    codigo: 'licitaciones',
    nombre: 'Licitaciones',
    descripcion: 'Gestión de licitaciones y concursos para obras y servicios',
    categoria: 'gestion',
    icono: 'FileText',
    ruta: '/licitaciones',
    requiereModulos: ['construction_projects'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 133
  },

  // Matching Inteligente
  {
    codigo: 'matching',
    nombre: 'Matching Inteligente',
    descripcion: 'Algoritmos de emparejamiento inquilino-propiedad basados en preferencias y scoring',
    categoria: 'avanzado',
    icono: 'UserCheck',
    ruta: '/matching',
    requiereModulos: ['inquilinos', 'unidades'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 134
  },

  // IA Documental
  {
    codigo: 'ia_documental',
    nombre: 'IA Documental',
    descripcion: 'Procesamiento inteligente de documentos con OCR e IA para extracción automática de datos',
    categoria: 'avanzado',
    icono: 'Bot',
    ruta: '/onboarding/documents',
    requiereModulos: ['documentos'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 135
  },

  // Redes Sociales
  {
    codigo: 'redes_sociales',
    nombre: 'Redes Sociales',
    descripcion: 'Publicación y gestión de contenido en redes sociales y portales inmobiliarios',
    categoria: 'avanzado',
    icono: 'Share2',
    ruta: '/dashboard/social-media',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 136
  },

  // Gestión Inmobiliaria
  {
    codigo: 'gestion_inmobiliaria',
    nombre: 'Gestión de Propiedades',
    descripcion: 'Panel de gestión de propiedades inmobiliarias',
    categoria: 'core',
    icono: 'Building2',
    ruta: '/propiedades',
    requiereModulos: ['edificios'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 137
  },

  // ============================================
  // VERTICALES DE NEGOCIO - Sincronización sidebar ↔ admin/modulos
  // ============================================
  {
    codigo: 'ewoorker',
    nombre: 'eWoorker - Marketplace B2B',
    descripcion: 'Marketplace de profesionales de construcción y mantenimiento: trabajadores, asignaciones, obras, pagos y compliance',
    categoria: 'vertical',
    icono: 'Users2',
    ruta: '/ewoorker',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 140
  },
  {
    codigo: 'warehouse',
    nombre: 'Gestión de Almacenes',
    descripcion: 'Inventario, ubicaciones y movimientos de mercancía en naves logísticas',
    categoria: 'vertical',
    icono: 'Package',
    ruta: '/warehouse',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 141
  },
  {
    codigo: 'workspace',
    nombre: 'Workspace / Coworking',
    descripcion: 'Gestión de espacios de trabajo compartidos: coworking, reservas y miembros',
    categoria: 'vertical',
    icono: 'Users2',
    ruta: '/workspace',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 142
  },
  {
    codigo: 'real_estate_developer',
    nombre: 'Promotoras Inmobiliarias',
    descripcion: 'Gestión de promociones inmobiliarias: proyectos, ventas, marketing y comercialización',
    categoria: 'vertical',
    icono: 'Building2',
    ruta: '/real-estate-developer',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 143
  },
  {
    codigo: 'student_housing',
    nombre: 'Student Housing',
    descripcion: 'Residencias de estudiantes: habitaciones, residentes, aplicaciones, actividades y pagos',
    categoria: 'vertical',
    icono: 'Home',
    ruta: '/student-housing',
    requiereModulos: ['edificios', 'inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 144
  },
  {
    codigo: 'viajes_corporativos',
    nombre: 'Viajes Corporativos',
    descripcion: 'Corporate travel management: reservas, huéspedes, informes de gastos y políticas',
    categoria: 'vertical',
    icono: 'Briefcase',
    ruta: '/viajes-corporativos',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 145
  },
  {
    codigo: 'vivienda_social',
    nombre: 'Vivienda Social',
    descripcion: 'Gestión de vivienda protegida: solicitudes, elegibilidad, compliance y reportes',
    categoria: 'vertical',
    icono: 'Home',
    ruta: '/vivienda-social',
    requiereModulos: ['edificios'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 146
  },
  {
    codigo: 'media_estancia',
    nombre: 'Media Estancia',
    descripcion: 'Alquiler de media estancia: calendario, scoring de huéspedes y analytics',
    categoria: 'vertical',
    icono: 'Calendar',
    ruta: '/media-estancia',
    requiereModulos: ['contratos', 'inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 147
  },
  {
    codigo: 'construccion_dashboard',
    nombre: 'Construcción - Dashboard',
    descripcion: 'Panel principal de la vertical de construcción y reformas',
    categoria: 'vertical',
    icono: 'HardHat',
    ruta: '/construccion',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 148
  },
  {
    codigo: 'construccion_projects',
    nombre: 'Proyectos de Construcción',
    descripcion: 'Gestión de proyectos de obra nueva, reformas y rehabilitaciones',
    categoria: 'vertical',
    icono: 'HardHat',
    ruta: '/construccion/proyectos',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 149
  },
  {
    codigo: 'str_housekeeping',
    nombre: 'Housekeeping STR',
    descripcion: 'Gestión de limpieza y preparación de propiedades de alquiler turístico',
    categoria: 'gestion',
    icono: 'ClipboardList',
    ruta: '/str-housekeeping',
    requiereModulos: ['str_listings'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 150
  },
  {
    codigo: 'str_advanced',
    nombre: 'STR Avanzado',
    descripcion: 'Channel manager, revenue management, guest experience y gestión legal STR',
    categoria: 'gestion',
    icono: 'Hotel',
    ruta: '/str-advanced',
    requiereModulos: ['str_listings'],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 151
  },
  {
    codigo: 'valoracion_ia',
    nombre: 'Valoración IA',
    descripcion: 'Valoración automática de propiedades con inteligencia artificial y datos del mercado',
    categoria: 'avanzado',
    icono: 'Brain',
    ruta: '/valoracion-ia',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 152
  },
  {
    codigo: 'community_management',
    nombre: 'Gestión de Comunidad',
    descripcion: 'Dashboard de comunidad para eventos, comunicación y engagement de residentes',
    categoria: 'comunidad',
    icono: 'Users',
    ruta: '/dashboard/community',
    requiereModulos: ['inquilinos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 153
  },
  {
    codigo: 'admin_fincas',
    nombre: 'Administración de Fincas',
    descripcion: 'Gestión integral de comunidades de propietarios: cuotas, actas, votaciones, incidencias y más',
    categoria: 'vertical',
    icono: 'Building2',
    ruta: '/comunidades',
    requiereModulos: ['edificios'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 154
  },

  // ============================================
  // PLATAFORMA - Módulos de administración Super Admin
  // ============================================
  {
    codigo: 'admin_dashboard',
    nombre: 'Dashboard Administración',
    descripcion: 'Panel principal de administración de la plataforma',
    categoria: 'plataforma',
    icono: 'LayoutDashboard',
    ruta: '/admin/dashboard',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 200
  },
  {
    codigo: 'gestion_clientes',
    nombre: 'Gestión de Clientes B2B',
    descripcion: 'Administración de empresas clientes de la plataforma',
    categoria: 'plataforma',
    icono: 'Building2',
    ruta: '/admin/clientes',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 201
  },
  {
    codigo: 'admin_planes',
    nombre: 'Gestión de Planes',
    descripcion: 'Administración de planes de suscripción y precios',
    categoria: 'plataforma',
    icono: 'Package',
    ruta: '/admin/planes',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 202
  },
  {
    codigo: 'admin_cupones',
    nombre: 'Cupones y Descuentos',
    descripcion: 'Gestión de cupones promocionales y descuentos',
    categoria: 'plataforma',
    icono: 'Tag',
    ruta: '/admin/cupones',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 203
  },
  {
    codigo: 'admin_ewoorker_planes',
    nombre: 'Planes eWoorker',
    descripcion: 'Gestión de planes específicos para la plataforma eWoorker',
    categoria: 'plataforma',
    icono: 'Package',
    ruta: '/admin/ewoorker-planes',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 204
  },
  {
    codigo: 'admin_facturacion_b2b',
    nombre: 'Facturación B2B',
    descripcion: 'Facturación y cobros a empresas clientes de la plataforma',
    categoria: 'plataforma',
    icono: 'DollarSign',
    ruta: '/admin/facturacion-b2b',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 205
  },
  {
    codigo: 'admin_personalizacion',
    nombre: 'Personalización / Branding',
    descripcion: 'Configuración de marca blanca, logos y colores de la plataforma',
    categoria: 'plataforma',
    icono: 'Palette',
    ruta: '/admin/personalizacion',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 206
  },
  {
    codigo: 'admin_activity',
    nombre: 'Actividad del Sistema',
    descripcion: 'Log de actividad y eventos del sistema en tiempo real',
    categoria: 'plataforma',
    icono: 'Activity',
    ruta: '/admin/activity',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 207
  },
  {
    codigo: 'admin_alertas',
    nombre: 'Alertas del Sistema',
    descripcion: 'Configuración y gestión de alertas automáticas',
    categoria: 'plataforma',
    icono: 'Bell',
    ruta: '/admin/alertas',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 208
  },
  {
    codigo: 'admin_portales_externos',
    nombre: 'Portales Externos',
    descripcion: 'Integración con portales inmobiliarios externos (Idealista, Fotocasa, etc.)',
    categoria: 'plataforma',
    icono: 'Share2',
    ruta: '/admin/portales-externos',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 209
  },
  {
    codigo: 'admin_aprobaciones',
    nombre: 'Aprobaciones',
    descripcion: 'Flujo de aprobaciones para operaciones sensibles',
    categoria: 'plataforma',
    icono: 'CheckSquare',
    ruta: '/admin/aprobaciones',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 210
  },
  {
    codigo: 'admin_reportes_programados',
    nombre: 'Reportes Programados',
    descripcion: 'Configuración de reportes automáticos enviados por email',
    categoria: 'plataforma',
    icono: 'FileBarChart',
    ruta: '/admin/reportes-programados',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 211
  },
  {
    codigo: 'admin_importar',
    nombre: 'Importación de Datos',
    descripcion: 'Herramienta de importación masiva de datos desde Excel/CSV',
    categoria: 'plataforma',
    icono: 'Upload',
    ruta: '/admin/importar',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 212
  },
  {
    codigo: 'admin_ocr_import',
    nombre: 'OCR Import',
    descripcion: 'Importación de documentos con reconocimiento óptico de caracteres',
    categoria: 'plataforma',
    icono: 'Scan',
    ruta: '/admin/ocr-import',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 213
  },
  {
    codigo: 'admin_logs',
    nombre: 'Logs del Sistema',
    descripcion: 'Visor de logs del sistema para diagnóstico y debugging',
    categoria: 'plataforma',
    icono: 'FileText',
    ruta: '/admin/system-logs',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 214
  },
  {
    codigo: 'admin_onboarding',
    nombre: 'Onboarding de Clientes',
    descripcion: 'Gestión del proceso de onboarding de nuevos clientes',
    categoria: 'plataforma',
    icono: 'UserPlus',
    ruta: '/admin/onboarding',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 215
  },
  {
    codigo: 'admin_notificaciones',
    nombre: 'Notificaciones Masivas',
    descripcion: 'Envío de notificaciones masivas a usuarios de la plataforma',
    categoria: 'plataforma',
    icono: 'Bell',
    ruta: '/admin/notificaciones-masivas',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 216
  },
  {
    codigo: 'api_docs',
    nombre: 'Documentación API',
    descripcion: 'Documentación interactiva de la API REST de la plataforma',
    categoria: 'plataforma',
    icono: 'Code',
    ruta: '/api-docs',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 217
  },
  {
    codigo: 'admin_sales_team',
    nombre: 'Equipo de Ventas',
    descripcion: 'Gestión del equipo comercial y seguimiento de ventas',
    categoria: 'plataforma',
    icono: 'Users',
    ruta: '/admin/sales-team',
    requiereModulos: [],
    tiersIncluido: ['empresarial'],
    esCore: false,
    orden: 218
  },
  // === Módulos añadidos (sync completo Mar 2026) ===
  {
    codigo: 'alertas',
    nombre: 'Alertas',
    descripcion: 'Sistema de alertas y notificaciones de la plataforma',
    categoria: 'core',
    icono: 'Bell',
    ruta: '/alertas',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 220
  },
  {
    codigo: 'ayuda',
    nombre: 'Centro de Ayuda',
    descripcion: 'Documentación, tutoriales y soporte',
    categoria: 'core',
    icono: 'HelpCircle',
    ruta: '/ayuda',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 221
  },
  {
    codigo: 'comunicaciones',
    nombre: 'Comunicaciones',
    descripcion: 'Gestión de comunicaciones con inquilinos y propietarios',
    categoria: 'comunicacion',
    icono: 'Mail',
    ruta: '/comunicaciones',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 222
  },
  {
    codigo: 'comunidad',
    nombre: 'Comunidad',
    descripcion: 'Red social y comunidad de usuarios',
    categoria: 'comunidad',
    icono: 'Users',
    ruta: '/comunidad',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 223
  },
  {
    codigo: 'morosidad',
    nombre: 'Gestión de Morosidad',
    descripcion: 'Control de impagos, scoring de riesgo y recobro',
    categoria: 'financiero',
    icono: 'AlertTriangle',
    ruta: '/morosidad',
    requiereModulos: ['pagos'],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 224
  },
  {
    codigo: 'renovaciones_contratos',
    nombre: 'Renovación de Contratos',
    descripcion: 'Gestión de renovaciones, incrementos IPC y vencimientos',
    categoria: 'gestion',
    icono: 'RefreshCw',
    ruta: '/renovaciones-contratos',
    requiereModulos: ['contratos'],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: false,
    orden: 225
  },
  {
    codigo: 'admin',
    nombre: 'Panel de Administración',
    descripcion: 'Configuración general y administración del sistema',
    categoria: 'admin',
    icono: 'Settings',
    ruta: '/admin',
    requiereModulos: [],
    tiersIncluido: ['basico', 'profesional', 'empresarial'],
    esCore: true,
    orden: 226
  },
  {
    codigo: 'community',
    nombre: 'Community Feed',
    descripcion: 'Feed social de la comunidad de gestores',
    categoria: 'comunidad',
    icono: 'MessageCircle',
    ruta: '/community',
    requiereModulos: [],
    tiersIncluido: ['profesional', 'empresarial'],
    esCore: false,
    orden: 227
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
    'firma_digital', 'legal'
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
  await prisma.companyModule.upsert({
    where: {
      companyId_moduloCodigo: {
        companyId,
        moduloCodigo
      }
    },
    update: {
      activo: false,
      updatedAt: new Date()
    },
    create: {
      companyId,
      moduloCodigo,
      activo: false,
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