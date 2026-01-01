const { chromium } = require('playwright');

/**
 * Script para identificar QUÉ ARCHIVO tiene el error "Invalid or unexpected token"
 */

(async () => {
  console.log('🔍 IDENTIFICANDO ARCHIVO CON ERROR DE SINTAXIS');
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
  
  // Capturar TODOS los detalles del error
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
    });
  });
  
  // Capturar errores de red con detalles
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('.js')) {
      errors.push({
        type: 'network',
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // Capturar console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        type: 'console',
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  console.log('\nNavigating to /landing...\n');
  
  try {
    await page.goto('https://inmovaapp.com/landing', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.log(`❌ Navigation failed: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 ERRORES CAPTURADOS');
  console.log('='.repeat(80));
  
  if (errors.length === 0) {
    console.log('\n✅ No se capturaron errores');
  } else {
    console.log(`\n❌ Total errores: ${errors.length}\n`);
    
    errors.forEach((error, idx) => {
      console.log(`\n[${idx + 1}] ${error.type || 'pageerror'}`);
      console.log('-'.repeat(80));
      
      if (error.message) {
        console.log(`Message: ${error.message}`);
      }
      
      if (error.stack) {
        console.log(`Stack:\n${error.stack}`);
      }
      
      if (error.location) {
        console.log(`Location: ${JSON.stringify(error.location, null, 2)}`);
      }
      
      if (error.url) {
        console.log(`URL: ${error.url}`);
        console.log(`Status: ${error.status}`);
      }
      
      if (error.text) {
        console.log(`Text: ${error.text}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('ANÁLISIS COMPLETO');
  console.log('='.repeat(80));
  
  // Buscar el error específico
  const syntaxError = errors.find(e => 
    e.message && e.message.includes('Invalid or unexpected token')
  );
  
  if (syntaxError) {
    console.log('\n🎯 ERROR ENCONTRADO:\n');
    console.log(`Mensaje: ${syntaxError.message}`);
    
    if (syntaxError.stack) {
      const stackLines = syntaxError.stack.split('\n');
      console.log('\nStack trace (primeras líneas):');
      stackLines.slice(0, 10).forEach(line => {
        console.log(`  ${line}`);
        
        // Buscar nombres de archivos en el stack
        const fileMatch = line.match(/https?:\/\/[^\s)]+\.js/);
        if (fileMatch) {
          console.log(`  ⚠️ ARCHIVO SOSPECHOSO: ${fileMatch[0]}`);
        }
      });
    }
  } else {
    console.log('\n⚠️ No se encontró el error "Invalid or unexpected token"');
    console.log('   Pero se capturaron estos otros errores:');
    errors.slice(0, 3).forEach(e => {
      console.log(`   - ${e.message || e.text || e.url}`);
    });
  }
  
  process.exit(0);
})();
