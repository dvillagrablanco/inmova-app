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

const PAGES = [
  '/family-office/dashboard',
  '/family-office/pe',
  '/family-office/cuentas',
  '/family-office/cartera',
  '/family-office/tesoreria',
  '/finanzas',
  '/finanzas/cuadro-de-mandos',
  '/inversiones',
  '/inversiones/activos',
  '/inversiones/fianzas',
  '/inversiones/grupo',
  '/inversiones/modelo-720',
  '/inversiones/pyl',
  '/inversiones/hipotecas',
  '/inversiones/fiscal',
  '/inversiones/fiscal/modelos',
  '/inversiones/fiscal/simulador',
  '/inversiones/tesoreria',
  '/inversiones/analisis',
  '/contabilidad',
  '/contabilidad/intragrupo',
  '/gastos',
  '/pagos',
  '/reportes',
  '/reportes/financieros',
  '/dashboard/analytics',
];

test.describe('Full App Audit - Vidaro Group', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  for (const path of PAGES) {
    test(`${path} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      
      const response = await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Check HTTP status
      expect(response?.status()).toBeLessThan(500);

      // Check for error displays
      const errorText = await page.locator('text=Error').count();
      const serverError = await page.locator('text=500').count();
      const notFound = await page.locator('text=404').count();

      // Check for empty/no data indicators
      const noData = await page.locator('text=/No hay|Sin datos|no encontrad|vacío|empty/i').count();
      const loading = await page.locator('text=Cargando').count();

      // Get page content summary
      const bodyText = await page.locator('body').innerText();
      const hasContent = bodyText.length > 200;

      console.log(`${path}: status=${response?.status()}, content=${bodyText.length}chars, noData=${noData}, errors=${errors.length}`);
    });
  }
});
