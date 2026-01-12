/**
 * Filtrado de Sidebar por Plan de Suscripción
 * 
 * Este módulo extiende el filtrado de navegación del sidebar
 * para incluir restricciones basadas en el plan de suscripción.
 */

import {
  SubscriptionPlanId,
  MODULES_BY_PLAN,
  ROUTES_BY_MODULE,
  planAllowsRoute,
  planIncludesModule,
} from './subscription-plans-config';

// Módulos que siempre están disponibles (core)
export const ALWAYS_AVAILABLE_MODULES = [
  'dashboard',
  'configuracion',
  'perfil',
  'ayuda',
];

// Rutas que siempre están disponibles
export const ALWAYS_AVAILABLE_ROUTES = [
  '/dashboard',
  '/configuracion',
  '/perfil',
  '/ayuda',
  '/pricing',
  '/upgrade',
  '/onboarding',
  '/login',
  '/register',
  '/logout',
];

/**
 * Mapeo de rutas a módulos requeridos
 */
export const ROUTE_MODULE_REQUIREMENTS: Record<string, string[]> = {
  // Core - Siempre disponible
  '/dashboard': ['dashboard'],
  '/': ['dashboard'],
  
  // Propiedades
  '/propiedades': ['propiedades'],
  '/edificios': ['edificios'],
  '/unidades': ['unidades'],
  '/garajes-trasteros': ['unidades'],
  
  // Inquilinos y Contratos
  '/inquilinos': ['inquilinos'],
  '/contratos': ['contratos'],
  '/pagos': ['pagos'],
  
  // Documentos y Mantenimiento
  '/documentos': ['documentos'],
  '/mantenimiento': ['mantenimiento'],
  '/calendario': ['calendario'],
  
  // Financiero
  '/gastos': ['gastos'],
  '/reportes': ['reportes', 'reportes_basicos'],
  '/analytics': ['analytics'],
  '/facturacion': ['facturacion'],
  
  // CRM
  '/crm': ['crm'],
  '/visitas': ['visitas'],
  '/chat': ['chat'],
  
  // Herramientas
  '/dashboard/herramientas': ['herramientas'],
  
  // Proveedores
  '/proveedores': ['proveedores'],
  
  // STR
  '/str': ['str_basico', 'str_completo'],
  '/str/reservas': ['str_basico', 'str_completo'],
  '/housekeeping': ['str_completo'],
  
  // Coliving
  '/coliving': ['coliving_basico', 'coliving_completo'],
  '/room-rental': ['coliving_basico', 'coliving_completo'],
  
  // Comunidades
  '/comunidades': ['comunidades_basico', 'comunidades_completo'],
  '/admin-fincas': ['comunidades_completo'],
  
  // Construcción
  '/construccion': ['construccion'],
  '/ewoorker': ['construccion'],
  '/construction': ['construccion'],
  
  // Avanzados
  '/automatizaciones': ['automatizaciones'],
  '/asistente-ia': ['ia_asistente'],
  '/bi': ['bi_dashboard'],
  '/admin/webhooks': ['webhooks'],
  '/api-docs': ['api_completa'],
  '/admin/audit': ['audit_log'],
  '/admin/empresas': ['multi_empresa'],
};

/**
 * Verifica si una ruta está disponible para un plan
 */
export function isRouteAvailableForPlan(
  route: string,
  plan: SubscriptionPlanId
): boolean {
  // Rutas siempre disponibles
  if (ALWAYS_AVAILABLE_ROUTES.some(r => route.startsWith(r))) {
    return true;
  }
  
  return planAllowsRoute(plan, route);
}

/**
 * Filtra items de navegación según el plan
 */
export function filterNavItemsByPlan<T extends { href: string }>(
  items: T[],
  plan: SubscriptionPlanId
): T[] {
  return items.filter(item => isRouteAvailableForPlan(item.href, plan));
}

/**
 * Obtiene módulos no disponibles para un plan
 */
export function getUnavailableModules(plan: SubscriptionPlanId): string[] {
  const allModules = Object.keys(ROUTES_BY_MODULE);
  const availableModules = MODULES_BY_PLAN[plan];
  
  if (availableModules.includes('*')) {
    return [];
  }
  
  return allModules.filter(m => !availableModules.includes(m));
}

/**
 * Genera mensaje de upgrade para una ruta bloqueada
 */
