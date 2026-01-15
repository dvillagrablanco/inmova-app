/**
 * SISTEMA DE TOURS VIRTUALES AVANZADO
 * Tours interactivos paso a paso adaptados por rol, vertical y experiencia
 */

import type { UserRole, BusinessVertical } from '@prisma/client';

export type TourStepType = 'tooltip' | 'modal' | 'spotlight' | 'video' | 'interactive';
export type TourTrigger = 'auto' | 'manual' | 'ondemand';

export interface TourStep {
  id: string;
  type: TourStepType;
  title: string;
  description: string;
  target: string; // CSS selector del elemento a destacar
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  action?: {
    label: string;
    callback?: string; // Nombre de la función a ejecutar
  };
  condition?: string; // Condición para mostrar este step
  highlightElement?: boolean;
  allowSkip?: boolean;
  showProgress?: boolean;
  videoUrl?: string;
  interactiveDemo?: string; // URL o componente de demo interactivo
}

export interface VirtualTour {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'feature' | 'advanced' | 'troubleshooting';
  trigger: TourTrigger;
  conditions: {
    roles?: UserRole[];
    verticals?: BusinessVertical[];
    experienceLevels?: string[];
    modulesRequired?: string[];
  };
  steps: TourStep[];
  estimatedDuration: number; // segundos
  priority: number; // Mayor = más importante
  repeatable: boolean; // ¿Se puede ver más de una vez?
  autoStart?: boolean; // ¿Inicia automáticamente?
}

// ===================================
// TOURS POR MÓDULO
// ===================================

export const TOUR_DASHBOARD: VirtualTour = {
  id: 'tour-dashboard',
  name: 'Dashboard Principal',
  description: 'Conoce tu panel de control',
  category: 'onboarding',
  trigger: 'auto',
  conditions: {
    experienceLevels: ['principiante', 'intermedio']
  },
  steps: [
    {
      id: 'step-welcome',
      type: 'modal',
      title: '¡Bienvenido a tu Dashboard!',
      description: 'Aquí verás todos tus KPIs y métricas importantes',
      target: 'body',
      placement: 'center',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-kpis',
      type: 'spotlight',
      title: 'KPIs Principales',
      description: 'Ingresos, ocupación y propiedades activas',
      target: '[data-tour="kpi-cards"]',
      placement: 'bottom',
      highlightElement: true,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-charts',
      type: 'spotlight',
      title: 'Gráficos de Evolución',
      description: 'Visualiza tendencias de ingresos y ocupación',
      target: '[data-tour="charts"]',
      placement: 'top',
      highlightElement: true,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-quickactions',
      type: 'tooltip',
      title: 'Acciones Rápidas',
      description: 'Crea propiedades, contratos o inquilinos desde aquí',
      target: '[data-tour="quick-actions"]',
      placement: 'left',
      action: {
        label: 'Entendido',
      },
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-alerts',
      type: 'spotlight',
      title: 'Alertas y Notificaciones',
      description: 'Pagos pendientes, contratos por vencer y más',
      target: '[data-tour="alerts"]',
      placement: 'bottom',
      highlightElement: true,
      allowSkip: true,
      showProgress: true
    }
  ],
  estimatedDuration: 90,
  priority: 100,
  repeatable: false, // CAMBIADO: No repetir automáticamente
  autoStart: true
};

export const TOUR_EDIFICIOS: VirtualTour = {
  id: 'tour-edificios',
  name: 'Gestión de Edificios',
  description: 'Crea y gestiona tus propiedades',
  category: 'onboarding',
  trigger: 'auto',
  conditions: {
    roles: ['gestor', 'administrador', 'super_admin'],
    experienceLevels: ['principiante', 'intermedio']
  },
  steps: [
    {
      id: 'step-intro',
      type: 'modal',
      title: 'Gestión de Edificios',
      description: 'Los edificios son contenedores de unidades alquilables',
      target: 'body',
      placement: 'center',
      videoUrl: '/videos/edificios-intro.mp4',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-create',
      type: 'interactive',
      title: 'Crear Edificio',
      description: 'Haz click en el botón "Nuevo Edificio" para empezar',
      target: '[data-tour="btn-create-building"]',
      placement: 'bottom',
      highlightElement: true,
      action: {
        label: 'Crear mi primer edificio',
        callback: 'openBuildingForm'
      },
      allowSkip: false,
      showProgress: true
    },
    {
      id: 'step-form',
      type: 'tooltip',
      title: 'Datos Básicos',
      description: 'Completa dirección, ciudad y código postal',
      target: '[data-tour="building-form"]',
      placement: 'right',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-save',
      type: 'tooltip',
      title: 'Guardar',
      description: 'Haz click en "Guardar" para crear el edificio',
      target: '[data-tour="btn-save"]',
      placement: 'top',
      action: {
        label: 'Entendido'
      },
      allowSkip: true,
      showProgress: true
    }
  ],
  estimatedDuration: 120,
  priority: 90,
  repeatable: true,
  autoStart: false
};

