const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const url = 'https://priority-lynn-potato-worked.trycloudflare.com';
  console.log('🔍 Probando:', url);

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    console.log('✅ Status:', response.status());
    console.log('📄 Título:', await page.title());

    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/workspace/screenshot-success.png', fullPage: true });
    console.log('📸 Screenshot guardado');

    const text = await page.evaluate(() => document.body.innerText);
    console.log('📝 Primeros 800 caracteres:');
    console.log(text.substring(0, 800));

    console.log('\n🎉 ¡ÉXITO! La aplicación está accesible');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await browser.close();
})();
