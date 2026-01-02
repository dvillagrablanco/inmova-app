# 🚨 ESTADO CRÍTICO - LANDING NO FUNCIONA

**Fecha**: 29 Diciembre 2025 23:30  
**Problema**: Error webpack persiste incluso con código inline  
**Intentos fallidos**: 5 deployments diferentes

---

## ❌ LO QUE NO FUNCIONÓ

### 1. SimpleLandingContentV2 (con Sheet)
- **Error**: digest error por Radix UI Portals
- **Resultado**: Pantalla en blanco

### 2. SimpleLandingContentV2 (sin Sheet, con Button/Card)
- **Error**: digest error (Button/Card usan Radix internamente)
- **Resultado**: Pantalla en blanco

### 3. MinimalLanding (componente separado)
- **Error**: webpack lazy loading error
- **Resultado**: `undefined is not an object (evaluating 'originalFactory.call')`

### 4. Landing Inline (todo en page.tsx)
- **Error**: webpack lazy loading error persiste
- **Resultado**: Mismo error

### 5. Production Build
- **Error**: Build falló por `/landing/calculadora-roi` 
- **Resultado**: Servidor 000 (no responde)

---

## 🔍 CAUSA RAÍZ IDENTIFICADA

**El problema NO es el código del landing.**

**El problema ES Next.js 15 en este entorno:**

1. **Dev mode**: Errores de webpack module resolution
2. **Production build**: Falla por páginas secundarias con errores
3. **Hidratación**: Problemas con cualquier componente React complejo

---

## ✅ SOLUCIÓN RECOMENDADA

### Opción A: Static Export (RECOMENDADO)

Exportar landing como HTML estático, sin SSR, sin hydration.

```typescript
// next.config.js
module.exports = {
  output: 'export', // Static HTML export
  // ...
}
```

**Ventajas**:
- Sin errores de hidratación
- Sin webpack en cliente
- HTML puro
- Funciona 100%

**Desventajas**:
- No API routes en landing
- No server-side rendering
- Pero para landing NO se necesitan

### Opción B: Página Estática Pura (TEMPORAL)

Crear `public/landing.html` y servir directamente con Nginx.

**Pros**:
- Bypass completo de Next.js
- Funciona inmediatamente
- Sin compilación

**Contras**:
- No integrado con app
- Mantenimiento separado

### Opción C: Fix Incremental (LARGO PLAZO)

1. Arreglar `/landing/calculadora-roi` (error de datos undefined)
2. Production build limpio
3. Debuggear webpack config

**Tiempo**: 2-3 horas  
**Riesgo**: Pueden aparecer más errores

---

## 🎯 DECISIÓN REQUERIDA

**¿Qué prefieres?**

### Si necesitas landing YA:
→ **Opción B** (public/landing.html)  
Tiempo: 15 minutos  
Resultado: Landing funcional 100%

### Si puedes esperar 1-2 horas:
→ **Opción A** (Static Export)  
Tiempo: 1-2 horas  
Resultado: Landing integrado, sin errores

### Si quieres debugging profundo:
→ **Opción C** (Fix incremental)  
Tiempo: 2-3+ horas  
Resultado: Incierto

---

## 📊 ESTADO ACTUAL SERVIDOR

```
PM2: [verificando...]
Landing HTTP: [verificando...]
Errores: webpack module resolution
```

**Esperando verificación...**

---

## 💬 RESPUESTA NECESARIA

Por favor confirma:

1. **¿Necesitas landing funcional AHORA?**
   - Sí → Opción B (HTML estático en public/)
   - No, puedo esperar → Opción A (Static Export)

2. **¿Puedes vivir sin landing por 2-3 horas?**
   - Sí → Opción C (Debugging profundo)
   - No → Opción A o B

3. **¿Prefieres solución rápida o perfecta?**
   - Rápida → Opción B (15 min)
   - Perfecta → Opción A (1-2 h)
   - Completa → Opción C (2-3+ h)

---

## 🔧 PLAN DE ACCIÓN SEGÚN RESPUESTA

### Si eliges Opción B:
1. Crear `public/landing.html` con todo el código
2. Configurar Nginx redirect `/landing` → `/landing.html`
3. Deploy en 15 minutos
4. Landing funciona 100%

### Si eliges Opción A:
1. Configurar `output: 'export'` en next.config.js
2. Build estático
3. Deploy
4. Landing integrado y funcional

### Si eliges Opción C:
1. Arreglar calculadora-roi
2. Arreglar otros errores de build
3. Debug webpack config
4. Production build limpio
5. Testing exhaustivo

---

**Esperando tu decisión...**
