const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  });
  const page = await context.newPage();

  console.log('🔍 Probando URL del túnel...');

  try {
    const response = await page.goto(
      'https://newfoundland-potatoes-instantly-extent.trycloudflare.com',
      {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      }
    );

    console.log('✅ Status:', response.status());
    console.log('📄 Título:', await page.title());
    console.log('🌐 URL:', page.url());

    // Captura de pantalla
    await page.screenshot({ path: '/workspace/screenshot-tunnel.png', fullPage: true });
    console.log('📸 Screenshot: /workspace/screenshot-tunnel.png');

    // Obtener texto visible
    const text = await page.textContent('body');
    console.log('📝 Texto visible (primeros 500 caracteres):', text.substring(0, 500));

    // Verificar errores
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(3000);

    if (errors.length > 0) {
      console.log('❌ Errores en consola:', errors);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/workspace/screenshot-error.png' });
    console.log('📸 Screenshot de error guardado');
  }

  await browser.close();
})();
