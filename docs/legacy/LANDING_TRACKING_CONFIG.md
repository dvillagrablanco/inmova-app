# 📊 CONFIGURACIÓN DE TRACKING & ANALYTICS - LANDING PAGE

**Versión:** 1.0  
**Fecha:** 29 Diciembre 2025  
**Herramientas:** Google Analytics 4, Hotjar, Microsoft Clarity

---

## 📋 ÍNDICE

1. [Google Analytics 4 Setup](#google-analytics-4-setup)
2. [Eventos Personalizados](#eventos-personalizados)
3. [Conversion Funnels](#conversion-funnels)
4. [Hotjar Heatmaps](#hotjar-heatmaps)
5. [Microsoft Clarity](#microsoft-clarity)
6. [A/B Testing](#ab-testing)
7. [Dashboard de Métricas](#dashboard-de-métricas)

---

## 1. GOOGLE ANALYTICS 4 SETUP

### Instalación

```typescript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  );
}
```

### Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=XXXXXXX
NEXT_PUBLIC_CLARITY_ID=XXXXXXXXXX
```

---

## 2. EVENTOS PERSONALIZADOS

### Configuración de Eventos GA4

```typescript
// lib/analytics/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID!, {
      page_path: url,
    });
  }
};

type GTagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

### Eventos Específicos de Landing

```typescript
// lib/analytics/landing-events.ts
import { event } from './gtag';

export const LandingEvents = {
  // Hero Section
  heroCtaPrimary: () => {
    event({
      action: 'click',
      category: 'CTA',
      label: 'Hero Primary - Prueba Gratis',
    });
  },

  heroCtaSecondary: () => {
    event({
      action: 'click',
      category: 'CTA',
      label: 'Hero Secondary - Ver Demo',
    });
  },

  // Navigation
  navDemo: () => {
    event({
      action: 'click',
      category: 'Navigation',
      label: 'Nav - Demo',
    });
  },

  navLogin: () => {
    event({
      action: 'click',
      category: 'Navigation',
      label: 'Nav - Login',
    });
  },

  // Features by Persona
  personaTabClick: (personaId: string) => {
    event({
      action: 'tab_change',
      category: 'Features',
      label: `Persona Tab - ${personaId}`,
    });
  },

  personaCtaClick: (personaId: string) => {
    event({
      action: 'click',
      category: 'CTA',
      label: `Persona CTA - ${personaId}`,
    });
  },

  // ROI Calculator
  roiCalculatorSubmit: (roi: number) => {
    event({
      action: 'calculate',
      category: 'ROI Calculator',
      label: 'ROI Calculated',
      value: roi,
    });
  },

  roiCalculatorCta: (netBenefit: number) => {
    event({
      action: 'click',
      category: 'CTA',
      label: 'ROI Calculator CTA',
      value: netBenefit,
    });
  },

  // Pricing
  pricingPlanView: (planId: string) => {
    event({
      action: 'view',
      category: 'Pricing',
      label: `Plan View - ${planId}`,
    });
  },

  pricingPlanClick: (planId: string, price: number) => {
    event({
      action: 'click',
      category: 'CTA',
      label: `Pricing CTA - ${planId}`,
      value: price,
    });
  },

  // Testimonials
  testimonialVideoPlay: (testimonialId: number) => {
    event({
      action: 'play',
      category: 'Testimonials',
      label: `Video ${testimonialId}`,
    });
  },

  testimonialView: (testimonialId: number) => {
    event({
      action: 'view',
      category: 'Testimonials',
      label: `Testimonial ${testimonialId}`,
    });
  },

  // FAQ
  faqExpand: (questionId: number, question: string) => {
    event({
      action: 'expand',
      category: 'FAQ',
      label: `Q${questionId}: ${question}`,
    });
  },

  // Comparison Table
  comparisonView: () => {
    event({
      action: 'view',
      category: 'Comparison',
      label: 'Comparison Table Viewed',
    });
  },

  // Scroll Depth
  scrollDepth: (depth: number) => {
    event({
      action: 'scroll',
      category: 'Engagement',
      label: `Scroll Depth ${depth}%`,
      value: depth,
    });
  },

  // Time on Page
  timeOnPage: (seconds: number) => {
    event({
      action: 'time_on_page',
      category: 'Engagement',
      label: 'Time Spent',
      value: seconds,
    });
  },

  // Form Interactions
  signupFormStart: () => {
    event({
      action: 'start',
      category: 'Form',
      label: 'Signup Form Started',
    });
  },

  signupFormComplete: (plan: string) => {
    event({
      action: 'complete',
      category: 'Form',
      label: `Signup Form Completed - ${plan}`,
    });
  },

  demoFormSubmit: (source: string) => {
    event({
      action: 'submit',
      category: 'Form',
      label: `Demo Request - ${source}`,
    });
  },

  // Exit Intent
  exitIntentPopup: () => {
    event({
      action: 'show',
      category: 'Engagement',
      label: 'Exit Intent Popup',
    });
  },

  exitIntentConversion: () => {
    event({
      action: 'convert',
      category: 'Conversion',
      label: 'Exit Intent Conversion',
    });
  },

  // Social Proof
  socialProofClick: (source: string) => {
    event({
      action: 'click',
      category: 'Social Proof',
      label: source,
    });
  },
};
```

### Hook Personalizado para Tracking

```typescript
// hooks/useLandingTracking.ts
import { useEffect, useCallback } from 'react';
import { LandingEvents } from '@/lib/analytics/landing-events';

export function useLandingTracking() {
  // Scroll Depth Tracking
  useEffect(() => {
    const scrollDepthMarkers = [25, 50, 75, 100];
    const reachedMarkers = new Set<number>();

    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      scrollDepthMarkers.forEach((marker) => {
        if (scrollPercent >= marker && !reachedMarkers.has(marker)) {
          reachedMarkers.add(marker);
          LandingEvents.scrollDepth(marker);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Time on Page Tracking
  useEffect(() => {
    const startTime = Date.now();
    const timeMarkers = [30, 60, 120, 300]; // 30s, 1m, 2m, 5m
    const reachedTimeMarkers = new Set<number>();

    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      timeMarkers.forEach((marker) => {
        if (timeSpent >= marker && !reachedTimeMarkers.has(marker)) {
          reachedTimeMarkers.add(marker);
          LandingEvents.timeOnPage(marker);
        }
      });
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  // Exit Intent Tracking
  useEffect(() => {
    let exitIntentShown = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentShown) {
        exitIntentShown = true;
        LandingEvents.exitIntentPopup();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  return {
    trackCtaClick: useCallback((location: string, label: string) => {
      LandingEvents.heroCtaPrimary(); // O el evento correspondiente
    }, []),
    trackPersonaChange: useCallback((personaId: string) => {
      LandingEvents.personaTabClick(personaId);
    }, []),
    trackRoiCalculation: useCallback((roi: number) => {
      LandingEvents.roiCalculatorSubmit(roi);
    }, []),
  };
}
```

---

## 3. CONVERSION FUNNELS

### Funnel Principal: Trial Signup

```typescript
// GA4 Configuration
const signupFunnel = {
  name: 'Trial Signup Funnel',
  steps: [
    {
      name: 'Landing Page View',
      event: 'page_view',
      condition: { page_location: { contains: '/' } },
    },
    {
      name: 'CTA Click',
      event: 'click',
      condition: { event_category: 'CTA' },
    },
    {
      name: 'Signup Form Started',
      event: 'start',
      condition: { event_category: 'Form' },
    },
    {
      name: 'Signup Form Completed',
      event: 'complete',
      condition: { event_category: 'Form' },
    },
    {
      name: 'Email Verified',
      event: 'verify',
      condition: { event_category: 'Auth' },
    },
  ],
};
```

### Funnels Secundarios

```typescript
const funnels = {
  // Funnel Demo Request
  demoFunnel: {
    name: 'Demo Request Funnel',
    steps: [
      'Landing Page View',
      'Demo CTA Click',
      'Demo Form Started',
      'Demo Form Submitted',
      'Demo Scheduled',
    ],
  },

  // Funnel ROI Calculator
  roiFunnel: {
    name: 'ROI Calculator Funnel',
    steps: [
      'ROI Calculator View',
      'ROI Calculator Interaction',
      'ROI Calculator Complete',
      'ROI Calculator CTA Click',
      'Signup Form Started',
    ],
  },

  // Funnel Pricing
  pricingFunnel: {
    name: 'Pricing to Conversion',
    steps: [
      'Pricing Section View',
      'Plan Hover/View',
      'Plan CTA Click',
      'Signup Form Started',
      'Signup Completed',
    ],
  },

  // Funnel Testimonials
  testimonialsFunnel: {
    name: 'Testimonials Engagement',
    steps: [
      'Testimonials Section View',
      'Testimonial Read/Watch',
      'Testimonial CTA Click',
      'Signup Form Started',
    ],
  },
};
```

---

## 4. HOTJAR HEATMAPS

### Instalación

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <Script
          id="hotjar"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Heatmaps a Configurar

1. **Click Heatmap**: Todos los CTAs principales
2. **Move Heatmap**: Hero section, Features by Persona
3. **Scroll Heatmap**: Toda la landing
4. **Rage Clicks**: Identificar frustración
5. **Dead Clicks**: Elementos que parecen clickeables pero no lo son

### Recordings Triggers

```typescript
// Configuración Hotjar
const recordingTriggers = {
  // Grabar solo sesiones con alta intención
  highIntent: {
    trigger: 'event',
    events: [
      'CTA Click',
      'ROI Calculator Complete',
      'Pricing Plan Hover > 5s',
      'Scroll > 75%',
      'Time on Page > 2 min',
    ],
  },

  // Grabar conversiones
  conversions: {
    trigger: 'event',
    events: ['Signup Form Started', 'Demo Request Submitted'],
  },

  // Grabar frustraciones
  frustration: {
    trigger: 'event',
    events: ['Rage Click', 'Dead Click', 'Quick Exit (<30s)'],
  },
};
```

---

## 5. MICROSOFT CLARITY

### Instalación

```typescript
// app/layout.tsx
<Script
  id="clarity"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
    `,
  }}
/>
```

### Custom Tracking con Clarity

```typescript
// lib/analytics/clarity.ts
export const ClarityEvents = {
  tagSession: (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('set', key, value);
    }
  },

  identifyUser: (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('identify', userId, traits);
    }
  },

  trackEvent: (eventName: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', eventName);
    }
  },
};

