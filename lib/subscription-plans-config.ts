/**
 * CONFIGURACIÓN DE PLANES DE SUSCRIPCIÓN Y PERFILES DE CLIENTE
 * 
 * Este archivo define:
 * 1. Perfiles de cliente de Inmova (tipos de empresas/usuarios)
 * 2. Planes de suscripción con módulos incluidos
 * 3. Configuración de onboarding personalizado
 * 4. Reglas de acceso a páginas y funcionalidades
 * 
 * Siguiendo las cursorrules:
 * - Simplicidad sobre complejidad
 * - Código auto-documentado
 * - Seguridad y control de acceso
 */

// ============================================================================
// 1. PERFILES DE CLIENTE - Tipos de empresas que usan Inmova
// ============================================================================

export type ClientProfile = 
  | 'propietario_individual'      // 1-5 propiedades, gestión propia
  | 'inversor_pequeno'            // 5-20 propiedades, semi-profesional
  | 'gestor_profesional'          // API, gestión para terceros
  | 'agencia_inmobiliaria'        // CRM + ventas + alquiler
  | 'administrador_fincas'        // Comunidades + administración
  | 'promotor_inmobiliario'       // Construcción + obra nueva
  | 'empresa_coliving'            // Espacios compartidos
  | 'empresa_str'                 // Short-term rental (Airbnb)
  | 'fondo_inversion';            // Gran cartera, múltiples gestores

export interface ClientProfileConfig {
  id: ClientProfile;
  name: string;
  description: string;
  /** Tamaño típico del portfolio */
  portfolioRange: { min: number; max: number | null };
  /** Verticales de negocio principales */
  primaryVerticals: string[];
  /** Nivel técnico esperado */
  techLevel: 'bajo' | 'medio' | 'alto';
  /** Necesidades principales */
  primaryNeeds: string[];
  /** Planes recomendados */
  recommendedPlans: SubscriptionPlanId[];
  /** Módulos críticos para este perfil */
  criticalModules: string[];
  /** Features destacadas para venderles */
  keyFeatures: string[];
}

