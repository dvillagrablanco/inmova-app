/**
 * Smoke + verificación visual (no destructiva) contra producción.
 *
 * Ejecutar:
 *   PLAYWRIGHT_BASE_URL="https://inmova.app" \
 *   E2E_SUPERADMIN_EMAIL="..." \
 *   E2E_SUPERADMIN_PASSWORD="..." \
 *   yarn test:e2e e2e/production-smoke-visual.spec.ts
 *
 * Opcional si hay MFA/2FA:
 *   E2E_SUPERADMIN_OTP="123456"
 */

import { test, expect, type Page, type TestInfo } from '@playwright/test';

const SUPERADMIN_EMAIL = process.env.E2E_SUPERADMIN_EMAIL ?? '';
const SUPERADMIN_PASSWORD = process.env.E2E_SUPERADMIN_PASSWORD ?? '';
const SUPERADMIN_OTP = process.env.E2E_SUPERADMIN_OTP ?? '';

function requireEnv(name: string, value: string) {
  if (!value) {
    throw new Error(
      `Falta variable de entorno ${name}. ` +
        `Ejemplo: ${name}="..." PLAYWRIGHT_BASE_URL="https://inmova.app" yarn test:e2e e2e/production-smoke-visual.spec.ts`,
    );
  }
}

async function safeScreenshot(page: Page, testInfo: TestInfo, filename: string) {
  await page.screenshot({
    path: testInfo.outputPath(filename),
    fullPage: true,
  });
}

async function loginAsSuperadmin(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Soportar variantes de rutas (algunos entornos usan /auth/login)
  if (page.url().includes('/auth/login')) {
    // ok
  }

  const email = page
    .locator('input[name="email"], input[type="email"]')
    .or(page.getByLabel(/email|correo/i));
  const password = page
    .locator('input[name="password"], input[type="password"]')
    .or(page.getByLabel(/password|contraseña/i));

  await expect(email.first()).toBeVisible({ timeout: 15000 });
  await email.first().fill(SUPERADMIN_EMAIL);
  await password.first().fill(SUPERADMIN_PASSWORD);

  const submit = page
    .getByRole('button', { name: /iniciar sesión|entrar|login|acceder/i })
    .or(page.locator('button[type="submit"]'));
  await submit.first().click();

  // MFA/2FA opcional (si aparece un input de código)
  const otpInput = page.locator('input[name="otp"], input[name="code"], input[inputmode="numeric"]');
  if (await otpInput.first().isVisible().catch(() => false)) {
    if (!SUPERADMIN_OTP) {
      throw new Error(
        'Parece que hay MFA/2FA activo y falta E2E_SUPERADMIN_OTP. ' +
          'Proporciona el código (o desactiva MFA en el usuario de pruebas) para poder automatizar el login.',
      );
    }
    await otpInput.first().fill(SUPERADMIN_OTP);
    const verify = page
      .getByRole('button', { name: /verificar|confirmar|continuar|verify|continue/i })
      .or(page.locator('button[type="submit"]'));
    await verify.first().click();
  }

  await page.waitForURL(/\/(dashboard|home)/, { timeout: 30000 });
}

async function collectSidebarLinks(page: Page) {
  const links = await page
    .locator('aside a[href^="/"], nav a[href^="/"], [role="navigation"] a[href^="/"]')
    .evaluateAll((as: HTMLAnchorElement[]) =>
      as
        .map((a) => ({
          href: a.getAttribute('href') ?? '',
          text: (a.textContent ?? '').trim(),
        }))
        .filter((x) => x.href.startsWith('/')),
    );

  const blacklist = new Set([
    '/login',
    '/auth/login',
    '/logout',
    '/auth/logout',
    '/api',
    '/api/auth',
  ]);

  const unique = new Map<string, { href: string; text: string }>();
  for (const l of links) {
    const href = l.href.split('#')[0];
    if (!href || href === '/' || href.startsWith('/api')) continue;
    if (blacklist.has(href)) continue;
    if (!unique.has(href)) unique.set(href, { href, text: l.text || href });
  }

  return [...unique.values()];
}

