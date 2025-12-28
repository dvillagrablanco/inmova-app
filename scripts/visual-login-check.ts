/**
 * Script para verificar login visualmente y capturar screenshots
 * Usa puppeteer para mayor control
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function visualLoginCheck() {
  console.log('\n' + '═'.repeat(70));
  console.log('🔐 VERIFICACIÓN VISUAL DE LOGIN CON SCREENSHOTS');
  console.log('═'.repeat(70) + '\n');

  // Crear directorio de resultados
  const resultsDir = path.join(process.cwd(), 'visual-test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  let browser;
  
  try {
    // Lanzar browser
    console.log('🌐 Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('   ✅ Navegador iniciado\n');

    // PASO 1: Navegar a login
    console.log('📍 PASO 1: Navegando a la página de login...');
    console.log('   URL: https://inmovaapp.com/login');
    
    await page.goto('https://inmovaapp.com/login', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    
    console.log('   ✅ Página cargada');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Screenshot 1
    const screenshot1 = path.join(resultsDir, '01-pagina-login-inicial.png');
    await page.screenshot({ path: screenshot1, fullPage: true });
    console.log(`   📸 Screenshot guardado: ${screenshot1}\n`);

    // PASO 2: Verificar elementos
    console.log('📍 PASO 2: Verificando elementos del formulario...');
    
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');

    console.log(`   ${emailInput ? '✅' : '❌'} Campo de email`);
    console.log(`   ${passwordInput ? '✅' : '❌'} Campo de password`);
    console.log(`   ${submitButton ? '✅' : '❌'} Botón de submit\n`);

    if (!emailInput || !passwordInput || !submitButton) {
      console.log('   ❌ Faltan elementos del formulario');
      const html = await page.content();
      fs.writeFileSync(path.join(resultsDir, 'page-html.html'), html);
      console.log('   📄 HTML guardado para debugging\n');
      return false;
    }

    // PASO 3: Llenar formulario
    console.log('📍 PASO 3: Llenando formulario...');
    console.log('   📧 Email: admin@inmova.app');
    console.log('   🔑 Password: Test1234!');

    await page.type('input[type="email"]', 'admin@inmova.app', { delay: 50 });
    await page.type('input[type="password"]', 'Test1234!', { delay: 50 });
    
    console.log('   ✅ Formulario llenado');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Screenshot 2
    const screenshot2 = path.join(resultsDir, '02-formulario-llenado.png');
    await page.screenshot({ path: screenshot2, fullPage: true });
    console.log(`   📸 Screenshot guardado: ${screenshot2}\n`);

    // PASO 4: Submit
    console.log('📍 PASO 4: Enviando formulario...');
    
    // Escuchar respuesta de la API
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/auth/callback/credentials'),
      { timeout: 15000 }
    ).catch(() => null);

    await page.click('button[type="submit"]');
    console.log('   ✅ Click realizado');
    console.log('   ⏳ Esperando respuesta...');

    const authResponse = await responsePromise;
    
    if (authResponse) {
      console.log(`   📊 Status de auth: ${authResponse.status()}`);
    }

    // Esperar navegación o cambios
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Screenshot 3
    const screenshot3 = path.join(resultsDir, '03-despues-submit.png');
    await page.screenshot({ path: screenshot3, fullPage: true });
    console.log(`   📸 Screenshot guardado: ${screenshot3}\n`);

    // PASO 5: Verificar resultado
    console.log('📍 PASO 5: Verificando resultado...');
    
    const currentUrl = page.url();
    console.log(`   📍 URL actual: ${currentUrl}`);

    // Buscar mensajes de error
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasError = /incorrect|invalid|wrong|error|fail|incorrecto|inválido/i.test(pageText);

    if (hasError) {
      console.log('   ⚠️  Posibles mensajes de error detectados');
    } else {
      console.log('   ✅ No se detectaron errores');
    }

    // Verificar si salimos de /login
    const loginSuccess = !currentUrl.includes('/login');
    
    if (loginSuccess) {
      console.log('   ✅ ¡LOGIN EXITOSO! - Salimos de /login');
      console.log(`   📍 Nueva ubicación: ${currentUrl}`);
    } else {
      console.log('   ❌ Login falló - Seguimos en /login');
    }

    // Screenshot 4
    const screenshot4 = path.join(resultsDir, '04-resultado-final.png');
    await page.screenshot({ path: screenshot4, fullPage: true });
    console.log(`\n   📸 Screenshot guardado: ${screenshot4}\n`);

    // Guardar HTML final
    const finalHtml = await page.content();
    fs.writeFileSync(path.join(resultsDir, 'final-page.html'), finalHtml);
    console.log(`   📄 HTML final guardado\n`);

    console.log('═'.repeat(70));
    console.log('📁 RESULTADOS:');
    console.log(`   Directorio: ${resultsDir}`);
    console.log('   - 01-pagina-login-inicial.png');
    console.log('   - 02-formulario-llenado.png');
    console.log('   - 03-despues-submit.png');
    console.log('   - 04-resultado-final.png');
    console.log('   - final-page.html');
    console.log('═'.repeat(70) + '\n');

    if (loginSuccess) {
      console.log('✅ RESULTADO: Login funciona correctamente\n');
      return true;
    } else {
      console.log('❌ RESULTADO: Login no funcionó como esperado\n');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Navegador cerrado\n');
    }
  }
}

// Ejecutar
visualLoginCheck()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
