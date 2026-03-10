import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  CreditCard,
  Wrench,
  FileBarChart,
  Settings,
  Star,
  Hotel,
  TrendingUp,
  HardHat,
  Briefcase,
  Globe,
  Sparkles,
  Calendar,
  MessageSquare,
  Folder,
  BarChart2,
  BarChart3,
  Package,
  Euro,
  ClipboardList,
  UserCheck,
  HeadphonesIcon,
  Bell,
  AlertCircle,
  AlertTriangle,
  FileSignature,
  ShoppingCart,
  CalendarCheck,
  Users2,
  MessageCircle,
  CheckSquare,
  Eye,
  Shield,
  Megaphone,
  Vote,
  Car,
  Award,
  UserPlus,
  Code,
  Activity,
  Palette,
  Upload,
  DollarSign,
  Clock,
  Zap,
  BookOpen,
  Scan,
  Share2,
  Tag,
  ShoppingBag,
  Bot,
  Brain,
  Calculator,
  MapPin,
  Percent,
  Search,
  Crown,
  Landmark,
  LogIn,
  Coffee,
  Banknote,
  Receipt,
  ArrowRightLeft,
  FileSpreadsheet,
} from 'lucide-react';

export interface SubItem {
  name: string;
  href: string;
  icon?: LucideIcon;
}

export interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  badge?: string;
  subItems?: SubItem[];
  dataTour?: string;
}

