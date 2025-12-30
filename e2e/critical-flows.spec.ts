/**
 * Tests E2E para Flujos Críticos - Inmova App
 * Tests realistas basados en la estructura actual de la app
 */

import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper Functions
async function waitForNavigation(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
}

async function fillFormField(page: Page, selector: string, value: string) {
  await page.fill(selector, value);
  await page.waitForTimeout(100);
}

// ============================================================================
// FLUJO 1: LOGIN Y AUTENTICACIÓN
// ============================================================================

test.describe('Flujo Crítico: Login y Autenticación @critical @e2e', () => {
  test('Debe cargar la página de login correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await waitForNavigation(page);

    // Verificar que carga
    const hasLoginForm = await page.locator('input[name="email"], input[type="email"]').count() > 0;
    expect(hasLoginForm).toBeTruthy();

    await page.screenshot({ path: 'test-results/e2e-login-page.png' });
  });

  test('Debe permitir login exitoso con credenciales válidas', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto(`${BASE_URL}/login`);
    await waitForNavigation(page);

    // Llenar credenciales
    await fillFormField(page, 'input[name="email"]', 'superadmin@inmova.com');
    await fillFormField(page, 'input[name="password"]', 'superadmin123');

    await page.screenshot({ path: 'test-results/e2e-login-filled.png' });

    // Click en login
    await page.locator('button[type="submit"]').click();
    
    // Esperar redirección
    await page.waitForTimeout(5000);

    // Verificar que llegamos a dashboard o página autenticada
    const url = page.url();
    const isAuthenticated = url.includes('/dashboard') || 
                           url.includes('/admin') ||
                           !url.includes('/login');

    await page.screenshot({ path: 'test-results/e2e-login-success.png', fullPage: true });

    expect(isAuthenticated).toBeTruthy();
  });

  test('Debe rechazar login con credenciales inválidas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await fillFormField(page, 'input[name="email"]', 'invalid@test.com');
    await fillFormField(page, 'input[name="password"]', 'wrongpass');
    
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Debe mostrar error o permanecer en login
    const hasError = page.url().includes('/login');
    expect(hasError).toBeTruthy();

    await page.screenshot({ path: 'test-results/e2e-login-error.png' });
  });
});

// ============================================================================
// FLUJO 2: NAVEGACIÓN EN DASHBOARD
// ============================================================================

