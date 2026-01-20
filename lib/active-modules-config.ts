/**
 * CONFIGURACIÓN DE MÓDULOS ACTIVOS
 * 
 * Este archivo define qué módulos están completamente funcionales vs en desarrollo.
 * Se usa para:
 * 1. Filtrar rutas en el sidebar
 * 2. Mostrar badges de "Próximamente" en lugar de ocultar
 * 3. Controlar acceso a funcionalidades
 * 
 * STATUS:
 * - 'active': Módulo completamente funcional
 * - 'beta': Funcional pero con limitaciones
 * - 'coming_soon': Placeholder, no funcional
 * - 'hidden': No mostrar en sidebar
 */

export type ModuleStatus = 'active' | 'beta' | 'coming_soon' | 'hidden';

export interface ModuleConfig {
  status: ModuleStatus;
  name: string;
  description?: string;
  expectedDate?: string; // Fecha estimada de lanzamiento
}

/**
 * Configuración de todos los módulos del sistema
 */
export const MODULES_CONFIG: Record<string, ModuleConfig> = {
  // ============================================
  // MÓDULOS CORE - ACTIVOS
  // ============================================
  dashboard: { status: 'active', name: 'Dashboard' },
  edificios: { status: 'active', name: 'Edificios' },
  unidades: { status: 'active', name: 'Unidades' },
  inquilinos: { status: 'active', name: 'Inquilinos' },
  contratos: { status: 'active', name: 'Contratos' },
  pagos: { status: 'active', name: 'Pagos' },
  mantenimiento: { status: 'active', name: 'Mantenimiento' },
  documentos: { status: 'active', name: 'Documentos' },
  calendario: { status: 'active', name: 'Calendario' },
  chat: { status: 'active', name: 'Chat' },
  notificaciones: { status: 'active', name: 'Notificaciones' },
  
  // ============================================
  // ADMINISTRACIÓN - ACTIVOS
  // ============================================
  configuracion: { status: 'active', name: 'Configuración' },
  usuarios: { status: 'active', name: 'Usuarios' },
  admin_dashboard: { status: 'active', name: 'Dashboard Admin' },
  gestion_clientes: { status: 'active', name: 'Gestión Clientes' },
  admin_planes: { status: 'active', name: 'Planes' },
  admin_cupones: { status: 'active', name: 'Cupones' },
  
  // ============================================
  // MÓDULOS BETA - FUNCIONALES CON LIMITACIONES
  // ============================================
  analytics: { status: 'beta', name: 'Analytics' },
  bi: { status: 'beta', name: 'Business Intelligence' },
  reportes: { status: 'beta', name: 'Reportes' },
  crm: { status: 'beta', name: 'CRM' },
  leads: { status: 'beta', name: 'Leads' },
  firma_digital: { status: 'beta', name: 'Firma Digital' },
  
  // ============================================
  // STR - SHORT TERM RENTALS - ACTIVOS
  // ============================================
  str_listings: { status: 'active', name: 'Propiedades STR' },
  str_bookings: { status: 'active', name: 'Reservas STR' },
  str_channels: { status: 'beta', name: 'Canales STR' },
  str_housekeeping: { status: 'beta', name: 'Housekeeping' },
  
  // ============================================
  // COLIVING - PARCIALMENTE ACTIVO
  // ============================================
  room_rental: { status: 'active', name: 'Habitaciones' },
  coliving_propiedades: { status: 'active', name: 'Propiedades Coliving' },
  coliving_comunidad: { status: 'coming_soon', name: 'Comunidad', expectedDate: 'Q2 2026' },
  coliving_matching: { status: 'coming_soon', name: 'Matching', expectedDate: 'Q2 2026' },
  coliving_eventos: { status: 'coming_soon', name: 'Eventos', expectedDate: 'Q2 2026' },
  coliving_reservas: { status: 'coming_soon', name: 'Reservas Coliving', expectedDate: 'Q2 2026' },
  
  // ============================================
  // MÓDULOS COMING SOON - NO FUNCIONALES
  // ============================================
  
  // Partners Portal
  partners_integraciones: { status: 'coming_soon', name: 'Integraciones Partners', expectedDate: 'Q2 2026' },
  partners_soporte: { status: 'coming_soon', name: 'Soporte Partners', expectedDate: 'Q2 2026' },
  partners_marketing: { status: 'coming_soon', name: 'Marketing Partners', expectedDate: 'Q2 2026' },
  partners_analiticas: { status: 'coming_soon', name: 'Analytics Partners', expectedDate: 'Q2 2026' },
  partners_capacitacion: { status: 'coming_soon', name: 'Capacitación Partners', expectedDate: 'Q2 2026' },
  partners_recursos: { status: 'coming_soon', name: 'Recursos Partners', expectedDate: 'Q2 2026' },
  
  // Verticales Especializadas - NO IMPLEMENTADAS
  student_housing: { status: 'coming_soon', name: 'Student Housing', expectedDate: 'Q3 2026' },
  vivienda_social: { status: 'coming_soon', name: 'Vivienda Social', expectedDate: 'Q3 2026' },
  real_estate_developer: { status: 'coming_soon', name: 'Real Estate Developer', expectedDate: 'Q3 2026' },
  viajes_corporativos: { status: 'coming_soon', name: 'Viajes Corporativos', expectedDate: 'Q4 2026' },
  workspace: { status: 'coming_soon', name: 'Workspace/Coworking', expectedDate: 'Q3 2026' },
  warehouse: { status: 'coming_soon', name: 'Warehouse', expectedDate: 'Q4 2026' },
  hospitality: { status: 'coming_soon', name: 'Hospitality', expectedDate: 'Q4 2026' },
  retail: { status: 'coming_soon', name: 'Retail', expectedDate: 'Q4 2026' },
  
  // Módulos Avanzados
  tours_virtuales: { status: 'coming_soon', name: 'Tours Virtuales', expectedDate: 'Q2 2026' },
  economia_circular: { status: 'coming_soon', name: 'Economía Circular', expectedDate: 'Q3 2026' },
  valoracion_ia: { status: 'coming_soon', name: 'Valoración IA', expectedDate: 'Q2 2026' },
  blockchain: { status: 'coming_soon', name: 'Blockchain', expectedDate: 'Q4 2026' },
  iot: { status: 'coming_soon', name: 'IoT', expectedDate: 'Q4 2026' },
  esg: { status: 'coming_soon', name: 'ESG', expectedDate: 'Q3 2026' },
  
  // Herramientas
  subastas: { status: 'coming_soon', name: 'Subastas', expectedDate: 'Q3 2026' },
  licitaciones: { status: 'coming_soon', name: 'Licitaciones', expectedDate: 'Q3 2026' },
  marketplace_proveedores: { status: 'coming_soon', name: 'Marketplace Proveedores', expectedDate: 'Q2 2026' },
  
  // ============================================
  // MÓDULOS OCULTOS - NO MOSTRAR EN SIDEBAR
  // ============================================
  microtransacciones: { status: 'hidden', name: 'Microtransacciones' },
  suscripciones: { status: 'hidden', name: 'Suscripciones' },
  impuestos: { status: 'hidden', name: 'Impuestos' },
};

