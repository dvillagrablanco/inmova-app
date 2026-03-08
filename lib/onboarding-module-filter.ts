/**
 * FILTRO DE ONBOARDING POR MÓDULOS ACTIVOS
 * Filtra tours, steps y tareas de onboarding según los módulos
 * que el usuario tiene activados en su configuración.
 */

import type { Step } from 'react-joyride';

// Mapeo de data-tour targets a módulos del sistema
// Si un step apunta a un data-tour de un módulo desactivado, se oculta
const TOUR_TARGET_TO_MODULE: Record<string, string[]> = {
  // Alquiler Residencial
  'propiedades-menu': ['alquiler_residencial', 'propiedades'],
  'edificios-menu': ['alquiler_residencial', 'propiedades'],
  'inquilinos-menu': ['alquiler_residencial', 'inquilinos'],
  'contratos-menu': ['alquiler_residencial', 'contratos'],
  'valoraciones-menu': ['alquiler_residencial', 'valoracion_ia'],
  'seguros-menu': ['alquiler_residencial', 'seguros'],
  'inspecciones-menu': ['alquiler_residencial', 'inspecciones'],
  // STR
  'str-dashboard-menu': ['str'],
  'str-listings-menu': ['str'],
  'str-bookings-menu': ['str'],
  'str-channels-menu': ['str'],
  'str-housekeeping-menu': ['str', 'housekeeping'],
  'str-reviews-menu': ['str'],
  // Coliving / Room Rental
  'room-rental-menu': ['coliving', 'room_rental'],
  'coliving-propiedades-menu': ['coliving'],
  'comunidad-social-menu': ['coliving', 'comunidad_social'],
  'coliving-matching-menu': ['coliving'],
  'coliving-eventos-menu': ['coliving'],
  'espacios-comunes-menu': ['coliving', 'espacios_comunes'],
  // Flipping
  'flipping-dashboard-menu': ['flipping'],
  'flipping-projects-menu': ['flipping'],
  // Construcción
  'construction-dashboard-menu': ['construccion'],
  'construction-projects-menu': ['construccion'],
  // Servicios Profesionales
  'professional-projects-menu': ['servicios_profesionales', 'professional'],
  'crm-menu': ['servicios_profesionales', 'crm'],
  'facturacion-menu': ['servicios_profesionales', 'facturacion'],
  // Comunidades / Admin Fincas
  'comunidades-dashboard-menu': ['comunidades', 'admin_fincas'],
  'comunidades-lista-menu': ['comunidades', 'admin_fincas'],
  'comunidades-propietarios-menu': ['comunidades', 'admin_fincas'],
  'comunidades-cuotas-menu': ['comunidades', 'admin_fincas'],
  'comunidades-votaciones-menu': ['comunidades', 'admin_fincas'],
  'comunidades-incidencias-menu': ['comunidades', 'admin_fincas'],
  'comunidades-reuniones-menu': ['comunidades', 'admin_fincas'],
  // Finanzas
  'cuadro-mandos-menu': ['finanzas', 'cuadro_mandos'],
  'pagos-menu': ['finanzas', 'pagos'],
  'gastos-menu': ['finanzas', 'gastos'],
  // Operaciones
  'mantenimiento-menu': ['operaciones', 'mantenimiento'],
  'proveedores-menu': ['operaciones', 'proveedores'],
  // Documentos / CRM
  'documentos-menu': ['documentos'],
  'crm-general-menu': ['crm', 'crm_marketing'],
  // Holding / Family Office
  'inversiones-menu': ['holding_grupo', 'inversiones'],
  'family-office-menu': ['holding_grupo', 'family_office'],
  // Dashboard (always visible)
  'dashboard-link': [],
  'kpi-cards': [],
  'charts': [],
  'quick-actions': [],
  'alerts': [],
  'configuracion-link': [],
};

