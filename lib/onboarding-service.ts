/**
 * SERVICIO DE ONBOARDING TASK-BASED
 * Sistema de onboarding personalizado por vertical de negocio
 */

import { prisma } from '@/lib/db';
import type { BusinessVertical, OnboardingTaskStatus, OnboardingTaskType, UserRole } from '@prisma/client';
import { sendOnboardingEmail } from '@/lib/onboarding-email-service';
import { createWebhookEvent } from '@/lib/webhook-service';
import { 
  notifyOnboardingCompleted, 
  notifyFirstBuilding, 
  notifyFirstUnit, 
  notifyFirstContract 
} from '@/lib/notification-service';
import { celebrateOnboardingCompleted } from '@/lib/celebration-service';
import { 
  filterTasksByRole, 
  adjustEstimatedTime, 
  shouldShowVideo, 
  getAdditionalTasksByRole,
  shouldAutoComplete,
  type ExperienceLevel 
} from '@/lib/onboarding-role-adapter';
import { initializeDefaultModules } from '@/lib/user-preferences-service';

import logger from '@/lib/logger';
interface OnboardingTaskDefinition {
  taskId: string;
  title: string;
  description: string;
  type: OnboardingTaskType;
  order: number;
  isMandatory: boolean;
  estimatedTime: number; // segundos
  route?: string;
  videoUrl?: string;
  helpArticle?: string;
  unlocks: string[];
}

// ===================================
// DEFINICIONES DE TAREAS POR VERTICAL
// ===================================

const ONBOARDING_ALQUILER_TRADICIONAL: OnboardingTaskDefinition[] = [
  {
    taskId: 'welcome',
    title: '👋 Bienvenido a INMOVA',
    description: 'Video de 90 segundos sobre cómo funciona la plataforma',
    type: 'video',
    order: 0,
    isMandatory: false,
    estimatedTime: 90,
    videoUrl: '/videos/onboarding/intro-90s.mp4',
    unlocks: []
  },
  {
    taskId: 'data_import_choice',
    title: '📂 ¿Tienes datos existentes?',
    description: 'Importa tus edificios desde Excel o empieza desde cero',
    type: 'wizard',
    order: 1,
    isMandatory: true,
    estimatedTime: 180,
    route: '/admin/importar?wizard=true',
    helpArticle: '/docs/importar-datos',
    unlocks: ['edificios_module']
  },
  {
    taskId: 'create_first_building',
    title: '🏢 Crea tu primer edificio',
    description: 'Usa el wizard guiado para registrar tu primera propiedad',
    type: 'wizard',
    order: 2,
    isMandatory: true,
    estimatedTime: 120,
    route: '/edificios/nuevo?wizard=true',
    videoUrl: '/videos/crear-edificio.mp4',
    helpArticle: '/docs/edificios',
    unlocks: ['unidades_module', 'dashboard_building_card']
  },
  {
    taskId: 'create_first_unit',
    title: '🏠 Añade tu primera unidad',
    description: 'Crea un apartamento o local dentro del edificio',
    type: 'wizard',
    order: 3,
    isMandatory: true,
    estimatedTime: 90,
    route: '/unidades/nueva?wizard=true',
    unlocks: ['contratos_module', 'inquilinos_module']
  },
  {
    taskId: 'configure_payments',
    title: '💳 Configura cobros automáticos',
    description: 'Activa Stripe para recibir pagos online',
    type: 'wizard',
    order: 4,
    isMandatory: false,
    estimatedTime: 180,
    route: '/pagos/configurar?wizard=true',
    helpArticle: '/docs/configurar-pagos',
    unlocks: ['pagos_automaticos', 'portal_inquilino_pagos']
  },
  {
    taskId: 'explore_dashboard',
    title: '📊 Explora tu dashboard',
    description: 'Conoce los KPIs y gráficos principales',
    type: 'action',
    order: 5,
    isMandatory: false,
    estimatedTime: 60,
    route: '/dashboard',
    unlocks: []
  },
  {
    taskId: 'complete_celebration',
    title: '🎉 ¡Configuración completada!',
    description: 'Ya estás listo para gestionar tu negocio',
    type: 'action',
    order: 6,
    isMandatory: true,
    estimatedTime: 30,
    route: '/onboarding/complete',
    unlocks: ['todos_los_modulos']
  }
];

