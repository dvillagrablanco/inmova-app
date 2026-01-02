import { chromium } from 'playwright';

async function testModalConLogs() {
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true,
  });
  
  const page = await context.newPage();
  
  // Capturar console logs
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Onboarding') || msg.text().includes('Modal')) {
      console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
    }
  });
  
  // Capturar errores
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  console.log('📱 Test con logs de navegador\n');
  
  try {
    // 1. Login
    console.log('1️⃣  Navegando y haciendo login...');
    await page.goto('http://157.180.119.236/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    await page.fill('input[name="email"]', 'superadmin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Esperar redireccion
    await page.waitForTimeout(5000);
    console.log(`   URL actual: ${page.url()}`);
    
    // 2. Esperar a que cargue el dashboard
    console.log('\n2️⃣  Esperando dashboard...');
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });
    console.log('   ✅ Dashboard cargado');
    
    // 3. Esperar un poco más para que el modal aparezca
    await page.waitForTimeout(3000);
    
    // 4. Verificar si existe el dialog
    console.log('\n3️⃣  Buscando modal...');
    const dialogExists = await page.locator('[role="dialog"]').count();
    console.log(`   Dialogs encontrados: ${dialogExists}`);
    
    if (dialogExists > 0) {
      const isVisible = await page.locator('[role="dialog"]').first().isVisible();
      console.log(`   Modal visible: ${isVisible ? '✅' : '❌'}`);
      
      if (isVisible) {
        // Capturar dimensiones
        const box = await page.locator('[role="dialog"]').first().boundingBox();
        if (box) {
          console.log(`\n📐 DIMENSIONES:`);
          console.log(`   Ancho: ${box.width}px (viewport: 390px) = ${((box.width / 390) * 100).toFixed(1)}%`);
          console.log(`   Alto: ${box.height}px (viewport: 844px) = ${((box.height / 844) * 100).toFixed(1)}%`);
        }
      }
    } else {
      console.log('   ❌ No se encontró ningún modal');
    }
    
    // 5. Verificar si el componente SmartOnboardingWizard está en el DOM
    const componentExists = await page.evaluate(() => {
      const text = document.body.innerHTML;
      return text.includes('Onboarding') || text.includes('Bienvenido a INMOVA');
    });
    
    console.log(`\n4️⃣  Componente en DOM: ${componentExists ? '✅' : '❌'}`);
    
    // 6. Screenshot final
    await page.screenshot({ path: '/workspace/test-modal-con-logs.png', fullPage: true });
    console.log('\n📸 Screenshot guardado: test-modal-con-logs.png');
    
  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testModalConLogs();
