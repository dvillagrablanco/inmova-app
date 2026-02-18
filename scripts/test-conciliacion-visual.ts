/**
 * Visual test: Conciliacion bancaria page for Viroda
 * Tests login, navigation, and both AI buttons
 */
import { chromium, Page } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Admin123!';

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `/tmp/screenshot_${name}.png`, fullPage: false });
  console.log(`  [Screenshot] ${name}.png`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('VISUAL TEST: Conciliacion Bancaria - Viroda');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  // Track API calls
  const apiCalls: { url: string; status: number; body?: string }[] = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      let body = '';
      try { body = await response.text(); } catch {}
      apiCalls.push({ url: url.replace(BASE_URL, ''), status: response.status(), body: body.substring(0, 200) });
    }
  });

  try {
    // 1. LOGIN
    console.log('\n[1] Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot(page, '01_login_page');

    await page.fill('input[name="email"], input[type="email"]', EMAIL);
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for redirect or stay on login
    await page.waitForTimeout(5000);
    const afterLoginUrl = page.url();
    console.log(`  URL after login: ${afterLoginUrl}`);
    await screenshot(page, '02_after_login');
    
    // If still on login, try navigating directly
    if (afterLoginUrl.includes('/login')) {
      console.log('  Login may have failed, trying direct navigation...');
    }

    // 2. Navigate to conciliacion
    console.log('\n[2] Navigating to /finanzas/conciliacion...');
    await page.goto(`${BASE_URL}/finanzas/conciliacion`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log(`  URL: ${page.url()}`);
    await screenshot(page, '03_conciliacion_page');

    // 3. Check page content
    console.log('\n[3] Page content check...');
    const pageText = await page.textContent('body') || '';
    
    const checks = [
      ['Pendientes', pageText.includes('Pendientes')],
      ['Conciliados', pageText.includes('Conciliados')],
      ['Sugerencias IA', pageText.includes('Sugerencias IA')],
      ['Movimientos', pageText.includes('Movimientos')],
    ];
    for (const [name, ok] of checks) {
      console.log(`  ${ok ? 'OK' : 'FAIL'}: ${name}`);
    }

    // 4. Click on Sugerencias IA tab
    console.log('\n[4] Click Sugerencias IA tab...');
    const sugerenciasTab = page.locator('button:has-text("Sugerencias IA"), [role="tab"]:has-text("Sugerencias IA")');
    const tabVisible = await sugerenciasTab.isVisible().catch(() => false);
    console.log(`  Tab visible: ${tabVisible}`);
    
    if (tabVisible) {
      await sugerenciasTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '04_sugerencias_tab');

      // Check for the buttons
      const aiBtn = page.locator('button:has-text("Analizar"), button:has-text("con IA")').first();
      const rulesBtn = page.locator('button:has-text("Solo reglas")');
      
      const aiBtnVisible = await aiBtn.isVisible().catch(() => false);
      const rulesBtnVisible = await rulesBtn.isVisible().catch(() => false);
      const aiBtnDisabled = await aiBtn.isDisabled().catch(() => true);
      const rulesBtnDisabled = await rulesBtn.isDisabled().catch(() => true);
      const aiBtnText = await aiBtn.textContent().catch(() => 'N/A');
      
      console.log(`  AI button visible: ${aiBtnVisible}, disabled: ${aiBtnDisabled}, text: "${aiBtnText}"`);
      console.log(`  Rules button visible: ${rulesBtnVisible}, disabled: ${rulesBtnDisabled}`);

      // Check for progress description
      const descText = await page.locator('[class*="CardDescription"], p:has-text("pendientes")').first().textContent().catch(() => '');
      console.log(`  Description: "${descText?.substring(0, 100)}"`);

      // 5. Click "Solo reglas" button
      if (rulesBtnVisible && !rulesBtnDisabled) {
        console.log('\n[5] Clicking "Solo reglas" button...');
        apiCalls.length = 0;
        
        await rulesBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '05_rules_clicked');

        // Wait for progress bar or completion
        const progressBar = page.locator('[class*="bg-gradient"], [role="progressbar"]');
        const hasProgress = await progressBar.isVisible().catch(() => false);
        console.log(`  Progress bar visible: ${hasProgress}`);

        // Wait for it to complete (max 30s)
        let waited = 0;
        while (waited < 30000) {
          const isActive = await page.locator('button:has-text("Analizando")').isVisible().catch(() => false);
          if (!isActive) break;
          await page.waitForTimeout(2000);
          waited += 2000;
          const progressText = await page.locator(':has-text("Analizando")').first().textContent().catch(() => '');
          console.log(`  [${waited/1000}s] ${progressText?.substring(0, 60) || 'waiting...'}`);
        }

        await page.waitForTimeout(2000);
        await screenshot(page, '06_rules_completed');

        // Check results
        const resultTable = page.locator('table');
        const hasResults = await resultTable.isVisible().catch(() => false);
        console.log(`  Results table visible: ${hasResults}`);

        if (hasResults) {
          const rows = await page.locator('table tbody tr').count();
          console.log(`  Result rows: ${rows}`);
        }

        // Check toast
        const toast = await page.locator('[data-sonner-toast]').first().textContent().catch(() => '');
        if (toast) console.log(`  Toast: "${toast.substring(0, 80)}"`);
      } else {
        console.log('\n[5] Rules button not clickable - checking why...');
        // Check if incomeCount is 0
        const statsText = await page.textContent('body') || '';
        console.log(`  Page has "ingresos": ${statsText.includes('ingresos')}`);
        console.log(`  Page has "0 ingresos": ${statsText.includes('0 ingresos')}`);
      }
    } else {
      console.log('  Sugerencias IA tab NOT FOUND');
      // List all tabs/buttons visible
      const buttons = await page.locator('button').allTextContents();
      console.log(`  Visible buttons: ${buttons.filter(b => b.length > 2).join(' | ')}`);
    }

    // 6. API calls log
    console.log('\n[6] API calls made:');
    const smartCalls = apiCalls.filter(c => c.url.includes('smart-reconcile') || c.url.includes('conciliacion'));
    for (const call of smartCalls.slice(-10)) {
      console.log(`  ${call.status} ${call.url.substring(0, 60)}`);
      if (call.body && call.status !== 200) console.log(`    Body: ${call.body.substring(0, 100)}`);
    }

    // 7. Console errors
    if (errors.length > 0) {
      console.log('\n[7] Console errors:');
      for (const e of errors.slice(-5)) {
        console.log(`  ${e.substring(0, 100)}`);
      }
    }

  } catch (err: any) {
    console.error(`\nFATAL ERROR: ${err.message}`);
    await screenshot(page, '99_error');
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

main().catch(e => { console.error(e); process.exit(1); });
