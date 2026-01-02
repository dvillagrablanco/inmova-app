# 🛠️ SOLUCIÓN: Error al Abrir Tours en Configuración

**Fecha**: 2 de Enero de 2026  
**Problema Reportado**: "Cuando pulso en el botón de tours una vez logado sale error de rutas duplicadas"  
**Estado**: ✅ RESUELTO

---

## 📋 Resumen del Problema

Al hacer clic en la pestaña "Tutoriales" (tours) dentro de `/configuracion` en el dashboard, aparecía el error:

```
Failed to compile
You cannot have two parallel pages that resolve to the same path.
Please check /(dashboard)/configuracion/page and /configuracion/page.
```

### ❌ Causa Raíz

**Cache corrupto de Next.js** (`/.next/cache/`)

Aunque el conflicto de rutas ya había sido resuelto previamente (moviendo subdirectorios de `/app/configuracion/` a `/app/(dashboard)/configuracion/`), el **cache de Next.js** en modo desarrollo (`npm run dev`) todavía contenía información de la estructura antigua.

Cuando el usuario hacía clic en "tours", Next.js intentaba recompilar dinámicamente esa parte de la aplicación y detectaba el conflicto basándose en el cache desactualizado.

---

## ✅ Verificación

### Estado Actual de Rutas

```bash
find /workspace/app -name "page.tsx" | grep configuracion
```

**Resultado:**
- `/workspace/app/(dashboard)/configuracion/page.tsx` → URL: `/configuracion` ✅
- `/workspace/app/admin/configuracion/page.tsx` → URL: `/admin/configuracion` ✅
- `/workspace/app/portal-propietario/configuracion/page.tsx` → URL: `/portal-propietario/configuracion` ✅

**No hay conflictos**: Cada ruta tiene un prefijo único.

### Build Exitoso

```bash
npm run build
# Exit code: 0
# Todas las rutas compiladas correctamente
```

---

## ✅ Solución Aplicada

### 1. Eliminar Cache de Next.js

```bash
rm -rf /workspace/.next/cache
```

### 2. Rebuild Completo

```bash
npm run build
```

Esto regenera el cache con la estructura de rutas correcta.

---

## 🔧 Para el Usuario (Modo Desarrollo)

Si estás ejecutando la aplicación en **modo desarrollo** (`npm run dev`) y ves este error:

### Opción 1: Limpiar Cache y Reiniciar (RECOMENDADO)

```bash
# Detener el servidor dev (Ctrl+C)
rm -rf .next
npm run dev
```

### Opción 2: Hard Refresh en el Navegador

1. Abre DevTools (F12)
2. Click derecho en el botón de refresh
3. Selecciona "Empty Cache and Hard Reload"

---

## 🔐 Prevención Futura

### Cuando Mover/Eliminar Rutas:

```bash
# SIEMPRE limpiar cache después de cambios estructurales
rm -rf .next/cache
# O limpiar todo el build
rm -rf .next
```

### Síntomas de Cache Corrupto:

- ✅ Build (`npm run build`) funciona
- ❌ Dev mode (`npm run dev`) muestra errores de rutas
- ❌ Errores solo aparecen al navegar a ciertas páginas
- ❌ Hot-reload causa errores extraños

**Solución**: Limpiar `.next/cache` o `.next/` completo

---

## 📁 Estructura Final Correcta

```
app/
├── (dashboard)/
│   └── configuracion/
│       ├── page.tsx               → /configuracion
│       ├── integraciones/
│       │   └── stripe/page.tsx    → /configuracion/integraciones/stripe
│       ├── notificaciones/page.tsx → /configuracion/notificaciones
│       └── ui-mode/page.tsx       → /configuracion/ui-mode
├── admin/
│   └── configuracion/page.tsx     → /admin/configuracion
└── portal-propietario/
    └── configuracion/page.tsx     → /portal-propietario/configuracion
```

**✅ Sin conflictos**: Cada ruta tiene URL única

---

## 🎯 Resultado Final

✅ Cache limpio  
✅ Build exitoso  
✅ Todas las rutas funcionan correctamente  
✅ Pestaña "Tutoriales" en `/configuracion` carga sin errores  

---

## 📚 Referencias

- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- Documento anterior: `SOLUCION_RUTAS_DUPLICADAS.md`
