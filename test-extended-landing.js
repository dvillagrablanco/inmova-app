const { chromium } = require('playwright');

(async () => {
  console.log('🎭 TEST EXHAUSTIVO - 30 SEGUNDOS');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      console.log(`[ERROR] ${text}`);
      errors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    const msg = error.toString();
    console.log(`[PAGE ERROR] ${msg}`);
    errors.push(msg);
  });
  
  try {
    console.log('\n1. Navegando...');
    await page.goto('http://localhost:3000/landing', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✓ Loaded');
    
    await page.screenshot({ path: '/tmp/t1-0s.png' });
    const b1 = await page.locator('body').textContent();
    const l1 = b1 ? b1.length : 0;
    console.log(`\n2. Checkpoint 0s: ${l1} chars`);
    
    console.log('\n3. Esperando 5s...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/t2-5s.png' });
    const b2 = await page.locator('body').textContent();
    const l2 = b2 ? b2.length : 0;
    console.log(`   Checkpoint 5s: ${l2} chars ${l2 < l1 ? '⬇️ PERDIENDO' : '✅'}`);
    
    console.log('\n4. Esperando 10s...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/t3-10s.png' });
    const b3 = await page.locator('body').textContent();
    const l3 = b3 ? b3.length : 0;
    console.log(`   Checkpoint 10s: ${l3} chars ${l3 < l2 ? '⬇️ PERDIENDO' : '✅'}`);
    
    console.log('\n5. Esperando 20s...');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/tmp/t4-20s.png' });
    const b4 = await page.locator('body').textContent();
    const l4 = b4 ? b4.length : 0;
    console.log(`   Checkpoint 20s: ${l4} chars ${l4 < l3 ? '⬇️ PERDIENDO' : '✅'}`);
    
    console.log('\n6. Esperando 30s...');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/tmp/t5-30s.png' });
    const b5 = await page.locator('body').textContent();
    const l5 = b5 ? b5.length : 0;
    console.log(`   Checkpoint 30s: ${l5} chars ${l5 < l4 ? '⬇️ PERDIENDO' : '✅'}`);
    
    console.log('\n7. Elementos visibles:');
    const texts = ['INMOVA', 'Verticales', 'Starter'];
    for (const t of texts) {
      try {
        const el = await page.locator(`text=${t}`).first();
        const vis = await el.isVisible({ timeout: 1000 });
        console.log(`   ${vis ? '✓' : '✗'} ${t}`);
      } catch {
        console.log(`   ✗ ${t}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('EVOLUCIÓN:');
    console.log('='.repeat(60));
    console.log(`0s:  ${l1} chars`);
    console.log(`5s:  ${l2} chars`);
    console.log(`10s: ${l3} chars`);
    console.log(`20s: ${l4} chars`);
    console.log(`30s: ${l5} chars`);
    console.log(`Errores: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nERRORES CAPTURADOS:');
      errors.forEach((e, i) => console.log(`${i+1}. ${e.substring(0, 150)}`));
    }
    
    if (l5 < 100) {
      console.log('\n❌ SE PONE EN BLANCO');
    } else if (l5 < l1 * 0.5) {
      console.log('\n⚠️ PIERDE CONTENIDO');
    } else {
      console.log('\n✅ ESTABLE');
    }
    console.log('='.repeat(60));
    
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
