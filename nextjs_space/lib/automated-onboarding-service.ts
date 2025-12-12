/**
 * Servicio de Onboarding Automatizado Inteligente
 * Gestiona flujos de onboarding personalizados sin intervención humana
 */

import { prisma } from './db';
import logger, { logError } from '@/lib/logger';

// Tipos de negocio soportados
export type BusinessVertical = 
  | 'residencial'
  | 'comercial'
  | 'vacacional'
  | 'coliving'
  | 'студенческое'
  | 'senior'
  | 'mixto';

// Etapas del onboarding
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  required: boolean;
  order: number;
  videoUrl?: string;
  documentationUrl?: string;
  estimatedTime?: number; // minutos
}

// Progreso del onboarding
export interface OnboardingProgress {
  userId: string;
  companyId: string;
  vertical: BusinessVertical;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  percentageComplete: number;
  steps: OnboardingStep[];
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
}

// Flujos de onboarding por vertical
const ONBOARDING_FLOWS: Record<BusinessVertical, OnboardingStep[]> = {
  residencial: [
    {
      id: 'welcome',
      title: '¡Bienvenido a INMOVA!',
      description: 'Configuraremos tu cuenta para gestión residencial',
      action: 'acknowledge',
      completed: false,
      required: true,
      order: 1,
      videoUrl: '/videos/onboarding/welcome.mp4',
      estimatedTime: 2
    },
    {
      id: 'company_setup',
      title: 'Configuración de empresa',
      description: 'Completa los datos de tu empresa',
      action: 'navigate:/admin/configuracion',
      completed: false,
      required: true,
      order: 2,
      estimatedTime: 5
    },
    {
      id: 'first_building',
      title: 'Crea tu primer edificio',
      description: 'Registra el primer inmueble que gestionas',
      action: 'navigate:/edificios/nuevo',
      completed: false,
      required: true,
      order: 3,
      videoUrl: '/videos/onboarding/create-building.mp4',
      estimatedTime: 5
    },
    {
      id: 'add_units',
      title: 'Añade unidades',
      description: 'Registra las viviendas o locales del edificio',
      action: 'navigate:/unidades/nuevo',
      completed: false,
      required: true,
      order: 4,
      estimatedTime: 10
    },
    {
      id: 'first_tenant',
      title: 'Registra un inquilino',
      description: 'Añade tu primer inquilino al sistema',
      action: 'navigate:/inquilinos/nuevo',
      completed: false,
      required: false,
      order: 5,
      estimatedTime: 5
    },
    {
      id: 'create_contract',
      title: 'Crea un contrato',
      description: 'Vincula al inquilino con una unidad',
      action: 'navigate:/contratos/nuevo',
      completed: false,
      required: false,
      order: 6,
      estimatedTime: 7
    },
    {
      id: 'explore_modules',
      title: 'Explora módulos adicionales',
      description: 'Descubre todas las funcionalidades de INMOVA',
      action: 'navigate:/admin/modulos',
      completed: false,
      required: false,
      order: 7,
      estimatedTime: 10
    },
    {
      id: 'setup_complete',
      title: '¡Configuración completada!',
      description: 'Tu cuenta está lista para usar',
      action: 'navigate:/dashboard',
      completed: false,
      required: false,
      order: 8,
      estimatedTime: 1
    }
  ],
  vacacional: [
    {
      id: 'welcome',
      title: '¡Bienvenido a INMOVA STR!',
      description: 'Configuraremos tu cuenta para alquiler vacacional',
      action: 'acknowledge',
      completed: false,
      required: true,
      order: 1,
      estimatedTime: 2
    },
    {
      id: 'company_setup',
      title: 'Configuración de empresa',
      description: 'Completa los datos de tu empresa turística',
      action: 'navigate:/admin/configuracion',
      completed: false,
      required: true,
      order: 2,
      estimatedTime: 5
    },
    {
      id: 'str_property',
      title: 'Registra tu propiedad vacacional',
      description: 'Añade tu primera propiedad turística',
      action: 'navigate:/edificios/nuevo',
      completed: false,
      required: true,
      order: 3,
      estimatedTime: 5
    },
    {
      id: 'str_listing',
      title: 'Crea tu anuncio STR',
      description: 'Configura el anuncio para plataformas turísticas',
      action: 'navigate:/str/listings',
      completed: false,
      required: true,
      order: 4,
      videoUrl: '/videos/onboarding/str-listing.mp4',
      estimatedTime: 15
    },
    {
      id: 'channel_sync',
      title: 'Conecta canales de reserva',
      description: 'Sincroniza con Airbnb, Booking.com, etc.',
      action: 'navigate:/str/channels',
      completed: false,
      required: false,
      order: 5,
      estimatedTime: 10
    },
    {
      id: 'pricing_setup',
      title: 'Configura precios dinámicos',
      description: 'Optimiza tus tarifas automáticamente',
      action: 'navigate:/str/pricing',
      completed: false,
      required: false,
      order: 6,
      estimatedTime: 10
    },
    {
      id: 'setup_complete',
      title: '¡Todo listo para recibir reservas!',
      description: 'Tu propiedad está configurada',
      action: 'navigate:/dashboard',
      completed: false,
      required: false,
      order: 7,
      estimatedTime: 1
    }
  ],
  coliving: [
    {
      id: 'welcome',
      title: '¡Bienvenido al módulo Coliving!',
      description: 'Configuraremos tu espacio de coliving',
      action: 'acknowledge',
      completed: false,
      required: true,
      order: 1,
      estimatedTime: 2
    },
    {
      id: 'company_setup',
      title: 'Configuración de empresa',
      description: 'Completa los datos de tu negocio',
      action: 'navigate:/admin/configuracion',
      completed: false,
      required: true,
      order: 2,
      estimatedTime: 5
    },
    {
      id: 'coliving_building',
      title: 'Registra tu edificio coliving',
      description: 'Añade el inmueble con espacios compartidos',
      action: 'navigate:/edificios/nuevo',
      completed: false,
      required: true,
      order: 3,
      estimatedTime: 5
    },
    {
      id: 'setup_rooms',
      title: 'Configura habitaciones',
      description: 'Crea las habitaciones individuales',
      action: 'navigate:/room-rental',
      completed: false,
      required: true,
      order: 4,
      videoUrl: '/videos/onboarding/coliving-rooms.mp4',
      estimatedTime: 15
    },
    {
      id: 'utility_proration',
      title: 'Configura prorrateo de servicios',
      description: 'Establece cómo se reparten gastos comunes',
      action: 'navigate:/room-rental/proration',
      completed: false,
      required: true,
      order: 5,
      estimatedTime: 10
    },
    {
      id: 'common_spaces',
      title: 'Añade espacios comunes',
      description: 'Registra cocina, sala, lavandería, etc.',
      action: 'navigate:/espacios-comunes',
      completed: false,
      required: false,
      order: 6,
      estimatedTime: 10
    },
    {
      id: 'coliving_rules',
      title: 'Define reglas de convivencia',
      description: 'Establece normas del coliving',
      action: 'navigate:/documentos',
      completed: false,
      required: false,
      order: 7,
      estimatedTime: 15
    },
    {
      id: 'setup_complete',
      title: '¡Tu coliving está listo!',
      description: 'Empieza a gestionar tus inquilinos',
      action: 'navigate:/dashboard',
      completed: false,
      required: false,
      order: 8,
      estimatedTime: 1
    }
  ],
  comercial: [
    // Flujo simplificado para otros verticales
    {
      id: 'welcome',
      title: '¡Bienvenido a INMOVA Comercial!',
      description: 'Configuraremos tu gestión de locales comerciales',
      action: 'acknowledge',
      completed: false,
      required: true,
      order: 1,
      estimatedTime: 2
    },
    {
      id: 'setup_complete',
      title: 'Configuración inicial',
      description: 'Completa la configuración básica',
      action: 'navigate:/dashboard',
      completed: false,
      required: true,
      order: 2,
      estimatedTime: 10
    }
  ],
  студенческое: [
    {
      id: 'welcome',
      title: '¡Bienvenido a INMOVA Student!',
      description: 'Configuraremos tu residencia estudiantil',
      action: 'acknowledge',
      completed: false,
      required: true,
      order: 1,
      estimatedTime: 2
    },
    {
      id: 'setup_complete',
      title: 'Configuración inicial',
      description: 'Completa la configuración básica',
      action: 'navigate:/dashboard',
      completed: false,
      required: true,
      order: 2,
      estimatedTime: 10
    }
  ],
  senior: [
    {
      id: 'welcome',
      title: '¡Bienvenido a INMOVA Senior Living!',
      description: 'Configuraremos tu residencia para mayores',
      action: 'acknowledge',
      completed: false,
      required: true,
      order: 1,
      estimatedTime: 2
    },
    {
      id: 'setup_complete',
      title: 'Configuración inicial',
      description: 'Completa la configuración básica',
      action: 'navigate:/dashboard',
      completed: false,
      required: true,
      order: 2,
      estimatedTime: 10
    }
  ],
  mixto: [
    {
      id: 'welcome',
      title: '¡Bienvenido a INMOVA Multi-Vertical!',
      description: 'Configuraremos tu gestión multi-vertical',
      action: 'acknowledge',
      completed: false,
      required: true,
      order: 1,
      estimatedTime: 2
    },
    {
      id: 'setup_complete',
      title: 'Configuración inicial',
      description: 'Completa la configuración básica',
      action: 'navigate:/dashboard',
      completed: false,
      required: true,
      order: 2,
      estimatedTime: 10
    }
  ]
};

