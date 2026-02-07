# 🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO - VERCEL

**Proyecto:** INMOVA App  
**Última actualización:** 29 Diciembre 2025

---

## 📋 VARIABLES OBLIGATORIAS

### 1. Google Analytics 4 (CRÍTICO para tracking)

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Cómo obtenerlo:**

1. Ir a https://analytics.google.com
2. Admin → Data Streams → Web → Measurement ID
3. Copiar el ID que empieza con `G-`

**Importancia:** 🔴 **CRÍTICO** - Sin esto no funcionará el tracking de la landing

---

## 📊 VARIABLES OPCIONALES (Recomendadas)

### 2. Hotjar (Heatmaps & Recordings)

```env
NEXT_PUBLIC_HOTJAR_ID=XXXXXXX
```

**Cómo obtenerlo:**

1. Ir a https://www.hotjar.com
2. Crear cuenta o login
3. Add new site
4. Copiar el Site ID (número de 7 dígitos)

**Beneficios:**

- Ver heatmaps de clics
- Recordings de sesiones de usuario
- Form analysis
- Feedback widgets

**Importancia:** 🟡 **Recomendado** - Ayuda a optimizar conversión

---

### 3. Microsoft Clarity (Session Recording)

```env
NEXT_PUBLIC_CLARITY_ID=XXXXXXXXXX
```

**Cómo obtenerlo:**

1. Ir a https://clarity.microsoft.com
2. Login con cuenta Microsoft
3. Add new project
4. Copiar el Project ID

**Beneficios:**

- Session recordings gratis (ilimitados)
- Heatmaps
- Insights automáticos con IA
- Frustration signals

**Importancia:** 🟡 **Recomendado** - Gratis y muy útil

---

## 🔐 VARIABLES YA CONFIGURADAS (No tocar)

Estas ya deberían estar en Vercel:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://inmovaapp.com
NODE_ENV=production
```

---

## 📝 CÓMO CONFIGURAR EN VERCEL

### Opción 1: Dashboard Web (Recomendado)

1. **Ir al Dashboard de Vercel:**
   - URL: https://vercel.com/dashboard
   - Buscar proyecto "workspace"

2. **Acceder a Settings:**
   - Click en el proyecto
   - Tab "Settings" (arriba)
   - Sidebar → "Environment Variables"

3. **Añadir Variables:**
   - Click "Add New"
   - Key: `NEXT_PUBLIC_GA_ID`
   - Value: `G-XXXXXXXXXX` (tu ID real)
   - Environment: Seleccionar "Production"
   - Click "Save"

4. **Repetir para cada variable:**
   - `NEXT_PUBLIC_HOTJAR_ID` (opcional)
   - `NEXT_PUBLIC_CLARITY_ID` (opcional)

5. **Redeploy:**
   - Ir a tab "Deployments"
   - Click en el último deployment
   - Click "..." → "Redeploy"

### Opción 2: CLI (Avanzado)

```bash
# Instalar Vercel CLI (si no está instalado)
npm i -g vercel

# Login
vercel login

# Link al proyecto
vercel link

# Añadir variables
vercel env add NEXT_PUBLIC_GA_ID production
# Pegar el valor cuando lo pida

vercel env add NEXT_PUBLIC_HOTJAR_ID production
# Pegar el valor cuando lo pida

vercel env add NEXT_PUBLIC_CLARITY_ID production
# Pegar el valor cuando lo pida