const ONBOARDING_ROOM_RENTAL: OnboardingTaskDefinition[] = [
  {
    taskId: 'welcome',
    title: '🏚️ ¡Bienvenido al módulo de Coliving!',
    description: 'Video de 90 segundos sobre alquiler por habitaciones',
    type: 'video',
    order: 0,
    isMandatory: false,
    estimatedTime: 90,
    videoUrl: '/videos/onboarding/room-rental-intro.mp4',
    unlocks: []
  },
  {
    taskId: 'create_shared_home',
    title: '🏠 Crea tu vivienda compartida',
    description: 'Define la vivienda que vas a compartir',
    type: 'wizard',
    order: 1,
    isMandatory: true,
    estimatedTime: 120,
    route: '/room-rental/nueva?wizard=true',
    helpArticle: '/docs/room-rental',
    unlocks: ['room_rental_module']
  },
  {
    taskId: 'add_rooms',
    title: '🚪 Define cada habitación',
    description: 'Crea una ficha para cada habitación con su precio',
    type: 'wizard',
    order: 2,
    isMandatory: true,
    estimatedTime: 90,
    route: '/room-rental/[unitId]/rooms/nueva',
    unlocks: ['rooms_management']
  },
  {
    taskId: 'configure_proration',
    title: '🧠 Configura prorrateo de gastos',
    description: 'Define cómo se reparten los gastos comunes',
    type: 'wizard',
    order: 3,
    isMandatory: true,
    estimatedTime: 180,
    route: '/room-rental/[unitId]/proration',
    videoUrl: '/videos/prorrateo-gastos.mp4',
    helpArticle: '/docs/prorrateo',
    unlocks: ['automatic_proration']
  },
  {
    taskId: 'set_house_rules',
    title: '📋 Normas de convivencia',
    description: 'Establece las reglas de la vivienda',
    type: 'wizard',
    order: 4,
    isMandatory: false,
    estimatedTime: 60,
    route: '/room-rental/[unitId]/rules',
    unlocks: ['house_rules']
  },
  {
    taskId: 'explore_dashboard',
    title: '📊 Ver dashboard Room Rental',
    description: 'Visualiza ocupación y gastos en tiempo real',
    type: 'action',
    order: 5,
    isMandatory: false,
    estimatedTime: 60,
    route: '/room-rental',
    unlocks: []
  },
  {
    taskId: 'complete_celebration',
    title: '✅ ¡Listo para alquilar habitaciones!',
    description: 'Tu sistema de coliving está configurado',
    type: 'action',
    order: 6,
    isMandatory: true,
    estimatedTime: 30,
    route: '/onboarding/complete',
    unlocks: ['todos_los_modulos']
  }
];

const ONBOARDING_STR: OnboardingTaskDefinition[] = [
  {
    taskId: 'welcome',
    title: '🏝️ ¡Bienvenido al Channel Manager STR!',
    description: 'Centraliza la gestión de tus alquileres vacacionales',
    type: 'video',
    order: 0,
    isMandatory: false,
    estimatedTime: 90,
    videoUrl: '/videos/onboarding/str-intro.mp4',
    unlocks: []
  },
  {
    taskId: 'connect_channels',
    title: '🌐 Conecta tus canales',
    description: 'Sincroniza tus cuentas de Airbnb, Booking, Expedia',
    type: 'wizard',
    order: 1,
    isMandatory: true,
    estimatedTime: 240,
    route: '/str/channels?wizard=true',
    videoUrl: '/videos/conectar-channel-manager.mp4',
    helpArticle: '/docs/str-channels',
    unlocks: ['str_channel_manager']
  },
  {
    taskId: 'import_listings',
    title: '📎 Importar anuncios existentes',
    description: 'Detecta automáticamente tus anuncios actuales',
    type: 'wizard',
    order: 2,
    isMandatory: true,
    estimatedTime: 180,
    route: '/str/listings?import=true',
    unlocks: ['str_listings']
  },
  {
    taskId: 'activate_dynamic_pricing',
    title: '💰 Activa precios dinámicos',
    description: 'Ajusta automáticamente tus tarifas',
    type: 'wizard',
    order: 3,
    isMandatory: false,
    estimatedTime: 120,
    route: '/str/pricing?wizard=true',
    helpArticle: '/docs/pricing-dinamico',
    unlocks: ['dynamic_pricing']
  },
  {
    taskId: 'explore_dashboard',
    title: '📊 Ver dashboard STR',
    description: 'Revisa tus métricas (RevPAR, ADR, ocupación)',
    type: 'action',
    order: 4,
    isMandatory: false,
    estimatedTime: 60,
    route: '/str',
    unlocks: []
  },
  {
    taskId: 'complete_celebration',
    title: '🚀 ¡Tu Channel Manager está activo!',
    description: 'Gestiona todas tus reservas desde un solo panel',
    type: 'action',
    order: 5,
    isMandatory: true,
    estimatedTime: 30,
    route: '/onboarding/complete',
    unlocks: ['todos_los_modulos']
  }
];