// Mapeo de rutas de setupActions a módulos
const ROUTE_TO_MODULE_MAP: Record<string, string[]> = {
  '/edificios': ['alquiler_residencial', 'propiedades'],
  '/unidades': ['alquiler_residencial', 'propiedades'],
  '/inquilinos': ['alquiler_residencial', 'inquilinos'],
  '/contratos': ['alquiler_residencial', 'contratos'],
  '/pagos': ['finanzas', 'pagos'],
  '/room-rental': ['coliving', 'room_rental'],
  '/coliving': ['coliving'],
  '/str': ['str'],
  '/flipping': ['flipping'],
  '/construccion': ['construccion'],
  '/construction': ['construccion'],
  '/professional': ['servicios_profesionales'],
  '/comunidades': ['comunidades', 'admin_fincas'],
  '/comunidad': ['comunidades', 'admin_fincas'],
  '/reuniones': ['comunidades', 'admin_fincas'],
  '/votaciones': ['comunidades', 'admin_fincas'],
  '/mantenimiento': ['operaciones', 'mantenimiento'],
  '/proveedores': ['operaciones', 'proveedores'],
  '/documentos': ['documentos'],
  '/crm': ['crm', 'crm_marketing'],
  '/inversiones': ['holding_grupo', 'inversiones'],
  '/family-office': ['holding_grupo', 'family_office'],
  '/finanzas': ['finanzas'],
  '/contabilidad': ['finanzas', 'contabilidad'],
  '/reservas': ['coliving', 'espacios_comunes'],
  '/valoracion-ia': ['alquiler_residencial', 'valoracion_ia'],
  '/seguros': ['alquiler_residencial', 'seguros'],
  '/inspecciones': ['alquiler_residencial', 'inspecciones'],
  '/gastos': ['finanzas', 'gastos'],
  '/configuracion': [],
  '/dashboard': [],
  '/onboarding': [],
};

/**
 * Verifica si un módulo está activo para el usuario.
 * Si activeModules está vacío o undefined, se asume que todos están activos.
 */
function isModuleActive(requiredModules: string[], activeModules?: string[] | null): boolean {
  // Si no hay filtro de módulos activos, mostrar todo
  if (!activeModules || activeModules.length === 0) return true;
  
  // Si el target no requiere ningún módulo, siempre mostrar
  if (requiredModules.length === 0) return true;
  
  // Comprobar si al menos uno de los módulos requeridos está activo
  return requiredModules.some(mod => activeModules.includes(mod));
}

/**
 * Filtra steps de react-joyride según módulos activos.
 * Extrae el data-tour del target selector para determinar el módulo.
 */
export function filterJoyrideStepsByModules(
  steps: Step[],
  activeModules?: string[] | null
): Step[] {
  if (!activeModules || activeModules.length === 0) return steps;
  
  return steps.filter(step => {
    const target = typeof step.target === 'string' ? step.target : '';
    
    // Steps con target 'body' siempre se muestran (welcome/completion)
    if (target === 'body') return true;
    
    // Extraer data-tour value del selector
    const match = target.match(/data-tour="([^"]+)"/);
    if (!match) return true; // Si no tiene data-tour, mostrar
    
    const tourKey = match[1];
    const requiredModules = TOUR_TARGET_TO_MODULE[tourKey] || [];
    
    return isModuleActive(requiredModules, activeModules);
  });
}

/**
 * Filtra setupActions de tours por vertical según módulos activos.
 */
export function filterSetupActionsByModules<T extends { route: string }>(
  actions: T[],
  activeModules?: string[] | null
): T[] {
  if (!activeModules || activeModules.length === 0) return actions;
  
  return actions.filter(action => {
    const route = action.route;
    
    // Encontrar el módulo más específico para esta ruta
    const matchingRoute = Object.keys(ROUTE_TO_MODULE_MAP)
      .sort((a, b) => b.length - a.length) // Más específico primero
      .find(r => route.startsWith(r));
    
    if (!matchingRoute) return true; // Si no hay mapeo, mostrar
    
    const requiredModules = ROUTE_TO_MODULE_MAP[matchingRoute];
    return isModuleActive(requiredModules, activeModules);
  });
}

