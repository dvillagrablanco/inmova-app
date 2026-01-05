#!/usr/bin/env node
/**
 * Script para debuggear el dashboard después del login
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_USER = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

async function main() {
  console.log('=' .repeat(70));
  console.log('🔍 DEBUG: LOGIN Y DASHBOARD');
  console.log('=' .repeat(70));
  console.log();

  const browser = await chromium.launch({ headless: true }); // Headless para servidor sin X
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Capturar errores de consola
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', request => {
    networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    // ════════════════════════════════════════════════════════════
    // 1. LOGIN
    // ════════════════════════════════════════════════════════════
    console.log('[1/6] 🔐 LOGIN');
    console.log('-'.repeat(70));
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    
    const loginVisible = await page.locator('input[name="email"], input[type="email"]').isVisible();
    if (!loginVisible) {
      console.log('❌ Formulario de login no visible');
      throw new Error('Login form not found');
    }
    
    console.log('✅ Página de login cargada');
    
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|portal|admin)/, { timeout: 30000 }).catch(() => {
      console.log('⚠️  No redirigió inmediatamente');
    });
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('✅ Login exitoso');
    console.log(`   URL actual: ${currentUrl}`);
    console.log();

    // ════════════════════════════════════════════════════════════
    // 2. CAPTURAR ESTADO DEL DASHBOARD
    // ════════════════════════════════════════════════════════════
    console.log('[2/6] 📊 ESTADO DEL DASHBOARD');
    console.log('-'.repeat(70));
    
    // Esperar que el dashboard cargue
    await page.waitForTimeout(5000);
    
    // Buscar mensajes de "no hay datos"
    const noDataTexts = [
      'no hay datos',
      'no data',
      'sin datos',
      'no disponible',
      'not available',
      'no results',
      'sin resultados',
    ];
    
    let foundNoDataMessage = false;
    for (const text of noDataTexts) {
      const elements = await page.locator(`text=/${text}/i`).all();
      if (elements.length > 0) {
        console.log(`⚠️  Encontrado mensaje: "${text}" (${elements.length} veces)`);
        foundNoDataMessage = true;
        
        // Obtener contexto
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const element = elements[i];
          const textContent = await element.textContent();
          const parent = await element.evaluateHandle(el => el.parentElement);
          const parentText = await parent.evaluate(el => el?.textContent?.substring(0, 100));
          console.log(`     Contexto ${i + 1}: ${parentText}`);
        }
      }
    }
    
    if (!foundNoDataMessage) {
      console.log('✅ NO se encontró mensaje de "no hay datos"');
    }
    console.log();

    // ════════════════════════════════════════════════════════════
    // 3. VERIFICAR KPIs
    // ════════════════════════════════════════════════════════════
    console.log('[3/6] 📈 VERIFICACIÓN DE KPIs');
    console.log('-'.repeat(70));
    
    const kpiSelectors = [
      '[data-testid="kpi-card"]',
      '[class*="kpi"]',
      '[class*="metric"]',
      'h3:has-text("€")',
      '[class*="stat"]',
    ];
    
    let kpisFound = 0;
    for (const selector of kpiSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        kpisFound += elements.length;
        console.log(`✅ KPIs con selector "${selector}": ${elements.length}`);
        
        // Obtener valores
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const text = await elements[i].textContent();
          console.log(`     - ${text?.trim().substring(0, 50)}`);
        }
      }
    }
    
    if (kpisFound === 0) {
      console.log('⚠️  NO se encontraron KPIs visibles');
    } else {
      console.log(`✅ Total KPIs encontrados: ${kpisFound}`);
    }
    console.log();

    // ════════════════════════════════════════════════════════════
    // 4. VERIFICAR API CALLS
    // ════════════════════════════════════════════════════════════
    console.log('[4/6] 🌐 VERIFICACIÓN DE API CALLS');
    console.log('-'.repeat(70));
    
    // Interceptar llamadas a APIs
    const apiCalls: Array<{ url: string; status: number; response?: any }> = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/')) {
        const call = {
          url: url.replace(BASE_URL, ''),
          status: response.status(),
          response: undefined as any,
        };
        
        try {
          if (response.headers()['content-type']?.includes('application/json')) {
            call.response = await response.json();
          }
        } catch (e) {
          // Ignore
        }
        
        apiCalls.push(call);
      }
    });
    
    // Recargar para capturar llamadas
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    console.log(`API Calls capturadas: ${apiCalls.length}`);
    
    const failedCalls = apiCalls.filter(c => c.status >= 400);
    if (failedCalls.length > 0) {
      console.log(`\n⚠️  API Calls fallidas: ${failedCalls.length}`);
      failedCalls.forEach(call => {
        console.log(`   - ${call.status} ${call.url}`);
        if (call.response) {
          console.log(`     Response: ${JSON.stringify(call.response).substring(0, 100)}`);
        }
      });
    } else {
      console.log('✅ Todas las API calls exitosas');
    }
    
    // Mostrar algunas calls importantes
    const importantApis = ['/api/dashboard', '/api/auth', '/api/user', '/api/company'];
    console.log('\nAPI calls importantes:');
    importantApis.forEach(api => {
      const calls = apiCalls.filter(c => c.url.includes(api));
      if (calls.length > 0) {
        calls.forEach(call => {
          console.log(`   - ${call.status} ${call.url}`);
          if (call.response && call.status >= 400) {
            console.log(`     Error: ${JSON.stringify(call.response).substring(0, 150)}`);
          }
        });
      } else {
        console.log(`   - (no llamada a ${api})`);
      }
    });
    console.log();

    // ════════════════════════════════════════════════════════════
    // 5. ERRORES DE CONSOLA Y RED
    // ════════════════════════════════════════════════════════════
    console.log('[5/6] ⚠️  ERRORES CAPTURADOS');
    console.log('-'.repeat(70));
    
    if (consoleErrors.length > 0) {
      console.log(`Console Errors: ${consoleErrors.length}`);
      consoleErrors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 150)}`);
      });
    } else {
      console.log('✅ NO hay errores de consola');
    }
    
    if (networkErrors.length > 0) {
      console.log(`\nNetwork Errors: ${networkErrors.length}`);
      networkErrors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 150)}`);
      });
    } else {
      console.log('✅ NO hay errores de red');
    }
    console.log();

    // ════════════════════════════════════════════════════════════
    // 6. SCREENSHOTS
    // ════════════════════════════════════════════════════════════
    console.log('[6/6] 📸 SCREENSHOTS');
    console.log('-'.repeat(70));
    
    await page.screenshot({ path: '/tmp/dashboard-full.png', fullPage: true });
    console.log('✅ Screenshot completo: /tmp/dashboard-full.png');
    
    // Screenshot de la primera sección visible
    await page.screenshot({ path: '/tmp/dashboard-viewport.png', fullPage: false });
    console.log('✅ Screenshot viewport: /tmp/dashboard-viewport.png');
    
    // Si hay mensaje de "no hay datos", capturar ese elemento
    if (foundNoDataMessage) {
      const noDataElement = await page.locator('text=/no hay datos/i').first();
      if (await noDataElement.isVisible()) {
        await noDataElement.screenshot({ path: '/tmp/no-data-message.png' });
        console.log('✅ Screenshot mensaje "no hay datos": /tmp/no-data-message.png');
      }
    }
    console.log();

    // ════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ════════════════════════════════════════════════════════════
    console.log('=' .repeat(70));
    console.log('📋 RESUMEN');
    console.log('=' .repeat(70));
    console.log();
    console.log('Estado del Dashboard:');
    console.log(`  - URL: ${page.url()}`);
    console.log(`  - Mensaje "no hay datos": ${foundNoDataMessage ? '❌ SÍ' : '✅ NO'}`);
    console.log(`  - KPIs encontrados: ${kpisFound}`);
    console.log(`  - API calls totales: ${apiCalls.length}`);
    console.log(`  - API calls fallidas: ${failedCalls.length}`);
    console.log(`  - Console errors: ${consoleErrors.length}`);
    console.log(`  - Network errors: ${networkErrors.length}`);
    console.log();
    
    if (foundNoDataMessage || failedCalls.length > 0 || consoleErrors.length > 0) {
      console.log('⚠️  PROBLEMAS DETECTADOS - Revisar logs arriba');
    } else {
      console.log('✅ Dashboard cargando correctamente');
    }
    console.log();

    // Browser se cerrará automáticamente

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
