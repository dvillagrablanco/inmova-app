# ⚡ INSTRUCCIONES: FIX RÁPIDO DE BLOQUEANTES

**Tiempo total**: ~1 día de trabajo  
**Resultado**: App lista para lanzamiento en BETA

---

## 🎯 OBJETIVO

Resolver los 3 problemas críticos más urgentes antes de lanzar en beta:
1. ✅ API routes sin dynamic export (30 min)
2. ✅ Tests E2E mínimos (4 horas)
3. ✅ Rate limiting en auth (1 hora)

---

## 📋 PASO 1: FIX DE API ROUTES (30 minutos)

### Ejecutar script automático

```bash
# 1. Ir a la raíz del proyecto
cd /workspace

# 2. Ejecutar script Python
python3 scripts/fix-dynamic-export.py

# Salida esperada:
# 🔧 Fix: Añadiendo 'export const dynamic' a API routes
# ======================================================================
# 📁 Encontrados 575 archivos route.ts
# 
# ✅ FIXED: app/api/properties/route.ts
# ✅ FIXED: app/api/tenants/route.ts
# ...
# 
# ======================================================================
# 📊 RESUMEN
# ======================================================================
# Total archivos: 575
# Archivos corregidos: 507
# Archivos sin cambios: 68
# Errores: 0
```

### Verificar corrección

```bash
# Debe retornar 575 (100%)
grep -r "export const dynamic" app/api --include="*.ts" | wc -l
```

### Commit de cambios

```bash
git add app/api
git commit -m "fix: añadir dynamic export a todas las API routes

- 507 rutas actualizadas con export const dynamic = 'force-dynamic'
- Soluciona problemas de caching indebido en Next.js 15
- Cumple con requisitos de .cursorrules"
```

---

## 📋 PASO 2: TESTS E2E CRÍTICOS (4 horas)

### 2.1 Test de Autenticación (1 hora)

Crear `e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('login exitoso con credenciales válidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Verificar redirección a dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verificar que aparece el nombre del usuario
    await expect(page.locator('text=Admin')).toBeVisible();
  });

  test('login fallido con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'falso@email.com');
    await page.fill('input[name="password"]', 'ContraseñaIncorrecta');
    await page.click('button[type="submit"]');
    
    // Verificar que sigue en login
    await expect(page).toHaveURL(/\/login/);
    
    // Verificar mensaje de error
    await expect(page.locator('text=/incorrectos?/i')).toBeVisible();
  });

  test('logout exitoso', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Logout
    await page.click('button[aria-label="Menú de usuario"]');
    await page.click('text=Cerrar sesión');
    
    // Verificar redirección a login
    await expect(page).toHaveURL(/\/login/);
  });
});
```

### 2.2 Test de Propiedades (1.5 horas)

Crear `e2e/properties.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Gestión de Propiedades', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('listar propiedades', async ({ page }) => {
    await page.goto('/propiedades');
    
    // Verificar que carga la página
    await expect(page.locator('h1')).toContainText('Propiedades');
    
    // Verificar que hay al menos un card
    await expect(page.locator('[data-testid="property-card"]').first()).toBeVisible();
  });

  test('crear nueva propiedad', async ({ page }) => {
    await page.goto('/propiedades/crear');
    
    // Llenar formulario
    await page.fill('input[name="numeroUnidad"]', 'TEST-' + Date.now());
    await page.selectOption('select[name="buildingId"]', { index: 1 });
    await page.fill('input[name="rentaMensual"]', '1200');
    await page.fill('input[name="superficieTotal"]', '80');
    await page.fill('input[name="habitaciones"]', '3');
    await page.fill('input[name="banos"]', '2');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verificar redirección o mensaje de éxito
    await expect(page.locator('text=/creada exitosamente/i')).toBeVisible();
  });

  test('ver detalles de propiedad', async ({ page }) => {
    // Ir a listado
    await page.goto('/propiedades');
    
    // Click en primera propiedad
    await page.locator('[data-testid="property-card"]').first().click();
    
    // Verificar que carga la página de detalles
    await expect(page.locator('h1')).toContainText(/Propiedad|Unidad/i);
    
    // Verificar que muestra información básica
    await expect(page.locator('text=/habitaciones/i')).toBeVisible();
    await expect(page.locator('text=/baños/i')).toBeVisible();
  });
});
```

### 2.3 Test de Contratos (1 hora)

Crear `e2e/contracts.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Gestión de Contratos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('crear contrato básico', async ({ page }) => {
    await page.goto('/contratos/crear');
    
    // Seleccionar inquilino
    await page.selectOption('select[name="tenantId"]', { index: 1 });
    
    // Seleccionar propiedad
    await page.selectOption('select[name="unitId"]', { index: 1 });
    
    // Fechas
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="fechaInicio"]', today);
    
    // Renta
    await page.fill('input[name="rentaMensual"]', '1000');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verificar éxito
    await expect(page.locator('text=/contrato creado/i')).toBeVisible();
  });
});
```

