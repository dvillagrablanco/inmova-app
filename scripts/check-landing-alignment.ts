import { chromium, Browser, Page } from '@playwright/test';

// Usar IP directa para evitar cache de Cloudflare
const BASE_URL = 'http://157.180.119.236';

async function checkLandingAlignment() {
  console.log('🔍 Verificando alineación en landing page...\n');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    bypassCSP: true,
  });
  const page: Page = await context.newPage();
  
  // Forzar bypass de cache
  await page.route('**/*', async (route) => {
    const headers = {
      ...route.request().headers(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    };
    await route.continue({ headers });
  });

  try {
    // 1. Verificar sección de portales de acceso
    console.log('📍 1. Verificando sección de Portales de Acceso...');
    await page.goto(`${BASE_URL}/landing#accesos`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Captura de pantalla de portales
    await page.screenshot({ 
      path: '/workspace/screenshots-alignment/portales-acceso.png',
      fullPage: false 
    });
    
    // Obtener posiciones de los botones de "Acceder"
    const portalButtons = await page.locator('section#accesos button:has-text("Acceder")').all();
    console.log(`   Encontrados ${portalButtons.length} botones de "Acceder"`);
    
    const portalButtonPositions: number[] = [];
    for (let i = 0; i < portalButtons.length; i++) {
      const box = await portalButtons[i].boundingBox();
      if (box) {
        portalButtonPositions.push(Math.round(box.y));
        console.log(`   - Botón ${i + 1}: Y=${Math.round(box.y)}px`);
      }
    }
    
    const portalAligned = portalButtonPositions.every(y => y === portalButtonPositions[0]);
    console.log(`   ${portalAligned ? '✅' : '❌'} Botones ${portalAligned ? 'ALINEADOS' : 'NO ALINEADOS'}\n`);

    // 2. Verificar sección de precios
    console.log('📍 2. Verificando sección de Precios...');
    await page.goto(`${BASE_URL}/landing#pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Scroll a la sección de precios
    await page.evaluate(() => {
      document.querySelector('#pricing')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(1000);
    
    // Captura de pantalla de precios
    await page.screenshot({ 
      path: '/workspace/screenshots-alignment/precios-section.png',
      fullPage: false 
    });
    
    // Obtener posiciones de los botones "Probar 30 días gratis" o "Empezar"
    const pricingButtons = await page.locator('section#pricing button:has-text("Probar"), section#pricing button:has-text("Empezar")').all();
    console.log(`   Encontrados ${pricingButtons.length} botones en precios`);
    
    const pricingButtonPositions: number[] = [];
    for (let i = 0; i < pricingButtons.length; i++) {
      const box = await pricingButtons[i].boundingBox();
      if (box) {
        pricingButtonPositions.push(Math.round(box.y));
        console.log(`   - Botón ${i + 1}: Y=${Math.round(box.y)}px`);
      }
    }
    
    const pricingAligned = pricingButtonPositions.every(y => y === pricingButtonPositions[0]);
    console.log(`   ${pricingAligned ? '✅' : '❌'} Botones ${pricingAligned ? 'ALINEADOS' : 'NO ALINEADOS'}\n`);

    // 3. Verificar página de precios independiente
    console.log('📍 3. Verificando página /landing/precios...');
    await page.goto(`${BASE_URL}/landing/precios`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: '/workspace/screenshots-alignment/precios-page.png',
      fullPage: true 
    });
    
    const preciosButtons = await page.locator('button:has-text("Probar"), button:has-text("Solicitar")').all();
    console.log(`   Encontrados ${preciosButtons.length} botones en /landing/precios`);
    
    const preciosButtonPositions: number[] = [];
    for (let i = 0; i < preciosButtons.length; i++) {
      const box = await preciosButtons[i].boundingBox();
      if (box) {
        preciosButtonPositions.push(Math.round(box.y));
        console.log(`   - Botón ${i + 1}: Y=${Math.round(box.y)}px`);
      }
    }
    
    const preciosAligned = preciosButtonPositions.every(y => y === preciosButtonPositions[0]);
    console.log(`   ${preciosAligned ? '✅' : '❌'} Botones ${preciosAligned ? 'ALINEADOS' : 'NO ALINEADOS'}\n`);

    // 4. Verificar página de ofertas
    console.log('📍 4. Verificando página /landing/ofertas...');
    await page.goto(`${BASE_URL}/landing/ofertas`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: '/workspace/screenshots-alignment/ofertas-page.png',
      fullPage: true 
    });
    
    const ofertasButtons = await page.locator('.grid button').all();
    console.log(`   Encontrados ${ofertasButtons.length} botones en ofertas`);
    
    const ofertasButtonPositions: number[] = [];
    for (let i = 0; i < ofertasButtons.length; i++) {
      const box = await ofertasButtons[i].boundingBox();
      if (box) {
        ofertasButtonPositions.push(Math.round(box.y));
        console.log(`   - Botón ${i + 1}: Y=${Math.round(box.y)}px`);
      }
    }
    
    const ofertasAligned = ofertasButtonPositions.every(y => y === ofertasButtonPositions[0]);
    console.log(`   ${ofertasAligned ? '✅' : '❌'} Botones ${ofertasAligned ? 'ALINEADOS' : 'NO ALINEADOS'}\n`);

    // Resumen
    console.log('=' .repeat(60));
    console.log('📊 RESUMEN DE ALINEACIÓN:');
    console.log('=' .repeat(60));
    console.log(`   Portales de Acceso: ${portalAligned ? '✅ OK' : '❌ NO ALINEADOS'}`);
    console.log(`   Sección Precios:    ${pricingAligned ? '✅ OK' : '❌ NO ALINEADOS'}`);
    console.log(`   Página /precios:    ${preciosAligned ? '✅ OK' : '❌ NO ALINEADOS'}`);
    console.log(`   Página /ofertas:    ${ofertasAligned ? '✅ OK' : '❌ NO ALINEADOS'}`);
    console.log('=' .repeat(60));
    console.log('\n📸 Screenshots guardados en /workspace/screenshots-alignment/');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkLandingAlignment();