export const TOUR_UNIDADES: VirtualTour = {
  id: 'tour-unidades',
  name: 'Gestión de Unidades',
  description: 'Añade apartamentos, locales o habitaciones',
  category: 'onboarding',
  trigger: 'auto',
  conditions: {
    roles: ['gestor', 'administrador', 'super_admin'],
    experienceLevels: ['principiante', 'intermedio'],
    modulesRequired: ['edificios']
  },
  steps: [
    {
      id: 'step-intro',
      type: 'modal',
      title: 'Unidades Alquilables',
      description: 'Las unidades son los espacios que alquilas (apartamentos, locales, habitaciones)',
      target: 'body',
      placement: 'center',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-select-building',
      type: 'tooltip',
      title: 'Selecciona un Edificio',
      description: 'Elige el edificio donde añadirás la unidad',
      target: '[data-tour="building-selector"]',
      placement: 'bottom',
      highlightElement: true,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-unit-details',
      type: 'tooltip',
      title: 'Detalles de la Unidad',
      description: 'Define habitaciones, baños, metros cuadrados y precio',
      target: '[data-tour="unit-form"]',
      placement: 'right',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-photos',
      type: 'tooltip',
      title: 'Fotos (Opcional)',
      description: 'Añade fotos para hacerla más atractiva',
      target: '[data-tour="photo-uploader"]',
      placement: 'left',
      allowSkip: true,
      showProgress: true
    }
  ],
  estimatedDuration: 100,
  priority: 85,
  repeatable: true,
  autoStart: false
};

export const TOUR_CONTRATOS: VirtualTour = {
  id: 'tour-contratos',
  name: 'Contratos de Alquiler',
  description: 'Crea contratos profesionales en minutos',
  category: 'onboarding',
  trigger: 'auto',
  conditions: {
    roles: ['gestor', 'administrador', 'super_admin'],
    experienceLevels: ['principiante', 'intermedio'],
    modulesRequired: ['unidades', 'inquilinos']
  },
  steps: [
    {
      id: 'step-intro',
      type: 'modal',
      title: 'Contratos de Alquiler',
      description: 'Vincula inquilino, unidad y condiciones económicas',
      target: 'body',
      placement: 'center',
      videoUrl: '/videos/contratos-intro.mp4',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-template',
      type: 'spotlight',
      title: 'Plantillas',
      description: 'Usa plantillas predefinidas o crea la tuya',
      target: '[data-tour="contract-templates"]',
      placement: 'right',
      highlightElement: true,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-parties',
      type: 'tooltip',
      title: 'Partes del Contrato',
      description: 'Selecciona inquilino y unidad',
      target: '[data-tour="contract-parties"]',
      placement: 'bottom',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-terms',
      type: 'tooltip',
      title: 'Condiciones Económicas',
      description: 'Define renta, fianza y duración',
      target: '[data-tour="contract-terms"]',
      placement: 'right',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-signature',
      type: 'spotlight',
      title: 'Firma Digital',
      description: 'Envía el contrato para firma electrónica',
      target: '[data-tour="signature-button"]',
      placement: 'top',
      highlightElement: true,
      action: {
        label: 'Entendido'
      },
      allowSkip: true,
      showProgress: true
    }
  ],
  estimatedDuration: 150,
  priority: 80,
  repeatable: true,
  autoStart: false
};

export const TOUR_MANTENIMIENTO: VirtualTour = {
  id: 'tour-mantenimiento',
  name: 'Incidencias de Mantenimiento',
  description: 'Gestiona reparaciones y proveedores',
  category: 'feature',
  trigger: 'manual',
  conditions: {
    roles: ['operador', 'gestor', 'administrador'],
    experienceLevels: ['principiante', 'intermedio']
  },
  steps: [
    {
      id: 'step-intro',
      type: 'modal',
      title: 'Mantenimiento',
      description: 'Registra incidencias, asigna proveedores y haz seguimiento',
      target: 'body',
      placement: 'center',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-create',
      type: 'interactive',
      title: 'Crear Incidencia',
      description: 'Reporta una nueva incidencia',
      target: '[data-tour="btn-create-ticket"]',
      placement: 'bottom',
      highlightElement: true,
      action: {
        label: 'Crear incidencia',
        callback: 'openMaintenanceForm'
      },
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-details',
      type: 'tooltip',
      title: 'Detalles',
      description: 'Describe el problema y sube fotos',
      target: '[data-tour="ticket-form"]',
      placement: 'right',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-provider',
      type: 'tooltip',
      title: 'Asignar Proveedor',
      description: 'Selecciona un proveedor de tu lista',
      target: '[data-tour="provider-selector"]',
      placement: 'left',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-tracking',
      type: 'spotlight',
      title: 'Seguimiento',
      description: 'Visualiza el estado de todas las incidencias',
      target: '[data-tour="tickets-kanban"]',
      placement: 'top',
      highlightElement: true,
      allowSkip: true,
      showProgress: true
    }
  ],
  estimatedDuration: 110,
  priority: 70,
  repeatable: true,
  autoStart: false
};