export function getUpgradeMessageForRoute(route: string): {
  title: string;
  description: string;
  suggestedPlan: SubscriptionPlanId | null;
} {
  // Buscar qué módulo requiere esta ruta
  const requirements = ROUTE_MODULE_REQUIREMENTS[route];
  
  if (!requirements || requirements.length === 0) {
    return {
      title: 'Funcionalidad Premium',
      description: 'Esta funcionalidad no está disponible en tu plan actual.',
      suggestedPlan: null,
    };
  }
  
  const moduleId = requirements[0];
  
  // Encontrar el plan más barato que incluya este módulo
  const plans: SubscriptionPlanId[] = ['starter', 'basic', 'professional', 'business', 'enterprise'];
  
  for (const plan of plans) {
    if (planIncludesModule(plan, moduleId)) {
      const moduleName = getModuleDisplayName(moduleId);
      
      return {
        title: `${moduleName} - Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        description: `Actualiza a ${plan} para acceder a ${moduleName.toLowerCase()}.`,
        suggestedPlan: plan,
      };
    }
  }
  
  return {
    title: 'Funcionalidad Enterprise',
    description: 'Esta funcionalidad está disponible en el plan Enterprise.',
    suggestedPlan: 'enterprise',
  };
}

/**
 * Obtiene nombre de display para un módulo
 */
function getModuleDisplayName(moduleId: string): string {
  const names: Record<string, string> = {
    dashboard: 'Dashboard',
    propiedades: 'Gestión de Propiedades',
    edificios: 'Gestión de Edificios',
    unidades: 'Gestión de Unidades',
    inquilinos: 'Gestión de Inquilinos',
    contratos: 'Gestión de Contratos',
    pagos: 'Gestión de Pagos',
    documentos: 'Gestión Documental',
    mantenimiento: 'Mantenimiento',
    calendario: 'Calendario',
    gastos: 'Control de Gastos',
    reportes: 'Reportes',
    reportes_basicos: 'Reportes Básicos',
    analytics: 'Analytics',
    facturacion: 'Facturación',
    crm: 'CRM',
    visitas: 'Visitas',
    chat: 'Chat',
    herramientas: 'Herramientas de Inversión',
    proveedores: 'Gestión de Proveedores',
    str_basico: 'Alquiler Vacacional',
    str_completo: 'Alquiler Vacacional Avanzado',
    coliving_basico: 'Coliving',
    coliving_completo: 'Coliving Avanzado',
    comunidades_basico: 'Comunidades',
    comunidades_completo: 'Administración de Fincas',
    construccion: 'Construcción',
    automatizaciones: 'Automatizaciones',
    ia_asistente: 'Asistente IA',
    bi_dashboard: 'Business Intelligence',
    webhooks: 'Webhooks',
    api_completa: 'API Completa',
    audit_log: 'Auditoría',
    multi_empresa: 'Multi-Empresa',
  };
  
  return names[moduleId] || moduleId;
}

/**
 * Información de upgrade para mostrar en UI
 */
export interface UpgradePrompt {
  show: boolean;
  moduleId: string;
  moduleName: string;
  currentPlan: SubscriptionPlanId;
  requiredPlan: SubscriptionPlanId;
  priceDifference: number;
}

/**
 * Genera prompt de upgrade
 */
export function getUpgradePrompt(
  moduleId: string,
  currentPlan: SubscriptionPlanId
): UpgradePrompt | null {
  if (planIncludesModule(currentPlan, moduleId)) {
    return null; // Ya tiene acceso
  }
  
  const plans: SubscriptionPlanId[] = ['starter', 'basic', 'professional', 'business', 'enterprise'];
  const currentIndex = plans.indexOf(currentPlan);
  
  for (let i = currentIndex + 1; i < plans.length; i++) {
    const plan = plans[i];
    if (planIncludesModule(plan, moduleId)) {
      const prices: Record<SubscriptionPlanId, number> = {
        free: 0,
        starter: 19,
        basic: 39,
        professional: 79,
        business: 149,
        enterprise: 499,
      };
      
      return {
        show: true,
        moduleId,
        moduleName: getModuleDisplayName(moduleId),
        currentPlan,
        requiredPlan: plan,
        priceDifference: prices[plan] - prices[currentPlan],
      };
    }
  }
  
  return null;
}
