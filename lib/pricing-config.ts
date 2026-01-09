/**
 * Configuración centralizada de precios y planes de suscripción INMOVA
 * Estrategia de Precios 2026 - ARQUITECTURA ACTUALIZADA
 * 
 * SINCRONIZADO CON:
 * - Landing page: /app/landing/precios/page.tsx
 * - Seed de add-ons: /prisma/seed-addons.ts
 * - Panel admin: /app/admin/addons/page.tsx
 * 
 * ARQUITECTURA:
 * - 4 PLANES principales (Starter, Profesional, Business, Enterprise)
 * - 3 CATEGORÍAS de add-ons (usage, feature, premium)
 * - Pricing modular: plan base + add-ons opcionales
 */

export type PricingInterval = 'monthly' | 'annual';

export interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
  badge?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: 'starter' | 'professional' | 'business' | 'enterprise';
  description: string;
  
  // Precios
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number;
  
  // Límites
  maxProperties: number | 'unlimited';
  maxUsers: number | 'unlimited';
  
  // Incluidos
  signaturesIncluded: number | 'unlimited';
  storageIncluded: string;
  
  // Características
  features: PricingFeature[];
  
  // Destacados
  popular?: boolean;
  newFeature?: string;
  
  // IDs de Stripe
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  
  // Metadata
  cta: string;
  targetAudience: string[];
  killerFeature?: string;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  category: 'usage' | 'feature' | 'premium';
  monthlyPrice: number;
  annualPrice?: number;
  units?: number;
  unitType?: string;
  stripePriceId?: string;
  availableFor: string[];
  includedIn: string[];
  highlighted?: boolean;
}

export interface PromoCampaign {
  id: string;
  code: string;
  name: string;
  description: string;
  targetPlan: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  duration: number;
  maxUses?: number;
  validFrom: Date;
  validUntil: Date;
  targetAudience: string;
  message: string;
}

/**
 * PLANES DE SUSCRIPCIÓN - INMOVA 2026
 * Sincronizado con /app/landing/precios/page.tsx
 */
export const PRICING_PLANS: Record<string, PricingPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tier: 'starter',
    description: 'Perfecto para propietarios particulares',
    
    monthlyPrice: 35,
    annualPrice: 350,
    annualSavings: 70, // 2 meses gratis
    
    maxProperties: 5,
    maxUsers: 1,
    signaturesIncluded: 5,
    storageIncluded: '2GB',
    
    features: [
      { text: 'Hasta 5 propiedades', included: true },
      { text: 'Gestión básica de inquilinos', included: true },
      { text: 'Contratos simples', included: true },
      { text: '5 firmas digitales/mes', included: true },
      { text: '2GB almacenamiento', included: true },
      { text: 'Soporte por email', included: true },
      { text: 'Firma digital avanzada', included: false, badge: 'ADD-ON' },
      { text: 'Reportes avanzados', included: false, badge: 'ADD-ON' },
    ],
    
    cta: 'Empezar gratis',
    targetAudience: ['Propietario Particular', 'Inversor Pequeño'],
    killerFeature: 'El plan más económico con todo lo esencial'
  },
  
  professional: {
    id: 'professional',
    name: 'Profesional',
    tier: 'professional',
    description: 'Para propietarios activos y pequeñas agencias',
    
    monthlyPrice: 59,
    annualPrice: 590,
    annualSavings: 118,
    
    maxProperties: 25,
    maxUsers: 3,
    signaturesIncluded: 20,
    storageIncluded: '10GB',
    
    features: [
      { text: 'Hasta 25 propiedades', included: true },
      { text: 'Gestión avanzada de inquilinos', included: true },
      { text: '20 firmas digitales/mes', included: true, highlight: true },
      { text: '10GB almacenamiento', included: true },
      { text: 'Cobro automático de rentas', included: true },
      { text: 'Informes financieros', included: true },
      { text: 'Recordatorios automáticos', included: true },
      { text: 'Soporte prioritario', included: true },
      { text: 'White-label', included: false, badge: 'ADD-ON' },
      { text: 'API Access', included: false, badge: 'ADD-ON' },
    ],
    
    popular: true,
    newFeature: '20 firmas digitales incluidas',
    cta: 'Probar 30 días gratis',
    targetAudience: ['Propietario Activo', 'Pequeña Agencia', 'Gestor'],
    killerFeature: 'El más popular - mejor relación calidad/precio'
  },
  
  business: {
    id: 'business',
    name: 'Business',
    tier: 'business',
    description: 'Para gestoras profesionales y agencias',
    
    monthlyPrice: 129,
    annualPrice: 1290,
    annualSavings: 258,
    
    maxProperties: 100,
    maxUsers: 10,
    signaturesIncluded: 50,
    storageIncluded: '50GB',
    
    features: [
      { text: 'Hasta 100 propiedades', included: true },
      { text: 'Multi-propietario', included: true },
      { text: '50 firmas digitales/mes', included: true, highlight: true },
      { text: '50GB almacenamiento', included: true },
      { text: 'CRM integrado', included: true },
      { text: 'API de integración', included: true },
      { text: 'Los 7 verticales inmobiliarios', included: true, highlight: true },
      { text: 'Reportes avanzados', included: true },
      { text: 'Multi-idioma', included: true },
      { text: 'Account manager dedicado', included: true },
    ],
    
    newFeature: 'API + CRM + 7 verticales',
    cta: 'Probar 30 días gratis',
    targetAudience: ['Gestora Profesional', 'Agencia Mediana', 'Multi-propietario'],
    killerFeature: '7 verticales inmobiliarios incluidos'
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    description: 'Para grandes empresas y SOCIMIs',
    
    monthlyPrice: 299,
    annualPrice: 2990,
    annualSavings: 598,
    
    maxProperties: 'unlimited',
    maxUsers: 'unlimited',
    signaturesIncluded: 'unlimited',
    storageIncluded: 'Ilimitado',
    
    features: [
      { text: 'Todo de Business incluido', included: true },
      { text: 'Propiedades ilimitadas', included: true, highlight: true },
      { text: 'Firmas digitales ilimitadas', included: true, highlight: true },
      { text: 'Almacenamiento ilimitado', included: true },
      { text: 'White-label completo', included: true },
      { text: 'API ilimitada', included: true },
      { text: 'SLA garantizado 99.9%', included: true },
      { text: 'Integraciones personalizadas', included: true },
      { text: 'Todos los add-ons incluidos', included: true, highlight: true, badge: 'PREMIUM' },
      { text: 'Soporte 24/7 dedicado', included: true },
    ],
    
    cta: 'Contactar ventas',
    targetAudience: ['Gran Empresa', 'SOCIMI', 'Fondo de Inversión'],
    killerFeature: 'Todo ilimitado + todos los add-ons incluidos'
  }
};