export const TOUR_COLIVING: VirtualTour = {
  id: 'tour-coliving',
  name: 'Gestión de Coliving',
  description: 'Administra espacios compartidos y prorrateo',
  category: 'onboarding',
  trigger: 'auto',
  conditions: {
    verticals: ['coliving', 'room_rental'],
    experienceLevels: ['principiante', 'intermedio']
  },
  steps: [
    {
      id: 'step-intro',
      type: 'modal',
      title: 'Coliving & Room Rental',
      description: 'Gestión especializada para viviendas compartidas',
      target: 'body',
      placement: 'center',
      videoUrl: '/videos/coliving-intro.mp4',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-shared-home',
      type: 'spotlight',
      title: 'Vivienda Compartida',
      description: 'Define la vivienda base con zonas comunes',
      target: '[data-tour="shared-home"]',
      placement: 'right',
      highlightElement: true,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-rooms',
      type: 'tooltip',
      title: 'Habitaciones',
      description: 'Crea fichas individuales para cada habitación',
      target: '[data-tour="rooms-list"]',
      placement: 'bottom',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-proration',
      type: 'interactive',
      title: 'Prorrateo de Gastos',
      description: 'Configura cómo se reparten gastos comunes',
      target: '[data-tour="proration-config"]',
      placement: 'left',
      highlightElement: true,
      videoUrl: '/videos/prorrateo-gastos.mp4',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-rules',
      type: 'tooltip',
      title: 'Normas de Convivencia',
      description: 'Establece las reglas de la vivienda',
      target: '[data-tour="house-rules"]',
      placement: 'right',
      allowSkip: true,
      showProgress: true
    }
  ],
  estimatedDuration: 180,
  priority: 90,
  repeatable: true,
  autoStart: true
};

// ===================================
// REGISTRO DE TODOS LOS TOURS
// ===================================

export const ALL_VIRTUAL_TOURS: VirtualTour[] = [
  TOUR_DASHBOARD,
  TOUR_EDIFICIOS,
  TOUR_UNIDADES,
  TOUR_CONTRATOS,
  TOUR_MANTENIMIENTO,
  TOUR_COLIVING
];

// ===================================
// FUNCIONES DE UTILIDAD
// ===================================

/**
 * Obtiene tours relevantes para un usuario
 */
export function getToursForUser(
  role: UserRole,
  vertical: BusinessVertical,
  experienceLevel: string,
  activeModules: string[]
): VirtualTour[] {
  return ALL_VIRTUAL_TOURS.filter(tour => {
    // Filtrar por rol
    if (tour.conditions.roles && !tour.conditions.roles.includes(role)) {
      return false;
    }

    // Filtrar por vertical
    if (tour.conditions.verticals && !tour.conditions.verticals.includes(vertical)) {
      return false;
    }

    // Filtrar por experiencia
    if (tour.conditions.experienceLevels && !tour.conditions.experienceLevels.includes(experienceLevel)) {
      return false;
    }

    // Filtrar por módulos requeridos
    if (tour.conditions.modulesRequired) {
      const hasAllModules = tour.conditions.modulesRequired.every(mod => 
        activeModules.includes(mod)
      );
      if (!hasAllModules) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Obtiene el siguiente tour a mostrar
 */
export function getNextTour(
  completedTours: string[],
  role: UserRole,
  vertical: BusinessVertical,
  experienceLevel: string,
  activeModules: string[]
): VirtualTour | null {
  const relevantTours = getToursForUser(role, vertical, experienceLevel, activeModules);
  
  // Filtrar tours ya completados (si no son repetibles)
  const pendingTours = relevantTours.filter(tour => {
    if (tour.repeatable) return true;
    return !completedTours.includes(tour.id);
  });

  // Retornar el de mayor prioridad que tenga autoStart
  return pendingTours.find(tour => tour.autoStart) || null;
}

/**
 * Calcula progreso total de tours
 */
export function calculateTourProgress(
  completedTours: string[],
  totalRelevantTours: number
): number {
  if (totalRelevantTours === 0) return 100;
  return Math.round((completedTours.length / totalRelevantTours) * 100);
}
