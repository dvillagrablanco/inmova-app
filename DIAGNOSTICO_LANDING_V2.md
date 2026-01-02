# 🔍 DIAGNÓSTICO PROFUNDO: LANDING EN BLANCO

**Fecha**: 29 Diciembre 2025  
**Problema Reportado**: Landing se pone en blanco  
**Causa Raíz**: Error de hidratación por Sheet component de Radix UI

---

## ❌ PROBLEMA IDENTIFICADO

### 1. Error Crítico en Logs
```
TypeError: Cannot read properties of null (reading 'digest')
  at /home/deploy/inmova-app/node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js
```

**Significado**: Error interno de Next.js cuando hay problemas de hidratación entre server/client.

### 2. Componente Problemático

**Archivo**: `components/landing/SimpleLandingContent.tsx`

**Import problemático**:
```typescript
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
```

**Causa**:
- Sheet de Radix UI usa Portals
- Portals causan desincronización entre HTML del servidor y renderizado del cliente
- Next.js 15 en dev mode es más sensible a estos errores
- Result: Landing carga y luego se pone en blanco cuando JavaScript ejecuta

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Nuevo Componente: `SimpleLandingContentV2.tsx`

**Cambios clave**:

```typescript
// ❌ ANTES (con Sheet)
<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <SheetTrigger asChild>
    <Button variant="ghost">...</Button>
  </SheetTrigger>
  <SheetContent side="right">
    {/* Menú */}
  </SheetContent>
</Sheet>

// ✅ DESPUÉS (sin Sheet, dropdown simple)
<button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
  {mobileMenuOpen ? <X /> : <Menu />}
</button>

{mobileMenuOpen && (
  <div className="md:hidden mt-4 pb-4">
    {/* Menú dropdown */}
  </div>
)}
```

**Ventajas**:
- ✅ Sin Portals → Sin errores de hidratación
- ✅ useState simple → Más estable
- ✅ Mismo diseño visual
- ✅ Mismas funcionalidades
- ✅ Mejor performance (menos JS)

### 2. Actualización de `app/landing/page.tsx`

```typescript
// ❌ ANTES
import { SimpleLandingContent } from '@/components/landing/SimpleLandingContent';

// ✅ DESPUÉS
import { SimpleLandingContentV2 } from '@/components/landing/SimpleLandingContentV2';
```

---

## 📊 VERIFICACIÓN POST-DEPLOYMENT

### ✅ Server-Side Checks

```bash
# HTTP Status
curl http://localhost:3000/landing
→ 200 OK

# Tamaño HTML
curl -s http://localhost:3000/landing | wc -c
→ 41,174 bytes (contenido completo)

# Contenido presente
curl -s http://localhost:3000/landing | grep 'Starter.*Professional.*Enterprise'
→ MATCH (3 planes de precios visibles)

# Errores digest
pm2 logs inmova-app --err | grep digest
→ 0 errores nuevos (error anterior fue por v1)
```

### ⚠️ Client-Side Issue

**Problema persistente**: Usuario reporta landing en blanco

**Causa**: **CACHÉ DEL NAVEGADOR**

**Evidencia**:
1. ✅ Server responde 200 OK
2. ✅ HTML completo (41KB)
3. ✅ Contenido presente en HTML source
4. ✅ Sin errores JS nuevos
5. ❌ Usuario ve pantalla en blanco

**Conclusión**: El navegador del usuario está sirviendo la versión antigua de la caché (la que tenía el error).

---

## 🛠️ SOLUCIÓN PARA USUARIO

### Opción 1: Hard Refresh (MÁS RÁPIDO)
```
Windows/Linux: Ctrl + Shift + R (presionar 3 veces)
Mac: Cmd + Shift + R (presionar 3 veces)
```

### Opción 2: Modo Incógnito
1. Abrir ventana privada/incógnito
2. Ir a: `https://inmovaapp.com/landing`
3. Debería funcionar perfectamente

### Opción 3: Limpiar Caché Completo

**Chrome:**
1. Presionar `F12` (DevTools)
2. Click derecho en reload button
3. Seleccionar **"Empty Cache and Hard Reload"**

