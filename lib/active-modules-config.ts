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
  matching: { status: 'active', name: 'Matching Inteligente' },
  
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
  // COLIVING - ACTIVO
  // ============================================
  room_rental: { status: 'active', name: 'Habitaciones' },
  coliving_propiedades: { status: 'active', name: 'Propiedades Coliving' },
  coliving_comunidad: { status: 'active', name: 'Comunidad' },
  coliving_matching: { status: 'active', name: 'Matching Coliving' },
  coliving_eventos: { status: 'active', name: 'Eventos' },
  coliving_reservas: { status: 'active', name: 'Reservas Coliving' },
  coliving_paquetes: { status: 'active', name: 'Paquetería' },
  
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
  
  // Verticales Especializadas - IMPLEMENTADAS
  student_housing: { status: 'active', name: 'Student Housing' },
  vivienda_social: { status: 'active', name: 'Vivienda Social' },
  real_estate_developer: { status: 'active', name: 'Real Estate Developer' },
  viajes_corporativos: { status: 'active', name: 'Viajes Corporativos' },
  workspace: { status: 'active', name: 'Workspace/Coworking' },
  
  // Verticales Especializadas - IMPLEMENTADAS
  warehouse: { status: 'active', name: 'Warehouse' },
  hospitality: { status: 'active', name: 'Hospitality' },
  retail: { status: 'active', name: 'Retail' },
  
  // Módulos Avanzados - YA DESARROLLADOS
  tours_virtuales: { status: 'beta', name: 'Tours Virtuales' },
  economia_circular: { status: 'beta', name: 'Economía Circular' },
  valoracion_ia: { status: 'active', name: 'Valoración IA' },
  blockchain: { status: 'beta', name: 'Blockchain' },
  iot: { status: 'beta', name: 'IoT' },
  esg: { status: 'beta', name: 'ESG' },
  
  // Herramientas - YA DESARROLLADAS
  licitaciones: { status: 'active', name: 'Licitaciones' },
  salas_reuniones: { status: 'active', name: 'Salas de Reuniones' },
  servicios_limpieza: { status: 'active', name: 'Servicios Limpieza' },
  gestion_incidencias: { status: 'active', name: 'Gestión Incidencias' },
  verificacion_inquilinos: { status: 'active', name: 'Verificación Inquilinos' },
  informes: { status: 'active', name: 'Informes' },
  proyectos_renovacion: { status: 'active', name: 'Proyectos Renovación' },
  
  // Herramientas - IMPLEMENTADAS
  subastas: { status: 'active', name: 'Subastas' },
  servicios_concierge: { status: 'active', name: 'Servicios Concierge' },
  stock_gestion: { status: 'active', name: 'Gestión de Stock' },
  sincronizacion_avanzada: { status: 'active', name: 'Sincronización Avanzada' },
  warranty_management: { status: 'active', name: 'Gestión Garantías' },
  microtransacciones: { status: 'active', name: 'Microtransacciones' },
  marketplace_proveedores: { status: 'beta', name: 'Marketplace Proveedores' },
  
  // ============================================
  // MÓDULOS OCULTOS - NO MOSTRAR EN SIDEBAR
  // ============================================
  suscripciones: { status: 'hidden', name: 'Suscripciones' },
  impuestos: { status: 'hidden', name: 'Impuestos' },
};

/**
 * Rutas que deben ocultarse del sidebar completamente
 * SOLO incluir páginas que son verdaderos placeholders (ComingSoonPage)
 */
export const HIDDEN_ROUTES: string[] = [
  // Herramientas placeholder (ComingSoonPage) - muy bajo prioridad
  '/suscripciones',
  '/comunidad', // placeholder general, no coliving
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
  '/tours-virtuales',
  '/economia-circular',
  '/blockchain',
  '/iot',
  '/esg',
  '/marketplace/proveedores',
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