/**
 * ADD-ONS DISPONIBLES
 * Sincronizado con /prisma/seed-addons.ts
 */
export const ADD_ONS: Record<string, AddOn> = {
  // === PACKS DE USO ===
  signatures_10: {
    id: 'signatures_pack_10',
    name: 'Pack 10 Firmas Digitales',
    description: 'Pack de 10 firmas con validez legal europea (eIDAS)',
    category: 'usage',
    monthlyPrice: 15,
    annualPrice: 150,
    units: 10,
    unitType: 'firmas',
    availableFor: ['starter', 'professional', 'business', 'enterprise'],
    includedIn: [],
    highlighted: true,
  },
  signatures_50: {
    id: 'signatures_pack_50',
    name: 'Pack 50 Firmas Digitales',
    description: 'Pack de 50 firmas para alto volumen de contratos',
    category: 'usage',
    monthlyPrice: 60,
    annualPrice: 600,
    units: 50,
    unitType: 'firmas',
    availableFor: ['professional', 'business', 'enterprise'],
    includedIn: [],
  },
  sms_100: {
    id: 'sms_pack_100',
    name: 'Pack 100 SMS/WhatsApp',
    description: 'Notificaciones SMS o WhatsApp para inquilinos',
    category: 'usage',
    monthlyPrice: 10,
    annualPrice: 100,
    units: 100,
    unitType: 'mensajes',
    availableFor: ['starter', 'professional', 'business', 'enterprise'],
    includedIn: [],
    highlighted: true,
  },
  sms_500: {
    id: 'sms_pack_500',
    name: 'Pack 500 SMS/WhatsApp',
    description: 'Pack de mensajes para gestoras con muchos inquilinos',
    category: 'usage',
    monthlyPrice: 40,
    annualPrice: 400,
    units: 500,
    unitType: 'mensajes',
    availableFor: ['professional', 'business', 'enterprise'],
    includedIn: [],
  },
  ai_50k: {
    id: 'ai_pack_50k',
    name: 'Pack IA Básico (50K tokens)',
    description: 'Valoraciones automáticas y asistente virtual',
    category: 'usage',
    monthlyPrice: 10,
    annualPrice: 100,
    units: 50000,
    unitType: 'tokens',
    availableFor: ['starter', 'professional', 'business', 'enterprise'],
    includedIn: [],
    highlighted: true,
  },
  ai_200k: {
    id: 'ai_pack_200k',
    name: 'Pack IA Avanzado (200K tokens)',
    description: 'Incluye acceso a GPT-4 para análisis complejos',
    category: 'usage',
    monthlyPrice: 35,
    annualPrice: 350,
    units: 200000,
    unitType: 'tokens',
    availableFor: ['professional', 'business', 'enterprise'],
    includedIn: [],
  },
  storage_10gb: {
    id: 'storage_pack_10gb',
    name: 'Pack 10GB Storage',
    description: 'Almacenamiento adicional para documentos y fotos',
    category: 'usage',
    monthlyPrice: 5,
    annualPrice: 50,
    units: 10,
    unitType: 'GB',
    availableFor: ['starter', 'professional', 'business', 'enterprise'],
    includedIn: [],
  },
  storage_50gb: {
    id: 'storage_pack_50gb',
    name: 'Pack 50GB Storage',
    description: 'Almacenamiento para gestoras con muchas propiedades',
    category: 'usage',
    monthlyPrice: 20,
    annualPrice: 200,
    units: 50,
    unitType: 'GB',
    availableFor: ['professional', 'business', 'enterprise'],
    includedIn: [],
  },
  
  // === FUNCIONALIDADES ===
  advanced_reports: {
    id: 'advanced_reports',
    name: 'Reportes Avanzados',
    description: 'Informes financieros detallados y proyecciones',
    category: 'feature',
    monthlyPrice: 15,
    annualPrice: 150,
    availableFor: ['starter', 'professional'],
    includedIn: ['business', 'enterprise'],
  },
  portal_sync: {
    id: 'portal_sync',
    name: 'Publicación en Portales',
    description: 'Publica en Idealista, Fotocasa, Habitaclia automáticamente',
    category: 'feature',
    monthlyPrice: 25,
    annualPrice: 250,
    availableFor: ['starter', 'professional', 'business'],
    includedIn: ['enterprise'],
    highlighted: true,
  },
  tenant_screening: {
    id: 'tenant_screening',
    name: 'Screening de Inquilinos',
    description: 'Verificación de solvencia y puntuación de riesgo',
    category: 'feature',
    monthlyPrice: 20,
    annualPrice: 200,
    availableFor: ['starter', 'professional', 'business'],
    includedIn: ['enterprise'],
  },
  accounting_integration: {
    id: 'accounting_integration',
    name: 'Integración Contabilidad',
    description: 'Conexión con A3, Sage, Holded y más',
    category: 'feature',
    monthlyPrice: 30,
    annualPrice: 300,
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
  },
  
  // === PREMIUM ===
  whitelabel_basic: {
    id: 'whitelabel_basic',
    name: 'White-Label Básico',
    description: 'Tu marca, colores y logo personalizados',
    category: 'premium',
    monthlyPrice: 35,
    annualPrice: 350,
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
    highlighted: true,
  },
  whitelabel_full: {
    id: 'whitelabel_full',
    name: 'White-Label Completo',
    description: 'Tu dominio, app móvil y emails personalizados',
    category: 'premium',
    monthlyPrice: 99,
    annualPrice: 990,
    availableFor: ['business'],
    includedIn: ['enterprise'],
  },
  api_access: {
    id: 'api_access',
    name: 'Acceso API REST',
    description: 'API completa para integraciones personalizadas',
    category: 'premium',
    monthlyPrice: 49,
    annualPrice: 490,
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
  },
  pricing_ai: {
    id: 'pricing_ai',
    name: 'Pricing Dinámico IA',
    description: 'Optimiza precios de alquiler con Machine Learning',
    category: 'premium',
    monthlyPrice: 45,
    annualPrice: 450,
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
    highlighted: true,
  },
  tours_vr: {
    id: 'tours_vr',
    name: 'Tours Virtuales 360°',
    description: 'Tours interactivos con integración Matterport',
    category: 'premium',
    monthlyPrice: 35,
    annualPrice: 350,
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
  },
  iot_smart: {
    id: 'iot_smart',
    name: 'IoT & Smart Buildings',
    description: 'Integración con cerraduras, termostatos y sensores',
    category: 'premium',
    monthlyPrice: 75,
    annualPrice: 750,
    availableFor: ['business'],
    includedIn: ['enterprise'],
  },
};

