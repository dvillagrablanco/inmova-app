import { test } from '@playwright/test';

test('Visual check - Screenshots de secciones problemáticas', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://inmovaapp.com/landing?nocache=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Screenshot del Hero con tabs
  await page.screenshot({ path: '/tmp/hero-tabs.png', clip: { x: 0, y: 0, width: 1280, height: 800 } });
  console.log('1. Hero con tabs guardado');
  
  // Scroll a la sección de pricing
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/pricing-section.png', clip: { x: 0, y: 0, width: 1280, height: 800 } });
  console.log('2. Pricing section guardado');
  
  // Buscar la tabla comparativa
  const comparativa = page.locator('text=Otras plataformas').first();
  if (await comparativa.isVisible()) {
    await comparativa.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/comparativa.png', clip: { x: 0, y: 0, width: 1280, height: 800 } });
    console.log('3. Comparativa guardada');
  }
  
  // Footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/footer.png', clip: { x: 0, y: 0, width: 1280, height: 800 } });
  console.log('4. Footer guardado');
});
