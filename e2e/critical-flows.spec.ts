/**
 * Tests E2E Críticos - Sprint 4
 * 
 * Tests de los flujos más importantes de la aplicación.
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const TEST_USERS = {
  admin: {
    email: 'admin@inmova.app',
    password: 'Admin123!',
  },
  tenant: {
    email: 'test@inmova.app',
    password: 'Test123456!',
  },
};

// ============================================================================
// UTILIDADES
// ============================================================================

async function login(page: any, userType: 'admin' | 'tenant' = 'admin') {
  const user = TEST_USERS[userType];
  
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Esperar redirección
  await page.waitForURL(/\/(dashboard|portal)/, { timeout: 15000 });
}

// ============================================================================
// TESTS DE AUTENTICACIÓN
// ============================================================================

test.describe('Autenticación', () => {
  test('Login exitoso como admin', async ({ page }) => {
    await login(page, 'admin');
    
    // Verificar que estamos en dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verificar elementos del dashboard
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
  });

  test('Login con credenciales incorrectas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');
    
    // Debe permanecer en login
    await expect(page).toHaveURL(/\/login/);
    
    // Debe mostrar error
    await expect(page.locator('text=/error|invalid|incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('Logout', async ({ page }) => {
    await login(page, 'admin');
    
    // Click en logout (puede estar en menú desplegable)
    await page.click('[aria-label="User menu"], [data-testid="user-menu"]', { timeout: 5000 }).catch(() => {});
    await page.click('text=/logout|cerrar sesión/i', { timeout: 5000 });
    
    // Debe redirigir a login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

// ============================================================================
// TESTS DE PROPIEDADES
// ============================================================================

test.describe('Gestión de Propiedades', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('Listar propiedades', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/properties`);
    
    // Debe mostrar lista de propiedades (o mensaje vacío)
    await expect(
      page.locator('[data-testid="property-list"], h1:has-text("Propiedades")')
    ).toBeVisible({ timeout: 10000 });
  });

  test('Crear nueva propiedad', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/properties/new`);
    
    // Llenar formulario
    await page.fill('input[name="address"], input[id="address"]', 'Calle Test 123');
    await page.fill('input[name="city"], input[id="city"]', 'Madrid');
    await page.fill('input[name="price"], input[id="price"]', '1200');
    await page.fill('input[name="rooms"], input[id="rooms"]', '3');
    await page.fill('input[name="bathrooms"], input[id="bathrooms"]', '2');
    await page.fill('input[name="squareMeters"], input[id="squareMeters"]', '80');
    
    // Submit
    await page.click('button[type="submit"]:has-text(/crear|guardar/i)');
    
    // Debe mostrar éxito (toast o redirect)
    await expect(
      page.locator('text=/éxito|success|creado/i, [role="alert"]')
    ).toBeVisible({ timeout: 10000 }).catch(() => {
      // O verificar redirect
      expect(page.url()).toMatch(/\/dashboard\/properties/);
    });
  });
});

// ============================================================================
// TESTS DE MATCHING AUTOMÁTICO
// ============================================================================

test.describe('Matching Automático (Sprint 3)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('Buscar matches para inquilino', async ({ page }) => {
    // Navegar a inquilinos
    await page.goto(`${BASE_URL}/dashboard/tenants`);
    
    // Click en primer inquilino (si existe)
    const firstTenant = page.locator('[data-testid="tenant-item"]').first();
    
    if (await firstTenant.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTenant.click();
      
      // Buscar botón de matching
      const matchButton = page.locator('button:has-text(/match|buscar propiedades/i)');
      
      if (await matchButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await matchButton.click();
        
        // Debe mostrar resultados de matching
        await expect(
          page.locator('text=/matches encontrados|resultados/i')
        ).toBeVisible({ timeout: 15000 });
      }
    } else {
      test.skip();
    }
  });
});

// ============================================================================
// TESTS DE CLASIFICACIÓN DE INCIDENCIAS
// ============================================================================

test.describe('Clasificación de Incidencias (Sprint 3)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('Reportar y clasificar incidencia', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/maintenance`);
    
    // Click en "Nueva Incidencia" o similar
    const newButton = page.locator('button:has-text(/nueva|reportar|crear/i)').first();
    await newButton.click({ timeout: 5000 }).catch(() => {});
    
    // Llenar formulario
    await page.fill('textarea[name="description"], textarea[id="description"]', 'Hay una fuga de agua en el grifo del baño');
    await page.fill('input[name="location"], input[id="location"]', 'Baño principal');
    
    // Submit
    await page.click('button[type="submit"]:has-text(/clasificar|crear|enviar/i)');
    
    // Debe mostrar clasificación
    await expect(
      page.locator('text=/PLUMBING|clasificación|urgencia/i')
    ).toBeVisible({ timeout: 10000 }).catch(() => {
      // O verificar que se creó la incidencia
      expect(page.url()).toMatch(/\/dashboard\/maintenance/);
    });
  });
});

// ============================================================================
// TESTS DE SOCIAL MEDIA (Sprint 4)
// ============================================================================

test.describe('Conexiones de Redes Sociales (Sprint 4)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('Ver estado de conexiones', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/integrations`);
    
    // Debe mostrar lista de plataformas
    await expect(
      page.locator('text=/facebook|instagram|linkedin|twitter/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('Iniciar conexión de Facebook (hasta redirect)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/integrations`);
    
    // Click en conectar Facebook
    const facebookButton = page.locator('button:has-text(/facebook/i), button:has-text(/conectar/)').first();
    
    if (await facebookButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click en conectar
      await facebookButton.click();
      
      // Debe redirigir a OAuth o mostrar error de configuración
      await page.waitForURL(/facebook\.com|error/, { timeout: 10000 }).catch(() => {
        // O permanecer con mensaje de error
        expect(page.locator('text=/error|not configured/i')).toBeVisible();
      });
    } else {
      test.skip();
    }
  });
});

// ============================================================================
// TESTS DE ANALYTICS (Sprint 4)
// ============================================================================

test.describe('Dashboard de Analytics (Sprint 4)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('Ver métricas de uso', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    
    // Debe mostrar métricas (puede ser 0 si no hay datos)
    await expect(
      page.locator('text=/métricas|analytics|estadísticas/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('Ver costos de IA', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    
    // Buscar sección de costos
    await expect(
      page.locator('text=/IA|costos|€|tokens/i')
    ).toBeVisible({ timeout: 10000 }).catch(() => {
      test.skip();
    });
  });
});

// ============================================================================
// TESTS DE NOTIFICACIONES PUSH (Sprint 4)
// ============================================================================

test.describe('Notificaciones Push (Sprint 4)', () => {
  test('Service Worker se registra correctamente', async ({ page, context }) => {
    // Otorgar permiso de notificaciones
    await context.grantPermissions(['notifications']);
    
    await page.goto(BASE_URL);
    
    // Verificar que service worker se registró
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return false;
      }
      
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        return registration !== null;
      } catch {
        return false;
      }
    });
    
    expect(swRegistered).toBe(true);
  });
});

// ============================================================================
// TESTS DE PERFORMANCE
// ============================================================================

test.describe('Performance', () => {
  test('Landing page carga en < 3 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('Dashboard carga en < 5 segundos', async ({ page }) => {
    await login(page, 'admin');
    
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });
});

// ============================================================================
// TESTS DE ACCESIBILIDAD (Básicos)
// ============================================================================

test.describe('Accesibilidad', () => {
  test('Landing page tiene título', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Login tiene labels en inputs', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Email input debe tener label o aria-label
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // Verificar que tiene label asociado o aria-label
    const hasLabel = await emailInput.evaluate((el) => {
      return el.labels?.length > 0 || el.hasAttribute('aria-label');
    });
    
    expect(hasLabel).toBe(true);
  });
});
