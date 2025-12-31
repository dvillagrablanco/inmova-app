import { test, expect } from '@playwright/test';

test.describe('Verificación Landing Pública en inmovaapp.com', () => {
  test('Verificar landing nueva se muestra correctamente', async ({ page }) => {
    console.log('\n🔍 VERIFICACIÓN VISUAL DE LANDING PÚBLICA\n');
    console.log('=' * 80);

    // 1. Ir a URL pública (sin caché)
    console.log('\n1️⃣  Navegando a https://inmovaapp.com...');
    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Esperar a que cargue completamente
    await page.waitForTimeout(3000);

    // 2. Capturar información de la página
    const pageTitle = await page.title();
    const pageUrl = page.url();

    console.log(`\n2️⃣  Información de la página:`);
    console.log(`   URL actual: ${pageUrl}`);
    console.log(`   Título: ${pageTitle}`);

    // 3. Tomar screenshot
    console.log('\n3️⃣  Capturando screenshot...');
    await page.screenshot({
      path: 'visual-verification-results/landing-actual.png',
      fullPage: true,
    });
    console.log('   ✅ Screenshot guardado en: visual-verification-results/landing-actual.png');

    // 4. Verificar contenido específico de la landing NUEVA
    console.log('\n4️⃣  Verificando contenido de landing NUEVA:');

    // Buscar elementos específicos de la landing nueva
    const heroExists = await page
      .locator('text=PropTech')
      .first()
      .isVisible()
      .catch(() => false);
    const ctaExists = await page
      .locator('button, a')
      .filter({ hasText: /Empezar|Comenzar|Demo/ })
      .first()
      .isVisible()
      .catch(() => false);

    console.log(`   Hero PropTech: ${heroExists ? '✅' : '❌'}`);
    console.log(`   CTA Button: ${ctaExists ? '✅' : '❌'}`);

    // 5. Extraer texto del body (primeros 500 caracteres)
    const bodyText = (await page.locator('body').textContent()) || '';
    const preview = bodyText.substring(0, 500).replace(/\s+/g, ' ').trim();
    console.log(`\n5️⃣  Contenido visible (preview):`);
    console.log(`   ${preview}...`);

    // 6. Verificar si hay elementos de la landing ANTIGUA
    console.log('\n6️⃣  Buscando elementos de landing ANTIGUA:');
    const oldLoader = await page
      .locator('text=Cargando...')
      .isVisible()
      .catch(() => false);
    const oldTitle =
      pageTitle.includes('Gestión Inmobiliaria Inteligente') && !pageTitle.includes('PropTech #1');

    console.log(`   Loader "Cargando...": ${oldLoader ? '❌ PRESENTE (MAL)' : '✅ NO PRESENTE'}`);
    console.log(`   Título antiguo: ${oldTitle ? '❌ ANTIGUO (MAL)' : '✅ NUEVO'}`);

    // 7. Verificar meta tags
    console.log('\n7️⃣  Meta tags:');
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');

    console.log(`   Description: ${metaDescription?.substring(0, 80)}...`);
    console.log(`   OG Title: ${ogTitle}`);

    // 8. Verificar si redirige
    console.log('\n8️⃣  Verificación de redirect:');
    if (pageUrl.includes('/landing')) {
      console.log('   ✅ Redirigió a /landing correctamente');
    } else if (pageUrl === 'https://inmovaapp.com/') {
      console.log('   ⚠️  Se quedó en raíz (/) - puede ser meta refresh lento');
    } else {
      console.log(`   ⚠️  URL inesperada: ${pageUrl}`);
    }

    // 9. Resultado final
    console.log('\n9️⃣  RESULTADO FINAL:');
    console.log('=' * 80);

    const isNewLanding = pageTitle.includes('INMOVA') || pageTitle.includes('PropTech #1');

    if (isNewLanding) {
      console.log('   ✅ LANDING NUEVA detectada');
      console.log('   🎉 Todo correcto!');
    } else {
      console.log('   ❌ LANDING ANTIGUA todavía visible');
      console.log('   🔴 Problema: Cloudflare o Nginx siguen cacheando versión antigua');
    }

    console.log('=' * 80 + '\n');

    // Aserciones para el test
    expect(pageTitle).toContain('INMOVA');
  });

  test('Verificar /landing directamente', async ({ page }) => {
    console.log('\n🔍 VERIFICACIÓN DE /landing DIRECTO\n');

    await page.goto('https://inmovaapp.com/landing', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(2000);

    const pageTitle = await page.title();
    console.log(`Título de /landing: ${pageTitle}`);

    await page.screenshot({
      path: 'visual-verification-results/landing-direct.png',
      fullPage: true,
    });

    console.log('✅ Screenshot guardado en: visual-verification-results/landing-direct.png\n');

    expect(pageTitle).toContain('INMOVA');
  });
});
