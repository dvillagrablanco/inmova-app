/**
 * Configuración de Perfiles de Usuario y UX Personalizada
 * 
 * Sistema de personalización basado en:
 * - Rol del usuario
 * - Nivel de experiencia
 * - Conocimiento técnico
 * - Tamaño de portfolio
 * - Vertical de negocio
 */

import { UserRole, ExperienceLevel, TechSavviness, BusinessVertical, PortfolioSize } from '@prisma/client';

export interface UserProfile {
  role: UserRole;
  experienceLevel?: ExperienceLevel;
  techSavviness?: TechSavviness;
  portfolioSize?: PortfolioSize;
  businessVertical?: BusinessVertical;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description?: string;
  priority: number; // 1 = crítico, 5 = opcional
  requiredRole?: UserRole[];
  minExperience?: ExperienceLevel;
}

/**
 * PERFILES DE USUARIO COMPLETOS
 */
export const USER_PROFILES = {
  // 1. SUPER ADMIN - Usuario técnico avanzado
  SUPER_ADMIN: {
    name: 'Super Administrador',
    description: 'Acceso completo a toda la plataforma',
    experienceExpected: 'avanzado' as ExperienceLevel,
    techExpected: 'alto' as TechSavviness,
    onboarding: {
      skipBasics: true,
      focusOn: ['system_config', 'company_management', 'advanced_analytics'],
      duration: 'short', // 5 min
    },
    dashboard: {
      layout: 'advanced',
      widgets: [
        'system_health',
        'all_companies_stats',
        'revenue_analytics',
        'user_activity',
        'api_usage',
        'security_alerts',
      ],
    },
    navigation: {
      maxItems: 50, // Sin límite práctico
      grouping: 'by_category',
      showAdvanced: true,
    },
  },

  // 2. ADMINISTRADOR - Gestor de empresa
  ADMINISTRADOR: {
    name: 'Administrador',
    description: 'Gestión completa de la empresa',
    experienceExpected: 'intermedio' as ExperienceLevel,
    techExpected: 'medio' as TechSavviness,
    onboarding: {
      skipBasics: false,
      focusOn: ['company_setup', 'team_management', 'properties_overview'],
      duration: 'medium', // 15 min
    },
    dashboard: {
      layout: 'standard',
      widgets: [
        'financial_kpis',
        'properties_overview',
        'team_performance',
        'pending_approvals',
        'contracts_expiring',
        'revenue_chart',
      ],
    },
    navigation: {
      maxItems: 20,
      grouping: 'by_frequency',
      showAdvanced: false,
      priorityModules: [
        'dashboard',
        'propiedades',
        'contratos',
        'inquilinos',
        'reportes',
        'usuarios',
      ],
    },
  },

  // 3. GESTOR - Operaciones diarias
  GESTOR: {
    name: 'Gestor',
    description: 'Gestión operativa de propiedades',
    experienceExpected: 'intermedio' as ExperienceLevel,
    techExpected: 'medio' as TechSavviness,
    onboarding: {
      skipBasics: false,
      focusOn: ['properties_management', 'tenant_interactions', 'maintenance_workflow'],
      duration: 'medium', // 10 min
    },
    dashboard: {
      layout: 'simple',
      widgets: [
        'my_properties',
        'pending_maintenance',
        'upcoming_visits',
        'recent_payments',
        'tenant_messages',
      ],
    },
    navigation: {
      maxItems: 12,
      grouping: 'by_workflow',
      showAdvanced: false,
      priorityModules: [
        'dashboard',
        'propiedades',
        'inquilinos',
        'mantenimiento',
        'visitas',
        'documentos',
      ],
    },
  },

  // 4. OPERADOR - Tareas específicas
  OPERADOR: {
    name: 'Operador',
    description: 'Ejecución de tareas operativas',
    experienceExpected: 'principiante' as ExperienceLevel,
    techExpected: 'bajo' as TechSavviness,
    onboarding: {
      skipBasics: false,
      focusOn: ['task_completion', 'basic_navigation', 'mobile_usage'],
      duration: 'long', // 20 min con tutoriales interactivos
    },
    dashboard: {
      layout: 'simple',
      widgets: [
        'my_tasks',
        'today_visits',
        'maintenance_assigned',
        'quick_actions',
      ],
    },
    navigation: {
      maxItems: 8,
      grouping: 'by_task',
      showAdvanced: false,
      priorityModules: [
        'dashboard',
        'tareas',
        'visitas',
        'mantenimiento',
        'calendario',
      ],
    },
  },

  // 5. INQUILINO - Usuario no técnico
  TENANT: {
    name: 'Inquilino',
    description: 'Portal simplificado para inquilinos',
    experienceExpected: 'principiante' as ExperienceLevel,
    techExpected: 'bajo' as TechSavviness,
    onboarding: {
      skipBasics: false,
      focusOn: ['my_home', 'payment_methods', 'maintenance_requests'],
      duration: 'short', // 5 min
      interactive: true,
      gamified: true, // Badges por completar pasos
    },
    dashboard: {
      layout: 'ultra_simple',
      widgets: [
        'my_contract',
        'next_payment',
        'my_maintenance_requests',
        'chatbot_access',
        'documents',
      ],
    },
    navigation: {
      maxItems: 6,
      grouping: 'by_need',
      showAdvanced: false,
      priorityModules: [
        'dashboard',
        'pagos',
        'mantenimiento',
        'documentos',
        'chatbot',
      ],
    },
  },

  // 6. PROPIETARIO - Vista financiera
  OWNER: {
    name: 'Propietario',
    description: 'Vista de inversión y rentabilidad',
    experienceExpected: 'intermedio' as ExperienceLevel,
    techExpected: 'medio' as TechSavviness,
    onboarding: {
      skipBasics: false,
      focusOn: ['property_performance', 'financial_reports', 'tenant_selection'],
      duration: 'medium', // 12 min
    },
    dashboard: {
      layout: 'financial_focused',
      widgets: [
        'roi_calculator',
        'income_vs_expenses',
        'occupancy_rate',
        'property_valuation',
        'tax_summary',
      ],
    },
    navigation: {
      maxItems: 10,
      grouping: 'by_financial_goal',
      showAdvanced: false,
      priorityModules: [
        'dashboard',
        'propiedades',
        'finanzas',
        'reportes',
        'contratos',
      ],
    },
  },
};

