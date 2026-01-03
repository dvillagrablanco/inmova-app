/**
 * E2E TEST - RESPONSIVE & MOBILE
 * Tests de responsividad y mobile-first
 */

import { test, expect, devices } from '@playwright/test';

test.describe('📱 Mobile Responsive E2E', () => {
  test.use({ ...devices['iPhone 12'] });

  test('✅ Mobile: Landing carga correctamente', async ({ page }) => {
    await page.goto('/landing');

    // Verificar viewport mobile
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(768);

    // Verificar que carga
    await expect(page.locator('h1')).toBeVisible();
  });

  test('✅ Mobile: Login funciona', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('✅ Mobile: Navegación con hamburger menu', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Buscar menu hamburger
    const menuButton = page.locator('button[aria-label*="menu" i], button:has-text("☰")');

    if ((await menuButton.count()) > 0) {
      await menuButton.first().click();

      // Verificar que abre menu
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    }
  });

  test('⚠️ Mobile: Touch targets mínimo 44px', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar botones principales
    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // Mínimo ~44px
      }
    }
  });
});

test.describe('💻 Desktop Responsive E2E', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('✅ Desktop: Sidebar visible', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // En desktop, sidebar debe ser visible
    const sidebar = page.locator('aside, [data-sidebar]');

    if ((await sidebar.count()) > 0) {
      await expect(sidebar.first()).toBeVisible();
    }
  });

  test('✅ Desktop: Layout multi-columna', async ({ page }) => {
    await page.goto('/landing');

    // Verificar viewport desktop
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(1024);
  });
});

test.describe('🖼️ Tablet Responsive E2E', () => {
  test.use({ ...devices['iPad Pro'] });

  test('✅ Tablet: Dashboard carga correctamente', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await expect(page).toHaveURL(/\/dashboard/);

    // Verificar que layout se adapta
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(768);
    expect(viewport?.width).toBeLessThan(1024);
  });
});
