# 🎨 GUÍA DE ASSETS VISUALES - LANDING PAGE

**Versión:** 1.0  
**Fecha:** 29 Diciembre 2025  
**Status:** Especificaciones completas para diseñador

---

## 📋 ÍNDICE

1. [Resumen de Assets Necesarios](#resumen-de-assets-necesarios)
2. [Hero Section](#hero-section)
3. [Solución Section](#solución-section)
4. [Features by Persona](#features-by-persona)
5. [Testimonials](#testimonials)
6. [Pricing Section](#pricing-section)
7. [Icons](#icons)
8. [Guía de Estilo Visual](#guía-de-estilo-visual)

---

## 1. RESUMEN DE ASSETS NECESARIOS

### Total de Assets:

- **Imágenes**: 23
- **Videos**: 2
- **Icons**: 50+
- **Avatars**: 6
- **Logos**: 8 (propios + partners)

### Prioridad:

**Alta (Semana 1):**

- Hero dashboard screenshot (1)
- Solution steps images (3)
- Logo INMOVA final (1)
- Icons principales (20)

**Media (Semana 2):**

- Persona tabs screenshots (4)
- Testimonial photos (6)
- Case study images (6)

**Baja (Semana 3):**

- Videos testimonials (2)
- Partner logos (5)
- Decorative illustrations (3)

---

## 2. HERO SECTION

### 2.1 Hero Dashboard Screenshot

**Archivo:** `hero-dashboard.png`

**Especificaciones:**

- **Dimensiones:** 1920x1080px (16:9)
- **Formato:** PNG con transparencia
- **Peso máximo:** 500KB (optimizar con TinyPNG)
- **Resoluciones:** @1x, @2x, @3x

**Contenido a mostrar:**

```
Vista del dashboard principal de INMOVA mostrando:
- Header con logo y navegación
- Sidebar izquierdo con menú colapsado
- Dashboard central con:
  * Cards de métricas (4):
    - Propiedades activas: 12
    - Inquilinos: 18
    - Cobros pendientes: €3,200
    - Ocupación: 94%
  * Gráfico de ingresos mensuales (últimos 6 meses)
  * Lista de propiedades con fotos (4 items)
  * Alertas recientes (3 items)
- Look moderno, clean, profesional
- Colores: Azul primario #2563EB, Verde éxito #10B981
```

**Referencias:**

- Style: Modern SaaS dashboard (similar a Stripe, Linear)
- Evitar: Cluttered, demasiada información

**Mockup Tool:** Figma o Screenshot real del producto

---

### 2.2 Hero Background

**Archivo:** `hero-background.svg`

**Especificaciones:**

- **Formato:** SVG (escalable)
- **Estilo:** Gradiente suave + Pattern geométrico sutil
- **Colores:**
  - Base: `from-slate-50 via-blue-50 to-indigo-50`
  - Pattern: Azul #2563EB con 5% opacity

**Alternativa:** Usar CSS gradient (no requiere asset)

---

## 3. SOLUCIÓN SECTION

### 3.1 Centraliza Image

**Archivo:** `solution-centralize.png`

**Especificaciones:**

- **Dimensiones:** 800x600px (4:3)
- **Formato:** PNG
- **Peso:** 200KB max

**Contenido:**

```
Vista de múltiples fuentes centralizadas:
- Excel spreadsheet (difuminado) →
- WhatsApp messages (difuminado) →
- Documentos PDF (difuminado) →
→ TODO confluyendo en dashboard INMOVA central (limpio, organizado)

Usar flechas visuales convergiendo al centro
```

**Estilo:** Ilustración moderna, colores corporativos

---

### 3.2 Automatiza Image

**Archivo:** `solution-automate.png`

**Especificaciones:**

- **Dimensiones:** 800x600px
- **Formato:** PNG
- **Peso:** 200KB max

**Contenido:**

```
Representación de automatización:
- Reloj/calendario mostrando fechas de pago
- Notificaciones automáticas (emails, SMS)
- Bot/AI icon procesando documentos
- Checkmarks en tareas completadas automáticamente

Usar iconografía de "flow" o "automation"
```

**Referencias:** Zapier, Make.com automation visuals

---

### 3.3 Optimiza Image

**Archivo:** `solution-optimize.png`

**Especificaciones:**

- **Dimensiones:** 800x600px
- **Formato:** PNG
- **Peso:** 200KB max

**Contenido:**

```
Dashboard de analytics:
- Gráficos de crecimiento (↗️)
- ROI chart mostrando incremento
- Métricas destacadas:
  * Morosidad: 15% → 2% (verde)
  * Rentabilidad: +40%
  * Tiempo ahorrado: 8h/semana
- Aspecto profesional, data-driven
```

---

## 4. FEATURES BY PERSONA

### 4.1 Propietarios Tab

**Archivo:** `persona-propietarios.png`

**Dimensiones:** 600x400px

**Contenido:**

```
Vista del portal del inquilino:
- Formulario simple de reporte de incidencia
- Botón de pago online
- Sección de documentos
- Chat con propietario
- Look simple, accesible, mobile-friendly
```

---

### 4.2 Gestores Tab

**Archivo:** `persona-gestores.png`

**Dimensiones:** 600x400px

**Contenido:**

```
Dashboard multi-propiedad:
- Lista de propiedades (grid view)
- Filtros activos
- Dashboard de propietario (preview)
- Reportes automáticos (icono)
- Look profesional, poder y control
```

---

### 4.3 Agentes Tab

**Archivo:** `persona-agentes.png`

**Dimensiones:** 600x400px

**Contenido:**

```
CRM pipeline view:
- Leads en columnas (kanban style)
- Lead scoring visible (⭐⭐⭐⭐⭐)
- Actividades programadas
- Integraciones de portales (logos Idealista, Fotocasa)
- Look dinámico, ventas-oriented
```

---

### 4.4 Inversores Tab

**Archivo:** `persona-inversores.png`

**Dimensiones:** 600x400px

**Contenido:**

```
Dashboard ejecutivo coliving:
- Mapa de calor de ocupación por habitación
- Métricas financieras destacadas
- Gráfico de revenue por propiedad
- Matching de inquilinos (IA visual)
- Look executive, high-level insights
```

---

## 5. TESTIMONIALS

### 5.1 Avatar Photos

**Archivos:**

- `avatar-carlos.jpg`
- `avatar-maria.jpg`
- `avatar-laura.jpg`
- `avatar-david.jpg`
- `avatar-ana.jpg`
- `avatar-roberto.jpg`

**Especificaciones:**

- **Dimensiones:** 200x200px (square)
- **Formato:** JPG optimizado o WebP
- **Peso:** 30KB max cada uno
- **Style:** Professional headshot, fondo neutro

**Opción:** Usar stock photos de alta calidad (Unsplash, Pexels)

- Buscar: "professional headshot", "business person", "real estate agent"
- Diversidad: 3 hombres, 3 mujeres, variedad de edades

---

### 5.2 Case Study Images

**Archivos:**

- `case-maria-dashboard.jpg` - Dashboard mostrando reducción morosidad
- `case-laura-sales.jpg` - CRM con pipeline lleno
- `case-david-coliving.jpg` - Módulo coliving con matching
- `case-ana-voting.jpg` - Sistema de votaciones telemáticas
- `case-roberto-str.jpg` - Channel manager integrado

**Especificaciones:**

- **Dimensiones:** 800x600px
- **Formato:** JPG optimizado
- **Peso:** 100KB max
- **Contenido:** Screenshots reales o mockups del producto mostrando la feature específica con datos de ejemplo

---

### 5.3 Video Testimonials

**Archivo:** `testimonial-carlos.mp4`

**Especificaciones:**

- **Resolución:** 1920x1080 (Full HD)
- **Duración:** 45-60 segundos
- **Formato:** MP4 (H.264)
- **Peso:** 15MB max
- **Audio:** Limpio, sin ruido
- **Subtítulos:** SRT file incluido

**Contenido del video:**

```
- Opening: Nombre + Rol + Empresa (3s)
- Problema antes de INMOVA (10s)
- Cómo INMOVA solucionó (20s)
- Resultados con métricas (10s)
- Recomendación final (7s)
```

**Poster Frame:** `testimonial-carlos-poster.jpg` (primer frame optimizado)

---

## 6. PRICING SECTION

### 6.1 Plan Icons (opcional)

Si queremos iconos custom por plan:

- `icon-plan-basic.svg` - Casa simple
- `icon-plan-pro.svg` - Edificio
- `icon-plan-enterprise.svg` - Rascacielos

**Specs:** SVG, 64x64px, monocromo con posibilidad de colorear

---

### 6.2 Trust Badges

**Archivos:**

- `badge-iso27001.svg`
- `badge-gdpr.svg`
- `badge-stripe.svg`

**Especificaciones:**

- **Formato:** SVG
- **Dimensiones:** 120x40px (horizontal) o 80x80px (square)
- **Estilo:** Official badges, buscar en sitios oficiales

**Fuentes:**

- ISO 27001: https://www.iso.org/
- GDPR: Badge genérico
- Stripe: https://stripe.com/en-es/partners/become-a-partner

---

## 7. ICONS

### 7.1 Icon Library

**Recomendación:** Usar [Lucide React](https://lucide.dev/) (ya instalado)

**Icons necesarios:**

```typescript
// lib/icons.ts
import {
  // Hero & Navigation
  Home,
  Menu,
  X,
  ChevronDown,
  Search,
  Bell,
  User,
  LogOut,

  // Features
  CheckCircle,
  Clock,
  Headphones,
  Trophy,
  Users,
  Star,
  Euro,
  Zap,
  Shield,
  UserCheck,
  FileText,
  Smartphone,
  Calculator,
  TrendingUp,
  LayoutDashboard,
  Link,
  Code,
  FileBarChart,
  Target,
  Brain,
  Mail,
  Globe,
  BarChart3,
  Megaphone,
  Building,
  GitMerge,
  Calendar,
  Boxes,

  // Social
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,

  // UI Elements
  Play,
  Pause,
  Download,
  ExternalLink,
  ArrowRight,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';

export const Icons = {
  // Mapeo para fácil uso
  hero: { Home, Menu },
  features: { CheckCircle, Zap, Target },
  social: { Linkedin, Twitter, Facebook },
  // ... etc
};
```

### 7.2 Custom Icons (si necesario)

Si Lucide no tiene algún icon específico, crear custom:

**Ejemplo:** `icon-proptech.svg`

- Casa + Tech (circuito)
- 64x64px, SVG
- Monocromo, coloreable

---

## 8. GUÍA DE ESTILO VISUAL

### 8.1 Colores

```css
/* Paleta Principal */
--primary: #2563eb; /* Azul */
--primary-hover: #1d4ed8;
--secondary: #10b981; /* Verde */
--secondary-hover: #059669;
--accent: #f59e0b; /* Naranja */
--accent-hover: #d97706;

/* Neutrales */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-900: #111827;

/* Estados */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### 8.2 Tipografía

```css
/* Fonts */
font-family: 'Inter', sans-serif;

/* Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
--text-5xl: 48px;

/* Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 8.3 Spacing

```css
/* Spacing Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### 8.4 Shadows

```css
/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### 8.5 Border Radius

```css
/* Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

---

## 9. OPTIMIZACIÓN DE ASSETS

### 9.1 Images

**Herramientas:**

- **TinyPNG**: Compresión PNG/JPG sin pérdida
- **Squoosh**: Conversión a WebP/AVIF
- **ImageOptim**: Optimización batch (Mac)

**Proceso:**

1. Exportar imagen original en alta calidad
2. Resize a dimensiones exactas necesarias
3. Comprimir con TinyPNG
4. Generar variantes @1x, @2x, @3x
5. Convertir a WebP/AVIF para navegadores modernos
6. Generar fallback JPG/PNG

### 9.2 Videos

**Herramientas:**

- **HandBrake**: Compresión video
- **FFmpeg**: Conversión y optimización

**Comando FFmpeg:**

```bash
# Comprimir video testimonial
ffmpeg -i testimonial-carlos-original.mp4 \
  -c:v libx264 -crf 23 -preset slow \
  -c:a aac -b:a 128k \
  -vf scale=1920:1080 \
  -movflags +faststart \
  testimonial-carlos.mp4

# Generar poster
ffmpeg -i testimonial-carlos.mp4 \
  -ss 00:00:01 -vframes 1 \
  testimonial-carlos-poster.jpg
```

### 9.3 SVGs

**Herramientas:**

- **SVGO**: Optimización SVG
- **SVGOMG**: Web UI para SVGO

**Proceso:**

1. Exportar SVG desde Figma/Illustrator
2. Optimizar con SVGO
3. Verificar que funciona en navegador
4. Minificar si es inline

---

## 10. ESTRUCTURA DE CARPETAS

```
public/
├── images/
│   ├── hero/
│   │   ├── dashboard@1x.png
│   │   ├── dashboard@2x.png
│   │   ├── dashboard@3x.png
│   │   ├── dashboard.webp
│   │   └── dashboard.avif
│   ├── solution/
│   │   ├── centralize.png
│   │   ├── automate.png
│   │   └── optimize.png
│   ├── personas/
│   │   ├── propietarios.png
│   │   ├── gestores.png
│   │   ├── agentes.png
│   │   └── inversores.png
│   └── cases/
│       ├── maria-dashboard.jpg
│       ├── laura-sales.jpg
│       └── ...
├── avatars/
│   ├── carlos.jpg
│   ├── maria.jpg
│   └── ...
├── videos/
│   ├── testimonial-carlos.mp4
│   ├── testimonial-carlos-poster.jpg
│   └── demo-2min.mp4
├── icons/
│   ├── proptech.svg
│   └── custom-*.svg
└── badges/
    ├── iso27001.svg
    ├── gdpr.svg
    └── stripe.svg
```

---

## 📊 CHECKLIST DE ASSETS

### Alta Prioridad (Semana 1)

- [ ] Logo INMOVA final (SVG + PNG)
- [ ] Hero dashboard screenshot (@1x, @2x, WebP)
- [ ] Solution images (3) optimizadas
- [ ] Icons verificados (Lucide covers 95%)
- [ ] Colores y tipografía definidos

### Media Prioridad (Semana 2)

- [ ] Persona tabs screenshots (4)
- [ ] Testimonial avatars (6) optimizados
- [ ] Case study images (6)
- [ ] Trust badges (3 SVGs)

### Baja Prioridad (Semana 3)

- [ ] Video testimonials (2) editados
- [ ] Partner logos (5)
- [ ] Decorative illustrations (3)
- [ ] Custom icons si necesario

---

**GUÍA DE ASSETS COMPLETA Y LISTA PARA DISEÑADOR** ✅

**Próximo paso:** Plan de implementación técnico
