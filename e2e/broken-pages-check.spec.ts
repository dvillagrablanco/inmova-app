import { test, expect } from '@playwright/test';

const pagesToCheck = [
  { path: '/home', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/edificios', name: 'Edificios' },
  { path: '/inquilinos', name: 'Inquilinos' },
  { path: '/contratos', name: 'Contratos' },
  { path: '/pagos', name: 'Pagos' },
  { path: '/mantenimiento', name: 'Mantenimiento' },
  { path: '/documentos', name: 'Documentos' },
  { path: '/room-rental', name: 'Room Rental' },
  { path: '/anuncios', name: 'Anuncios' },
  { path: '/crm', name: 'CRM' },
  { path: '/analytics', name: 'Analytics' },
];

test.describe('Verificación Visual de Páginas', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('admin@inmova.app');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('Admin2025!');

    const loginButton = page
      .locator('button')
      .filter({ hasText: /iniciar sesión|entrar|login/i })
      .first();
    await loginButton.click();

    // Esperar a que se complete el login
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
  });

  for (const pageInfo of pagesToCheck) {
    test(`${pageInfo.name} debe cargar sin errores`, async ({ page }) => {
      // Ir a la página
      await page.goto(pageInfo.path);

      // Esperar a que cargue
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Verificar que no haya errores obvios
      const errorMessages = await page
        .locator('[role="alert"], .error, [class*="error"]')
        .filter({ hasText: /error|failed|falló/i })
        .count();
      expect(errorMessages).toBe(0);

      // Verificar que haya contenido principal
      const mainContent = page.locator('main, [role="main"], .main-content').first();
      await expect(mainContent).toBeVisible({ timeout: 5000 });

      // Tomar screenshot
      await page.screenshot({
        path: `test-results/visual-check-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true,
      });

      console.log(`✅ ${pageInfo.name} cargó correctamente`);
    });
  }
});
