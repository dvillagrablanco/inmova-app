import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/INMOVA/);
    await expect(page.locator('h1, h2').filter({ hasText: /iniciar sesión|login/i }).first()).toBeVisible();
  });

  test('should show validation error for empty credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Click login button without filling form
    const loginButton = page.locator('button').filter({ hasText: /iniciar sesión|entrar/i });
    await loginButton.click();
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@inmova.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Click login button
    const loginButton = page.locator('button').filter({ hasText: /iniciar sesión|entrar/i });
    await loginButton.click();
    
    // Wait for navigation
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    
    // Should be on dashboard or home page
    expect(page.url()).toMatch(/\/(dashboard|home)/);
  });
});
