/**
 * Configuración centralizada de precios y planes de suscripción INMOVA
 * Estrategia de Precios 2026 - ARQUITECTURA ACTUALIZADA
 * 
 * NUEVA ARQUITECTURA:
 * - 6 VERTICALES de negocio (modelos específicos)
 * - 6 MÓDULOS TRANSVERSALES (add-ons que amplifican valor)
 * - Pricing modular: vertical base + módulos opcionales
 * 
 * IMPORTANTE: Esta configuración debe estar sincronizada con:
 * - Stripe Price IDs (cuando se creen los productos en Stripe)
 * - Base de datos (tabla subscription_plans)
 * - Landing page (components/landing/sections/PricingSection.tsx)
 * - Plan de Negocio (PLAN_NEGOCIO_INMOVA_2026.md)
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
    description: 'Perfecto para inversores particulares que quieren dejar Excel',
    
    monthlyPrice: 49,
    annualPrice: 490,
    annualSavings: 98,
    
    maxProperties: 20,
    maxUsers: 1,
    maxVerticals: 1,
    
    features: [
      { text: '✅ 1 Vertical de Negocio (a elegir)', included: true, highlight: true },
      { text: 'Hasta 20 propiedades', included: true },
      { text: '1 usuario', included: true },
      { text: 'Funciones core del vertical elegido', included: true },
      { text: 'Dashboard y reportes básicos', included: true },
      { text: 'Integraciones básicas', included: true },
      { text: 'Módulos Transversales (add-ons)', included: false, badge: 'OPCIONALES' },
      { text: 'Construcción avanzada', included: false },
      { text: 'Soporte email 48h', included: true },
    ],
    
    cta: 'Ideal para inversores particulares y flippers',
    targetAudience: ['Inversor Particular', 'Flipper', 'Landlord'],
    killerFeature: 'Más barato que la competencia y con Flipping incluido'
  },
  
  professional: {
    id: 'professional',
    name: 'Professional',
    tier: 'professional',
    description: 'Para agencias y gestoras que necesitan múltiples verticales',
    
    monthlyPrice: 149,
    annualPrice: 1490,
    annualSavings: 298,
    
    maxProperties: 100,
    maxUsers: 5,
    maxVerticals: 2,
    
    features: [
      { text: '✅ 2 Verticales de Negocio (combina modelos)', included: true, highlight: true },
      { text: 'Hasta 100 propiedades', included: true },
      { 
        text: '⭐ Funciones avanzadas por vertical', 
        included: true, 
        highlight: true,
      },
      { text: '5 usuarios incluidos', included: true },
      { text: 'AI Assistant GPT-4 Standard', included: true },
      { text: 'Dashboard avanzado + Analytics', included: true },
      { text: 'Integraciones premium (OTAs, pagos)', included: true },
      { text: '1 Módulo Transversal incluido', included: true, badge: 'GRATIS' },
      { text: 'Marca Blanca: Colores + Dominio', included: true },
      { text: 'Soporte chat prioritario', included: true },
    ],
    
    popular: true,
    newFeature: '2 Verticales + 1 Módulo Gratis',
    cta: 'Perfecto para agencias y gestoras profesionales',
    targetAudience: ['Agencia', 'Gestora', 'Coliving Manager'],
    killerFeature: 'Multi-vertical: Combina Alquiler + STR o Flipping + Construcción'
  },
  
  business: {
    id: 'business',
    name: 'Business',
    tier: 'business',
    description: 'Todo incluido para gestoras consolidadas y promotoras',
    
    monthlyPrice: 349,
    annualPrice: 3490,
    annualSavings: 698,
    
    maxProperties: 'unlimited',
    maxUsers: 15,
    maxVerticals: 'all',
    
    features: [
      { text: '✅ TODOS los 6 Verticales incluidos', included: true, highlight: true },
      { text: '✅ Propiedades ilimitadas', included: true, highlight: true },
      { text: '✅ 3 Módulos Transversales incluidos', included: true, highlight: true, badge: 'VALOR €180/MES' },
      { text: '15 usuarios incluidos', included: true },
      { text: 'AI Assistant GPT-4 Advanced (entrenable)', included: true },
      { text: 'Construcción: Obra Nueva completa', included: true },
      { text: 'White-label completo + App móvil', included: true },
      { text: 'Migraciones de datos incluidas', included: true },
      { text: 'Gestor de Cuenta Dedicado', included: true },
      { text: 'Soporte prioritario 24/7', included: true },
    ],
    
    newFeature: 'Todos los Verticales + 3 Módulos Gratis',
    cta: 'Para promotoras y gestoras consolidadas',
    targetAudience: ['Gestora Consolidada', 'Promotora', 'Multi-vertical'],
    killerFeature: '6 verticales + 3 módulos transversales incluidos (€180 gratis/mes)'
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
 * MÓDULOS TRANSVERSALES DISPONIBLES
 * Estos módulos amplifican el valor de los verticales
 */
export const ADD_ONS: Record<string, AddOn> = {
  esg: {
    id: 'esg_sustainability',
    name: 'ESG & Sostenibilidad',
    description: 'Huella de carbono, certificaciones verdes, reportes CSRD. Compliance europeo.',
    monthlyPrice: 50,
    availableFor: ['basic', 'professional', 'business'],
    includedIn: ['enterprise'],
  },
  marketplace: {
    id: 'marketplace_b2c',
    name: 'Marketplace de Servicios',
    description: 'Monetiza con servicios B2C (limpieza, wifi, seguros). Comisión 12%.',
    monthlyPrice: 0, // Basado en comisiones
    availableFor: ['basic', 'professional', 'business'],
    includedIn: ['enterprise'],
  },
  pricingIA: {
    id: 'pricing_ai',
    name: 'Pricing Dinámico IA',
    description: 'Optimiza tarifas STR/Coliving con ML. +15-30% ingresos.',
    monthlyPrice: 30,
    availableFor: ['basic', 'professional', 'business'],
    includedIn: ['enterprise'],
  },
  toursVR: {
    id: 'tours_vr',
    name: 'Tours Virtuales AR/VR',
    description: 'Tours 360°, realidad virtual y aumentada. +40% conversión.',
    monthlyPrice: 30,
    availableFor: ['basic', 'professional', 'business'],
    includedIn: ['enterprise'],
  },
  iot: {
    id: 'iot_smart',
    name: 'IoT & Edificios Inteligentes',
    description: 'Integración con termostatos, cerraduras, sensores. Automatización total.',
    monthlyPrice: 100,
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
  },
  blockchain: {
    id: 'blockchain_tokenization',
    name: 'Blockchain & Tokenización',
    description: 'Tokeniza propiedades, inversión fraccionada, smart contracts.',
    monthlyPrice: 0, // Basado en comisiones
    availableFor: ['business'],
    includedIn: ['enterprise'],
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
    name: 'El Desafío Switch',
    description: 'Igualamos precio de competencia 1 año + Upgrade gratis',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 0, // Variable según factura del cliente
    duration: 12, // 1 año
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    targetAudience: 'Agencias usando otras plataformas',
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