# Redeploy
vercel --prod
```

---

## ✅ VERIFICACIÓN POST-CONFIGURACIÓN

### 1. Verificar que las variables están configuradas

Dashboard → Settings → Environment Variables

Deberías ver:

- ✅ `NEXT_PUBLIC_GA_ID` (Production)
- ✅ `NEXT_PUBLIC_HOTJAR_ID` (Production) - opcional
- ✅ `NEXT_PUBLIC_CLARITY_ID` (Production) - opcional

### 2. Verificar en el sitio web

Después del redeploy (esperar 5-10 minutos):

#### Verificar Google Analytics:

1. Abrir https://inmovaapp.com
2. Abrir DevTools (F12)
3. Tab "Network"
4. Buscar requests a `google-analytics.com` o `analytics.google.com`
5. Si ves requests → ✅ Funciona
6. Si no ves requests → ❌ Revisar configuración

#### Verificar Hotjar:

1. Abrir https://inmovaapp.com
2. DevTools → Console
3. Escribir: `window.hj`
4. Si retorna una función → ✅ Funciona
5. Si `undefined` → ❌ Revisar configuración

#### Verificar Clarity:

1. Abrir https://inmovaapp.com
2. DevTools → Console
3. Escribir: `window.clarity`
4. Si retorna una función → ✅ Funciona
5. Si `undefined` → ❌ Revisar configuración

---

## 🎯 EVENTOS TRACKING IMPLEMENTADOS

Una vez configurado GA4, estos eventos se trackean automáticamente:

### Hero Section

- `heroCtaPrimary` - Click en "Prueba GRATIS"
- `heroCtaSecondary` - Click en "Ver Demo"

### Navigation

- `navDemo` - Click en "Demo" del nav
- `navLogin` - Click en "Login" del nav

### Features by Persona

- `personaTabClick(personaId)` - Cambio de tab
- `personaCtaClick(personaId)` - CTA por persona

### ROI Calculator

- `roiCalculatorSubmit(roi)` - Cálculo completado
- `roiCalculatorCta(netBenefit)` - CTA después de calcular

### Pricing

- `pricingPlanClick(planId, price)` - Click en plan

### FAQ

- `faqExpand(questionId, question)` - Expansión de pregunta

### Engagement

- `scrollDepth(25|50|75|100)` - Profundidad de scroll
- `timeOnPage(30|60|120|300)` - Tiempo en página (segundos)
- `exitIntentPopup()` - Exit intent detectado

---

## 📊 DASHBOARDS RECOMENDADOS

### Google Analytics 4

Una vez configurado, crear estos reports:

1. **Landing Page Performance:**
   - Métrica: Page views de `/`
   - Eventos: `heroCtaPrimary`, `roiCalculatorSubmit`
   - Conversiones: Define custom conversions

2. **Conversion Funnel:**
   - Step 1: `page_view` (Landing)
   - Step 2: `heroCtaPrimary` o `roiCalculatorSubmit`
   - Step 3: `signupFormComplete`

3. **Engagement:**
   - `scrollDepth` por sesión
   - `timeOnPage` promedio
   - Bounce rate

### Hotjar

Configurar estos insights:

1. **Heatmaps:**
   - Landing page (`/`)
   - Pricing section
   - ROI Calculator

2. **Recordings:**
   - Filtrar por: "Clicked CTA pero no convirtió"
   - Ver donde se frustran los usuarios

3. **Funnels:**
   - Landing → CTA → Signup → Success

### Microsoft Clarity

Configurar:

1. **Dashboard:**
   - Session recordings de landing page
   - Rage clicks (frustration)
   - Dead clicks

2. **Heatmaps:**
   - Scroll heatmap
   - Click heatmap
   - Area heatmap

3. **Insights:**
   - Revisar "Insights" automáticos con IA
   - Ver "JavaScript errors"
   - Analizar "Excessive scrolling"

---

## 🐛 TROUBLESHOOTING

### Problema: "GA4 no muestra datos después de 24h"

**Posibles causas:**

1. ID incorrecto → Verificar que empieza con `G-`
2. Variable no configurada en Vercel → Revisar Environment Variables
3. AdBlock activo → Probar en modo incógnito sin extensiones

**Solución:**

```bash
# Verificar en producción
curl https://inmovaapp.com | grep "gtag"
# Debería mostrar el script de GA4
```

### Problema: "Hotjar/Clarity no funciona"

**Posibles causas:**

1. ID incorrecto → Verificar en dashboard de Hotjar/Clarity
2. Variable no configurada
3. Script bloqueado por navegador

**Solución:**

```javascript
// Abrir consola en https://inmovaapp.com
console.log(window.hj); // Hotjar
console.log(window.clarity); // Clarity
// Si undefined → No está cargando
```

### Problema: "Eventos no se registran"

**Causa:** Probablemente AdBlock o navegador bloqueando tracking

**Solución:**

1. Probar en modo incógnito
2. Desactivar AdBlock
3. Probar en móvil (Safari/Chrome)

---

## 📞 SOPORTE

### Documentación Oficial

- **Google Analytics:** https://support.google.com/analytics
- **Hotjar:** https://help.hotjar.com
- **Microsoft Clarity:** https://docs.microsoft.com/en-us/clarity

### Contacto Vercel

- Dashboard: https://vercel.com/dashboard
- Soporte: https://vercel.com/support

---

## ✅ CHECKLIST FINAL

Antes de dar por terminada la configuración:

- [ ] `NEXT_PUBLIC_GA_ID` configurado en Vercel (Production)
- [ ] `NEXT_PUBLIC_HOTJAR_ID` configurado (opcional)
- [ ] `NEXT_PUBLIC_CLARITY_ID` configurado (opcional)
- [ ] Redeploy realizado
- [ ] Verificado en DevTools (GA4 scripts cargando)
- [ ] Probado en móvil
- [ ] Probado evento de prueba (click en CTA)
- [ ] Esperado 24-48h para ver datos en dashboards

---

**🎉 Una vez completado este checklist, el tracking estará 100% operativo!**

---

_Creado: 29 Diciembre 2025_  
_Versión: 1.0_  
_Autor: AI Assistant_
