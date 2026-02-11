/**
 * SISTEMA DE GESTIÓN DE MÓDULOS DINÁMICOS
 * Permite activar/desactivar módulos según experiencia y necesidades
 */

import type { UserRole } from '@/types/prisma-types';
import type { BusinessVertical } from '@/types/prisma-types';

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'advanced' | 'premium' | 'specialized';
  route: string;
  requiredRole?: UserRole[];
  requiredVertical?: BusinessVertical[];
  recommendedFor: {
    roles?: UserRole[];
    verticals?: BusinessVertical[];
    experienceLevels?: string[];
  };
  dependencies?: string[]; // IDs de módulos que deben estar activos
  defaultActive: {
    principiante: boolean;
    intermedio: boolean;
    avanzado: boolean;
  };
  features: string[];
  estimatedLearningTime: number; // minutos
}

// ===================================
// DEFINICIÓN DE MÓDULOS
// ===================================

export const MODULES: Record<string, Module> = {
  // MÓDULOS CORE (siempre recomendados)
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Panel de control con KPIs y métricas',
    icon: '📊',
    category: 'core',
    route: '/dashboard',
    recommendedFor: {
      experienceLevels: ['principiante', 'intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: true,
      intermedio: true,
      avanzado: true
    },
    features: ['KPIs en tiempo real', 'Gráficos de tendencias', 'Alertas'],
    estimatedLearningTime: 5
  },

  edificios: {
    id: 'edificios',
    name: 'Edificios',
    description: 'Gestión de propiedades e inmuebles',
    icon: '🏢',
    category: 'core',
    route: '/edificios',
    requiredRole: ['gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['gestor', 'administrador'],
      experienceLevels: ['principiante', 'intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: true,
      intermedio: true,
      avanzado: true
    },
    features: ['CRUD de edificios', 'Documentación', 'Fotos'],
    estimatedLearningTime: 10
  },

  unidades: {
    id: 'unidades',
    name: 'Unidades',
    description: 'Apartamentos, locales y habitaciones',
    icon: '🏠',
    category: 'core',
    route: '/unidades',
    requiredRole: ['gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['gestor', 'administrador'],
      experienceLevels: ['principiante', 'intermedio', 'avanzado']
    },
    dependencies: ['edificios'],
    defaultActive: {
      principiante: true,
      intermedio: true,
      avanzado: true
    },
    features: ['Gestión de unidades', 'Disponibilidad', 'Precios'],
    estimatedLearningTime: 8
  },

  inquilinos: {
    id: 'inquilinos',
    name: 'Inquilinos',
    description: 'Base de datos de inquilinos',
    icon: '👥',
    category: 'core',
    route: '/inquilinos',
    requiredRole: ['gestor', 'administrador', 'super_admin', 'soporte'],
    recommendedFor: {
      roles: ['gestor', 'administrador'],
      experienceLevels: ['principiante', 'intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: true,
      intermedio: true,
      avanzado: true
    },
    features: ['CRUD inquilinos', 'Historial', 'Documentos'],
    estimatedLearningTime: 7
  },

  contratos: {
    id: 'contratos',
    name: 'Contratos',
    description: 'Contratos de alquiler',
    icon: '📝',
    category: 'core',
    route: '/contratos',
    requiredRole: ['gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['gestor', 'administrador'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    dependencies: ['unidades', 'inquilinos'],
    defaultActive: {
      principiante: false, // Demasiado complejo para principiantes al inicio
      intermedio: true,
      avanzado: true
    },
    features: ['Plantillas', 'Firma digital', 'Renovaciones'],
    estimatedLearningTime: 15
  },

  // MÓDULOS AVANZADOS
  pagos: {
    id: 'pagos',
    name: 'Pagos',
    description: 'Cobros y gestión financiera',
    icon: '💳',
    category: 'advanced',
    route: '/pagos',
    requiredRole: ['gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['administrador', 'gestor'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    dependencies: ['contratos'],
    defaultActive: {
      principiante: false,
      intermedio: true,
      avanzado: true
    },
    features: ['Stripe integration', 'Recibos automáticos', 'Recordatorios'],
    estimatedLearningTime: 20
  },

  mantenimiento: {
    id: 'mantenimiento',
    name: 'Mantenimiento',
    description: 'Incidencias y proveedores',
    icon: '🛠️',
    category: 'advanced',
    route: '/mantenimiento',
    requiredRole: ['operador', 'gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['operador', 'gestor'],
      experienceLevels: ['principiante', 'intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: true,
      intermedio: true,
      avanzado: true
    },
    features: ['Tickets', 'Proveedores', 'Seguimiento'],
    estimatedLearningTime: 12
  },

  crm: {
    id: 'crm',
    name: 'CRM',
    description: 'Gestión de leads y pipeline',
    icon: '📞',
    category: 'advanced',
    route: '/crm',
    requiredRole: ['gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['gestor', 'administrador'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: false,
      avanzado: true
    },
    features: ['Leads', 'Pipeline', 'Actividades', 'Conversiones'],
    estimatedLearningTime: 25
  },

  reportes: {
    id: 'reportes',
    name: 'Reportes',
    description: 'Informes y analytics',
    icon: '📈',
    category: 'advanced',
    route: '/reportes',
    requiredRole: ['administrador', 'super_admin'],
    recommendedFor: {
      roles: ['administrador'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: true,
      avanzado: true
    },
    features: ['Reportes financieros', 'Exportación', 'Gráficos'],
    estimatedLearningTime: 15
  },

  // MÓDULOS ESPECIALIZADOS
  coliving: {
    id: 'coliving',
    name: 'Coliving',
    description: 'Gestión de espacios compartidos',
    icon: '🏚️',
    category: 'specialized',
    route: '/coliving',
    requiredVertical: ['coliving', 'room_rental'],
    recommendedFor: {
      verticals: ['coliving', 'room_rental'],
      experienceLevels: ['principiante', 'intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: true,
      intermedio: true,
      avanzado: true
    },
    features: ['Habitaciones', 'Prorrateo', 'Normas convivencia'],
    estimatedLearningTime: 20
  },

  str: {
    id: 'str',
    name: 'STR / Vacacional',
    description: 'Channel manager y pricing dinámico',
    icon: '🏝️',
    category: 'specialized',
    route: '/str',
    requiredVertical: ['str_vacacional'],
    recommendedFor: {
      verticals: ['str_vacacional'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: true,
      avanzado: true
    },
    features: ['Channel manager', 'Pricing dinámico', 'Calendarios'],
    estimatedLearningTime: 30
  },

  flipping: {
    id: 'flipping',
    name: 'House Flipping',
    description: 'Proyectos de inversión inmobiliaria',
    icon: '📈',
    category: 'specialized',
    route: '/flipping',
    requiredVertical: ['flipping'],
    recommendedFor: {
      verticals: ['flipping'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: true,
      avanzado: true
    },
    features: ['Proyectos', 'ROI', 'Timeline', 'Presupuestos'],
    estimatedLearningTime: 25
  },

  construccion: {
    id: 'construccion',
    name: 'Construcción',
    description: 'Gestión de obra nueva',
    icon: '🏗️',
    category: 'specialized',
    route: '/construccion',
    requiredVertical: ['construccion'],
    recommendedFor: {
      verticals: ['construccion'],
      experienceLevels: ['avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: false,
      avanzado: true
    },
    features: ['Permisos', 'Fases', 'Gantt', 'Agentes'],
    estimatedLearningTime: 35
  },

  comunidades: {
    id: 'comunidades',
    name: 'Comunidades',
    description: 'Administración de fincas',
    icon: '🏛️',
    category: 'specialized',
    route: '/comunidades',
    requiredVertical: ['comunidades'],
    requiredRole: ['community_manager', 'administrador', 'super_admin'],
    recommendedFor: {
      verticals: ['comunidades'],
      roles: ['community_manager'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: true,
      avanzado: true
    },
    features: ['Juntas', 'Votaciones', 'Derramas', 'Copropietarios'],
    estimatedLearningTime: 30
  },

  // MÓDULOS PREMIUM
  ia_valoracion: {
    id: 'ia_valoracion',
    name: 'IA Valoración',
    description: 'Valoración automática con IA',
    icon: '🤖',
    category: 'premium',
    route: '/ia/valoracion',
    requiredRole: ['gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['gestor', 'administrador'],
      experienceLevels: ['avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: false,
      avanzado: false // Desactivado por defecto, usuario decide
    },
    features: ['Valoración IA', 'Comparables', 'Market insights'],
    estimatedLearningTime: 20
  },

  tour_virtual: {
    id: 'tour_virtual',
    name: 'Tours Virtuales',
    description: 'Tours 360° de propiedades',
    icon: '🎥',
    category: 'premium',
    route: '/tours-virtuales',
    requiredRole: ['gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['gestor', 'administrador'],
      verticals: ['str_vacacional', 'alquiler_tradicional'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: false,
      avanzado: false
    },
    features: ['Matterport', 'Google Street View', 'Embeds'],
    estimatedLearningTime: 15
  },

  firma_digital: {
    id: 'firma_digital',
    name: 'Firma Digital',
    description: 'Firma electrónica de contratos',
    icon: '✍️',
    category: 'premium',
    route: '/firma-digital',
    requiredRole: ['gestor', 'administrador', 'super_admin'],
    recommendedFor: {
      roles: ['administrador', 'gestor'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    dependencies: ['contratos'],
    defaultActive: {
      principiante: false,
      intermedio: false,
      avanzado: true
    },
    features: ['Signaturit', 'DocuSign', 'Validez legal'],
    estimatedLearningTime: 10
  },

  automatizacion: {
    id: 'automatizacion',
    name: 'Automatización',
    description: 'Workflows y tareas automáticas',
    icon: '⚡',
    category: 'premium',
    route: '/automatizacion',
    requiredRole: ['administrador', 'super_admin'],
    recommendedFor: {
      roles: ['administrador'],
      experienceLevels: ['avanzado']
    },
    defaultActive: {
      principiante: false,
      intermedio: false,
      avanzado: false
    },
    features: ['Workflows', 'Triggers', 'Emails automáticos'],
    estimatedLearningTime: 30
  }
};

// ===================================
// FUNCIONES DE UTILIDAD
// ===================================

/**
 * Obtiene módulos recomendados para un usuario
 */
export function getRecommendedModules(
  role: UserRole,
  vertical: BusinessVertical,
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado'
): string[] {
  return Object.values(MODULES)
    .filter(module => {
      // Verificar si el rol es requerido
      if (module.requiredRole && !module.requiredRole.includes(role)) {
        return false;
      }

      // Verificar si el vertical es requerido
      if (module.requiredVertical && !module.requiredVertical.includes(vertical)) {
        return false;
      }

      // Verificar si está en recommendedFor
      const { roles, verticals, experienceLevels } = module.recommendedFor;
      
      if (roles && !roles.includes(role)) return false;
      if (verticals && !verticals.includes(vertical)) return false;
      if (experienceLevels && !experienceLevels.includes(experienceLevel)) return false;

      return true;
    })
    .map(module => module.id);
}

/**
 * Obtiene módulos activos por defecto según experiencia
 */
export function getDefaultActiveModules(
  role: UserRole,
  vertical: BusinessVertical,
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado'
): string[] {
  const recommended = getRecommendedModules(role, vertical, experienceLevel);
  
  return recommended.filter(moduleId => {
    const module = MODULES[moduleId];
    return module && module.defaultActive[experienceLevel];
  });
}

/**
 * Valida dependencias de módulos
 */
export function validateModuleDependencies(
  moduleId: string,
  activeModules: string[]
): { valid: boolean; missingDependencies?: string[] } {
  const module = MODULES[moduleId];
  
  if (!module || !module.dependencies) {
    return { valid: true };
  }

  const missingDependencies = module.dependencies.filter(
    dep => !activeModules.includes(dep)
  );

  if (missingDependencies.length > 0) {
    return { valid: false, missingDependencies };
  }

  return { valid: true };
}

/**
 * Obtiene módulos que pueden activarse
 */
export function getAvailableModules(
  role: UserRole,
  vertical: BusinessVertical,
  currentActiveModules: string[]
): Module[] {
  return Object.values(MODULES).filter(module => {
    // Verificar permisos de rol
    if (module.requiredRole && !module.requiredRole.includes(role)) {
      return false;
    }

    // Verificar vertical
    if (module.requiredVertical && !module.requiredVertical.includes(vertical)) {
      return false;
    }

    // Verificar si ya está activo
    if (currentActiveModules.includes(module.id)) {
      return false;
    }

    return true;
  });
}

/**
 * Obtiene módulos por categoría
 */
export function getModulesByCategory(category: Module['category']): Module[] {
  return Object.values(MODULES).filter(module => module.category === category);
}

/**
 * Calcula tiempo total de aprendizaje
 */
export function calculateTotalLearningTime(moduleIds: string[]): number {
  return moduleIds.reduce((total, id) => {
    const module = MODULES[id];
    return total + (module?.estimatedLearningTime || 0);
  }, 0);
}

/**
 * Obtiene sugerencias de módulos según uso
 */
export function getSuggestedModules(
  currentModules: string[],
  role: UserRole,
  vertical: BusinessVertical
): Module[] {
  // Obtener módulos disponibles
  const available = getAvailableModules(role, vertical, currentModules);
  
  // Priorizar módulos con dependencias satisfechas
  return available
    .map(module => {
      const { valid } = validateModuleDependencies(module.id, currentModules);
      return { module, valid };
    })
    .filter(item => item.valid)
    .map(item => item.module)
    .sort((a, b) => {
      // Ordenar por categoría (core > advanced > specialized > premium)
      const categoryOrder = { core: 0, advanced: 1, specialized: 2, premium: 3 };
      return categoryOrder[a.category] - categoryOrder[b.category];
    });
}
