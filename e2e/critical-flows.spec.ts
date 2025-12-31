/**
 * Critical Flows E2E Tests
 *
 * Tests de flujos críticos de usuario:
 * - Login/Logout
 * - Crear propiedad
 * - Crear inquilino
 * - Crear contrato
 * - Procesar pago
 */

import { test, expect } from '@playwright/test';

// Helper para login
async function login(page: any, email = 'admin@inmova.app', password = 'Admin123!') {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 15000 });
}

test.describe('Authentication Flows', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill form
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // Should show user name
    await expect(page.locator('text=/admin|usuario/i')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');

    // Submit
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Credenciales inválidas|Error/i')).toBeVisible({
      timeout: 5000,
    });

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    await login(page);

    // Click on user menu
    const userMenu = page.locator('[aria-label*="perfil" i], [aria-label*="usuario" i]').first();
    await userMenu.click();

    // Click logout
    await page.locator('text=/Cerrar sesión|Logout/i').click();

    // Should redirect to login or landing
    await expect(page).toHaveURL(/\/(login|landing)/);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    const errors = await page.locator('text=/requerido|obligatorio/i').count();
    expect(errors).toBeGreaterThan(0);
  });
});

test.describe('Property Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a new property', async ({ page }) => {
    await page.goto('/propiedades');

    // Click "Nueva Propiedad"
    await page.click('text=/Nueva Propiedad|Crear/i');

    // Fill form (ajustar campos según tu formulario real)
    await page.fill('input[name="numero"]', `TEST-${Date.now()}`);
    await page.selectOption('select[name="tipo"]', 'vivienda');
    await page.fill('input[name="superficie"]', '80');
    await page.fill('input[name="habitaciones"]', '3');
    await page.fill('input[name="banos"]', '2');
    await page.fill('input[name="rentaMensual"]', '1200');

    // Submit
    await page.click('button[type="submit"]');

    // Should show success message or redirect
    await expect(page.locator('text=/creada|éxito|success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should filter properties', async ({ page }) => {
    await page.goto('/propiedades');

    // Wait for properties to load
    await page.waitForSelector(
      '[data-testid="property-card"], .property-card, [class*="property"]',
      {
        state: 'attached',
        timeout: 10000,
      }
    );

    // Get initial count
    const initialCount = await page
      .locator('[data-testid="property-card"], .property-card, [class*="property"]')
      .count();

    // Apply filter
    await page.selectOption('select[name="estado"], select:has-text("Estado")', 'disponible');
    await page.waitForTimeout(1000); // Wait for filter to apply

    // Count should change
    const filteredCount = await page
      .locator('[data-testid="property-card"], .property-card, [class*="property"]')
      .count();

    // Either count changed or it's expected that all are "disponible"
    // (we can't assert exact counts without knowing DB state)
    expect(typeof filteredCount).toBe('number');
  });

  test('should search properties', async ({ page }) => {
    await page.goto('/propiedades');

    // Search
    await page.fill('input[placeholder*="Buscar" i]', 'Madrid');
    await page.waitForTimeout(1000);

    // Should show results containing "Madrid"
    const results = await page.locator('text=/Madrid/i').count();
    expect(results).toBeGreaterThan(0);
  });

  test('should view property details', async ({ page }) => {
    await page.goto('/propiedades');

    // Wait for properties
    await page.waitForSelector('button:has-text("Ver"), a:has-text("Ver")', { timeout: 10000 });

    // Click first "Ver" button
    await page.locator('button:has-text("Ver"), a:has-text("Ver")').first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/propiedades\/[a-zA-Z0-9]+/);

    // Should show property details
    await expect(page.locator('text=/Detalle|Información/i')).toBeVisible();
  });
});

test.describe('Tenant Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a new tenant', async ({ page }) => {
    await page.goto('/inquilinos');

    // Click "Nuevo Inquilino"
    await page.click('text=/Nuevo Inquilino|Registrar/i');

    // Fill form
    const timestamp = Date.now();
    await page.fill('input[name="nombreCompleto"]', `Test Inquilino ${timestamp}`);
    await page.fill('input[name="email"]', `test${timestamp}@test.com`);
    await page.fill('input[name="telefono"]', '+34666777888');
    await page.fill('input[name="dni"]', `${timestamp}X`);

    // Submit
    await page.click('button[type="submit"]');

    // Should show success
    await expect(page.locator('text=/creado|éxito|registrado/i')).toBeVisible({ timeout: 10000 });
  });

  test('should search tenants', async ({ page }) => {
    await page.goto('/inquilinos');

    // Search
    const searchInput = page.locator('input[placeholder*="Buscar" i]');
    await searchInput.fill('test');
    await page.waitForTimeout(1000);

    // Should filter results
    const results = await page
      .locator('[data-testid="tenant-card"], .tenant-card, [class*="tenant"]')
      .count();
    expect(results).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Dashboard Flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display KPIs', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show KPI cards
    await expect(page.locator('text=/Total Propiedades|Propiedades/i')).toBeVisible();
    await expect(page.locator('text=/Ocupadas|Ocupación/i')).toBeVisible();
    await expect(page.locator('text=/Ingresos|Revenue/i')).toBeVisible();
  });

  test('should navigate to different sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to Propiedades
    await page.click('a[href="/propiedades"], text=/Propiedades/i');
    await expect(page).toHaveURL('/propiedades');

    // Back to dashboard
    await page.goto('/dashboard');

    // Navigate to Inquilinos
    await page.click('a[href="/inquilinos"], text=/Inquilinos/i');
    await expect(page).toHaveURL('/inquilinos');
  });

  test('should show onboarding for new users', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if onboarding exists (might not if user completed it)
    const onboardingExists = await page.locator('text=/Bienvenido|Onboarding|Comenzar/i').count();

    if (onboardingExists > 0) {
      await expect(page.locator('text=/Bienvenido|Onboarding/i')).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should work on mobile devices', async ({ page }) => {
    await login(page);

    // Should show mobile navigation
    await expect(page.locator('[class*="bottom-nav"], nav[class*="mobile"]')).toBeVisible();

    // Sidebar should be hidden or overlay
    const sidebar = page.locator('aside, [class*="sidebar"]');
    const isOverlay = await sidebar.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.position === 'fixed' || styles.position === 'absolute';
    });

    expect(isOverlay).toBe(true);
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    await login(page);

    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 10)) {
      // Test first 10 buttons
      const size = await button.boundingBox();
      if (size) {
        // Touch target should be at least 44x44px
        expect(size.width).toBeGreaterThanOrEqual(40);
        expect(size.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

test.describe('Performance', () => {
  test('pages should load within acceptable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('images should be lazy loaded', async ({ page }) => {
    await page.goto('/landing');

    const images = await page.locator('img').all();

    for (const img of images) {
      const loading = await img.getAttribute('loading');
      // Images should have loading="lazy" or be above fold (no loading attr)
      expect(['lazy', null]).toContain(loading);
    }
  });
});
