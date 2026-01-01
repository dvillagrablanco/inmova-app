const { chromium } = require('playwright');

(async () => {
  console.log('🔬 CAPTURA COMPLETA DEL ERROR');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({
    headless: false, // NO headless para poder ver DevTools
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--auto-open-devtools-for-tabs'],
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const allErrors = [];
  let errorCaptured = false;
  
  // Capturar console.error CON stack
  await page.on('console', async msg => {
    if (msg.type() === 'error') {
      const args = msg.args();
      const errorDetails = {
        text: msg.text(),
        location: msg.location(),
        args: [],
      };
      
      for (let i = 0; i < args.length; i++) {
        try {
          const arg = args[i];
          const jsonValue = await arg.jsonValue();
          errorDetails.args.push(jsonValue);
          
          // Si es un Error object, extraer stack
          const properties = await arg.getProperties();
          if (properties.has('stack')) {
            const stack = await properties.get('stack').jsonValue();
            errorDetails.stack = stack;
            errorCaptured = true;
          }
        } catch (e) {
          // ignore
        }
      }
      
      allErrors.push(errorDetails);
    }
  });
  
  // Capturar pageerror CON stack
  page.on('pageerror', error => {
    allErrors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    errorCaptured = true;
  });
  
  console.log('\n📍 Navegando a /landing...\n');
  
  try {
    await page.goto('https://inmovaapp.com/landing', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    await page.waitForTimeout(5000);
    
    // Ejecutar JavaScript para capturar el error directamente
    const clientErrors = await page.evaluate(() => {
      return new Promise((resolve) => {
        const errors = [];
        const originalError = console.error;
        
        console.error = function(...args) {
          const error = {
            message: args[0]?.toString(),
            stack: args[0]?.stack,
            allArgs: args.map(a => {
              if (typeof a === 'object' && a !== null) {
                return {
                  message: a.message,
                  stack: a.stack,
                  toString: a.toString(),
                };
              }
              return a;
            }),
          };
          errors.push(error);
          originalError.apply(console, args);
        };
        
        setTimeout(() => {
          resolve(errors);
        }, 3000);
      });
    });
    
    if (clientErrors.length > 0) {
      console.log('\n📥 ERRORES CAPTURADOS DESDE EL NAVEGADOR:');
      clientErrors.forEach((err, idx) => {
        console.log(`\n[${idx + 1}] ${JSON.stringify(err, null, 2)}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Error navegando: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(80));
  console.log('RESUMEN DE ERRORES CAPTURADOS');
  console.log('='.repeat(80));
  
  if (allErrors.length === 0) {
    console.log('\n⚠️ No se capturaron errores');
  } else {
    console.log(`\n❌ Total errores: ${allErrors.length}\n`);
    allErrors.forEach((error, idx) => {
      console.log(`\n[${idx + 1}]`);
      console.log(JSON.stringify(error, null, 2));
    });
  }
  
  if (errorCaptured) {
    console.log('\n✅ Stack trace capturado exitosamente');
  } else {
    console.log('\n⚠️ No se pudo capturar stack trace');
  }
  
  process.exit(0);
})();