test.describe('Flujo Crítico: Navegación Dashboard @critical @e2e', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto(`${BASE_URL}/login`);
    await fillFormField(page, 'input[name="email"]', 'superadmin@inmova.com');
    await fillFormField(page, 'input[name="password"]', 'superadmin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
  });

  test('Debe cargar dashboard principal', async ({ page }) => {
    // Navegar a dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForNavigation(page);

    // Verificar que tiene contenido
    const hasContent = await page.locator('h1, h2, [role="main"]').count() > 0;
    expect(hasContent).toBeTruthy();

    await page.screenshot({ path: 'test-results/e2e-dashboard.png', fullPage: true });
  });

  test('Debe navegar a sección de edificios', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/edificios`);
    await page.waitForTimeout(3000);

    const hasBuildings = page.url().includes('edificios');
    expect(hasBuildings).toBeTruthy();

    await page.screenshot({ path: 'test-results/e2e-edificios.png', fullPage: true });
  });

  test('Debe navegar a sección de unidades', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/unidades`);
    await page.waitForTimeout(3000);

    const hasUnits = page.url().includes('unidades');
    expect(hasUnits).toBeTruthy();

    await page.screenshot({ path: 'test-results/e2e-unidades.png', fullPage: true });
  });

  test('Debe navegar a sección de inquilinos', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/inquilinos`);
    await page.waitForTimeout(3000);

    const hasTenants = page.url().includes('inquilinos');
    expect(hasTenants).toBeTruthy();

    await page.screenshot({ path: 'test-results/e2e-inquilinos.png', fullPage: true });
  });
});

// ============================================================================
// FLUJO 3: APIS CRÍTICAS
// ============================================================================

test.describe('Flujo Crítico: APIs @critical @e2e', () => {
  let authCookie: string;

  test.beforeEach(async ({ page }) => {
    // Login y obtener cookie
    await page.goto(`${BASE_URL}/login`);
    await fillFormField(page, 'input[name="email"]', 'superadmin@inmova.com');
    await fillFormField(page, 'input[name="password"]', 'superadmin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Obtener cookies
    const cookies = await page.context().cookies();
    authCookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  });

  test('API: Contador de notificaciones debe responder', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/notifications/unread-count`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('count');

    console.log('✅ API Notifications:', data);
  });

  test('API: Documentación OpenAPI debe estar disponible', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/docs`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('openapi');
    expect(data).toHaveProperty('info');
    expect(data.info.title).toContain('Inmova');

    console.log('✅ API Docs disponible:', data.info.version);
  });
});

// ============================================================================
// FLUJO 4: PERFORMANCE Y TIEMPOS DE RESPUESTA
// ============================================================================

test.describe('Flujo Crítico: Performance @critical @e2e', () => {
  test('Landing page debe cargar en menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/landing`);
    await waitForNavigation(page);
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Landing page load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(3000);
    
    await page.screenshot({ path: 'test-results/e2e-landing-performance.png' });
  });

  test('Login debe cargar en menos de 2 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/login`);
    await waitForNavigation(page);
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Login page load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('Dashboard debe cargar en menos de 3 segundos', async ({ page }) => {
    // Login primero
    await page.goto(`${BASE_URL}/login`);
    await fillFormField(page, 'input[name="email"]', 'superadmin@inmova.com');
    await fillFormField(page, 'input[name="password"]', 'superadmin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Medir dashboard
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForNavigation(page);
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Dashboard load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(3000);
  });
});

// ============================================================================
// FLUJO 5: RESPONSIVE Y MOBILE
// ============================================================================

test.describe('Flujo Crítico: Responsive Design @critical @e2e', () => {
  test('Landing debe ser responsive en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto(`${BASE_URL}/landing`);
    await waitForNavigation(page);

    await page.screenshot({ path: 'test-results/e2e-mobile-landing.png', fullPage: true });

    const hasContent = await page.locator('h1, main').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Login debe ser responsive en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/login`);
    await waitForNavigation(page);

    await page.screenshot({ path: 'test-results/e2e-mobile-login.png', fullPage: true });

    const hasForm = await page.locator('input[name="email"]').count() > 0;
    expect(hasForm).toBeTruthy();
  });

  test('Dashboard debe ser responsive en tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    // Login
    await page.goto(`${BASE_URL}/login`);
    await fillFormField(page, 'input[name="email"]', 'superadmin@inmova.com');
    await fillFormField(page, 'input[name="password"]', 'superadmin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForNavigation(page);

    await page.screenshot({ path: 'test-results/e2e-tablet-dashboard.png', fullPage: true });

    const hasContent = await page.locator('[role="main"], main, h1').count() > 0;
    expect(hasContent).toBeTruthy();
  });
});

// ============================================================================
// FLUJO 6: ACCESIBILIDAD BÁSICA
// ============================================================================

test.describe('Flujo Crítico: Accesibilidad @critical @e2e', () => {
  test('Landing debe tener estructura semántica correcta', async ({ page }) => {
    await page.goto(`${BASE_URL}/landing`);
    await waitForNavigation(page);

    // Verificar elementos semánticos
    const hasMain = await page.locator('main').count() > 0;
    const hasH1 = await page.locator('h1').count() > 0;
    
    expect(hasMain || hasH1).toBeTruthy();
  });

  test('Formularios deben tener labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await waitForNavigation(page);

    // Verificar que inputs tienen label o placeholder
    const emailInput = page.locator('input[name="email"]').first();
    const hasLabel = await emailInput.evaluate(el => {
      return el.getAttribute('placeholder') !== null ||
             el.getAttribute('aria-label') !== null ||
             document.querySelector(`label[for="${el.id}"]`) !== null;
    });

    expect(hasLabel).toBeTruthy();
  });
});
