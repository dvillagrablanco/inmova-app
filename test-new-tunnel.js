const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const url = 'https://meyer-recommendations-displaying-robust.trycloudflare.com';
  console.log('🔍 Probando nueva URL:', url);

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    console.log('✅ Status:', response.status());
    console.log('📄 Título:', await page.title());

    // Captura de pantalla
    await page.screenshot({ path: '/workspace/screenshot-working.png', fullPage: true });
    console.log('📸 Screenshot guardado');

    // Esperar a que cargue la app
    await page.waitForTimeout(5000);

    // Obtener texto visible
    const text = await page.evaluate(() => document.body.innerText);
    console.log('📝 Primeros 1000 caracteres del contenido:', text.substring(0, 1000));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await browser.close();
})();
