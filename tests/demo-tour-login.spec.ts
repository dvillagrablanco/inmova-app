import { test, expect } from '@playwright/test';

/**
 * Tests: El tour demo Grupo Vidaro funciona correctamente.
 *
 * Bug 1: El tour aparecía en /login (antes de loguearse)
 * Bug 2: El tour no aparecía después de loguearse
 *
 * Causas raíz:
 * - pathname null en primer render hacía isAuthRoute = false
 * - 4 instancias duplicadas de DemoShowcaseTour competían por sessionStorage
 * - initializedRef no se reseteaba al cambiar de usuario (login/logout)
 */

test.describe('Demo Tour — Visibilidad correcta', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('NO muestra el tour en /login aunque haya sessionStorage residual', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'inmova-demo-tour',
        JSON.stringify({ active: true, stepIndex: 0, completed: false })
      );
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // NO debe haber overlay cinematic ni panel lateral
    const tourElements = page.locator(
      '[class*="z-[9999]"], [class*="z-[9998]"], text="Grupo Vidaro · INMOVA", text="Presentar Demo"'
    );
    await expect(tourElements).toHaveCount(0);

    // Login form SÍ visible y usable
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  test('NO muestra el tour en /login con sesión válida del demo user', async ({ page }) => {
    // Simular sesión previa activa
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'inmova-demo-tour',
        JSON.stringify({ active: true, stepIndex: 3, completed: false })
      );
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que NO hay backdrop/overlay
    const backdrop = page.locator('.backdrop-blur-sm, .bg-black\\/60');
    await expect(backdrop).toHaveCount(0);

    // Verificar que NO hay botones del tour
    const tourButtons = page.getByText('Siguiente');
    const presentButton = page.getByText('Presentar Demo');
    await expect(tourButtons).toHaveCount(0);
    await expect(presentButton).toHaveCount(0);
  });

  test('formulario de login funciona sin obstrucciones del tour', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Debe poder escribir sin problemas
    await emailInput.fill('demo@vidaroinversiones.com');
    await expect(emailInput).toHaveValue('demo@vidaroinversiones.com');

    await passwordInput.fill('VidaroDemo2026!');
    await expect(passwordInput).toHaveValue('VidaroDemo2026!');

    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });
});
