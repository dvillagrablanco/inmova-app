/**
 * ADAPTADOR DE ONBOARDING POR ROL Y EXPERIENCIA
 * Extiende el sistema de onboarding para personalizar según:
 * - Rol del usuario (gestor, operador, administrador, etc.)
 * - Nivel de experiencia (principiante, intermedio, avanzado)
 */

import type { UserRole } from '@/types/prisma-types';

export type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';

export interface RoleOnboardingConfig {
  role: UserRole;
  welcomeMessage: string;
  estimatedTimeMultiplier: number; // 1.0 = normal, 1.5 = más tiempo para principiantes
  mandatoryTasksOnly: boolean; // true para roles avanzados
  skipVideoTutorials: boolean;
  focusAreas: string[]; // Áreas clave para este rol
  permissions: string[];
}

// ===================================
// CONFIGURACIONES POR ROL
// ===================================

export const ROLE_CONFIGS: Record<string, RoleOnboardingConfig> = {
  super_admin: {
    role: 'super_admin' as UserRole,
    welcomeMessage: '🛡️ Bienvenido SuperAdmin. Tienes acceso completo al sistema y gestión multi-empresa.',
    estimatedTimeMultiplier: 0.5, // Usuarios avanzados, menos tiempo
    mandatoryTasksOnly: true, // Solo tareas críticas
    skipVideoTutorials: true, // No necesitan videos
    focusAreas: [
      'Gestión de empresas',
      'Configuración global',
      'Seguridad y permisos',
      'Analytics multi-tenant',
      'Monitoreo del sistema'
    ],
    permissions: ['all']
  },

  administrador: {
    role: 'administrador' as UserRole,
    welcomeMessage: '👔 Bienvenido Administrador. Gestiona tu empresa y equipo con acceso completo a funcionalidades.',
    estimatedTimeMultiplier: 0.7,
    mandatoryTasksOnly: false,
    skipVideoTutorials: false,
    focusAreas: [
      'Gestión de equipo',
      'Configuración de empresa',
      'Facturación y pagos',
      'Reportes financieros',
      'Integraciones'
    ],
    permissions: ['manage_company', 'manage_users', 'manage_billing', 'view_reports']
  },

  gestor: {
    role: 'gestor' as UserRole,
    welcomeMessage: '🏢 Bienvenido Gestor. Tu rol es gestionar propiedades, inquilinos y contratos.',
    estimatedTimeMultiplier: 1.0, // Tiempo estándar
    mandatoryTasksOnly: false,
    skipVideoTutorials: false,
    focusAreas: [
      'Gestión de edificios',
      'Gestión de unidades',
      'Contratos de alquiler',
      'Inquilinos',
      'Mantenimiento',
      'Cobros y pagos'
    ],
    permissions: ['manage_properties', 'manage_tenants', 'manage_contracts', 'view_payments']
  },

  operador: {
    role: 'operador' as UserRole,
    welcomeMessage: '🛠️ Bienvenido Operador. Enfócate en tareas operativas diarias: mantenimiento, inspecciones y soporte.',
    estimatedTimeMultiplier: 1.0,
    mandatoryTasksOnly: false,
    skipVideoTutorials: false,
    focusAreas: [
      'Incidencias de mantenimiento',
      'Inspecciones de unidades',
      'Órdenes de trabajo',
      'Comunicación con proveedores',
      'Calendario operativo'
    ],
    permissions: ['manage_maintenance', 'view_properties', 'manage_inspections']
  },

  soporte: {
    role: 'soporte' as UserRole,
    welcomeMessage: '💬 Bienvenido al equipo de Soporte. Tu rol es ayudar a inquilinos y gestionar comunicaciones.',
    estimatedTimeMultiplier: 1.0,
    mandatoryTasksOnly: false,
    skipVideoTutorials: false,
    focusAreas: [
      'Chat con inquilinos',
      'Gestión de tickets',
      'Base de conocimiento',
      'Comunicaciones masivas',
      'Atención al cliente'
    ],
    permissions: ['manage_support', 'view_tenants', 'manage_communications']
  },

  community_manager: {
    role: 'community_manager' as UserRole,
    welcomeMessage: '👥 Bienvenido Community Manager. Gestiona comunidades de propietarios, juntas y votaciones.',
    estimatedTimeMultiplier: 1.0,
    mandatoryTasksOnly: false,
    skipVideoTutorials: false,
    focusAreas: [
      'Gestión de comunidades',
      'Convocatoria de juntas',
      'Sistema de votaciones',
      'Derramas y cuotas',
      'Comunicación con propietarios'
    ],
    permissions: ['manage_communities', 'manage_meetings', 'manage_voting']
  }
};

