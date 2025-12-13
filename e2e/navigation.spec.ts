import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@inmova.com');
    await page.fill('input[type="password"]', 'admin123');
    const loginButton = page.locator('button').filter({ hasText: /iniciar sesión|entrar/i });
    await loginButton.click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
  });

  test('should navigate to buildings page', async ({ page }) => {
    // Find and click the buildings/edificios link
    const buildingsLink = page.locator('a').filter({ hasText: /edificios|buildings/i }).first();
    await buildingsLink.click();
    
    await page.waitForURL(/\/edificios/, { timeout: 5000 });
    expect(page.url()).toContain('/edificios');
  });

  test('should navigate to tenants page', async ({ page }) => {
    // Find and click the tenants/inquilinos link
    const tenantsLink = page.locator('a').filter({ hasText: /inquilinos|tenants/i }).first();
    await tenantsLink.click();
    
    await page.waitForURL(/\/inquilinos/, { timeout: 5000 });
    expect(page.url()).toContain('/inquilinos');
  });

  test('sidebar should be visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Sidebar should be visible
    const sidebar = page.locator('aside, nav').filter({ has: page.locator('a').filter({ hasText: /edificios/i }) }).first();
    await expect(sidebar).toBeVisible();
  });
});