const ONBOARDING_FLIPPING: OnboardingTaskDefinition[] = [
  {
    taskId: 'welcome',
    title: '📈 ¡Bienvenido al módulo de House Flipping!',
    description: 'Gestiona proyectos de inversión inmobiliaria',
    type: 'video',
    order: 0,
    isMandatory: false,
    estimatedTime: 90,
    videoUrl: '/videos/onboarding/flipping-intro.mp4',
    unlocks: []
  },
  {
    taskId: 'create_project',
    title: '🏠 Define tu proyecto',
    description: 'Introduce precio de compra, ubicación y estado',
    type: 'wizard',
    order: 1,
    isMandatory: true,
    estimatedTime: 120,
    route: '/flipping/nuevo?wizard=true',
    helpArticle: '/docs/flipping',
    unlocks: ['flipping_module']
  },
  {
    taskId: 'calculate_budget',
    title: '🛠️ Presupuesto de reforma',
    description: 'Calcula el coste de la reforma por categorías',
    type: 'wizard',
    order: 2,
    isMandatory: true,
    estimatedTime: 180,
    route: '/flipping/[id]/presupuesto',
    videoUrl: '/videos/calcular-presupuesto-reforma.mp4',
    unlocks: ['budget_calculator']
  },
  {
    taskId: 'sale_projection',
    title: '🎯 Proyección de venta',
    description: 'Estima el precio de venta objetivo y el plazo',
    type: 'wizard',
    order: 3,
    isMandatory: true,
    estimatedTime: 90,
    route: '/flipping/[id]/venta',
    unlocks: ['roi_calculator']
  },
  {
    taskId: 'configure_financing',
    title: '🏦 Financiación',
    description: 'Define cómo vas a financiar el proyecto',
    type: 'wizard',
    order: 4,
    isMandatory: false,
    estimatedTime: 120,
    route: '/flipping/[id]/financiacion',
    unlocks: ['financing_calculator']
  },
  {
    taskId: 'explore_dashboard',
    title: '📊 Ver dashboard Flipping',
    description: 'Haz seguimiento de costes, plazos y ROI',
    type: 'action',
    order: 5,
    isMandatory: false,
    estimatedTime: 60,
    route: '/flipping',
    unlocks: []
  },
  {
    taskId: 'complete_celebration',
    title: '✅ ¡Proyecto creado y validado!',
    description: 'Ahora puedes hacer seguimiento completo',
    type: 'action',
    order: 6,
    isMandatory: true,
    estimatedTime: 30,
    route: '/onboarding/complete',
    unlocks: ['todos_los_modulos']
  }
];

const ONBOARDING_GENERAL: OnboardingTaskDefinition[] = [
  {
    taskId: 'welcome',
    title: '👋 ¡Bienvenido a INMOVA!',
    description: 'Te vamos a guiar en tus primeros pasos (2 minutos)',
    type: 'video',
    order: 0,
    isMandatory: false,
    estimatedTime: 90,
    videoUrl: '/videos/onboarding/intro-90s.mp4',
    unlocks: []
  },
  {
    taskId: 'create_first_building',
    title: '🏢 Crea tu primer edificio',
    description: 'Registra las propiedades que gestionas',
    type: 'wizard',
    order: 1,
    isMandatory: true,
    estimatedTime: 120,
    route: '/edificios/nuevo?wizard=true',
    unlocks: ['edificios_module']
  },
  {
    taskId: 'add_units',
    title: '🏠 Añade unidades',
    description: 'Registra apartamentos, locales o habitaciones',
    type: 'wizard',
    order: 2,
    isMandatory: true,
    estimatedTime: 90,
    route: '/unidades/nueva?wizard=true',
    unlocks: ['unidades_module']
  },
  {
    taskId: 'manage_tenants',
    title: '👥 Gestiona inquilinos',
    description: 'Añade los datos de tus inquilinos',
    type: 'wizard',
    order: 3,
    isMandatory: false,
    estimatedTime: 90,
    route: '/inquilinos/nuevo',
    unlocks: ['inquilinos_module']
  },
  {
    taskId: 'explore_dashboard',
    title: '📊 Tu Dashboard está listo',
    description: 'Visualiza todos tus KPIs, alertas y métricas',
    type: 'action',
    order: 4,
    isMandatory: false,
    estimatedTime: 60,
    route: '/dashboard',
    unlocks: []
  },
  {
    taskId: 'complete_celebration',
    title: '✅ ¡Todo listo!',
    description: 'Explora los 88 módulos disponibles',
    type: 'action',
    order: 5,
    isMandatory: true,
    estimatedTime: 30,
    route: '/onboarding/complete',
    unlocks: ['todos_los_modulos']
  }
];