/**
 * Obtiene o crea el progreso de onboarding para un usuario
 */
export async function getOrCreateOnboardingProgress(
  userId: string,
  companyId: string,
  vertical: BusinessVertical = 'residencial'
): Promise<OnboardingProgress> {
  try {
    // TEMPORALMENTE DESHABILITADO: Tabla no existe en el esquema
    // TODO: Agregar modelo OnboardingProgress al schema.prisma
    
    // Retornar progreso por defecto
    const steps = ONBOARDING_FLOWS[vertical] || ONBOARDING_FLOWS.residencial;
    const defaultProgress: OnboardingProgress = {
      userId,
      companyId,
      vertical,
      currentStep: 0,
      totalSteps: steps.length,
      completedSteps: 0,
      percentageComplete: 0,
      steps: steps,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };
    return defaultProgress;
    
    /* CODIGO ORIGINAL COMENTADO:
    // Buscar progreso existente
    const existing = await prisma.onboardingProgress.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId
        }
      }
    });

    if (existing) {
      const steps = ONBOARDING_FLOWS[existing.vertical as BusinessVertical] || ONBOARDING_FLOWS.residencial;
      const completedSteps = (existing.completedSteps as string[]) || [];
      
      // Marcar pasos completados
      const updatedSteps = steps.map(step => ({
        ...step,
        completed: completedSteps.includes(step.id)
      }));

      const completedCount = updatedSteps.filter(s => s.completed).length;

      return {
        userId: existing.userId,
        companyId: existing.companyId,
        vertical: existing.vertical as BusinessVertical,
        currentStep: existing.currentStep,
        totalSteps: steps.length,
        completedSteps: completedCount,
        percentageComplete: Math.round((completedCount / steps.length) * 100),
        steps: updatedSteps,
        startedAt: existing.startedAt,
        lastActivityAt: existing.lastActivityAt,
        completedAt: existing.completedAt || undefined
      };
    }

    // Crear nuevo progreso
    const steps = ONBOARDING_FLOWS[vertical] || ONBOARDING_FLOWS.residencial;
    
    // Lanzar error para usar el catch block
    throw new Error('OnboardingProgress table not available');
    */ // FIN CODIGO ORIGINAL COMENTADO
    
    /*const newProgress = await prisma.onboardingProgress.create({
      data: {
        userId,
        companyId,
        vertical,
        currentStep: 0,
        totalSteps: steps.length,
        completedSteps: [],
        startedAt: new Date(),
        lastActivityAt: new Date()
      }
    });

    return {
      userId: newProgress.userId,
      companyId: newProgress.companyId,
      vertical: newProgress.vertical as BusinessVertical,
      currentStep: newProgress.currentStep,
      totalSteps: steps.length,
      completedSteps: 0,
      percentageComplete: 0,
      steps: steps,
      startedAt: newProgress.startedAt,
      lastActivityAt: newProgress.lastActivityAt
    };*/
  } catch (error) {
    // Si la tabla no existe, devolver progreso por defecto
    logger.error('Error accessing OnboardingProgress table:', error);
    const steps = ONBOARDING_FLOWS[vertical] || ONBOARDING_FLOWS.residencial;
    const now = new Date();
    
    return {
      userId,
      companyId,
      vertical,
      currentStep: 0,
      totalSteps: steps.length,
      completedSteps: 0,
      percentageComplete: 0,
      steps: steps,
      startedAt: now,
      lastActivityAt: now
    };
  }
}

