/**
 * E2E Tests: Critical Business Flows
 * 
 * Tests the most important user journeys in the app.
 * Run: npx playwright test e2e/critical-flows.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

test.describe('Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
    }
  });

  test('1. Dashboard loads with KPIs', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');

    // Should have content (not just loading skeletons)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body?.length).toBeGreaterThan(100);
  });

  test('2. Properties page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/propiedades`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/propiedades');
  });

  test('3. Payments page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pagos`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/pagos');
  });

  test('4. Tenants page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/inquilinos`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/inquilinos');
  });

  test('5. Contracts page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/contratos`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/contratos');
  });

  test('6. Investment opportunities page loads with data', async ({ page }) => {
    await page.goto(`${BASE_URL}/inversiones/oportunidades`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/inversiones/oportunidades');

    // Wait for data to load
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    // Should have market opportunities loaded
    expect(body).toContain('Mercado');
  });

  test('7. Family office dashboard loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/family-office/dashboard`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/family-office');
  });

  test('8. Insurance page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/seguros`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/seguros');
  });

  test('9. Patrimony map loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/inversiones/mapa`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/inversiones/mapa');
  });

  test('10. Health API returns 200', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/health`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.status).toBe('ok');
  });

  test('11. Monitoring dashboard (admin)', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/monitoring`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/monitoring');
  });
});
