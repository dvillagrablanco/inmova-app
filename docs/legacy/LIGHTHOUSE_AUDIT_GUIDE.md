# 🔍 GUÍA DE LIGHTHOUSE AUDIT - PERFORMANCE

**Proyecto:** INMOVA App - Landing Page  
**Fecha:** 29 Diciembre 2025

---

## 🎯 OBJETIVO

Alcanzar scores de **90+** en todas las métricas de Lighthouse:

- ⚡ **Performance:** >90
- ♿ **Accessibility:** >90
- ✅ **Best Practices:** >90
- 🔍 **SEO:** >95

---

## 📊 MÉTRICAS CORE WEB VITALS

### 1. LCP (Largest Contentful Paint)

**Qué mide:** Tiempo hasta que el contenido principal es visible

**Objetivo:** <2.5s (Bueno) | 2.5-4s (Mejorable) | >4s (Pobre)

**Elementos que afectan:**

- Hero image
- Hero headline
- Dashboard screenshot

**Optimizaciones implementadas:**

```jsx
// Priority loading de hero image
<Image
  src="/hero-dashboard.png"
  priority
  width={1200}
  height={800}
/>

// Preload de fonts críticos
<link rel="preload" href="/fonts/inter.woff2" as="font" />
```

---

### 2. FID (First Input Delay)

**Qué mide:** Tiempo de respuesta a la primera interacción

**Objetivo:** <100ms (Bueno) | 100-300ms (Mejorable) | >300ms (Pobre)

**Elementos que afectan:**

- JavaScript pesado bloqueante
- Long tasks

**Optimizaciones implementadas:**

```typescript
// Lazy loading de componentes below-the-fold
const PricingSection = dynamic(() => import('./Pricing'), {
  loading: () => <Skeleton />
});

// Defer de scripts no críticos
<Script src="https://www.googletagmanager.com" strategy="lazyOnload" />
```

---

### 3. CLS (Cumulative Layout Shift)

**Qué mide:** Estabilidad visual (cambios inesperados de layout)

**Objetivo:** <0.1 (Bueno) | 0.1-0.25 (Mejorable) | >0.25 (Pobre)

**Causas comunes:**

- Imágenes sin dimensions
- Fonts cargando (FOIT/FOUT)
- Ads/embeds sin espacio reservado

**Optimizaciones implementadas:**

```jsx
// Siempre especificar width/height
<Image src="..." width={800} height={600} alt="..." />

// Font display swap
@font-face {
  font-family: 'Inter';
  font-display: swap;
}

// Skeleton loaders
{loading && <Skeleton height={400} />}
```

---

### 4. FCP (First Contentful Paint)

**Qué mide:** Tiempo hasta el primer pixel

**Objetivo:** <1.8s (Bueno) | 1.8-3s (Mejorable) | >3s (Pobre)

**Optimizaciones:**

- Server-side rendering (Next.js)
- Minimize blocking resources
- Preconnect a dominios externos

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://www.googletagmanager.com" />
```

---

### 5. TTI (Time to Interactive)

**Qué mide:** Tiempo hasta que la página es completamente interactiva

**Objetivo:** <3.8s (Bueno) | 3.8-7.3s (Mejorable) | >7.3s (Pobre)

**Optimizaciones:**

- Code splitting
- Tree shaking
- Minimize JavaScript

```javascript
// Webpack optimization en next.config.js
splitChunks: {
  cacheGroups: {
    vendor: { /* ... */ },
    common: { /* ... */ }
  }
}
```

---

## 🔧 CÓMO EJECUTAR LIGHTHOUSE

### Opción 1: Chrome DevTools (Recomendado)

```
1. Abre Chrome/Edge
2. F12 (DevTools)
3. Tab "Lighthouse"
4. Configuración:
   - Mode: Navigation
   - Device: Mobile + Desktop
   - Categories: Todas ✓
5. Click "Analyze page load"
6. Esperar resultados (30-60s)
```

**Guardar reporte:**

- Click en ⚙️ → "View Report"
- Click en "Save as HTML"

---

### Opción 2: CLI (Automatizado)

```bash
# Instalar
npm install -g lighthouse

# Ejecutar Mobile
lighthouse https://inmovaapp.com \
  --preset=perf \
  --view \
  --form-factor=mobile \
  --output=html \
  --output-path=./lighthouse-mobile.html

# Ejecutar Desktop
lighthouse https://inmovaapp.com \
  --preset=perf \
  --view \
  --form-factor=desktop \
  --output=html \
  --output-path=./lighthouse-desktop.html

# CI/CD - Verificar threshold
lighthouse https://inmovaapp.com \
  --preset=perf \
  --output=json \
  --quiet \
  --chrome-flags="--headless" \
  | jq '.categories.performance.score * 100'
