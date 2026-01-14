/**
 * UI MODE SERVICE - Sistema de Modos Adaptativos de Interfaz
 *
 * Este servicio gestiona la adaptación de la interfaz según:
 * - experienceLevel: principiante, intermedio, avanzado
 * - techSavviness: bajo, medio, alto
 * - portfolioSize: size_1_5, size_6_20, size_21_100, size_100_plus
 * - uiMode: simple, standard, advanced
 */

import { ExperienceLevel, TechSavviness, PortfolioSize, UIMode } from '@prisma/client';

export interface UserProfile {
  experienceLevel?: ExperienceLevel;
  techSavviness?: TechSavviness;
  portfolioSize?: PortfolioSize;
  uiMode: UIMode;
  preferredModules?: string[];
  hiddenModules?: string[];
}

export interface ModuleVisibility {
  id: string;
  name: string;
  visible: boolean;
  featured?: boolean;
  reason?: string;
}

/**
 * Módulos disponibles por vertical de negocio
 */
export const MODULES_BY_VERTICAL = {
  // Perfil completo para administradores
  admin_complete: [
    { id: 'dashboard', name: 'Dashboard', priority: 0, complexity: 'low' },
    { id: 'admin', name: 'Panel Admin', priority: 1, complexity: 'high' },
    { id: 'edificios', name: 'Propiedades', priority: 2, complexity: 'low' },
    { id: 'contratos', name: 'Contratos', priority: 3, complexity: 'medium' },
    { id: 'inquilinos', name: 'Inquilinos', priority: 4, complexity: 'low' },
    { id: 'pagos', name: 'Pagos', priority: 5, complexity: 'medium' },
    { id: 'mantenimiento', name: 'Mantenimiento', priority: 6, complexity: 'medium' },
    { id: 'crm', name: 'CRM & Leads', priority: 7, complexity: 'medium' },
    { id: 'coliving', name: 'Coliving', priority: 8, complexity: 'high' },
    { id: 'str', name: 'Alquiler Vacacional', priority: 9, complexity: 'high' },
    { id: 'flipping', name: 'Inversiones', priority: 10, complexity: 'high' },
    { id: 'partners', name: 'Partners', priority: 11, complexity: 'medium' },
    { id: 'documentos', name: 'Documentos', priority: 12, complexity: 'low' },
    { id: 'reportes', name: 'Reportes', priority: 13, complexity: 'medium' },
    { id: 'usuarios', name: 'Usuarios', priority: 14, complexity: 'high' },
    { id: 'configuracion', name: 'Configuración', priority: 99, complexity: 'high' },
  ],

  alquiler_tradicional: [
    { id: 'dashboard', name: 'Dashboard', priority: 0, complexity: 'low' },
    { id: 'edificios', name: 'Propiedades', priority: 1, complexity: 'low' },
    { id: 'contratos', name: 'Contratos', priority: 2, complexity: 'medium' },
    { id: 'inquilinos', name: 'Inquilinos', priority: 3, complexity: 'low' },
    { id: 'pagos', name: 'Pagos', priority: 4, complexity: 'medium' },
    { id: 'mantenimiento', name: 'Mantenimiento', priority: 5, complexity: 'medium' },
    { id: 'analytics', name: 'Analytics', priority: 6, complexity: 'high' },
    { id: 'documentos', name: 'Documentos', priority: 7, complexity: 'low' },
    { id: 'integrations', name: 'Integraciones', priority: 9, complexity: 'medium' },
    { id: 'tools', name: 'Herramientas', priority: 10, complexity: 'low' },
    { id: 'admin/ai-agents', name: 'Agentes IA', priority: 11, complexity: 'high' },
  ],

  room_rental: [
    { id: 'dashboard', name: 'Dashboard', priority: 0, complexity: 'low' },
    { id: 'edificios', name: 'Propiedades', priority: 1, complexity: 'low' },
    { id: 'room-rental', name: 'Habitaciones', priority: 2, complexity: 'medium' },
    { id: 'inquilinos', name: 'Inquilinos', priority: 3, complexity: 'low' },
    { id: 'proration', name: 'Prorrateo', priority: 4, complexity: 'high' },
    { id: 'limpieza', name: 'Limpieza', priority: 5, complexity: 'medium' },
    { id: 'pagos', name: 'Pagos', priority: 6, complexity: 'medium' },
    { id: 'normas', name: 'Normas Coliving', priority: 7, complexity: 'medium' },
    { id: 'analytics', name: 'Analytics', priority: 8, complexity: 'high' },
  ],

  str: [
    { id: 'dashboard', name: 'Dashboard', priority: 0, complexity: 'low' },
    { id: 'str', name: 'Channel Manager', priority: 1, complexity: 'high' },
    { id: 'edificios', name: 'Propiedades', priority: 2, complexity: 'low' },
    { id: 'reservas', name: 'Reservas', priority: 3, complexity: 'medium' },
    { id: 'pricing', name: 'Precios Dinámicos', priority: 4, complexity: 'high' },
    { id: 'limpieza', name: 'Housekeeping', priority: 5, complexity: 'medium' },
    { id: 'analytics', name: 'Analytics STR', priority: 6, complexity: 'high' },
    { id: 'reviews', name: 'Reseñas', priority: 7, complexity: 'low' },
  ],

  flipping: [
    { id: 'dashboard', name: 'Dashboard', priority: 0, complexity: 'low' },
    { id: 'flipping', name: 'Proyectos', priority: 1, complexity: 'high' },
    { id: 'edificios', name: 'Propiedades', priority: 2, complexity: 'low' },
    { id: 'presupuesto', name: 'Presupuestos', priority: 3, complexity: 'high' },
    { id: 'contratistas', name: 'Contratistas', priority: 4, complexity: 'medium' },
    { id: 'timeline', name: 'Timeline', priority: 5, complexity: 'medium' },
    { id: 'roi-calculator', name: 'Calculadora ROI', priority: 6, complexity: 'high' },
    { id: 'analytics', name: 'Analytics', priority: 7, complexity: 'high' },
  ],

  general: [
    { id: 'dashboard', name: 'Dashboard', priority: 0, complexity: 'low' },
    { id: 'edificios', name: 'Propiedades', priority: 1, complexity: 'low' },
    { id: 'contratos', name: 'Contratos', priority: 2, complexity: 'medium' },
    { id: 'inquilinos', name: 'Inquilinos', priority: 3, complexity: 'low' },
    { id: 'pagos', name: 'Pagos', priority: 4, complexity: 'medium' },
    { id: 'mantenimiento', name: 'Mantenimiento', priority: 5, complexity: 'medium' },
    { id: 'documentos', name: 'Documentos', priority: 6, complexity: 'low' },
    { id: 'configuracion', name: 'Configuración', priority: 7, complexity: 'medium' },
  ],
};

