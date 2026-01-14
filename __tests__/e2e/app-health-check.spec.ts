import { test, expect } from '@playwright/test';

test('app health check', async ({ page }) => {
  // Test login page
  await page.goto('https://inmovaapp.com/login');
  await expect(page).toHaveTitle(/Inmova/);
  
  // Test landing page
  await page.goto('https://inmovaapp.com/');
  await expect(page).toHaveTitle(/Inmova/);
});
