import { test, expect } from '@playwright/test';

/**
 * Tests: El tour demo Grupo Vidaro SOLO aparece en rutas de la app (dashboard, etc.)
 * NUNCA en login, landing, register, u otras rutas públicas.
 *
 * Estrategia: allowlist (ALLOWED_ROUTES) en vez de blacklist.
 * Si la ruta no está en la allowlist, el componente retorna null.
 */

test.describe('Demo Tour — Solo en rutas de la app', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('NO muestra el tour en /login', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'inmova-demo-tour',
        JSON.stringify({ active: true, stepIndex: 0, completed: false })
      );
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const tourOverlay = page.locator('text="Grupo Vidaro · INMOVA"');
    await expect(tourOverlay).toHaveCount(0);

    const presentButton = page.getByText('Presentar Demo');
    await expect(presentButton).toHaveCount(0);

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  test('NO muestra el tour en /landing', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tourOverlay = page.locator('text="Grupo Vidaro · INMOVA"');
    await expect(tourOverlay).toHaveCount(0);
  });

  test('formulario de login funciona sin obstrucciones', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    await emailInput.fill('demo@vidaroinversiones.com');
    await expect(emailInput).toHaveValue('demo@vidaroinversiones.com');

    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.fill('VidaroDemo2026!');
    await expect(passwordInput).toHaveValue('VidaroDemo2026!');

    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });
});