/**
 * CAMPAÑAS PROMOCIONALES
 */
export const PROMO_CAMPAIGNS: Record<string, PromoCampaign> = {
  starter2026: {
    id: 'starter2026',
    code: 'STARTER2026',
    name: 'Oferta Lanzamiento 2026',
    description: 'Plan Starter a €25/mes durante 6 meses',
    targetPlan: 'starter',
    discountType: 'fixed_amount',
    discountValue: 10,
    duration: 6,
    maxUses: 500,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-06-30'),
    targetAudience: 'Nuevos usuarios',
    message: 'Empieza el año gestionando tus propiedades como un profesional'
  },
  
  switch2026: {
    id: 'switch2026',
    code: 'SWITCH2026',
    name: 'Migración Competencia',
    description: 'Igualamos precio de tu plataforma actual 1 año',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 0,
    duration: 12,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    targetAudience: 'Usuarios de otras plataformas',
    message: 'Trae tu última factura y te igualamos el precio'
  }
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula el precio con descuento anual
 */
export function calculateAnnualPrice(monthlyPrice: number): { annualPrice: number; savings: number } {
  const annualPrice = monthlyPrice * 10; // 12 meses - 2 gratis
  const savings = monthlyPrice * 2;
  return { annualPrice, savings };
}

/**
 * Obtiene el plan por ID
 */
export function getPlanById(planId: string): PricingPlan | null {
  return PRICING_PLANS[planId] || null;
}

/**
 * Obtiene todos los planes ordenados por precio
 */
export function getAllPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS);
}

