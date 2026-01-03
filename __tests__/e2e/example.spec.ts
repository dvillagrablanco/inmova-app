import { test, expect } from '@playwright/test';

test.describe('Example E2E Test', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Inmova/);
  });
});