// Mapeo de verticales a tareas
const ONBOARDING_TASKS_BY_VERTICAL: Record<string, OnboardingTaskDefinition[]> = {
  'alquiler_tradicional': ONBOARDING_ALQUILER_TRADICIONAL,
  'room_rental': ONBOARDING_ROOM_RENTAL,
  'coliving': ONBOARDING_ROOM_RENTAL, // Usa el mismo que room_rental
  'str_vacacional': ONBOARDING_STR,
  'flipping': ONBOARDING_FLIPPING,
  'construccion': ONBOARDING_GENERAL, // TODO: Crear específico
  'servicios_profesionales': ONBOARDING_GENERAL, // TODO: Crear específico
  'comunidades': ONBOARDING_GENERAL, // TODO: Crear específico
  'mixto': ONBOARDING_GENERAL,
  'general': ONBOARDING_GENERAL
};

// ===================================
// FUNCIONES DEL SERVICIO
// ===================================

/**
 * Inicializa las tareas de onboarding para un usuario
 * ADAPTADO POR ROL Y EXPERIENCIA
 */
export async function initializeOnboardingTasks(
  userId: string,
  companyId: string,
  vertical: string,
  role?: UserRole,
  experience?: ExperienceLevel
) {
  try {
    // Verificar si ya tiene tareas creadas
    const existingTasks = await prisma.onboardingTask.findMany({
      where: { userId, companyId }
    });

    if (existingTasks.length > 0) {
      console.log(`Usuario ${userId} ya tiene tareas de onboarding`);
      return existingTasks;
    }

    // Obtener usuario para extraer rol y experiencia si no se pasan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true, 
        preferences: true 
      }
    });

    const userRole = role || user?.role || 'gestor';
    const userExperience = experience || (user?.preferences as any)?.experienceLevel || 'intermedio';

    console.log(`Inicializando onboarding para: rol=${userRole}, vertical=${vertical}, experiencia=${userExperience}`);

    // Obtener las tareas base para este vertical
    let taskDefinitions = ONBOARDING_TASKS_BY_VERTICAL[vertical] || ONBOARDING_GENERAL;

    // 1. Filtrar tareas según el rol
    taskDefinitions = filterTasksByRole(taskDefinitions, userRole);

    // 2. Agregar tareas específicas del rol
    const additionalTasks = getAdditionalTasksByRole(userRole);
    taskDefinitions = [...taskDefinitions, ...additionalTasks];

    // 3. Ajustar estimatedTime según rol y experiencia
    taskDefinitions = taskDefinitions.map(def => ({
      ...def,
      estimatedTime: adjustEstimatedTime(def.estimatedTime, userRole, userExperience),
      videoUrl: shouldShowVideo(userRole, userExperience) ? def.videoUrl : undefined
    }));

    // 4. Auto-completar tareas triviales para usuarios avanzados
    const tasksToCreate = taskDefinitions.map(def => {
      const autoComplete = shouldAutoComplete(def.taskId, userExperience);
      return {
        userId,
        companyId,
        vertical,
        taskId: def.taskId,
        title: def.title,
        description: def.description,
        type: def.type,
        order: def.order,
        isMandatory: def.isMandatory,
        estimatedTime: def.estimatedTime,
        route: def.route,
        videoUrl: def.videoUrl,
        helpArticle: def.helpArticle,
        unlocks: def.unlocks,
        status: autoComplete ? 'completed' : 'pending',
        completedAt: autoComplete ? new Date() : null
      };
    });

    // Crear las tareas en la base de datos
    const tasks = await Promise.all(
      tasksToCreate.map(data => prisma.onboardingTask.create({ data }))
    );

    console.log(`✅ Creadas ${tasks.length} tareas de onboarding para usuario ${userId}`);
    console.log(`   - Rol: ${userRole}`);
    console.log(`   - Experiencia: ${userExperience}`);
    console.log(`   - Tareas auto-completadas: ${tasks.filter(t => t.status === 'completed').length}`);
    
    // Inicializar módulos por defecto según rol, vertical y experiencia
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { businessVertical: true }
      });

      if (company) {
        await initializeDefaultModules(
          userId, 
          userRole, 
          company.businessVertical,
          userExperience
        );
        console.log(`✅ Módulos por defecto inicializados para usuario ${userId}`);
      }
    } catch (moduleError) {
      logger.error('Error inicializando módulos (continuando):', moduleError);
      // No lanzar error para no bloquear el onboarding
    }
    
    return tasks;
  } catch (error) {
    logger.error('Error inicializando tareas de onboarding:', error);
    throw error;
  }
}

