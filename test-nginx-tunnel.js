const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2];
  console.log('🔍 Probando:', url);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('✅ Status:', response.status());
    console.log('📄 Título:', await page.title());

    await page.screenshot({ path: '/workspace/screenshot-nginx.png', fullPage: true });

    const text = await page.evaluate(() => document.body.innerText);
    console.log('📝 Contenido (primeros 1000 caracteres):\n', text.substring(0, 1000));

    if (response.status() === 200) {
      console.log('\n🎉 ¡FUNCIONA! La aplicación está accesible');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await browser.close();
})();
