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
  // Costos y márgenes
  costPerUnit?: number;      // Costo unitario real (€)
  marginPercentage?: number; // Margen de beneficio (%)
  costSource?: string;       // Fuente del costo (ej: "Signaturit", "Twilio", "AWS S3")
  // Stripe
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
 * 
 * COSTOS REALES POR PROVEEDOR:
 * - Signaturit: €0.90/firma (volumen alto: €0.50-0.65)
 * - Twilio SMS: €0.053/SMS España (volumen: €0.030-0.038)
 * - AWS S3: €0.023/GB/mes + €0.09/GB transferencia
 * - OpenAI GPT-3.5: €0.002/1K tokens, GPT-4: €0.03/1K tokens
 * - Matterport: €30-50/tour
 */
export const ADD_ONS: Record<string, AddOn> = {
  // ═══════════════════════════════════════════════════════════════
  // PACKS DE USO - Consumibles
  // ═══════════════════════════════════════════════════════════════
  
  signatures_10: {
    id: 'signatures_pack_10',
    name: 'Pack 10 Firmas Digitales',
    description: 'Pack de 10 firmas con validez legal europea (eIDAS)',
    category: 'usage',
    monthlyPrice: 15,
    annualPrice: 150,
    units: 10,
    unitType: 'firmas',
    costPerUnit: 9,           // 10 firmas × €0.90 = €9
    marginPercentage: 40,     // (15-9)/15 = 40%
    costSource: 'Signaturit',
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
    costPerUnit: 32.50,       // 50 firmas × €0.65 = €32.50
    marginPercentage: 46,     // (60-32.50)/60 = 46%
    costSource: 'Signaturit (volumen)',
    availableFor: ['professional', 'business', 'enterprise'],
    includedIn: [],
  },
  signatures_100: {
    id: 'signatures_pack_100',
    name: 'Pack 100 Firmas Digitales',
    description: 'Pack empresarial de 100 firmas. Máximo ahorro.',
    category: 'usage',
    monthlyPrice: 100,
    annualPrice: 1000,
    units: 100,
    unitType: 'firmas',
    costPerUnit: 50,          // 100 firmas × €0.50 = €50
    marginPercentage: 50,     // (100-50)/100 = 50%
    costSource: 'Signaturit (enterprise)',
    availableFor: ['business', 'enterprise'],
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
    costPerUnit: 5.30,        // 100 SMS × €0.053 = €5.30
    marginPercentage: 47,     // (10-5.30)/10 = 47%
    costSource: 'Twilio',
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
    costPerUnit: 19,          // 500 SMS × €0.038 = €19
    marginPercentage: 52,     // (40-19)/40 = 52%
    costSource: 'Twilio (volumen)',
    availableFor: ['professional', 'business', 'enterprise'],
    includedIn: [],
  },
  sms_1000: {
    id: 'sms_pack_1000',
    name: 'Pack 1000 SMS/WhatsApp',
    description: 'Pack empresarial de 1000 mensajes',
    category: 'usage',
    monthlyPrice: 70,
    annualPrice: 700,
    units: 1000,
    unitType: 'mensajes',
    costPerUnit: 30,          // 1000 SMS × €0.030 = €30
    marginPercentage: 57,     // (70-30)/70 = 57%
    costSource: 'Twilio (enterprise)',
    availableFor: ['business', 'enterprise'],
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
    costPerUnit: 0.30,        // 50K tokens GPT-3.5 × €0.006/1K = €0.30
    marginPercentage: 97,     // (10-0.30)/10 = 97%
    costSource: 'OpenAI GPT-3.5',
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
    costPerUnit: 3,           // Mix GPT-3.5/4: ~€3 por 200K
    marginPercentage: 91,     // (35-3)/35 = 91%
    costSource: 'OpenAI GPT-3.5/4 mix',
    availableFor: ['professional', 'business', 'enterprise'],
    includedIn: [],
  },
  ai_500k: {
    id: 'ai_pack_500k',
    name: 'Pack IA Enterprise (500K tokens)',
    description: 'Acceso GPT-4 ilimitado para uso intensivo',
    category: 'usage',
    monthlyPrice: 75,
    annualPrice: 750,
    units: 500000,
    unitType: 'tokens',
    costPerUnit: 10,          // 500K tokens GPT-4: ~€10
    marginPercentage: 87,     // (75-10)/75 = 87%
    costSource: 'OpenAI GPT-4',
    availableFor: ['business', 'enterprise'],
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
    costPerUnit: 0.23,        // 10GB × €0.023 = €0.23
    marginPercentage: 95,     // (5-0.23)/5 = 95%
    costSource: 'AWS S3',
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
    costPerUnit: 1.15,        // 50GB × €0.023 = €1.15
    marginPercentage: 94,     // (20-1.15)/20 = 94%
    costSource: 'AWS S3',
    availableFor: ['professional', 'business', 'enterprise'],
    includedIn: [],
  },
  storage_100gb: {
    id: 'storage_pack_100gb',
    name: 'Pack 100GB Storage',
    description: 'Almacenamiento empresarial con CDN incluido',
    category: 'usage',
    monthlyPrice: 35,
    annualPrice: 350,
    units: 100,
    unitType: 'GB',
    costPerUnit: 2.30,        // 100GB × €0.023 = €2.30
    marginPercentage: 93,     // (35-2.30)/35 = 93%
    costSource: 'AWS S3 + CloudFront',
    availableFor: ['business', 'enterprise'],
    includedIn: [],
  },
  
  // ═══════════════════════════════════════════════════════════════
  // FUNCIONALIDADES - Features activables
  // ═══════════════════════════════════════════════════════════════
  
  advanced_reports: {
    id: 'advanced_reports',
    name: 'Reportes Avanzados',
    description: 'Informes financieros detallados y proyecciones',
    category: 'feature',
    monthlyPrice: 15,
    annualPrice: 150,
    costPerUnit: 0,           // Costo de desarrollo amortizado
    marginPercentage: 100,    // Sin costo variable
    costSource: 'Desarrollo interno',
    availableFor: ['starter', 'professional'],
    includedIn: ['business', 'enterprise'],
  },
  multi_language: {
    id: 'multi_language',
    name: 'Multi-idioma',
    description: 'Interfaz en ES, EN, FR, DE, PT. Portal traducido.',
    category: 'feature',
    monthlyPrice: 10,
    annualPrice: 100,
    costPerUnit: 0,
    marginPercentage: 100,
    costSource: 'Desarrollo interno',
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
    costPerUnit: 5,           // APIs de portales: ~€5/mes
    marginPercentage: 80,     // (25-5)/25 = 80%
    costSource: 'APIs Idealista/Fotocasa',
    availableFor: ['starter', 'professional', 'business'],
    includedIn: ['enterprise'],
    highlighted: true,
  },
  auto_reminders: {
    id: 'auto_reminders',
    name: 'Recordatorios Automáticos',
    description: 'Recordatorios de pago, vencimientos y mantenimientos',
    category: 'feature',
    monthlyPrice: 8,
    annualPrice: 80,
    costPerUnit: 0,
    marginPercentage: 100,
    costSource: 'Desarrollo interno',
    availableFor: ['starter'],
    includedIn: ['professional', 'business', 'enterprise'],
  },
  tenant_screening: {
    id: 'tenant_screening',
    name: 'Screening de Inquilinos',
    description: 'Verificación de solvencia y puntuación de riesgo',
    category: 'feature',
    monthlyPrice: 20,
    annualPrice: 200,
    costPerUnit: 8,           // Consultas a bureaus de crédito
    marginPercentage: 60,     // (20-8)/20 = 60%
    costSource: 'Experian/Equifax API',
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
    costPerUnit: 4.50,        // APIs contables
    marginPercentage: 85,     // (30-4.50)/30 = 85%
    costSource: 'APIs A3/Sage/Holded',
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
  },
  
  // ═══════════════════════════════════════════════════════════════
  // PREMIUM - Servicios de alto valor
  // ═══════════════════════════════════════════════════════════════
  
  whitelabel_basic: {
    id: 'whitelabel_basic',
    name: 'White-Label Básico',
    description: 'Tu marca, colores y logo personalizados',
    category: 'premium',
    monthlyPrice: 35,
    annualPrice: 350,
    costPerUnit: 1.75,        // Mantenimiento mínimo
    marginPercentage: 95,     // (35-1.75)/35 = 95%
    costSource: 'Infraestructura',
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
    costPerUnit: 15,          // Dominio, SSL, infraestructura dedicada
    marginPercentage: 85,     // (99-15)/99 = 85%
    costSource: 'Infra + dominios + SSL',
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
    costPerUnit: 0,           // Sin costo variable
    marginPercentage: 100,
    costSource: 'Desarrollo interno',
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
  },
  esg_module: {
    id: 'esg_module',
    name: 'ESG & Sostenibilidad',
    description: 'Huella de carbono, certificaciones verdes, CSRD',
    category: 'premium',
    monthlyPrice: 50,
    annualPrice: 500,
    costPerUnit: 10,          // APIs de certificación
    marginPercentage: 80,     // (50-10)/50 = 80%
    costSource: 'APIs ESG + desarrollo',
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
    costPerUnit: 6.75,        // ML compute + APIs mercado
    marginPercentage: 85,     // (45-6.75)/45 = 85%
    costSource: 'AWS ML + APIs mercado',
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
    costPerUnit: 7,           // Hosting de tours + Matterport API
    marginPercentage: 80,     // (35-7)/35 = 80%
    costSource: 'Matterport/Kuula API',
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
    costPerUnit: 22.50,       // APIs IoT + integraciones
    marginPercentage: 70,     // (75-22.50)/75 = 70%
    costSource: 'APIs TTLock/Nuki/Netatmo',
    availableFor: ['business'],
    includedIn: ['enterprise'],
  },
  marketplace_b2c: {
    id: 'marketplace_b2c',
    name: 'Marketplace de Servicios',
    description: 'Ofrece servicios a inquilinos: limpieza, wifi, seguros',
    category: 'premium',
    monthlyPrice: 0,          // Basado en comisiones (12%)
    annualPrice: 0,
    costPerUnit: 0,           // Variable por transacción
    marginPercentage: 12,     // Comisión del 12% por servicio
    costSource: 'Comisiones variables',
    availableFor: ['starter', 'professional', 'business'],
    includedIn: ['enterprise'],
  },
  dedicated_support: {
    id: 'dedicated_support',
    name: 'Soporte Dedicado',
    description: 'Account manager, soporte 24/7, formación mensual',
    category: 'premium',
    monthlyPrice: 99,
    annualPrice: 990,
    costPerUnit: 49.50,       // Costo de personal
    marginPercentage: 50,     // (99-49.50)/99 = 50%
    costSource: 'Personal dedicado',
    availableFor: ['professional', 'business'],
    includedIn: ['enterprise'],
  },
};

