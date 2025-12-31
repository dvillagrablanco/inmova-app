# 📦 CHECKLIST DE DEPLOYMENT - SIDEBAR MÓVIL

**Fecha:** 26 Diciembre 2025  
**Objetivo:** Desplegar correcciones del sidebar móvil a producción  
**Estado:** ⚠️ **PENDIENTE DE DEPLOYMENT**

---

## 🎯 RESUMEN DE CAMBIOS

### Archivos Modificados (Total: 11 archivos)

#### 1. **Componentes de Layout (2 archivos)**
- ✅ `components/layout/sidebar.tsx` - Sidebar optimizado para móvil
- ✅ `components/layout/header.tsx` - Header ajustado para botón del menú

#### 2. **Estilos (2 archivos)**
- ✅ `styles/sidebar-mobile.css` - **NUEVO ARCHIVO** - CSS específico para móvil
- ✅ `app/layout.tsx` - Importa el nuevo CSS

#### 3. **Páginas Corregidas (7 archivos)**
- ✅ `app/admin/clientes/[id]/editar/page.tsx`
- ✅ `app/firma-digital/templates/page.tsx`
- ✅ `app/onboarding/page.tsx`
- ✅ `app/contratos/[id]/editar/page.tsx`
- ✅ `app/unidades/[id]/editar/page.tsx`
- ✅ `app/inquilinos/[id]/editar/page.tsx`
- ✅ `app/admin/clientes/comparar/page.tsx`

---

## 🚨 PROBLEMA COMÚN EN DEPLOYMENT

### ¿Por qué podría no funcionar en producción?

1. **Cache del Navegador**
   - Los archivos CSS pueden estar cacheados
   - Los archivos JS pueden estar cacheados
   - Necesita hacer "hard refresh"

2. **Cache del CDN (Vercel/Railway)**
   - Los archivos estáticos pueden estar en cache
   - Puede tomar varios minutos en propagarse

3. **Build Cache**
   - Next.js cachea el build
   - Necesita rebuild completo

4. **Archivo CSS No Desplegado**
   - El archivo `styles/sidebar-mobile.css` es NUEVO
   - Debe estar incluido en el deployment

---

## ✅ CHECKLIST DE DEPLOYMENT

### Paso 1: Verificar Archivos Localmente

```bash
# 1. Verificar que el archivo CSS existe
ls -la /workspace/styles/sidebar-mobile.css

# 2. Verificar que está importado en layout.tsx
grep "sidebar-mobile.css" /workspace/app/layout.tsx

# 3. Verificar cambios en sidebar.tsx
grep "top-3 left-3" /workspace/components/layout/sidebar.tsx

# 4. Verificar cambios en header.tsx
grep "z-10" /workspace/components/layout/header.tsx
```

**✅ Resultado Esperado:**
- Archivo CSS existe (1.3KB)
- Import presente en línea 5 de layout.tsx
- Botón del menú en top-3 left-3
- Header con z-10

---

### Paso 2: Commit de Cambios

```bash
# 1. Ver archivos modificados
git status

# 2. Agregar todos los archivos modificados
git add components/layout/sidebar.tsx
git add components/layout/header.tsx
git add styles/sidebar-mobile.css
git add app/layout.tsx
git add app/admin/clientes/[id]/editar/page.tsx
git add app/firma-digital/templates/page.tsx
git add app/onboarding/page.tsx
git add app/contratos/[id]/editar/page.tsx
git add app/unidades/[id]/editar/page.tsx
git add app/inquilinos/[id]/editar/page.tsx

# 3. Crear commit
git commit -m "fix: Corregir sidebar móvil y layout desktop

- Optimizar botón del menú móvil (top-3, left-3, 52x52px)
- Agregar touch-manipulation para mejor respuesta táctil
- Sidebar responsivo (85vw, max 320px)
- Nuevo archivo CSS sidebar-mobile.css con optimizaciones iOS
- Body lock al abrir menú móvil
- Scroll táctil optimizado con momentum
- Ajustar z-index del header (20 → 10)
- Corregir margen desktop en 6 páginas (ml-0 lg:ml-64)
- Agregar WebkitOverflowScrolling para iOS
- Scrollbar personalizada en móvil"

# 4. Push a la rama
git push origin <nombre-de-tu-rama>
```