// Mapeo de rutas a códigos de módulos para sistema modular
const ROUTE_TO_MODULE: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/edificios': 'edificios',
  '/unidades': 'unidades',
  '/garajes-trasteros': 'unidades',
  '/inquilinos': 'inquilinos',
  '/matching': 'matching',
  '/contratos': 'contratos',
  '/contratos-gestion': 'documentos',
  '/liquidaciones': 'finanzas',
  '/facturacion': 'facturacion',
  '/garajes-trasteros': 'unidades',
  '/suministros': 'operaciones',
  '/avalistas': 'contratos',
  '/actualizaciones-renta': 'contratos',
  '/check-in-out': 'mantenimiento',
  '/reportes/avanzados': 'reportes',
  '/admin/campos-personalizados': 'configuracion',
  '/admin/plantillas-comunicacion': 'comunicaciones',
  '/admin/webhook-logs': 'configuracion',
  '/acciones-masivas': 'operaciones',
  '/no-disponibilidad': 'operaciones',
  '/pagos': 'pagos',
  '/pagos/sepa': 'pagos',
  '/finanzas/conciliacion': 'pagos',
  '/mantenimiento': 'mantenimiento',
  '/dashboard/servicios': 'servicios',
  '/calendario': 'calendario',
  '/chat': 'chat',
  '/bi': 'bi',
  '/reportes': 'reportes',
  '/documentos': 'documentos',
  '/room-rental': 'room_rental',
  '/proveedores': 'proveedores',
  '/gastos': 'gastos',
  '/tareas': 'tareas',
  '/candidatos': 'candidatos',
  '/crm': 'crm',
  '/notificaciones': 'notificaciones',
  '/incidencias': 'incidencias',
  '/ocr': 'ocr',
  '/onboarding/documents': 'ia_documental',
  '/onboarding/review': 'ia_documental',
  '/redes-sociales': 'redes_sociales',
  '/dashboard/social-media': 'redes_sociales',
  '/propiedades': 'gestion_inmobiliaria',
  '/admin/dashboard': 'admin_dashboard',
  '/admin/clientes': 'gestion_clientes',
  '/admin/planes': 'admin_planes',
  '/admin/ewoorker-planes': 'admin_ewoorker_planes',
  '/admin/cupones': 'admin_cupones',
  '/admin/facturacion-b2b': 'admin_facturacion_b2b',
  '/admin/personalizacion': 'admin_personalizacion',
  '/admin/activity': 'admin_activity',
  '/admin/alertas': 'admin_alertas',
  '/admin/portales-externos': 'admin_portales_externos',
  '/admin/aprobaciones': 'admin_aprobaciones',
  '/admin/reportes-programados': 'admin_reportes_programados',
  '/admin/importar': 'admin_importar',
  '/admin/ocr-import': 'admin_ocr_import',
  '/admin/system-logs': 'admin_logs',
  '/admin/onboarding': 'admin_onboarding',
  '/admin/notificaciones-masivas': 'admin_notificaciones',
  '/api-docs': 'api_docs',
  '/admin/configuracion': 'configuracion',
  '/admin/usuarios': 'usuarios',
  '/admin/modulos': 'configuracion',
  '/admin/sales-team': 'admin_sales_team',
  '/analytics': 'analytics',
  '/valoracion-ia': 'valoracion_ia',
  '/str/listings': 'str_listings',
  '/str-housekeeping': 'str_housekeeping',
  '/str/bookings': 'str_bookings',
  '/str/channels': 'str_channels',
  '/str-advanced': 'str_advanced',
  '/str-advanced/channel-manager': 'str_advanced',
  '/str-advanced/revenue': 'str_advanced',
  '/str-advanced/housekeeping': 'str_advanced',
  '/str-advanced/guest-experience': 'str_advanced',
  '/str-advanced/legal': 'str_advanced',
  '/flipping/projects': 'flipping_projects',
  '/construction/projects': 'construction_projects',
  '/construccion/proyectos': 'construccion_projects',
  '/construccion': 'construccion_dashboard',
  // eWoorker - Marketplace de Trabajadores
  '/ewoorker': 'ewoorker',
  '/ewoorker/dashboard': 'ewoorker',
  '/ewoorker/panel': 'ewoorker',
  '/ewoorker/trabajadores': 'ewoorker',
  '/ewoorker/asignaciones': 'ewoorker',
  '/ewoorker/obras': 'ewoorker',
  '/ewoorker/contratos': 'ewoorker',
  '/ewoorker/pagos': 'ewoorker',
  '/ewoorker/analytics': 'ewoorker',
  '/ewoorker/empresas': 'ewoorker',
  '/ewoorker/compliance': 'ewoorker',
  '/ewoorker/leaderboard': 'ewoorker',
  '/ewoorker/admin-socio': 'ewoorker',
  '/ewoorker/perfil': 'ewoorker',
  '/ewoorker/landing': 'ewoorker',
  '/professional/projects': 'professional_projects',
  '/anuncios': 'anuncios',
  '/votaciones': 'votaciones',
  '/reuniones': 'reuniones',
  '/reservas': 'reservas',
  '/admin-fincas': 'admin_fincas',
  '/admin-fincas/comunidades': 'admin_fincas',
  '/admin-fincas/facturas': 'admin_fincas',
  '/admin-fincas/libro-caja': 'admin_fincas',
  '/admin-fincas/informes': 'admin_fincas',
  '/comunidades': 'admin_fincas',
  '/comunidades/lista': 'admin_fincas',
  '/comunidades/propietarios': 'admin_fincas',
  '/comunidades/cuotas': 'admin_fincas',
  '/comunidades/fondos': 'admin_fincas',
  '/comunidades/actas': 'admin_fincas',
  '/comunidades/votaciones': 'admin_fincas',
  '/comunidades/incidencias': 'admin_fincas',
  '/comunidades/reuniones': 'admin_fincas',
  '/comunidades/cumplimiento': 'admin_fincas',
  '/comunidades/finanzas': 'admin_fincas',
  '/comunidades/presidente': 'admin_fincas',
  // Media Estancia (dentro de alquiler residencial)
  '/media-estancia': 'media_estancia',
  '/media-estancia/calendario': 'media_estancia',
  '/media-estancia/scoring': 'media_estancia',
  '/media-estancia/analytics': 'media_estancia',
  '/media-estancia/configuracion': 'media_estancia',
  '/renovaciones-contratos': 'contratos',
  '/mantenimiento-pro': 'mantenimiento',
  // Family Office Add-on
  '/family-office': 'family_office',
  '/family-office/dashboard': 'family_office',
  '/family-office/cuentas': 'family_office',
  '/family-office/cartera': 'family_office',
  '/family-office/pe': 'family_office',
  '/family-office/tesoreria': 'family_office',
  '/valoraciones': 'valoraciones',
  '/publicaciones': 'publicaciones',
  '/screening': 'screening',
  '/galerias': 'galerias',
  '/certificaciones': 'certificaciones',
  '/seguros': 'seguros',
  '/seguros/cotizaciones': 'seguros',
  '/seguros/proveedores': 'seguros',
  '/seguros/analisis': 'seguros',
  '/inspecciones': 'inspecciones',
  '/visitas': 'visitas',
  '/ordenes-trabajo': 'ordenes_trabajo',
  '/firma-digital': 'firma_digital',
  '/legal': 'legal',
  '/open-banking': 'open_banking',
  '/marketplace': 'marketplace',
  '/sms': 'sms',
  '/dashboard/community': 'community_management',
  '/esg': 'esg',
  '/iot': 'iot',
  '/blockchain': 'blockchain',
  '/tours-virtuales': 'tours_virtuales',
  '/economia-circular': 'economia_circular',
  '/auditoria': 'auditoria',
  '/seguridad-compliance': 'seguridad_compliance',
  // Patrimonio Terciario - Locales, Oficinas, Naves, Garajes, Trasteros
  '/comercial': 'alquiler_comercial',
  '/comercial/oficinas': 'alquiler_comercial',
  '/comercial/locales': 'alquiler_comercial',
  '/comercial/naves': 'alquiler_comercial',
  '/comercial/contratos': 'alquiler_comercial',
  '/comercial/leads': 'alquiler_comercial',
  '/comercial/garajes-trasteros': 'alquiler_comercial',
  // Espacios Flexibles - Coworking, Salas, Workspace
  '/comercial/coworking': 'alquiler_comercial',
  '/espacios-coworking': 'alquiler_comercial',
  '/salas-reuniones': 'alquiler_comercial',
  '/comercial/pagos': 'alquiler_comercial',
  '/comercial/visitas': 'alquiler_comercial',
  '/comercial/analytics': 'alquiler_comercial',
  '/comercial/espacios': 'alquiler_comercial',
  // Student Housing
  '/student-housing': 'student_housing',
  '/student-housing/dashboard': 'student_housing',
  '/student-housing/residentes': 'student_housing',
  '/student-housing/habitaciones': 'student_housing',
  '/student-housing/aplicaciones': 'student_housing',
  '/student-housing/actividades': 'student_housing',
  '/student-housing/pagos': 'student_housing',
  '/student-housing/mantenimiento': 'student_housing',
  // Viajes Corporativos
  '/viajes-corporativos': 'viajes_corporativos',
  '/viajes-corporativos/dashboard': 'viajes_corporativos',
  '/viajes-corporativos/bookings': 'viajes_corporativos',
  '/viajes-corporativos/guests': 'viajes_corporativos',
  '/viajes-corporativos/expense-reports': 'viajes_corporativos',
  '/viajes-corporativos/policies': 'viajes_corporativos',
  // Vivienda Social
  '/vivienda-social': 'vivienda_social',
  '/vivienda-social/dashboard': 'vivienda_social',
  '/vivienda-social/applications': 'vivienda_social',
  '/vivienda-social/eligibility': 'vivienda_social',
  '/vivienda-social/compliance': 'vivienda_social',
  '/vivienda-social/reporting': 'vivienda_social',
  // Real Estate Developer
  '/real-estate-developer': 'real_estate_developer',
  '/real-estate-developer/dashboard': 'real_estate_developer',
  '/real-estate-developer/projects': 'real_estate_developer',
  '/real-estate-developer/sales': 'real_estate_developer',
  '/real-estate-developer/marketing': 'real_estate_developer',
  '/real-estate-developer/commercial': 'real_estate_developer',
  // Workspace
  '/workspace': 'workspace',
  '/workspace/dashboard': 'workspace',
  '/workspace/coworking': 'workspace',
  '/workspace/booking': 'workspace',
  '/workspace/members': 'workspace',
  // Warehouse
  '/warehouse': 'warehouse',
  '/warehouse/inventory': 'warehouse',
  '/warehouse/locations': 'warehouse',
  '/warehouse/movements': 'warehouse',

  // ============================================
  // RUTAS ADICIONALES - Completar cobertura total
  // ============================================

  // Alquiler Residencial - Dashboard
  '/traditional-rental': 'alquiler_residencial',
  '/garantias': 'garantias',

  // STR - Dashboard y Reviews
  '/str': 'str',
  '/str/reviews': 'str_reviews',

  // Hospitality
  '/hospitality': 'hospitality',
  '/hospitality/check-in': 'hospitality',
  '/hospitality/housekeeping': 'hospitality',
  '/hospitality/servicios': 'hospitality',

  // Coliving (sub-rutas)
  '/coliving/propiedades': 'coliving',
  '/coliving/comunidad': 'coliving',
  '/coliving/emparejamiento': 'coliving',
  '/coliving/eventos': 'coliving',
  '/coliving/reservas': 'coliving',

  // Construcción (sub-rutas faltantes)
  '/construction/gantt': 'construction_projects',
  '/construction/quality-control': 'construction_projects',
  '/obras': 'construccion_projects',
  '/licitaciones': 'licitaciones',
  '/proyectos-renovacion': 'construccion_projects',

  // Flipping (sub-rutas faltantes)
  '/flipping/dashboard': 'flipping_projects',
  '/flipping/timeline': 'flipping_projects',
  '/flipping/calculator': 'flipping_projects',
  '/flipping/comparator': 'flipping_projects',

  // Holding / Grupo Societario
  '/inversiones': 'holding_grupo',
  '/inversiones/analisis': 'holding_grupo',
  '/inversiones/comparativa': 'holding_grupo',
  '/inversiones/activos': 'holding_grupo',
  '/inversiones/hipotecas': 'holding_grupo',
  '/inversiones/fiscal': 'holding_grupo',
  '/inversiones/fiscal/modelos': 'holding_grupo',
  '/inversiones/fiscal/simulador': 'holding_grupo',
  '/inversiones/modelo-720': 'holding_grupo',
  '/inversiones/grupo': 'holding_grupo',
  '/inversiones/tesoreria': 'holding_grupo',
  '/inversiones/pyl': 'holding_grupo',
  '/inversiones/fianzas': 'holding_grupo',
  '/inversiones/export': 'holding_grupo',

  // Finanzas (rutas faltantes)
  '/finanzas': 'finanzas',
  '/contabilidad': 'contabilidad',
  '/estadisticas': 'estadisticas',
  '/presupuestos': 'presupuestos',
  '/facturacion': 'facturacion',

  // Analytics (sub-rutas faltantes)
  '/reportes/financieros': 'reportes',
  '/reportes/operacionales': 'reportes',
  '/informes': 'informes',
  '/asistente-ia': 'ai_assistant',

  // Operaciones (rutas faltantes)
  '/servicios-limpieza': 'servicios_limpieza',

  // Documentos y Legal (rutas faltantes)
  '/plantillas': 'plantillas',

  // CRM y Marketing (rutas faltantes)
  '/portal-comercial': 'portal_comercial',
  '/promociones': 'promociones',
  '/reviews': 'reviews',
  '/red-agentes': 'red_agentes',

  // Automatización
  '/automatizacion': 'automatizacion',
  '/automatizacion/resumen': 'automatizacion',
  '/workflows': 'workflows',
  '/sincronizacion': 'sincronizacion',
  '/sincronizacion-avanzada': 'sincronizacion_avanzada',
  '/recordatorios': 'recordatorios',

  // Innovación (rutas faltantes)
  '/energia': 'energia',
  '/energia-solar': 'energia',
  '/puntos-carga': 'puntos_carga',
  '/economia-circular/huertos': 'economia_circular',
  '/economia-circular/residuos': 'economia_circular',
  '/huerto-urbano': 'economia_circular',
  '/instalaciones-deportivas': 'instalaciones_deportivas',

  // Soporte
  '/ayuda': 'centro_ayuda',
  '/soporte': 'soporte',
  '/knowledge-base': 'knowledge_base',
  '/sugerencias': 'sugerencias',

  // Herramientas de Inversión
  '/dashboard/herramientas': 'herramientas_inversion',

  // Servicios Profesionales (sub-rutas faltantes)
  '/professional/clients': 'professional_projects',
  '/professional/invoicing': 'professional_projects',

  // Admin - Herramientas Empresa e Impuestos
  '/admin/herramientas-empresa': 'configuracion',
  '/admin/impuestos': 'configuracion',
};

