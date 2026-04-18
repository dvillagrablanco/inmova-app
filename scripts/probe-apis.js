/**
 * Probe production APIs as Vidaro user, capture exact 500 error bodies
 */
const { chromium } = require('playwright');

const BASE = 'https://inmovaapp.com';
const USER = 'dvillagra@vidaroinversiones.com';
const PASS = 'Pucela00#';

const APIS_TO_PROBE = [
  '/api/user/companies',
  '/api/user/onboarding-status',
  '/api/buildings',
  '/api/votaciones',
  '/api/reuniones',
  '/api/anuncios',
  '/api/notification-templates',
  '/api/notification-rules',
  '/api/contract-templates',
  '/api/screening',
  '/api/units',
  '/api/payments?limit=10',
  '/api/expenses?fechaDesde=2026-04-01&fechaHasta=2026-04-18',
  '/api/reports?tipo=global&periodo=12',
  '/api/estadisticas',
  '/api/bi/dashboard?periodo=12&buildingId=',
  '/api/comunidades/dashboard',
  '/api/portal-inquilino/dashboard',
];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', USER);
  await page.fill('input[type="password"]', PASS);
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(4000);
  console.log('Login URL:', page.url());

  // Probe APIs
  for (const api of APIS_TO_PROBE) {
    try {
      const result = await page.evaluate(async (url) => {
        const resp = await fetch(url, { credentials: 'include' });
        const text = await resp.text();
        return { status: resp.status, body: text.substring(0, 500) };
      }, `${BASE}${api}`);
      console.log(`\n[${result.status}] ${api}`);
      if (result.status >= 400) {
        console.log(`  body: ${result.body}`);
      } else {
        console.log(`  body (preview): ${result.body.substring(0, 150)}`);
      }
    } catch (e) {
      console.log(`\n[ERR] ${api}: ${e.message}`);
    }
  }

  await browser.close();
})();
