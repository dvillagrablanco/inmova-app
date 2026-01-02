import { chromium } from 'playwright';

async function testModalMovil() {
  const browser = await chromium.launch({ headless: true });
  
  // Crear contexto móvil (iPhone 13 Pro)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true,
  });
  
  const page = await context.newPage();
  
  console.log('📱 Simulando iPhone 13 Pro (390x844px)\n');
  
  try {
    // 1. Login
    console.log('1️⃣  Navegando a login...');
    await page.goto('http://157.180.119.236/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/workspace/test-modal-mobile-1-login.png', fullPage: true });
    
    console.log('2️⃣  Llenando formulario...');
    await page.fill('input[name="email"]', 'superadmin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    
    console.log('3️⃣  Haciendo login...');
    await page.click('button[type="submit"]');
    
    // Esperar navegación con manejo de errores
    try {
      await page.waitForURL('**/dashboard', { timeout: 30000 });
    } catch (e) {
      console.log(`   ⚠️  No redirigió a dashboard, URL actual: ${page.url()}`);
      // Intentar navegar manualmente
      await page.goto('http://157.180.119.236/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    }
    
    // Esperar que el modal aparezca
    await page.waitForTimeout(2000);
    
    console.log('4️⃣  Capturando modal en móvil...');
    await page.screenshot({ path: '/workspace/test-modal-mobile-2-dashboard.png', fullPage: true });
    
    // Verificar dimensiones del modal
    const modalVisible = await page.locator('[role="dialog"]').isVisible();
    console.log(`   Modal visible: ${modalVisible ? '✅' : '❌'}`);
    
    if (modalVisible) {
      // Obtener dimensiones
      const modal = page.locator('[role="dialog"]');
      const box = await modal.boundingBox();
      
      if (box) {
        console.log(`\n📐 DIMENSIONES DEL MODAL:`);
        console.log(`   Ancho: ${box.width}px (viewport: 390px)`);
        console.log(`   Alto: ${box.height}px (viewport: 844px)`);
        console.log(`   % de ancho: ${((box.width / 390) * 100).toFixed(1)}%`);
        console.log(`   % de alto: ${((box.height / 844) * 100).toFixed(1)}%`);
        
        // Verificar que ocupa ~95% del ancho
        const widthPercent = (box.width / 390) * 100;
        if (widthPercent >= 90) {
          console.log(`   ✅ Ancho correcto (≥90%)`);
        } else {
          console.log(`   ❌ Ancho insuficiente (esperado ≥90%)`);
        }
        
        // Verificar que el alto no excede ~85%
        const heightPercent = (box.height / 844) * 100;
        if (heightPercent <= 90) {
          console.log(`   ✅ Alto correcto (≤90%)`);
        } else {
          console.log(`   ⚠️  Alto muy grande (>90%)`);
        }
      }
      
      // Verificar botón Cerrar visible
      const closeButton = page.locator('[role="dialog"] button[aria-label="Close"], [role="dialog"] button:has-text("Cerrar")').first();
      const closeVisible = await closeButton.isVisible();
      console.log(`\n🔘 Botón Cerrar: ${closeVisible ? '✅ Visible' : '❌ No visible'}`);
      
      if (closeVisible) {
        const closeBox = await closeButton.boundingBox();
        if (closeBox) {
          console.log(`   Posición: x=${closeBox.x.toFixed(0)}, y=${closeBox.y.toFixed(0)}`);
          console.log(`   Tamaño: ${closeBox.width.toFixed(0)}x${closeBox.height.toFixed(0)}px`);
        }
      }
      
      // Verificar scroll interno
      const scrollArea = page.locator('[role="dialog"] [data-radix-scroll-area-viewport]');
      const hasScroll = await scrollArea.isVisible();
      console.log(`\n📜 Área de scroll: ${hasScroll ? '✅ Presente' : '❌ No encontrada'}`);
      
      // Intentar cerrar
      console.log(`\n5️⃣  Probando cerrar modal...`);
      await closeButton.click();
      await page.waitForTimeout(1000);
      
      const stillVisible = await page.locator('[role="dialog"]').isVisible();
      console.log(`   ${stillVisible ? '❌ Modal aún visible' : '✅ Modal cerrado correctamente'}`);
      
      await page.screenshot({ path: '/workspace/test-modal-mobile-3-cerrado.png', fullPage: true });
    }
    
    console.log('\n📸 Screenshots guardados:');
    console.log('   - test-modal-mobile-1-login.png');
    console.log('   - test-modal-mobile-2-dashboard.png');
    console.log('   - test-modal-mobile-3-cerrado.png');
    
  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}`);
    await page.screenshot({ path: '/workspace/test-modal-mobile-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testModalMovil();
