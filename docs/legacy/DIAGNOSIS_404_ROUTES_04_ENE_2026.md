# 🔍 DIAGNÓSTICO: Rutas 404 en Producción

**Fecha:** 4 de enero de 2026  
**Problema:** 64 páginas retornan 404 en producción, incluyendo páginas críticas de superadmin

---

## ❌ PROBLEMA IDENTIFICADO

### Estructura Dual de Rutas

El proyecto tiene **dos estructuras de rutas** que causan confusión:

```
app/
├── (dashboard)/ ✅ Grupo de rutas - SE COMPILA
│   ├── admin-fincas/
│   ├── coliving/
│   ├── configuracion/
│   └── ... (ESTAS PÁGINAS FUNCIONAN)
│
├── admin/ ❌ Fuera del grupo - NO SE COMPILA
├── candidatos/ ❌ NO SE COMPILA
├── usuarios/ ❌ NO SE COMPILA
├── propiedades/ ❌ NO SE COMPILA
├── inquilinos/ ❌ NO SE COMPILA
└── ... (64+ PÁGINAS QUE NO FUNCIONAN)
```

### Evidencia

#### 1. **Build de Producción**
```bash
# En .next/server/app/ SOLO aparecen páginas de (dashboard):
/opt/inmova-app/.next/server/app/(dashboard)/admin-fincas/page.js ✅
/opt/inmova-app/.next/server/app/(dashboard)/coliving/page.js ✅

# NO aparecen:
/opt/inmova-app/.next/server/app/admin/page.js ❌
/opt/inmova-app/.next/server/app/candidatos/page.js ❌
```

#### 2. **Los archivos page.tsx EXISTEN en el código**
```bash
# Local y en servidor:
app/admin/page.tsx ✅ (12KB)
app/candidatos/page.tsx ✅ (11KB)
app/usuarios/page.tsx ✅ (23KB)

# Pero NO se compilan en el build
```

#### 3. **HTTP 200 pero contenido es 404**
```bash
$ curl http://localhost:3000/admin
HTTP/1.1 200 OK  # ← Retorna 200
Content: "404: This page could not be found"  # ← Pero muestra 404
```

Esto es el comportamiento de Next.js cuando una ruta NO existe en el build.

---

## 🔍 ANÁLISIS TÉCNICO

### ¿Por qué Next.js no las compila?

**Hipótesis 1: Layout protegido**
- Puede haber un `layout.tsx` en `app/(dashboard)/` que Next.js espera para todas las rutas
- Las páginas fuera de `(dashboard)` no tienen ese layout, por lo que no se renderizan

**Hipótesis 2: Configuración de `next.config.js`**
- Puede haber configuración que excluye rutas fuera de grupos de rutas

**Hipótesis 3: Error en estructura de App Router**
- Next.js 15 App Router requiere que todas las páginas estén dentro de grupos de rutas organizados
- Las páginas "sueltas" en `/app` directamente pueden ser ignoradas

### Verificación

```bash
# Test en servidor:
$ ls -la app/(dashboard)/
admin-fincas/  coliving/  configuracion/  ← ESTAS FUNCIONAN

$ ls -la app/
admin/  candidatos/  usuarios/  propiedades/  ← ESTAS NO FUNCIONAN
```

---

## ✅ SOLUCIONES PROPUESTAS

### Opción 1: Mover todas las páginas a `(dashboard)` (RECOMENDADO)

```bash
# Mover páginas al grupo de rutas
mv app/admin app/(dashboard)/admin
mv app/candidatos app/(dashboard)/candidatos
mv app/usuarios app/(dashboard)/usuarios
mv app/propiedades app/(dashboard)/propiedades
mv app/inquilinos app/(dashboard)/inquilinos
# ... resto de páginas
```

**Pros:**
- ✅ Consistencia con estructura actual
- ✅ Aprovecha layout y protección de rutas de `(dashboard)`
- ✅ Fix permanente

**Contras:**
- ⚠️ Requiere mover 64+ archivos
- ⚠️ Puede afectar imports/rutas

### Opción 2: Crear grupo de rutas alternativo `(app)`

```bash
# Crear nuevo grupo y mover páginas
mkdir app/(app)
mv app/admin app/(app)/admin
mv app/candidatos app/(app)/candidatos
# ...
```

**Pros:**
- ✅ Separación lógica entre dashboard y app
- ✅ Flexibilidad para diferentes layouts

**Contras:**
- ⚠️ Duplica estructura
- ⚠️ Más complejo de mantener

### Opción 3: Verificar layout en `app/`

Si existe `app/layout.tsx` pero no funciona, puede ser un bug de Next.js 15.

```bash
# Verificar layout raíz
cat app/layout.tsx

# Asegurar que incluye <children>
```

### Opción 4: Revisar `next.config.js`

