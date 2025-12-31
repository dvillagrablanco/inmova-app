/**
 * Script rápido para identificar errores específicos en console
 */

import { chromium } from 'playwright';

async function checkPage(url: string) {
  console.log(`\n🔍 Verificando: ${url}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMessages: any[] = [];
  const errors: any[] = [];

  // Capturar TODOS los mensajes de consola
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    consoleMessages.push({ type, text, location });

    if (type === 'error' || type === 'warning') {
      console.log(`  [${type.toUpperCase()}] ${text}`);
      if (location.url) {
        console.log(`    → ${location.url}:${location.lineNumber}`);
      }
    }
  });

  // Capturar errores de página
  page.on('pageerror', (error) => {
    errors.push({
      message: error.message,
      stack: error.stack,
    });
    console.log(`  [PAGE ERROR] ${error.message}`);
  });

  // Capturar errores de red
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`  [NETWORK ${response.status()}] ${response.url()}`);
    }
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000); // Esperar a que JavaScript ejecute

    console.log(`\n📊 Total mensajes: ${consoleMessages.length}`);
    console.log(`📊 Errores: ${consoleMessages.filter((m) => m.type === 'error').length}`);
    console.log(`📊 Warnings: ${consoleMessages.filter((m) => m.type === 'warning').length}`);
  } catch (error: any) {
    console.log(`\n❌ Error cargando página: ${error.message}`);
  }

  await browser.close();
}

// Verificar homepage primero
checkPage('https://www.inmovaapp.com/')
  .then(() => {
    console.log('\n✅ Verificación completada');
  })
  .catch(console.error);