/**
 * Filtra tareas de onboarding del servicio según módulos activos.
 */
export function filterOnboardingTasksByModules<T extends { route?: string | null; taskId: string }>(
  tasks: T[],
  activeModules?: string[] | null
): T[] {
  if (!activeModules || activeModules.length === 0) return tasks;
  
  // Tareas que siempre se muestran
  const alwaysShow = ['welcome', 'explore_dashboard', 'complete_celebration'];
  
  return tasks.filter(task => {
    if (alwaysShow.includes(task.taskId)) return true;
    if (!task.route) return true;
    
    const matchingRoute = Object.keys(ROUTE_TO_MODULE_MAP)
      .sort((a, b) => b.length - a.length)
      .find(r => task.route!.startsWith(r));
    
    if (!matchingRoute) return true;
    
    const requiredModules = ROUTE_TO_MODULE_MAP[matchingRoute];
    return isModuleActive(requiredModules, activeModules);
  });
}

/**
 * Genera contexto de módulos activos para el chatbot IA.
 * Retorna una descripción legible de los módulos disponibles para incluir en prompts.
 */
export function getActiveModulesContext(activeModules?: string[] | null): string {
  if (!activeModules || activeModules.length === 0) {
    return 'El usuario tiene acceso a todos los módulos de la plataforma.';
  }
  
  const MODULE_LABELS: Record<string, string> = {
    alquiler_residencial: 'Alquiler Residencial (propiedades, edificios, unidades)',
    str: 'Alquiler Vacacional / STR (channel manager, reservas, pricing)',
    coliving: 'Coliving / Habitaciones (room rental, comunidad, eventos)',
    room_rental: 'Alquiler por Habitaciones',
    flipping: 'House Flipping (proyectos, ROI, reforma)',
    construccion: 'Construcción (obras, licitaciones, Gantt)',
    servicios_profesionales: 'Servicios Profesionales (proyectos, clientes, facturación)',
    comunidades: 'Comunidades de Propietarios (juntas, votaciones, cuotas)',
    admin_fincas: 'Administración de Fincas',
    holding_grupo: 'Holding / Family Office (inversiones, PE, tesorería)',
    finanzas: 'Finanzas y Contabilidad (pagos, gastos, cuadro de mandos)',
    operaciones: 'Operaciones (mantenimiento, proveedores)',
    crm: 'CRM y Marketing',
    crm_marketing: 'CRM y Marketing',
    documentos: 'Gestión Documental',
    propiedades: 'Gestión de Propiedades',
    inquilinos: 'Gestión de Inquilinos',
    contratos: 'Gestión de Contratos',
    pagos: 'Pagos y Cobros',
    mantenimiento: 'Mantenimiento e Incidencias',
    proveedores: 'Gestión de Proveedores',
    inversiones: 'Oportunidades de Inversión',
    family_office: 'Family Office 360°',
    valoracion_ia: 'Valoración con IA',
    seguros: 'Gestión de Seguros',
    inspecciones: 'Inspecciones y Certificaciones',
    gastos: 'Control de Gastos',
    hospitality: 'Hospitality (check-in, housekeeping, servicios)',
    student_housing: 'Residencias Estudiantiles',
    media_estancia: 'Media Estancia (contratos flexibles)',
    ewoorker: 'eWoorker (marketplace de trabajadores)',
  };
  
  const labels = activeModules
    .map(mod => MODULE_LABELS[mod] || mod)
    .filter(Boolean);
  
  return `Módulos activos del usuario: ${labels.join(', ')}. Solo menciona funcionalidades de estos módulos.`;
}

/**
 * Obtiene los módulos activos del usuario desde sus preferencias.
 * Se usa desde componentes client-side.
 */
export async function fetchUserActiveModules(): Promise<string[]> {
  try {
    const response = await fetch('/api/user/active-modules');
    if (!response.ok) return [];
    const data = await response.json();
    return data.activeModules || [];
  } catch {
    return [];
  }
}
