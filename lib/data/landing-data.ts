/**
 * ESTRUCTURA DE DATOS COMPLETA - LANDING PAGE INMOVA
 *
 * Tipos TypeScript y datos para implementación directa
 * Versión: 1.0 Final
 * Fecha: 29 Diciembre 2025
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: string;
}

export interface CTAButton {
  text: string;
  subtext?: string;
  href: string;
  variant: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  icon?: string;
}

export interface TrustBadge {
  icon: string;
  text: string;
}

export interface Stat {
  icon: string;
  label: string;
  value?: string;
}

export interface PainPoint {
  icon: string;
  title: string;
  description: string;
}

export interface SolutionStep {
  number: string;
  title: string;
  description: string;
  benefits: string[];
  metric: string;
  image?: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

export interface PersonaTab {
  id: string;
  label: string;
  icon: string;
  headline: string;
  features: Feature[];
  pricing: {
    plan: string;
    price: number;
    savings?: string;
    roi: string;
  };
  cta: CTAButton;
}

export interface ROICalculatorField {
  id: string;
  label: string;
  type: 'number' | 'select';
  placeholder: string;
  default: number;
  min: number;
  max: number;
  step?: number;
}

export interface ComparisonRow {
  feature: string;
  inmova: {
    value: string;
    highlight?: boolean;
    icon?: string;
  };
  homming: {
    value: string;
  };
  rentger: {
    value: string;
  };
  buildium: {
    value: string;
  };
}

export interface Metric {
  label: string;
  before?: string;
  after?: string;
  change?: string;
  value?: string;
}

export interface Testimonial {
  id: number;
  type: 'video' | 'text';
  name: string;
  role: string;
  location: string;
  avatar: string;
  propertiesCount?: number;
  videoUrl?: string;
  videoPoster?: string;
  image?: string;
  quote: string;
  metrics: Metric[];
  rating: number;
  verified: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  popular: boolean;
  features: string[];
  notIncluded: string[];
  roi: string;
  idealFor: string;
  savings?: string;
  ctaText: string;
  ctaVariant: 'default' | 'outline';
}

export interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
}

export interface FooterSection {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

// ============================================================================
// NAVIGATION DATA
// ============================================================================

export const navigationItems: NavItem[] = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Precios', href: '#pricing' },
  { label: 'Casos de Éxito', href: '#testimonials' },
  { label: 'Demo', href: '#demo', variant: 'outline' },
  { label: 'Login', href: '/login', variant: 'default' },
];

// ============================================================================
// HERO SECTION DATA
// ============================================================================

export const heroData = {
  eyebrow: '🏠 EL ECOSISTEMA PROPTECH MÁS COMPLETO DE ESPAÑA',
  headline: 'Del Alquiler a la Construcción: Todo tu Negocio Inmobiliario en Una Plataforma',
  subheadline:
    '7 verticales + 20 módulos | Desde alquiler hasta construcción B2B | Sin permanencia',
  description:
    'Inmova cubre todo el ciclo de vida inmobiliario: alquiler, coliving, construcción (ewoorker), seguros, partners estratégicos y más. Elimina 5-7 herramientas, ahorra 10+ horas/semana.',
  primaryCTA: {
    text: '🚀 Prueba GRATIS 30 Días',
    subtext: 'Sin tarjeta · Setup en 10 min',
    href: '/signup',
    variant: 'default' as const,
    size: 'lg' as const,
  },
  secondaryCTA: {
    text: '▶️ Ver Demo (2 min)',
    href: '#demo',
    variant: 'outline' as const,
    size: 'lg' as const,
  },
  trustBadges: [
    { icon: 'CheckCircle', text: 'Sin tarjeta de crédito' },
    { icon: 'Clock', text: 'Setup en 10 minutos' },
    { icon: 'Headphones', text: 'Soporte 24/7' },
  ],
  socialProof: '⭐⭐⭐⭐⭐ 4.8/5 · Más de 500 propietarios confían en INMOVA',
  heroImage: '/images/hero-dashboard.png',
};

// ============================================================================
// SOCIAL PROOF BAR DATA
// ============================================================================

export const socialProofStats: Stat[] = [
  { icon: 'Trophy', label: '#1 Ecosistema PropTech' },
  { icon: 'Users', label: '3,000+ usuarios activos' },
  { icon: 'Star', label: '4.8/5 estrellas' },
  { icon: 'Euro', label: '€15M+ gestionados/mes' },
  { icon: 'Building2', label: '7 verticales' },
  { icon: 'Zap', label: '20+ módulos' },
];

// ============================================================================
// PROBLEM SECTION DATA
// ============================================================================

export const problemData = {
  headline: '¿Te Identificas con Alguna de Estas Situaciones?',
  subheadline: 'Si dijiste "SÍ" a 2 o más, INMOVA es la solución que necesitas',
  painPoints: [
    {
      icon: '😰',
      title: 'Gestión Caótica',
      description:
        'Pierdes horas gestionando Excel, WhatsApp y papeles. No encuentras contratos cuando los necesitas.',
    },
    {
      icon: '💸',
      title: 'Morosidad Constante',
      description:
        'Has tenido inquilinos morosos y has perdido miles de euros. No sabes cómo evitarlo.',
    },
    {
      icon: '📊',
      title: 'Software Fragmentado',
      description:
        'Usas 5-7 herramientas diferentes que cuestan €500+/mes y no se comunican entre sí.',
    },
    {
      icon: '⏰',
      title: 'Falta de Tiempo',
      description:
        'Dedicas 10+ horas/semana a tareas administrativas que deberían estar automatizadas.',
    },
    {
      icon: '📉',
      title: 'Sin Visibilidad',
      description:
        'No sabes si tus propiedades son realmente rentables. Tomas decisiones a ciegas.',
    },
  ] as PainPoint[],
  cta: {
    text: 'Quiero Solucionar Esto Ahora →',
    href: '#solution',
    variant: 'default' as const,
  },
};

// ============================================================================
// SOLUTION SECTION DATA
// ============================================================================

export const solutionData = {
  headline: 'Gestiona TODAS tus Propiedades en 1 Solo Lugar (y Desde tu Móvil 📱)',
  subheadline: 'Centraliza, automatiza y optimiza tu gestión inmobiliaria en 3 pasos simples',
  steps: [
    {
      number: '1',
      title: 'CENTRALIZA Todo en un Solo Dashboard',
      description:
        'Propiedades, inquilinos, contratos, pagos, mantenimiento, documentos. Todo en un solo lugar accesible desde cualquier dispositivo.',
      benefits: [
        '✓ Elimina Excel y WhatsApp',
        '✓ Acceso desde móvil 24/7',
        '✓ Toda tu info centralizada',
        '✓ Búsqueda instantánea',
      ],
      metric: '100% organizado',
      image: '/images/solution-centralize.png',
    },
    {
      number: '2',
      title: 'AUTOMATIZA Tareas Repetitivas',
      description:
        'Recordatorios de pago, screening de inquilinos, generación de contratos, reportes mensuales. Todo en piloto automático.',
      benefits: [
        '✓ Alertas automáticas de pago',
        '✓ Screening IA de inquilinos',
        '✓ Contratos auto-generados',
        '✓ Reportes con 1 clic',
      ],
      metric: '8h/semana ahorradas',
      image: '/images/solution-automate.png',
    },
    {
      number: '3',
      title: 'OPTIMIZA tu Rentabilidad',
      description:
        'Reduce morosidad 80%, aumenta rentabilidad 40%, elimina herramientas innecesarias y toma decisiones basadas en datos reales.',
      benefits: [
        '✓ Dashboard tiempo real',
        '✓ Analytics avanzados',
        '✓ Alertas inteligentes',
        '✓ ROI por propiedad',
      ],
      metric: 'ROI en 60 días',
      image: '/images/solution-optimize.png',
    },
  ] as SolutionStep[],
  cta: {
    text: 'Ver Demo Completa (2 min) →',
    href: '#demo',
    variant: 'default' as const,
  },
};

// ============================================================================
// FEATURES BY PERSONA DATA
// ============================================================================

export const personaTabs: PersonaTab[] = [
  {
    id: 'propietarios',
    label: '👤 Propietarios',
    icon: 'User',
    headline: 'Para Propietarios que Quieren Simplicidad y Resultados',
    features: [
      {
        icon: 'UserCheck',
        title: 'Screening Automático de Inquilinos',
        description: 'IA analiza historial, solvencia y compatibilidad. Reduce morosidad 80%.',
        metric: '80% menos morosidad',
      },
      {
        icon: 'FileText',
        title: 'Contratos Legales Pre-Aprobados',
        description: 'Genera contratos de alquiler conformes a la normativa actual en 2 clics.',
        metric: '100% legal',
      },
      {
        icon: 'Smartphone',
        title: 'Portal del Inquilino',
        description:
          'Ellos reportan incidencias, pagan online y acceden a documentos. Sin llamadas.',
        metric: '70% menos llamadas',
      },
      {
        icon: 'Bell',
        title: 'Alertas de Pago Automáticas',
        description: 'Recordatorios automáticos por email y SMS. Nunca olvides cobrar.',
        metric: '100% cobros a tiempo',
      },
      {
        icon: 'Calculator',
        title: 'Reportes Fiscales Automáticos',
        description: 'Calcula IRPF automáticamente. Listo para tu gestor fiscal.',
        metric: '3h ahorradas',
      },
      {
        icon: 'TrendingUp',
        title: 'Dashboard de Rentabilidad',
        description: 'Ve en tiempo real ingresos, gastos y ROI por propiedad.',
        metric: 'Visibilidad 100%',
      },
    ],
    pricing: {
      plan: 'BÁSICO',
      price: 149,
      savings: 'Ahorras vs gestora: €200/mes',
      roi: 'ROI en 2 meses',
    },
    cta: {
      text: 'Empezar Prueba Gratis 30 Días →',
      href: '/signup?plan=basic',
      variant: 'default',
    },
  },
  {
    id: 'gestores',
    label: '🏢 Gestores',
    icon: 'Building',
    headline: 'Para Gestores que Quieren Escalar sin Contratar',
    features: [
      {
        icon: 'LayoutDashboard',
        title: 'Dashboard para Propietarios',
        description:
          'Portal con acceso 24/7 para tus clientes. Reduce llamadas 80% y mejora satisfacción.',
        metric: '80% menos llamadas',
      },
      {
        icon: 'Zap',
        title: 'Automatización Completa',
        description: 'Facturación, cobros, recordatorios, reportes. Todo automático.',
        metric: '15h/semana ahorradas',
      },
      {
        icon: 'Link',
        title: 'Integraciones con Portales',
        description: 'Publica en Idealista, Fotocasa y 10+ portales en 1 clic.',
        metric: 'Publica en 1 min',
      },
      {
        icon: 'Code',
        title: 'API Abierta',
        description: 'Conecta tus herramientas actuales (CRM, contabilidad, etc.).',
        metric: '100% integrado',
      },
      {
        icon: 'Users',
        title: 'Multi-Usuario Ilimitado',
        description: 'Todo tu equipo con accesos personalizados y permisos granulares.',
        metric: 'Equipo completo',
      },
      {
        icon: 'FileBarChart',
        title: 'Reportes Automáticos',
        description: 'Genera reportes mensuales para propietarios con 1 clic.',
        metric: 'De 20h a 2 min',
      },
    ],
    pricing: {
      plan: 'PRO',
      price: 349,
      savings: 'Ahorras €500/mes (software) + €2,000/mes (tiempo)',
      roi: 'ROI en 1 mes',
    },
    cta: {
      text: 'Agendar Demo Personalizada →',
      href: '/demo?plan=pro',
      variant: 'default',
    },
  },
  {
    id: 'agentes',
    label: '🏘️ Agentes',
    icon: 'Home',
    headline: 'Para Agentes que Quieren Cerrar Más Ventas',
    features: [
      {
        icon: 'Target',
        title: 'CRM Inmobiliario Especializado',
        description: 'Pipeline de ventas optimizado para inmobiliario. No más CRMs genéricos.',
        metric: '30% más conversión',
      },
      {
        icon: 'Brain',
        title: 'Lead Scoring con IA',
        description:
          'IA prioriza leads con mayor probabilidad de compra. Enfócate en lo importante.',
        metric: '80% precisión',
      },
      {
        icon: 'Mail',
        title: 'Nurturing Automático',
        description: 'Emails y SMS personalizados según comportamiento. Sin perder ningún lead.',
        metric: '45% más engagement',
      },
      {
        icon: 'Globe',
        title: 'Publicación Multi-Portal',
        description: 'Publica en 15+ portales inmobiliarios en 1 clic (Idealista, Fotocasa, etc.).',
        metric: '8h/semana ahorradas',
      },
      {
        icon: 'BarChart3',
        title: 'Analytics Avanzados',
        description: 'Sabe qué funciona y qué no. Optimiza tu estrategia con datos reales.',
        metric: 'Visibilidad 100%',
      },
      {
        icon: 'Megaphone',
        title: 'Marketing Multicanal',
        description: 'Campañas automáticas en email, SMS, redes sociales desde una plataforma.',
        metric: '3x alcance',
      },
    ],
    pricing: {
      plan: 'AGENCIA',
      price: 449,
      savings: '+20 ventas/año = €30,000 comisiones extra',
      roi: 'ROI 556%',
    },
    cta: {
      text: 'Calcular Mi ROI Personalizado →',
      href: '/roi-calculator?plan=agency',
      variant: 'default',
    },
  },
  {
    id: 'constructores',
    label: '🏗️ Constructores',
    icon: 'Hammer',
    headline: 'Para Constructores que Necesitan Subcontratar con Seguridad',
    features: [
      {
        icon: 'Shield',
        title: 'Compliance Ley 32/2006',
        description:
          'Libro de subcontratación digital automático. Evita sanciones y mantén todos tus documentos al día.',
        metric: '100% legal',
      },
      {
        icon: 'Euro',
        title: 'Sistema Escrow de Pagos',
        description:
          'Pago seguro con retención de fondos. Paga solo cuando el trabajo esté perfecto.',
        metric: '0% riesgo',
      },
      {
        icon: 'Users',
        title: 'Marketplace de Subcontratistas',
        description:
          'Encuentra profesionales verificados con REA. Más de 500 obras activas cada semana.',
        metric: '2.5K empresas',
      },
      {
        icon: 'FileCheck',
        title: 'Gestión Documental',
        description: 'REA, TC1, TC2, Seguros. Alertas automáticas de vencimiento.',
        metric: '0 docs vencidos',
      },
      {
        icon: 'BarChart3',
        title: 'Control Total de Obra',
        description: 'Certificaciones digitales, partes diarios, mediciones con evidencia.',
        metric: 'Transparencia 100%',
      },
      {
        icon: 'Star',
        title: 'Sistema de Reviews',
        description: 'Valora subcontratistas y construye tu reputación profesional.',
        metric: '4.8/5 media',
      },
    ],
    pricing: {
      plan: 'CAPATAZ / CONSTRUCTOR',
      price: 49,
      savings: 'Planes desde €49/mes',
      roi: 'Escrow + Compliance',
    },
    cta: {
      text: 'Explorar ewoorker →',
      href: '/ewoorker-landing',
      variant: 'default',
    },
  },
  {
    id: 'inversores',
    label: '💼 Inversores',
    icon: 'Briefcase',
    headline: 'Para Inversores que Quieren Escalar sin Límites',
    features: [
      {
        icon: 'Building',
        title: 'Módulo Room Rental PRO',
        description:
          'Gestión especializada para coliving: habitaciones, roommates, espacios comunes.',
        metric: 'Hasta 500 rooms',
      },
      {
        icon: 'GitMerge',
        title: 'Matching Automático IA',
        description: 'IA empareja inquilinos compatibles. Reduce conflictos 60%.',
        metric: '90% compatibilidad',
      },
      {
        icon: 'TrendingUp',
        title: 'Optimización de Ocupación',
        description: 'Pricing dinámico y estrategias para maximizar ocupación (78% → 92%).',
        metric: '+14% ocupación',
      },
      {
        icon: 'BarChart4',
        title: 'Dashboard Ejecutivo',
        description: 'Métricas clave en tiempo real: ocupación, revenue, EBITDA por propiedad.',
        metric: 'Decisiones data-driven',
      },
      {
        icon: 'Calendar',
        title: 'Community Management',
        description: 'Eventos, encuestas, comunicación con residentes desde la plataforma.',
        metric: 'Engagement 85%',
      },
      {
        icon: 'Boxes',
        title: 'Multi-Propiedad Ilimitado',
        description: 'Gestiona 10, 100 o 1,000 propiedades sin límites ni costos extra.',
        metric: 'Escala infinita',
      },
    ],
    pricing: {
      plan: 'ENTERPRISE',
      price: 749,
      savings: '+14% ocupación = €200K/año extra',
      roi: 'ROI 2,226%',
    },
    cta: {
      text: 'Agendar Demo Enterprise →',
      href: '/demo?plan=enterprise',
      variant: 'default',
    },
  },
];

// ============================================================================
// ROI CALCULATOR DATA
// ============================================================================

export const roiCalculatorFields: ROICalculatorField[] = [
  {
    id: 'properties',
    label: '¿Cuántas propiedades gestionas?',
    type: 'number',
    placeholder: 'Ej: 10',
    default: 10,
    min: 1,
    max: 1000,
  },
  {
    id: 'hoursPerWeek',
    label: '¿Cuántas horas/semana dedicas a gestión?',
    type: 'number',
    placeholder: 'Ej: 8',
    default: 8,
    min: 1,
    max: 40,
  },
  {
    id: 'tools',
    label: '¿Cuántas herramientas usas actualmente?',
    type: 'number',
    placeholder: 'Ej: 3',
    default: 3,
    min: 0,
    max: 10,
  },
  {
    id: 'hourlyRate',
    label: '¿Cuánto vale tu hora? (€/h)',
    type: 'number',
    placeholder: 'Ej: 25',
    default: 25,
    min: 10,
    max: 200,
  },
];

export function calculateROI(inputs: {
  properties: number;
  hoursPerWeek: number;
  tools: number;
  hourlyRate: number;
}) {
  const softwareSavings = inputs.tools * 100 * 12;
  const timeSavings = inputs.hoursPerWeek * 0.6 * 4 * 12 * inputs.hourlyRate;
  const morositySavings = inputs.properties * 100;

  const totalSavings = softwareSavings + timeSavings + morositySavings;

  let plan = 'BÁSICO';
  let planCost = 149 * 12;

  if (inputs.properties > 50) {
    plan = 'ENTERPRISE';
    planCost = 749 * 12;
  } else if (inputs.properties > 10) {
    plan = 'PRO';
    planCost = 349 * 12;
  }

  const netBenefit = totalSavings - planCost;
  const roi = Math.round((netBenefit / planCost) * 100);

  return {
    softwareSavings,
    timeSavings,
    morositySavings,
    totalSavings,
    plan,
    planCost,
    netBenefit,
    roi,
  };
}

// ============================================================================
// COMPARISON TABLE DATA
// ============================================================================

export const comparisonData: ComparisonRow[] = [
  {
    feature: 'Módulos incluidos',
    inmova: { value: '100+', highlight: true, icon: '✅' },
    homming: { value: '35' },
    rentger: { value: '42' },
    buildium: { value: '28' },
  },
  {
    feature: 'Verticales de negocio',
    inmova: { value: '7 + B2B', highlight: true, icon: '✅' },
    homming: { value: '2' },
    rentger: { value: '3' },
    buildium: { value: '2' },
  },
  {
    feature: 'IA integrada',
    inmova: { value: '✅', highlight: true },
    homming: { value: '❌' },
    rentger: { value: '❌' },
    buildium: { value: '❌' },
  },
  {
    feature: 'Blockchain',
    inmova: { value: '✅', highlight: true },
    homming: { value: '❌' },
    rentger: { value: '❌' },
    buildium: { value: '❌' },
  },
  {
    feature: 'Precio/mes',
    inmova: { value: '€149-€749', highlight: true, icon: '✅' },
    homming: { value: '€300-€1,200' },
    rentger: { value: '€250-€900' },
    buildium: { value: '€400-€1,500' },
  },
  {
    feature: 'Sin permanencia',
    inmova: { value: '✅ Mensual', highlight: true },
    homming: { value: '❌ 12 meses' },
    rentger: { value: '❌ 12 meses' },
    buildium: { value: '❌ Anual' },
  },
  {
    feature: 'Onboarding',
    inmova: { value: '✅ Gratis', highlight: true },
    homming: { value: '€299' },
    rentger: { value: '€199' },
    buildium: { value: '€399' },
  },
  {
    feature: 'Soporte',
    inmova: { value: '24/7 Chat', highlight: true },
    homming: { value: '9-18h' },
    rentger: { value: '9-18h' },
    buildium: { value: 'Email' },
  },
  {
    feature: 'API abierta',
    inmova: { value: '✅', highlight: true },
    homming: { value: '❌' },
    rentger: { value: '✅' },
    buildium: { value: '✅ (pago)' },
  },
  {
    feature: 'Mobile app',
    inmova: { value: '✅ 2025', highlight: true },
    homming: { value: '❌' },
    rentger: { value: '❌' },
    buildium: { value: '✅' },
  },
  {
    feature: 'ROI promedio',
    inmova: { value: '60 días', highlight: true, icon: '🚀' },
    homming: { value: '6-12 meses' },
    rentger: { value: '6-12 meses' },
    buildium: { value: '6-12 meses' },
  },
];

// Continúa en el siguiente mensaje...
// ============================================================================
// TESTIMONIALS DATA
// ============================================================================

export const testimonials: Testimonial[] = [
  {
    id: 1,
    type: 'video',
    name: 'Carlos Martínez',
    role: 'Gestor Inmobiliario',
    location: 'Barcelona',
    avatar: '/avatars/carlos.jpg',
    videoUrl: '/videos/testimonial-carlos.mp4',
    videoPoster: '/videos/testimonial-carlos-poster.jpg',
    quote:
      'Pasé de gestionar 80 a 200 propiedades sin contratar. INMOVA me devolvió 15 horas/semana que ahora dedico a conseguir más clientes.',
    metrics: [
      { label: 'Propiedades', before: '80', after: '200', change: '+150%' },
      { label: 'Tiempo semanal', before: '60h', after: '45h', change: '-15h' },
      { label: 'Facturación', before: '€120K', after: '€280K', change: '+133%' },
    ],
    rating: 5,
    verified: true,
  },
  {
    id: 2,
    type: 'text',
    name: 'María González',
    role: 'Propietaria',
    location: 'Madrid',
    propertiesCount: 3,
    avatar: '/avatars/maria.jpg',
    image: '/images/case-maria-dashboard.jpg',
    quote:
      'Reduje la morosidad de 12% a 2% con el screening de IA. En 8 meses recuperé €18,000 que antes perdía con inquilinos problemáticos. Ahora duermo tranquila.',
    metrics: [
      { label: 'Morosidad', before: '12%', after: '2%', change: '-83%' },
      { label: 'Dinero recuperado', value: '€18,000' },
      { label: 'Tiempo gestión', before: '10h/sem', after: '2h/sem', change: '-80%' },
    ],
    rating: 5,
    verified: true,
  },
  {
    id: 3,
    type: 'text',
    name: 'Laura Ruiz',
    role: 'Agente Inmobiliaria',
    location: 'Valencia',
    avatar: '/avatars/laura.jpg',
    image: '/images/case-laura-sales.jpg',
    quote:
      'Cerré 22 ventas extra este año gracias al lead scoring automático y el follow-up inteligente. ROI de 2,400% en el primer año. INMOVA se paga solo.',
    metrics: [
      { label: 'Ventas anuales', before: '45', after: '67', change: '+49%' },
      { label: 'Comisiones extra', value: '€33,000' },
      { label: 'Conversión leads', before: '55%', after: '78%', change: '+42%' },
    ],
    rating: 5,
    verified: true,
  },
  {
    id: 4,
    type: 'text',
    name: 'David Fernández',
    role: 'Inversor Coliving',
    location: 'Marbella',
    propertiesCount: 180,
    avatar: '/avatars/david.jpg',
    image: '/images/case-david-coliving.jpg',
    quote:
      'El módulo de coliving es brutal. Matching automático redujo conflictos 65% y la ocupación subió de 78% a 91%. €180K más al año sin aumentar operaciones.',
    metrics: [
      { label: 'Ocupación', before: '78%', after: '91%', change: '+13pp' },
      { label: 'Revenue adicional', value: '€180,000/año' },
      { label: 'Conflictos roommates', before: '12/mes', after: '4/mes', change: '-67%' },
    ],
    rating: 5,
    verified: true,
  },
  {
    id: 5,
    type: 'text',
    name: 'Ana Sánchez',
    role: 'Administradora de Fincas',
    location: 'Sevilla',
    avatar: '/avatars/ana.jpg',
    image: '/images/case-ana-voting.jpg',
    quote:
      'Las votaciones telemáticas son un antes y después. Antes tardaba 2 meses en aprobar algo, ahora 3 días. Los propietarios están encantados con el portal.',
    metrics: [
      { label: 'Comunidades', value: '45' },
      { label: 'Tiempo votaciones', before: '60 días', after: '3 días', change: '-95%' },
      { label: 'Satisfacción', before: '65%', after: '92%', change: '+42%' },
    ],
    rating: 5,
    verified: true,
  },
  {
    id: 6,
    type: 'text',
    name: 'Roberto López',
    role: 'Gestor STR (Airbnb)',
    location: 'Málaga',
    propertiesCount: 35,
    avatar: '/avatars/roberto.jpg',
    image: '/images/case-roberto-str.jpg',
    quote:
      'El channel manager integrado es oro puro. Antes usaba 3 herramientas, ahora solo INMOVA. Ahorro €400/mes en software y sincroniza todo automáticamente.',
    metrics: [
      { label: 'Herramientas eliminadas', value: '3' },
      { label: 'Ahorro mensual', value: '€400' },
      { label: 'Revenue management', change: '+18% RevPAR' },
    ],
    rating: 5,
    verified: true,
  },
];

// ============================================================================
// PRICING DATA
// ============================================================================

export const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'BÁSICO',
    tagline: 'Para propietarios',
    price: 149,
    currency: '€',
    period: 'mes',
    description: 'Perfecto para gestionar 1-10 propiedades',
    popular: false,
    features: [
      '✓ Hasta 10 propiedades',
      '✓ 1 usuario',
      '✓ Gestión propiedades y inquilinos',
      '✓ Contratos y documentos',
      '✓ Portal del inquilino',
      '✓ Alertas de pago',
      '✓ Reportes básicos',
      '✓ Soporte chat 9-18h',
      '✓ App móvil',
      '✓ Actualizaciones gratis',
    ],
    notIncluded: [
      '– API abierta',
      '– Dashboard propietarios',
      '– Integraciones portales',
      '– Multi-usuario',
      '– Soporte prioritario',
    ],
    roi: 'ROI en 2 meses',
    idealFor: '1-10 propiedades',
    ctaText: 'Empezar Gratis 30 Días',
    ctaVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'PRO',
    tagline: 'Para gestores profesionales',
    badge: '⭐ MÁS POPULAR',
    price: 349,
    currency: '€',
    period: 'mes',
    description: 'Para gestorías que quieren escalar',
    popular: true,
    features: [
      '✓ Hasta 50 propiedades',
      '✓ 5 usuarios',
      '✓ Todo del plan BÁSICO +',
      '✓ Dashboard para propietarios',
      '✓ API abierta',
      '✓ Integraciones portales (Idealista, Fotocasa)',
      '✓ Reportes automáticos',
      '✓ Multi-usuario con permisos',
      '✓ Soporte prioritario 24/7',
      '✓ Onboarding personalizado',
    ],
    notIncluded: ['– White-label', '– Dedicado account manager', '– SLA garantizado'],
    roi: 'ROI en 1 mes',
    idealFor: '20-50 propiedades',
    savings: 'Ahorras €500/mes vs competidores',
    ctaText: 'Empezar Gratis 30 Días',
    ctaVariant: 'default',
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    tagline: 'Para empresas y fondos',
    price: 749,
    currency: '€',
    period: 'mes',
    description: 'Solución enterprise sin límites',
    popular: false,
    features: [
      '✓ Propiedades ilimitadas',
      '✓ Usuarios ilimitados',
      '✓ Todo del plan PRO +',
      '✓ White-label (tu marca)',
      '✓ Account manager dedicado',
      '✓ SLA 99.9% garantizado',
      '✓ Onboarding premium (40h)',
      '✓ Migración de datos incluida',
      '✓ Integraciones custom',
      '✓ Soporte telefónico 24/7',
      '✓ Reporting ejecutivo',
      '✓ Training mensual equipo',
    ],
    notIncluded: [],
    roi: 'ROI en 1 mes',
    idealFor: '100+ propiedades',
    ctaText: 'Agendar Demo Enterprise',
    ctaVariant: 'outline',
  },
];

export const additionalPlans: Partial<PricingPlan>[] = [
  {
    id: 'agency',
    name: 'AGENCIA',
    price: 449,
    description: 'Para agencias inmobiliarias',
    features: ['CRM especializado', 'Lead scoring IA', 'Multi-portal', 'Marketing automation'],
  },
  {
    id: 'coliving',
    name: 'COLIVING',
    price: 599,
    description: 'Para operadores coliving',
    features: ['Room Rental PRO', 'Matching IA', 'Community management', 'Eventos'],
  },
  {
    id: 'adminfincas',
    name: 'ADMIN FINCAS',
    price: 299,
    description: 'Para administradores de fincas',
    features: ['Votaciones telemáticas', 'Portal propietario', 'Actas digitales', 'Gestión cuotas'],
  },
];

// ============================================================================
// FAQ DATA
// ============================================================================

export const faqs: FAQ[] = [
  {
    id: 1,
    category: 'General',
    question: '¿Es realmente fácil de usar?',
    answer:
      'Sí. El 94% de nuestros usuarios dicen que es "facilísimo". El setup inicial toma solo 10 minutos con nuestro asistente guiado. Si usas WhatsApp, puedes usar INMOVA. Además, incluimos onboarding personalizado y tutoriales en video.',
  },
  {
    id: 2,
    category: 'Migración',
    question: '¿Qué pasa con mis datos actuales?',
    answer:
      'Los migramos gratis. Puedes importar desde Excel en 1 clic o nuestro equipo lo hace por ti sin costo adicional. Soportamos importación desde Homming, Rentger y otros competidores.',
  },
  {
    id: 3,
    category: 'Facturación',
    question: '¿Puedo cancelar en cualquier momento?',
    answer:
      'Sí. Sin permanencia, sin preguntas, sin penalización. Cancelas cuando quieras desde tu panel de control. Si cancelas, tus datos están disponibles para exportar durante 90 días.',
  },
  {
    id: 4,
    category: 'Técnico',
    question: '¿Necesito saber de tecnología?',
    answer:
      'No. INMOVA está diseñado para personas sin conocimientos técnicos. Si usas WhatsApp o email, puedes usar INMOVA. Además, nuestro soporte está disponible 24/7 para ayudarte.',
  },
  {
    id: 5,
    category: 'Prueba Gratis',
    question: '¿Qué pasa si no me gusta después de la prueba?',
    answer:
      '30 días gratis sin tarjeta de crédito. Si no te gusta, simplemente no activas la suscripción y ya está. Sin preguntas, sin compromisos. Además, si en los primeros 60 días no estás satisfecho, te devolvemos el dinero.',
  },
  {
    id: 6,
    category: 'Seguridad',
    question: '¿Mis datos están seguros?',
    answer:
      'Sí. Usamos encriptación bancaria (AES-256), certificación ISO 27001, cumplimos GDPR, backups diarios automáticos y servidores en la UE. Tus datos están más seguros que en tu ordenador.',
  },
  {
    id: 7,
    category: 'Mobile',
    question: '¿Funciona en móvil?',
    answer:
      'Sí. 100% responsive y optimizado para móvil. Puedes hacer todo desde tu smartphone. App nativa iOS y Android disponibles en Q2 2025.',
  },
  {
    id: 8,
    category: 'Contrato',
    question: '¿Hay contratos de permanencia?',
    answer:
      'No. Mes a mes. Cancela cuando quieras sin penalización. Creemos en ganarnos tu confianza cada mes, no en atarte con contratos.',
  },
  {
    id: 9,
    category: 'Soporte',
    question: '¿Qué tipo de soporte incluye?',
    answer:
      'Todos los planes incluyen soporte por chat. Planes PRO y superiores tienen soporte 24/7 prioritario. Enterprise incluye teléfono dedicado y account manager. Además: base de conocimientos, webinars mensuales y comunidad de usuarios.',
  },
  {
    id: 10,
    category: 'ROI',
    question: '¿Realmente vale la pena el precio?',
    answer:
      'Sí. ROI promedio de nuestros clientes: 634% en el primer año. Ahorras €500+/mes en software, 8h/semana en tiempo (€1,280/mes) y reduces morosidad 80% (€100+/mes). Total: €1,880/mes ahorro vs €149-€749 costo. Haz los números.',
  },
  {
    id: 11,
    category: 'Integraciones',
    question: '¿Se integra con mis herramientas actuales?',
    answer:
      'Sí. API abierta disponible en planes PRO y superiores. Integraciones nativas con: Idealista, Fotocasa, Stripe, contabilidad (Holded, Sage), email (Gmail, Outlook), calendario, y más. Si necesitas algo específico, podemos desarrollarlo.',
  },
  {
    id: 12,
    category: 'Actualizaciones',
    question: '¿Las actualizaciones cuestan extra?',
    answer:
      'No. Todas las actualizaciones y nuevas funcionalidades están incluidas gratis. Lanzamos mejoras cada semana. Sin costos ocultos.',
  },
  {
    id: 13,
    category: 'Equipo',
    question: '¿Puedo dar acceso a mi equipo?',
    answer:
      'Sí. Multi-usuario con permisos granulares. Plan BÁSICO incluye 1 usuario, PRO 5 usuarios, ENTERPRISE ilimitados. Cada miembro del equipo tiene su login y permisos personalizados.',
  },
  {
    id: 14,
    category: 'Escalabilidad',
    question: '¿Qué pasa si crezco y necesito más?',
    answer:
      'Cambia de plan en cualquier momento con 1 clic. Prorrateo automático del pago. Si necesitas algo custom (1,000+ propiedades), contáctanos para plan Enterprise personalizado.',
  },
  {
    id: 15,
    category: 'Demo',
    question: '¿Puedo ver una demo antes de probar?',
    answer:
      'Sí. Demo en vivo de 2 minutos disponible arriba. O agenda una demo personalizada de 20-30 minutos con nuestro equipo sin compromiso.',
  },
];

// ============================================================================
// FOOTER DATA
// ============================================================================

export const footerSections: Record<string, FooterSection> = {
  product: {
    title: 'Producto',
    links: [
      { label: 'Funcionalidades', href: '#features' },
      { label: 'Precios', href: '#pricing' },
      { label: 'Demo', href: '#demo' },
      { label: 'Roadmap', href: '/roadmap' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  solutions: {
    title: 'Soluciones',
    links: [
      { label: 'Para Propietarios', href: '/propietarios' },
      { label: 'Para Gestores', href: '/gestores' },
      { label: 'Para Agentes', href: '/agentes' },
      { label: 'Para Coliving', href: '/coliving' },
      { label: 'Para Admin Fincas', href: '/admin-fincas' },
      { label: 'Para Construcción (ewoorker)', href: '/ewoorker-landing' },
    ],
  },
  resources: {
    title: 'Recursos',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Casos de Éxito', href: '/casos-exito' },
      { label: 'Guías Gratis', href: '/guias' },
      { label: 'Webinars', href: '/webinars' },
      { label: 'API Docs', href: '/docs/api' },
    ],
  },
  company: {
    title: 'Empresa',
    links: [
      { label: 'Sobre Nosotros', href: '/about' },
      { label: 'Contacto', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Prensa', href: '/press' },
      { label: 'Programa de Partners', href: '/partners' },
      { label: 'Partners Bancos', href: '/partners/bancos' },
      { label: 'Partners Aseguradoras', href: '/partners/aseguradoras' },
      { label: 'Partners Escuelas', href: '/partners/escuelas' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Términos de Uso', href: '/terms' },
      { label: 'Privacidad', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
      { label: 'Seguridad', href: '/security' },
    ],
  },
};

export const socialLinks: SocialLink[] = [
  {
    platform: 'LinkedIn',
    url: 'https://linkedin.com/company/inmova',
    icon: 'LinkedIn',
  },
  { platform: 'Twitter', url: 'https://twitter.com/inmovaapp', icon: 'Twitter' },
  { platform: 'Facebook', url: 'https://facebook.com/inmovaapp', icon: 'Facebook' },
  {
    platform: 'Instagram',
    url: 'https://instagram.com/inmovaapp',
    icon: 'Instagram',
  },
  { platform: 'YouTube', url: 'https://youtube.com/@inmovaapp', icon: 'YouTube' },
];

export const contactInfo = {
  email: 'hola@inmovaapp.com',
  phone: '+34 900 123 456',
  address: 'Madrid, España',
};

export const trustBadges = [
  '🔒 ISO 27001 Certified',
  '✅ GDPR Compliant',
  '💳 Pago Seguro Stripe',
  '🇪🇺 Servidores en UE',
];

// ============================================================================
// SEO METADATA
// ============================================================================

export const seoMetadata = {
  title: 'INMOVA - Ecosistema PropTech Completo | Alquiler + Construcción + Partners',
  description:
    'El ecosistema PropTech más completo: Alquiler, Coliving, Construcción B2B (ewoorker), Seguros, Partners. 7 verticales + 20 módulos. ✓ 3,000+ usuarios ✓ 4.8/5 ⭐ ✓ Prueba gratis 30 días.',
  keywords:
    'software gestión inmobiliaria, proptech españa, gestión alquileres, crm inmobiliario, software propietarios, gestión inquilinos, alternativa homming, software agentes inmobiliarios, construcción B2B, ewoorker, seguros inmobiliarios, partners inmobiliarios',
  openGraph: {
    title: 'INMOVA - Del Alquiler a la Construcción: Ecosistema PropTech Completo',
    description:
      '7 verticales + 20 módulos | Alquiler, Coliving, Construcción B2B | ROI en 60 días | 3,000+ usuarios',
    image: 'https://inmovaapp.com/og-image.jpg',
    type: 'website',
    url: 'https://inmovaapp.com',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@inmovaapp',
    creator: '@inmovaapp',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatPrice(price: number, currency: string = '€'): string {
  return `${currency}${price.toLocaleString('es-ES')}`;
}

export function formatMetric(metric: Metric): string {
  if (metric.value) return metric.value;
  if (metric.before && metric.after && metric.change) {
    return `${metric.before} → ${metric.after} (${metric.change})`;
  }
  return '';
}

export function getPlanRecommendation(properties: number): string {
  if (properties <= 10) return 'basic';
  if (properties <= 50) return 'pro';
  return 'enterprise';
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  navigationItems,
  heroData,
  socialProofStats,
  problemData,
  solutionData,
  personaTabs,
  roiCalculatorFields,
  calculateROI,
  comparisonData,
  testimonials,
  pricingPlans,
  additionalPlans,
  faqs,
  footerSections,
  socialLinks,
  contactInfo,
  trustBadges,
  seoMetadata,
};