// ============================================================================
// MAPEO DE SECCIONES DEL SIDEBAR A MÓDULOS
// Permite activar/desactivar verticales y horizontales completas
// ============================================================================
const SECTION_TO_MODULES: Record<string, string[]> = {
  // === Verticales de Negocio ===
  alquilerResidencial: [
    'alquiler_residencial', 'gestion_inmobiliaria', 'edificios', 'inquilinos',
    'matching', 'contratos', 'candidatos', 'garantias', 'valoracion_ia',
    'inspecciones', 'certificaciones', 'seguros',
  ],
  str: ['str', 'str_listings', 'str_bookings', 'str_channels', 'str_housekeeping', 'str_reviews'],
  hospitality: ['hospitality'],
  coLiving: ['room_rental', 'coliving'],
  studentHousing: ['student_housing'],
  construccion: [
    'construction_projects', 'construccion_dashboard', 'construccion_projects',
    'licitaciones', 'ordenes_trabajo', 'flipping_projects', 'ewoorker', 'real_estate_developer',
  ],
  ewoorker: ['ewoorker'],
  flipping: ['flipping_projects'],
  comercial: ['alquiler_comercial'],
  adminFincas: ['admin_fincas'],
  viviendaSocial: ['vivienda_social'],
  // Family Office & Holding / Grupo
  holdingGrupo: [
    'inversiones', 'family_office', 'contabilidad', 'conciliacion',
    'holding_grupo', 'fiscal_modelos', 'fiscal_simulador', 'tesoreria',
    'amortizaciones', 'comparativa_sociedades', 'export_contable',
  ],
  realEstateDeveloper: ['real_estate_developer'],
  workspace: ['workspace'],
  warehouse: ['warehouse'],
  viajesCorporativos: ['viajes_corporativos'],

  // === Herramientas Horizontales ===
  finanzas: [
    'pagos', 'gastos', 'finanzas', 'contabilidad', 'bi',
    'estadisticas', 'presupuestos', 'facturacion', 'open_banking',
  ],
  analytics: ['analytics', 'reportes', 'informes', 'ai_assistant'],
  operaciones: [
    'mantenimiento', 'proveedores', 'incidencias', 'tareas',
    'calendario', 'visitas', 'servicios_limpieza', 'servicios',
  ],
  herramientasInversion: ['herramientas_inversion'],
  comunicaciones: ['chat', 'notificaciones', 'sms', 'redes_sociales'],
  documentosLegal: [
    'ia_documental', 'documentos', 'plantillas', 'firma_digital', 'legal', 'seguros',
  ],
  crmMarketing: [
    'crm', 'portal_comercial', 'promociones', 'reviews',
    'red_agentes', 'marketplace', 'tours_virtuales',
  ],
  automatizacion: ['automatizacion', 'workflows', 'sincronizacion', 'sincronizacion_avanzada', 'recordatorios'],
  innovacion: [
    'esg', 'energia', 'iot', 'blockchain', 'economia_circular',
    'puntos_carga', 'instalaciones_deportivas',
  ],
  soporte: ['centro_ayuda', 'soporte', 'knowledge_base', 'sugerencias'],
};

// Módulos core que siempre deben mostrarse (esCore: true)
// NOTA: Esta lista debe ser mínima para que el filtrado por plan funcione correctamente
const CORE_MODULES = [
  // Core - Funcionalidades básicas que toda empresa necesita
  'dashboard',
  'edificios',
  'unidades',
  'inquilinos',
  'matching',
  'contratos',
  'pagos',
  'mantenimiento',
  'proveedores',
  'gastos',
  'calendario',
  'chat',
  'notificaciones',
  'seguros',
  // Administración - Siempre visible para roles admin
  'configuracion',
  'usuarios',
  // Admin plataforma - Solo para super_admin
  'gestion_clientes',
  'admin_dashboard',
  'admin_planes',
  'admin_facturacion_b2b',
  'admin_personalizacion',
  'admin_activity',
  'admin_alertas',
  'admin_aprobaciones',
  'admin_reportes_programados',
  'admin_importar',
  'admin_sales_team',
  'admin_portales_externos',
  'api_docs',
  // Herramientas de Valoración
  'valoracion_ia',
];

// ============================================================================
// NUEVA ORGANIZACIÓN MEJORADA - BASADA EN VERTICALES Y HERRAMIENTAS HORIZONTALES
// ============================================================================

// 1. INICIO - Dashboard Principal
// NOTA: Para super_admin, el dashboard de plataforma está en superAdminPlatformItems
const dashboardNavItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['administrador', 'gestor', 'operador'], // super_admin usa /admin/dashboard
    dataTour: 'dashboard-link',
  },
  {
    name: 'Mi Día',
    href: '/hoy',
    icon: Calendar,
    roles: ['administrador', 'gestor', 'super_admin'],
  },
  {
    name: 'Vista Ejecutiva',
    href: '/dashboard/ejecutivo',
    icon: TrendingUp,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Alertas',
    href: '/alertas',
    icon: AlertTriangle,
    roles: ['administrador', 'gestor', 'super_admin'],
  },
  {
    name: 'Vencimientos',
    href: '/vencimientos',
    icon: CalendarCheck,
    roles: ['administrador', 'gestor', 'super_admin'],
  },
];

// 2. VERTICALES DE NEGOCIO - Agrupadas por modelo de negocio