---

### Paso 3: Deploy en Vercel/Railway

#### Opción A: Deploy Automático (Vercel)
1. ✅ Push a la rama principal o crear PR
2. ✅ Vercel detecta cambios automáticamente
3. ✅ Build se ejecuta automáticamente
4. ⏳ Esperar 2-5 minutos

#### Opción B: Deploy Manual (Vercel CLI)
```bash
# 1. Instalar Vercel CLI (si no está instalado)
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Esperar confirmación
```

#### Opción C: Railway
```bash
# 1. Railway detecta push automáticamente
# 2. Verificar en dashboard de Railway
# 3. Esperar build completo
```

---

### Paso 4: Limpiar Cache en Vercel (IMPORTANTE)

Si el sidebar sigue sin funcionar después del deploy:

1. **Dashboard de Vercel**
   - Ir a: Settings → Data Cache
   - Click en "Purge Everything"
   - Confirmar

2. **O usar CLI:**
```bash
vercel --prod --force
```

---

### Paso 5: Verificar Build en Producción

```bash
# 1. Ver logs del deployment
# En Vercel: ir a Deployments → Click en último deploy → View Function Logs

# 2. Verificar que no hay errores de build
# Buscar:
# - "Build completed"
# - "No errors"
# - Sin warnings sobre sidebar-mobile.css

# 3. Verificar archivos estáticos
# URL: https://tu-dominio.com/_next/static/css/sidebar-mobile.css
# Debe devolver el CSS (no 404)
```

---

### Paso 6: Verificar en Dispositivo Móvil

#### En iPhone/Safari iOS:
1. ✅ Abrir Safari
2. ✅ Ir a la URL de producción
3. ✅ Hacer **"Hard Refresh"**: 
   - Mantener presionado el botón de recarga
   - O: Ajustes → Safari → Borrar historial y datos
4. ✅ Verificar botón del menú visible (arriba izquierda)
5. ✅ Tocar botón → menú se abre
6. ✅ Scroll suave con momentum
7. ✅ Tocar overlay → menú se cierra

#### En Android/Chrome:
1. ✅ Abrir Chrome
2. ✅ Ir a la URL de producción
3. ✅ Hacer **"Hard Refresh"**:
   - Menu → Configuración → Privacidad → Borrar datos
   - O: Tocar icono de recarga largo
4. ✅ Verificar botón del menú visible
5. ✅ Probar abrir/cerrar menú
6. ✅ Verificar scroll táctil

---

## 🔧 TROUBLESHOOTING

### Problema 1: El botón del menú NO aparece

**Posibles Causas:**
- Cache del navegador
- Build no completado
- CSS no desplegado

**Solución:**
```bash
# 1. Hard refresh en el navegador móvil
# Safari iOS: Cmd + Shift + R
# Chrome Android: Clear cache manualmente

# 2. Verificar que el build está completo en Vercel
# 3. Purgar cache de Vercel
vercel --prod --force

# 4. Verificar que sidebar.tsx está desplegado:
# Buscar en source code del navegador: "top-3 left-3"
```

---

### Problema 2: El menú se abre pero no se puede cerrar

**Posibles Causas:**
- Overlay no clickeable
- Z-index incorrecto
- JavaScript no cargado

**Solución:**
```bash
# 1. Verificar en DevTools (Chrome Remote Debugging):
# - Overlay debe tener z-[80]
# - Sidebar debe tener z-[90]
# - Botón debe tener z-[100]

# 2. Verificar que useEffect está funcionando:
console.log('Menu open:', isMobileMenuOpen)

# 3. Verificar eventos:
# Click en overlay debe llamar setIsMobileMenuOpen(false)
```

