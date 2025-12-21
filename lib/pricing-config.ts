/**
 * Configuración centralizada de precios y planes de suscripción INMOVA
 * Estrategia de Precios 2025
 * 
 * IMPORTANTE: Esta configuración debe estar sincronizada con:
 * - Stripe Price IDs (cuando se creen los productos en Stripe)
 * - Base de datos (tabla subscription_plans)
 * - Landing page (components/landing/sections/PricingSection.tsx)
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
  tier: 'basic' | 'professional' | 'business' | 'enterprise';
  description: string;
  
  // Precios
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number; // En euros
  
  // Límites
  maxProperties: number | 'unlimited';
  maxUsers: number | 'unlimited';
  maxVerticals: number | 'all';
  
  // Características
  features: PricingFeature[];
  
  // Destacados
  popular?: boolean;
  newFeature?: string;
  
  // IDs de Stripe (a configurar después de crear en Stripe)
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
  monthlyPrice: number;
  stripePriceId?: string;
  availableFor: string[]; // Plan IDs
  includedIn: string[]; // Plan IDs donde viene incluido
}

export interface PromoCampaign {
  id: string;
  code: string;
  name: string;
  description: string;
  targetPlan: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  duration: number; // Meses
  maxUses?: number;
  validFrom: Date;
  validUntil: Date;
  targetAudience: string;
  message: string;
}

/**
 * PLANES DE SUSCRIPCIÓN - ESTRATEGIA 2025
 * Precios actualizados según documento "Estrategia de Precios y Lanzamiento INMOVA 2025"
 */
export const PRICING_PLANS: Record<string, PricingPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    tier: 'basic',
    description: 'El gancho - Captar al usuario de Excel',
    
    monthlyPrice: 49,
    annualPrice: 490,
    annualSavings: 98,
    
    maxProperties: 20,
    maxUsers: 1,
    maxVerticals: 1,
    
    features: [
      { text: 'Todos los 88+ módulos incluidos', included: true },
      { text: 'Hasta 20 propiedades', included: true },
      { text: '1 vertical de negocio (a elegir)', included: true },
      { text: '1 usuario', included: true },
      { text: 'Room Rental básico (sin prorrateo)', included: true },
      { text: 'Marca Blanca: Logo básico', included: true },
      { text: 'AI Assistant', included: false },
      { text: 'Construcción', included: false },
      { text: 'Soporte email 48h', included: true },
    ],
    
    cta: 'Ideal para inversores particulares y flippers',
    targetAudience: ['Inversor Particular', 'Flipper'],
    killerFeature: 'Más barato que Buildium (€55+) con herramientas de Flipping'
  },
  
  professional: {
    id: 'professional',
    name: 'Professional',
    tier: 'professional',
    description: 'La Estrella - Convertir agencias que usan Homming/Rentger',
    
    monthlyPrice: 149,
    annualPrice: 1490,
    annualSavings: 298,
    
    maxProperties: 100,
    maxUsers: 5,
    maxVerticals: 2,
    
    features: [
      { text: 'Todos los 88+ módulos incluidos', included: true },
      { text: 'Hasta 100 propiedades', included: true },
      { 
        text: '⭐ Room Rental PRO: Prorrateo automático de suministros', 
        included: true, 
        highlight: true,
        badge: 'NUEVO Q4 2024'
      },
      { text: 'Hasta 2 verticales (ej. Alquiler + STR)', included: true },
      { text: 'AI Assistant GPT-4 Standard', included: true },
      { text: 'Construcción: Reformas', included: true },
      { text: '5 usuarios', included: true },
      { text: 'Sistema de Cupones (add-on +€29/mes)', included: true },
      { text: 'Marca Blanca: Colores + Dominio', included: true },
      { text: 'Soporte chat prioritario', included: true },
    ],
    
    popular: true,
    newFeature: 'Room Rental PRO',
    cta: 'Perfecto para agencias y gestoras de coliving',
    targetAudience: ['Agencia Pequeña', 'Coliving', 'Gestora de habitaciones'],
    killerFeature: 'Room Rental PRO - Gestiona hasta 100 habitaciones con prorrateo automático'
  },
  
  business: {
    id: 'business',
    name: 'Business',
    tier: 'business',
    description: 'El Escalamiento - Gestoras consolidadas y Promotoras',
    
    monthlyPrice: 349,
    annualPrice: 3490,
    annualSavings: 698,
    
    maxProperties: 'unlimited',
    maxUsers: 15,
    maxVerticals: 'all',
    
    features: [
      { text: 'Todos los 88+ módulos incluidos', included: true },
      { text: 'Propiedades ilimitadas', included: true, highlight: true },
      { text: 'Todos los 7 verticales de negocio', included: true },
      { text: '⭐ Room Rental PRO completo', included: true, highlight: true },
      { 
        text: '✨ Sistema de Cupones INCLUIDO (valor €29/mes)', 
        included: true, 
        highlight: true,
        badge: 'INCLUIDO'
      },
      { text: 'AI Assistant GPT-4 Advanced (entrenable)', included: true },
      { text: 'Construcción: Obra Nueva completa', included: true },
      { text: 'Marca Blanca: App Nativa Personalizada', included: true },
      { text: '15 usuarios', included: true },
      { text: 'Gestor de Cuenta Dedicado', included: true },
    ],
    
    newFeature: 'Sistema de Cupones Incluido',
    cta: 'Para promotoras y gestoras consolidadas',
    targetAudience: ['Gestora', 'Promotora', 'Socimi'],
    killerFeature: 'Módulo de Construcción + Ilimitados + Sistema de Cupones incluido'
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise+',
    tier: 'enterprise',
    description: 'Custom - SOCIMIs y Grandes Promotoras',
    
    monthlyPrice: 0, // Custom
    annualPrice: 0, // Custom
    annualSavings: 0,
    
    maxProperties: 'unlimited',
    maxUsers: 'unlimited',
    maxVerticals: 'all',
    
    features: [
      { text: 'Todos los módulos + desarrollos custom', included: true },
      { text: 'Propiedades y usuarios ilimitados', included: true },
      { text: 'Migración de datos garantizada', included: true },
      { text: 'SLA 99.9%', included: true },
      { text: 'Consultoría de Tokenización', included: true },
      { text: 'Multi-región + Multi-moneda', included: true },
      { text: 'Soporte 24/7 + Account Manager', included: true },
      { text: 'Auditoría y cumplimiento normativo', included: true },
    ],
    
    cta: 'SOCIMIs y grandes corporaciones',
    targetAudience: ['SOCIMI', 'Gran Promotora', 'Ex-cliente Prinex/IESA'],
    killerFeature: 'Migración garantizada + SLA 99.9% + Tokenización'
  }
};

