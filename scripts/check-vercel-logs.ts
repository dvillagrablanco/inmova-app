import { chromium } from 'playwright';

async function checkVercelLogs() {
  console.log('🚀 Iniciando navegador...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Ir al deployment específico
    console.log('📍 Navegando al deployment en Vercel...');
    const deploymentUrl = 'https://vercel.com/inmova/inmova-app/FLDVeyr8z5nKS6ezEeXRD8Jc1ZDp';
    await page.goto(deploymentUrl, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Esperar a que cargue
    await page.waitForTimeout(3000);
    
    // Si pide login, hacer login con GitHub
    const needsLogin = await page.locator('text=/log in|sign in/i').isVisible().catch(() => false);
    
    if (needsLogin) {
      console.log('🔐 Requiere autenticación, intentando login con GitHub...');
      await page.click('text=/continue with github/i');
      await page.waitForTimeout(2000);
      
      // Nota: Esto requeriría credenciales reales de GitHub
      console.log('⚠️ Se requiere autenticación manual en GitHub');
      console.log('📋 URL actual:', page.url());
    }
    
    // Tomar screenshot del estado actual
    await page.screenshot({ path: '/tmp/vercel-deployment.png', fullPage: true });
    console.log('📸 Screenshot guardado en /tmp/vercel-deployment.png');
    
    // Intentar extraer logs visibles
    console.log('📋 Buscando logs de build...');
    
    // Buscar contenido de logs
    const logContent = await page.locator('pre, code, [class*="log"], [class*="console"]').allTextContents();
    
    if (logContent.length > 0) {
      console.log('\n🔍 LOGS ENCONTRADOS:');
      console.log('='.repeat(80));
      logContent.forEach((log, i) => {
        if (log.trim().length > 0) {
          console.log(`\n--- Log ${i + 1} ---`);
          console.log(log.trim());
        }
      });
      console.log('='.repeat(80));
    } else {
      console.log('⚠️ No se encontraron logs visibles sin autenticación');
    }
    
    // Buscar errores específicos en la página
    const errorElements = await page.locator('[class*="error"], [class*="failed"], .text-red-500, .text-destructive').allTextContents();
    if (errorElements.length > 0) {
      console.log('\n❌ ERRORES DETECTADOS:');
      errorElements.forEach(err => {
        if (err.trim().length > 0) {
          console.log('  -', err.trim());
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/vercel-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

checkVercelLogs().catch(console.error);