---

### Problema 3: El scroll no funciona dentro del menú

**Posibles Causas:**
- CSS sidebar-mobile.css no cargado
- WebkitOverflowScrolling no aplicado
- Navegador no soportado

**Solución:**
```bash
# 1. Verificar en DevTools que sidebar-mobile.css está cargado
# 2. Verificar estilos aplicados en [data-sidebar-nav]:
# - -webkit-overflow-scrolling: touch
# - overscroll-behavior: contain

# 3. Verificar que el nav tiene el atributo data-sidebar-nav
```

---

### Problema 4: El contenido detrás scrollea cuando el menú está abierto

**Posibles Causas:**
- Body lock no aplicado
- Clase sidebar-open no agregada
- CSS no cargado

**Solución:**
```javascript
// Verificar en DevTools:
// 1. Cuando el menú está abierto, body debe tener:
// - class="sidebar-open"
// - style="position: fixed; top: -XXpx"

// 2. Verificar useEffect en sidebar.tsx:
document.body.classList.contains('sidebar-open') // debe ser true
```

---

## 📱 TESTING EN DIFERENTES DISPOSITIVOS

### Obligatorio (Mínimo)
- [ ] iPhone 13 (iOS 16+) - Safari
- [ ] Samsung Galaxy S21 (Android 12+) - Chrome
- [ ] iPad Mini (iPadOS 16+) - Safari

### Recomendado
- [ ] iPhone SE (pantalla pequeña 375px)
- [ ] iPhone 14 Pro Max (pantalla grande 428px)
- [ ] Samsung Galaxy S20 (360px)
- [ ] OnePlus / Xiaomi (Android genérico)

### Tablet
- [ ] iPad Air (820px)
- [ ] Samsung Tab S8

---

## 📋 CHECKLIST VISUAL

### Móvil (< 1024px)

#### Botón del Menú
- [ ] Visible arriba a la izquierda
- [ ] Tamaño adecuado (52x52px)
- [ ] No se superpone con header
- [ ] Gradiente indigo-violet visible
- [ ] Icono de menú (☰) visible
- [ ] Cambia a X cuando está abierto

#### Al Abrir el Menú
- [ ] Animación suave (300ms)
- [ ] Overlay oscuro aparece
- [ ] Sidebar desliza desde la izquierda
- [ ] Sidebar ocupa 85% del ancho (max 320px)
- [ ] Logo visible arriba
- [ ] Búsqueda visible
- [ ] Navegación scrolleable

#### Scroll del Menú
- [ ] Scroll suave con dedo
- [ ] Momentum en iOS (sigue scrolleando)
- [ ] No causa scroll del body
- [ ] Scrollbar visible pero discreta
- [ ] No hay "rubber band" en los bordes

#### Cerrar el Menú
- [ ] Tocar overlay lo cierra
- [ ] Tocar botón X lo cierra
- [ ] Presionar Escape lo cierra (desktop)
- [ ] Navegar a una página lo cierra
- [ ] Animación suave al cerrar
- [ ] Body vuelve a scrollear

### Desktop (≥ 1024px)

#### Layout General
- [ ] Sidebar fijo en la izquierda (256px)
- [ ] Botón del menú NO visible
- [ ] Header con margen correcto
- [ ] Contenido NO tapado por sidebar

#### Páginas Específicas
- [ ] `/admin/clientes/[id]/editar` - Contenido visible
- [ ] `/contratos/[id]/editar` - Formulario visible
- [ ] `/unidades/[id]/editar` - Formulario visible
- [ ] `/inquilinos/[id]/editar` - Formulario visible
- [ ] Todas las páginas admin - Contenido visible

---

## 🎨 DETALLES VISUALES ESPERADOS

### Botón del Menú Móvil
```
┌─────────────┐
│ [☰]         │ ← Botón en esquina superior izquierda
│   INMOVA    │    (top-3, left-3)
│             │
└─────────────┘
```

