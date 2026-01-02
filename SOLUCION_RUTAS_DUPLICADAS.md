# ✅ Solución: Error de Rutas Duplicadas en Next.js

**Fecha:** 2 de enero de 2026  
**Error:** `You cannot have two parallel pages that resolve to the same path`

---

## 🔍 Problema

Al intentar abrir los tours, Next.js mostraba este error de build:

```
You cannot have two parallel pages that resolve to the same path. 
Please check /(dashboard)/configuracion/page and /configuracion/page.
```

### Causa Raíz

Existían dos directorios que resolvían a la misma ruta `/configuracion`:

1. **`/app/(dashboard)/configuracion/page.tsx`** - Página principal de configuración
2. **`/app/configuracion/`** - Directorio con subdirectorios (integraciones, notificaciones, ui-mode)

Como `(dashboard)` es un **route group** que NO afecta la URL, ambas rutas resolvían a `/configuracion`, causando el conflicto.

---

## ✅ Solución Aplicada

### 1. Mover Subdirectorios

Moví los subdirectorios de `/app/configuracion/` dentro de `/app/(dashboard)/configuracion/`:

```bash
cd /workspace/app
mv configuracion/integraciones "(dashboard)/configuracion/"
mv configuracion/ui-mode "(dashboard)/configuracion/"
mv configuracion/notificaciones "(dashboard)/configuracion/"
```

### 2. Eliminar Directorio Vacío

```bash
rmdir configuracion
```

### 3. Estructura Final

```
/app/(dashboard)/configuracion/
  ├── page.tsx                    # Página principal de configuración
  ├── integraciones/
  │   └── stripe/
  │       └── page.tsx           # /configuracion/integraciones/stripe
  ├── notificaciones/
  │   └── page.tsx               # /configuracion/notificaciones
  └── ui-mode/
      └── page.tsx               # /configuracion/ui-mode
```

---

## 🎯 Rutas Resultantes

Todas las rutas siguen funcionando igual porque `(dashboard)` no afecta las URLs:

- `/configuracion` → Página principal con tabs (Preferencias, Módulos, **Tours**)
- `/configuracion/integraciones/stripe` → Integración de Stripe
- `/configuracion/notificaciones` → Configuración de notificaciones
- `/configuracion/ui-mode` → Modo de interfaz

---

## ✅ Verificación

### Build Exitoso

```bash
npm run build
```

**Resultado:** ✅ Compilación exitosa sin error de rutas duplicadas

### Tours Funcionando

La página `/configuracion` con el tab de "Tutoriales" ahora carga correctamente.

---

## 📝 Referencias Actualizadas

Las referencias en el código **NO necesitaron cambios** porque las URLs finales son las mismas:

- `/configuracion/notificaciones` sigue funcionando
- `/configuracion/integraciones/stripe` sigue funcionando

---

## 🛡️ Prevención Futura

### ⚠️ Regla: Route Groups y Rutas Paralelas

**IMPORTANTE:** Cuando uses route groups como `(dashboard)`, asegúrate de que NO haya directorios fuera del route group que creen la misma ruta.

**❌ Incorrecto:**
```
/app/(dashboard)/configuracion/page.tsx  → /configuracion
/app/configuracion/subfolder/page.tsx    → /configuracion/* (CONFLICTO)
```

**✅ Correcto:**
```
/app/(dashboard)/configuracion/page.tsx     → /configuracion
/app/(dashboard)/configuracion/subfolder/   → /configuracion/subfolder
```

### 📋 Checklist Antes de Crear Rutas

- [ ] ¿Existe ya una ruta con el mismo nombre en otro route group?
- [ ] ¿Estás usando route groups? Verifica que todos los subdirectorios estén dentro
- [ ] Ejecuta `npm run build` para detectar conflictos temprano

---

## 📚 Documentación

- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)

---

**Estado:** ✅ **RESUELTO**  
**Build:** ✅ **FUNCIONA**  
**Tours:** ✅ **ACCESIBLES**
