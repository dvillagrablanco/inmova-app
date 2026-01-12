/**
 * CONFIGURACIÓN DE ONBOARDING PERSONALIZADO
 * 
 * Define flujos de onboarding adaptados a:
 * 1. Tipo de perfil de cliente (propietario, gestor, agencia, etc.)
 * 2. Nivel de experiencia del usuario
 * 3. Plan contratado
 * 4. Vertical de negocio
 */

import { ClientProfile, SubscriptionPlanId } from './subscription-plans-config';

// ============================================================================
// TIPOS
// ============================================================================

export type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';
export type OnboardingStepType = 'info' | 'action' | 'setup' | 'tour' | 'video';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: OnboardingStepType;
  /** Icono de Lucide */
  icon: string;
  /** Duración estimada en minutos */
  duration: number;
  /** Acción a realizar */
  action?: {
    type: 'navigate' | 'modal' | 'external' | 'tour';
    target: string;
    label: string;
  };
  /** Condición para mostrar este paso */
  condition?: {
    requiresModule?: string;
    requiresPlan?: SubscriptionPlanId[];
    requiresVertical?: string[];
    minExperience?: ExperienceLevel;
  };
  /** Puede saltarse */
  skippable: boolean;
  /** Tips adicionales */
  tips?: string[];
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  /** Perfiles para los que aplica este flujo */
  targetProfiles: ClientProfile[];
  /** Nivel de experiencia objetivo */
  experienceLevel: ExperienceLevel;
  /** Duración total estimada en minutos */
  totalDuration: number;
  /** Pasos del onboarding */
  steps: OnboardingStep[];
  /** Mensaje de bienvenida personalizado */
  welcomeMessage: string;
  /** Recursos de ayuda */
  helpResources: {
    type: 'video' | 'article' | 'chat';
    title: string;
    url: string;
  }[];
}

// ============================================================================
// FLUJOS DE ONBOARDING POR PERFIL
// ============================================================================