/**
 * Rutas que deben ocultarse del sidebar completamente
 */
export const HIDDEN_ROUTES: string[] = [
  // Verticales no implementadas
  '/student-housing',
  '/student-housing/dashboard',
  '/student-housing/residentes',
  '/student-housing/habitaciones',
  '/student-housing/aplicaciones',
  '/student-housing/actividades',
  '/student-housing/pagos',
  '/student-housing/mantenimiento',
  
  '/vivienda-social',
  '/vivienda-social/dashboard',
  '/vivienda-social/applications',
  '/vivienda-social/eligibility',
  '/vivienda-social/compliance',
  '/vivienda-social/reporting',
  
  '/real-estate-developer',
  '/real-estate-developer/dashboard',
  '/real-estate-developer/projects',
  '/real-estate-developer/sales',
  '/real-estate-developer/marketing',
  '/real-estate-developer/commercial',
  
  '/viajes-corporativos',
  '/viajes-corporativos/dashboard',
  '/viajes-corporativos/bookings',
  '/viajes-corporativos/guests',
  '/viajes-corporativos/expense-reports',
  '/viajes-corporativos/policies',
  
  '/workspace',
  '/workspace/dashboard',
  '/workspace/coworking',
  '/workspace/booking',
  '/workspace/members',
  
  '/warehouse',
  '/warehouse/inventory',
  '/warehouse/locations',
  '/warehouse/movements',
  
  '/hospitality',
  '/retail',
  
  // Herramientas no implementadas
  '/subastas',
  '/licitaciones',
  '/microtransacciones',
  '/suscripciones',
  '/impuestos',
  '/renovaciones',
  '/proyectos-renovacion',
  '/servicios-concierge',
  '/servicios-limpieza',
  '/salas-reuniones',
  '/turismo-alquiler',
  '/inspeccion-digital',
  '/warranty-management',
  '/gestion-incidencias',
  '/stock-gestion',
  '/sincronizacion-avanzada',
  '/espacios-coworking',
  '/verificacion-inquilinos',
  '/informes',
  
  // Partners Portal placeholders
  '/partners/integraciones',
  '/partners/soporte',
  '/partners/registro',
  '/partners/marketing',
  '/partners/analiticas',
  '/partners/capacitacion',
  '/partners/recursos',
  '/partners/comisiones',
  '/partners/terminos',
  
  // Portal Inquilino - AHORA FUNCIONALES (eliminadas del listado oculto)
  
  // Portal Proveedor placeholders
  '/portal-proveedor/reseñas',
  
  // Otros placeholders
  '/planificacion',
  '/automatizacion/resumen',
  '/community',
  '/permisos',
  '/estadisticas',
  '/valoracion-ia',
  '/usuarios',
  '/usuarios/nuevo',
];

/**
 * Rutas que deben mostrar badge "Beta"
 */
export const BETA_ROUTES: string[] = [
  '/analytics',
  '/bi',
  '/reportes',
  '/crm',
  '/leads',
  '/firma-digital',
  '/str/channels',
  '/str-housekeeping',
];

/**
 * Verifica si una ruta debe ocultarse
 */
export function shouldHideRoute(path: string): boolean {
  return HIDDEN_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

/**
 * Verifica si una ruta está en beta
 */
export function isRouteBeta(path: string): boolean {
  return BETA_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

/**
 * Obtiene el status de un módulo por su código
 */
export function getModuleStatus(moduleCode: string): ModuleStatus {
  return MODULES_CONFIG[moduleCode]?.status || 'coming_soon';
}

/**
 * Verifica si un módulo está activo (active o beta)
 */
export function isModuleActive(moduleCode: string): boolean {
  const status = getModuleStatus(moduleCode);
  return status === 'active' || status === 'beta';
}
