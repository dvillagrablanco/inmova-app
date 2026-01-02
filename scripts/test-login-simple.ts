import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navegando a login...');
    await page.goto('http://157.180.119.236/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log('Esperando 5 segundos...');
    await page.waitForTimeout(5000);

    // Screenshot
    await page.screenshot({ path: '/workspace/scripts/screenshots/login-debug.png', fullPage: true });
    console.log('Screenshot guardado');

    // Check what's on the page
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\nContenido de la página:');
    console.log(bodyText.substring(0, 500));

    // Check for email input
    const emailInput = await page.$('input[name="email"]');
    console.log(`\nInput de email encontrado: ${emailInput ? 'SÍ' : 'NO'}`);

    if (!emailInput) {
      // Try other selectors
      const allInputs = await page.$$('input');
      console.log(`Total inputs en la página: ${allInputs.length}`);
      
      for (let i = 0; i < allInputs.length; i++) {
        const type = await allInputs[i].getAttribute('type');
        const name = await allInputs[i].getAttribute('name');
        const id = await allInputs[i].getAttribute('id');
        console.log(`  Input ${i}: type="${type}", name="${name}", id="${id}"`);
      }
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin();