async function clickNonDestructivePrimaryActions(page: Page, testInfo: TestInfo, slug: string) {
  // Solo intenta abrir 1-2 acciones por página y nunca "guardar/crear".
  const actionButtons = page
    .getByRole('button')
    .filter({ hasText: /nuevo|crear|añadir|agregar|registrar|ver|detalle|editar/i })
    .filter({ hasNotText: /guardar|confirmar|eliminar|borrar|pagar|cobrar/i });

  const maxClicks = 2;
  const count = await actionButtons.count();
  for (let i = 0; i < Math.min(count, maxClicks); i++) {
    const beforeUrl = page.url();

    const btn = actionButtons.nth(i);
    if (!(await btn.isVisible().catch(() => false))) continue;

    await btn.click().catch(() => {});
    await page.waitForTimeout(800);

    // Screenshot del estado tras el click (modal o navegación)
    await safeScreenshot(page, testInfo, `${slug}__action-${i + 1}.png`);

    // Cerrar modal si existe
    const dialog = page.locator('[role="dialog"]').first();
    if (await dialog.isVisible().catch(() => false)) {
      const close = page
        .getByRole('button', { name: /cerrar|close|cancelar|volver/i })
        .or(page.locator('[aria-label="Close"], [data-testid="close"]'));
      if (await close.first().isVisible().catch(() => false)) {
        await close.first().click().catch(() => {});
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
      await page.waitForTimeout(400);
    } else if (page.url() !== beforeUrl) {
      // Volver si navegó
      await page.goBack().catch(() => {});
      await page.waitForTimeout(400);
    }
  }
}

test.describe('Producción: smoke + visual (superadmin)', () => {
  test('recorre páginas del menú y valida que cargan', async ({ page }, testInfo) => {
    requireEnv('E2E_SUPERADMIN_EMAIL', SUPERADMIN_EMAIL);
    requireEnv('E2E_SUPERADMIN_PASSWORD', SUPERADMIN_PASSWORD);

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const badResponses: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', async (res) => {
      try {
        const req = res.request();
        if (req.resourceType() !== 'document') return;
        const status = res.status();
        if (status >= 500 || status === 404) {
          badResponses.push(`${status} ${res.url()}`);
        }
      } catch {
        // ignore
      }
    });

    await loginAsSuperadmin(page);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await safeScreenshot(page, testInfo, '00__post-login.png');

    // Recolectar enlaces del menú (mejor cobertura que hardcodear rutas)
    const links = await collectSidebarLinks(page);
    expect(links.length).toBeGreaterThan(0);

    for (const { href, text } of links) {
      const slug = href.replace(/^\//, '').replace(/[^\w\-]+/g, '_') || 'home';

      await test.step(`Visitar ${text} (${href})`, async () => {
        await page.goto(href, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

        // Señales típicas de página rota
        await expect(page.locator('body')).not.toContainText(/404|not found|page not found|500|internal server error/i);

        // Debe haber contenido principal visible
        const main = page.locator('main, [role="main"]').first();
        await expect(main).toBeVisible({ timeout: 15000 });

        await safeScreenshot(page, testInfo, `${slug}__page.png`);
        await clickNonDestructivePrimaryActions(page, testInfo, slug);
      });
    }

    // Resumen/assercciones finales
    if (badResponses.length) {
      throw new Error(`Respuestas problemáticas (document):\n- ${badResponses.join('\n- ')}`);
    }
    if (pageErrors.length) {
      throw new Error(`Errores JS (pageerror):\n- ${pageErrors.join('\n- ')}`);
    }
    if (consoleErrors.length) {
      // No siempre conviene fallar por console.error en prod; lo dejamos como fallo para detectar regresiones serias.
      throw new Error(`console.error detectados:\n- ${consoleErrors.slice(0, 20).join('\n- ')}`);
    }
  });
});

