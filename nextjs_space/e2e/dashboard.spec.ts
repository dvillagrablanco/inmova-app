import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@inmova.com');
    await page.fill('input[type="password"]', 'admin123');
    const loginButton = page.locator('button').filter({ hasText: /iniciar sesión|entrar/i });
    await loginButton.click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    
    // Navigate to dashboard if on home
    if (page.url().includes('/home')) {
      const dashboardLink = page.locator('a').filter({ hasText: /dashboard/i }).first();
      await dashboardLink.click();
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    }
  });

  test('should display dashboard KPIs', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Should have some KPI cards or statistics
    const kpiCards = page.locator('[class*="card"], div[class*="Card"]');
    const count = await kpiCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should load without errors', async ({ page }) => {
    // Check for any error messages
    const errorMessages = page.locator('[role="alert"], [class*="error"]').filter({ hasText: /error/i });
    const errorCount = await errorMessages.count();
    expect(errorCount).toBe(0);
  });
});