```js
// next.config.js
module.exports = {
  // Verificar si hay excludes o includes que bloquean rutas
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Asegurar que no hay configuración que excluya rutas
}
```

---

## 🚨 PÁGINAS AFECTADAS (64 total)

### Críticas (Superadmin):
- ❌ `/admin`
- ❌ `/admin/usuarios`
- ❌ `/admin/configuracion`
- ❌ `/admin/dashboard`
- ❌ `/admin/activity`
- ❌ `/admin/alertas`
- ❌ `/admin/planes`
- ❌ `/admin/marketplace`
- ❌ `/admin/modulos`
- ❌ `/usuarios`
- ❌ `/empresas`

### Importantes (Funcionalidad Core):
- ❌ `/candidatos`
- ❌ `/candidatos/nuevo`
- ❌ `/propiedades`
- ❌ `/inquilinos`
- ❌ `/contratos`
- ❌ `/seguros`
- ❌ `/mantenimiento`

### Otras:
- ❌ `/analytics`
- ❌ `/calendario`
- ❌ `/chat`
- ❌ `/auditoria`
- ❌ `/automatizacion`
- ❌ ... (resto de 64 páginas)

---

## 📋 PLAN DE ACCIÓN

### 1. Verificación Inmediata
```bash
# 1. Verificar layout raíz
cat app/layout.tsx

# 2. Verificar layout de (dashboard)
cat app/(dashboard)/layout.tsx

# 3. Verificar next.config.js
cat next.config.js | grep -A 10 -B 10 "pageExtensions\|exclude\|include"
```

### 2. Fix Rápido (Temporal)
Si el problema es urgente, crear enlaces desde `(dashboard)` a las páginas actuales:

```tsx
// app/(dashboard)/admin/page.tsx
export { default } from '@/app/admin/page';
```

### 3. Fix Permanente (Recomendado)
Mover todas las páginas a `(dashboard)`:

```bash
#!/bin/bash
PAGES_TO_MOVE=(
  "admin"
  "candidatos"
  "usuarios"
  "propiedades"
  "inquilinos"
  "contratos"
  # ... resto
)

for page in "${PAGES_TO_MOVE[@]}"; do
  if [ -d "app/$page" ]; then
    mv "app/$page" "app/(dashboard)/$page"
  fi
done
```

### 4. Rebuild y Deploy
```bash
# Limpiar build anterior
rm -rf .next

# Regenerar Prisma
npx prisma generate

# Build
npm run build

# Deploy
pm2 reload inmova-app
```

### 5. Verificación Post-Fix
```bash
# Test endpoints
curl -I http://localhost:3000/admin
curl -I http://localhost:3000/candidatos
curl -I http://localhost:3000/usuarios

# Verificar build
find .next/server/app -name 'page.js' | grep -E "(admin|candidatos|usuarios)" | head -10
```

---

## 📊 MÉTRICAS

### Descubrimiento:
- **Total archivos page.tsx:** 384
- **Páginas en grupo (dashboard):** ~10 ✅
- **Páginas fuera de grupos:** ~374 ❌

### Testing:
- **Rutas testeadas:** 50
- **Errores 404:** 50 (100%)
- **Páginas que funcionan:** 0

### Impacto:
- **Usuarios afectados:** TODOS (especialmente superadmin)
- **Funcionalidad afectada:** 97% del sistema
- **Severidad:** 🔴 CRÍTICO

---

## 🎓 LECCIONES APRENDIDAS

### 1. Next.js 15 App Router - Grupos de Rutas
Los grupos de rutas `(nombre)/` son REQUERIDOS para organizar páginas con layouts compartidos. Las páginas fuera de grupos pueden ser ignoradas en el build.

### 2. Verificación de Build
Siempre verificar que las páginas están en `.next/server/app/` después del build:

```bash
find .next/server/app -name 'page.js' | wc -l
# Debe coincidir con número de pages en app/
```

### 3. HTTP 200 != Página Funciona
Next.js retorna HTTP 200 con contenido 404 para rutas que no existen en el build. No confiar solo en el status code.

### 4. Testing con Autenticación
Para testear rutas protegidas, siempre hacer login primero y usar cookies de sesión:

```bash
curl -c cookies.txt http://localhost:3000/login
curl -b cookies.txt http://localhost:3000/admin
```

---

## 🔗 ARCHIVOS RELEVANTES

- `app/(dashboard)/` - Grupo de rutas que funciona
- `app/admin/` - Páginas que no se compilan
- `.next/server/app/` - Build compilado
- `scripts/test-all-superadmin-routes.py` - Script de testing exhaustivo
- `scripts/check-production-sync.py` - Verificación de sincronización

---

**Próximo paso:** Decidir estrategia (mover páginas vs. verificar layout) y ejecutar fix.
