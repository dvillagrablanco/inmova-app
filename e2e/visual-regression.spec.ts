/**
 * Visual Regression Tests
 *
 * Tests de regresión visual para detectar cambios no deseados en la UI
 * Usa Playwright screenshots comparison
 */

import { test, expect } from '@playwright/test';

// Helper para login
async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@inmova.app');
  await page.fill('input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

test.describe('Visual Regression Tests', () => {
  test('landing page should match screenshot', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    // Hide dynamic content (dates, times, random data)
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="dynamic-content"]').forEach((el) => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    });

    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test('login page should match screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 50,
    });
  });

  test('dashboard should match screenshot', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Hide dynamic content
    await page.evaluate(() => {
      // Hide dates, times, numbers that change
      document.querySelectorAll('[data-testid="kpi-value"], time, [datetime]').forEach((el) => {
        (el as HTMLElement).textContent = '0';
      });
    });

    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('propiedades page should match screenshot', async ({ page }) => {
    await login(page);
    await page.goto('/propiedades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for animations

    await expect(page).toHaveScreenshot('propiedades-page.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('modal should match screenshot', async ({ page }) => {
    await login(page);
    await page.goto('/propiedades');

    // Open modal (ajustar según tu app)
    const createButton = page.locator('text=/Nueva Propiedad|Crear/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('property-modal.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('mobile view should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('tablet view should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('dark mode should match screenshot', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('dashboard-dark.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('empty state should match screenshot', async ({ page }) => {
    await login(page);

    // Go to a page that might have empty state
    await page.goto('/propiedades?filter=empty');
    await page.waitForLoadState('networkidle');

    const emptyState = page.locator('text=/No hay|No se encontraron/i');
    if (await emptyState.isVisible()) {
      await expect(page).toHaveScreenshot('empty-state.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('error state should match screenshot', async ({ page }) => {
    await page.goto('/login');

    // Trigger error
    await page.fill('input[name="email"]', 'invalid');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=/error|inválid/i', { timeout: 5000 });

    await expect(page).toHaveScreenshot('error-state.png', {
      maxDiffPixels: 50,
    });
  });

  test('loading state should match screenshot', async ({ page }) => {
    await login(page);

    // Navigate to page and capture loading state
    const navigationPromise = page.goto('/propiedades');

    // Capture immediately (might show skeleton/loading)
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('loading-state.png', {
      maxDiffPixels: 100,
    });

    await navigationPromise;
  });
});

test.describe('Component Visual Tests', () => {
  test('buttons should match screenshots', async ({ page }) => {
    await page.goto('/landing');

    const primaryButton = page
      .locator('button, a')
      .filter({ hasText: /Comenzar|Empezar/i })
      .first();
    if (await primaryButton.isVisible()) {
      await expect(primaryButton).toHaveScreenshot('button-primary.png');
    }
  });

  test('cards should match screenshots', async ({ page }) => {
    await login(page);
    await page.goto('/propiedades');
    await page.waitForLoadState('networkidle');

    const firstCard = page
      .locator('[data-testid="property-card"], .property-card, [class*="Card"]')
      .first();
    if (await firstCard.isVisible()) {
      await expect(firstCard).toHaveScreenshot('property-card.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('form inputs should match screenshots', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveScreenshot('input-default.png');

    await emailInput.focus();
    await expect(emailInput).toHaveScreenshot('input-focused.png');

    await emailInput.fill('test@test.com');
    await expect(emailInput).toHaveScreenshot('input-filled.png');
  });
});