# Debe retornar >90
```

---

### Opción 3: PageSpeed Insights (Google)

```
https://pagespeed.web.dev/?url=https://inmovaapp.com
```

**Ventajas:**

- Datos de campo (CrUX - usuarios reales)
- Datos de lab (simulado)
- Comparación mobile vs desktop

---

### Opción 4: Lighthouse CI (Automatizado en GitHub Actions)

```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI

on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli

      - name: Run Lighthouse
        run: |
          lhci autorun --config=lighthouserc.json
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_TOKEN }}
```

---

## 📈 INTERPRETACIÓN DE RESULTADOS

### Scores

| Score  | Color       | Significado |
| ------ | ----------- | ----------- |
| 90-100 | 🟢 Verde    | Excelente   |
| 50-89  | 🟡 Amarillo | Mejorable   |
| 0-49   | 🔴 Rojo     | Pobre       |

### Nuestro Objetivo

```
✅ Performance:      90-95   (Mobile) | 95-100 (Desktop)
✅ Accessibility:    90-95
✅ Best Practices:   90-95
✅ SEO:              95-100
```

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: Performance <90

**Causas:**

- Imágenes no optimizadas
- JavaScript bloqueante
- Fonts sin optimizar
- No lazy loading

**Diagnóstico:**

```
Lighthouse → Performance → Opportunities
```

**Soluciones:**

```bash
# 1. Optimizar imágenes
# Convertir a WebP/AVIF
npx @squoosh/cli --webp auto images/*.jpg

# 2. Lazy load offscreen images
<Image src="..." loading="lazy" />

# 3. Preload critical resources
<link rel="preload" href="/hero.jpg" as="image" />

# 4. Code splitting
const Heavy = dynamic(() => import('./Heavy'));

# 5. Minimize CSS/JS
# Ya configurado en next.config.js
```

---

### Problema 2: CLS Alto (>0.1)

**Síntomas:** Contenido "salta" al cargar

**Causas:**

- Images sin width/height
- Fonts FOUT
- Ads sin espacio reservado

**Debug:**

```javascript
// En DevTools Console
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Layout shift:', entry);
  }
}).observe({ type: 'layout-shift', buffered: true });
```

**Soluciones:**

```jsx
// 1. Dimensions en imágenes
<Image width={800} height={600} />

// 2. Font display swap
@font-face { font-display: swap; }

// 3. Reserve espacio
<div className="h-[400px]">{loading ? <Skeleton /> : <Content />}</div>
```

---

### Problema 3: Accessibility <90

**Causas comunes:**

- Falta de alt text en imágenes
- Bajo contraste de colores
- No keyboard navigation
- ARIA labels faltantes

**Verificación:**

```
Lighthouse → Accessibility → Failed audits
```

**Soluciones:**

```jsx
// 1. Alt text descriptivo
<Image src="..." alt="Dashboard showing 10 properties with analytics" />

// 2. ARIA labels
<button aria-label="Close modal">X</button>

// 3. Keyboard navigation
<button onKeyDown={handleKeyDown}>Action</button>

// 4. Focus visible
button:focus { outline: 2px solid blue; }

// 5. Color contrast (mínimo 4.5:1)
// Verificar en: https://webaim.org/resources/contrastchecker/
```

---

### Problema 4: Best Practices <90

**Causas comunes:**

- HTTP en lugar de HTTPS
- Console errors
- Deprecated APIs
- No usar HTTP/2

**Verificación:**

```
Lighthouse → Best Practices → Failed audits
```

**Soluciones:**

```nginx
# 1. Force HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}

# 2. HTTP/2
listen 443 ssl http2;

# 3. Security headers (ya configurado)
add_header Strict-Transport-Security "max-age=31536000";
add_header X-Frame-Options "DENY";

# 4. Fix console errors
# Revisar DevTools Console y corregir
```

---

### Problema 5: SEO <95

**Causas comunes:**

- Falta de meta description
- Title no descriptivo
- No robots.txt
- No sitemap.xml
- No structured data

**Verificación:**

```
Lighthouse → SEO → Failed audits
```

**Soluciones:**

```tsx
// 1. Meta tags completos (ya implementado)
export const metadata: Metadata = {
  title: 'Gestión Inmobiliaria Inteligente | INMOVA',
  description: 'Optimiza tu gestión...',
  keywords: [...],
  openGraph: { /* ... */ }
};

// 2. Structured data
<script type="application/ld+json">
  {JSON.stringify(jsonLd)}
</script>

// 3. robots.txt
# public/robots.txt
User-agent: *
Allow: /
Sitemap: https://inmovaapp.com/sitemap.xml

// 4. sitemap.xml
# app/sitemap.ts
export default function sitemap() {
  return [{
    url: 'https://inmovaapp.com',
    lastModified: new Date(),
    priority: 1,
  }];
}
```

---

## 🎯 BENCHMARKING

### Comparar con Competidores

```bash
# Tu sitio
lighthouse https://inmovaapp.com

# Competidor 1
lighthouse https://homming.com

# Competidor 2
lighthouse https://rentger.com