/**
 * Marca un paso del onboarding como completado
 */
export async function completeOnboardingStep(
  userId: string,
  companyId: string,
  stepId: string
): Promise<OnboardingProgress> {
  // TEMPORALMENTE DESHABILITADO: Tabla no existe
  return getOrCreateOnboardingProgress(userId, companyId);
  
  /* CÓDIGO DESHABILITADO - La tabla OnboardingProgress no existe aún
  try {
    const progress = await prisma.onboardingProgress.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId
        }
      }
    });

    if (!progress) {
      throw new Error('Progreso de onboarding no encontrado');
    }

    const completedSteps = (progress.completedSteps as string[]) || [];
    
    // Si ya está completado, no hacer nada
    if (completedSteps.includes(stepId)) {
      return getOrCreateOnboardingProgress(userId, companyId, progress.vertical as BusinessVertical);
    }

    // Añadir paso completado
    const updatedCompleted = [...completedSteps, stepId];
    
    const steps = ONBOARDING_FLOWS[progress.vertical as BusinessVertical] || ONBOARDING_FLOWS.residencial;
    const currentStepIndex = steps.findIndex(s => s.id === stepId);
    
    // Verificar si el onboarding está completo
    const requiredSteps = steps.filter(s => s.required);
    const completedRequired = requiredSteps.filter(s => updatedCompleted.includes(s.id)).length;
    const isComplete = completedRequired === requiredSteps.length;

    await prisma.onboardingProgress.update({
      where: {
        userId_companyId: {
          userId,
          companyId
        }
      },
      data: {
        completedSteps: updatedCompleted,
        currentStep: currentStepIndex + 1,
        lastActivityAt: new Date(),
        completedAt: isComplete ? new Date() : null
      }
    });

    return getOrCreateOnboardingProgress(userId, companyId, progress.vertical as BusinessVertical);
  } catch (error) {
    logger.error('Error completing onboarding step:', error);
    // Si hay error, devolver progreso por defecto
    return getOrCreateOnboardingProgress(userId, companyId, 'residencial');
  }
  */
}