// ===================================
// CONFIGURACIONES POR NIVEL DE EXPERIENCIA
// ===================================

export interface ExperienceConfig {
  level: ExperienceLevel;
  timeMultiplier: number;
  includeVideoTutorials: boolean;
  includeHelpArticles: boolean;
  interactiveWizards: boolean;
  autoCompleteSimpleTasks: boolean; // Auto-completar tareas obvias
  tooltipsEnabled: boolean;
  chatbotAssistance: 'proactive' | 'ondemand' | 'disabled';
}

export const EXPERIENCE_CONFIGS: Record<ExperienceLevel, ExperienceConfig> = {
  principiante: {
    level: 'principiante',
    timeMultiplier: 1.5, // 50% más tiempo
    includeVideoTutorials: true,
    includeHelpArticles: true,
    interactiveWizards: true,
    autoCompleteSimpleTasks: false,
    tooltipsEnabled: true,
    chatbotAssistance: 'proactive' // Chatbot aparece automáticamente
  },

  intermedio: {
    level: 'intermedio',
    timeMultiplier: 1.0, // Tiempo estándar
    includeVideoTutorials: true,
    includeHelpArticles: true,
    interactiveWizards: true,
    autoCompleteSimpleTasks: false,
    tooltipsEnabled: true,
    chatbotAssistance: 'ondemand' // Chatbot disponible pero no intrusivo
  },

  avanzado: {
    level: 'avanzado',
    timeMultiplier: 0.6, // 40% menos tiempo
    includeVideoTutorials: false,
    includeHelpArticles: false,
    interactiveWizards: false, // Acceso directo sin wizard
    autoCompleteSimpleTasks: true, // Auto-completar welcome, etc.
    tooltipsEnabled: false,
    chatbotAssistance: 'disabled' // No mostrar chatbot
  }
};

// ===================================
// FILTRADO DE TAREAS POR ROL
// ===================================

/**
 * Filtra las tareas de onboarding según el rol del usuario
 */
export function filterTasksByRole(tasks: any[], role: UserRole): any[] {
  const config = ROLE_CONFIGS[role];
  
  if (!config) {
    return tasks; // Si no hay config, retornar todas
  }

  // Para super_admin y administrador: todas las tareas
  if (role === 'super_admin' || role === 'administrador') {
    return tasks;
  }

  // Para operador: solo tareas de mantenimiento
  if (role === 'operador') {
    return tasks.filter(task => 
      task.taskId.includes('maintenance') ||
      task.taskId.includes('inspection') ||
      task.taskId === 'welcome' ||
      task.taskId === 'explore_dashboard'
    );
  }

  // Para soporte: solo tareas de comunicación
  if (role === 'soporte') {
    return tasks.filter(task =>
      task.taskId.includes('chat') ||
      task.taskId.includes('support') ||
      task.taskId === 'welcome' ||
      task.taskId === 'explore_dashboard'
    );
  }

  // Para community_manager: solo tareas de comunidades
  if (role === 'community_manager') {
    return tasks.filter(task =>
      task.taskId.includes('community') ||
      task.taskId.includes('meeting') ||
      task.taskId.includes('voting') ||
      task.taskId === 'welcome' ||
      task.taskId === 'explore_dashboard'
    );
  }

  // Gestor: todas las tareas (es el rol base)
  return tasks;
}

/**
 * Ajusta el tiempo estimado según rol y experiencia
 */