/**
 * ADD-ONS DISPONIBLES
 */
export const ADD_ONS: Record<string, AddOn> = {
  couponSystem: {
    id: 'coupon_system',
    name: 'Sistema de Cupones',
    description: 'Crea campañas de descuento automatizadas con límites de uso y estadísticas',
    monthlyPrice: 29,
    availableFor: ['basic', 'professional'],
    includedIn: ['business', 'enterprise'],
  }
};

/**
 * CAMPAÑAS PROMOCIONALES - ESTRATEGIA DE LANZAMIENTO 2025
 * Definidas en documento "Estrategia de Precios y Lanzamiento INMOVA 2025"
 */
export const PROMO_CAMPAIGNS: Record<string, PromoCampaign> = {
  flipping25: {
    id: 'flipping25',
    code: 'FLIPPING25',
    name: 'Adiós al Excel',
    description: 'Plan BASIC a €29/mes durante 6 meses',
    targetPlan: 'basic',
    discountType: 'fixed_amount',
    discountValue: 20, // €49 - €20 = €29
    duration: 6, // 6 meses
    maxUses: 500, // Limitar a primeros 500 usuarios
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-06-30'),
    targetAudience: 'Inversores/Flippers',
    message: 'Deja de perder dinero en tus reformas. Controla tu ROI en tiempo real.'
  },
  
  roompro: {
    id: 'roompro',
    code: 'ROOMPRO',
    name: 'Revolución Coliving',
    description: 'Plan PROFESSIONAL con Migración Gratuita + 50% dto. 1er mes',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 50,
    duration: 1, // Primer mes
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-06-30'),
    targetAudience: 'Gestores de Habitaciones/Coliving',
    message: '¿Harto de calcular facturas de luz a mano? INMOVA lo hace solo.'
  },
  
  switch2025: {
    id: 'switch2025',
    code: 'SWITCH2025',
    name: 'El Desafío Homming/Rentger',
    description: 'Igualamos precio de competencia 1 año + Upgrade gratis',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 0, // Variable según factura del cliente
    duration: 12, // 1 año
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    targetAudience: 'Agencias usando Homming/Rentger',
    message: 'Trae tu última factura. Te damos INMOVA al mismo precio durante 1 año con el plan superior gratis.'
  }
};

/**
 * UTILIDADES
 */

/**
 * Calcula el precio con descuento anual
 */
export function calculateAnnualPrice(monthlyPrice: number): { annualPrice: number; savings: number } {
  const annualPrice = monthlyPrice * 10; // 12 meses - 2 gratis = 10 meses
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
  const addOn = ADD_ONS[addOnId];
  return addOn?.includedIn.includes(planId) || false;
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
    const addOn = ADD_ONS[addOnId];
    if (!addOn || isAddOnIncluded(addOnId, planId)) return total;
    
    const addOnPrice = interval === 'annual' 
      ? addOn.monthlyPrice * 10 // 2 meses gratis también
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
  if (price === 0) return 'A medida';
  return `€${price.toLocaleString('es-ES')}`;
}

/**
 * Obtiene el mensaje de ahorro anual
 */
export function getAnnualSavingsMessage(plan: PricingPlan): string {
  if (plan.annualSavings === 0) return '';
  return `Ahorra €${plan.annualSavings} (2 meses gratis)`;
}