/**
 * NAVEGACIÓN ADAPTATIVA POR ROL
 */
export const getNavigationForProfile = (profile: UserProfile): NavigationItem[] => {
  const baseNavigation: NavigationItem[] = [
    // UNIVERSAL (todos los roles)
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      description: 'Vista general de tu actividad',
      priority: 1,
    },
    
    // GESTIÓN DE PROPIEDADES (no para inquilinos)
    {
      id: 'propiedades',
      label: 'Propiedades',
      href: '/propiedades',
      icon: 'Building2',
      description: 'Gestiona tus propiedades',
      priority: 1,
      requiredRole: ['super_admin', 'administrador', 'gestor'],
    },
    {
      id: 'edificios',
      label: 'Edificios',
      href: '/edificios',
      icon: 'Building',
      priority: 2,
      requiredRole: ['super_admin', 'administrador', 'gestor'],
    },
    {
      id: 'unidades',
      label: 'Unidades',
      href: '/unidades',
      icon: 'Home',
      priority: 2,
      requiredRole: ['super_admin', 'administrador', 'gestor'],
    },

    // GESTIÓN DE PERSONAS
    {
      id: 'inquilinos',
      label: 'Inquilinos',
      href: '/inquilinos',
      icon: 'Users',
      description: 'Gestiona inquilinos y contratos',
      priority: 1,
      requiredRole: ['super_admin', 'administrador', 'gestor'],
    },
    {
      id: 'contratos',
      label: 'Contratos',
      href: '/contratos',
      icon: 'FileText',
      priority: 1,
      requiredRole: ['super_admin', 'administrador', 'gestor'],
    },

    // FINANZAS (no para operadores ni inquilinos)
    {
      id: 'pagos',
      label: 'Pagos',
      href: '/pagos',
      icon: 'CreditCard',
      priority: 1,
      requiredRole: ['super_admin', 'administrador'],
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      href: '/finanzas',
      icon: 'DollarSign',
      priority: 2,
      requiredRole: ['super_admin', 'administrador'],
      minExperience: 'intermedio',
    },
    {
      id: 'facturacion',
      label: 'Facturación',
      href: '/facturacion',
      icon: 'Receipt',
      priority: 3,
      requiredRole: ['super_admin', 'administrador'],
    },

    // OPERACIONES
    {
      id: 'mantenimiento',
      label: 'Mantenimiento',
      href: '/mantenimiento',
      icon: 'Wrench',
      priority: 1,
      requiredRole: ['super_admin', 'administrador', 'gestor', 'operador'],
    },
    {
      id: 'tareas',
      label: 'Tareas',
      href: '/tareas',
      icon: 'CheckSquare',
      priority: 2,
      requiredRole: ['super_admin', 'administrador', 'gestor', 'operador'],
    },
    {
      id: 'calendario',
      label: 'Calendario',
      href: '/calendario',
      icon: 'Calendar',
      priority: 2,
      requiredRole: ['super_admin', 'administrador', 'gestor', 'operador'],
    },
    {
      id: 'visitas',
      label: 'Visitas',
      href: '/visitas',
      icon: 'Eye',
      priority: 3,
      requiredRole: ['super_admin', 'administrador', 'gestor'],
    },

    // CRM Y VENTAS (solo admin y gestor)
    {
      id: 'crm',
      label: 'CRM',
      href: '/crm',
      icon: 'Users2',
      priority: 3,
      requiredRole: ['super_admin', 'administrador', 'gestor'],
      minExperience: 'intermedio',
    },

    // COMUNIDADES (solo ciertos verticales)
    {
      id: 'comunidades',
      label: 'Comunidades',
      href: '/comunidades',
      icon: 'Building2',
      priority: 3,
      requiredRole: ['super_admin', 'administrador', 'gestor'],
    },

    // REPORTES Y ANALYTICS
    {
      id: 'reportes',
      label: 'Reportes',
      href: '/reportes',
      icon: 'BarChart3',
      priority: 2,
      requiredRole: ['super_admin', 'administrador'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/analytics',
      icon: 'TrendingUp',
      priority: 4,
      requiredRole: ['super_admin', 'administrador'],
      minExperience: 'avanzado',
    },

    // DOCUMENTOS
    {
      id: 'documentos',
      label: 'Documentos',
      href: '/documentos',
      icon: 'FolderOpen',
      priority: 2,
    },

    // CONFIGURACIÓN
    {
      id: 'configuracion',
      label: 'Configuración',
      href: '/configuracion',
      icon: 'Settings',
      priority: 5,
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      href: '/usuarios',
      icon: 'UserCog',
      priority: 3,
      requiredRole: ['super_admin', 'administrador'],
    },
  ];

  // Filtrar por rol
  let filtered = baseNavigation.filter(item => {
    if (item.requiredRole && !item.requiredRole.includes(profile.role)) {
      return false;
    }
    return true;
  });

  // Filtrar por experiencia
  if (profile.experienceLevel) {
    const experienceLevels = ['principiante', 'intermedio', 'avanzado'];
    const userLevel = experienceLevels.indexOf(profile.experienceLevel);

    filtered = filtered.filter(item => {
      if (!item.minExperience) return true;
      const requiredLevel = experienceLevels.indexOf(item.minExperience);
      return userLevel >= requiredLevel;
    });
  }

  // Ordenar por prioridad
  filtered.sort((a, b) => a.priority - b.priority);

  // Limitar según perfil
  const roleKey = profile.role.toUpperCase() as keyof typeof USER_PROFILES;
  const roleConfig = USER_PROFILES[roleKey];
  if (roleConfig?.navigation?.maxItems) {
    filtered = filtered.slice(0, roleConfig.navigation.maxItems);
  }

  return filtered;
};