/**
 * Omite el onboarding completamente
 */
export async function skipOnboarding(
  userId: string,
  companyId: string
): Promise<void> {
  // TEMPORALMENTE DESHABILITADO: Tabla no existe
  return;
  
  await prisma.onboardingProgress.upsert({
    where: {
      userId_companyId: {
        userId,
        companyId
      }
    },
    create: {
      userId,
      companyId,
      vertical: 'residencial',
      currentStep: 999,
      totalSteps: 0,
      completedSteps: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      completedAt: new Date()
    },
    update: {
      completedAt: new Date(),
      lastActivityAt: new Date()
    }
  });
}

/**
 * Reinicia el onboarding para un usuario
 */
export async function restartOnboarding(
  userId: string,
  companyId: string,
  vertical?: BusinessVertical
): Promise<OnboardingProgress> {
  // TEMPORALMENTE DESHABILITADO: Tabla no existe
  return getOrCreateOnboardingProgress(userId, companyId, vertical);
  
  // Eliminar progreso existente
  await prisma.onboardingProgress.deleteMany({
    where: {
      userId,
      companyId
    }
  });

  // Crear nuevo progreso
  return getOrCreateOnboardingProgress(userId, companyId, vertical);
}

/**
 * Detecta automáticamente el vertical basándose en la actividad del usuario
 */
export async function detectBusinessVertical(
  companyId: string
): Promise<BusinessVertical> {
  // Verificar si tiene módulos STR activos
  const strModules = await prisma.companyModule.count({
    where: {
      companyId,
      moduloCodigo: {
        in: ['str_listings', 'str_bookings', 'str_channels']
      },
      activo: true
    }
  });

  if (strModules > 0) {
    return 'vacacional';
  }

  // Verificar si tiene habitaciones (coliving)
  const rooms = await prisma.room.count({
    where: {
      unit: {
        building: {
          companyId
        }
      }
    }
  });

  if (rooms > 3) {
    return 'coliving';
  }

  // Por defecto, residencial
  return 'residencial';
}