/**
 * Obtiene todas las tareas de onboarding de un usuario
 */
export async function getOnboardingTasks(userId: string, companyId: string) {
  return await prisma.onboardingTask.findMany({
    where: { userId, companyId },
    orderBy: { order: 'asc' }
  });
}

/**
 * Marca una tarea como completada
 */
export async function completeOnboardingTask(
  userId: string,
  companyId: string,
  taskId: string
) {
  try {
    const task = await prisma.onboardingTask.updateMany({
      where: {
        userId,
        companyId,
        taskId
      },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Verificar si se completó el onboarding completo
    const allTasks = await getOnboardingTasks(userId, companyId);
    const mandatoryTasks = allTasks.filter(t => t.isMandatory);
    const completedMandatory = mandatoryTasks.filter(t => t.status === 'completed');

    if (completedMandatory.length === mandatoryTasks.length) {
      // Todas las tareas obligatorias completadas
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true }
      });

      console.log(`Usuario ${userId} ha completado el onboarding!`);

      // Trigger evento de onboarding completado
      await triggerOnboardingCompleteEvent(userId, companyId);
    }

    return task;
  } catch (error) {
    logger.error('Error completando tarea de onboarding:', error);
    throw error;
  }
}

/**
 * Marca una tarea como saltada
 */
export async function skipOnboardingTask(
  userId: string,
  companyId: string,
  taskId: string
) {
  return await prisma.onboardingTask.updateMany({
    where: {
      userId,
      companyId,
      taskId
    },
    data: {
      status: 'skipped',
      skippedAt: new Date()
    }
  });
}

/**
 * Calcula el progreso del onboarding
 */
export async function getOnboardingProgress(userId: string, companyId: string) {
  const tasks = await getOnboardingTasks(userId, companyId);
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalTasks = tasks.length;
  const percentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Calcular tiempo restante estimado
  const remainingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const estimatedTimeRemaining = remainingTasks.reduce((sum, task) => sum + task.estimatedTime, 0);

  // Encontrar el índice del primer paso no completado (currentStep)
  const currentStepIndex = tasks.findIndex(t => t.status !== 'completed');

  // Transformar tasks a steps con el formato esperado por el frontend
  const steps = tasks.map(task => ({
    id: task.taskId,
    title: task.title,
    description: task.description,
    action: task.route || 'acknowledge',
    completed: task.status === 'completed',
    required: task.isMandatory,
    order: task.order,
    videoUrl: task.videoUrl,
    estimatedTime: Math.ceil(task.estimatedTime / 60), // convertir segundos a minutos
  }));

  return {
    // Formato antiguo (mantener por compatibilidad)
    totalTasks,
    completedTasks: completedTasks.length,
    percentage,
    estimatedTimeRemaining, // en segundos
    tasks,

    // Formato nuevo para SmartOnboardingWizard
    currentStep: currentStepIndex >= 0 ? currentStepIndex : tasks.length - 1,
    totalSteps: totalTasks,
    completedSteps: completedTasks.length,
    percentageComplete: percentage,
    steps,
    vertical: 'general', // TODO: obtener del usuario/company
  };
}

/**
 * Trigger evento cuando se completa el onboarding
 */
async function triggerOnboardingCompleteEvent(userId: string, companyId: string) {
  try {
    // 1. Crear celebración
    await celebrateOnboardingCompleted(userId, companyId);

    // 2. Crear notificación in-app
    await notifyOnboardingCompleted(userId, companyId);

    // 3. Enviar email de felicitación inmediatamente
    await sendOnboardingEmail({
      userId,
      companyId,
      type: 'onboarding_completed',
      templateData: {
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      }
    });

    // 4. Crear evento webhook
    await createWebhookEvent({
      companyId,
      event: 'USER_ONBOARDING_COMPLETED',
      payload: {
        userId,
        companyId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error creando eventos de onboarding completado:', error);
  }
}

/**
 * Obtiene el tiempo total estimado del onboarding
 */
export function getEstimatedOnboardingTime(vertical: string): number {
  const tasks = ONBOARDING_TASKS_BY_VERTICAL[vertical] || ONBOARDING_GENERAL;
  return tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
}
