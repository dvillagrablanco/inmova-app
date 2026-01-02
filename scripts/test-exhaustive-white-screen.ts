import { chromium } from 'playwright';

async function testExhaustive() {
  console.log('🔬 Test Exhaustivo de Pantalla Blanca\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Arrays para capturar TODOS los logs
  const allConsole: Array<{time: number, type: string, text: string}> = [];
  const allErrors: Array<{time: number, message: string}> = [];
  const allNetworkErrors: string[] = [];
  
  const startTime = Date.now();
  
  // Capturar TODO en consola
  page.on('console', msg => {
    const elapsed = Date.now() - startTime;
    const entry = {
      time: elapsed,
      type: msg.type(),
      text: msg.text()
    };
    allConsole.push(entry);
    
    // Log inmediato de errores
    if (msg.type() === 'error') {
      console.log(`❌ [${elapsed}ms] Console Error: ${msg.text()}`);
    }
  });
  
  // Capturar errores de página
  page.on('pageerror', error => {
    const elapsed = Date.now() - startTime;
    allErrors.push({
      time: elapsed,
      message: error.message
    });
    console.log(`❌ [${elapsed}ms] Page Error: ${error.message}`);
  });
  
  // Network errors
  page.on('requestfailed', request => {
    const msg = `${request.url()} - ${request.failure()?.errorText}`;
    allNetworkErrors.push(msg);
    console.log(`❌ Network Error: ${msg}`);
  });
  
  try {
    console.log('📍 Navegando a http://157.180.119.236/landing\n');
    
    await page.goto('http://157.180.119.236/landing', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    console.log('✅ DOMContentLoaded alcanzado\n');
    
    // Monitorear estado DOM cada 500ms durante 5 segundos
    console.log('⏱️  Monitoreando estado DOM cada 500ms...\n');
    
    for (let i = 0; i <= 10; i++) {
      await page.waitForTimeout(500);
      
      const state = await page.evaluate(() => {
        const body = document.body;
        const main = document.querySelector('main');
        const nav = document.querySelector('nav');
        
        // Get computed styles
        const bodyStyles = window.getComputedStyle(body);
        const mainStyles = main ? window.getComputedStyle(main) : null;
        
        return {
          timestamp: Date.now(),
          bodyText: body.innerText.length,
          bodyVisible: body.offsetWidth > 0 && body.offsetHeight > 0,
          bodyDisplay: bodyStyles.display,
          bodyVisibility: bodyStyles.visibility,
          bodyOpacity: bodyStyles.opacity,
          bodyBgColor: bodyStyles.backgroundColor,
          mainExists: !!main,
          mainVisible: main ? (main as HTMLElement).offsetWidth > 0 : false,
          mainDisplay: mainStyles?.display,
          mainOpacity: mainStyles?.opacity,
          navExists: !!nav,
          navVisible: nav ? (nav as HTMLElement).offsetWidth > 0 : false,
          totalElements: document.querySelectorAll('*').length
        };
      });
      
      const elapsed = Date.now() - startTime;
      
      console.log(`[${elapsed}ms] Body:${state.bodyText}chars Main:${state.mainVisible?'✅':'❌'} Nav:${state.navVisible?'✅':'❌'} Display:${state.bodyDisplay} Opacity:${state.bodyOpacity}`);
      
      // Screenshot cada segundo
      if (i % 2 === 0) {
        await page.screenshot({ path: `/workspace/test-${Math.floor(i/2)}s.png` });
      }
      
      // Detectar si se pone blanco repentinamente
      if (i > 2 && state.bodyText < 100) {
        console.log(`\n⚠️ PANTALLA BLANCA DETECTADA en ${elapsed}ms!`);
        console.log(`Estado: ${JSON.stringify(state, null, 2)}\n`);
        break;
      }
    }
    
    // Resumen final
    console.log('\n📋 RESUMEN:\n');
    
    console.log(`Console Logs: ${allConsole.length}`);
    if (allConsole.length > 0) {
      console.log('  Primeros 10:');
      allConsole.slice(0, 10).forEach(log => {
        console.log(`    [${log.time}ms] [${log.type}] ${log.text.substring(0, 100)}`);
      });
    }
    
    console.log(`\nPage Errors: ${allErrors.length}`);
    if (allErrors.length > 0) {
      allErrors.forEach(err => {
        console.log(`  [${err.time}ms] ${err.message}`);
      });
    }
    
    console.log(`\nNetwork Errors: ${allNetworkErrors.length}`);
    if (allNetworkErrors.length > 0) {
      allNetworkErrors.forEach(err => console.log(`  ${err}`));
    }
    
    // Estado final
    const finalState = await page.evaluate(() => {
      return {
        bodyClasses: document.body.className,
        bodyChildren: document.body.children.length,
        bodyHTML: document.body.innerHTML.substring(0, 500),
        hasMain: !!document.querySelector('main'),
        hasNav: !!document.querySelector('nav'),
        hasFooter: !!document.querySelector('footer')
      };
    });
    
    console.log('\n🎯 Estado Final:');
    console.log(`  Body Classes: ${finalState.bodyClasses}`);
    console.log(`  Body Children: ${finalState.bodyChildren}`);
    console.log(`  Has Main: ${finalState.hasMain ? '✅' : '❌'}`);
    console.log(`  Has Nav: ${finalState.hasNav ? '✅' : '❌'}`);
    console.log(`  Has Footer: ${finalState.hasFooter ? '✅' : '❌'}`);
    
    console.log('\n📸 Screenshots guardados: test-0s.png, test-1s.png, test-2s.png, test-3s.png, test-4s.png, test-5s.png');
    
  } catch (error: any) {
    console.error('\n❌ Error durante test:', error.message);
  } finally {
    await browser.close();
  }
}

testExhaustive().catch(console.error);