export const ONBOARDING_FLOWS: Record<string, OnboardingFlow> = {
  // -------------------------------------------------------------------------
  // PROPIETARIO INDIVIDUAL - Flujo simplificado
  // -------------------------------------------------------------------------
  propietario_basico: {
    id: 'propietario_basico',
    name: 'Propietario Individual',
    description: 'Onboarding simplificado para gestionar tus propiedades',
    targetProfiles: ['propietario_individual'],
    experienceLevel: 'principiante',
    totalDuration: 8,
    welcomeMessage: '¡Bienvenido! Vamos a configurar tu cuenta en 5 minutos para que puedas empezar a gestionar tus propiedades.',
    steps: [
      {
        id: 'welcome',
        title: '¡Bienvenido a Inmova!',
        description: 'Gestiona tus propiedades de forma simple y profesional',
        type: 'info',
        icon: 'Sparkles',
        duration: 1,
        skippable: false,
        tips: [
          '📱 También disponible en móvil',
          '💡 Puedes volver a este tutorial desde Ayuda',
        ],
      },
      {
        id: 'primera_propiedad',
        title: 'Añade tu primera propiedad',
        description: 'Empieza creando tu primera propiedad para gestionarla',
        type: 'action',
        icon: 'Building2',
        duration: 2,
        action: {
          type: 'navigate',
          target: '/propiedades/nueva',
          label: 'Crear propiedad',
        },
        skippable: true,
        tips: [
          'Puedes empezar solo con la dirección',
          'Los detalles se pueden añadir después',
        ],
      },
      {
        id: 'primer_inquilino',
        title: 'Registra a tu inquilino',
        description: 'Añade los datos de tu inquilino actual',
        type: 'action',
        icon: 'Users',
        duration: 2,
        action: {
          type: 'navigate',
          target: '/inquilinos/nuevo',
          label: 'Añadir inquilino',
        },
        skippable: true,
        tips: [
          'Solo necesitas nombre y contacto para empezar',
          'El inquilino recibirá invitación a su portal',
        ],
      },
      {
        id: 'primer_contrato',
        title: 'Crea tu primer contrato',
        description: 'Vincula el inquilino con la propiedad',
        type: 'action',
        icon: 'FileText',
        duration: 2,
        action: {
          type: 'navigate',
          target: '/contratos/nuevo',
          label: 'Crear contrato',
        },
        skippable: true,
        tips: [
          'Puedes generar el PDF del contrato automáticamente',
          'Configura recordatorios de vencimiento',
        ],
      },
      {
        id: 'completado',
        title: '¡Todo listo!',
        description: 'Ya puedes empezar a gestionar tus propiedades',
        type: 'info',
        icon: 'CheckCircle2',
        duration: 1,
        skippable: false,
        tips: [
          'Explora el dashboard para ver tus KPIs',
          'Activa las notificaciones para no perderte nada',
        ],
      },
    ],
    helpResources: [
      {
        type: 'video',
        title: 'Tour rápido de la plataforma',
        url: '/help/video/tour-basico',
      },
      {
        type: 'article',
        title: 'Guía de inicio rápido',
        url: '/help/articulos/guia-inicio',
      },
      {
        type: 'chat',
        title: 'Chat con soporte',
        url: '/chat/soporte',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // INVERSOR PEQUEÑO - Flujo con énfasis financiero
  // -------------------------------------------------------------------------
  inversor_financiero: {
    id: 'inversor_financiero',
    name: 'Pequeño Inversor',
    description: 'Onboarding enfocado en rentabilidad y análisis',
    targetProfiles: ['inversor_pequeno'],
    experienceLevel: 'intermedio',
    totalDuration: 12,
    welcomeMessage: '¡Hola inversor! Vamos a configurar tu cuenta para que puedas analizar la rentabilidad de tu cartera.',
    steps: [
      {
        id: 'welcome',
        title: 'Bienvenido, Inversor',
        description: 'Maximiza la rentabilidad de tu cartera inmobiliaria',
        type: 'info',
        icon: 'TrendingUp',
        duration: 1,
        skippable: false,
      },
      {
        id: 'importar_cartera',
        title: 'Importa tu cartera',
        description: 'Sube tus propiedades desde Excel o créalas manualmente',
        type: 'action',
        icon: 'Upload',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/propiedades/importar',
          label: 'Importar propiedades',
        },
        skippable: true,
        tips: [
          'Descarga nuestra plantilla Excel',
          'Puedes importar hasta 50 propiedades a la vez',
        ],
      },
      {
        id: 'calculadora_roi',
        title: 'Conoce las calculadoras',
        description: 'Herramientas para analizar inversiones',
        type: 'tour',
        icon: 'Calculator',
        duration: 2,
        action: {
          type: 'navigate',
          target: '/dashboard/herramientas',
          label: 'Ver calculadoras',
        },
        skippable: true,
        tips: [
          'Calcula rentabilidad bruta y neta',
          'Simula escenarios de hipoteca',
        ],
      },
      {
        id: 'configurar_gastos',
        title: 'Configura tus gastos fijos',
        description: 'Define IBI, comunidad y otros gastos recurrentes',
        type: 'setup',
        icon: 'Euro',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/gastos/configurar',
          label: 'Configurar gastos',
        },
        condition: {
          requiresModule: 'gastos',
          requiresPlan: ['basic', 'professional', 'business', 'enterprise'],
        },
        skippable: true,
      },
      {
        id: 'reportes',
        title: 'Explora los reportes',
        description: 'Visualiza la rentabilidad de tu cartera',
        type: 'tour',
        icon: 'BarChart2',
        duration: 2,
        action: {
          type: 'navigate',
          target: '/reportes',
          label: 'Ver reportes',
        },
        condition: {
          requiresModule: 'reportes',
        },
        skippable: true,
      },
      {
        id: 'completado',
        title: '¡Cartera configurada!',
        description: 'Ya puedes analizar tu inversión inmobiliaria',
        type: 'info',
        icon: 'CheckCircle2',
        duration: 1,
        skippable: false,
      },
    ],
    helpResources: [
      {
        type: 'video',
        title: 'Cómo calcular rentabilidad',
        url: '/help/video/calcular-roi',
      },
      {
        type: 'article',
        title: 'Guía del inversor inmobiliario',
        url: '/help/articulos/guia-inversor',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // GESTOR PROFESIONAL - Flujo avanzado
  // -------------------------------------------------------------------------
  gestor_profesional: {
    id: 'gestor_profesional',
    name: 'Gestor Profesional',
    description: 'Onboarding completo para gestión multi-cliente',
    targetProfiles: ['gestor_profesional'],
    experienceLevel: 'avanzado',
    totalDuration: 20,
    welcomeMessage: '¡Bienvenido profesional! Vamos a configurar tu plataforma de gestión multi-cliente.',
    steps: [
      {
        id: 'welcome',
        title: 'Gestión Profesional',
        description: 'Plataforma completa para gestores inmobiliarios',
        type: 'info',
        icon: 'Briefcase',
        duration: 1,
        skippable: false,
      },
      {
        id: 'configurar_empresa',
        title: 'Configura tu empresa',
        description: 'Personaliza con tu logo y datos fiscales',
        type: 'setup',
        icon: 'Building',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/configuracion/empresa',
          label: 'Configurar empresa',
        },
        skippable: true,
      },
      {
        id: 'crear_propietarios',
        title: 'Crea propietarios (clientes)',
        description: 'Añade los propietarios para los que gestionas',
        type: 'action',
        icon: 'Users',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/propietarios/nuevo',
          label: 'Añadir propietario',
        },
        condition: {
          requiresModule: 'portal_propietario',
        },
        skippable: true,
      },
      {
        id: 'importar_cartera',
        title: 'Importa la cartera',
        description: 'Sube todas las propiedades desde Excel',
        type: 'action',
        icon: 'Upload',
        duration: 5,
        action: {
          type: 'navigate',
          target: '/propiedades/importar',
          label: 'Importar cartera',
        },
        skippable: true,
      },
      {
        id: 'configurar_facturacion',
        title: 'Configura facturación',
        description: 'Define honorarios y facturación a propietarios',
        type: 'setup',
        icon: 'Receipt',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/facturacion/configurar',
          label: 'Configurar facturación',
        },
        condition: {
          requiresModule: 'facturacion',
        },
        skippable: true,
      },
      {
        id: 'crear_equipo',
        title: 'Invita a tu equipo',
        description: 'Añade gestores y asigna propiedades',
        type: 'action',
        icon: 'UserPlus',
        duration: 2,
        action: {
          type: 'navigate',
          target: '/usuarios/invitar',
          label: 'Invitar usuarios',
        },
        skippable: true,
      },
      {
        id: 'integraciones',
        title: 'Conecta tus herramientas',
        description: 'Integra con Stripe, Gmail, Contasimple...',
        type: 'setup',
        icon: 'Plug',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/integraciones',
          label: 'Ver integraciones',
        },
        condition: {
          requiresPlan: ['professional', 'business', 'enterprise'],
        },
        skippable: true,
      },
      {
        id: 'completado',
        title: '¡Plataforma lista!',
        description: 'Ya puedes gestionar profesionalmente',
        type: 'info',
        icon: 'CheckCircle2',
        duration: 1,
        skippable: false,
      },
    ],
    helpResources: [
      {
        type: 'video',
        title: 'Gestión multi-propietario',
        url: '/help/video/multi-propietario',
      },
      {
        type: 'article',
        title: 'API para desarrolladores',
        url: '/help/articulos/api-docs',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // AGENCIA INMOBILIARIA - Flujo con CRM
  // -------------------------------------------------------------------------
  agencia_crm: {
    id: 'agencia_crm',
    name: 'Agencia Inmobiliaria',
    description: 'Onboarding con énfasis en CRM y captación',
    targetProfiles: ['agencia_inmobiliaria'],
    experienceLevel: 'intermedio',
    totalDuration: 15,
    welcomeMessage: '¡Bienvenida agencia! Vamos a configurar tu CRM inmobiliario.',
    steps: [
      {
        id: 'welcome',
        title: 'CRM Inmobiliario',
        description: 'Gestiona leads, captación y cartera de alquiler',
        type: 'info',
        icon: 'Briefcase',
        duration: 1,
        skippable: false,
      },
      {
        id: 'configurar_crm',
        title: 'Configura el CRM',
        description: 'Define etapas del embudo y campos personalizados',
        type: 'setup',
        icon: 'Users2',
        duration: 4,
        action: {
          type: 'navigate',
          target: '/crm/configurar',
          label: 'Configurar CRM',
        },
        condition: {
          requiresModule: 'crm',
        },
        skippable: true,
      },
      {
        id: 'importar_leads',
        title: 'Importa tus leads',
        description: 'Sube tus contactos existentes',
        type: 'action',
        icon: 'Upload',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/crm/importar',
          label: 'Importar leads',
        },
        skippable: true,
      },
      {
        id: 'cartera_inmuebles',
        title: 'Añade tu cartera',
        description: 'Crea los inmuebles que gestionas',
        type: 'action',
        icon: 'Building2',
        duration: 4,
        action: {
          type: 'navigate',
          target: '/propiedades',
          label: 'Gestionar inmuebles',
        },
        skippable: true,
      },
      {
        id: 'matching',
        title: 'Conoce el matching',
        description: 'Encuentra el inquilino perfecto para cada inmueble',
        type: 'tour',
        icon: 'Sparkles',
        duration: 2,
        action: {
          type: 'navigate',
          target: '/crm/matching',
          label: 'Ver matching',
        },
        skippable: true,
      },
      {
        id: 'completado',
        title: '¡CRM configurado!',
        description: 'Empieza a captar y cerrar operaciones',
        type: 'info',
        icon: 'CheckCircle2',
        duration: 1,
        skippable: false,
      },
    ],
    helpResources: [
      {
        type: 'video',
        title: 'Cómo usar el CRM',
        url: '/help/video/crm-tutorial',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ADMINISTRADOR DE FINCAS - Flujo comunidades
  // -------------------------------------------------------------------------
  admin_fincas: {
    id: 'admin_fincas',
    name: 'Administrador de Fincas',
    description: 'Onboarding para gestión de comunidades',
    targetProfiles: ['administrador_fincas'],
    experienceLevel: 'intermedio',
    totalDuration: 15,
    welcomeMessage: '¡Bienvenido administrador! Vamos a configurar la gestión de tus comunidades.',
    steps: [
      {
        id: 'welcome',
        title: 'Gestión de Comunidades',
        description: 'Administra comunidades de propietarios de forma eficiente',
        type: 'info',
        icon: 'Building2',
        duration: 1,
        skippable: false,
      },
      {
        id: 'crear_comunidad',
        title: 'Crea tu primera comunidad',
        description: 'Añade una comunidad de propietarios',
        type: 'action',
        icon: 'Plus',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/comunidades/nueva',
          label: 'Crear comunidad',
        },
        condition: {
          requiresModule: 'comunidades',
        },
        skippable: true,
      },
      {
        id: 'importar_vecinos',
        title: 'Añade los vecinos',
        description: 'Importa o crea los propietarios de la comunidad',
        type: 'action',
        icon: 'Users',
        duration: 4,
        action: {
          type: 'navigate',
          target: '/comunidades/vecinos/importar',
          label: 'Importar vecinos',
        },
        skippable: true,
      },
      {
        id: 'configurar_cuotas',
        title: 'Configura las cuotas',
        description: 'Define cuotas ordinarias y coeficientes',
        type: 'setup',
        icon: 'Euro',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/comunidades/cuotas',
          label: 'Configurar cuotas',
        },
        skippable: true,
      },
      {
        id: 'portal_vecinos',
        title: 'Activa el portal de vecinos',
        description: 'Permite a los vecinos acceder a su información',
        type: 'setup',
        icon: 'Globe',
        duration: 2,
        action: {
          type: 'navigate',
          target: '/comunidades/portal',
          label: 'Configurar portal',
        },
        skippable: true,
      },
      {
        id: 'completado',
        title: '¡Comunidad configurada!',
        description: 'Ya puedes gestionar tu comunidad',
        type: 'info',
        icon: 'CheckCircle2',
        duration: 1,
        skippable: false,
      },
    ],
    helpResources: [
      {
        type: 'video',
        title: 'Gestión de comunidades',
        url: '/help/video/comunidades',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // STR / VACACIONAL - Flujo channel manager
  // -------------------------------------------------------------------------
  str_vacacional: {
    id: 'str_vacacional',
    name: 'Alquiler Vacacional',
    description: 'Onboarding para gestión de STR',
    targetProfiles: ['empresa_str'],
    experienceLevel: 'avanzado',
    totalDuration: 18,
    welcomeMessage: '¡Bienvenido! Vamos a conectar tus canales de reserva y automatizar tu operación.',
    steps: [
      {
        id: 'welcome',
        title: 'Gestión STR',
        description: 'Centraliza Airbnb, Booking y reservas directas',
        type: 'info',
        icon: 'Hotel',
        duration: 1,
        skippable: false,
      },
      {
        id: 'crear_propiedades',
        title: 'Añade tus propiedades',
        description: 'Crea los alojamientos que gestionas',
        type: 'action',
        icon: 'Building2',
        duration: 4,
        action: {
          type: 'navigate',
          target: '/str/propiedades/nueva',
          label: 'Crear propiedad',
        },
        skippable: true,
      },
      {
        id: 'channel_manager',
        title: 'Conecta tus canales',
        description: 'Sincroniza Airbnb, Booking, Vrbo...',
        type: 'setup',
        icon: 'Link',
        duration: 5,
        action: {
          type: 'navigate',
          target: '/str/channel-manager',
          label: 'Conectar canales',
        },
        condition: {
          requiresModule: 'str_completo',
        },
        skippable: true,
      },
      {
        id: 'pricing',
        title: 'Configura precios dinámicos',
        description: 'Define estrategia de pricing automático',
        type: 'setup',
        icon: 'TrendingUp',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/str/pricing',
          label: 'Configurar pricing',
        },
        skippable: true,
      },
      {
        id: 'equipo_limpieza',
        title: 'Añade equipo de limpieza',
        description: 'Asigna personal a tus propiedades',
        type: 'action',
        icon: 'Users',
        duration: 3,
        action: {
          type: 'navigate',
          target: '/str/housekeeping',
          label: 'Gestionar limpieza',
        },
        skippable: true,
      },
      {
        id: 'completado',
        title: '¡Listo para operar!',
        description: 'Tu operación STR está configurada',
        type: 'info',
        icon: 'CheckCircle2',
        duration: 1,
        skippable: false,
      },
    ],
    helpResources: [
      {
        type: 'video',
        title: 'Channel Manager tutorial',
        url: '/help/video/channel-manager',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // INQUILINO - Flujo ultra-simple
  // -------------------------------------------------------------------------
  inquilino_portal: {
    id: 'inquilino_portal',
    name: 'Portal de Inquilino',
    description: 'Onboarding rápido para inquilinos',
    targetProfiles: ['propietario_individual'], // Se asigna por rol, no perfil
    experienceLevel: 'principiante',
    totalDuration: 3,
    welcomeMessage: '¡Bienvenido a tu portal! Aquí podrás gestionar todo lo relacionado con tu alquiler.',
    steps: [
      {
        id: 'welcome',
        title: '¡Bienvenido a tu Portal!',
        description: 'Gestiona tu alquiler de forma fácil',
        type: 'info',
        icon: 'Home',
        duration: 1,
        skippable: false,
      },
      {
        id: 'tour_dashboard',
        title: 'Tu panel personal',
        description: 'Aquí verás tus pagos y contrato',
        type: 'tour',
        icon: 'LayoutDashboard',
        duration: 1,
        action: {
          type: 'tour',
          target: 'tenant-dashboard',
          label: 'Ver tour',
        },
        skippable: true,
      },
      {
        id: 'como_pagar',
        title: 'Cómo pagar tu alquiler',
        description: 'Configura tu método de pago',
        type: 'action',
        icon: 'CreditCard',
        duration: 1,
        action: {
          type: 'navigate',
          target: '/portal/pagos',
          label: 'Ver pagos',
        },
        skippable: true,
      },
      {
        id: 'completado',
        title: '¡Todo listo!',
        description: 'Ya puedes usar tu portal de inquilino',
        type: 'info',
        icon: 'CheckCircle2',
        duration: 0,
        skippable: false,
      },
    ],
    helpResources: [
      {
        type: 'chat',
        title: 'Chat con tu gestor',
        url: '/portal/chat',
      },
    ],
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene el flujo de onboarding recomendado para un perfil
 */
export function getOnboardingFlow(
  profile: ClientProfile,
  experienceLevel?: ExperienceLevel
): OnboardingFlow | null {
  // Buscar flujo que coincida con el perfil
  for (const flow of Object.values(ONBOARDING_FLOWS)) {
    if (flow.targetProfiles.includes(profile)) {
      // Si el nivel de experiencia coincide, usar este
      if (!experienceLevel || flow.experienceLevel === experienceLevel) {
        return flow;
      }
    }
  }
  
  // Fallback al flujo básico
  return ONBOARDING_FLOWS.propietario_basico;
}

/**
 * Filtra los pasos según el plan del usuario
 */
export function filterStepsByPlan(
  steps: OnboardingStep[],
  plan: SubscriptionPlanId,
  modules: string[]
): OnboardingStep[] {
  return steps.filter(step => {
    if (!step.condition) return true;
    
    // Verificar plan
    if (step.condition.requiresPlan) {
      if (!step.condition.requiresPlan.includes(plan)) {
        return false;
      }
    }
    
    // Verificar módulo
    if (step.condition.requiresModule) {
      if (!modules.includes(step.condition.requiresModule)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Calcula el progreso del onboarding
 */
export function calculateOnboardingProgress(
  completedSteps: string[],
  totalSteps: OnboardingStep[]
): {
  percentage: number;
  completedCount: number;
  totalCount: number;
  remainingTime: number;
} {
  const totalCount = totalSteps.length;
  const completedCount = completedSteps.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  const remainingSteps = totalSteps.filter(s => !completedSteps.includes(s.id));
  const remainingTime = remainingSteps.reduce((sum, s) => sum + s.duration, 0);
  
  return {
    percentage,
    completedCount,
    totalCount,
    remainingTime,
  };
}
