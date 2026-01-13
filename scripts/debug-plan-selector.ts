/**
 * Script de diagnóstico para el selector de planes en creación de empresas
 * Ejecutar: npx playwright test scripts/debug-plan-selector.ts --headed
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';
const TEST_USER = process.env.TEST_USER || 'admin@inmova.app';
const TEST_PASS = process.env.TEST_PASS || 'Admin123!';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔍 DIAGNÓSTICO: Selector de Planes en Creación de Empresas\n');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Usuario: ${TEST_USER}\n`);

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();

  // Interceptar llamadas a la API
  const apiCalls: { url: string; status: number; body?: any }[] = [];
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      let body = null;
      try {
        if (response.headers()['content-type']?.includes('application/json')) {
          body = await response.json();
        }
      } catch (e) {}
      
      apiCalls.push({ url, status, body });
      
      // Log específico para planes
      if (url.includes('subscription-plans') || url.includes('plans')) {
        console.log(`📡 API: ${url}`);
        console.log(`   Status: ${status}`);
        if (body) {
          if (body.plans) {
            console.log(`   Planes encontrados: ${body.plans.length}`);
            body.plans.forEach((p: any) => {
              console.log(`     - ${p.nombre} (${p.tier}) - €${p.precioMensual}/mes ${p.esInterno ? '[INTERNO]' : ''}`);
            });
          } else if (Array.isArray(body)) {
            console.log(`   Planes encontrados: ${body.length}`);
          }
        }
        console.log('');
      }
    }
  });

  try {
    // 1. Login
    console.log('1️⃣ Iniciando sesión...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/workspace/screenshots-debug/01-login-page.png' });

    // Llenar formulario
    await page.fill('input[name="email"], input[type="email"]', TEST_USER);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASS);
    
    // Submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    
    await delay(3000);
    await page.screenshot({ path: '/workspace/screenshots-debug/02-after-login.png' });
    
    const currentUrl = page.url();
    console.log(`   URL después de login: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('❌ Login falló - aún en página de login');
      
      // Verificar errores
      const errorText = await page.textContent('.text-red-500, .text-destructive, [role="alert"]').catch(() => null);
      if (errorText) {
        console.log(`   Error: ${errorText}`);
      }
      
      throw new Error('Login failed');
    }
    
    console.log('✅ Login exitoso\n');

    // 2. Navegar a admin/clientes
    console.log('2️⃣ Navegando a /admin/clientes...');
    await page.goto(`${BASE_URL}/admin/clientes`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);
    await page.screenshot({ path: '/workspace/screenshots-debug/03-clientes-page.png' });
    
    // Verificar si hay error
    const pageContent = await page.content();
    if (pageContent.includes('Error') && pageContent.includes('500')) {
      console.log('❌ Error 500 detectado en la página');
    }
    
    console.log('✅ Página de clientes cargada\n');

    // 3. Abrir diálogo de crear empresa
    console.log('3️⃣ Abriendo diálogo de crear empresa...');
    
    // Buscar botón "Nueva Empresa"
    const newCompanyBtn = await page.locator('button:has-text("Nueva Empresa"), button:has-text("Crear"), [data-testid="new-company-btn"]').first();
    
    if (await newCompanyBtn.isVisible()) {
      await newCompanyBtn.click();
      await delay(1000);
      console.log('✅ Diálogo abierto\n');
    } else {
      console.log('⚠️  Botón "Nueva Empresa" no encontrado');
      
      // Intentar encontrar cualquier botón
      const buttons = await page.locator('button').all();
      console.log(`   Botones en la página: ${buttons.length}`);
      for (const btn of buttons.slice(0, 5)) {
        const text = await btn.textContent();
        console.log(`   - "${text?.trim()}"`);
      }
    }
    
    await page.screenshot({ path: '/workspace/screenshots-debug/04-create-dialog.png' });

    // 4. Analizar selector de planes
    console.log('4️⃣ Analizando selector de planes...');
    
    // Buscar el selector de plan
    const planSelectors = [
      '[name="subscriptionPlanId"]',
      '#subscriptionPlanId',
      'select:has-text("plan")',
      '[data-testid="plan-selector"]',
      'button:has-text("Seleccionar plan")',
      '[role="combobox"]:has-text("plan")',
    ];
    
    let planSelector = null;
    for (const selector of planSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible().catch(() => false)) {
        planSelector = el;
        console.log(`   ✅ Selector encontrado: ${selector}`);
        break;
      }
    }
    
    if (!planSelector) {
      // Buscar por label
      const planLabel = page.locator('label:has-text("Plan")').first();
      if (await planLabel.isVisible()) {
        console.log('   Label "Plan" encontrado, buscando selector asociado...');
        
        // Buscar el siguiente select/button después del label
        const siblingSelect = page.locator('label:has-text("Plan") + div button, label:has-text("Plan") ~ div button').first();
        if (await siblingSelect.isVisible()) {
          planSelector = siblingSelect;
          console.log('   ✅ Selector de plan encontrado (Shadcn Select)');
        }
      }
    }
    
    // Buscar todos los selects/comboboxes en el diálogo
    const dialog = page.locator('[role="dialog"], .dialog, [data-state="open"]').first();
    if (await dialog.isVisible()) {
      console.log('\n   Elementos interactivos en el diálogo:');
      
      const selectTriggers = await dialog.locator('button[role="combobox"], [data-radix-collection-item]').all();
      console.log(`   - Comboboxes (Shadcn Select): ${selectTriggers.length}`);
      
      for (let i = 0; i < selectTriggers.length; i++) {
        const trigger = selectTriggers[i];
        const text = await trigger.textContent();
        const ariaLabel = await trigger.getAttribute('aria-label');
        console.log(`     ${i + 1}. "${text?.trim()}" (aria-label: ${ariaLabel})`);
      }
      
      const inputs = await dialog.locator('input').all();
      console.log(`   - Inputs: ${inputs.length}`);
      
      const selects = await dialog.locator('select').all();
      console.log(`   - Selects nativos: ${selects.length}`);
    }
    
    await page.screenshot({ path: '/workspace/screenshots-debug/05-plan-selector-analysis.png' });

    // 5. Intentar abrir el dropdown de planes
    console.log('\n5️⃣ Intentando abrir dropdown de planes...');
    
    // Buscar el trigger del select de plan
    const planTrigger = page.locator('button[role="combobox"]:has-text("Seleccionar plan"), button[role="combobox"]:has-text("plan")').first();
    
    if (await planTrigger.isVisible()) {
      console.log('   Trigger encontrado, haciendo click...');
      await planTrigger.click();
      await delay(500);
      await page.screenshot({ path: '/workspace/screenshots-debug/06-dropdown-open.png' });
      
      // Verificar opciones disponibles
      const options = await page.locator('[role="option"], [data-radix-collection-item]').all();
      console.log(`\n   Opciones en el dropdown: ${options.length}`);
      
      if (options.length === 0) {
        console.log('   ❌ NO HAY OPCIONES - El dropdown está vacío');
        console.log('   Esto indica que la API no devolvió planes o no se cargaron');
      } else {
        for (const opt of options) {
          const text = await opt.textContent();
          console.log(`   - "${text?.trim()}"`);
        }
      }
    } else {
      console.log('   ⚠️ Trigger del selector de plan no encontrado');
      
      // Inspeccionar todos los comboboxes
      const allComboboxes = await page.locator('button[role="combobox"]').all();
      console.log(`\n   Todos los comboboxes en la página: ${allComboboxes.length}`);
      for (let i = 0; i < allComboboxes.length; i++) {
        const cb = allComboboxes[i];
        const text = await cb.textContent();
        console.log(`   ${i + 1}. "${text?.trim()}"`);
        
        // Intentar abrir cada uno
        await cb.click();
        await delay(300);
        const optCount = await page.locator('[role="option"]').count();
        console.log(`      Opciones: ${optCount}`);
        
        // Cerrar
        await page.keyboard.press('Escape');
        await delay(200);
      }
    }

    // 6. Verificar llamadas a la API de planes
    console.log('\n6️⃣ Resumen de llamadas API de planes:');
    const planApiCalls = apiCalls.filter(c => 
      c.url.includes('subscription-plans') || 
      c.url.includes('/plans')
    );
    
    if (planApiCalls.length === 0) {
      console.log('   ❌ NO SE ENCONTRARON LLAMADAS A LA API DE PLANES');
      console.log('   El frontend no está solicitando los planes');
    } else {
      planApiCalls.forEach((call, i) => {
        console.log(`   ${i + 1}. ${call.url}`);
        console.log(`      Status: ${call.status}`);
        if (call.body?.plans) {
          console.log(`      Planes: ${call.body.plans.length}`);
        } else if (call.body?.error) {
          console.log(`      Error: ${call.body.error}`);
        }
      });
    }

    // 7. Verificar estado de la API directamente
    console.log('\n7️⃣ Verificando API de planes directamente...');
    const apiResponse = await page.request.get(`${BASE_URL}/api/admin/subscription-plans`);
    const apiData = await apiResponse.json().catch(() => null);
    
    console.log(`   Status: ${apiResponse.status()}`);
    if (apiData) {
      if (apiData.plans) {
        console.log(`   Planes en BD: ${apiData.plans.length}`);
        apiData.plans.forEach((p: any) => {
          console.log(`   - ${p.nombre} (ID: ${p.id}) ${p.esInterno ? '[INTERNO]' : ''}`);
        });
      } else if (apiData.error) {
        console.log(`   ❌ Error: ${apiData.error}`);
      }
    }

    // Screenshot final
    await page.screenshot({ path: '/workspace/screenshots-debug/07-final-state.png', fullPage: true });

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNÓSTICO COMPLETO');
    console.log('='.repeat(60));
    
    const plansInApi = apiData?.plans?.length || 0;
    
    if (plansInApi === 0) {
      console.log('\n❌ PROBLEMA: No hay planes en la base de datos');
      console.log('\n💡 SOLUCIÓN: Ejecutar seed de planes');
      console.log('   curl https://inmovaapp.com/api/admin/seed-plans');
      console.log('   (con sesión de super_admin)');
    } else {
      console.log(`\n✅ Hay ${plansInApi} planes en la API`);
      console.log('\nSi el dropdown sigue vacío, puede ser:');
      console.log('   1. El hook useCompanies no está cargando planes');
      console.log('   2. Error de renderizado del componente Select');
      console.log('   3. Problema con el estado de React');
    }
    
    console.log('\n📸 Screenshots guardados en /workspace/screenshots-debug/');

  } catch (error) {
    console.error('\n❌ Error:', error);
    await page.screenshot({ path: '/workspace/screenshots-debug/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