### 2.4 Test de Pagos (30 min)

Crear `e2e/payments.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Gestión de Pagos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('listar pagos pendientes', async ({ page }) => {
    await page.goto('/pagos');
    
    await expect(page.locator('h1')).toContainText('Pagos');
    
    // Verificar filtro por estado
    await page.selectOption('select[name="estado"]', 'PENDIENTE');
    
    // Debería mostrar solo pagos pendientes
    await expect(page.locator('[data-testid="payment-card"]').first()).toBeVisible();
  });
});
```

### Ejecutar tests

```bash
# Ejecutar todos los tests E2E
yarn test:e2e

# Ejecutar solo un test específico
yarn playwright test e2e/auth.spec.ts

# Ver reporte
yarn playwright show-report
```

---

## 📋 PASO 3: RATE LIMITING EN AUTH (1 hora)

### 3.1 Verificar que existe el servicio

```bash
# Debe existir este archivo
cat lib/rate-limiting.ts
```

### 3.2 Aplicar en rutas de auth

Editar cada archivo:

#### `app/api/auth/[...nextauth]/route.ts`

```typescript
import { rateLimit } from '@/lib/rate-limiting';

// Al inicio de cada handler
export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in 5 minutes.' },
      { status: 429 }
    );
  }
  
  // ... resto del código
}
```

#### `app/api/signup/route.ts`

```typescript
import { rateLimit } from '@/lib/rate-limiting';

export async function POST(req: NextRequest) {
  const rateLimitResult = await rateLimit(req);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }
  
  // ... resto del código
}
```

### 3.3 Commit

```bash
git add app/api/auth app/api/signup
git commit -m "feat: añadir rate limiting a rutas de autenticación

- Protección contra brute force attacks
- Límite: 10 intentos por 5 minutos
- Mensajes claros al usuario"
```

---

## 📋 PASO 4: VERIFICACIÓN FINAL (30 minutos)

### 4.1 Build

```bash
# DEBE completarse sin errores
yarn build
```

### 4.2 Tests

```bash
# Ejecutar todos los tests
yarn test:e2e

# Verificar que pasan los 4 tests críticos
```

### 4.3 Health Check en Producción

```bash
# Si ya está desplegado
curl https://inmovaapp.com/api/health

# Debe retornar: {"status":"ok"}
```

### 4.4 Test manual de flujos críticos

1. **Login**: https://inmovaapp.com/login
2. **Dashboard**: Verificar que carga sin errores
3. **Propiedades**: Crear y editar una propiedad de prueba
4. **Logout**: Verificar que funciona

---

## 🚀 PASO 5: DEPLOYMENT (si es necesario)

### Si usas servidor propio (SSH)

```bash
# Conectarse al servidor
ssh root@157.180.119.236

# Navegar al proyecto
cd /opt/inmova-app

# Pull de cambios
git pull origin main

# Rebuild
npm install
npm run build

# Restart PM2
pm2 reload inmova-app

# Verificar
pm2 logs inmova-app --lines 20
curl http://localhost:3000/api/health
```

### Si usas Vercel

```bash
# Desde tu máquina local
git push origin main

# Vercel desplegará automáticamente
# Ver en: https://vercel.com/tu-proyecto/deployments
```

---

## ✅ CHECKLIST FINAL

- [ ] ✅ Script de dynamic export ejecutado (507 archivos)
- [ ] ✅ 4 tests E2E creados y pasando
- [ ] ✅ Rate limiting en auth implementado
- [ ] ✅ `yarn build` sin errores
- [ ] ✅ Health check OK
- [ ] ✅ Test manual de login/logout
- [ ] ✅ Test manual de crear propiedad
- [ ] ✅ Cambios commiteados a Git
- [ ] ✅ Desplegado a producción (si aplica)

---

## 🎉 ¡LISTO PARA BETA!

Tu app ahora:
- ✅ Tiene APIs configuradas correctamente
- ✅ Tiene tests E2E críticos
- ✅ Está protegida contra brute force
- ✅ Puede lanzarse en beta con riesgo manejable

**Siguiente paso**: Añadir banner de "Beta" en la UI y comunicar a usuarios que es versión de prueba.

**Disclaimers recomendados**:
```tsx
// components/BetaBanner.tsx
<div className="bg-yellow-50 border-b border-yellow-200 p-3 text-center">
  <p className="text-sm text-yellow-800">
    🚧 Versión Beta - Reporta bugs a 
    <a href="mailto:support@inmova.app" className="underline ml-1">
      support@inmova.app
    </a>
  </p>
</div>
```

---

**Tiempo total invertido**: ~1 día de trabajo  
**Resultado**: App lista para feedback real de usuarios en beta