export const CLIENT_PROFILES: Record<ClientProfile, ClientProfileConfig> = {
  propietario_individual: {
    id: 'propietario_individual',
    name: 'Propietario Individual',
    description: 'Persona que gestiona sus propias propiedades como inversión',
    portfolioRange: { min: 1, max: 5 },
    primaryVerticals: ['alquiler_tradicional'],
    techLevel: 'bajo',
    primaryNeeds: [
      'Gestión simple de alquileres',
      'Control de pagos de inquilinos',
      'Recordatorios de vencimientos',
      'Documentos organizados',
    ],
    recommendedPlans: ['starter', 'basic'],
    criticalModules: ['dashboard', 'propiedades', 'inquilinos', 'contratos', 'pagos'],
    keyFeatures: [
      'Portal de inquilino incluido',
      'Recordatorios automáticos',
      'Firma digital de contratos',
      'App móvil',
    ],
  },

  inversor_pequeno: {
    id: 'inversor_pequeno',
    name: 'Pequeño Inversor',
    description: 'Inversor con cartera media que busca escalar',
    portfolioRange: { min: 5, max: 20 },
    primaryVerticals: ['alquiler_tradicional', 'str_vacacional'],
    techLevel: 'medio',
    primaryNeeds: [
      'Control financiero detallado',
      'Reportes de rentabilidad',
      'Automatización de cobros',
      'Multi-propiedad eficiente',
    ],
    recommendedPlans: ['professional', 'business'],
    criticalModules: [
      'dashboard', 'propiedades', 'inquilinos', 'contratos', 'pagos',
      'reportes', 'gastos', 'analytics', 'herramientas',
    ],
    keyFeatures: [
      'Calculadora de rentabilidad',
      'Reportes fiscales automáticos',
      'Comparativa de propiedades',
      'Alertas de morosidad',
    ],
  },

  gestor_profesional: {
    id: 'gestor_profesional',
    name: 'Gestor Profesional',
    description: 'Profesional que gestiona propiedades para terceros',
    portfolioRange: { min: 20, max: 100 },
    primaryVerticals: ['alquiler_tradicional', 'str_vacacional', 'coliving'],
    techLevel: 'alto',
    primaryNeeds: [
      'Gestión multi-cliente',
      'Facturación a propietarios',
      'Reportes por propietario',
      'Portal de propietario',
      'API para integraciones',
    ],
    recommendedPlans: ['business', 'enterprise'],
    criticalModules: [
      'dashboard', 'propiedades', 'inquilinos', 'contratos', 'pagos',
      'reportes', 'gastos', 'facturacion', 'analytics', 'crm',
      'api_access', 'multi_empresa',
    ],
    keyFeatures: [
      'Multi-empresa',
      'Portal de propietarios',
      'Facturación automática',
      'API REST completa',
      'White-label disponible',
    ],
  },

  agencia_inmobiliaria: {
    id: 'agencia_inmobiliaria',
    name: 'Agencia Inmobiliaria',
    description: 'Agencia con operaciones de venta y alquiler',
    portfolioRange: { min: 10, max: 200 },
    primaryVerticals: ['alquiler_tradicional', 'comercial'],
    techLevel: 'medio',
    primaryNeeds: [
      'CRM de captación',
      'Gestión de leads',
      'Publicación en portales',
      'Matching inquilino-propiedad',
      'Comisiones y honorarios',
    ],
    recommendedPlans: ['professional', 'business'],
    criticalModules: [
      'dashboard', 'propiedades', 'inquilinos', 'contratos', 'pagos',
      'crm', 'leads', 'marketing', 'portales', 'comisiones',
    ],
    keyFeatures: [
      'CRM inmobiliario integrado',
      'Publicación automática en portales',
      'Matching con IA',
      'Gestión de comisiones',
      'Calendario de visitas',
    ],
  },

  administrador_fincas: {
    id: 'administrador_fincas',
    name: 'Administrador de Fincas',
    description: 'Profesional de administración de comunidades',
    portfolioRange: { min: 5, max: 100 },
    primaryVerticals: ['comunidades', 'alquiler_tradicional'],
    techLevel: 'medio',
    primaryNeeds: [
      'Gestión de comunidades',
      'Cuotas y derramas',
      'Juntas y votaciones',
      'Contabilidad de comunidad',
      'Portal de vecinos',
    ],
    recommendedPlans: ['professional', 'business'],
    criticalModules: [
      'dashboard', 'comunidades', 'cuotas', 'juntas', 'votaciones',
      'contabilidad_comunidad', 'portal_vecinos', 'incidencias',
    ],
    keyFeatures: [
      'Gestión de comunidades',
      'Portal de vecinos',
      'Votaciones online',
      'Contabilidad integrada',
      'Comunicados automáticos',
    ],
  },

  promotor_inmobiliario: {
    id: 'promotor_inmobiliario',
    name: 'Promotor Inmobiliario',
    description: 'Empresa de construcción y promoción',
    portfolioRange: { min: 1, max: 50 },
    primaryVerticals: ['construccion', 'build_to_rent'],
    techLevel: 'alto',
    primaryNeeds: [
      'Gestión de obra',
      'Control de costes',
      'Subcontratación',
      'Entrega de llaves',
      'Post-venta',
    ],
    recommendedPlans: ['business', 'enterprise'],
    criticalModules: [
      'dashboard', 'construccion', 'proyectos', 'costes', 'gantt',
      'subcontratistas', 'entregas', 'post_venta',
    ],
    keyFeatures: [
      'Diagrama de Gantt',
      'Control de costes obra',
      'Marketplace subcontratistas (eWoorker)',
      'Gestión de entregas',
      'Post-venta integrado',
    ],
  },

  empresa_coliving: {
    id: 'empresa_coliving',
    name: 'Empresa de Coliving',
    description: 'Operador de espacios de coliving',
    portfolioRange: { min: 1, max: 30 },
    primaryVerticals: ['coliving', 'room_rental'],
    techLevel: 'alto',
    primaryNeeds: [
      'Gestión de habitaciones',
      'Matching de inquilinos',
      'Eventos y comunidad',
      'Servicios adicionales',
      'Facturación flexible',
    ],
    recommendedPlans: ['professional', 'business'],
    criticalModules: [
      'dashboard', 'habitaciones', 'inquilinos', 'contratos', 'pagos',
      'matching', 'eventos', 'comunidad', 'servicios', 'paquetes',
    ],
    keyFeatures: [
      'Gestión por habitación',
      'Matching de perfiles',
      'Eventos y comunidad',
      'Paquetes de servicios',
      'Facturación todo incluido',
    ],
  },

  empresa_str: {
    id: 'empresa_str',
    name: 'Empresa STR / Vacacional',
    description: 'Operador de alquiler turístico',
    portfolioRange: { min: 3, max: 100 },
    primaryVerticals: ['str_vacacional'],
    techLevel: 'alto',
    primaryNeeds: [
      'Channel manager',
      'Pricing dinámico',
      'Check-in automático',
      'Limpieza coordinada',
      'Reviews y reputación',
    ],
    recommendedPlans: ['professional', 'business', 'enterprise'],
    criticalModules: [
      'dashboard', 'propiedades', 'reservas', 'channel_manager',
      'pricing', 'checkin', 'limpieza', 'reviews', 'housekeeping',
    ],
    keyFeatures: [
      'Channel Manager (Airbnb, Booking)',
      'Pricing dinámico con IA',
      'Check-in automático',
      'Coordinación de limpieza',
      'Gestión de reviews',
    ],
  },

  fondo_inversion: {
    id: 'fondo_inversion',
    name: 'Fondo de Inversión / SOCIMI',
    description: 'Gran cartera institucional',
    portfolioRange: { min: 100, max: null },
    primaryVerticals: ['build_to_rent', 'alquiler_tradicional', 'comercial'],
    techLevel: 'alto',
    primaryNeeds: [
      'Reporting institucional',
      'Multi-gestor',
      'Compliance',
      'API para integración ERP',
      'Business Intelligence',
    ],
    recommendedPlans: ['enterprise'],
    criticalModules: [
      'dashboard', 'propiedades', 'inquilinos', 'contratos', 'pagos',
      'reportes', 'analytics', 'bi', 'compliance', 'api_access',
      'multi_empresa', 'audit_log', 'sso',
    ],
    keyFeatures: [
      'Business Intelligence',
      'Multi-empresa ilimitado',
      'API Enterprise',
      'SSO / SAML',
      'Compliance y auditoría',
      'SLA garantizado',
    ],
  },
};

