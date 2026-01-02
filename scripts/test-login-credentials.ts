#!/usr/bin/env ts-node
/**
 * Script para testear login con las credenciales actualizadas
 */

import { chromium } from 'playwright';

const TEST_CREDENTIALS = [
  {
    email: 'admin@inmova.app',
    password: 'Admin123!',
    name: 'Superadministrador',
  },
  {
    email: 'test@inmova.app',
    password: 'Test123456!',
    name: 'Usuario de Prueba',
  },
];

async function testLogin() {
  console.log('🧪 Probando credenciales de login...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let successCount = 0;
  let failCount = 0;

  for (const cred of TEST_CREDENTIALS) {
    console.log(`📝 Probando: ${cred.name} (${cred.email})`);

    try {
      // Navegar a login
      await page.goto('http://157.180.119.236/login', {
        waitUntil: 'networkidle',
        timeout: 10000,
      });

      // Llenar formulario
      await page.fill('input[name="email"]', cred.email);
      await page.fill('input[name="password"]', cred.password);

      // Submit
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth') &&
          response.request().method() === 'POST',
        { timeout: 10000 }
      );

      await page.click('button[type="submit"]');

      const response = await responsePromise;

      if (response.status() === 200) {
        // Esperar redirect
        await page.waitForURL(
          (url) =>
            url.pathname.includes('/dashboard') ||
            url.pathname.includes('/admin') ||
            url.pathname.includes('/portal'),
          { timeout: 10000 }
        );

        console.log(`  ✅ Login exitoso - Redirigido a: ${page.url()}\n`);
        successCount++;
      } else {
        console.log(`  ❌ Login falló - Status: ${response.status()}\n`);
        failCount++;
      }
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}\n`);
      failCount++;
    }
  }

  await browser.close();

  console.log('=' + '='.repeat(60));
  console.log('📊 RESUMEN:');
  console.log(`  ✅ Exitosos: ${successCount}/${TEST_CREDENTIALS.length}`);
  console.log(`  ❌ Fallidos: ${failCount}/${TEST_CREDENTIALS.length}`);
  console.log('='.repeat(61));

  if (successCount === TEST_CREDENTIALS.length) {
    console.log('\n✅ ¡Todos los logins funcionan correctamente!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Algunos logins fallaron');
    process.exit(1);
  }
}

testLogin().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
