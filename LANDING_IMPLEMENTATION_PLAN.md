# 🚀 PLAN DE IMPLEMENTACIÓN TÉCNICO - LANDING PAGE

**Versión:** 1.0  
**Fecha:** 29 Diciembre 2025  
**Duración estimada:** 5-7 días (1 desarrollador senior)

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Componentes](#arquitectura-de-componentes)
3. [Plan de Implementación por Fases](#plan-de-implementación-por-fases)
4. [Checklist Técnico](#checklist-técnico)
5. [Testing Strategy](#testing-strategy)
6. [Deployment](#deployment)

---

## 1. RESUMEN EJECUTIVO

### Objetivo

Implementar landing page de alta conversión (objetivo >5%) con todos los componentes optimizados, tracking completo y assets visuales.

### Stack Técnico

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Tracking:** GA4 + Hotjar + Clarity
- **Images:** next/image optimizado
- **Deployment:** Vercel

### Métricas de Éxito

- ✅ Lighthouse Score >90
- ✅ Time to Interactive <3s
- ✅ Conversion Rate >5%
- ✅ Mobile Score 100/100
- ✅ Accessibility Score >95

---

## 2. ARQUITECTURA DE COMPONENTES

### 2.1 Estructura de Archivos

```
app/
├── page.tsx                          # Landing page principal
├── layout.tsx                        # Root layout (GA4, fonts)
└── (landing)/
    └── _components/
        ├── Navigation.tsx            # Header sticky
        ├── HeroSection.tsx           # Hero above fold
        ├── SocialProofBar.tsx        # Sticky stats bar
        ├── ProblemSection.tsx        # Pain points
        ├── SolutionSection.tsx       # 3-step solution
        ├── FeaturesByPersona.tsx     # Tabs dinámicos
        ├── ROICalculator.tsx         # Calculator interactivo
        ├── ComparisonTable.tsx       # vs Competidores
        ├── TestimonialsSection.tsx   # Social proof
        ├── PricingSection.tsx        # Plans + CTAs
        ├── FAQSection.tsx            # Accordions
        └── Footer.tsx                # Footer completo

components/
└── landing/
    ├── CTAButton.tsx                 # Reusable CTA
    ├── TestimonialCard.tsx           # Card individual
    ├── PricingCard.tsx               # Plan card
    ├── FeatureCard.tsx               # Feature item
    ├── StatCard.tsx                  # Stat display
    ├── FAQItem.tsx                   # FAQ accordion
    └── SectionContainer.tsx          # Wrapper sections

lib/
├── analytics/
│   ├── gtag.ts                       # GA4 helpers
│   ├── landing-events.ts             # Event definitions
│   └── clarity.ts                    # Clarity helpers
├── data/
│   └── landing-data.ts               # Data export
└── utils/
    └── roi-calculator.ts             # ROI logic

hooks/
└── useLandingTracking.ts             # Custom tracking hook

public/
├── images/                           # Optimized images
├── videos/                           # Video assets
└── icons/                            # Custom SVG icons
```

### 2.2 Component Hierarchy

```
LandingPage
├── Navigation
│   ├── Logo
│   ├── NavItems[]
│   └── CTAButtons
├── HeroSection
│   ├── Headline
│   ├── Description
│   ├── CTAPrimary
│   ├── CTASecondary
│   ├── TrustBadges[]
│   └── HeroImage
├── SocialProofBar (Sticky)
│   └── Stats[]
├── ProblemSection
│   ├── Headline
│   └── PainPoints[]
├── SolutionSection
│   ├── Headline
│   └── Steps[]
│       ├── StepImage
│       ├── StepContent
│       └── Benefits[]
├── FeaturesByPersona
│   ├── Tabs[]
│   └── TabContent
│       ├── Features[]
│       ├── Pricing
│       └── CTA
├── ROICalculator
│   ├── Form
│   ├── ResultsDisplay
│   └── CTA
├── ComparisonTable
│   ├── Headers
│   └── Rows[]
├── TestimonialsSection
│   └── Testimonials[]
│       ├── Video (if applicable)
│       ├── Quote
│       ├── Metrics[]
│       └── Avatar
├── PricingSection
│   └── Plans[]
│       ├── Badge (if popular)
│       ├── Features[]
│       ├── NotIncluded[]
│       └── CTA
├── FAQSection
│   └── FAQItems[]
│       ├── Question
│       └── Answer (collapsible)
└── Footer
    ├── Sections[]
    ├── Social[]
    ├── Contact
    └── Legal
```

---

## 3. PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1: Setup & Infrastructure (Día 1 - 4h)

#### 1.1 Setup Proyecto

- [ ] Verificar Next.js 15 + Tailwind config
- [ ] Instalar dependencias necesarias
- [ ] Configurar Framer Motion
- [ ] Setup GA4, Hotjar, Clarity
- [ ] Configurar variables de entorno

```bash
# Instalar dependencias faltantes
yarn add framer-motion @next/third-parties
yarn add -D @types/gtag.js
```

#### 1.2 Crear Estructura Base

- [ ] Crear carpeta `app/(landing)/_components/`
- [ ] Crear `LANDING_DATA_STRUCTURE.ts`
- [ ] Setup analytics (`lib/analytics/`)
- [ ] Crear hooks (`hooks/useLandingTracking.ts`)

**Tiempo estimado:** 4 horas

---

### FASE 2: Components Base (Día 1-2 - 8h)

#### 2.1 Layout Components

- [ ] `Navigation.tsx` - Header sticky
- [ ] `Footer.tsx` - Footer completo
- [ ] `SectionContainer.tsx` - Wrapper reutilizable

**Código ejemplo Navigation:**

```typescript
// app/(landing)/_components/Navigation.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { navigationItems } from '@/lib/data/landing-data';
import { cn } from '@/lib/utils';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-md'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          INMOVA
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="#demo">Demo</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
```

#### 2.2 Reusable Components

- [ ] `CTAButton.tsx` - Botones de acción
- [ ] `StatCard.tsx` - Métricas display
- [ ] `SectionHeading.tsx` - Headings consistentes

**Tiempo estimado:** 8 horas

---

### FASE 3: Hero & Social Proof (Día 2 - 6h)

#### 3.1 Hero Section

- [ ] Implementar layout responsive
- [ ] Integrar imagen optimizada
- [ ] Animaciones entrada (Framer Motion)
- [ ] CTAs con tracking
- [ ] Trust badges

**Código ejemplo Hero:**

```typescript
// app/(landing)/_components/HeroSection.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { heroData } from '@/lib/data/landing-data';
import { LandingEvents } from '@/lib/analytics/landing-events';
import { CheckCircle, Clock, Headphones } from 'lucide-react';

const trustBadgeIcons = {
  CheckCircle,
  Clock,
  Headphones,
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-block">
            <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
              {heroData.eyebrow}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            {heroData.headline}
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed">
            {heroData.subheadline}
          </p>

          <p className="text-lg text-gray-600">
            {heroData.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => LandingEvents.heroCtaPrimary()}
              asChild
            >
              <a href={heroData.primaryCTA.href}>
                {heroData.primaryCTA.text}
                <span className="block text-xs mt-1 opacity-80">
                  {heroData.primaryCTA.subtext}
                </span>
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => LandingEvents.heroCtaSecondary()}
              asChild
            >
              <a href={heroData.secondaryCTA.href}>
                {heroData.secondaryCTA.text}
              </a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 pt-4">
            {heroData.trustBadges.map((badge, index) => {
              const Icon = trustBadgeIcons[badge.icon as keyof typeof trustBadgeIcons];
              return (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon className="w-5 h-5 text-green-600" />
                  <span>{badge.text}</span>
                </div>
              );
            })}
          </div>

          {/* Social Proof */}
          <p className="text-sm text-gray-600 pt-4">
            {heroData.socialProof}
          </p>
        </motion.div>

        {/* Right Column - Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={heroData.heroImage}
              alt="INMOVA Dashboard"
              width={1920}
              height={1080}
              priority
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

#### 3.2 Social Proof Bar

- [ ] Sticky positioning
- [ ] Stats animados
- [ ] Responsive design

**Tiempo estimado:** 6 horas

---

### FASE 4: Problem & Solution (Día 3 - 6h)

#### 4.1 Problem Section

- [ ] Grid layout pain points
- [ ] Icon + descripción
- [ ] Hover effects
- [ ] CTA al final

#### 4.2 Solution Section

- [ ] 3 steps con imágenes
- [ ] Animaciones scroll
- [ ] Benefits lists
- [ ] Metrics destacados

**Tiempo estimado:** 6 horas

---

### FASE 5: Features & Calculator (Día 3-4 - 10h)

#### 5.1 Features by Persona

- [ ] Tabs component dinámico
- [ ] Content switching
- [ ] Features grid
- [ ] CTAs personalizados

**Código ejemplo Tabs:**

```typescript
// app/(landing)/_components/FeaturesByPersona.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { personaTabs } from '@/lib/data/landing-data';
import { LandingEvents } from '@/lib/analytics/landing-events';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { Button } from '@/components/ui/button';

export function FeaturesByPersona() {
  const [activeTab, setActiveTab] = useState(personaTabs[0].id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    LandingEvents.personaTabClick(tabId);
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            La Solución Perfecta Para Ti
          </h2>
          <p className="text-xl text-gray-600">
            Sea cual sea tu perfil
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto mb-12">
            {personaTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-lg">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {personaTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-12">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4">{tab.headline}</h3>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tab.features.map((feature, index) => (
                  <FeatureCard key={index} {...feature} />
                ))}
              </div>

              <div className="bg-blue-50 rounded-2xl p-8 text-center space-y-6">
                <div className="space-y-2">
                  <p className="text-2xl font-bold">
                    💰 Plan {tab.pricing.plan}: €{tab.pricing.price}/mes
                  </p>
                  {tab.pricing.savings && (
                    <p className="text-lg text-gray-600">
                      🎁 {tab.pricing.savings}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-blue-600">
                    📊 {tab.pricing.roi}
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={() => LandingEvents.personaCtaClick(tab.id)}
                  asChild
                >
                  <a href={tab.cta.href}>{tab.cta.text}</a>
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
```

#### 5.2 ROI Calculator

- [ ] Form con validación
- [ ] Cálculo dinámico
- [ ] Resultados animados
- [ ] CTA contextual

**Tiempo estimado:** 10 horas

---

### FASE 6: Comparison & Testimonials (Día 4-5 - 8h)

#### 6.1 Comparison Table

- [ ] Tabla responsive
- [ ] Highlights INMOVA
- [ ] Scroll horizontal mobile
- [ ] Winner badge

#### 6.2 Testimonials Section

- [ ] Grid responsive
- [ ] Video player (si aplica)
- [ ] Metrics display
- [ ] Carousel/Slider

**Tiempo estimado:** 8 horas

---

### FASE 7: Pricing & FAQ (Día 5 - 8h)

#### 7.1 Pricing Section

- [ ] Plans cards
- [ ] Popular badge
- [ ] Features comparison
- [ ] CTAs tracking

#### 7.2 FAQ Section

- [ ] Accordion component
- [ ] Search functionality (opcional)
- [ ] Categories
- [ ] Tracking expansions

**Tiempo estimado:** 8 horas

---

### FASE 8: Polish & Optimization (Día 6-7 - 12h)

#### 8.1 Animations & Interactions

- [ ] Scroll animations (Framer Motion)
- [ ] Hover states
- [ ] Transitions suaves
- [ ] Loading states

#### 8.2 Performance Optimization

- [ ] Image optimization (WebP, AVIF)
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Bundle analysis

#### 8.3 Responsive Testing

- [ ] Mobile (320px - 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px+)
- [ ] 4K (2560px+)

#### 8.4 Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] ARIA labels
- [ ] Color contrast

**Tiempo estimado:** 12 horas

---

## 4. CHECKLIST TÉCNICO

### Pre-Implementation

- [ ] Revisar `LANDING_COPY_FINAL.md`
- [ ] Revisar `LANDING_DATA_STRUCTURE.ts`
- [ ] Verificar assets en `public/`
- [ ] Setup GA4, Hotjar, Clarity
- [ ] Configurar variables de entorno

### During Implementation

- [ ] Seguir estructura de componentes
- [ ] Usar datos de `landing-data.ts`
- [ ] Implementar tracking en cada CTA
- [ ] Optimizar imágenes (next/image)
- [ ] Mobile-first approach
- [ ] Semantic HTML
- [ ] Accessibility best practices

### Post-Implementation

- [ ] Lighthouse audit (>90 score)
- [ ] Cross-browser testing
- [ ] Mobile devices testing
- [ ] Accessibility audit (axe DevTools)
- [ ] Analytics testing (debug mode)
- [ ] Load testing
- [ ] SEO check (meta tags, OG, Twitter)

---

## 5. TESTING STRATEGY

### 5.1 Unit Tests (Jest/Vitest)

```typescript
// __tests__/components/ROICalculator.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ROICalculator } from '@/components/landing/ROICalculator';
import { calculateROI } from '@/lib/utils/roi-calculator';

describe('ROICalculator', () => {
  it('calculates ROI correctly', () => {
    const result = calculateROI({
      properties: 10,
      hoursPerWeek: 8,
      tools: 3,
      hourlyRate: 25,
    });

    expect(result.totalSavings).toBeGreaterThan(0);
    expect(result.roi).toBeGreaterThan(0);
  });

  it('recommends correct plan', () => {
    const result1 = calculateROI({ properties: 5, hoursPerWeek: 8, tools: 2, hourlyRate: 25 });
    expect(result1.plan).toBe('BÁSICO');

    const result2 = calculateROI({ properties: 30, hoursPerWeek: 15, tools: 5, hourlyRate: 30 });
    expect(result2.plan).toBe('PRO');

    const result3 = calculateROI({ properties: 100, hoursPerWeek: 20, tools: 8, hourlyRate: 50 });
    expect(result3.plan).toBe('ENTERPRISE');
  });
});
```

### 5.2 Integration Tests (Playwright)

```typescript
// e2e/landing-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load and display hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Gestiona tus Propiedades');
    await expect(page.locator('button:has-text("Prueba GRATIS")')).toBeVisible();
  });

  test('should track CTA clicks', async ({ page }) => {
    await page.goto('/');

    // Setup GA4 listener
    let eventFired = false;
    page.on('console', (msg) => {
      if (msg.text().includes('gtag') && msg.text().includes('CTA')) {
        eventFired = true;
      }
    });

    await page.click('button:has-text("Prueba GRATIS")');
    await page.waitForTimeout(1000);

    expect(eventFired).toBe(true);
  });

  test('ROI Calculator should work', async ({ page }) => {
    await page.goto('/#roi-calculator');

    await page.fill('input[name="properties"]', '10');
    await page.fill('input[name="hoursPerWeek"]', '8');
    await page.fill('input[name="tools"]', '3');

    await page.click('button:has-text("Calcular")');

    await expect(page.locator('text=TOTAL AHORRO')).toBeVisible();
    await expect(page.locator('text=ROI:')).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });
});
```

### 5.3 Performance Testing

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test('should meet performance metrics', async ({ page }) => {
  await page.goto('/');

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
    };
  });

  expect(metrics.fcp).toBeLessThan(1500); // <1.5s
  expect(metrics.domContentLoaded).toBeLessThan(3000); // <3s
});
```

---

## 6. DEPLOYMENT

### 6.1 Pre-Deploy Checklist

- [ ] All tests passing
- [ ] Lighthouse score >90
- [ ] Environment variables configured
- [ ] Analytics IDs correct
- [ ] Assets optimized
- [ ] Meta tags completed
- [ ] Sitemap updated
- [ ] Robots.txt configured

### 6.2 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 6.3 Post-Deploy

- [ ] Smoke test en producción
- [ ] Verificar Analytics (GA4, Hotjar)
- [ ] Test performance real (PageSpeed Insights)
- [ ] Setup alerts (Vercel, Sentry)
- [ ] Monitor primeras 24h

### 6.4 Rollback Plan

```bash
# Rollback si hay issues
vercel rollback [deployment-url]
```

---

## 📊 TIMELINE RESUMEN

| Fase | Descripción               | Duración | Acumulado |
| ---- | ------------------------- | -------- | --------- |
| 1    | Setup & Infrastructure    | 4h       | 4h        |
| 2    | Components Base           | 8h       | 12h       |
| 3    | Hero & Social Proof       | 6h       | 18h       |
| 4    | Problem & Solution        | 6h       | 24h       |
| 5    | Features & Calculator     | 10h      | 34h       |
| 6    | Comparison & Testimonials | 8h       | 42h       |
| 7    | Pricing & FAQ             | 8h       | 50h       |
| 8    | Polish & Optimization     | 12h      | 62h       |
| -    | **Testing**               | 6h       | 68h       |
| -    | **Deployment & QA**       | 4h       | 72h       |

**Total:** 72 horas = 9 días (8h/día) o 5-7 días (dedicación completa)

---

## ✅ DEFINITION OF DONE

### Component Level

- [ ] Responsive (mobile, tablet, desktop)
- [ ] Accessible (ARIA, keyboard nav)
- [ ] Tracking implemented
- [ ] Error states handled
- [ ] Loading states if applicable
- [ ] TypeScript types correct
- [ ] No console errors/warnings

### Page Level

- [ ] All sections implemented
- [ ] Navigation funcional
- [ ] All CTAs working
- [ ] Analytics tracking verified
- [ ] SEO meta tags completos
- [ ] Images optimizadas
- [ ] Lighthouse >90
- [ ] Cross-browser tested

### Project Level

- [ ] Code review completado
- [ ] Tests passing (unit + e2e)
- [ ] Documentation updated
- [ ] Deployed to production
- [ ] Monitoring configured
- [ ] Team trained on updates

---

**PLAN DE IMPLEMENTACIÓN COMPLETO Y LISTO PARA EJECUTAR** ✅

**Siguiente paso:** Comenzar Fase 1 cuando tengas assets listos