// ============================================================================
// 2. PLANES DE SUSCRIPCIÓN - Módulos y límites por plan
// ============================================================================

export type SubscriptionPlanId = 
  | 'free'
  | 'starter'
  | 'basic'
  | 'professional'
  | 'business'
  | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  description: string;
  /** Precio mensual (0 = gratis) */
  priceMonthly: number;
  /** Precio anual (descuento ~20%) */
  priceYearly: number;
  /** Límites del plan */
  limits: {
    maxProperties: number;
    maxBuildings: number;
    maxUsers: number;
    maxTenants: number;
    maxDocuments: number;  // GB
    apiCallsPerMonth: number;
  };
  /** Módulos incluidos */
  includedModules: string[];
  /** Features premium incluidas */
  features: {
    portalInquilino: boolean;
    portalPropietario: boolean;
    firmaDigital: boolean;
    reportesAvanzados: boolean;
    apiAccess: boolean;
    multiEmpresa: boolean;
    whiteLabel: boolean;
    soportePrioritario: boolean;
    integraciones: string[];
  };
  /** Color del badge */
  badgeColor: string;
  /** Destacado en pricing */
  highlighted: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    description: 'Perfecto para probar la plataforma',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      maxProperties: 1,
      maxBuildings: 1,
      maxUsers: 1,
      maxTenants: 2,
      maxDocuments: 0.1, // 100MB
      apiCallsPerMonth: 0,
    },
    includedModules: [
      'dashboard',
      'propiedades',
      'inquilinos',
      'contratos',
      'pagos',
    ],
    features: {
      portalInquilino: false,
      portalPropietario: false,
      firmaDigital: false,
      reportesAvanzados: false,
      apiAccess: false,
      multiEmpresa: false,
      whiteLabel: false,
      soportePrioritario: false,
      integraciones: [],
    },
    badgeColor: 'gray',
    highlighted: false,
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Para propietarios individuales',
    priceMonthly: 19,
    priceYearly: 190,
    limits: {
      maxProperties: 5,
      maxBuildings: 3,
      maxUsers: 2,
      maxTenants: 10,
      maxDocuments: 1, // 1GB
      apiCallsPerMonth: 0,
    },
    includedModules: [
      'dashboard',
      'propiedades',
      'inquilinos',
      'contratos',
      'pagos',
      'documentos',
      'mantenimiento',
      'calendario',
      'notificaciones',
    ],
    features: {
      portalInquilino: true,
      portalPropietario: false,
      firmaDigital: false,
      reportesAvanzados: false,
      apiAccess: false,
      multiEmpresa: false,
      whiteLabel: false,
      soportePrioritario: false,
      integraciones: ['email'],
    },
    badgeColor: 'blue',
    highlighted: false,
  },

  basic: {
    id: 'basic',
    name: 'Básico',
    description: 'Para pequeños inversores',
    priceMonthly: 39,
    priceYearly: 390,
    limits: {
      maxProperties: 15,
      maxBuildings: 10,
      maxUsers: 3,
      maxTenants: 30,
      maxDocuments: 5, // 5GB
      apiCallsPerMonth: 1000,
    },
    includedModules: [
      'dashboard',
      'propiedades',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'documentos',
      'mantenimiento',
      'calendario',
      'notificaciones',
      'gastos',
      'reportes_basicos',
      'herramientas',
    ],
    features: {
      portalInquilino: true,
      portalPropietario: false,
      firmaDigital: true,
      reportesAvanzados: false,
      apiAccess: false,
      multiEmpresa: false,
      whiteLabel: false,
      soportePrioritario: false,
      integraciones: ['email', 'stripe'],
    },
    badgeColor: 'green',
    highlighted: false,
  },

  professional: {
    id: 'professional',
    name: 'Profesional',
    description: 'Para gestores y pequeñas agencias',
    priceMonthly: 79,
    priceYearly: 790,
    limits: {
      maxProperties: 50,
      maxBuildings: 30,
      maxUsers: 10,
      maxTenants: 100,
      maxDocuments: 20, // 20GB
      apiCallsPerMonth: 10000,
    },
    includedModules: [
      'dashboard',
      'propiedades',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'documentos',
      'mantenimiento',
      'calendario',
      'notificaciones',
      'gastos',
      'reportes',
      'analytics',
      'herramientas',
      'crm',
      'proveedores',
      'facturacion',
      'visitas',
      'chat',
      // Verticales
      'str_basico',
      'coliving_basico',
      'comunidades_basico',
    ],
    features: {
      portalInquilino: true,
      portalPropietario: true,
      firmaDigital: true,
      reportesAvanzados: true,
      apiAccess: true,
      multiEmpresa: false,
      whiteLabel: false,
      soportePrioritario: true,
      integraciones: ['email', 'stripe', 'gmail', 'calendar', 'contasimple'],
    },
    badgeColor: 'purple',
    highlighted: true, // Más vendido
  },

  business: {
    id: 'business',
    name: 'Business',
    description: 'Para agencias y gestores profesionales',
    priceMonthly: 149,
    priceYearly: 1490,
    limits: {
      maxProperties: 200,
      maxBuildings: 100,
      maxUsers: 25,
      maxTenants: 500,
      maxDocuments: 100, // 100GB
      apiCallsPerMonth: 100000,
    },
    includedModules: [
      // Todos los de Professional
      'dashboard',
      'propiedades',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'documentos',
      'mantenimiento',
      'calendario',
      'notificaciones',
      'gastos',
      'reportes',
      'analytics',
      'herramientas',
      'crm',
      'proveedores',
      'facturacion',
      'visitas',
      'chat',
      // Verticales completas
      'str_completo',
      'coliving_completo',
      'comunidades_completo',
      'construccion',
      // Avanzados
      'automatizaciones',
      'ia_asistente',
      'bi_dashboard',
      'webhooks',
      'api_completa',
      'audit_log',
    ],
    features: {
      portalInquilino: true,
      portalPropietario: true,
      firmaDigital: true,
      reportesAvanzados: true,
      apiAccess: true,
      multiEmpresa: true,
      whiteLabel: false,
      soportePrioritario: true,
      integraciones: [
        'email', 'stripe', 'gmail', 'calendar', 'contasimple',
        'holded', 'alegra', 'docusign', 'signaturit', 'twilio',
        'airbnb', 'booking', 'vrbo',
      ],
    },
    badgeColor: 'amber',
    highlighted: false,
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes carteras y SOCIMIs',
    priceMonthly: 499,
    priceYearly: 4990,
    limits: {
      maxProperties: -1, // Ilimitado
      maxBuildings: -1,
      maxUsers: -1,
      maxTenants: -1,
      maxDocuments: -1, // Ilimitado
      apiCallsPerMonth: -1,
    },
    includedModules: [
      // TODOS los módulos
      '*',
    ],
    features: {
      portalInquilino: true,
      portalPropietario: true,
      firmaDigital: true,
      reportesAvanzados: true,
      apiAccess: true,
      multiEmpresa: true,
      whiteLabel: true,
      soportePrioritario: true,
      integraciones: ['*'], // Todas
    },
    badgeColor: 'rose',
    highlighted: false,
  },
};

