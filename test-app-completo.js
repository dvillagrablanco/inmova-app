const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando prueba completa de la aplicación...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    // 1. Acceder a la página principal
    console.log('📄 1. Accediendo a la landing page...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const title = await page.title();
    console.log('   ✅ Título:', title || 'Sin título');

    await page.screenshot({
      path: '/workspace/test-screenshots/01-landing.png',
      fullPage: true,
    });
    console.log('   📸 Screenshot: 01-landing.png\n');

    // 2. Ir a login
    console.log('🔐 2. Accediendo a login...');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.screenshot({
      path: '/workspace/test-screenshots/02-login-page.png',
      fullPage: true,
    });
    console.log('   📸 Screenshot: 02-login-page.png\n');

    // 3. Hacer login
    console.log('👤 3. Haciendo login con usuario demo...');

    // Esperar que aparezcan los campos
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

    await page.fill('input[type="email"], input[name="email"]', 'demo@inmova.app');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');

    await page.screenshot({
      path: '/workspace/test-screenshots/03-login-filled.png',
      fullPage: true,
    });
    console.log('   📝 Formulario completado\n');

    // Click en botón de login
    await page.click('button[type="submit"]');
    console.log('   🔄 Enviando credenciales...\n');

    // Esperar navegación o error
    await Promise.race([
      page.waitForURL('**/dashboard**', { timeout: 10000 }),
      page.waitForURL('**/home**', { timeout: 10000 }),
      page.waitForTimeout(8000),
    ]);

    const currentUrl = page.url();
    console.log('   📍 URL después de login:', currentUrl);

    await page.screenshot({
      path: '/workspace/test-screenshots/04-after-login.png',
      fullPage: true,
    });
    console.log('   📸 Screenshot: 04-after-login.png\n');

    // 4. Navegar por la app
    if (currentUrl.includes('dashboard') || currentUrl.includes('home')) {
      console.log('✅ 4. Login exitoso! Navegando por la aplicación...\n');

      // Esperar a que cargue
      await page.waitForTimeout(3000);

      // Dashboard
      console.log('   📊 Accediendo a diferentes secciones...');
      await page.screenshot({
        path: '/workspace/test-screenshots/05-dashboard.png',
        fullPage: true,
      });

      // Intentar ir a edificios
      try {
        await page.goto('http://localhost:3000/edificios', { timeout: 10000 });
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: '/workspace/test-screenshots/06-edificios.png',
          fullPage: true,
        });
        console.log('   ✅ Edificios cargados\n');
      } catch (e) {
        console.log('   ⚠️  Edificios no accesible\n');
      }

      // Intentar ir a contratos
      try {
        await page.goto('http://localhost:3000/contratos', { timeout: 10000 });
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: '/workspace/test-screenshots/07-contratos.png',
          fullPage: true,
        });
        console.log('   ✅ Contratos cargados\n');
      } catch (e) {
        console.log('   ⚠️  Contratos no accesible\n');
      }
    } else {
      console.log('⚠️  No se pudo completar el login (posible problema de autenticación)\n');
    }

    console.log('\n🎉 ¡PRUEBA COMPLETADA!\n');
    console.log('📁 Screenshots guardados en: /workspace/test-screenshots/\n');
    console.log('👤 Credenciales de prueba:');
    console.log('   Email: demo@inmova.app');
    console.log('   Password: demo123\n');
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    await page.screenshot({
      path: '/workspace/test-screenshots/error.png',
      fullPage: true,
    });
  }

  await browser.close();
})();
