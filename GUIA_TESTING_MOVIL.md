# 📱 GUÍA DE TESTING MÓVIL - LANDING PAGE

**Proyecto:** INMOVA App  
**Fecha:** 29 Diciembre 2025

---

## 🎯 OBJETIVO

Verificar que la landing page funcione perfectamente en dispositivos móviles reales, con especial atención a:

- **UX táctil** - Botones, links, gestos
- **Performance** - Velocidad de carga
- **Responsive design** - Adaptación a diferentes tamaños
- **Funcionalidad** - Todos los componentes operativos

---

## 📋 DISPOSITIVOS A TESTEAR

### Prioritarios (Mínimo)

- ✅ **iPhone** (iOS 15+) - Safari
- ✅ **Android** (Android 11+) - Chrome

### Opcionales (Recomendado)

- iPad (tablets)
- Samsung Galaxy (Android)
- Google Pixel
- OnePlus / Xiaomi

---

## 🔍 CHECKLIST DE TESTING

### 1. PRIMER ACCESO

#### Hero Section

- [ ] Hero se ve completo above the fold
- [ ] CTAs táctiles (44x44px mínimo)
- [ ] "Prueba GRATIS" destaca visualmente
- [ ] Trust badges legibles
- [ ] Dashboard preview sin overflow

#### Navigation

- [ ] Logo visible
- [ ] Hamburger menu abre/cierra correctamente
- [ ] Links del menu funcionales
- [ ] Mobile menu scroll si es largo
- [ ] Botones CTA accesibles

---

### 2. SCROLL Y NAVEGACIÓN

#### Smooth Scroll

- [ ] Scroll suave (no jumpy)
- [ ] No horizontal scroll inesperado
- [ ] Secciones se alinean correctamente
- [ ] Social Proof Bar se queda sticky

#### Anchors y Links