// ============================================================================
// 3. MÓDULOS POR PLAN - Mapeo detallado
// ============================================================================

export const MODULES_BY_PLAN: Record<SubscriptionPlanId, string[]> = {
  free: [
    'dashboard',
    'propiedades',
    'inquilinos',
    'contratos',
    'pagos',
  ],
  starter: [
    'dashboard',
    'propiedades',
    'inquilinos',
    'contratos',
    'pagos',
    'documentos',
    'mantenimiento',
    'calendario',
  ],
  basic: [
    'dashboard',
    'propiedades',
    'edificios',
    'unidades',
    'inquilinos',
    'contratos',
    'pagos',
    'documentos',
    'mantenimiento',
    'calendario',
    'gastos',
    'reportes_basicos',
    'herramientas',
  ],
  professional: [
    'dashboard',
    'propiedades',
    'edificios',
    'unidades',
    'inquilinos',
    'contratos',
    'pagos',
    'documentos',
    'mantenimiento',
    'calendario',
    'gastos',
    'reportes',
    'analytics',
    'herramientas',
    'crm',
    'proveedores',
    'facturacion',
    'visitas',
    'chat',
    'str_basico',
    'coliving_basico',
    'comunidades_basico',
  ],
  business: [
    // Professional +
    'dashboard',
    'propiedades',
    'edificios',
    'unidades',
    'inquilinos',
    'contratos',
    'pagos',
    'documentos',
    'mantenimiento',
    'calendario',
    'gastos',
    'reportes',
    'analytics',
    'herramientas',
    'crm',
    'proveedores',
    'facturacion',
    'visitas',
    'chat',
    // Verticales completas
    'str_completo',
    'coliving_completo',
    'comunidades_completo',
    'construccion',
    // Avanzados
    'automatizaciones',
    'ia_asistente',
    'bi_dashboard',
    'webhooks',
    'api_completa',
    'audit_log',
    'multi_empresa',
  ],
  enterprise: [
    '*', // Todos los módulos
  ],
};

