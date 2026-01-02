import { chromium } from 'playwright';

async function diagnoseWhiteScreen() {
  console.log('🔍 Diagnosticando pantalla blanca...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capturar errores de consola
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.log(`❌ Console Error: ${text}`);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(text);
    }
  });
  
  // Capturar errores de página
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  // Capturar network errors
  page.on('requestfailed', request => {
    console.log(`❌ Network Error: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('📍 Navegando a http://157.180.119.236/landing\n');
    
    // Navegar a la landing
    await page.goto('http://157.180.119.236/landing', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    console.log('✅ Página cargada (DOMContentLoaded)\n');
    
    // Esperar 2 segundos para ver si se pone blanca
    console.log('⏱️  Esperando 2 segundos para detectar pantalla blanca...\n');
    await page.waitForTimeout(2000);
    
    // Capturar estado del DOM
    const bodyHTML = await page.evaluate(() => {
      return {
        hasContent: document.body.innerText.length > 100,
        visibleElements: document.querySelectorAll('*:not(script):not(style)').length,
        bodyText: document.body.innerText.substring(0, 500),
        bodyBackgroundColor: window.getComputedStyle(document.body).backgroundColor,
        bodyDisplay: window.getComputedStyle(document.body).display,
        bodyVisibility: window.getComputedStyle(document.body).visibility,
        bodyOpacity: window.getComputedStyle(document.body).opacity,
        hasNavigation: !!document.querySelector('nav'),
        hasMain: !!document.querySelector('main'),
        hasFooter: !!document.querySelector('footer'),
        bodyClasses: document.body.className,
        bodyChildren: document.body.children.length
      };
    });
    
    console.log('📊 Estado del DOM:');
    console.log(`  • Tiene contenido: ${bodyHTML.hasContent ? '✅' : '❌'}`);
    console.log(`  • Elementos visibles: ${bodyHTML.visibleElements}`);
    console.log(`  • Navegación presente: ${bodyHTML.hasNavigation ? '✅' : '❌'}`);
    console.log(`  • Main presente: ${bodyHTML.hasMain ? '✅' : '❌'}`);
    console.log(`  • Footer presente: ${bodyHTML.hasFooter ? '✅' : '❌'}`);
    console.log(`  • Background color: ${bodyHTML.bodyBackgroundColor}`);
    console.log(`  • Display: ${bodyHTML.bodyDisplay}`);
    console.log(`  • Visibility: ${bodyHTML.bodyVisibility}`);
    console.log(`  • Opacity: ${bodyHTML.bodyOpacity}`);
    console.log(`  • Body classes: ${bodyHTML.bodyClasses}`);
    console.log(`  • Body children: ${bodyHTML.bodyChildren}\n`);
    
    if (bodyHTML.hasContent) {
      console.log('📝 Contenido de texto (primeros 500 chars):');
      console.log(bodyHTML.bodyText.substring(0, 500) + '...\n');
    }
    
    // Screenshot
    await page.screenshot({ path: '/workspace/landing-screenshot.png', fullPage: true });
    console.log('📸 Screenshot guardado en: /workspace/landing-screenshot.png\n');
    
    // Verificar elementos específicos
    const elementChecks = await page.evaluate(() => {
      return {
        navigation: {
          exists: !!document.querySelector('nav'),
          visible: !!document.querySelector('nav') && 
                   window.getComputedStyle(document.querySelector('nav')!).display !== 'none'
        },
        logo: {
          exists: !!document.querySelector('nav svg'),
          text: document.querySelector('nav span')?.textContent
        },
        buttons: {
          login: !!document.querySelector('a[href="/login"]'),
          register: !!document.querySelector('a[href="/register"]')
        },
        main: {
          exists: !!document.querySelector('main'),
          visible: !!document.querySelector('main') && 
                   window.getComputedStyle(document.querySelector('main')!).display !== 'none'
        }
      };
    });
    
    console.log('🔍 Elementos específicos:');
    console.log(`  • Navigation visible: ${elementChecks.navigation.visible ? '✅' : '❌'}`);
    console.log(`  • Logo text: ${elementChecks.logo.text || '❌ No encontrado'}`);
    console.log(`  • Botón Login: ${elementChecks.buttons.login ? '✅' : '❌'}`);
    console.log(`  • Botón Registro: ${elementChecks.buttons.register ? '✅' : '❌'}`);
    console.log(`  • Main visible: ${elementChecks.main.visible ? '✅' : '❌'}\n`);
    
    // Resumen de errores
    console.log('📋 Resumen de errores:\n');
    console.log(`  Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 5).forEach(err => console.log(`    • ${err}`));
    }
    
    console.log(`\n  Page Errors: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      pageErrors.slice(0, 5).forEach(err => console.log(`    • ${err}`));
    }
    
    console.log(`\n  Console Warnings: ${consoleWarnings.length}`);
    
    // Diagnóstico
    console.log('\n🎯 DIAGNÓSTICO:');
    if (!bodyHTML.hasContent) {
      console.log('  ❌ PROBLEMA: La página no tiene contenido después de 2 segundos');
      console.log('  Posibles causas:');
      console.log('    1. Error de JavaScript que bloquea el render');
      console.log('    2. Hydration error que limpia el DOM');
      console.log('    3. CSS que oculta todo el contenido');
    } else if (!elementChecks.navigation.visible || !elementChecks.main.visible) {
      console.log('  ⚠️  PROBLEMA: Contenido existe pero no es visible');
      console.log('  Posibles causas:');
      console.log('    1. CSS display:none o visibility:hidden');
      console.log('    2. Opacity: 0');
      console.log('    3. Elementos fuera de viewport');
    } else {
      console.log('  ✅ El contenido parece estar presente y visible');
    }
    
  } catch (error: any) {
    console.error('❌ Error durante diagnóstico:', error.message);
  } finally {
    await browser.close();
  }
}

diagnoseWhiteScreen().catch(console.error);
