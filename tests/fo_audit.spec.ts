import { test, expect } from '@playwright/test';

const BASE = 'https://inmovaapp.com';

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"], input[type="email"]', 'admin@inmova.app');
  await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('Family Office - Audit Visual', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('FO Dashboard - datos y quick links', async ({ page }) => {
    await page.goto(`${BASE}/family-office/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Check title
    await expect(page.getByText('Dashboard Patrimonial')).toBeVisible({ timeout: 10000 });
    
    // Check quick navigation exists
    await expect(page.locator('a[href="/family-office/pe"]').first()).toBeVisible();
    await expect(page.locator('a[href="/family-office/cuentas"]').first()).toBeVisible();
    
    // Check patrimonio total card
    const patrimonioCard = page.locator('text=Patrimonio Total').first();
    const isVisible = await patrimonioCard.isVisible().catch(() => false);
    console.log(`Patrimonio Total visible: ${isVisible}`);
    
    // Screenshot
    await page.screenshot({ path: '/tmp/fo_dashboard.png', fullPage: true });
    console.log('Screenshot: /tmp/fo_dashboard.png');
  });

  test('FO PE - fondos y tabla', async ({ page }) => {
    await page.goto(`${BASE}/family-office/pe`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await expect(page.getByRole('heading', { name: /Private Equity/ })).toBeVisible({ timeout: 10000 });
    
    // Check TVPI exists
    const tvpi = page.locator('text=TVPI').first();
    await expect(tvpi).toBeVisible();
    
    // Check table has funds
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    console.log(`PE table rows: ${rowCount}`);
    
    await page.screenshot({ path: '/tmp/fo_pe.png', fullPage: true });
  });

  test('FO Cuentas - bancos y dialog', async ({ page }) => {
    await page.goto(`${BASE}/family-office/cuentas`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await expect(page.getByText('Cuentas y Entidades')).toBeVisible({ timeout: 10000 });
    
    // Check connect button
    await expect(page.getByRole('button', { name: /Conectar banco/ })).toBeVisible();
    
    await page.screenshot({ path: '/tmp/fo_cuentas.png', fullPage: true });
  });

  test('FO Cartera - P&L', async ({ page }) => {
    await page.goto(`${BASE}/family-office/cartera`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/tmp/fo_cartera.png', fullPage: true });
    const title = await page.title();
    console.log(`Cartera page title: ${title}`);
  });

  test('FO Tesorería', async ({ page }) => {
    await page.goto(`${BASE}/family-office/tesoreria`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/tmp/fo_tesoreria.png', fullPage: true });
  });

  test('Cuadro de Mandos', async ({ page }) => {
    await page.goto(`${BASE}/finanzas/cuadro-de-mandos`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await expect(page.getByText('Cuadro de Mandos Financiero')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Family Office', exact: true })).toBeVisible();
    
    await page.screenshot({ path: '/tmp/fo_cuadro.png', fullPage: true });
  });

  test('Organigrama Grupo', async ({ page }) => {
    await page.goto(`${BASE}/inversiones/grupo`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await expect(page.getByText('Organigrama del Grupo')).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: '/tmp/fo_grupo.png', fullPage: true });
  });

  test('Modelo 720', async ({ page }) => {
    await page.goto(`${BASE}/inversiones/modelo-720`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await expect(page.getByText('Modelo 720')).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: '/tmp/fo_720.png', fullPage: true });
  });

  test('Fianzas', async ({ page }) => {
    await page.goto(`${BASE}/inversiones/fianzas`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/tmp/fo_fianzas.png', fullPage: true });
  });
});
