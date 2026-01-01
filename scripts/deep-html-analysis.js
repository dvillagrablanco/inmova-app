const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Análisis profundo del HTML renderizado para encontrar el error exacto
 */

(async () => {
  console.log('🔬 ANÁLISIS PROFUNDO DEL HTML Y SCRIPTS INLINE');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  const errors = [];
  const scripts = [];
  
  // Capturar TODOS los detalles de errores
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  });
  
  // Interceptar evaluación de scripts
  await page.addInitScript(() => {
    const originalEval = window.eval;
    window.eval = function(code) {
      try {
        return originalEval.call(this, code);
      } catch (e) {
        console.error('[EVAL ERROR]', e.message, 'CODE:', code.substring(0, 200));
        throw e;
      }
    };
  });
  
  console.log('\nNavigando a /landing...\n');
  
  try {
    await page.goto('https://inmovaapp.com/landing', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    await page.waitForTimeout(3000);
    
    // Obtener HTML completo
    const html = await page.content();
    fs.writeFileSync('/tmp/landing-full.html', html);
    console.log('✅ HTML completo guardado en /tmp/landing-full.html');
    
    // Extraer TODOS los scripts inline
    const inlineScripts = await page.evaluate(() => {
      const scripts = [];
      document.querySelectorAll('script:not([src])').forEach((script, idx) => {
        scripts.push({
          index: idx,
          id: script.id || 'no-id',
          content: script.textContent.substring(0, 500),
          fullLength: script.textContent.length,
        });
      });
      return scripts;
    });
    
    console.log(`\n📜 Scripts inline encontrados: ${inlineScripts.length}\n`);
    inlineScripts.forEach(script => {
      console.log(`[${script.index}] ID: ${script.id} (${script.fullLength} chars)`);
      if (script.fullLength < 200) {
        console.log(`    Content: ${script.content}`);
      }
    });
    
  } catch (error) {
    console.log(`❌ Error navegando: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(80));
  console.log('ERRORES CAPTURADOS');
  console.log('='.repeat(80));
  
  if (errors.length === 0) {
    console.log('\n⚠️ No se capturaron errores (pueden estar silenciados)');
  } else {
    console.log(`\n❌ Total errores: ${errors.length}\n`);
    errors.forEach((error, idx) => {
      console.log(`\n[${idx + 1}] ${error.name}: ${error.message}`);
      if (error.stack) {
        console.log('Stack (primeras líneas):');
        error.stack.split('\n').slice(0, 5).forEach(line => {
          console.log(`  ${line}`);
        });
      }
    });
  }
  
  process.exit(0);
})();