# Comparar scores
```

### Tracking de Mejoras

```bash
# Guardar baseline
lighthouse https://inmovaapp.com --output=json > baseline.json

# Después de optimizaciones
lighthouse https://inmovaapp.com --output=json > optimized.json

# Comparar
diff baseline.json optimized.json
```

---

## 🚀 OPTIMIZACIONES AVANZADAS

### 1. Preload Critical Assets

```html
<head>
  <!-- Fonts -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />

  <!-- Hero image -->
  <link rel="preload" href="/hero.webp" as="image" />

  <!-- Critical CSS -->
  <link rel="preload" href="/_next/static/css/critical.css" as="style" />
</head>
```

### 2. Resource Hints

```html
<!-- DNS prefetch -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />

<!-- Preconnect -->
<link rel="preconnect" href="https://www.googletagmanager.com" />

<!-- Prefetch next page -->
<link rel="prefetch" href="/dashboard" />
```

### 3. Service Worker (PWA)

```javascript
// public/sw.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 4. Brotli Compression

```nginx
# nginx.conf
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;

# Si soporta Brotli
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript;
```

### 5. CDN

```javascript
// next.config.js
module.exports = {
  images: {
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/inmova/',
  },
  assetPrefix: 'https://cdn.inmovaapp.com',
};
```

---

## 📱 MOBILE VS DESKTOP

### Diferencias Esperadas

| Métrica     | Mobile | Desktop | Razón                 |
| ----------- | ------ | ------- | --------------------- |
| Performance | 85-95  | 95-100  | CPU/Red más lenta     |
| LCP         | 2-3s   | 1-2s    | Imágenes más pequeñas |
| FID         | <100ms | <50ms   | Menos procesamiento   |
| CLS         | <0.1   | <0.05   | Mismo                 |

### Testing en 3G

```bash
# Simular 3G
lighthouse https://inmovaapp.com \
  --throttling-method=devtools \
  --throttling.cpuSlowdownMultiplier=4 \
  --throttling.downloadThroughputKbps=1600 \
  --throttling.uploadThroughputKbps=750
```

---

## ✅ CHECKLIST PRE-AUDIT

Antes de ejecutar Lighthouse:

- [ ] Build de producción (`yarn build`)
- [ ] Server corriendo (`yarn start`)
- [ ] HTTPS habilitado
- [ ] Caché limpia (Ctrl+Shift+R)
- [ ] Modo incógnito (sin extensiones)
- [ ] Cerrar otras pestañas
- [ ] Network stable (no descargas)

---

## 📊 AUDIT SCHEDULE

### Pre-Launch

- [ ] Audit inicial (baseline)
- [ ] Audit después de cada optimización
- [ ] Audit final antes de deploy

### Post-Launch

- [ ] Weekly audit (primera semana)
- [ ] Monthly audit (siguientes meses)
- [ ] Audit después de cambios mayores

---

## 🎓 RECURSOS

### Herramientas

- **Lighthouse CI:** https://github.com/GoogleChrome/lighthouse-ci
- **WebPageTest:** https://www.webpagetest.org
- **GTmetrix:** https://gtmetrix.com
- **Chrome UX Report:** https://developers.google.com/web/tools/chrome-user-experience-report

### Documentación

- **Web Vitals:** https://web.dev/vitals/
- **Lighthouse Scoring:** https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/
- **Next.js Optimization:** https://nextjs.org/docs/app/building-your-application/optimizing

### Chrome Extensions

- **Web Vitals:** https://chrome.google.com/webstore/detail/ahfhijdlegdabablpippeagghigmibma
- **Lighthouse:** Ya incluido en Chrome DevTools

---

## 📋 LIGHTHOUSE REPORT TEMPLATE

```markdown
# Lighthouse Audit - INMOVA Landing

**Fecha:** 29 Diciembre 2025
**URL:** https://inmovaapp.com
**Device:** Mobile

## Scores

| Categoría      | Score | Status |
| -------------- | ----- | ------ |
| Performance    | 92    | ✅     |
| Accessibility  | 95    | ✅     |
| Best Practices | 91    | ✅     |
| SEO            | 98    | ✅     |

## Core Web Vitals

| Métrica | Valor | Target | Status |
| ------- | ----- | ------ | ------ |
| LCP     | 2.1s  | <2.5s  | ✅     |
| FID     | 45ms  | <100ms | ✅     |
| CLS     | 0.08  | <0.1   | ✅     |

## Opportunities

1. ✅ Next-gen formats (WebP/AVIF) - Implementado
2. ✅ Lazy loading - Implementado
3. ⚠️ Unused JavaScript - 15KB - Low priority

## Diagnostics

- Total Blocking Time: 210ms (Good)
- Speed Index: 2.3s (Good)
- Time to Interactive: 3.1s (Good)

## Conclusión

Landing page optimizada y lista para producción.
```

---

**🚀 Happy Auditing!**

---

_Creado: 29 Diciembre 2025_  
_Versión: 1.0_  
_Autor: AI Assistant_