- [ ] Links internos (#features, #pricing) funcionan
- [ ] Scroll hasta sección correcta
- [ ] Offset correcto (no queda debajo del header)

---

### 3. COMPONENTES INTERACTIVOS

#### Features by Persona (Tabs)

- [ ] Tabs táctiles y responsivas
- [ ] Tab activo claramente marcado
- [ ] Contenido cambia correctamente
- [ ] 4 tabs visibles sin scroll horizontal
- [ ] Features legibles
- [ ] CTAs por persona funcionan

#### ROI Calculator

- [ ] Inputs táctiles (no zoom en iOS)
- [ ] Teclado numérico se abre
- [ ] Cálculo funciona en móvil
- [ ] Resultados legibles
- [ ] CTA final accesible
- [ ] Animación de resultados suave

#### Comparison Table

- [ ] Tabla scroll horizontal funciona
- [ ] Indicador de scroll visible
- [ ] Checkmarks/X legibles
- [ ] Primera columna (features) fija

#### Testimonials

- [ ] Grid responsive (1 columna en móvil)
- [ ] Avatars y texto legibles
- [ ] Métricas destacan
- [ ] Cards no se cortan

#### Pricing

- [ ] Cards stack verticalmente
- [ ] Badge "Más Popular" visible
- [ ] Precios destacan
- [ ] Features list legibles
- [ ] CTAs accesibles
- [ ] Scroll entre planes suave

#### FAQ

- [ ] Accordion abre/cierra
- [ ] Texto legible al expandir
- [ ] Solo 1 pregunta abierta a la vez
- [ ] No layout shift al expandir

---

### 4. FORMS Y CTAs

#### Todos los CTAs

- [ ] Tamaño mínimo 44x44px
- [ ] Espacio entre botones (no clics accidentales)
- [ ] Hover/Active states visuales
- [ ] Loading states si aplica
- [ ] No double-submit

#### Input Fields

- [ ] Font-size ≥16px (no zoom en iOS)
- [ ] Teclado apropiado (numérico para números)
- [ ] Placeholder legible
- [ ] Error messages visibles
- [ ] Success feedback claro

---

### 5. PERFORMANCE MÓVIL

#### Velocidad de Carga

- [ ] **FCP** (First Contentful Paint) <2s
- [ ] **LCP** (Largest Contentful Paint) <3s
- [ ] **TTI** (Time to Interactive) <4s
- [ ] **CLS** (Cumulative Layout Shift) <0.1

#### Uso de Datos

- [ ] Página completa <2MB
- [ ] Imágenes optimizadas (WebP/AVIF)
- [ ] No assets innecesarios

---

### 6. UX Y USABILIDAD

#### Legibilidad

- [ ] Font size mínimo 14px
- [ ] Contraste suficiente (WCAG AA)
- [ ] Line height adecuado
- [ ] No texto cortado

#### Touch Targets

- [ ] Botones ≥44x44px
- [ ] Links separados (no clics accidentales)
- [ ] Iconos táctiles

#### Gestures

- [ ] Swipe en carousel (si aplica)
- [ ] Pull-to-refresh deshabilitado (si no aplica)
- [ ] Pinch-to-zoom permitido en imágenes

---

### 7. ORIENTACIÓN

#### Portrait (Vertical)

- [ ] Layout correcto
- [ ] Todo accesible
- [ ] No overflow

#### Landscape (Horizontal)

- [ ] Layout se adapta
- [ ] No elementos cortados
- [ ] Header sigue visible

---

### 8. BROWSERS ESPECÍFICOS

#### iOS Safari

- [ ] No zoom en inputs (font-size ≥16px)
- [ ] Safe area respetada (notch)
- [ ] Scroll bounce natural
- [ ] CTAs sobre toolbar nativo

#### Android Chrome

- [ ] Material Design icons claros
- [ ] Back button respeta navegación
- [ ] Pull-to-refresh controlado
- [ ] Address bar desaparece al scroll

---

## 🛠️ HERRAMIENTAS DE TESTING

### Testing Remoto (Sin Dispositivo Físico)

#### 1. Chrome DevTools

```
F12 → Toggle device toolbar → Seleccionar dispositivo
```

**Limitaciones:** No simula touch real ni performance real

#### 2. BrowserStack

```
https://www.browserstack.com
- Test en dispositivos reales
- Screenshots automáticos
- Session recording
```

#### 3. LambdaTest

```
https://www.lambdatest.com
- Test cross-browser móvil
- Network throttling
```

### Testing Local (Con Dispositivo Físico)

#### 1. Exponer localhost a red local

```bash
# Obtener IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# Next.js escucha en todas las interfaces
yarn dev -H 0.0.0.0

# Acceder desde móvil
http://192.168.1.X:3000
```

#### 2. ngrok (Túnel HTTPS)

```bash
# Instalar ngrok
brew install ngrok  # Mac
# O descargar de https://ngrok.com

# Exponer puerto
ngrok http 3000

# Usar URL temporal
https://xxx.ngrok.io
```

#### 3. Chrome Remote Debugging

```
1. Conectar Android vía USB
2. Habilitar "USB Debugging" en Android
3. Chrome → chrome://inspect
4. Ver y debuggear en tiempo real
```

#### 4. Safari Web Inspector (iOS)

```
1. iPhone → Settings → Safari → Advanced → Web Inspector: ON
2. Conectar vía USB
3. Mac Safari → Develop → [Tu iPhone] → [Tu página]
```

---

## 📊 MÉTRICAS A MEDIR

### Lighthouse Mobile Audit

```bash
# CLI
lighthouse https://inmovaapp.com --preset=perf --view --form-factor=mobile

# O Chrome DevTools
F12 → Lighthouse → Mobile → Run
```

**Objetivos:**

- **Performance:** >90
- **Accessibility:** >90
- **Best Practices:** >90
- **SEO:** >95

### PageSpeed Insights

```
https://pagespeed.web.dev/?url=https://inmovaapp.com
```

Ver métricas de:

- Core Web Vitals
- Field data (usuarios reales)
- Lab data (simulado)

### WebPageTest

```
https://www.webpagetest.org
```

**Configuración:**

- Location: Spain (Madrid)
- Device: Moto G4 / iPhone 8
- Connection: 3G Fast

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: Zoom en Inputs (iOS)

**Síntoma:** iOS hace zoom cuando tocas un input

**Causa:** Font-size del input <16px

**Solución:**

```css
input,
select,
textarea {
  font-size: 16px !important;
}
```

### Problema 2: Botones Pequeños

**Síntoma:** Difícil clickear botones

**Causa:** Touch target <44x44px

**Solución:**

```css
button,
a {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}
```

### Problema 3: Horizontal Scroll

**Síntoma:** Página se scrollea horizontalmente

**Causa:** Elemento más ancho que viewport

**Solución:**

```css
body {
  overflow-x: hidden;
}

* {
  max-width: 100%;
}
```

**Debug:**

```javascript
// Encontrar elemento culpable
document.querySelectorAll('*').forEach((el) => {
  if (el.scrollWidth > document.documentElement.clientWidth) {
    console.log(el);
  }
});
```

### Problema 4: CLS Alto (Layout Shift)

**Síntoma:** Contenido "salta" al cargar

**Causa:** Imágenes sin dimensions, fonts cargando

**Solución:**

```jsx
// Siempre especificar width/height
<Image src="..." width={800} height={600} alt="..." />

// Fonts con font-display
@font-face {
  font-family: 'Inter';
  font-display: swap;
}
```

### Problema 5: Performance Baja en 3G

**Síntoma:** Carga lenta en redes lentas

**Solución:**

```javascript
// Lazy load componentes
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />,
});

// Preconnect a dominios externos
<link rel="preconnect" href="https://fonts.googleapis.com" />;
```

---

## ✅ CHECKLIST FINAL

### Pre-Launch

- [ ] Testear en iPhone real
- [ ] Testear en Android real
- [ ] Lighthouse Mobile >90
- [ ] No horizontal scroll
- [ ] Todos los CTAs funcionan
- [ ] Forms validados
- [ ] Imágenes optimizadas
- [ ] Fonts cargadas

### Post-Launch

- [ ] Monitorear Core Web Vitals en GA4
- [ ] Revisar heatmaps de Hotjar
- [ ] Session recordings de Clarity
- [ ] Bounce rate <40%
- [ ] Time on page >2min

---

## 📱 TEST SCRIPT RÁPIDO

Usa este script con un QA tester:

```
1. Abre https://inmovaapp.com en móvil
2. ¿Hero se ve completo? SÍ / NO
3. Click en "Prueba GRATIS" → ¿Funciona? SÍ / NO
4. Scroll al ROI Calculator
5. Ingresa: 10 propiedades, 8 horas/semana
6. Click "Calcular" → ¿Muestra resultados? SÍ / NO
7. Scroll hasta Pricing
8. Click en Plan Pro → ¿Redirige? SÍ / NO
9. Abre menu hamburger → ¿Funciona? SÍ / NO
10. Tiempo total de carga: ___ segundos
```

**Resultado esperado:** 10/10 SÍ, <3 segundos

---

## 🆘 CONTACTO

Si encuentras bugs:

1. Screenshot del problema
2. Dispositivo + OS version
3. Browser + version
4. Pasos para reproducir
5. Crear issue en GitHub

---

**📱 Happy Mobile Testing!**

---

_Creado: 29 Diciembre 2025_  
_Versión: 1.0_  
_Autor: AI Assistant_
