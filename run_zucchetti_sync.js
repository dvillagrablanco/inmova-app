const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://inmovaapp.com/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', 'dvillagra@vidaroinversiones.com');
  await page.fill('input[type="password"]', 'Pucela00#');
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(4000);

  console.log('=== Iniciando full-sync grupo Vidaro ===');
  const result = await page.evaluate(async () => {
    const r = await fetch('/api/accounting/zucchetti/full-sync', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allGroup: true }),
    });
    return { status: r.status, body: await r.json() };
  });
  console.log('Status:', result.status);
  if (result.body.success === false || result.status >= 400) {
    console.log('ERROR body:', JSON.stringify(result.body, null, 2).substring(0, 2000));
  } else {
    console.log('Sociedades:', result.body.societies, 'Successful:', result.body.successful);
    for (const r of result.body.results || []) {
      console.log(`\n--- ${r.companyKey} ---`);
      console.log(`  success=${r.success} duración=${r.durationMs}ms`);
      if (r.error) console.log(`  ERROR: ${r.error}`);
      console.log(`  apuntes: read=${r.apuntes.read} created=${r.apuntes.created} updated=${r.apuntes.updated} skipped=${r.apuntes.skipped} errors=${r.apuntes.errors}`);
      console.log(`  treasury: created=${r.treasury.created} errors=${r.treasury.errors}`);
      console.log(`  iva: read=${r.iva.read} created=${r.iva.created} errors=${r.iva.errors}`);
      console.log(`  terceros: read=${r.terceros.read} created=${r.terceros.created} errors=${r.terceros.errors}`);
      console.log(`  balances: computed=${r.balances.computed} persisted=${r.balances.persisted}`);
    }
  }

  await browser.close();
})();
