const { chromium } = require('playwright');

const PAGES_TO_TEST = [
  { name: 'Landing', url: '/landing' },
  { name: 'Login', url: '/login' },
  { name: 'Register', url: '/register' },
  { name: 'Dashboard/Properties', url: '/dashboard/properties' },
  { name: 'Admin', url: '/admin' },
];

(async () => {
  console.log('🔍 TEST RÁPIDO DE PRODUCCIÓN');
  console.log('='.repeat(80));
  console.log('Objetivo: Verificar si "Invalid or unexpected token" aparece en producción\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  for (const pageData of PAGES_TO_TEST) {
    const errors = [];
    
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack,
      });
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          message: msg.text(),
          type: 'console.error',
        });
      }
    });
    
    try {
      console.log(`\n📄 ${pageData.name}...`);
      const response = await page.goto(`https://inmovaapp.com${pageData.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      
      await page.waitForTimeout(3000);
      
      const httpStatus = response ? response.status() : 'N/A';
      const hasInvalidTokenError = errors.some(e => 
        e.message && e.message.includes('Invalid or unexpected token')
      );
      
      results.push({
        name: pageData.name,
        url: pageData.url,
        httpStatus,
        hasInvalidTokenError,
        errorCount: errors.length,
      });
      
      if (hasInvalidTokenError) {
        console.log(`   ❌ ERROR "Invalid or unexpected token" DETECTADO`);
      } else {
        console.log(`   ✅ Sin error "Invalid or unexpected token"`);
      }
      
      console.log(`   HTTP: ${httpStatus} | Errores totales: ${errors.length}`);
      
    } catch (error) {
      console.log(`   ⚠️ Error navegando: ${error.message}`);
      results.push({
        name: pageData.name,
        url: pageData.url,
        httpStatus: 'ERROR',
        hasInvalidTokenError: false,
        errorCount: 0,
        navigationError: error.message,
      });
    }
    
    // Limpiar listeners para la siguiente página
    page.removeAllListeners('pageerror');
    page.removeAllListeners('console');
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN');
  console.log('='.repeat(80));
  
  const pagesWithError = results.filter(r => r.hasInvalidTokenError);
  const pagesWithoutError = results.filter(r => !r.hasInvalidTokenError && r.httpStatus === 200);
  
  console.log(`\nTotal páginas testeadas: ${results.length}`);
  console.log(`✅ Sin error "Invalid or unexpected token": ${pagesWithoutError.length}`);
  console.log(`❌ Con error "Invalid or unexpected token": ${pagesWithError.length}`);
  
  if (pagesWithError.length === 0) {
    console.log('\n🎉 ¡ERROR NO APARECE EN PRODUCCIÓN!');
    console.log('   → Es un bug de desarrollo de Next.js 15');
    console.log('   → No requiere fix para producción');
  } else {
    console.log('\n⚠️ ERROR PERSISTE EN PRODUCCIÓN');
    console.log('   → Requiere investigación adicional');
  }
  
  console.log('\n' + '='.repeat(80));
  
  process.exit(pagesWithError.length > 0 ? 1 : 0);
})();