/**
 * WIDGETS DE DASHBOARD POR ROL
 */
export const getDashboardWidgets = (profile: UserProfile) => {
  const roleKey = profile.role.toUpperCase() as keyof typeof USER_PROFILES;
  const roleConfig = USER_PROFILES[roleKey];
  return roleConfig?.dashboard?.widgets || [];
};

/**
 * ONBOARDING PERSONALIZADO
 */
export const getOnboardingConfig = (profile: UserProfile) => {
  const roleKey = profile.role.toUpperCase() as keyof typeof USER_PROFILES;
  const roleConfig = USER_PROFILES[roleKey];
  return roleConfig?.onboarding || null;
};

/**
 * HELPER: Detectar si usuario necesita ayuda extra
 */
export const needsExtraHelp = (profile: UserProfile): boolean => {
  if (profile.experienceLevel === 'principiante') return true;
  if (profile.techSavviness === 'bajo') return true;
  return false;
};

/**
 * HELPER: Obtener nivel de complejidad UI
 */
export const getUIComplexity = (profile: UserProfile): 'simple' | 'standard' | 'advanced' => {
  if (profile.role === 'super_admin') return 'advanced';
  if (profile.experienceLevel === 'avanzado' && profile.techSavviness === 'alto') {
    return 'advanced';
  }
  if (profile.experienceLevel === 'principiante' || profile.techSavviness === 'bajo') {
    return 'simple';
  }
  return 'standard';
};

/**
 * HELPER: Sugerencias contextuales
 */
export const getContextualHelp = (page: string, profile: UserProfile) => {
  const baseHelp = {
    dashboard: {
      title: 'Dashboard',
      description: 'Vista general de tu actividad',
      tips: [
        'Haz clic en cualquier KPI para ver más detalles',
        'Los datos se actualizan cada 5 minutos',
      ],
    },
    propiedades: {
      title: 'Gestión de Propiedades',
      description: 'Administra todas tus propiedades desde aquí',
      tips: [
        'Usa los filtros para encontrar propiedades rápidamente',
        'Puedes exportar la lista completa',
      ],
    },
    // ... más páginas
  };

  const help = baseHelp[page as keyof typeof baseHelp];

  // Agregar tips extra para principiantes
  if (needsExtraHelp(profile) && help) {
    help.tips.push('💡 ¿Necesitas ayuda? Haz clic en el ícono de chat para asistencia 24/7');
  }

  return help;
};