// Uso
ClarityEvents.tagSession('persona', 'propietario');
ClarityEvents.tagSession('plan_interest', 'pro');
ClarityEvents.trackEvent('high_intent_user');
```

---

## 6. A/B TESTING

### Setup con Vercel Edge Config

```typescript
// lib/ab-testing.ts
export type Variant = 'control' | 'variant_a' | 'variant_b';

export function getVariant(testName: string): Variant {
  // Check if user already has variant assigned
  const stored = localStorage.getItem(`ab_test_${testName}`);
  if (stored) return stored as Variant;

  // Assign new variant randomly
  const random = Math.random();
  let variant: Variant;

  if (random < 0.33) variant = 'control';
  else if (random < 0.66) variant = 'variant_a';
  else variant = 'variant_b';

  localStorage.setItem(`ab_test_${testName}`, variant);

  // Track assignment
  event({
    action: 'ab_test_assigned',
    category: 'A/B Test',
    label: `${testName} - ${variant}`,
  });

  return variant;
}
```

### Tests Prioritarios

```typescript
// A/B Tests Configuration
export const abTests = {
  // Test 1: Hero Headline
  heroHeadline: {
    name: 'Hero Headline Test',
    variants: {
      control: 'Gestiona tus Propiedades en Piloto Automático',
      variant_a: 'Reduce Morosidad 80% con IA',
      variant_b: 'Ahorra 8 Horas/Semana en Gestión',
    },
    metric: 'CTA Click Rate',
    hypothesis: 'Benefit-focused headlines convert better',
  },

  // Test 2: Primary CTA
  primaryCta: {
    name: 'Primary CTA Text',
    variants: {
      control: '🚀 Prueba GRATIS 30 Días',
      variant_a: 'Empezar Ahora Gratis',
      variant_b: 'Ver Cómo Funciona',
    },
    metric: 'Signup Conversion Rate',
  },

  // Test 3: Pricing Display
  pricingDisplay: {
    name: 'Pricing Display Order',
    variants: {
      control: 'Ascending (€149 → €749)',
      variant_a: 'Descending (€749 → €149)',
      variant_b: 'Popular First (PRO center)',
    },
    metric: 'Plan Selection Rate',
  },

  // Test 4: Social Proof Position
  socialProof: {
    name: 'Social Proof Position',
    variants: {
      control: 'Sticky Bar Top',
      variant_a: 'Below Hero',
      variant_b: 'Multiple Positions',
    },
    metric: 'Trust Signal Engagement',
  },

  // Test 5: Testimonial Format
  testimonialFormat: {
    name: 'Testimonial Format',
    variants: {
      control: 'Text with Photo',
      variant_a: 'Video Primary',
      variant_b: 'Metrics Highlighted',
    },
    metric: 'Testimonials Section Engagement',
  },
};
```

---

## 7. DASHBOARD DE MÉTRICAS

### KPIs Principales

```typescript
// Dashboard Configuration
export const landingKPIs = {
  // Traffic Metrics
  traffic: {
    visitors: { target: 10000, unit: 'users/month' },
    bounceRate: { target: 40, unit: '%', direction: 'lower' },
    avgTimeOnPage: { target: 120, unit: 'seconds', direction: 'higher' },
    pagesPerSession: { target: 3, unit: 'pages', direction: 'higher' },
  },

  // Engagement Metrics
  engagement: {
    scrollDepth75: { target: 60, unit: '%', direction: 'higher' },
    videoPlayRate: { target: 30, unit: '%', direction: 'higher' },
    roiCalculatorUsage: { target: 15, unit: '%', direction: 'higher' },
    faqExpansions: { target: 2, unit: 'avg', direction: 'higher' },
  },

  // Conversion Metrics
  conversion: {
    trialSignups: { target: 50, unit: 'signups/day' },
    conversionRate: { target: 5, unit: '%', direction: 'higher' },
    demoRequests: { target: 10, unit: 'requests/day' },
    leadQuality: { target: 70, unit: '% qualified' },
  },

  // Funnel Metrics
  funnel: {
    heroToSignup: { target: 15, unit: '%' },
    pricingToSignup: { target: 25, unit: '%' },
    demoToSignup: { target: 40, unit: '%' },
    roiToSignup: { target: 35, unit: '%' },
  },

  // CTA Performance
  ctas: {
    heroPrimary: { target: 12, unit: '% CTR' },
    heroSecondary: { target: 8, unit: '% CTR' },
    pricingCtas: { target: 20, unit: '% CTR' },
    exitIntent: { target: 5, unit: '% conversion' },
  },
};
```

### Google Data Studio Template

```sql
-- Query para Data Studio
SELECT
  date,
  COUNT(DISTINCT user_pseudo_id) as visitors,
  COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
  COUNT(CASE WHEN event_name = 'click' AND event_category = 'CTA' THEN 1 END) as cta_clicks,
  COUNT(CASE WHEN event_name = 'complete' AND event_category = 'Form' THEN 1 END) as signups,
  SAFE_DIVIDE(
    COUNT(CASE WHEN event_name = 'complete' THEN 1 END),
    COUNT(DISTINCT user_pseudo_id)
  ) * 100 as conversion_rate,
  AVG(CASE WHEN event_name = 'time_on_page' THEN event_value END) as avg_time_on_page
FROM `analytics.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  AND page_location LIKE '%inmovaapp.com%'
GROUP BY date
ORDER BY date DESC
```

---

## 📊 RESUMEN DE IMPLEMENTACIÓN

### Checklist

- [ ] Google Analytics 4 instalado
- [ ] Eventos personalizados configurados
- [ ] Funnels de conversión creados
- [ ] Hotjar heatmaps activos
- [ ] Microsoft Clarity instalado
- [ ] A/B testing framework implementado
- [ ] Dashboard de métricas configurado
- [ ] Alertas automáticas configuradas
- [ ] Weekly reports automatizados
- [ ] Team access configurado

### Próximos Pasos

1. **Semana 1**: Instalar tracking básico (GA4, Hotjar)
2. **Semana 2**: Configurar eventos personalizados
3. **Semana 3**: Crear funnels y dashboards
4. **Semana 4**: Lanzar primeros A/B tests
5. **Semana 5-8**: Optimizar basado en datos

---

**TRACKING COMPLETO Y LISTO PARA IMPLEMENTAR** ✅
