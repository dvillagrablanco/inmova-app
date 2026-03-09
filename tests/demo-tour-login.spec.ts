import { test, expect } from '@playwright/test';

/**
 * Test: El tour demo NO debe aparecer en la página de login.
 * Bug reportado: el tour se mostraba antes de loguearse.
 */

test.describe('Demo Tour — No aparece antes del login', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('la página de login NO muestra el tour overlay ni el panel lateral', async ({ page }) => {
    // Simular sessionStorage con tour activo (como si quedara de sesión anterior)
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'inmova-demo-tour',
        JSON.stringify({ active: true, stepIndex: 0, completed: false })
      );
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Esperar el delay de auto-start (1500ms) + margen
    await page.waitForTimeout(3000);

    // NO debe haber overlay cinematic (z-[9999])
    const cinematicOverlay = page.locator('[class*="z-[9999]"]');
    await expect(cinematicOverlay).toHaveCount(0);

    // NO debe haber panel lateral del tour (z-[9998])
    const sidePanel = page.locator('[class*="z-[9998]"]');
    await expect(sidePanel).toHaveCount(0);

    // NO debe haber botón "Presentar Demo"
    const presentButton = page.getByText('Presentar Demo');
    await expect(presentButton).toHaveCount(0);

    // NO debe haber texto del tour
    const tourTitle = page.getByText('Grupo Vidaro · INMOVA');
    await expect(tourTitle).toHaveCount(0);

    // La página de login SÍ debe estar visible
    const loginForm = page.locator('input[name="email"], input[type="email"]');
    await expect(loginForm.first()).toBeVisible({ timeout: 5000 });
  });

  test('la página de login muestra el formulario sin obstrucciones', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Formulario de login visible
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Campo de password visible
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Botón de submit visible
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();

    // NO debe haber backdrop/overlay bloqueando la interacción
    const backdrop = page.locator('.backdrop-blur-sm, .backdrop-blur-[2px]');
    await expect(backdrop).toHaveCount(0);
  });
});