export function adjustEstimatedTime(
  baseTime: number,
  role: UserRole,
  experience: ExperienceLevel
): number {
  const roleConfig = ROLE_CONFIGS[role];
  const expConfig = EXPERIENCE_CONFIGS[experience];
  
  if (!roleConfig || !expConfig) {
    return baseTime;
  }

  const roleMultiplier = roleConfig.estimatedTimeMultiplier;
  const expMultiplier = expConfig.timeMultiplier;
  
  return Math.round(baseTime * roleMultiplier * expMultiplier);
}

/**
 * Decide si mostrar video tutorial según rol y experiencia
 */
export function shouldShowVideo(
  role: UserRole,
  experience: ExperienceLevel
): boolean {
  const roleConfig = ROLE_CONFIGS[role];
  const expConfig = EXPERIENCE_CONFIGS[experience];
  
  if (!roleConfig || !expConfig) {
    return true;
  }

  // Si el rol dice skip videos, no mostrar
  if (roleConfig.skipVideoTutorials) {
    return false;
  }

  // Si la experiencia es avanzada, no mostrar
  if (!expConfig.includeVideoTutorials) {
    return false;
  }

  return true;
}

/**
 * Obtiene mensaje de bienvenida personalizado
 */
export function getWelcomeMessage(
  role: UserRole,
  experience: ExperienceLevel,
  userName: string
): string {
  const roleConfig = ROLE_CONFIGS[role];
  
  if (!roleConfig) {
    return `👋 ¡Hola ${userName}! Bienvenido a INMOVA.`;
  }

  const expText = experience === 'principiante' 
    ? ' Te guiaremos paso a paso.' 
    : experience === 'avanzado'
    ? ' Accede rápidamente a las funcionalidades clave.'
    : ' Vamos a configurar tu espacio.';

  return `${roleConfig.welcomeMessage}${expText}`;
}

/**
 * Obtiene tareas adicionales específicas del rol
 */
export function getAdditionalTasksByRole(role: UserRole): any[] {
  const roleTasks: Record<string, any[]> = {
    super_admin: [
      {
        taskId: 'configure_multi_tenant',
        title: '🏢 Configurar Multi-Tenant',
        description: 'Gestiona múltiples empresas desde un solo panel',
        type: 'wizard',
        order: 1,
        isMandatory: true,
        estimatedTime: 180,
        route: '/superadmin/empresas',
        unlocks: ['multi_tenant_access']
      },
      {
        taskId: 'security_audit',
        title: '🔐 Auditoría de Seguridad',
        description: 'Revisa logs y permisos del sistema',
        type: 'action',
        order: 2,
        isMandatory: false,
        estimatedTime: 120,
        route: '/superadmin/security',
        unlocks: ['security_dashboard']
      }
    ],

    operador: [
      {
        taskId: 'configure_maintenance',
        title: '🛠️ Configurar Mantenimiento',
        description: 'Define tipos de incidencias y proveedores',
        type: 'wizard',
        order: 1,
        isMandatory: true,
        estimatedTime: 120,
        route: '/mantenimiento/configurar',
        unlocks: ['maintenance_module']
      }
    ],

    soporte: [
      {
        taskId: 'configure_chat',
        title: '💬 Configurar Chat',
        description: 'Activa el chat en vivo con inquilinos',
        type: 'wizard',
        order: 1,
        isMandatory: true,
        estimatedTime: 90,
        route: '/soporte/chat',
        unlocks: ['live_chat']
      }
    ],

    community_manager: [
      {
        taskId: 'create_first_community',
        title: '🏛️ Crear Primera Comunidad',
        description: 'Registra la comunidad de propietarios',
        type: 'wizard',
        order: 1,
        isMandatory: true,
        estimatedTime: 180,
        route: '/comunidad/nueva',
        unlocks: ['communities_module']
      }
    ]
  };

  return roleTasks[role] || [];
}

/**
 * Determina si auto-completar tareas simples para usuarios avanzados
 */
export function shouldAutoComplete(
  taskId: string,
  experience: ExperienceLevel
): boolean {
  const expConfig = EXPERIENCE_CONFIGS[experience];
  
  if (!expConfig || !expConfig.autoCompleteSimpleTasks) {
    return false;
  }

  // Auto-completar solo tareas triviales para avanzados
  const trivialTasks = ['welcome', 'explore_dashboard'];
  return trivialTasks.includes(taskId);
}
