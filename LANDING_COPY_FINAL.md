# 🎨 COPY FINAL LANDING PAGE - INMOVA

**Versión:** 1.0 Final  
**Fecha:** 29 Diciembre 2025  
**Status:** ✅ LISTO PARA IMPLEMENTAR

---

## 📋 ÍNDICE DE SECCIONES

1. [Navigation](#navigation)
2. [Hero Section](#hero-section)
3. [Social Proof Bar](#social-proof-bar)
4. [Problema Section](#problema-section)
5. [Solución Section](#solución-section)
6. [Features by Persona](#features-by-persona)
7. [ROI Calculator](#roi-calculator)
8. [Comparación Competidores](#comparación-competidores)
9. [Casos de Éxito](#casos-de-éxito)
10. [Pricing Section](#pricing-section)
11. [FAQ Section](#faq-section)
12. [Footer](#footer)

---

## 1. NAVIGATION

### Logo Text

```
INMOVA
```

### Menu Items

```typescript
[
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Precios', href: '#pricing' },
  { label: 'Casos de Éxito', href: '#testimonials' },
  { label: 'Demo', href: '#demo', variant: 'outline' },
  { label: 'Login', href: '/login', variant: 'default' },
];
```

---

## 2. HERO SECTION

### Eyebrow (Pequeño texto arriba)

```
🏠 LA PLATAFORMA PROPTECH #1 EN ESPAÑA
```

### Headline Principal (H1)

```
Gestiona tus Propiedades en Piloto Automático y Aumenta tu ROI un 40%
```

### Subheadline (H2)

```
88 módulos todo-en-uno | Sin permanencia | Desde €149/mes
```

### Description

```
La única plataforma que centraliza, automatiza y optimiza toda tu gestión inmobiliaria. Elimina 5 herramientas, ahorra 8 horas/semana y reduce morosidad 80%.
```

### CTAs

```typescript
primaryCTA: {
  text: "🚀 Prueba GRATIS 30 Días",
  subtext: "Sin tarjeta · Setup en 10 min",
  href: "/signup",
  variant: "default",
  size: "lg"
}

secondaryCTA: {
  text: "▶️ Ver Demo (2 min)",
  href: "#demo",
  variant: "outline",
  size: "lg"
}
```

### Trust Badges (debajo de CTAs)

```typescript
[
  { icon: 'CheckCircle', text: 'Sin tarjeta de crédito' },
  { icon: 'Clock', text: 'Setup en 10 minutos' },
  { icon: 'Headphones', text: 'Soporte 24/7' },
];
```

### Social Proof Mini

```
⭐⭐⭐⭐⭐ 4.8/5 · Más de 500 propietarios confían en INMOVA
```

---

## 3. SOCIAL PROOF BAR (Sticky)

### Stats

```typescript
[
  { icon: 'Trophy', label: '#1 PropTech España' },
  { icon: 'Users', label: '500+ clientes activos' },
  { icon: 'Star', label: '4.8/5 estrellas' },
  { icon: 'Euro', label: '€2.5M gestionados/mes' },
  { icon: 'Zap', label: '99.9% uptime' },
  { icon: 'Shield', label: 'ISO 27001 certificado' },
];
```

---

## 4. PROBLEMA SECTION

### Headline

```
¿Te Identificas con Alguna de Estas Situaciones?
```

### Subheadline

```
Si dijiste "SÍ" a 2 o más, INMOVA es la solución que necesitas
```

### Pain Points

```typescript
[
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
    description: 'No sabes si tus propiedades son realmente rentables. Tomas decisiones a ciegas.',
  },
];
```

### CTA

```
Quiero Solucionar Esto Ahora →
```

---

## 5. SOLUCIÓN SECTION

### Headline

```
Gestiona TODAS tus Propiedades en 1 Solo Lugar (y Desde tu Móvil 📱)
```

### Subheadline

```
Centraliza, automatiza y optimiza tu gestión inmobiliaria en 3 pasos simples
```

### Steps

```typescript
[
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
  },
];
```

### CTA

```
Ver Demo Completa (2 min) →
```

---

## 6. FEATURES BY PERSONA

### Headline

```
La Solución Perfecta Para Ti (Sea Cual Sea tu Perfil)
```

### Tabs

```typescript
['👤 Propietarios', '🏢 Gestores', '🏘️ Agentes', '💼 Inversores'];
```

### Content por Tab

#### TAB 1: PROPIETARIOS (1-10 propiedades)

**Headline:**

```
Para Propietarios que Quieren Simplicidad y Resultados
```

**Features:**

```typescript
[
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
    description: 'Ellos reportan incidencias, pagan online y acceden a documentos. Sin llamadas.',
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
];
```

**Pricing:**

```
💰 Plan BÁSICO: €149/mes
🎁 Ahorras vs gestora tradicional: €200/mes
📊 ROI: Recuperas inversión en 2 meses
```

**CTA:**

```
Empezar Prueba Gratis 30 Días →
```

#### TAB 2: GESTORES (20-200 propiedades)

**Headline:**

```
Para Gestores que Quieren Escalar sin Contratar
```

**Features:**

```typescript
[
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
];
```

**Pricing:**

```
💰 Plan PRO: €349/mes
🎁 Ahorras en software: €500/mes (eliminas 5 herramientas)
🎁 Ahorras en tiempo: €2,000/mes (15h/semana × €30/h)
📊 ROI: Recuperas inversión en 1 mes
```

**CTA:**

```
Agendar Demo Personalizada →
```

#### TAB 3: AGENTES (Inmobiliarias)

**Headline:**

```
Para Agentes que Quieren Cerrar Más Ventas
```

**Features:**

```typescript
[
  {
    icon: 'Target',
    title: 'CRM Inmobiliario Especializado',
    description: 'Pipeline de ventas optimizado para inmobiliario. No más CRMs genéricos.',
    metric: '30% más conversión',
  },
  {
    icon: 'Brain',
    title: 'Lead Scoring con IA',
    description: 'IA prioriza leads con mayor probabilidad de compra. Enfócate en lo importante.',
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
];
```

**Pricing:**

```
💰 Plan AGENCIA: €449/mes
🎁 ROI estimado: +20 ventas/año = €30,000 comisiones extra
📊 Inversión anual: €5,388
💎 Retorno: €30,000
🚀 ROI: 556%
```

**CTA:**

```
Calcular Mi ROI Personalizado →
```

#### TAB 4: INVERSORES (Coliving/Fondos)

**Headline:**

```
Para Inversores que Quieren Escalar sin Límites
```

**Features:**

```typescript
[
  {
    icon: 'Building',
    title: 'Módulo Room Rental PRO',
    description: 'Gestión especializada para coliving: habitaciones, roommates, espacios comunes.',
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
];
```

**Pricing:**

```
💰 Plan ENTERPRISE: desde €749/mes
🎁 Aumento ocupación: +14% = €200K/año extra (180 rooms × €650/mes)
📊 Inversión anual: €8,988
💎 Retorno: €200,000
🚀 ROI: 2,226%
```

**CTA:**

```
Agendar Demo Enterprise →
```

---

## 7. ROI CALCULATOR

### Headline

```
Calcula Cuánto Ahorrarías con INMOVA
```

### Subheadline

```
Resultados en tiempo real · Basado en datos de +500 clientes
```

### Form Fields

```typescript
[
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
```

### Results Template

```typescript
// Cálculos:
const softwareSavings = tools * 100 * 12; // €100/herramienta/mes
const timeSavings = hoursPerWeek * 0.6 * 4 * 12 * hourlyRate; // 60% reducción
const morositySavings = properties * 100; // €100/propiedad/año promedio

const totalSavings = softwareSavings + timeSavings + morositySavings;

// Plan recomendado
let plan = 'BÁSICO';
let planCost = 149 * 12;
if (properties > 50) {
  plan = 'ENTERPRISE';
  planCost = 749 * 12;
} else if (properties > 10) {
  plan = 'PRO';
  planCost = 349 * 12;
}

const netBenefit = totalSavings - planCost;
const roi = ((netBenefit / planCost) * 100).toFixed(0);
```

### Results Display

```
┌──────────────────────────────────────────────┐
│     TU AHORRO ANUAL CON INMOVA               │
└──────────────────────────────────────────────┘

💰 Ahorro en software:        €{softwareSavings}/año
⏰ Ahorro en tiempo:           €{timeSavings}/año
📉 Reducción morosidad:        €{morositySavings}/año
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 TOTAL AHORRO:              €{totalSavings}/año

🔥 Costo INMOVA (Plan {plan}): -€{planCost}/año
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ BENEFICIO NETO:            €{netBenefit}/año

ROI: {roi}% 🚀

Tu plan ideal: {plan}
```

### CTA

```
Empezar Ahora y Ahorrar €{netBenefit} →
```

---

## 8. COMPARACIÓN COMPETIDORES

### Headline

```
INMOVA vs La Competencia (Comparación Honesta)
```

### Subheadline

```
Por qué +500 clientes eligieron INMOVA sobre Homming, Rentger y Buildium
```

### Table Data

```typescript
const comparison = {
  headers: ['Feature', 'INMOVA', 'Homming', 'Rentger', 'Buildium'],
  rows: [
    {
      feature: 'Módulos incluidos',
      inmova: { value: '88', highlight: true, icon: '✅' },
      homming: { value: '35' },
      rentger: { value: '42' },
      buildium: { value: '28' },
    },
    {
      feature: 'Verticales de negocio',
      inmova: { value: '7', highlight: true, icon: '✅' },
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
  ],
};
```

### Winner Badge

```
🏆 GANADOR CLARO: INMOVA
50-70% más barato · 3x más funcionalidad · ROI 10x más rápido
```

### CTA

```
Probar INMOVA Gratis 30 Días →
```

---

## 9. CASOS DE ÉXITO

### Headline

```
Lo Que Dicen Nuestros Clientes (Resultados Reales 📊)
```

### Subheadline

```
+500 propietarios, gestores y agentes transformaron su negocio con INMOVA
```

### Testimonials

```typescript
const testimonials = [
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
```

### View More CTA

```
Ver 47 Casos de Éxito Más →
```

### Stats Summary

```
📊 Resultados Promedio de Nuestros Clientes:

• 8 horas/semana ahorradas
• 80% reducción morosidad
• ROI en 60 días
• 40% aumento rentabilidad
• 95% satisfaction rate
```

---

## 10. PRICING SECTION

### Headline

```
Elige el Plan Perfecto Para Ti
```

### Subheadline

```
Sin permanencia · Cancela cuando quieras · 30 días gratis sin tarjeta
```

### Plans

```typescript
const plans = [
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
```

### Additional Plans (Collapsed)

```typescript
const additionalPlans = [
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
```

### Trust Elements

```
💳 Todos los planes incluyen:
• 30 días gratis sin tarjeta
• Sin permanencia (cancela cuando quieras)
• Sin costos de setup
• Sin límite de propiedades por usuario
• Actualizaciones gratis incluidas
• Migración de datos gratis
• Soporte incluido
• Backups diarios automáticos
• Seguridad ISO 27001

🔒 Pago 100% seguro con Stripe
🔄 Garantía de satisfacción 30 días
```

### FAQ Pricing

```
¿No sabes qué plan elegir?
→ Usa nuestra calculadora de plan ideal

¿Necesitas más propiedades?
→ Contáctanos para plan personalizado

¿Descuentos por pago anual?
→ Sí, 2 meses gratis (ahorra 17%)
```

---

## 11. FAQ SECTION

### Headline

```
Preguntas Frecuentes (Respondemos Todo)
```

### Subheadline

```
Si no encuentras tu respuesta, habla con nosotros en el chat →
```

### FAQs

```typescript
const faqs = [
  {
    id: 1,
    category: 'General',
    question: '¿Es realmente fácil de usar?',
    answer:
      "Sí. El 94% de nuestros usuarios dicen que es 'facilísimo'. El setup inicial toma solo 10 minutos con nuestro asistente guiado. Si usas WhatsApp, puedes usar INMOVA. Además, incluimos onboarding personalizado y tutoriales en video.",
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
```

### CTA Section

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    🚀 ¿Listo Para Transformar tu Gestión Inmobiliaria?

         [PROBAR GRATIS 30 DÍAS - SIN TARJETA]

    ✅ Setup en 10 minutos  ✅ Soporte incluido  ✅ Sin riesgo

    👇 O si prefieres ver antes:

         [VER DEMO EN VIVO (2 min)]  [AGENDAR LLAMADA]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 12. FOOTER

### Sections

```typescript
const footerSections = {
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
      { label: 'Partners', href: '/partners' },
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
```

### Contact Info

```
📧 hola@inmovaapp.com
📞 +34 900 123 456
📍 Madrid, España
```

### Social Links

```typescript
const socialLinks = [
  { platform: 'LinkedIn', url: 'https://linkedin.com/company/inmova', icon: 'LinkedIn' },
  { platform: 'Twitter', url: 'https://twitter.com/inmovaapp', icon: 'Twitter' },
  { platform: 'Facebook', url: 'https://facebook.com/inmovaapp', icon: 'Facebook' },
  { platform: 'Instagram', url: 'https://instagram.com/inmovaapp', icon: 'Instagram' },
  { platform: 'YouTube', url: 'https://youtube.com/@inmovaapp', icon: 'YouTube' },
];
```

### Trust Badges

```
🔒 ISO 27001 Certified
✅ GDPR Compliant
💳 Pago Seguro Stripe
🇪🇺 Servidores en UE
```

### Copyright

```
© 2025 INMOVA. Todos los derechos reservados.
Hecho con ❤️ en España para revolucionar el PropTech.
```

---

## 📊 METADATA & SEO

### Page Title

```
INMOVA - Plataforma PropTech #1 | Gestión Inmobiliaria Inteligente
```

### Meta Description

```
Gestiona tus propiedades en piloto automático con INMOVA. 88 módulos, IA integrada, desde €149/mes. ROI en 60 días. ✓ 500+ clientes ✓ 4.8/5 ⭐ ✓ Prueba gratis 30 días.
```

### Keywords

```
software gestión inmobiliaria, proptech españa, gestión alquileres, crm inmobiliario, software propietarios, gestión inquilinos, alternativa homming, software agentes inmobiliarios
```

### Open Graph

```typescript
const openGraph = {
  title: 'INMOVA - Gestiona tus Propiedades en Piloto Automático',
  description: '88 módulos todo-en-uno | ROI en 60 días | Desde €149/mes | 500+ clientes confían',
  image: 'https://inmovaapp.com/og-image.jpg',
  type: 'website',
  url: 'https://inmovaapp.com',
};
```

---

## ✅ COPY CHECKLIST

- [x] Hero section completo
- [x] Social proof bar
- [x] Problema section (5 pain points)
- [x] Solución section (3 pasos)
- [x] Features by persona (4 tabs completos)
- [x] ROI Calculator (fórmulas incluidas)
- [x] Comparación competidores (tabla completa)
- [x] Testimonials (6 casos con métricas)
- [x] Pricing (3 planes principales + 3 adicionales)
- [x] FAQ (15 preguntas + respuestas)
- [x] Footer (completo con links)
- [x] CTAs primarios y secundarios
- [x] Trust signals distribuidos
- [x] Metadata SEO completa

---

**COPY 100% COMPLETO Y LISTO PARA IMPLEMENTAR** ✅

**Próximo paso:** Estructura de datos TypeScript y configuración