/**
 * Determina el modo UI recomendado automáticamente según el perfil del usuario
 */
export function getRecommendedUIMode(profile: UserProfile): UIMode {
  const { experienceLevel, techSavviness, portfolioSize } = profile || {};

  // Principiantes o tech savviness bajo -> Simple
  if (experienceLevel === 'principiante' || techSavviness === 'bajo') {
    return 'simple';
  }

  // Avanzado + alto tech savviness + portfolio grande -> Advanced
  if (
    experienceLevel === 'avanzado' &&
    techSavviness === 'alto' &&
    (portfolioSize === 'size_21_100' || portfolioSize === 'size_100_plus')
  ) {
    return 'advanced';
  }

  // Por defecto -> Standard
  return 'standard';
}

/**
 * Obtiene los módulos visibles según el perfil del usuario y vertical
 */
export function getVisibleModules(
  vertical: keyof typeof MODULES_BY_VERTICAL,
  profile: UserProfile
): ModuleVisibility[] {
  const modules = MODULES_BY_VERTICAL[vertical] || MODULES_BY_VERTICAL.general;
  const { uiMode, preferredModules = [], hiddenModules = [] } = profile || {};

  // FIX: Asegurar que sean arrays para evitar 'includes is not a function' si son null
  const safePreferred = Array.isArray(preferredModules) ? preferredModules : [];
  const safeHidden = Array.isArray(hiddenModules) ? hiddenModules : [];

  return modules.map((module) => {
    // Si está explícitamente oculto por el usuario
    if (safeHidden.includes(module.id)) {
      return { ...module, visible: false, reason: 'hidden_by_user' };
    }

    // Si está explícitamente preferido por el usuario
    if (safePreferred.includes(module.id)) {
      return { ...module, visible: true, featured: true, reason: 'preferred' };
    }

    // En modo Simple: Solo mostrar módulos de baja complejidad o alta prioridad
    if (uiMode === 'simple') {
      if (module.complexity === 'low' || module.priority <= 4) {
        return { ...module, visible: true };
      }
      return { ...module, visible: false, reason: 'simple_mode' };
    }

    // En modo Standard: Mostrar todo excepto alta complejidad
    if (uiMode === 'standard') {
      if (module.complexity !== 'high' || module.priority <= 6) {
        return { ...module, visible: true };
      }
      return { ...module, visible: false, reason: 'standard_mode' };
    }

    // En modo Advanced: Mostrar todo
    return { ...module, visible: true };
  });
}

/**
 * Determina si se deben mostrar tooltips de ayuda
 */
export function shouldShowTooltips(profile: UserProfile): boolean {
  if (!profile) return false;
  const { experienceLevel, techSavviness, uiMode } = profile;

  return experienceLevel === 'principiante' || techSavviness === 'bajo' || uiMode === 'simple';
}

