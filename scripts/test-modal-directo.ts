import { chromium } from 'playwright';

async function testModalDirecto() {
  const browser = await chromium.launch({ headless: true });
  
  // Contexto móvil
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true,
  });
  
  const page = await context.newPage();
  
  console.log('📱 Test directo del código del modal\n');
  
  try {
    // 1. Ver landing page
    console.log('1️⃣  Capturando landing page...');
    await page.goto('http://157.180.119.236/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/workspace/test-modal-landing.png', fullPage: true });
    console.log('  ✅ Screenshot guardado: test-modal-landing.png');
    
    // 2. Verificar código del componente en el servidor
    console.log('\n2️⃣  Verificando código del componente en servidor...');
    const response = await fetch('http://157.180.119.236/_next/static/chunks/app/(dashboard)/dashboard/page-*.js')
      .catch(() => null);
    
    if (response && response.ok) {
      const code = await response.text();
      if (code.includes('w-[95vw]')) {
        console.log('  ✅ Código actualizado encontrado en bundle');
      } else {
        console.log('  ⚠️  No se encontró el código actualizado');
      }
    }
    
    // 3. Ver qué archivos están en _next/static
    console.log('\n3️⃣  Probando acceso al dashboard (aunque requiera auth)...');
    await page.goto('http://157.180.119.236/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/test-modal-dashboard-auth.png', fullPage: true });
    console.log('  ✅ Screenshot guardado: test-modal-dashboard-auth.png');
    
    console.log('\n📸 Screenshots creados. Revisa localmente para verificar el estado de la app');
    
  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testModalDirecto();
