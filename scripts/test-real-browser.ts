import { chromium } from 'playwright';

async function testRealBrowser() {
  console.log('🌐 Probando en navegador visible (no headless)...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down para ver qué pasa
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capturar TODO
  const allLogs: string[] = [];
  
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    allLogs.push(text);
    console.log(text);
  });
  
  page.on('pageerror', error => {
    const text = `[PAGE ERROR] ${error.message}`;
    allLogs.push(text);
    console.log(text);
  });
  
  page.on('crash', () => {
    console.log('[CRASH] Page crashed!');
  });
  
  try {
    console.log('📍 Navegando...\n');
    await page.goto('http://157.180.119.236/landing', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('\n✅ Página cargada\n');
    console.log('⏱️  Esperando 5 segundos para observar...\n');
    
    // Tomar screenshots en intervalos
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `/workspace/screenshot-${i}s.png` });
      
      const state = await page.evaluate(() => {
        const body = document.body;
        const main = document.querySelector('main');
        return {
          bodyVisible: body.offsetWidth > 0 && body.offsetHeight > 0,
          mainVisible: main ? (main as HTMLElement).offsetWidth > 0 : false,
          bodyBg: window.getComputedStyle(body).backgroundColor,
          mainBg: main ? window.getComputedStyle(main).backgroundColor : 'N/A',
          hasContent: body.innerText.length > 100
        };
      });
      
      console.log(`📸 ${i+1}s: body=${state.bodyVisible}, main=${state.mainVisible}, content=${state.hasContent}, bg=${state.bodyBg}`);
    }
    
    console.log('\n📋 Todos los logs capturados:');
    allLogs.forEach(log => console.log(log));
    
    console.log('\n⏸️  Dejando navegador abierto 10 segundos para inspección manual...');
    await page.waitForTimeout(10000);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testRealBrowser().catch(console.error);