/**
 * Determina si se deben mostrar campos avanzados en formularios
 */
export function shouldShowAdvancedFields(profile: UserProfile): boolean {
  return profile?.uiMode === 'advanced';
}

/**
 * Obtiene el nivel de detalle para dashboards
 * - basic: Solo métricas principales
 * - standard: Métricas principales + algunos gráficos
 * - detailed: Todo el detalle, gráficos avanzados
 */
export function getDashboardDetailLevel(profile: UserProfile): 'basic' | 'standard' | 'detailed' {
  if (profile?.uiMode === 'simple') return 'basic';
  if (profile?.uiMode === 'advanced') return 'detailed';
  return 'standard';
}

/**
 * Configuración de campos de formulario según modo UI
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: string;
  required: boolean;
  visible: boolean;
  complexity: 'low' | 'medium' | 'high';
  helpText?: string;
}

/**
 * Filtra campos de formulario según el modo UI
 */
export function getVisibleFormFields(
  allFields: FormFieldConfig[],
  profile: UserProfile
): FormFieldConfig[] {
  if (profile?.uiMode === 'simple') {
    // Solo campos obligatorios y de baja complejidad
    return allFields.filter((field) => field.required || field.complexity === 'low');
  }

  if (profile?.uiMode === 'standard') {
    // Obligatorios + baja y media complejidad
    return allFields.filter((field) => field.required || field.complexity !== 'high');
  }

  // Modo Advanced: Todos los campos
  return allFields;
}

/**
 * Obtiene mensajes contextuales según el perfil
 */
export function getContextualMessage(context: string, profile: UserProfile): string | null {
  if (!shouldShowTooltips(profile)) return null;

  const messages: Record<string, string> = {
    empty_buildings: '💡 Tip: Empieza creando tu primera propiedad. Es rápido y fácil.',
    empty_contracts: '📝 Consejo: Crea un contrato para empezar a gestionar tus alquileres.',
    empty_payments: '💰 Próximo paso: Registra los pagos recibidos para tener control financiero.',
    complex_feature: '⚠️ Esta es una función avanzada. ¿Necesitas ayuda? Usa el asistente guiado.',
  };

  return messages[context] || null;
}

/**
 * Obtiene la configuración de columnas de tabla según el modo UI
 */
export interface TableColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  priority: number;
  width?: string;
}

export function getVisibleTableColumns(
  allColumns: TableColumnConfig[],
  profile: UserProfile
): TableColumnConfig[] {
  if (profile?.uiMode === 'simple') {
    // Solo las 4 columnas más importantes
    return allColumns.filter((col) => col.priority <= 4);
  }

  if (profile?.uiMode === 'standard') {
    // Top 7 columnas
    return allColumns.filter((col) => col.priority <= 7);
  }

  // Modo Advanced: Todas las columnas
  return allColumns;
}

/**
 * Obtiene sugerencias de acciones según el contexto del usuario
 */
export function getSuggestedActions(
  vertical: keyof typeof MODULES_BY_VERTICAL,
  profile: UserProfile,
  userStats: {
    buildingCount: number;
    contractCount: number;
    tenantCount: number;
  }
): Array<{ id: string; label: string; icon: string; url: string; priority: number }> {
  const actions = [];

  // Si no tiene propiedades, sugerir crear una
  if (userStats.buildingCount === 0) {
    actions.push({
      id: 'create_building',
      label: 'Crear tu primera propiedad',
      icon: 'Building2',
      url: '/edificios/nuevo?wizard=true',
      priority: 1,
    });
  }

  // Si tiene propiedades pero no contratos
  if (userStats.buildingCount > 0 && userStats.contractCount === 0) {
    actions.push({
      id: 'create_contract',
      label: 'Crear tu primer contrato',
      icon: 'FileText',
      url: '/contratos/nuevo?wizard=true',
      priority: 2,
    });
  }

  // Si tiene contratos pero no inquilinos
  if (userStats.contractCount > 0 && userStats.tenantCount === 0) {
    actions.push({
      id: 'add_tenant',
      label: 'Añadir inquilino',
      icon: 'Users',
      url: '/inquilinos/nuevo',
      priority: 3,
    });
  }

  // Acciones específicas por vertical
  if (vertical === 'str' && userStats.buildingCount > 0) {
    actions.push({
      id: 'connect_channel',
      label: 'Conectar Airbnb/Booking',
      icon: 'Link',
      url: '/str?wizard=connect',
      priority: 4,
    });
  }

  if (vertical === 'room_rental' && userStats.buildingCount > 0) {
    actions.push({
      id: 'setup_proration',
      label: 'Configurar prorrateo',
      icon: 'Calculator',
      url: '/room-rental?section=proration',
      priority: 5,
    });
  }

  return actions.sort((a, b) => a.priority - b.priority);
}
