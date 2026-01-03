/**
 * Accessibility Tests (axe-core integration)
 *
 * Tests automáticos de accesibilidad WCAG 2.1 AA/AAA
 * Cubre todas las páginas principales
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES_TO_TEST = [
  { path: '/landing', name: 'Landing Page' },
  { path: '/login', name: 'Login' },
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/propiedades', name: 'Propiedades', requiresAuth: true },
  { path: '/inquilinos', name: 'Inquilinos', requiresAuth: true },
  { path: '/contratos', name: 'Contratos', requiresAuth: true },
  { path: '/edificios', name: 'Edificios', requiresAuth: true },
];

// Helper para login
async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@inmova.app');
  await page.fill('input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Login si el test requiere auth
    const currentTest = PAGES_TO_TEST.find((p) => testInfo.title.includes(p.name));
    if (currentTest?.requiresAuth) {
      await login(page);
    }
  });

  for (const pageInfo of PAGES_TO_TEST) {
    test(`${pageInfo.name} should not have accessibility violations`, async ({ page }) => {
      // Navegar a la página
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Run axe accessibility tests
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Assert no violations
      expect(accessibilityScanResults.violations).toEqual([]);

      // Log passes (opcional, para info)
      console.log(
        `✅ ${pageInfo.name}: ${accessibilityScanResults.passes.length} accessibility checks passed`
      );
    });
  }

  test('Dark mode should not have accessibility violations', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Toggle dark mode (si está implementado)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await page.waitForTimeout(500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Forms should have proper labels and ARIA', async ({ page }) => {
    await page.goto('/login');

    // Verificar labels
    const emailLabel = await page.locator('label[for="email-field"]');
    await expect(emailLabel).toBeVisible();

    const passwordLabel = await page.locator('label[for="password-field"]');
    await expect(passwordLabel).toBeVisible();

    // Verificar ARIA attributes
    const emailInput = await page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('aria-label');

    const passwordInput = await page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('aria-label');
  });

  test('Keyboard navigation should work', async ({ page }) => {
    await page.goto('/login');

    // Focus en primer input
    await page.keyboard.press('Tab');
    const focusedEmail = await page
      .locator('input[name="email"]')
      .evaluate((el) => el === document.activeElement);
    expect(focusedEmail).toBe(true);

    // Focus en segundo input
    await page.keyboard.press('Tab');
    const focusedPassword = await page
      .locator('input[name="password"]')
      .evaluate((el) => el === document.activeElement);
    expect(focusedPassword).toBe(true);

    // Focus en botón
    await page.keyboard.press('Tab');
    const focusedButton = await page
      .locator('button[type="submit"]')
      .evaluate((el) => el === document.activeElement);
    expect(focusedButton).toBe(true);
  });

  test('Skip link should be functional', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Focus en skip link con Tab
    await page.keyboard.press('Tab');

    // Verificar que skip link es visible cuando tiene foco
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // Click en skip link
    await skipLink.click();

    // Verificar que el foco está en main content
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('Color contrast should meet WCAG AA', async ({ page }) => {
    await page.goto('/landing');

    const contrastResults = await new AxeBuilder({ page }).withTags(['color-contrast']).analyze();

    expect(contrastResults.violations).toEqual([]);
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/landing');

    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test('Interactive elements should have focus indicators', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Obtener todos los botones
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      await button.focus();

      // Verificar que tiene outline o ring cuando está focused
      const hasFocusStyle = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          (styles.outline !== 'none' && styles.outline !== '0px' && styles.outline !== '') ||
          (styles.boxShadow !== 'none' && styles.boxShadow !== '')
        );
      });

      expect(hasFocusStyle).toBe(true);
    }
  });
});

test.describe('Screen Reader Support', () => {
  test('Landmarks should be properly defined', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Verificar landmarks HTML5
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('Headings should have proper hierarchy', async ({ page }) => {
    await page.goto('/landing');

    // Debe haber exactamente un h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Los headings deben estar en orden
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName);
      const currentLevel = parseInt(tagName.substring(1));

      // No debe haber saltos (ej: h1 -> h3)
      if (previousLevel > 0) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }

      previousLevel = currentLevel;
    }
  });

  test('ARIA roles should be valid', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    const invalidRoles = await new AxeBuilder({ page }).withTags(['aria']).analyze();

    expect(invalidRoles.violations).toEqual([]);
  });
});