// ============================================================================
// 4. RUTAS POR MÓDULO - Qué rutas corresponden a cada módulo
// ============================================================================

export const ROUTES_BY_MODULE: Record<string, string[]> = {
  // Core
  dashboard: ['/dashboard', '/'],
  propiedades: ['/propiedades', '/propiedades/*'],
  edificios: ['/edificios', '/edificios/*'],
  unidades: ['/unidades', '/unidades/*', '/garajes-trasteros'],
  inquilinos: ['/inquilinos', '/inquilinos/*'],
  contratos: ['/contratos', '/contratos/*'],
  pagos: ['/pagos', '/pagos/*', '/dashboard/payments'],
  
  // Gestión
  documentos: ['/documentos', '/documentos/*', '/dashboard/documents'],
  mantenimiento: ['/mantenimiento', '/mantenimiento/*', '/dashboard/maintenance'],
  calendario: ['/calendario'],
  gastos: ['/gastos', '/gastos/*'],
  proveedores: ['/proveedores', '/proveedores/*'],
  
  // Financiero
  reportes_basicos: ['/reportes/basicos'],
  reportes: ['/reportes', '/reportes/*'],
  analytics: ['/analytics', '/analytics/*', '/dashboard/analytics'],
  facturacion: ['/facturacion', '/facturacion/*'],
  
  // CRM
  crm: ['/crm', '/crm/*'],
  visitas: ['/visitas', '/visitas/*'],
  chat: ['/chat', '/chat/*', '/dashboard/messages'],
  
  // Herramientas
  herramientas: ['/dashboard/herramientas', '/dashboard/herramientas/*'],
  
  // Verticales STR
  str_basico: ['/str', '/str/reservas'],
  str_completo: ['/str', '/str/*', '/housekeeping'],
  
  // Verticales Coliving
  coliving_basico: ['/coliving', '/coliving/habitaciones'],
  coliving_completo: ['/coliving', '/coliving/*'],
  
  // Verticales Comunidades
  comunidades_basico: ['/comunidades'],
  comunidades_completo: ['/comunidades', '/comunidades/*'],
  
  // Construcción
  construccion: ['/construccion', '/construccion/*', '/ewoorker/*'],
  
  // Avanzados
  automatizaciones: ['/automatizaciones', '/automatizaciones/*'],
  ia_asistente: ['/asistente-ia', '/ia/*'],
  bi_dashboard: ['/bi', '/bi/*'],
  webhooks: ['/admin/webhooks'],
  api_completa: ['/admin/api-keys', '/api-docs'],
  audit_log: ['/admin/audit'],
  multi_empresa: ['/admin/empresas', '/admin/clientes'],
  
  // Portal inquilino (siempre accesible para inquilinos)
  portal_inquilino: ['/portal', '/portal/*'],
  
  // Portal propietario
  portal_propietario: ['/propietario', '/propietario/*'],
};