/**
 * Verifica si un add-on está incluido en un plan
 */
export function isAddOnIncluded(addOnId: string, planId: string): boolean {
  const addOn = Object.values(ADD_ONS).find(a => a.id === addOnId);
  return addOn?.includedIn.includes(planId) || false;
}

/**
 * Obtiene add-ons disponibles para un plan
 */
export function getAvailableAddOns(planId: string): AddOn[] {
  return Object.values(ADD_ONS).filter(addon => 
    addon.availableFor.includes(planId) && !addon.includedIn.includes(planId)
  );
}

/**
 * Obtiene add-ons incluidos en un plan
 */
export function getIncludedAddOns(planId: string): AddOn[] {
  return Object.values(ADD_ONS).filter(addon => 
    addon.includedIn.includes(planId)
  );
}

/**
 * Calcula el precio total con add-ons
 */
export function calculateTotalPrice(
  planId: string, 
  interval: PricingInterval,
  addOnIds: string[] = []
): number {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  
  const basePrice = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  
  const addOnsPrice = addOnIds.reduce((total, addOnId) => {
    const addOn = Object.values(ADD_ONS).find(a => a.id === addOnId);
    if (!addOn || isAddOnIncluded(addOnId, planId)) return total;
    
    const addOnPrice = interval === 'annual' 
      ? (addOn.annualPrice || addOn.monthlyPrice * 10)
      : addOn.monthlyPrice;
    
    return total + addOnPrice;
  }, 0);
  
  return basePrice + addOnsPrice;
}

/**
 * Aplica descuento de cupón promocional
 */
export function applyPromoCoupon(
  price: number,
  campaignId: string,
  months: number = 1
): { finalPrice: number; discount: number; campaign: PromoCampaign | null } {
  const campaign = PROMO_CAMPAIGNS[campaignId];
  
  if (!campaign) {
    return { finalPrice: price, discount: 0, campaign: null };
  }
  
  let discount = 0;
  
  if (campaign.discountType === 'percentage') {
    discount = (price * campaign.discountValue / 100) * Math.min(months, campaign.duration);
  } else {
    discount = campaign.discountValue * Math.min(months, campaign.duration);
  }
  
  const finalPrice = Math.max(0, price - discount);
  
  return { finalPrice, discount, campaign };
}

/**
 * Formatea precio para mostrar
 */
export function formatPrice(price: number): string {
  if (price === 0) return 'Gratis';
  return `€${price.toLocaleString('es-ES')}`;
}

/**
 * Obtiene el mensaje de ahorro anual
 */
export function getAnnualSavingsMessage(plan: PricingPlan): string {
  if (plan.annualSavings === 0) return '';
  return `Ahorra €${plan.annualSavings} (2 meses gratis)`;
}

/**
 * Obtiene add-ons por categoría
 */
export function getAddOnsByCategory(category: 'usage' | 'feature' | 'premium'): AddOn[] {
  return Object.values(ADD_ONS).filter(addon => addon.category === category);
}

/**
 * Obtiene add-ons destacados
 */
export function getHighlightedAddOns(): AddOn[] {
  return Object.values(ADD_ONS).filter(addon => addon.highlighted);
}
