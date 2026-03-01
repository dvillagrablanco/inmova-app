import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors: string[] = [];
  const consoleMessages: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleMessages.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    errors.push(`[PAGE ERROR] ${err.message}`);
  });

  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('https://inmovaapp.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Try different selectors for email input
    const emailInput = await page.$('input[type="email"]') || await page.$('input[name="email"]') || await page.$('input[placeholder*="email" i]') || await page.$('input[placeholder*="correo" i]');
    if (emailInput) {
      await emailInput.fill('admin@inmova.app');
      const passInput = await page.$('input[type="password"]');
      if (passInput) await passInput.fill('Admin123!');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForTimeout(5000);
    } else {
      console.log('   Could not find login fields, trying direct navigation...');
    }
    console.log(`   URL after login: ${page.url()}`);

    // 2. Navigate to valoracion-ia
    console.log('2. Navigating to /valoracion-ia...');
    await page.goto('https://inmovaapp.com/valoracion-ia', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // 3. Check what's visible
    console.log('3. Checking visible content...');
    
    const title = await page.textContent('h1').catch(() => null);
    console.log(`   H1: ${title}`);

    const errorMsg = await page.textContent('[class*="error"], [class*="destructive"]').catch(() => null);
    console.log(`   Error element: ${errorMsg}`);

    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500));
    console.log(`   Body text (first 500): ${bodyText}`);

    // 4. Take screenshot
    await page.screenshot({ path: '/tmp/valoracion-ia-check.png', fullPage: false });
    console.log('   Screenshot saved to /tmp/valoracion-ia-check.png');

    // 5. Check for error boundary
    const hasErrorBoundary = await page.$('text=Algo salió mal').catch(() => null);
    console.log(`   Error boundary visible: ${!!hasErrorBoundary}`);

    const hasReintentar = await page.$('text=Reintentar').catch(() => null);
    console.log(`   Reintentar button visible: ${!!hasReintentar}`);

    // 6. Check loading state
    const hasLoading = await page.$('text=Cargando').catch(() => null);
    console.log(`   Loading state: ${!!hasLoading}`);

    const hasBrain = await page.$('text=Valoración de Activos').catch(() => null);
    console.log(`   Valoracion title visible: ${!!hasBrain}`);

  } catch (e: any) {
    console.log(`Navigation error: ${e.message}`);
  }

  console.log('\n=== JS ERRORS ===');
  errors.forEach((e) => console.log(e));
  console.log('\n=== CONSOLE ERRORS ===');
  consoleMessages.forEach((m) => console.log(m));

  if (errors.length === 0 && consoleMessages.length === 0) {
    console.log('(no errors captured)');
  }

  await browser.close();
})();
