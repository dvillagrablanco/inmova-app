import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
  screenshot?: string;
}

async function runChecks(): Promise<void> {
  const results: CheckResult[] = [];
  let browser: Browser | null = null;
  let page: Page | null = null;

  console.log('=' .repeat(70));
  console.log('🔍 VERIFICACIÓN DE CAMBIOS EN FRONTEND - PRODUCCIÓN');
  console.log('=' .repeat(70));
  console.log(`URL: ${BASE_URL}`);
  console.log(`Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log('');

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    page = await context.newPage();

    // 1. Verificar login
    console.log('[1/6] Iniciando sesión...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Esperar redirección
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    console.log('  ✅ Login exitoso');
    results.push({ name: 'Login', passed: true, details: 'Login completado correctamente' });

    // 2. Ir al dashboard de admin
    console.log('\n[2/6] Navegando al dashboard admin...');
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const dashboardTitle = await page.textContent('h1');
    console.log(`  → Título: ${dashboardTitle}`);
    results.push({ name: 'Dashboard Admin', passed: true, details: `Título: ${dashboardTitle}` });

    // 3. Verificar sidebar - buscar las nuevas opciones de integraciones
    console.log('\n[3/6] Verificando sidebar - Integraciones...');
    
    // Buscar en el sidebar
    const sidebarContent = await page.textContent('nav, aside, [role="navigation"]');
    
    const integrationItems = [
      'Integraciones',
      'Contabilidad',
      'Portales Inmobiliarios'
    ];
    
    let foundItems: string[] = [];
    let missingItems: string[] = [];
    
    for (const item of integrationItems) {
      // Buscar en toda la página por si el sidebar está colapsado
      const found = await page.locator(`text="${item}"`).count() > 0 ||
                    await page.locator(`a:has-text("${item}")`).count() > 0 ||
                    (sidebarContent && sidebarContent.includes(item));
      
      if (found) {
        foundItems.push(item);
        console.log(`  ✅ "${item}" encontrado`);
      } else {
        missingItems.push(item);
        console.log(`  ❌ "${item}" NO encontrado`);
      }
    }
    
    results.push({
      name: 'Sidebar - Integraciones',
      passed: missingItems.length === 0,
      details: `Encontrados: ${foundItems.join(', ')}. Faltantes: ${missingItems.join(', ') || 'ninguno'}`
    });

    // 4. Verificar página de Portales Inmobiliarios (NUEVA)
    console.log('\n[4/6] Verificando página /admin/portales-inmobiliarios...');
    await page.goto(`${BASE_URL}/admin/portales-inmobiliarios`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const portalesUrl = page.url();
    const portalesTitle = await page.textContent('h1');
    const hasIdealista = await page.locator('text="Idealista"').count() > 0;
    const hasFotocasa = await page.locator('text="Fotocasa"').count() > 0;
    
    console.log(`  → URL: ${portalesUrl}`);
    console.log(`  → Título: ${portalesTitle}`);
    console.log(`  → Idealista: ${hasIdealista ? '✅' : '❌'}`);
    console.log(`  → Fotocasa: ${hasFotocasa ? '✅' : '❌'}`);
    
    // Capturar screenshot
    await page.screenshot({ path: '/workspace/screenshots-verification/portales-inmobiliarios.png', fullPage: true });
    console.log('  📸 Screenshot guardado');
    
    const portalesOk = portalesTitle?.includes('Portales') || hasIdealista || hasFotocasa;
    results.push({
      name: 'Página Portales Inmobiliarios',
      passed: portalesOk,
      details: `Título: ${portalesTitle}, Idealista: ${hasIdealista}, Fotocasa: ${hasFotocasa}`,
      screenshot: '/workspace/screenshots-verification/portales-inmobiliarios.png'
    });

    // 5. Verificar página de Integraciones Contables
    console.log('\n[5/6] Verificando página /admin/integraciones-contables...');
    await page.goto(`${BASE_URL}/admin/integraciones-contables`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const contablesTitle = await page.textContent('h1');
    const hasContasimple = await page.locator('text="ContaSimple"').count() > 0 || 
                           await page.locator('text="Contasimple"').count() > 0;
    const hasHolded = await page.locator('text="Holded"').count() > 0;
    
    console.log(`  → Título: ${contablesTitle}`);
    console.log(`  → ContaSimple: ${hasContasimple ? '✅' : '❌'}`);
    console.log(`  → Holded: ${hasHolded ? '✅' : '❌'}`);
    
    await page.screenshot({ path: '/workspace/screenshots-verification/integraciones-contables.png', fullPage: true });
    console.log('  📸 Screenshot guardado');
    
    results.push({
      name: 'Página Integraciones Contables',
      passed: hasContasimple || hasHolded,
      details: `Título: ${contablesTitle}, ContaSimple: ${hasContasimple}, Holded: ${hasHolded}`
    });

    // 6. Verificar Centro de Integraciones general
    console.log('\n[6/6] Verificando página /integraciones...');
    await page.goto(`${BASE_URL}/integraciones`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const integTitle = await page.textContent('h1');
    const hasStripe = await page.locator('text="Stripe"').count() > 0;
    const hasDocusign = await page.locator('text="DocuSign"').count() > 0;
    
    console.log(`  → Título: ${integTitle}`);
    console.log(`  → Stripe: ${hasStripe ? '✅' : '❌'}`);
    console.log(`  → DocuSign: ${hasDocusign ? '✅' : '❌'}`);
    
    await page.screenshot({ path: '/workspace/screenshots-verification/integraciones.png', fullPage: true });
    console.log('  📸 Screenshot guardado');
    
    results.push({
      name: 'Centro de Integraciones',
      passed: hasStripe || hasDocusign,
      details: `Título: ${integTitle}, Stripe: ${hasStripe}, DocuSign: ${hasDocusign}`
    });

  } catch (error: any) {
    console.error(`\n❌ Error durante verificación: ${error.message}`);
    results.push({
      name: 'Error General',
      passed: false,
      details: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Resumen
  console.log('\n' + '=' .repeat(70));
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('=' .repeat(70));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.details}`);
  }
  
  console.log('\n' + '-'.repeat(70));
  console.log(`Total: ${passed} pasados, ${failed} fallidos`);
  
  if (failed > 0) {
    console.log('\n⚠️  HAY PROBLEMAS - Los cambios pueden no estar desplegados correctamente');
    console.log('\nPosibles causas:');
    console.log('  1. El build no se completó correctamente');
    console.log('  2. PM2 no recargó los cambios');
    console.log('  3. Hay cache del navegador/CDN');
    console.log('\nSolución: Ejecutar deployment manual o verificar logs del servidor');
  } else {
    console.log('\n✅ TODOS LOS CAMBIOS VERIFICADOS CORRECTAMENTE');
  }
  
  console.log('=' .repeat(70));
}

runChecks().catch(console.error);
