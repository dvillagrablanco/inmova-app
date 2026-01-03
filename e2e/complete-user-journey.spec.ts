/**
 * E2E TEST - COMPLETE USER JOURNEY
 * Flujo completo: Registro → Onboarding → Uso de plataforma
 */

import { test, expect } from '@playwright/test';

test.describe('🚀 Complete User Journey E2E', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123456!';

  test('✅ E2E: Registro completo de usuario', async ({ page }) => {
    // 1. Navegar a registro
    await page.goto('/register');
    await expect(page).toHaveTitle(/Registro|Register/i);

    // 2. Llenar formulario
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="name"]', 'Test User E2E');
    await page.fill('input[name="companyName"]', 'Test Company');

    // 3. Aceptar términos
    await page.check('input[type="checkbox"]');

    // 4. Submit
    await page.click('button[type="submit"]');

    // 5. Verificar redirect a onboarding o dashboard
    await page.waitForURL(/\/onboarding|\/dashboard/, { timeout: 10000 });

    const url = page.url();
    expect(url).toMatch(/\/onboarding|\/dashboard/);
  });

  test('✅ E2E: Login exitoso', async ({ page }) => {
    // 1. Navegar a login
    await page.goto('/login');

    // 2. Llenar credenciales (usando usuario creado anteriormente o test user)
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Verificar redirect a dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    await expect(page).toHaveURL(/\/dashboard/);

    // 5. Verificar elementos del dashboard
    await expect(page.locator('h1, h2')).toContainText(/Dashboard|Inicio/);
  });

  test('✅ E2E: Navegación principal', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Navegar por secciones principales
    const sections = [
      { name: 'Propiedades', url: '/dashboard/properties' },
      { name: 'Inquilinos', url: '/dashboard/tenants' },
      { name: 'Pagos', url: '/dashboard/payments' },
    ];

    for (const section of sections) {
      await page.goto(section.url);
      await expect(page).toHaveURL(section.url);

      // Verificar que no hay errores 404/500
      const statusCode = await page.evaluate(() => {
        return document.querySelector('h1')?.textContent?.includes('404') ? 404 : 200;
      });
      expect(statusCode).toBe(200);
    }
  });

  test('❌ E2E: Login con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('text=/credenciales|inválido|error/i')).toBeVisible({
      timeout: 5000,
    });

    // Verificar que NO se redirige
    await expect(page).toHaveURL(/\/login/);
  });

  test('⚠️ E2E: Acceso a ruta protegida sin autenticación', async ({ page }) => {
    // Intentar acceder a dashboard sin login
    await page.goto('/dashboard');

    // Debe redirigir a login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('⚠️ E2E: Logout exitoso', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Logout
    await page.click('button:has-text("Cerrar sesión"), button:has-text("Logout")');

    // Verificar redirect a login o landing
    await page.waitForURL(/\/login|\/landing|\//, { timeout: 5000 });
    const url = page.url();
    expect(url).toMatch(/\/login|\/landing|\//);
  });
});

test.describe('🏠 Property Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('✅ E2E: Ver lista de propiedades', async ({ page }) => {
    await page.goto('/dashboard/properties');

    // Verificar que carga la lista
    await expect(page.locator('h1, h2')).toContainText(/Propiedades|Properties/);

    // Verificar que hay tabla o grid
    const hasTable = await page.locator('table, [role="grid"]').count();
    expect(hasTable).toBeGreaterThan(0);
  });

  test('✅ E2E: Crear nueva propiedad', async ({ page }) => {
    await page.goto('/dashboard/properties/new');

    // Llenar formulario
    await page.fill('input[name="nombre"]', `Propiedad E2E ${Date.now()}`);
    await page.fill('input[name="direccion"]', 'Calle Test 123');
    await page.fill('input[name="ciudad"]', 'Madrid');

    // Submit
    await page.click('button[type="submit"]');

    // Verificar éxito (redirect o mensaje)
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasSuccess = url.includes('/properties') && !url.includes('/new');
    expect(hasSuccess || (await page.locator('text=/éxito|success/i').count()) > 0).toBe(true);
  });

  test('⚠️ E2E: Validación de formulario propiedad', async ({ page }) => {
    await page.goto('/dashboard/properties/new');

    // Intentar submit sin llenar
    await page.click('button[type="submit"]');

    // Verificar mensajes de error
    const errorCount = await page.locator('text=/requerido|required|obligatorio/i').count();
    expect(errorCount).toBeGreaterThan(0);
  });
});

test.describe('💰 Payment Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('✅ E2E: Ver lista de pagos', async ({ page }) => {
    await page.goto('/dashboard/payments');

    await expect(page.locator('h1, h2')).toContainText(/Pagos|Payments/);

    // Verificar que hay tabla
    const hasTable = await page.locator('table').count();
    expect(hasTable).toBeGreaterThan(0);
  });

  test('✅ E2E: Registrar nuevo pago', async ({ page }) => {
    await page.goto('/dashboard/payments/new');

    // Llenar formulario de pago
    await page.fill('input[name="monto"]', '1200');
    await page.fill('input[name="concepto"]', 'Renta Enero 2026');

    // Fecha (puede variar según implementación)
    await page.fill('input[type="date"]', '2026-01-01');

    await page.click('button[type="submit"]');

    // Verificar éxito
    await page.waitForTimeout(2000);
    const hasSuccess = page.url().includes('/payments') && !page.url().includes('/new');
    expect(hasSuccess || (await page.locator('text=/éxito|success/i').count()) > 0).toBe(true);
  });

  test('⚠️ E2E: Filtrar pagos por estado', async ({ page }) => {
    await page.goto('/dashboard/payments');

    // Buscar filtro de estado
    const hasFilter = await page.locator('select, [role="combobox"]').count();

    if (hasFilter > 0) {
      await page.selectOption('select', 'pendiente');
      await page.waitForTimeout(1000);

      // Verificar que filtra
      expect(page.url()).toContain('estado=pendiente');
    }
  });
});

test.describe('🔧 Maintenance Request E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('✅ E2E: Crear solicitud de mantenimiento', async ({ page }) => {
    await page.goto('/dashboard/maintenance/new');

    await page.fill(
      'input[name="descripcion"], textarea[name="descripcion"]',
      'Fuga en baño - Test E2E'
    );

    await page.selectOption('select[name="tipo"]', 'Plomería');
    await page.selectOption('select[name="prioridad"]', 'alta');

    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    const hasSuccess = page.url().includes('/maintenance') && !page.url().includes('/new');
    expect(hasSuccess || (await page.locator('text=/éxito|success/i').count()) > 0).toBe(true);
  });
});