// ============================================================================
// 2.1 ALQUILER RESIDENCIAL - SIMPLIFICADO (Ene 2026)
// Fusiones: Screening+Verificación → en Candidatos
//          2x Garantías → 1 Garantías
//          2x Valoración IA → 1 Valoración IA
//          2x Inspecciones → 1 Inspecciones
// Resultado: 18 items → 10 items (-44%)
// ============================================================================
const alquilerResidencialItems = [
  {
    name: 'Dashboard',
    href: '/traditional-rental',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'alquiler-dashboard',
  },
  {
    name: 'Propiedades',
    href: '/propiedades',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'propiedades-menu',
  },
  {
    name: 'Edificios',
    href: '/edificios',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'edificios-menu',
  },
  {
    name: 'Inquilinos',
    href: '/inquilinos',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'inquilinos-menu',
    subItems: [
      { name: 'Lista', href: '/inquilinos', icon: Users },
      { name: 'Alta Rápida', href: '/inquilinos/alta-rapida', icon: UserPlus },
    ],
  },
  {
    name: 'Matching',
    href: '/matching',
    icon: UserCheck,
    roles: ['super_admin', 'administrador', 'gestor'],
    badge: 'IA',
  },
  {
    name: 'Contratos',
    href: '/contratos',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'contratos-menu',
  },
  {
    name: 'Contratos Gestión',
    href: '/contratos-gestion',
    icon: FileSignature,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Avalistas',
    href: '/avalistas',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Actualización Renta',
    href: '/actualizaciones-renta',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Candidatos',
    href: '/candidatos',
    icon: UserPlus,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Garantías',
    href: '/garantias',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Valoración IA',
    href: '/valoracion-ia',
    icon: Brain,
    roles: ['super_admin', 'administrador', 'gestor'],
    badge: 'IA',
    dataTour: 'valoraciones-menu',
  },
  {
    name: 'Seguros',
    href: '/seguros',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'seguros-menu',
    subItems: [
      { name: 'Pólizas', href: '/seguros', icon: Shield },
      { name: 'Cotizaciones', href: '/seguros/cotizaciones', icon: FileText },
      { name: 'Proveedores', href: '/seguros/proveedores', icon: Building2 },
      { name: 'Análisis', href: '/seguros/analisis', icon: BarChart3 },
    ],
  },
  {
    name: 'Inspecciones',
    href: '/inspecciones',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'inspecciones-menu',
  },
  {
    name: 'Certificaciones',
    href: '/certificaciones',
    icon: Award,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Garajes y Trasteros',
    href: '/garajes-trasteros',
    icon: Car,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Suministros',
    href: '/suministros',
    icon: Zap,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.2 STR - SHORT TERM RENTALS - SIMPLIFICADO (9→6 items)
const strNavItems = [
  {
    name: 'Dashboard',
    href: '/str',
    icon: Hotel,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'str-dashboard-menu',
  },
  {
    name: 'Anuncios',
    href: '/str/listings',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'str-listings-menu',
  },
  {
    name: 'Reservas',
    href: '/str/bookings',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'str-bookings-menu',
  },
  {
    name: 'Revenue',
    href: '/str/channels',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'str-channels-menu',
  },
  {
    name: 'Housekeeping',
    href: '/str-housekeeping',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'str-housekeeping-menu',
  },
  {
    name: 'Reviews',
    href: '/str/reviews',
    icon: Star,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'str-reviews-menu',
  },
];

// 2.2.1 HOSPITALITY (Servicios presenciales sobre activos STR)
// Apart-hotels, B&B, Serviced Apartments - misma infraestructura STR + capa de servicios
const hospitalityNavItems = [
  {
    name: 'Panel Hospitality',
    href: '/hospitality',
    icon: Hotel,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Check-in / Check-out',
    href: '/hospitality/check-in',
    icon: LogIn,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Housekeeping',
    href: '/hospitality/housekeeping',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Servicios al Huésped',
    href: '/hospitality/servicios',
    icon: Coffee,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.3 CO-LIVING - SIMPLIFICADO (9→6 items)
// Fusión: Comunidad Social+Gestión → Comunidad, 2x Reservas → 1
const coLivingNavItems = [
  {
    name: 'Habitaciones',
    href: '/room-rental',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'room-rental-menu',
  },
  {
    name: 'Propiedades',
    href: '/coliving/propiedades',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'coliving-propiedades-menu',
  },
  {
    name: 'Comunidad',
    href: '/coliving/comunidad',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor', 'community_manager'],
    dataTour: 'comunidad-social-menu',
  },
  {
    name: 'Matching',
    href: '/coliving/emparejamiento',
    icon: UserCheck,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'coliving-matching-menu',
  },
  {
    name: 'Eventos',
    href: '/coliving/eventos',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor', 'community_manager'],
    dataTour: 'coliving-eventos-menu',
  },
  {
    name: 'Reservas',
    href: '/coliving/reservas',
    icon: CalendarCheck,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
    dataTour: 'espacios-comunes-menu',
  },
];

// 2.4 CONSTRUCCIÓN (antes BUILD-TO-RENT)
// Incluye ewoorker como subplataforma marketplace
const buildToRentNavItems = [
  {
    name: 'Proyectos',
    href: '/construction/projects',
    icon: HardHat,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Control de Calidad',
    href: '/construction/quality-control',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Órdenes de Trabajo',
    href: '/ordenes-trabajo',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'eWoorker (Marketplace)',
    href: '/ewoorker',
    icon: Package,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.5 HOUSE FLIPPING
// AMPLIADO: Incluye timeline de proyectos
const flippingNavItems = [
  {
    name: 'Dashboard',
    href: '/flipping/dashboard',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'flipping-dashboard-menu',
  },
  {
    name: 'Proyectos',
    href: '/flipping/projects',
    icon: Folder,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'flipping-projects-menu',
  },
  {
    name: 'Timeline',
    href: '/flipping/timeline',
    icon: Clock,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Calculadora ROI',
    href: '/flipping/calculator',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Análisis Mercado',
    href: '/flipping/comparator',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.5.1 CONSTRUCCIÓN
// Gestión de proyectos de construcción, reformas y rehabilitaciones
// AMPLIADO: Incluye Gantt, licitaciones, obras y proyectos de renovación
const construccionNavItems = [
  {
    name: 'Dashboard',
    href: '/construccion',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'construction-dashboard-menu',
  },
  {
    name: 'Proyectos',
    href: '/construccion/proyectos',
    icon: HardHat,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'construction-projects-menu',
  },
  {
    name: 'Diagrama Gantt',
    href: '/construction/gantt',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Obras',
    href: '/obras',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Licitaciones',
    href: '/licitaciones',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Proyectos Renovación',
    href: '/proyectos-renovacion',
    icon: Wrench,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Órdenes de Trabajo',
    href: '/ordenes-trabajo',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Control de Calidad',
    href: '/construction/quality-control',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.5.2 EWOORKER - Plataforma de Trabajadores
// Marketplace de profesionales para obras y mantenimiento
const ewoorkerNavItems = [
  {
    name: 'Dashboard',
    href: '/ewoorker/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Panel eWoorker',
    href: '/ewoorker/panel',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Trabajadores',
    href: '/ewoorker/trabajadores',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Asignaciones',
    href: '/ewoorker/asignaciones',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Obras',
    href: '/ewoorker/obras',
    icon: HardHat,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Contratos',
    href: '/ewoorker/contratos',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Pagos',
    href: '/ewoorker/pagos',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Analytics',
    href: '/ewoorker/analytics',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Empresas',
    href: '/ewoorker/empresas',
    icon: Building2,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Compliance',
    href: '/ewoorker/compliance',
    icon: Shield,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Leaderboard',
    href: '/ewoorker/leaderboard',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Admin Socio',
    href: '/ewoorker/admin-socio',
    icon: Settings,
    roles: ['super_admin'],
  },
];

// 2.6 PATRIMONIO TERCIARIO (Activos no residenciales: Locales, Oficinas, Naves, Garajes, Trasteros)
// Estos son activos inmobiliarios que se gestionan/alquilan de forma independiente,
// no como parte de un edificio residencial.
const patrimonioTerciarioNavItems = [
  {
    name: 'Panel Terciario',
    href: '/comercial',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-terciario-dashboard',
  },
  {
    name: 'Locales Comerciales',
    href: '/comercial/locales',
    icon: Star,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-terciario-locales',
  },
  {
    name: 'Oficinas',
    href: '/comercial/oficinas',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-terciario-oficinas',
  },
  {
    name: 'Naves Industriales',
    href: '/comercial/naves',
    icon: Package,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'tour-terciario-naves',
  },
  {
    name: 'Garajes y Trasteros',
    href: '/garajes-trasteros',
    icon: Car,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Contratos Terciarios',
    href: '/comercial/contratos',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Leads',
    href: '/comercial/leads',
    icon: UserPlus,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  // Seguros eliminado de aquí — se gestiona desde Documentos y Legal (evitar duplicado x3)
];

// 2.6.1 ESPACIOS FLEXIBLES (Coworking, Salas de Reuniones, Workspace)
// Espacios compartidos o de uso temporal, diferente de activos terciarios fijos.
const espaciosFlexiblesNavItems = [
  {
    name: 'Coworking',
    href: '/comercial/coworking',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Espacios',
    href: '/espacios-coworking',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Salas de Reuniones',
    href: '/salas-reuniones',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reservas',
    href: '/workspace/booking',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Miembros',
    href: '/workspace/members',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.6.2 SERVICIOS PROFESIONALES (CRM/Facturación de servicios)
const comercialNavItems = [
  {
    name: 'Servicios Profesionales',
    href: '/professional/projects',
    icon: Briefcase,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'professional-projects-menu',
  },
  {
    name: 'Clientes',
    href: '/professional/clients',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'crm-menu',
  },
  {
    name: 'Facturación',
    href: '/professional/invoicing',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'facturacion-menu',
  },
];

// LEGACY: mantener alquilerComercialNavItems como alias para compatibilidad
const alquilerComercialNavItems = patrimonioTerciarioNavItems;

// 2.7 ADMINISTRADOR DE FINCAS / COMUNIDADES
// AMPLIADO: Incluye todas las sub-páginas de comunidades
const adminFincasItems = [
  {
    name: 'Dashboard',
    href: '/comunidades',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'comunidades-dashboard-menu',
  },
  {
    name: 'Mis Comunidades',
    href: '/comunidades/lista',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'comunidades-lista-menu',
  },
  {
    name: 'Propietarios',
    href: '/comunidades/propietarios',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'comunidades-propietarios-menu',
  },
  {
    name: 'Cuotas',
    href: '/comunidades/cuotas',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'comunidades-cuotas-menu',
  },
  {
    name: 'Fondos Reserva',
    href: '/comunidades/fondos',
    icon: DollarSign,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Actas',
    href: '/comunidades/actas',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Votaciones',
    href: '/comunidades/votaciones',
    icon: Vote,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'comunidades-votaciones-menu',
  },
  {
    name: 'Incidencias',
    href: '/comunidades/incidencias',
    icon: AlertTriangle,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'comunidades-incidencias-menu',
  },
  {
    name: 'Reuniones',
    href: '/comunidades/reuniones',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'comunidades-reuniones-menu',
  },
  {
    name: 'Cumplimiento',
    href: '/comunidades/cumplimiento',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Finanzas',
    href: '/comunidades/finanzas',
    icon: BarChart3,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Portal Presidente',
    href: '/comunidades/presidente',
    icon: Crown,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.8 STUDENT HOUSING - Residencias de estudiantes
const studentHousingNavItems = [
  {
    name: 'Dashboard',
    href: '/student-housing/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Residentes',
    href: '/student-housing/residentes',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Habitaciones',
    href: '/student-housing/habitaciones',
    icon: Home,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Aplicaciones',
    href: '/student-housing/aplicaciones',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Actividades',
    href: '/student-housing/actividades',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Pagos',
    href: '/student-housing/pagos',
    icon: CreditCard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Mantenimiento',
    href: '/student-housing/mantenimiento',
    icon: Wrench,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.9 VIAJES CORPORATIVOS - Corporate Travel Management
const viajesCorporativosNavItems = [
  {
    name: 'Dashboard',
    href: '/viajes-corporativos/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reservas',
    href: '/viajes-corporativos/bookings',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Huéspedes',
    href: '/viajes-corporativos/guests',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Informes Gastos',
    href: '/viajes-corporativos/expense-reports',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Políticas',
    href: '/viajes-corporativos/policies',
    icon: Shield,
    roles: ['super_admin', 'administrador'],
  },
];

// 2.10 VIVIENDA SOCIAL - Social Housing Management
const viviendaSocialNavItems = [
  {
    name: 'Dashboard',
    href: '/vivienda-social/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Solicitudes',
    href: '/vivienda-social/applications',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Elegibilidad',
    href: '/vivienda-social/eligibility',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Compliance',
    href: '/vivienda-social/compliance',
    icon: Shield,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Reportes',
    href: '/vivienda-social/reporting',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.11 REAL ESTATE DEVELOPER - Promotores Inmobiliarios
const realEstateDeveloperNavItems = [
  {
    name: 'Dashboard',
    href: '/real-estate-developer/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Proyectos',
    href: '/real-estate-developer/projects',
    icon: Folder,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Ventas',
    href: '/real-estate-developer/sales',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Marketing',
    href: '/real-estate-developer/marketing',
    icon: Megaphone,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Comercial',
    href: '/real-estate-developer/commercial',
    icon: Building2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.12 WORKSPACE - Gestión de Espacios de Trabajo
const workspaceNavItems = [
  {
    name: 'Dashboard',
    href: '/workspace/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Coworking',
    href: '/workspace/coworking',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reservas',
    href: '/workspace/booking',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Miembros',
    href: '/workspace/members',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 2.13 WAREHOUSE - Gestión de Almacenes
const warehouseNavItems = [
  {
    name: 'Dashboard',
    href: '/warehouse',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Inventario',
    href: '/warehouse/inventory',
    icon: Package,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Ubicaciones',
    href: '/warehouse/locations',
    icon: MapPin,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Movimientos',
    href: '/warehouse/movements',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// ============================================================================
// 3. HERRAMIENTAS HORIZONTALES - Aplicables a todas las verticales
// ============================================================================

// 3.1 FINANZAS Y CONTABILIDAD
// AMPLIADO: Incluye contabilidad, BI, estadísticas, finanzas, presupuestos
const finanzasNavItems = [
  {
    name: 'Panel Finanzas',
    href: '/finanzas',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Cuadro de Mandos',
    href: '/finanzas/cuadro-de-mandos',
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador'],
    dataTour: 'cuadro-mandos-menu',
  },
  {
    name: 'Pagos',
    href: '/pagos',
    icon: CreditCard,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'pagos-menu',
  },
  {
    name: 'Cobros SEPA',
    href: '/pagos/sepa',
    icon: Banknote,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Previsión 12 meses',
    href: '/finanzas/prevision',
    icon: BarChart3,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Informe Morosidad',
    href: '/morosidad',
    icon: AlertTriangle,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Facturas',
    href: '/facturas',
    icon: Receipt,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Liquidaciones',
    href: '/liquidaciones',
    icon: Receipt,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Fianzas',
    href: '/fianzas',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Fiscal Trimestral',
    href: '/finanzas/fiscal-trimestral',
    icon: Calculator,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Conciliación Bancaria',
    href: '/finanzas/conciliacion',
    icon: ArrowRightLeft,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Renovaciones',
    href: '/renovaciones-contratos',
    icon: FileSignature,
    roles: ['super_admin', 'administrador', 'gestor'],
    subItems: [
      { name: 'Renovar en Lote', href: '/renovaciones-contratos', icon: ClipboardList },
      { name: 'Actualización IPC', href: '/contratos/actualizacion-ipc', icon: TrendingUp },
      { name: 'Plantillas', href: '/contratos/plantillas', icon: FileText },
    ],
  },
  {
    name: 'Gastos',
    href: '/gastos',
    icon: Euro,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'gastos-menu',
  },
  {
    name: 'Intragrupo',
    href: '/contabilidad/intragrupo',
    icon: ArrowRightLeft,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Contabilidad',
    href: '/contabilidad',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'BI / Business Intelligence',
    href: '/bi',
    icon: BarChart2,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Estadísticas',
    href: '/estadisticas',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Presupuestos',
    href: '/presupuestos',
    icon: DollarSign,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Facturación',
    href: '/facturacion',
    icon: FileSpreadsheet,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Open Banking',
    href: '/open-banking',
    icon: CreditCard,
    roles: ['super_admin', 'administrador'],
  },
];

// 3.2 ANALYTICS E INTELIGENCIA
// AMPLIADO: Incluye reportes financieros, operacionales y informes
const analyticsNavItems = [
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reportes Avanzados',
    href: '/reportes/avanzados',
    icon: BarChart3,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reportes Financieros',
    href: '/reportes/financieros',
    icon: Euro,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Reportes Operacionales',
    href: '/reportes/operacionales',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Informes',
    href: '/informes',
    icon: FileText,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Asistente IA',
    href: '/asistente-ia',
    icon: Sparkles,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.3 OPERACIONES - SIMPLIFICADO (12→7 items)
// Fusión: 2x Mantenimiento→1, 2x Incidencias→1, Planificación+Calendario→1
const operacionesNavItems = [
  {
    name: 'Mantenimiento',
    href: '/mantenimiento',
    icon: Wrench,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
    dataTour: 'mantenimiento-menu',
    subItems: [
      { name: 'Solicitudes', href: '/mantenimiento', icon: Wrench },
      { name: 'Vista Kanban', href: '/mantenimiento/kanban', icon: ClipboardList },
      { name: 'Preventivo', href: '/mantenimiento-pro', icon: Calendar },
    ],
  },
  {
    name: 'Proveedores',
    href: '/proveedores',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'proveedores-menu',
  },
  {
    name: 'Incidencias',
    href: '/incidencias',
    icon: AlertCircle,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Tareas',
    href: '/tareas',
    icon: CheckSquare,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Calendario',
    href: '/calendario',
    icon: Calendar,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Visitas',
    href: '/visitas',
    icon: CalendarCheck,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Check-in/Check-out',
    href: '/check-in-out',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Limpieza',
    href: '/servicios-limpieza',
    icon: ClipboardList,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Servicios',
    href: '/dashboard/servicios',
    icon: ShoppingBag,
    roles: ['super_admin', 'administrador', 'gestor', 'inquilino', 'propietario'],
  },
  {
    name: 'Acciones Masivas',
    href: '/acciones-masivas',
    icon: Zap,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'No Disponibilidad',
    href: '/no-disponibilidad',
    icon: CalendarCheck,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.3.0 HOLDING / GRUPO SOCIETARIO
// Consolidacion de sociedades patrimoniales (Vidaro como holding de Viroda+Rovida)
const holdingGrupoNavItems = [
  {
    name: 'Dashboard Grupo',
    href: '/inversiones',
    icon: Crown,
    roles: ['super_admin', 'administrador'],
    dataTour: 'inversiones-menu',
  },
  {
    name: 'Family Office 360°',
    href: '/family-office/dashboard',
    icon: Landmark,
    roles: ['super_admin', 'administrador'],
    badge: 'Add-on',
    dataTour: 'family-office-menu',
    subItems: [
      { name: 'Patrimonio 360°', href: '/family-office/dashboard', icon: Crown },
      { name: 'Cuentas y Bancos', href: '/family-office/cuentas', icon: CreditCard },
      { name: 'Carteras P&L', href: '/family-office/cartera', icon: TrendingUp },
      { name: 'Private Equity', href: '/family-office/pe', icon: Briefcase },
      { name: 'Tesorería', href: '/family-office/tesoreria', icon: Euro },
      { name: 'Copiloto IA', href: '/asistente-ia', icon: Brain },
    ],
  },
  {
    name: 'Análisis de Activos',
    href: '/inversiones/analisis',
    icon: Calculator,
    roles: ['super_admin', 'administrador'],
    badge: 'IA',
    subItems: [
      {
        name: 'Procesar Escrituras',
        href: '/inversiones/analisis?tab=escritura',
        icon: FileSignature,
      },
      {
        name: 'Procesar Contratos',
        href: '/inversiones/analisis?tab=contratos',
        icon: FileText,
      },
      {
        name: 'Analizar Propuesta Broker',
        href: '/inversiones/analisis?tab=broker',
        icon: Shield,
      },
      {
        name: 'Chat Analista IA',
        href: '/inversiones/analisis?tab=chat',
        icon: MessageSquare,
      },
      {
        name: 'Extracción Documental',
        href: '/inversiones/analisis?tab=ia',
        icon: Scan,
      },
      {
        name: 'Rent Roll Manual',
        href: '/inversiones/analisis?tab=rentroll',
        icon: ClipboardList,
      },
    ],
  },
  {
    name: 'Valoración IA',
    href: '/valoracion-ia',
    icon: Brain,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Comparativa Sociedades',
    href: '/inversiones/comparativa',
    icon: BarChart3,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Comparativa Edificios',
    href: '/inversiones/comparativa-edificios',
    icon: Building2,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Yield Tracker',
    href: '/inversiones/yield',
    icon: Percent,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Oportunidades IA',
    href: '/inversiones/oportunidades',
    icon: Search,
    dataTour: 'oportunidades-ia-menu',
  },
  {
    name: 'Mapa Patrimonio',
    href: '/inversiones/mapa',
    icon: MapPin,
    roles: ['super_admin', 'administrador'],
    badge: 'IA',
  },
  {
    name: 'Benchmark Mercado',
    href: '/inversiones/benchmark',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Distribuciones PE',
    href: '/inversiones/distribuciones',
    icon: Euro,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Importar PE (MdF)',
    href: '/inversiones/pe-import',
    icon: Upload,
    roles: ['super_admin', 'administrador'],
    badge: 'IA',
  },
  {
    name: 'P&L Sociedades',
    href: '/inversiones/pyl-sociedades',
    icon: BarChart3,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Mapa de Cartera',
    href: '/inversiones/mapa',
    icon: MapPin,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Estructura del Grupo',
    href: '/inversiones/grupo',
    icon: Landmark,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Activos del Grupo',
    href: '/inversiones/activos',
    icon: Building2,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Hipotecas',
    href: '/inversiones/hipotecas',
    icon: Landmark,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Fiscal Grupo',
    href: '/inversiones/fiscal',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Modelos Tributarios',
    href: '/inversiones/fiscal/modelos',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Modelo 720',
    href: '/inversiones/modelo-720',
    icon: Globe,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Simulador Fiscal',
    href: '/inversiones/fiscal/simulador',
    icon: FileBarChart,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Tesorería 12m',
    href: '/inversiones/tesoreria',
    icon: Euro,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'P&L Consolidado',
    href: '/inversiones/pyl',
    icon: TrendingUp,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Fianzas',
    href: '/inversiones/fianzas',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Export Gestoria',
    href: '/inversiones/export',
    icon: FileText,
    roles: ['super_admin', 'administrador'],
  },
];

// 3.3.1 HERRAMIENTAS DE INVERSIÓN (NUEVO - Basado en ZONA3)
// Calculadoras, contratos y recursos para inversores
const herramientasInversionNavItems = [
  {
    name: 'Herramientas',
    href: '/dashboard/herramientas',
    icon: Calculator,
    roles: ['super_admin', 'administrador', 'gestor', 'propietario'],
    badge: 'Nuevo',
    subItems: [
      {
        name: 'Calculadora Rentabilidad',
        href: '/dashboard/herramientas?tool=rental-yield',
        icon: Calculator,
      },
      {
        name: 'Calculadora Hipoteca',
        href: '/dashboard/herramientas?tool=mortgage',
        icon: Building2,
      },
      {
        name: 'Gastos Compraventa',
        href: '/dashboard/herramientas?tool=transaction-costs',
        icon: DollarSign,
      },
    ],
  },
];

// 3.4 COMUNICACIONES - SIMPLIFICADO (7→4 items)
// Fusión: Todas las notificaciones en una sola entrada
const comunicacionesNavItems = [
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Notificaciones',
    href: '/notificaciones',
    icon: Bell,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'SMS',
    href: '/sms',
    icon: MessageCircle,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Social',
    href: '/dashboard/social-media',
    icon: Share2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.5 DOCUMENTOS Y LEGAL - SIMPLIFICADO (11→6 items)
// Fusión: IA+OCR→IA Documental, 2x Plantillas→1, 2x Compliance→1
const documentosLegalNavItems = [
  {
    name: 'IA Documental',
    href: '/onboarding/documents',
    icon: Bot,
    roles: ['super_admin', 'administrador', 'gestor'],
    badge: 'IA',
  },
  {
    name: 'Documentos',
    href: '/documentos',
    icon: Folder,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'documentos-menu',
  },
  {
    name: 'Plantillas',
    href: '/plantillas',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Firma Digital',
    href: '/firma-digital',
    icon: FileSignature,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Compliance',
    href: '/legal',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Contratos de Gestión',
    href: '/contratos-gestion',
    icon: FileText,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Seguros',
    href: '/seguros',
    icon: Shield,
    roles: ['super_admin', 'administrador', 'gestor'],
    subItems: [
      { name: 'Pólizas', href: '/seguros', icon: Shield },
      { name: 'Cotizaciones', href: '/seguros/cotizaciones', icon: FileText },
      { name: 'Proveedores', href: '/seguros/proveedores', icon: Building2 },
      { name: 'Análisis', href: '/seguros/analisis', icon: BarChart3 },
    ],
  },
];

// 3.6 CRM Y MARKETING - SIMPLIFICADO (14→7 items)
// Fusión: Múltiples agentes → Red Agentes, Tours+Galerías → Tours
const crmMarketingNavItems = [
  {
    name: 'CRM',
    href: '/crm',
    icon: Users,
    roles: ['super_admin', 'administrador', 'gestor'],
    dataTour: 'crm-general-menu',
  },
  {
    name: 'Portal Comercial',
    href: '/portal-comercial',
    icon: Briefcase,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Promociones',
    href: '/promociones',
    icon: Tag,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Reviews',
    href: '/reviews',
    icon: Star,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Red Agentes',
    href: '/red-agentes',
    icon: Users2,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Marketplace',
    href: '/marketplace',
    icon: ShoppingCart,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
  {
    name: 'Tours Virtuales',
    href: '/tours-virtuales',
    icon: Eye,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.7 AUTOMATIZACIÓN Y WORKFLOWS
// AMPLIADO: Incluye panel de automatización, sincronización
const automatizacionNavItems = [
  {
    name: 'Panel Automatización',
    href: '/automatizacion',
    icon: Zap,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Resumen Automatización',
    href: '/automatizacion/resumen',
    icon: BarChart2,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Workflows',
    href: '/workflows',
    icon: Zap,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Sincronización',
    href: '/sincronizacion',
    icon: Share2,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Sincronización Avanzada',
    href: '/sincronizacion-avanzada',
    icon: Share2,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Recordatorios',
    href: '/recordatorios',
    icon: Bell,
    roles: ['super_admin', 'administrador', 'gestor'],
  },
];

// 3.8 INNOVACIÓN Y SOSTENIBILIDAD
// AMPLIADO: Incluye energía, puntos carga EV, huerto urbano, instalaciones deportivas
const innovacionNavItems = [
  {
    name: 'ESG & Sostenibilidad',
    href: '/esg',
    icon: Sparkles,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Energía',
    href: '/energia',
    icon: Zap,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Energía Solar',
    href: '/energia-solar',
    icon: Zap,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Puntos de Carga EV',
    href: '/puntos-carga',
    icon: Zap,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'IoT & Smart Homes',
    href: '/iot',
    icon: Zap,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Blockchain & Tokenización',
    href: '/blockchain',
    icon: Shield,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Economía Circular',
    href: '/economia-circular',
    icon: Activity,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Huertos Urbanos',
    href: '/economia-circular/huertos',
    icon: Activity,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Gestión Residuos',
    href: '/economia-circular/residuos',
    icon: Activity,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Huerto Urbano',
    href: '/huerto-urbano',
    icon: Activity,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Instalaciones Deportivas',
    href: '/instalaciones-deportivas',
    icon: Activity,
    roles: ['super_admin', 'administrador'],
  },
];

// 3.9 SOPORTE Y AYUDA
const soporteNavItems = [
  {
    name: 'Centro de Ayuda',
    href: '/ayuda',
    icon: BookOpen,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Soporte',
    href: '/soporte',
    icon: HeadphonesIcon,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
  {
    name: 'Sugerencias',
    href: '/sugerencias',
    icon: MessageCircle,
    roles: ['super_admin', 'administrador', 'gestor', 'operador'],
  },
];

// ============================================================================
// 4. MÓDULOS ESPECÍFICOS POR ROL
// ============================================================================

// 4.1 OPERADOR DE CAMPO
const operadorNavItems = [
  {
    name: 'Dashboard Operador',
    href: '/operador/dashboard',
    icon: LayoutDashboard,
    roles: ['operador'],
  },
  {
    name: 'Órdenes del Día',
    href: '/operador/dashboard',
    icon: ClipboardList,
    roles: ['operador'],
  },
  {
    name: 'Historial de Trabajos',
    href: '/operador/work-orders/history',
    icon: Clock,
    roles: ['operador'],
  },
  {
    name: 'Historial Mantenimiento',
    href: '/operador/maintenance-history',
    icon: Wrench,
    roles: ['operador'],
  },
];

// ============================================================================
// 5. ADMINISTRACIÓN Y CONFIGURACIÓN
// ============================================================================

// 5.1 ADMINISTRADOR - GESTIÓN DE EMPRESA
// Incluye configuración, usuarios, módulos, integraciones y herramientas
const administradorEmpresaItems = [
  // === CONFIGURACIÓN BÁSICA ===
  {
    name: 'Configuración',
    href: '/admin/configuracion',
    icon: Settings,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Módulos',
    href: '/admin/modulos',
    icon: Package,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Branding',
    href: '/admin/personalizacion',
    icon: Palette,
    roles: ['administrador', 'super_admin'],
  },
  // === HERRAMIENTAS E INTEGRACIONES DE EMPRESA ===
  {
    name: 'Herramientas e Integraciones',
    href: '/admin/herramientas-empresa',
    icon: Wrench,
    roles: ['administrador', 'super_admin'],
    subItems: [
      { name: 'Mis Integraciones', href: '/admin/herramientas-empresa?tab=propias', icon: Wrench },
      {
        name: 'Servicios Inmova',
        href: '/admin/herramientas-empresa?tab=compartidas',
        icon: Share2,
      },
    ],
  },
  // === HERRAMIENTAS ===
  {
    name: 'Aprobaciones',
    href: '/admin/aprobaciones',
    icon: CheckSquare,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'Importar Datos',
    href: '/admin/importar',
    icon: Upload,
    roles: ['administrador', 'super_admin'],
  },
  {
    name: 'OCR Import',
    href: '/admin/ocr-import',
    icon: Scan,
    roles: ['administrador', 'super_admin'],
  },
  // === GESTIÓN FISCAL ===
  {
    name: 'Campos Personalizados',
    href: '/admin/campos-personalizados',
    icon: Settings,
    roles: ['super_admin'],
  },
  {
    name: 'Plantillas Comunicación',
    href: '/admin/plantillas-comunicacion',
    icon: MessageSquare,
    roles: ['super_admin', 'administrador'],
  },
  {
    name: 'Webhook Logs',
    href: '/admin/webhook-logs',
    icon: Activity,
    roles: ['super_admin'],
  },
  {
    name: 'Impuestos',
    href: '/admin/impuestos',
    icon: Euro,
    roles: ['administrador', 'super_admin'],
    badge: '💰',
    subItems: [
      { name: 'Resumen Fiscal', href: '/admin/impuestos', icon: FileBarChart },
      { name: 'Obligaciones', href: '/admin/impuestos?tab=obligaciones', icon: FileText },
      { name: 'IBI Inmuebles', href: '/admin/impuestos?tab=inmuebles', icon: Home },
      { name: 'Calendario', href: '/admin/impuestos?tab=calendario', icon: Calendar },
      { name: 'Calculadora', href: '/admin/impuestos?tab=modelos', icon: Calculator },
    ],
  },
];

// 5.2 SUPER ADMIN - GESTIÓN DE PLATAFORMA
// ESTRUCTURA REORGANIZADA:
// 1. NEGOCIO: Dashboard, Clientes B2B (+ Config empresa seleccionada), Billing, Partners, Legal
// 2. MONITOREO: Actividad, Alertas, Salud, Métricas, Reportes, Seguridad+Backup+Usuarios
// 3. INTEGRACIONES DE INMOVA: Servicios Conectados (Stripe, AWS, etc.), API Docs
// 4. COMUNICACIONES: Plantillas SMS, Plantillas Email

// =====================================================
// SUPER ADMIN - GESTIÓN DE LA PLATAFORMA INMOVA
// =====================================================
// Organización MEJORADA (Auditoría Ene 2026):
// 1. OVERVIEW: Dashboard con acciones rápidas
// 2. CLIENTES: Gestión, Onboarding, Comparador
// 3. FACTURACIÓN: Planes, Add-ons, B2B, Cupones
// 4. ECOSYSTEM: Partners, Marketplace, Integraciones
// 5. MONITOREO: Actividad, Salud, Alertas, Logs
// 6. SEGURIDAD: Alertas, Usuarios, Backup, Auditoría
// 7. CONFIGURACIÓN: Módulos, White-label, Portales
// 8. COMUNICACIONES: Email, SMS, Notificaciones Masivas
// 9. HERRAMIENTAS: Import, OCR, Firma, Legal, Limpieza
// 10. SOPORTE: Sugerencias, Aprobaciones

// ============================================================================
// SIDEBAR SUPER ADMIN - ESTRUCTURA SIMPLIFICADA (Ene 2026)
// ============================================================================
// Fusiones realizadas para mejorar UX:
// - Partners + Ventas → "Comercial B2B"
// - Monitoreo + Seguridad → "Sistema"
// - Integraciones + API Docs → "Integraciones"
// - IA simplificada (menos submenús)
// ============================================================================
const superAdminPlatformItems: SidebarItem[] = [
  // ========== 1. DASHBOARD ==========
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin'],
  },

  // ========== 2. CLIENTES (Gestión de Empresas B2B) ==========
  {
    name: 'Clientes',
    href: '/admin/clientes',
    icon: Building2,
    roles: ['super_admin'],
    subItems: [
      { name: 'Empresas', href: '/admin/clientes', icon: Building2 },
      { name: 'Comparar', href: '/admin/clientes/comparar', icon: BarChart2 },
      { name: 'Onboarding', href: '/admin/onboarding', icon: UserPlus },
    ],
  },

  // ========== 3. FACTURACIÓN ==========
  {
    name: 'Facturación',
    href: '/admin/planes',
    icon: DollarSign,
    roles: ['super_admin'],
    subItems: [
      { name: 'Planes', href: '/admin/planes', icon: Package },
      { name: 'Add-ons', href: '/admin/addons', icon: Zap },
      { name: 'B2B', href: '/admin/facturacion-b2b', icon: FileText },
      { name: 'Cupones', href: '/admin/cupones', icon: Tag },
    ],
  },

  // ========== 4. COMERCIAL B2B (FUSIÓN: Partners + Ventas) ==========
  {
    name: 'Comercial B2B',
    href: '/admin/partners',
    icon: TrendingUp,
    roles: ['super_admin'],
    subItems: [
      { name: 'Partners', href: '/admin/partners', icon: Share2 },
      { name: 'Equipo Ventas', href: '/admin/sales-team', icon: Users },
      { name: 'Red Agentes', href: '/red-agentes', icon: Users2 },
      { name: 'Comisiones', href: '/admin/partners/comisiones', icon: DollarSign },
      { name: 'Invitaciones', href: '/admin/partners/invitaciones', icon: UserPlus },
    ],
  },

  // ========== 5. MARKETPLACE ==========
  {
    name: 'Marketplace',
    href: '/admin/marketplace',
    icon: ShoppingBag,
    roles: ['super_admin'],
    subItems: [
      { name: 'Proveedores', href: '/admin/marketplace/proveedores', icon: Users },
      { name: 'Servicios', href: '/admin/marketplace', icon: ShoppingCart },
      { name: 'Categorías', href: '/admin/marketplace/categorias', icon: Folder },
    ],
  },

  // ========== 6. INTEGRACIONES (FUSIÓN: Integraciones + API Docs) ==========
  {
    name: 'Integraciones',
    href: '/admin/integraciones',
    icon: Code,
    roles: ['super_admin'],
    subItems: [
      { name: 'Todas', href: '/admin/integraciones', icon: Code },
      { name: 'API Docs', href: '/api-docs', icon: BookOpen },
      { name: 'Webhooks', href: '/admin/webhooks', icon: Zap },
    ],
  },

  // ========== 7. SISTEMA (FUSIÓN: Monitoreo + Seguridad) ==========
  {
    name: 'Sistema',
    href: '/admin/activity',
    icon: Activity,
    roles: ['super_admin'],
    subItems: [
      { name: 'Actividad', href: '/admin/activity', icon: Activity },
      { name: 'Salud', href: '/admin/salud-sistema', icon: CheckSquare },
      { name: 'Alertas', href: '/admin/alertas', icon: Bell },
      { name: 'Seguridad', href: '/admin/seguridad', icon: Shield },
      { name: 'Logs', href: '/admin/system-logs', icon: FileText },
      { name: 'Backup', href: '/admin/backup-restore', icon: Upload },
    ],
  },

  // ========== 8. CONFIGURACIÓN ==========
  {
    name: 'Configuración',
    href: '/admin/modulos',
    icon: Settings,
    roles: ['super_admin'],
    subItems: [
      { name: 'Módulos', href: '/admin/modulos', icon: Package },
      { name: 'Personalización', href: '/admin/personalizacion', icon: Palette },
      { name: 'Mantenimiento', href: '/admin/limpieza', icon: Wrench },
    ],
  },

  // ========== 9. COMUNICACIONES ==========
  {
    name: 'Comunicaciones',
    href: '/admin/plantillas-email',
    icon: MessageSquare,
    roles: ['super_admin'],
    subItems: [
      { name: 'Email', href: '/admin/plantillas-email', icon: FileText },
      { name: 'SMS', href: '/admin/plantillas-sms', icon: MessageCircle },
      { name: 'Masivas', href: '/admin/notificaciones-masivas', icon: Bell },
      { name: 'Reportes', href: '/admin/reportes-programados', icon: FileBarChart },
    ],
  },

  // ========== 10. INTELIGENCIA ARTIFICIAL (SIMPLIFICADA) ==========
  {
    name: 'IA',
    href: '/admin/ai-agents',
    icon: Bot,
    roles: ['super_admin'],
    badge: 'IA',
    subItems: [
      { name: 'Agentes IA', href: '/admin/ai-agents', icon: Bot },
      { name: 'Community Manager', href: '/admin/community-manager', icon: Users2 },
      { name: 'Canva Studio', href: '/admin/canva', icon: Palette },
    ],
  },

  // ========== 11. SOPORTE ==========
  {
    name: 'Soporte',
    href: '/admin/sugerencias',
    icon: HeadphonesIcon,
    roles: ['super_admin'],
    subItems: [
      { name: 'Sugerencias', href: '/admin/sugerencias', icon: MessageSquare },
      { name: 'Aprobaciones', href: '/admin/aprobaciones', icon: CheckSquare },
    ],
  },
];

export {
  ROUTE_TO_MODULE,
  CORE_MODULES,
  SECTION_TO_MODULES,
  dashboardNavItems,
  alquilerResidencialItems,
  strNavItems,
  coLivingNavItems,
  buildToRentNavItems,
  flippingNavItems,
  construccionNavItems,
  ewoorkerNavItems,
  comercialNavItems,
  alquilerComercialNavItems,
  patrimonioTerciarioNavItems,
  espaciosFlexiblesNavItems,
  hospitalityNavItems,
  adminFincasItems,
  studentHousingNavItems,
  viajesCorporativosNavItems,
  viviendaSocialNavItems,
  realEstateDeveloperNavItems,
  workspaceNavItems,
  warehouseNavItems,
  holdingGrupoNavItems,
  finanzasNavItems,
  analyticsNavItems,
  operacionesNavItems,
  herramientasInversionNavItems,
  comunicacionesNavItems,
  documentosLegalNavItems,
  crmMarketingNavItems,
  automatizacionNavItems,
  innovacionNavItems,
  soporteNavItems,
  operadorNavItems,
  administradorEmpresaItems,
  superAdminPlatformItems,
};