### Menú Abierto
```
┌────────────────┐ ║ [Overlay]
│ [X]            │ ║ semitransparente
│                │ ║ con blur
│ • Inicio       │ ║
│ • Dashboard    │ ║ ← 15% contenido
│ • Edificios    │ ║    visible
│ ...            │ ║
│ [Scroll]       │ ║
│                │ ║
│ [User Info]    │ ║
│ [Cerrar Sesión]│ ║
└────────────────┘ ║
 85% ancho         
 max 320px
```

---

## 🔍 COMANDOS DE VERIFICACIÓN POST-DEPLOYMENT

```bash
# 1. Verificar que el sitio está UP
curl -I https://tu-dominio.com

# 2. Verificar que el CSS sidebar-mobile.css existe
curl https://tu-dominio.com/_next/static/css/sidebar-mobile.css | head -20

# 3. Verificar que sidebar.tsx tiene los cambios
curl https://tu-dominio.com/_next/static/chunks/pages/... | grep "top-3 left-3"

# 4. Verificar build info
curl https://tu-dominio.com/api/health
```

---

## 📊 MÉTRICAS DE ÉXITO

### Antes del Deployment
- ❌ Botón del menú difícil de tocar
- ❌ Sidebar ocupaba toda la pantalla
- ❌ Scroll no funcionaba bien
- ❌ Contenido tapado en desktop

### Después del Deployment (Esperado)
- ✅ Botón fácil de tocar (52x52px)
- ✅ Sidebar responsivo (85% ancho)
- ✅ Scroll suave con momentum
- ✅ Body bloqueado al abrir menú
- ✅ Contenido visible en desktop
- ✅ 0 errores de layout

---

## 🚀 COMANDO RÁPIDO DE DEPLOYMENT

Si tienes prisa, usa este comando todo-en-uno:

```bash
# Deploy completo con limpieza de cache
git add . && \
git commit -m "fix: optimizar sidebar móvil y corregir layout desktop" && \
git push origin main && \
vercel --prod --force && \
echo "✅ Deployment iniciado. Espera 3-5 minutos y haz hard refresh en el móvil."
```

---

## 📞 SOPORTE

Si después de seguir todos estos pasos el sidebar sigue sin funcionar:

1. **Verificar logs de build en Vercel:**
   - Deployments → Latest → View Function Logs
   - Buscar errores relacionados con sidebar o CSS

2. **Verificar archivos desplegados:**
   - Source code en DevTools
   - Buscar "sidebar-mobile.css"
   - Buscar "top-3 left-3"

3. **Verificar variables de entorno:**
   - NODE_ENV=production
   - Sin flags de desarrollo

4. **Contactar soporte de Vercel/Railway:**
   - Si el archivo CSS no se está desplegando
   - Si hay errores de build

---

## ✅ RESUMEN EJECUTIVO

### Cambios Críticos
1. ✅ Nuevo archivo: `styles/sidebar-mobile.css`
2. ✅ Import en: `app/layout.tsx`
3. ✅ Botón optimizado: `top-3 left-3`, `52x52px`
4. ✅ Sidebar responsivo: `85vw max-w-[320px]`
5. ✅ Margen desktop: `ml-0 lg:ml-64` en 6 páginas

### Próximos Pasos
1. ⏳ Commit y push de cambios
2. ⏳ Deploy a producción
3. ⏳ Purgar cache de Vercel
4. ⏳ Hard refresh en móvil
5. ⏳ Verificar en diferentes dispositivos

### Tiempo Estimado
- Commit: 2 minutos
- Deploy: 3-5 minutos
- Propagación de cache: 2-10 minutos
- **Total: 7-17 minutos**

---

**¿Listo para deployar?** Sigue la checklist paso a paso.

**¿Ya desplegaste y sigue sin funcionar?** Ve a la sección de Troubleshooting.

**Última actualización:** 26 Diciembre 2025
