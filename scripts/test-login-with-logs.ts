/**
 * Script para probar login y capturar todos los logs
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';

async function testLoginWithLogs() {
  console.log('🔍 Iniciando prueba de login con captura completa de logs...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const logs: any[] = [];
  const errors: any[] = [];
  const networkErrors: any[] = [];

  // Capturar TODOS los mensajes de consola
  page.on('console', (msg) => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString(),
    };
    logs.push(logEntry);

    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  // Capturar errores de página
  page.on('pageerror', (error) => {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
    errors.push(errorEntry);
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Capturar errores de red
  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString(),
      });
      console.log(`[NETWORK ${response.status()}] ${response.url()}`);
    }
  });

  // Capturar requests fallidos
  page.on('requestfailed', (request) => {
    console.log(`[REQUEST FAILED] ${request.url()}: ${request.failure()?.errorText}`);
  });

  try {
    console.log('📄 Navegando a la página de login...\n');
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Página cargada\n');
    await page.waitForTimeout(2000);

    // Tomar screenshot del login
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('📸 Screenshot guardado: login-page.png\n');

    // Buscar el formulario de login
    console.log('🔍 Buscando formulario de login...\n');

    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = await page
      .locator('input[type="password"], input[name="password"]')
      .first();
    const submitButton = await page.locator('button[type="submit"]').first();

    const hasEmail = (await emailInput.count()) > 0;
    const hasPassword = (await passwordInput.count()) > 0;
    const hasSubmit = (await submitButton.count()) > 0;

    console.log(`📋 Formulario encontrado:`);
    console.log(`   - Email input: ${hasEmail ? '✅' : '❌'}`);
    console.log(`   - Password input: ${hasPassword ? '✅' : '❌'}`);
    console.log(`   - Submit button: ${hasSubmit ? '✅' : '❌'}\n`);

    if (hasEmail && hasPassword && hasSubmit) {
      console.log('🔐 Intentando login con credenciales de prueba...\n');

      // Intentar con credenciales de demo
      await emailInput.fill('admin@inmova.app');
      await passwordInput.fill('demo123');

      console.log('📝 Credenciales ingresadas');
      await page.waitForTimeout(1000);

      // Click en submit
      console.log('🖱️  Haciendo click en submit...\n');
      await submitButton.click();

      // Esperar navegación o error
      try {
        await page.waitForURL('**/dashboard**', { timeout: 10000 });
        console.log('✅ Login exitoso - Redirigido a dashboard\n');
      } catch (e) {
        console.log('⚠️  No se redirigió a dashboard - Verificando errores...\n');
        await page.waitForTimeout(3000);

        // Tomar screenshot después de intentar login
        await page.screenshot({ path: 'login-attempt.png', fullPage: true });
        console.log('📸 Screenshot guardado: login-attempt.png\n');
      }
    } else {
      console.log('❌ Formulario de login incompleto\n');
    }
  } catch (error: any) {
    console.log(`❌ Error durante la prueba: ${error.message}\n`);
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }

  await browser.close();

  // Resumen
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE LOGS Y ERRORES');
  console.log('════════════════════════════════════════════════════════════\n');

  console.log(`📝 Total de logs capturados: ${logs.length}`);
  console.log(`   - Errores: ${logs.filter((l) => l.type === 'error').length}`);
  console.log(`   - Warnings: ${logs.filter((l) => l.type === 'warning').length}`);
  console.log(`   - Info: ${logs.filter((l) => l.type === 'info' || l.type === 'log').length}\n`);

  if (logs.filter((l) => l.type === 'error').length > 0) {
    console.log('🔴 ERRORES DE CONSOLA:\n');
    logs
      .filter((l) => l.type === 'error')
      .forEach((log, i) => {
        console.log(`${i + 1}. ${log.text}`);
        if (log.location.url) {
          console.log(`   Ubicación: ${log.location.url}:${log.location.lineNumber}\n`);
        }
      });
  }

  if (networkErrors.length > 0) {
    console.log('🌐 ERRORES DE RED:\n');
    networkErrors.forEach((err, i) => {
      console.log(`${i + 1}. [${err.status}] ${err.url}\n`);
    });
  }

  if (errors.length > 0) {
    console.log('💥 ERRORES DE PÁGINA:\n');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.message}\n`);
    });
  }

  console.log('════════════════════════════════════════════════════════════\n');

  // Guardar logs completos en archivo
  const fs = require('fs');
  fs.writeFileSync(
    'login-logs.json',
    JSON.stringify(
      {
        logs,
        errors,
        networkErrors,
        summary: {
          totalLogs: logs.length,
          consoleErrors: logs.filter((l) => l.type === 'error').length,
          networkErrors: networkErrors.length,
          pageErrors: errors.length,
        },
      },
      null,
      2
    )
  );

  console.log('💾 Logs completos guardados en: login-logs.json\n');
}

testLoginWithLogs().catch(console.error);
