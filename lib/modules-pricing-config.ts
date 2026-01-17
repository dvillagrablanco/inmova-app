/**
 * CONFIGURACIÓN UNIFICADA DE MÓDULOS Y PLANES - INMOVA 2026
 * 
 * Este archivo sincroniza:
 * - lib/pricing-config.ts (planes comerciales)
 * - lib/modules-service.ts (catálogo de módulos)
 * 
 * PLANES DISPONIBLES:
 * 1. STARTER (€35/mes) - Propietarios particulares (hasta 5 propiedades)
 * 2. PROFESSIONAL (€59/mes) - Pequeñas agencias (hasta 25 propiedades)
 * 3. BUSINESS (€129/mes) - Gestoras profesionales (hasta 100 propiedades)
 * 4. ENTERPRISE (€299/mes) - Grandes empresas (ilimitado)
 * 5. OWNER (€0/mes) - Propietarios de la plataforma (todo incluido sin límite)
 */

export type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise' | 'owner';

/**
 * Definición de qué módulos incluye cada plan
 * Los módulos se organizan por categorías para mejor comprensión
 */
export const MODULES_BY_PLAN: Record<PlanTier, {
  core: string[];           // Siempre incluidos, no se pueden desactivar
  included: string[];       // Incluidos en el plan, se pueden desactivar
  addon: string[];          // Disponibles como add-on de pago
  unavailable: string[];    // No disponibles en este plan (requiere upgrade)
}> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // STARTER (€35/mes) - Propietarios particulares
  // Hasta 5 propiedades, 1 usuario, 5 firmas/mes
  // ═══════════════════════════════════════════════════════════════════════════
  starter: {
    core: [
      'dashboard',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'mantenimiento',
      'calendario',
      'chat',
    ],
    included: [
      'documentos',
      'notificaciones',
      'usuarios',
      'configuracion',
    ],
    addon: [
      // Funcionalidades que pueden comprar como add-on
      'reportes',              // €15/mes - Reportes financieros básicos
      'proveedores',           // €10/mes - Gestión de proveedores
      'gastos',                // €10/mes - Control de gastos
      'portal_inquilino',      // €15/mes - Portal autoservicio
      'galerias',              // €8/mes - Galerías multimedia
      'recordatorios_auto',    // €8/mes - Recordatorios automáticos
    ],
    unavailable: [
      // Requieren upgrade a plan superior
      'contabilidad', 'analytics', 'bi', 'crm', 'legal', 'marketplace',
      'sms', 'votaciones', 'reuniones', 'auditoria', 'portal_propietario',
      'portal_proveedor', 'screening', 'valoraciones', 'publicaciones',
      'energia', 'esg', 'tours_virtuales', 'pricing_dinamico', 'iot',
      'blockchain', 'ai_assistant', 'economia_circular', 'comunidad_social',
      'seguridad_compliance', 'str_listings', 'str_bookings', 'str_channels',
      'flipping_projects', 'construction_projects', 'professional_projects',
      'room_rental', 'alquiler_comercial', 'mantenimiento_pro',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFESSIONAL (€59/mes) - Pequeñas agencias y propietarios activos
  // Hasta 25 propiedades, 3 usuarios, 20 firmas/mes
  // ═══════════════════════════════════════════════════════════════════════════
  professional: {
    core: [
      'dashboard',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'mantenimiento',
      'calendario',
      'chat',
    ],
    included: [
      // Todo lo de Starter +
      'documentos',
      'notificaciones',
      'usuarios',
      'configuracion',
      // Nuevos en Professional
      'proveedores',
      'gastos',
      'reportes',
      'incidencias',
      'anuncios',
      'reservas',
      'galerias',
      'portal_inquilino',
      // Verticales básicas
      'str_listings',
      'str_bookings',
      'flipping_projects',
      'room_rental',
      'professional_projects',
      'alquiler_comercial',
      // Nuevos módulos estratégicos
      'tours_virtuales',
      'ai_assistant',
      'economia_circular',
      'comunidad_social',
      'marketplace',
    ],
    addon: [
      // Funcionalidades disponibles como add-on
      'contabilidad',          // €30/mes - Integración contable
      'analytics',             // €25/mes - Analytics básico
      'crm',                   // €35/mes - CRM básico
      'screening',             // €20/mes - Verificación inquilinos
      'valoraciones',          // €20/mes - Valoraciones IA
      'publicaciones',         // €25/mes - Multi-portal
      'whitelabel_basic',      // €35/mes - White-label básico
      'api_access',            // €49/mes - Acceso API
      'pricing_dinamico',      // €45/mes - Pricing IA
      'esg',                   // €50/mes - ESG básico
    ],
    unavailable: [
      // Requieren upgrade a Business/Enterprise
      'bi', 'legal', 'sms', 'votaciones', 'reuniones', 'auditoria',
      'portal_propietario', 'portal_proveedor', 'energia', 'iot',
      'blockchain', 'seguridad_compliance', 'str_channels',
      'construction_projects', 'mantenimiento_pro',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS (€129/mes) - Gestoras profesionales y agencias medianas
  // Hasta 100 propiedades, 10 usuarios, 50 firmas/mes
  // ═══════════════════════════════════════════════════════════════════════════
  business: {
    core: [
      'dashboard',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'mantenimiento',
      'calendario',
      'chat',
    ],
    included: [
      // Todo lo de Professional +
      'documentos',
      'notificaciones',
      'usuarios',
      'configuracion',
      'proveedores',
      'gastos',
      'reportes',
      'incidencias',
      'anuncios',
      'reservas',
      'galerias',
      'portal_inquilino',
      'str_listings',
      'str_bookings',
      'flipping_projects',
      'room_rental',
      'professional_projects',
      'alquiler_comercial',
      'tours_virtuales',
      'ai_assistant',
      'economia_circular',
      'comunidad_social',
      'marketplace',
      // Nuevos en Business
      'contabilidad',
      'analytics',
      'bi',
      'crm',
      'legal',
      'screening',
      'valoraciones',
      'publicaciones',
      'energia',
      'votaciones',
      'reuniones',
      'portal_propietario',
      'portal_proveedor',
      'str_channels',
      'mantenimiento_pro',
      'api_access',
    ],
    addon: [
      // Add-ons premium disponibles
      'whitelabel_full',       // €99/mes - White-label completo
      'pricing_dinamico',      // €45/mes - Pricing IA
      'iot',                   // €75/mes - Edificios inteligentes
      'esg',                   // €50/mes - ESG completo
      'blockchain',            // €100/mes - Tokenización
      'construction_projects', // €50/mes - Proyectos construcción
      'seguridad_compliance',  // €60/mes - Compliance avanzado
      'dedicated_support',     // €99/mes - Soporte dedicado
    ],
    unavailable: [
      // Solo en Enterprise
      'sms', 'auditoria',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE (€299/mes) - Grandes empresas, SOCIMIs, Fondos
  // Propiedades ilimitadas, usuarios ilimitados, firmas ilimitadas
  // ═══════════════════════════════════════════════════════════════════════════
  enterprise: {
    core: [
      'dashboard',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'mantenimiento',
      'calendario',
      'chat',
    ],
    included: [
      // TODOS los módulos incluidos sin excepción
      'documentos', 'notificaciones', 'usuarios', 'configuracion',
      'proveedores', 'gastos', 'reportes', 'incidencias', 'anuncios',
      'reservas', 'galerias', 'portal_inquilino', 'str_listings',
      'str_bookings', 'flipping_projects', 'room_rental',
      'professional_projects', 'alquiler_comercial', 'tours_virtuales',
      'ai_assistant', 'economia_circular', 'comunidad_social',
      'marketplace', 'contabilidad', 'analytics', 'bi', 'crm', 'legal',
      'screening', 'valoraciones', 'publicaciones', 'energia',
      'votaciones', 'reuniones', 'portal_propietario', 'portal_proveedor',
      'str_channels', 'mantenimiento_pro', 'api_access', 'whitelabel_full',
      'pricing_dinamico', 'iot', 'esg', 'blockchain', 'construction_projects',
      'seguridad_compliance', 'dedicated_support', 'sms', 'auditoria',
    ],
    addon: [],  // No hay add-ons - todo está incluido
    unavailable: [],  // Nada está bloqueado
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OWNER (€0/mes) - Propietarios de la plataforma
  // Todo incluido sin ningún límite, acceso total a todas las funcionalidades
  // ═══════════════════════════════════════════════════════════════════════════
  owner: {
    core: [
      'dashboard',
      'edificios',
      'unidades',
      'inquilinos',
      'contratos',
      'pagos',
      'mantenimiento',
      'calendario',
      'chat',
    ],
    included: [
      // ABSOLUTAMENTE TODO incluido sin límites
      'documentos', 'notificaciones', 'usuarios', 'configuracion',
      'proveedores', 'gastos', 'reportes', 'incidencias', 'anuncios',
      'reservas', 'galerias', 'portal_inquilino', 'str_listings',
      'str_bookings', 'flipping_projects', 'room_rental',
      'professional_projects', 'alquiler_comercial', 'tours_virtuales',
      'ai_assistant', 'economia_circular', 'comunidad_social',
      'marketplace', 'contabilidad', 'analytics', 'bi', 'crm', 'legal',
      'screening', 'valoraciones', 'publicaciones', 'energia',
      'votaciones', 'reuniones', 'portal_propietario', 'portal_proveedor',
      'str_channels', 'mantenimiento_pro', 'api_access', 'whitelabel_full',
      'pricing_dinamico', 'iot', 'esg', 'blockchain', 'construction_projects',
      'seguridad_compliance', 'dedicated_support', 'sms', 'auditoria',
      // Módulos exclusivos de administración de plataforma
      'admin_platform',
      'admin_companies',
      'admin_billing',
      'admin_analytics_global',
    ],
    addon: [],
    unavailable: [],
  },
};

/**
 * Precios de módulos como Add-ons (€/mes)
 * Cuando un módulo está en la lista de "addon" de un plan,
 * este es el precio que debe pagar para activarlo
 */
export const MODULE_ADDON_PRICES: Record<string, {
  monthlyPrice: number;
  annualPrice: number;  // 2 meses gratis
  description: string;
  category: 'feature' | 'vertical' | 'premium' | 'integration';
}> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDADES BÁSICAS (€8-15/mes)
  // ═══════════════════════════════════════════════════════════════════════════
  recordatorios_auto: {
    monthlyPrice: 8,
    annualPrice: 80,
    description: 'Recordatorios automáticos de pagos, vencimientos y mantenimientos',
    category: 'feature',
  },
  galerias: {
    monthlyPrice: 8,
    annualPrice: 80,
    description: 'Galerías multimedia con fotos y vídeos de propiedades',
    category: 'feature',
  },
  gastos: {
    monthlyPrice: 10,
    annualPrice: 100,
    description: 'Control y categorización de gastos operativos',
    category: 'feature',
  },
  proveedores: {
    monthlyPrice: 10,
    annualPrice: 100,
    description: 'Gestión completa de proveedores de servicios',
    category: 'feature',
  },
  reportes: {
    monthlyPrice: 15,
    annualPrice: 150,
    description: 'Informes financieros detallados y exportables',
    category: 'feature',
  },
  portal_inquilino: {
    monthlyPrice: 15,
    annualPrice: 150,
    description: 'Portal de autoservicio para inquilinos',
    category: 'feature',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDADES AVANZADAS (€20-35/mes)
  // ═══════════════════════════════════════════════════════════════════════════
  screening: {
    monthlyPrice: 20,
    annualPrice: 200,
    description: 'Verificación de solvencia y scoring de inquilinos',
    category: 'feature',
  },
  valoraciones: {
    monthlyPrice: 20,
    annualPrice: 200,
    description: 'Valoraciones automáticas de propiedades con IA',
    category: 'feature',
  },
  publicaciones: {
    monthlyPrice: 25,
    annualPrice: 250,
    description: 'Publicación automática en portales inmobiliarios',
    category: 'integration',
  },
  analytics: {
    monthlyPrice: 25,
    annualPrice: 250,
    description: 'Analytics avanzado con predicciones y tendencias',
    category: 'feature',
  },
  contabilidad: {
    monthlyPrice: 30,
    annualPrice: 300,
    description: 'Integración con A3, Sage, Holded y más',
    category: 'integration',
  },
  crm: {
    monthlyPrice: 35,
    annualPrice: 350,
    description: 'CRM completo con pipeline de ventas y leads',
    category: 'feature',
  },
  whitelabel_basic: {
    monthlyPrice: 35,
    annualPrice: 350,
    description: 'Tu marca, colores y logo personalizados',
    category: 'premium',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULOS PREMIUM (€45-100/mes)
  // ═══════════════════════════════════════════════════════════════════════════
  pricing_dinamico: {
    monthlyPrice: 45,
    annualPrice: 450,
    description: 'Optimización de precios con Machine Learning',
    category: 'premium',
  },
  api_access: {
    monthlyPrice: 49,
    annualPrice: 490,
    description: 'API REST completa para integraciones personalizadas',
    category: 'premium',
  },
  esg: {
    monthlyPrice: 50,
    annualPrice: 500,
    description: 'Huella de carbono, certificaciones verdes, reportes CSRD',
    category: 'premium',
  },
  construction_projects: {
    monthlyPrice: 50,
    annualPrice: 500,
    description: 'Gestión de obra nueva y promoción inmobiliaria',
    category: 'vertical',
  },
  seguridad_compliance: {
    monthlyPrice: 60,
    annualPrice: 600,
    description: 'Verificación biométrica, GDPR automático, detección de fraude',
    category: 'premium',
  },
  iot: {
    monthlyPrice: 75,
    annualPrice: 750,
    description: 'Integración con cerraduras, termostatos y sensores IoT',
    category: 'premium',
  },
  whitelabel_full: {
    monthlyPrice: 99,
    annualPrice: 990,
    description: 'Tu dominio, app móvil y emails totalmente personalizados',
    category: 'premium',
  },
  dedicated_support: {
    monthlyPrice: 99,
    annualPrice: 990,
    description: 'Account manager dedicado + soporte 24/7 + formación mensual',
    category: 'premium',
  },
  blockchain: {
    monthlyPrice: 100,
    annualPrice: 1000,
    description: 'Tokenización de propiedades, inversión fraccionada, Smart Contracts',
    category: 'premium',
  },
};

/**
 * Información de planes para mostrar en UI
 */
export const PLAN_INFO: Record<PlanTier, {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  maxProperties: number | 'unlimited';
  maxUsers: number | 'unlimited';
  signaturesIncluded: number | 'unlimited';
  storageIncluded: string;
  popular?: boolean;
  badge?: string;
}> = {
  starter: {
    name: 'Starter',
    description: 'Perfecto para propietarios particulares',
    monthlyPrice: 35,
    annualPrice: 350,
    maxProperties: 5,
    maxUsers: 1,
    signaturesIncluded: 5,
    storageIncluded: '2GB',
  },
  professional: {
    name: 'Profesional',
    description: 'Para propietarios activos y pequeñas agencias',
    monthlyPrice: 59,
    annualPrice: 590,
    maxProperties: 25,
    maxUsers: 3,
    signaturesIncluded: 20,
    storageIncluded: '10GB',
    popular: true,
  },
  business: {
    name: 'Business',
    description: 'Para gestoras profesionales y agencias',
    monthlyPrice: 129,
    annualPrice: 1290,
    maxProperties: 100,
    maxUsers: 10,
    signaturesIncluded: 50,
    storageIncluded: '50GB',
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Para grandes empresas y SOCIMIs',
    monthlyPrice: 299,
    annualPrice: 2990,
    maxProperties: 'unlimited',
    maxUsers: 'unlimited',
    signaturesIncluded: 'unlimited',
    storageIncluded: 'Ilimitado',
    badge: 'PREMIUM',
  },
  owner: {
    name: 'Owner',
    description: 'Propietarios de la plataforma - Todo incluido',
    monthlyPrice: 0,
    annualPrice: 0,
    maxProperties: 'unlimited',
    maxUsers: 'unlimited',
    signaturesIncluded: 'unlimited',
    storageIncluded: 'Ilimitado',
    badge: 'INTERNO',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES UTILITARIAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verifica si un módulo está incluido en un plan (sin necesidad de add-on)
 */
export function isModuleIncludedInPlan(moduloCodigo: string, planTier: PlanTier): boolean {
  const plan = MODULES_BY_PLAN[planTier];
  return plan.core.includes(moduloCodigo) || plan.included.includes(moduloCodigo);
}

/**
 * Verifica si un módulo está disponible como add-on en un plan
 */
export function isModuleAvailableAsAddon(moduloCodigo: string, planTier: PlanTier): boolean {
  const plan = MODULES_BY_PLAN[planTier];
  return plan.addon.includes(moduloCodigo);
}

/**
 * Verifica si un módulo está bloqueado (requiere upgrade)
 */
export function isModuleUnavailable(moduloCodigo: string, planTier: PlanTier): boolean {
  const plan = MODULES_BY_PLAN[planTier];
  return plan.unavailable.includes(moduloCodigo);
}

/**
 * Obtiene el precio de un módulo como add-on
 */
export function getModuleAddonPrice(moduloCodigo: string): { monthly: number; annual: number } | null {
  const addon = MODULE_ADDON_PRICES[moduloCodigo];
  if (!addon) return null;
  return { monthly: addon.monthlyPrice, annual: addon.annualPrice };
}

/**
 * Obtiene todos los módulos disponibles para un plan (incluidos + add-ons)
 */
export function getAvailableModulesForPlan(planTier: PlanTier): string[] {
  const plan = MODULES_BY_PLAN[planTier];
  return [...plan.core, ...plan.included, ...plan.addon];
}

/**
 * Obtiene los add-ons disponibles para un plan con sus precios
 */
export function getAddonsForPlan(planTier: PlanTier): Array<{
  codigo: string;
  nombre: string;
  precio: number;
  descripcion: string;
}> {
  const plan = MODULES_BY_PLAN[planTier];
  return plan.addon
    .filter(codigo => MODULE_ADDON_PRICES[codigo])
    .map(codigo => ({
      codigo,
      nombre: MODULE_ADDON_PRICES[codigo].description.split(' - ')[0] || codigo,
      precio: MODULE_ADDON_PRICES[codigo].monthlyPrice,
      descripcion: MODULE_ADDON_PRICES[codigo].description,
    }));
}

/**
 * Calcula el precio total de un plan con add-ons seleccionados
 */
export function calculateTotalPrice(
  planTier: PlanTier,
  addons: string[],
  interval: 'monthly' | 'annual' = 'monthly'
): number {
  const planInfo = PLAN_INFO[planTier];
  const basePrice = interval === 'annual' ? planInfo.annualPrice : planInfo.monthlyPrice;
  
  const addonsPrice = addons.reduce((total, addonCode) => {
    const addonInfo = MODULE_ADDON_PRICES[addonCode];
    if (!addonInfo) return total;
    return total + (interval === 'annual' ? addonInfo.annualPrice : addonInfo.monthlyPrice);
  }, 0);
  
  return basePrice + addonsPrice;
}

/**
 * Determina el estado de un módulo para un plan específico
 */
export function getModuleStatus(moduloCodigo: string, planTier: PlanTier): 
  'core' | 'included' | 'addon' | 'unavailable' {
  const plan = MODULES_BY_PLAN[planTier];
  
  if (plan.core.includes(moduloCodigo)) return 'core';
  if (plan.included.includes(moduloCodigo)) return 'included';
  if (plan.addon.includes(moduloCodigo)) return 'addon';
  return 'unavailable';
}