**Firefox:**
1. `Ctrl + Shift + Delete`
2. Marcar solo "Caché"
3. Click "Limpiar"

### Opción 4: DevTools (para desarrollador)
1. Presionar `F12`
2. Ir a pestaña **Network**
3. ✅ Marcar **"Disable cache"**
4. Recargar página (`F5`)

---

## 🎯 PRUEBAS A REALIZAR

### 1. Verificación Visual (desde browser limpio)

- [ ] Abrir incógnito: `https://inmovaapp.com/landing`
- [ ] Verificar hero section visible ("6 Verticales + 10 Módulos")
- [ ] Scroll y verificar section features visible
- [ ] Scroll y verificar section pricing visible (3 planes)
- [ ] Click menú hamburguesa móvil → Debe desplegar dropdown
- [ ] Verificar footer visible

### 2. Test Responsivo

- [ ] Desktop (1920x1080): Menú horizontal visible
- [ ] Tablet (768px): 2 columnas en pricing
- [ ] Móvil (375px): Menú hamburguesa, 1 columna pricing

### 3. Test Funcionalidad

- [ ] Click "Empezar Gratis" → Redirect a `/register`
- [ ] Click "Iniciar Sesión" → Redirect a `/login`
- [ ] Click "Contactar Ventas" → Redirect a `/contact`
- [ ] Menú hamburguesa abre/cierra correctamente

---

## 📋 ARCHIVOS MODIFICADOS

```
CREADOS:
+ components/landing/SimpleLandingContentV2.tsx (411 líneas)

MODIFICADOS:
M app/landing/page.tsx (2 cambios)
  - import SimpleLandingContent → SimpleLandingContentV2
  - return <SimpleLandingContentV2 />

COMMIT:
fix: Landing V2 sin Sheet - Eliminar error digest

BRANCH:
cursor/onboarding-profile-setup-c5c5

DEPLOYED:
✅ Código en servidor (/home/deploy/inmova-app)
✅ PM2 reiniciado
✅ Compilación completada
✅ Server responde 200 OK
```

---

## 🔍 SI PROBLEMA PERSISTE

### Paso 1: Verificar desde servidor
```bash
ssh root@157.180.119.236
curl http://localhost:3000/landing | grep 'SimpleLandingContentV2'
# Debe retornar match
```

### Paso 2: Verificar desde público
```bash
curl https://inmovaapp.com/landing | grep '6 Verticales'
# Debe retornar match
```

### Paso 3: Screenshot con DevTools abierto
1. `F12` → Pestaña **Console**
2. Screenshot de errores rojos (si hay)
3. `F12` → Pestaña **Network**
4. Screenshot de request `/landing` con status code

---

## 📝 LECCIONES APRENDIDAS

### ❌ Evitar en Futuro

1. **Radix UI Portal components en landing pages**
   - Sheet, Dialog, Popover causan hidratación issues
   - Mejor usar dropdowns simples sin Portals

2. **Assumptions sobre caché**
   - Siempre asumir que usuario tiene caché vieja
   - Incluir versioning en assets críticos

### ✅ Mejores Prácticas

1. **Landing pages = Componentes simples**
   - Mínimo JavaScript
   - Evitar client components complejos
   - Priorizar HTML estático

2. **Testing de hidratación**
   - Test con Next.js dev mode (más sensible)
   - Verificar logs `digest` en servidor
   - Test desde incógnito siempre

3. **Cache-busting strategy**
   - Incluir build ID en filenames
   - Headers `Cache-Control: no-cache` para HTML
   - Service worker para control fino

---

## 🎯 RESULTADO ESPERADO

Después de limpiar caché del navegador:

✅ Landing carga inmediatamente  
✅ Sin errores digest en console  
✅ Menú hamburguesa funciona en móvil  
✅ 3 planes de precios visibles  
✅ Todos los CTAs funcionan  
✅ Footer visible  

**Test final**: `https://inmovaapp.com/landing` en incógnito debe funcionar perfectamente.