/**
 * CAMPAÑAS PROMOCIONALES
 * Sincronizado con:
 * - /app/landing/ofertas/page.tsx
 * - /app/landing/campanas/launch2025/page.tsx
 * - /app/landing/modulos/coliving/page.tsx
 */
export const PROMO_CAMPAIGNS: Record<string, PromoCampaign> = {
  // ═══════════════════════════════════════════════════════════════
  // OFERTAS PRINCIPALES (Página /landing/ofertas)
  // ═══════════════════════════════════════════════════════════════
  
  starter26: {
    id: 'starter26',
    code: 'STARTER26',
    name: '50% de Descuento Starter',
    description: 'Plan Starter a mitad de precio durante 3 meses (€17/mes en lugar de €35/mes)',
    targetPlan: 'starter',
    discountType: 'percentage',
    discountValue: 50,
    duration: 3,
    maxUses: 1000,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-03-31'),
    targetAudience: 'Pequeños propietarios y house flippers',
    message: 'Gestión profesional de hasta 5 propiedades con todas las herramientas esenciales'
  },
  
  coliving26: {
    id: 'coliving26',
    code: 'COLIVING26',
    name: 'Oferta Coliving',
    description: '30 días gratis + 20% dto. siguientes 6 meses en Plan Professional',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 100, // Primer mes gratis
    duration: 7, // 1 mes gratis + 6 meses con 20%
    maxUses: 500,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-03-31'),
    targetAudience: 'Gestores de coliving',
    message: 'Prorrateo automático de suministros, contratos flexibles y portal de residentes'
  },
  
  switch26: {
    id: 'switch26',
    code: 'SWITCH26',
    name: 'Cambia y Ahorra',
    description: 'Igualamos precio de tu plataforma actual + Plan superior incluido durante 12 meses',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 0, // Variable según factura del cliente
    duration: 12,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-03-31'),
    targetAudience: 'Usuarios de otras plataformas (Homming, Rentger, etc.)',
    message: 'Trae tu última factura y te damos INMOVA al mismo precio pero con el plan superior'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // CAMPAÑA LANZAMIENTO 2026 (/landing/campanas/launch2025)
  // ═══════════════════════════════════════════════════════════════
  
  launch2026: {
    id: 'launch2026',
    code: 'LAUNCH2026',
    name: 'Lanzamiento 2026',
    description: '50% de descuento en el primer mes - Campaña de lanzamiento Q1 2026',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 50,
    duration: 1,
    maxUses: 150,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-03-31'),
    targetAudience: 'Nuevos usuarios Q1 2026',
    message: 'Solo 150 plazas disponibles con el descuento del 50% en el primer mes'
  },
  
  launch2025: {
    id: 'launch2025',
    code: 'LAUNCH2025',
    name: 'Lanzamiento 2025 (Legacy)',
    description: '50% de descuento en el primer mes - Campaña original',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 50,
    duration: 1,
    maxUses: 500,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2026-06-30'), // Extendida para usuarios legacy
    targetAudience: 'Usuarios early adopters',
    message: 'Código legacy válido para usuarios que lo recibieron en 2025'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // OFERTAS ESPECÍFICAS POR VERTICAL
  // ═══════════════════════════════════════════════════════════════
  
  coliving50: {
    id: 'coliving50',
    code: 'COLIVING50',
    name: 'Coliving 50% Off',
    description: '50% de descuento adicional para operadores de coliving',
    targetPlan: 'professional',
    discountType: 'percentage',
    discountValue: 50,
    duration: 3,
    maxUses: 200,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-06-30'),
    targetAudience: 'Operadores de coliving y habitaciones',
    message: 'Descuento exclusivo para espacios compartidos y coliving'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // OFERTAS LEGACY (Compatibilidad)
  // ═══════════════════════════════════════════════════════════════
  
  starter2026: {
    id: 'starter2026',
    code: 'STARTER2026',
    name: 'Oferta Lanzamiento 2026 (Legacy)',
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
    name: 'Migración Competencia (Legacy)',
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