// ============================================================================
// 5. HELPERS - Funciones de utilidad
// ============================================================================

/**
 * Verifica si un plan incluye un módulo específico
 */
export function planIncludesModule(planId: SubscriptionPlanId, moduleId: string): boolean {
  const planModules = MODULES_BY_PLAN[planId];
  if (!planModules) return false;
  
  // Enterprise tiene todo
  if (planModules.includes('*')) return true;
  
  return planModules.includes(moduleId);
}

/**
 * Verifica si un plan permite acceder a una ruta específica
 */
export function planAllowsRoute(planId: SubscriptionPlanId, route: string): boolean {
  const planModules = MODULES_BY_PLAN[planId];
  if (!planModules) return false;
  
  // Enterprise tiene todo
  if (planModules.includes('*')) return true;
  
  // Buscar si algún módulo del plan incluye esta ruta
  for (const moduleId of planModules) {
    const moduleRoutes = ROUTES_BY_MODULE[moduleId];
    if (!moduleRoutes) continue;
    
    for (const moduleRoute of moduleRoutes) {
      // Coincidencia exacta
      if (moduleRoute === route) return true;
      
      // Wildcard
      if (moduleRoute.endsWith('/*')) {
        const baseRoute = moduleRoute.slice(0, -2);
        if (route.startsWith(baseRoute)) return true;
      }
    }
  }
  
  return false;
}

/**
 * Obtiene los módulos disponibles para un plan
 */
export function getModulesForPlan(planId: SubscriptionPlanId): string[] {
  const modules = MODULES_BY_PLAN[planId];
  if (!modules) return [];
  
  // Si es Enterprise, devolver todos los módulos conocidos
  if (modules.includes('*')) {
    return Object.keys(ROUTES_BY_MODULE);
  }
  
  return modules;
}

/**
 * Obtiene el plan recomendado para un perfil de cliente
 */
export function getRecommendedPlan(profileId: ClientProfile): SubscriptionPlanId {
  const profile = CLIENT_PROFILES[profileId];
  if (!profile) return 'starter';
  
  return profile.recommendedPlans[0] || 'starter';
}

/**
 * Compara dos planes y devuelve las diferencias
 */
export function comparePlans(
  planA: SubscriptionPlanId, 
  planB: SubscriptionPlanId
): {
  addedModules: string[];
  addedFeatures: string[];
  limitUpgrades: Record<string, { from: number; to: number }>;
} {
  const a = SUBSCRIPTION_PLANS[planA];
  const b = SUBSCRIPTION_PLANS[planB];
  
  const modulesA = new Set(MODULES_BY_PLAN[planA]);
  const modulesB = new Set(MODULES_BY_PLAN[planB]);
  
  const addedModules = [...modulesB].filter(m => !modulesA.has(m) && m !== '*');
  
  const addedFeatures: string[] = [];
  if (!a.features.portalInquilino && b.features.portalInquilino) addedFeatures.push('Portal de Inquilino');
  if (!a.features.portalPropietario && b.features.portalPropietario) addedFeatures.push('Portal de Propietario');
  if (!a.features.firmaDigital && b.features.firmaDigital) addedFeatures.push('Firma Digital');
  if (!a.features.reportesAvanzados && b.features.reportesAvanzados) addedFeatures.push('Reportes Avanzados');
  if (!a.features.apiAccess && b.features.apiAccess) addedFeatures.push('Acceso API');
  if (!a.features.multiEmpresa && b.features.multiEmpresa) addedFeatures.push('Multi-Empresa');
  if (!a.features.whiteLabel && b.features.whiteLabel) addedFeatures.push('White Label');
  
  const limitUpgrades: Record<string, { from: number; to: number }> = {};
  if (b.limits.maxProperties > a.limits.maxProperties) {
    limitUpgrades.propiedades = { from: a.limits.maxProperties, to: b.limits.maxProperties };
  }
  if (b.limits.maxUsers > a.limits.maxUsers) {
    limitUpgrades.usuarios = { from: a.limits.maxUsers, to: b.limits.maxUsers };
  }
  
  return { addedModules, addedFeatures, limitUpgrades };
}
