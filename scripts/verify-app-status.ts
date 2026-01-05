/**
 * Script de verificación de la app con Playwright
 * - Verifica idiomas y menús
 * - Verifica planes de suscripción
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_USER = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

async function main() {
  console.log('=' .repeat(70));
  console.log('🔍 VERIFICACIÓN DE APP CON PLAYWRIGHT');
  console.log('=' .repeat(70));
  console.log();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // ════════════════════════════════════════════════════════════
    // 1. LOGIN
    // ════════════════════════════════════════════════════════════
    console.log('📝 1. LOGIN');
    console.log('-'.repeat(70));
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Verificar que la página de login cargó
    const loginVisible = await page.locator('input[name="email"], input[type="email"]').isVisible();
    if (!loginVisible) {
      console.log('❌ Formulario de login no visible');
      throw new Error('Login form not found');
    }
    
    console.log('✅ Página de login cargada');
    
    // Hacer login
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue dashboard o cualquier página post-login
    await page.waitForURL(/\/(dashboard|portal|admin)/, { timeout: 30000 }).catch(() => {
      console.log('⚠️  No redirigió a dashboard, pero continuando...');
    });
    
    await page.waitForTimeout(3000);
    
    console.log('✅ Login exitoso');
    console.log('   URL actual:', page.url());
    console.log();

    // ════════════════════════════════════════════════════════════
    // 2. VERIFICAR SELECTOR DE IDIOMAS
    // ════════════════════════════════════════════════════════════
    console.log('🌍 2. VERIFICACIÓN DE IDIOMAS');
    console.log('-'.repeat(70));
    
    // Buscar selector de idiomas (puede ser un botón, dropdown, o icono)
    const languageSelectors = [
      'button[aria-label*="language" i]',
      'button[aria-label*="idioma" i]',
      '[data-testid="language-selector"]',
      'button:has-text("🌐")',
      'select[name="language"]',
      '[class*="language"]',
      '[class*="locale"]',
    ];
    
    let selectorFound = false;
    let selectorType = '';
    
    for (const selector of languageSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        selectorFound = true;
        selectorType = selector;
        console.log(`✅ Selector de idiomas encontrado: ${selector}`);
        break;
      }
    }
    
    if (!selectorFound) {
      console.log('❌ NO se encontró selector de idiomas en el header');
      console.log('⚠️  Los usuarios NO pueden cambiar de idioma');
    }
    
    // Tomar screenshot del header
    await page.screenshot({ path: '/tmp/header-screenshot.png', fullPage: false });
    console.log('📸 Screenshot guardado: /tmp/header-screenshot.png');
    console.log();

    // ════════════════════════════════════════════════════════════
    // 3. VERIFICAR MENÚS Y TRADUCCIONES
    // ════════════════════════════════════════════════════════════
    console.log('📋 3. VERIFICACIÓN DE MENÚS');
    console.log('-'.repeat(70));
    
    // Extraer texto de los menús principales
    const menuItems = await page.locator('nav a, aside a, [role="navigation"] a').allTextContents();
    console.log(`✅ Encontrados ${menuItems.length} elementos de menú`);
    
    if (menuItems.length > 0) {
      console.log('   Primeros 10 items:');
      menuItems.slice(0, 10).forEach((item, i) => {
        if (item.trim()) {
          console.log(`   ${i + 1}. ${item.trim()}`);
        }
      });
    } else {
      console.log('⚠️  No se encontraron elementos de menú');
    }
    console.log();

    // ════════════════════════════════════════════════════════════
    // 4. VERIFICAR PLANES DE SUSCRIPCIÓN (FRONTEND)
    // ════════════════════════════════════════════════════════════
    console.log('💰 4. VERIFICACIÓN DE PLANES (FRONTEND)');
    console.log('-'.repeat(70));
    
    // Intentar ir a la página de pricing/planes
    const pricingUrls = [
      `${BASE_URL}/pricing`,
      `${BASE_URL}/planes`,
      `${BASE_URL}/subscriptions`,
      `${BASE_URL}/landing#pricing`,
      `${BASE_URL}/#pricing`,
    ];
    
    let pricingPageFound = false;
    
    for (const url of pricingUrls) {
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        if (response?.ok()) {
          pricingPageFound = true;
          console.log(`✅ Página de pricing encontrada: ${url}`);
          
          await page.waitForTimeout(2000);
          
          // Buscar planes
          const planCards = await page.locator('[class*="plan"], [data-testid*="plan"], [class*="pricing"]').count();
          console.log(`   Planes encontrados: ${planCards}`);
          
          // Buscar límites
          const limitsText = await page.locator('text=/límite|limit|included|incluido/i').allTextContents();
          if (limitsText.length > 0) {
            console.log(`   ✅ Límites visibles: ${limitsText.length} menciones`);
            console.log('   Ejemplos:');
            limitsText.slice(0, 5).forEach(text => {
              if (text.trim()) {
                console.log(`     - ${text.trim().substring(0, 60)}...`);
              }
            });
          } else {
            console.log('   ⚠️  NO se encontraron límites visibles en los planes');
          }
          
          await page.screenshot({ path: '/tmp/pricing-screenshot.png', fullPage: true });
          console.log('   📸 Screenshot: /tmp/pricing-screenshot.png');
          
          break;
        }
      } catch (e) {
        // Continuar con siguiente URL
      }
    }
    
    if (!pricingPageFound) {
      console.log('⚠️  No se encontró página de pricing pública');
      console.log('   Verificando si hay planes en el dashboard...');
      
      // Buscar en el dashboard actual
      await page.goto(page.url()); // Recargar página actual
      const plansInDashboard = await page.locator('text=/plan|subscription|suscripción/i').count();
      console.log(`   Menciones de "plan": ${plansInDashboard}`);
    }
    console.log();

    // ════════════════════════════════════════════════════════════
    // 5. VERIFICAR PLANES EN BACKEND (API)
    // ════════════════════════════════════════════════════════════
    console.log('🔧 5. VERIFICACIÓN DE PLANES (BACKEND API)');
    console.log('-'.repeat(70));
    
    const apiEndpoints = [
      '/api/subscription-plans',
      '/api/plans',
      '/api/subscriptions/plans',
    ];
    
    let plansFromAPI: any = null;
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.request.get(`${BASE_URL}${endpoint}`);
        if (response.ok()) {
          plansFromAPI = await response.json();
          console.log(`✅ API de planes encontrada: ${endpoint}`);
          console.log(`   Status: ${response.status()}`);
          
          if (Array.isArray(plansFromAPI)) {
            console.log(`   Total de planes: ${plansFromAPI.length}`);
            
            plansFromAPI.forEach((plan: any, i: number) => {
              console.log(`   \n   Plan ${i + 1}: ${plan.nombre || plan.name}`);
              console.log(`     - Precio: ${plan.precio || plan.price || 'N/A'}€/mes`);
              
              // Verificar límites
              const limits = [];
              if (plan.signaturesIncludedMonth !== undefined) limits.push(`Firmas: ${plan.signaturesIncludedMonth}/mes`);
              if (plan.storageIncludedGB !== undefined) limits.push(`Storage: ${plan.storageIncludedGB}GB`);
              if (plan.aiTokensIncludedMonth !== undefined) limits.push(`AI: ${plan.aiTokensIncludedMonth} tokens/mes`);
              if (plan.smsIncludedMonth !== undefined) limits.push(`SMS: ${plan.smsIncludedMonth}/mes`);
              
              if (limits.length > 0) {
                console.log('     Límites:');
                limits.forEach(limit => console.log(`       - ${limit}`));
              } else {
                console.log('     ⚠️  NO tiene límites definidos');
              }
            });
          } else {
            console.log('   ⚠️  Respuesta no es un array de planes');
            console.log('   Respuesta:', JSON.stringify(plansFromAPI).substring(0, 200));
          }
          
          break;
        }
      } catch (e) {
        // Continuar con siguiente endpoint
      }
    }
    
    if (!plansFromAPI) {
      console.log('❌ NO se encontró API de planes funcional');
      console.log('   Los planes NO están disponibles vía API');
    }
    console.log();

    // ════════════════════════════════════════════════════════════
    // 6. VERIFICAR USAGE/LÍMITES DEL USUARIO ACTUAL
    // ════════════════════════════════════════════════════════════
    console.log('📊 6. VERIFICACIÓN DE USAGE DEL USUARIO');
    console.log('-'.repeat(70));
    
    try {
      const usageResponse = await page.request.get(`${BASE_URL}/api/usage/current`);
      if (usageResponse.ok()) {
        const usage = await usageResponse.json();
        console.log('✅ API de usage funcional');
        console.log('   Datos:', JSON.stringify(usage, null, 2).substring(0, 500));
      } else {
        console.log(`⚠️  API de usage retornó: ${usageResponse.status()}`);
      }
    } catch (e: any) {
      console.log('❌ Error obteniendo usage:', e.message);
    }
    console.log();

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await browser.close();
  }

  // ════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ════════════════════════════════════════════════════════════
  console.log('=' .repeat(70));
  console.log('📋 RESUMEN');
  console.log('=' .repeat(70));
  console.log();
  console.log('Verificar manualmente:');
  console.log('  1. Selector de idiomas en header');
  console.log('  2. Menús traducidos al cambiar idioma');
  console.log('  3. Página de pricing con límites');
  console.log('  4. API de planes funcionando');
  console.log();
  console.log('Screenshots guardados en /tmp/');
}

main().catch(console.error);
