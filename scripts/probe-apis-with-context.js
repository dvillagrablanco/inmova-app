/**
 * Probe APIs after navigating to UI pages so cookies are set
 */
const { chromium } = require('playwright');

const BASE = 'https://inmovaapp.com';
const USER = 'dvillagra@vidaroinversiones.com';
const PASS = 'Pucela00#';

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
  console.log('Login OK:', page.url());

  // Visit a page that triggers error
  console.log('\n=> Visit /reportes/financieros');

  const networkLog = [];
  page.on('response', async (resp) => {
    const u = resp.url();
    if (u.includes('/api/') && resp.status() >= 400) {
      let body = '';
      try {
        body = (await resp.text()).substring(0, 500);
      } catch {}
      networkLog.push({
        status: resp.status(),
        url: u.replace(BASE, ''),
        body,
      });
    }
  });

  await page
    .goto(`${BASE}/reportes/financieros`, { waitUntil: 'networkidle', timeout: 30000 })
    .catch((e) => console.log('nav err', e.message));
  await page.waitForTimeout(5000);

  console.log('\n=== ERRORES en /reportes/financieros ===');
  for (const e of networkLog) {
    console.log(`[${e.status}] ${e.url}`);
    console.log(`  body: ${e.body}`);
  }

  // Check cookies
  const cookies = await context.cookies();
  const activeCo = cookies.find((c) => c.name === 'activeCompanyId');
  console.log('\nactiveCompanyId cookie:', activeCo?.value || 'NONE');

  // Now probe with explicit companyId
  if (activeCo) {
    console.log('\n=> Probe /api/reports with active company:');
    const r = await page.evaluate(async (url) => {
      const resp = await fetch(url, { credentials: 'include' });
      const text = await resp.text();
      return { status: resp.status, body: text.substring(0, 500) };
    }, `${BASE}/api/reports?tipo=global&periodo=12`);
    console.log(`  [${r.status}] ${r.body}`);
  }

  // Probe /votaciones page
  networkLog.length = 0;
  console.log('\n=> Visit /votaciones');
  await page
    .goto(`${BASE}/votaciones`, { waitUntil: 'networkidle', timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  for (const e of networkLog) {
    console.log(`[${e.status}] ${e.url}`);
    console.log(`  body: ${e.body}`);
  }

  // Probe /screening page
  networkLog.length = 0;
  console.log('\n=> Visit /screening');
  await page
    .goto(`${BASE}/screening`, { waitUntil: 'networkidle', timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  for (const e of networkLog) {
    console.log(`[${e.status}] ${e.url}`);
    console.log(`  body: ${e.body}`);
  }

  // /anuncios
  networkLog.length = 0;
  console.log('\n=> Visit /anuncios');
  await page.goto(`${BASE}/anuncios`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  for (const e of networkLog) {
    console.log(`[${e.status}] ${e.url}`);
    console.log(`  body: ${e.body}`);
  }

  // /portal-propietario
  networkLog.length = 0;
  console.log('\n=> Visit /portal-propietario');
  await page
    .goto(`${BASE}/portal-propietario`, { waitUntil: 'networkidle', timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  for (const e of networkLog) {
    console.log(`[${e.status}] ${e.url}`);
    console.log(`  body: ${e.body}`);
  }

  await browser.close();
})();
