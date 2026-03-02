/**
 * E2E Test: Verificación 360° de módulos financieros en producción
 * 
 * Verifica que todas las páginas financieras desarrolladas cargan correctamente
 * y que los links de conectividad entre módulos funcionan.
 * 
 * Ejecutar: npx playwright test __tests__/e2e/financial-360-connectivity.spec.ts
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://inmovaapp.com';
const LOGIN_EMAIL = 'admin@inmova.app';
const LOGIN_PASSWORD = 'Admin123!';

// Helper: login
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  await page.fill('input[name="email"], input[type="email"]', LOGIN_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', LOGIN_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
}

test.describe('Módulos Financieros - Carga de páginas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Cuadro de Mandos Financiero carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/finanzas/cuadro-de-mandos`);
    await page.waitForLoadState('networkidle');

    // Verificar título
    await expect(page.locator('text=Cuadro de Mandos Financiero')).toBeVisible({ timeout: 10000 });

    // Verificar breadcrumb
    await expect(page.getByRole('link', { name: 'Finanzas' })).toBeVisible();

    // Verificar botones de conectividad (exact to avoid sidebar match)
    await expect(page.getByRole('button', { name: 'Family Office', exact: true })).toBeVisible();
    await expect(page.locator('text=Reportes')).toBeVisible();
    await expect(page.locator('text=Exportar')).toBeVisible();
    await expect(page.locator('text=Actualizar')).toBeVisible();
  });

  test('Private Equity carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/family-office/pe`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Private Equity/ })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Activos en Crecimiento').first()).toBeVisible();

    // Verificar link a Patrimonio 360° (button, not sidebar)
    await expect(page.getByRole('button', { name: 'Patrimonio 360°' })).toBeVisible();
  });

  test('Family Office Dashboard carga con quick navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/family-office/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await expect(page.locator('text=Dashboard Patrimonial').first()).toBeVisible({ timeout: 10000 });

    // Verificar quick navigation links
    await expect(page.locator('a[href="/family-office/pe"]').first()).toBeVisible();
    await expect(page.locator('a[href="/family-office/cuentas"]').first()).toBeVisible();
  });

  test('Panel Finanzas incluye Cuadro de Mandos', async ({ page }) => {
    await page.goto(`${BASE_URL}/finanzas`);
    await page.waitForLoadState('networkidle');

    // Verificar que el módulo Cuadro de Mandos existe
    await expect(page.locator('text=Cuadro de Mandos').first()).toBeVisible({ timeout: 10000 });
  });

  test('Family Office Cuentas - botón Conectar banco funciona', async ({ page }) => {
    await page.goto(`${BASE_URL}/family-office/cuentas`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Cuentas y Entidades Bancarias')).toBeVisible({ timeout: 10000 });

    // Click en Conectar banco → debe abrir dialog
    const connectBtn = page.locator('button:has-text("Conectar banco")');
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    // Verificar dialog abierto
    await expect(page.locator('text=Conectar entidad bancaria')).toBeVisible({ timeout: 5000 });
  });

  test('Dashboard Analytics tiene links financieros', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Analytics')).toBeVisible({ timeout: 10000 });

    // Verificar sección de herramientas financieras
    await expect(page.locator('text=Herramientas Financieras')).toBeVisible();
    await expect(page.locator('text=Cuadro de Mandos')).toBeVisible();
    await expect(page.locator('text=Family Office 360°')).toBeVisible();
  });

  test('Reportes Financieros tiene link a PyG Analítica', async ({ page }) => {
    await page.goto(`${BASE_URL}/reportes/financieros`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Verificar botón PyG Analítica
    await expect(page.locator('text=PyG Analítica')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Conectividad entre módulos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Cuadro de Mandos → Family Office', async ({ page }) => {
    await page.goto(`${BASE_URL}/finanzas/cuadro-de-mandos`);
    await page.waitForLoadState('networkidle');

    // Click en Family Office button (exact to avoid sidebar match)
    await page.getByRole('button', { name: 'Family Office', exact: true }).click();
    await page.waitForURL('**/family-office/**', { timeout: 10000 });

    expect(page.url()).toContain('/family-office');
  });

  test('Cuadro de Mandos → Reportes', async ({ page }) => {
    await page.goto(`${BASE_URL}/finanzas/cuadro-de-mandos`);
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Reportes"), a:has-text("Reportes")');
    await page.waitForURL('**/reportes/**', { timeout: 10000 });

    expect(page.url()).toContain('/reportes');
  });

  test('PE → Patrimonio 360°', async ({ page }) => {
    await page.goto(`${BASE_URL}/family-office/pe`);
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Patrimonio 360°"), a:has-text("Patrimonio 360°")');
    await page.waitForURL('**/family-office/dashboard**', { timeout: 10000 });

    expect(page.url()).toContain('/family-office/dashboard');
  });

  test('Family Office Dashboard → PE', async ({ page }) => {
    await page.goto(`${BASE_URL}/family-office/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Click en Private Equity en quick nav
    await page.click('a[href="/family-office/pe"]');
    await page.waitForURL('**/family-office/pe**', { timeout: 10000 });

    expect(page.url()).toContain('/family-office/pe');
  });

  test('Family Office Dashboard → Cuadro de Mandos', async ({ page }) => {
    await page.goto(`${BASE_URL}/family-office/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.click('a[href="/finanzas/cuadro-de-mandos"]');
    await page.waitForURL('**/finanzas/cuadro-de-mandos**', { timeout: 10000 });

    expect(page.url()).toContain('/finanzas/cuadro-de-mandos');
  });

  test('Reportes → PyG Analítica (Cuadro de Mandos)', async ({ page }) => {
    await page.goto(`${BASE_URL}/reportes/financieros`);
    await page.waitForLoadState('domcontentloaded');
    // Wait for page content
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: /PyG Analítica/ }).click();
    await page.waitForURL('**/finanzas/cuadro-de-mandos**', { timeout: 10000 });

    expect(page.url()).toContain('/finanzas/cuadro-de-mandos');
  });
});
