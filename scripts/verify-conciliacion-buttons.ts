import { chromium } from 'playwright';

const BASE = 'https://inmovaapp.com';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  const apiResponses: { url: string; status: number; body: string }[] = [];
  page.on('response', async (r) => {
    if (r.url().includes('smart-reconcile') || r.url().includes('conciliacion')) {
      const body = await r.text().catch(() => '');
      apiResponses.push({ url: r.url().replace(BASE, ''), status: r.status(), body: body.substring(0, 300) });
    }
  });

  console.log('='.repeat(60));
  console.log('VERIFICACION: Conciliacion Bancaria Viroda');
  console.log('='.repeat(60));

  // LOGIN
  console.log('\n[LOGIN]');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.locator('input[type="email"]').first().fill('admin@inmova.app');
  await page.locator('input[type="password"]').first().fill('Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  console.log('  URL:', page.url());
  const loggedIn = page.url().includes('dashboard');
  console.log('  Login:', loggedIn ? 'OK' : 'FAIL');
  if (!loggedIn) { await browser.close(); return; }

  // NAVIGATE
  console.log('\n[PAGINA CONCILIACION]');
  await page.goto(`${BASE}/finanzas/conciliacion`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);

  // READ KPIs
  const body1 = await page.textContent('body') || '';
  const pendMatch = body1.match(/(\d[\d.]*)\s*Pendientes/);
  const concMatch = body1.match(/(\d[\d.]*)\s*Conciliados/);
  console.log('  Pendientes:', pendMatch?.[1] || '?');
  console.log('  Conciliados:', concMatch?.[1] || '?');

  // GO TO SUGERENCIAS IA TAB
  console.log('\n[TAB SUGERENCIAS IA]');
  const tab = page.locator('button:has-text("Sugerencias IA")');
  await tab.click();
  await page.waitForTimeout(1500);

  // Check description
  const desc = await page.locator('text=/pendientes.*ingresos/i').first().textContent().catch(() => '');
  console.log('  Descripcion:', (desc || 'no encontrada').substring(0, 80));

  // Check buttons
  const aiBtn = page.locator('button:has-text("con IA")').first();
  const rulesBtn = page.locator('button:has-text("Solo reglas")');
  const aiBtnText = await aiBtn.textContent().catch(() => '');
  const aiBtnDisabled = await aiBtn.isDisabled().catch(() => true);
  const rulesBtnDisabled = await rulesBtn.isDisabled().catch(() => true);
  console.log(`  Boton IA: "${aiBtnText?.trim()}" disabled=${aiBtnDisabled}`);
  console.log(`  Boton Reglas: disabled=${rulesBtnDisabled}`);

  // =============================================
  // TEST 1: SOLO REGLAS
  // =============================================
  console.log('\n[TEST 1: SOLO REGLAS]');
  if (rulesBtnDisabled) {
    console.log('  SKIP: boton deshabilitado');
  } else {
    apiResponses.length = 0;
    await rulesBtn.click();

    // Wait for progress bar
    let progressSeen = false;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(2000);
      const progressBar = await page.locator('[class*="bg-gradient"]').isVisible().catch(() => false);
      const progressText = await page.locator('text=/\\d+\\/\\d+/').first().textContent().catch(() => '');
      const isAnalyzing = await page.locator('text=/Analizando/').isVisible().catch(() => false);

      if (progressBar || isAnalyzing) {
        progressSeen = true;
        console.log(`  [${(i + 1) * 2}s] Progreso: ${progressText || 'en curso...'}`);
      }

      // Check if done
      const completedText = await page.locator('text=/Completado/').isVisible().catch(() => false);
      const toasts = await page.locator('[data-sonner-toast]').allTextContents();
      if (toasts.length > 0) {
        console.log(`  Toast: "${toasts[0].substring(0, 100)}"`);
        break;
      }
      if (completedText && !isAnalyzing) {
        console.log(`  Completado en ${(i + 1) * 2}s`);
        break;
      }
      if (i > 10 && !progressSeen) {
        console.log('  No se vio progreso, puede haber terminado rapido');
        break;
      }
    }

    await page.waitForTimeout(2000);

    // Check results table
    const rows = await page.locator('table tbody tr').count().catch(() => 0);
    console.log(`  Filas en tabla resultados: ${rows}`);

    // Count matches by confidence
    if (rows > 0) {
      const cells = await page.locator('table tbody tr td:first-child').allTextContents();
      const high = cells.filter(c => parseInt(c) >= 70).length;
      const medium = cells.filter(c => { const n = parseInt(c); return n >= 40 && n < 70; }).length;
      const low = cells.filter(c => { const n = parseInt(c); return n > 0 && n < 40; }).length;
      console.log(`  Alta confianza (>=70%): ${high}`);
      console.log(`  Media (40-69%): ${medium}`);
      console.log(`  Baja (<40%): ${low}`);
    }

    // Check API responses
    const smartCalls = apiResponses.filter(r => r.url.includes('smart-reconcile'));
    console.log(`  API calls smart-reconcile: ${smartCalls.length}`);
    for (const call of smartCalls.slice(0, 3)) {
      console.log(`    ${call.status} ${call.url.substring(0, 50)} → ${call.body.substring(0, 80)}`);
    }

    // Verify stats
    const bodyAfter = await page.textContent('body') || '';
    const idMatch = bodyAfter.match(/Identificados:\s*(\d+)/);
    const recMatch = bodyAfter.match(/Conciliados:\s*(\d+)/);
    if (idMatch) console.log(`  Identificados: ${idMatch[1]}`);
    if (recMatch) console.log(`  Conciliados: ${recMatch[1]}`);

    console.log('  RESULTADO: ' + (smartCalls.some(c => c.status === 200) ? 'OK' : 'FALLO'));
  }

  await page.screenshot({ path: '/tmp/verify_rules.png' });

  // =============================================
  // TEST 2: CON IA (CLAUDE)
  // =============================================
  console.log('\n[TEST 2: CON IA (CLAUDE)]');

  // Re-check button state after first test
  const aiBtn2 = page.locator('button:has-text("con IA")').first();
  const aiDisabled2 = await aiBtn2.isDisabled().catch(() => true);
  console.log(`  Boton IA disabled: ${aiDisabled2}`);

  if (aiDisabled2) {
    console.log('  SKIP: boton deshabilitado (puede que no haya mas ingresos)');
  } else {
    apiResponses.length = 0;
    await aiBtn2.click();

    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(3000);
      const isAnalyzing = await page.locator('text=/Analizando/').isVisible().catch(() => false);
      const progressText = await page.locator('text=/\\d+\\/\\d+/').first().textContent().catch(() => '');
      const toasts = await page.locator('[data-sonner-toast]').allTextContents();

      if (progressText) console.log(`  [${(i + 1) * 3}s] ${progressText}`);

      if (toasts.length > 0) {
        console.log(`  Toast: "${toasts[toasts.length - 1].substring(0, 100)}"`);
        break;
      }
      if (!isAnalyzing && i > 3) {
        console.log(`  Completado en ${(i + 1) * 3}s`);
        break;
      }
    }

    await page.waitForTimeout(2000);

    const rows2 = await page.locator('table tbody tr').count().catch(() => 0);
    console.log(`  Filas resultados: ${rows2}`);

    const smartCalls2 = apiResponses.filter(r => r.url.includes('smart-reconcile'));
    console.log(`  API calls: ${smartCalls2.length}`);
    for (const call of smartCalls2.slice(0, 3)) {
      console.log(`    ${call.status} → ${call.body.substring(0, 100)}`);
    }

    console.log('  RESULTADO: ' + (smartCalls2.some(c => c.status === 200) ? 'OK' : 'FALLO'));
  }

  await page.screenshot({ path: '/tmp/verify_ia.png' });

  // FINAL
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICACION COMPLETA');
  console.log('='.repeat(60));

  await browser.close();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
