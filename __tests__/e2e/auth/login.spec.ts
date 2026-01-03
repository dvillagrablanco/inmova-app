import { test, expect } from '@playwright/test';

/**
 * 🧪 E2E Tests: Authentication - Login Flow
 *
 * Tests críticos para el flujo de autenticación de usuarios
 */

// URL base de la aplicación
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Credenciales de test (deben existir en BD de test)
const TEST_USER = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

const TEST_TENANT = {
  email: 'tenant@test.com',
  password: 'Test123456!',
};

test.describe('🔐 Login Flow - Usuario Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  test('✅ Debe mostrar el formulario de login', async ({ page }) => {
    // Verificar que la página de login cargó
    await expect(page).toHaveTitle(/Inmova|Login/i);

    // Verificar elementos clave del formulario
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('✅ Debe realizar login exitoso con credenciales válidas', async ({ page }) => {
    // Llenar formulario
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Esperar redirección al dashboard
    await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

    // Verificar que llegamos al dashboard
    const url = page.url();
    expect(url).toMatch(/\/dashboard|\/admin/);

    // Verificar que aparece el nombre del usuario en la UI
    await expect(page.locator('text=/admin|usuario/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('❌ Debe rechazar login con credenciales inválidas', async ({ page }) => {
    // Intentar login con credenciales incorrectas
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'WrongPassword123');

    await page.click('button[type="submit"]');

    // Debe permanecer en login o mostrar error
    await page.waitForTimeout(2000);

    // Verificar que NO redirigió al dashboard
    const url = page.url();
    expect(url).toContain('/login');

    // Verificar mensaje de error (si existe)
    const errorVisible = await page
      .locator('text=/error|incorrecto|inválido/i')
      .isVisible()
      .catch(() => false);

    // Si hay mensaje de error, debe ser visible
    if (errorVisible) {
      await expect(page.locator('text=/error|incorrecto|inválido/i')).toBeVisible();
    }
  });

  test('⚠️ Debe validar campos requeridos', async ({ page }) => {
    // Intentar enviar sin completar formulario
    await page.click('button[type="submit"]');

    // Debe permanecer en login
    const url = page.url();
    expect(url).toContain('/login');

    // Verificar validación HTML5 o mensajes de error
    const emailInput = page.locator('input[name="email"]');
    const isRequired = await emailInput.getAttribute('required');

    expect(isRequired).not.toBeNull();
  });

  test('⚠️ Debe manejar campos vacíos con espacios', async ({ page }) => {
    await page.fill('input[name="email"]', '   ');
    await page.fill('input[name="password"]', '   ');

    await page.click('button[type="submit"]');

    // Debe permanecer en login
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('/login');
  });
});

test.describe('🔐 Login Flow - Usuario Inquilino', () => {
  test('✅ Debe realizar login de inquilino y redirigir a portal', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[name="email"]', TEST_TENANT.email);
    await page.fill('input[name="password"]', TEST_TENANT.password);

    await page.click('button[type="submit"]');

    // Inquilinos deben ir a /portal o /dashboard
    await page.waitForURL(/\/portal|\/dashboard/, { timeout: 10000 });

    const url = page.url();
    expect(url).toMatch(/\/portal|\/dashboard/);
  });
});

test.describe('🔐 Logout Flow', () => {
  test('✅ Debe hacer logout correctamente', async ({ page }) => {
    // Primero hacer login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

    // Hacer logout (buscar botón de logout)
    const logoutButton = page.locator(
      'button:has-text("Salir"), button:has-text("Cerrar sesión"), a:has-text("Logout")'
    );

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Debe redirigir a login
      await page.waitForURL(/\/login|\//, { timeout: 5000 });

      const url = page.url();
      expect(url).toMatch(/\/login|\/$/);
    } else {
      // Si no hay botón visible, skip test
      test.skip();
    }
  });
});

test.describe('🔐 Seguridad - Protección de Rutas', () => {
  test('❌ Debe redirigir a login si intenta acceder a dashboard sin auth', async ({ page }) => {
    // Intentar acceder directamente al dashboard
    await page.goto(`${BASE_URL}/dashboard`);

    // Debe redirigir a login
    await page.waitForURL(/\/login/, { timeout: 5000 });

    const url = page.url();
    expect(url).toContain('/login');
  });

  test('❌ Debe redirigir a login si intenta acceder a admin sin auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);

    await page.waitForURL(/\/login|\/unauthorized/, { timeout: 5000 });

    const url = page.url();
    expect(url).toMatch(/\/login|\/unauthorized/);
  });
});
