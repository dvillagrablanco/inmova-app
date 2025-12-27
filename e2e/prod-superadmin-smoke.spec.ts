import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const routesToCheck: Array<{ path: string; name: string }> = [
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

function requiredEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

async function tryAcceptCookies(page: import('@playwright/test').Page) {
  // Best-effort: ignore if not present.
  const candidates = [/aceptar|accept/i, /aceptar todo|accept all/i, /entendido|ok/i];
  for (const re of candidates) {
    const btn = page.locator('button, [role="button"]').filter({ hasText: re }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 2000 }).catch(() => undefined);
      return;
    }
  }
}

test.describe('PROD Smoke - Superadmin (inmova.app)', () => {
  test('login + recorrido de páginas con screenshots', async ({ page }, testInfo) => {
    const email = requiredEnv('E2E_SUPERADMIN_EMAIL') ?? requiredEnv('PLAYWRIGHT_SUPERADMIN_EMAIL');
    const password =
      requiredEnv('E2E_SUPERADMIN_PASSWORD') ?? requiredEnv('PLAYWRIGHT_SUPERADMIN_PASSWORD');

    test.skip(!email || !password, 'Faltan credenciales en env (superadmin).');

    const evidenceDir = path.join(testInfo.project.outputDir, 'prod-superadmin-smoke-evidence');
    fs.mkdirSync(evidenceDir, { recursive: true });

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await tryAcceptCookies(page);

    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 15000 });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);

    const loginButton = page
      .locator('button, [role="button"]')
      .filter({ hasText: /iniciar sesión|entrar|login/i })
      .first();
    await expect(loginButton).toBeVisible({ timeout: 15000 });
    await loginButton.click();

    await page.waitForURL(/\/(dashboard|home)/, { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);

    await page.screenshot({
      path: path.join(evidenceDir, '00-after-login.png'),
      fullPage: true,
    });

    // Recorrido de páginas
    for (const route of routesToCheck) {
      await test.step(`Visita ${route.name} (${route.path})`, async () => {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);

        const obviousErrors = page
          .locator('[role="alert"], .error, [class*="error"], [data-testid*="error"]')
          .filter({ hasText: /error|failed|falló|exception|stack/i });
        await expect(obviousErrors).toHaveCount(0);

        const mainContent = page.locator('main, [role="main"]').first();
        await expect(mainContent).toBeVisible({ timeout: 15000 });

        const safeName = route.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        await page.screenshot({
          path: path.join(evidenceDir, `${safeName}.png`),
          fullPage: true,
        });
      });
    }

    // Si hay errores JS graves, fallar al final con contexto
    expect(
      { pageErrors, consoleErrors },
      'Errores capturados durante navegación (pageerror/console.error)'
    ).toEqual({ pageErrors: [], consoleErrors: [] });
  });
});
