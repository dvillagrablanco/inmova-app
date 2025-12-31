/**
 * Verificación rápida del deployment en Vercel
 */

import { chromium } from 'playwright';

async function verifyDeployment() {
  console.log('🔍 Verificando deployment en inmovaapp.com...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors: string[] = [];
  const consoleErrors: string[] = [];

  // Capturar errores de consola
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capturar errores de página
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  const pagesToCheck = ['/', '/login', '/dashboard', '/api/auth/session', '/api/health-check'];

  for (const pagePath of pagesToCheck) {
    const url = `https://inmovaapp.com${pagePath}`;
    console.log(`\n📄 Verificando: ${url}`);

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      const status = response?.status() || 0;
      console.log(`   Status: ${status}`);

      if (status >= 400) {
        errors.push(`${url} → HTTP ${status}`);
      } else {
        console.log(`   ✅ OK`);
      }

      await page.waitForTimeout(2000);
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      errors.push(`${url} → ${error.message}`);
    }
  }

  await browser.close();

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (errors.length === 0 && consoleErrors.length === 0) {
    console.log('✅ ¡TODO PERFECTO!');
    console.log('✅ No se encontraron errores');
    console.log('✅ Sitio funcionando correctamente');
  } else {
    if (errors.length > 0) {
      console.log(`❌ Errores encontrados: ${errors.length}`);
      errors.forEach((err) => console.log(`   - ${err}`));
    }

    if (consoleErrors.length > 0) {
      console.log(`\n⚠️  Console errors: ${consoleErrors.length}`);
      consoleErrors.slice(0, 5).forEach((err) => console.log(`   - ${err}`));
      if (consoleErrors.length > 5) {
        console.log(`   ... y ${consoleErrors.length - 5} más`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🌐 URLs del Sitio:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔗 Producción: https://workspace-iuuyjr9a6-inmova.vercel.app');
  console.log('  🔗 Dominio:    https://inmovaapp.com');
  console.log('═══════════════════════════════════════════════════════════\n');
}

verifyDeployment().catch(console.error);
