/**
 * Script de verificación visual completa de todos los cambios de hoy
 * Ejecutar: npx playwright test scripts/verify-all-changes-visual.ts --project=chromium
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

interface VerificationResult {
  page: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  screenshot?: string;
  details?: any;
}

const results: VerificationResult[] = [];

async function log(message: string) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${message}`);
}

async function login(page: Page): Promise<boolean> {
  try {
    await log('🔐 Iniciando login como superadministrador...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Esperar a que el formulario esté visible
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Llenar credenciales
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    // Click en submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Esperar navegación
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    
    await log('✅ Login exitoso');
    return true;
  } catch (error: any) {
    await log(`❌ Error en login: ${error.message}`);
    return false;
  }
}

async function verifyPage(page: Page, url: string, pageName: string, checks: {
  expectElements?: string[];
  expectText?: string[];
  checkButtons?: boolean;
  checkCards?: boolean;
  checkTables?: boolean;
  checkForms?: boolean;
}): Promise<VerificationResult> {
  const result: VerificationResult = {
    page: pageName,
    status: 'success',
    message: 'OK',
    details: {}
  };
  
  try {
    await log(`📄 Verificando ${pageName}...`);
    const response = await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Verificar status HTTP
    const status = response?.status() || 0;
    result.details.httpStatus = status;
    
    if (status >= 400) {
      result.status = 'error';
      result.message = `HTTP ${status}`;
      return result;
    }
    
    // Esperar un momento para que cargue el contenido dinámico
    await page.waitForTimeout(2000);
    
    // Verificar que no hay errores visibles
    const errorTexts = await page.locator('text=/error|Error|ERROR/i').count();
    const unauthorizedTexts = await page.locator('text=/no autorizado|unauthorized|403|401/i').count();
    
    if (unauthorizedTexts > 0) {
      result.status = 'warning';
      result.message = 'Posible problema de autorización detectado';
    }
    
    // Verificar elementos esperados
    if (checks.expectElements) {
      for (const selector of checks.expectElements) {
        const count = await page.locator(selector).count();
        result.details[`element_${selector}`] = count;
        if (count === 0) {
          result.status = 'warning';
          result.message = `Elemento no encontrado: ${selector}`;
        }
      }
    }
    
    // Verificar texto esperado
    if (checks.expectText) {
      for (const text of checks.expectText) {
        const found = await page.locator(`text="${text}"`).count() > 0 ||
                      await page.locator(`text=${text}`).count() > 0;
        result.details[`text_${text}`] = found;
      }
    }
    
    // Contar elementos UI
    if (checks.checkButtons) {
      result.details.buttons = await page.locator('button').count();
    }
    if (checks.checkCards) {
      result.details.cards = await page.locator('[class*="card"], [class*="Card"]').count();
    }
    if (checks.checkTables) {
      result.details.tables = await page.locator('table').count();
    }
    if (checks.checkForms) {
      result.details.forms = await page.locator('form').count();
      result.details.inputs = await page.locator('input').count();
    }
    
    // Tomar screenshot
    const screenshotName = `verify-${pageName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    await page.screenshot({ 
      path: `/workspace/screenshots-verification/${screenshotName}`,
      fullPage: true 
    });
    result.screenshot = screenshotName;
    
    await log(`  ✅ ${pageName}: ${JSON.stringify(result.details)}`);
    
  } catch (error: any) {
    result.status = 'error';
    result.message = error.message;
    await log(`  ❌ ${pageName}: ${error.message}`);
  }
  
  return result;
}

async function verifyToggleFunctionality(page: Page): Promise<VerificationResult> {
  const result: VerificationResult = {
    page: 'Toggle Functionality (Marketplace Categories)',
    status: 'success',
    message: 'OK',
    details: {}
  };
  
  try {
    await log('🔄 Verificando funcionalidad de toggles...');
    await page.goto(`${BASE_URL}/admin/marketplace/categorias`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Buscar switches/toggles
    const switches = await page.locator('button[role="switch"], [data-state]').count();
    result.details.switchesFound = switches;
    
    if (switches > 0) {
      // Intentar hacer click en el primer switch
      const firstSwitch = page.locator('button[role="switch"], [data-state]').first();
      const initialState = await firstSwitch.getAttribute('data-state');
      result.details.initialState = initialState;
      
      await firstSwitch.click();
      await page.waitForTimeout(1000);
      
      // Verificar que no hay toast de error
      const errorToast = await page.locator('text=/error al actualizar|error/i').count();
      result.details.errorToastFound = errorToast > 0;
      
      if (errorToast > 0) {
        result.status = 'error';
        result.message = 'Error toast detectado al cambiar toggle';
      } else {
        result.message = 'Toggle funcionando correctamente';
      }
      
      // Restaurar estado original
      await firstSwitch.click();
      await page.waitForTimeout(500);
    } else {
      result.status = 'warning';
      result.message = 'No se encontraron switches para verificar';
    }
    
    await log(`  ✅ Toggles: ${JSON.stringify(result.details)}`);
    
  } catch (error: any) {
    result.status = 'error';
    result.message = error.message;
    await log(`  ❌ Toggles: ${error.message}`);
  }
  
  return result;
}

async function verifyAPIResponses(page: Page): Promise<VerificationResult[]> {
  const apiResults: VerificationResult[] = [];
  const apisToCheck = [
    { url: '/api/health', name: 'Health Check' },
    { url: '/api/dashboard', name: 'Dashboard API' },
    { url: '/api/admin/dashboard-stats', name: 'Admin Dashboard Stats' },
    { url: '/api/planes', name: 'Planes API' },
    { url: '/api/addons', name: 'Addons API' },
  ];
  
  await log('🔌 Verificando respuestas de APIs...');
  
  for (const api of apisToCheck) {
    const result: VerificationResult = {
      page: api.name,
      status: 'success',
      message: 'OK',
      details: {}
    };
    
    try {
      const response = await page.goto(`${BASE_URL}${api.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response?.status() || 0;
      result.details.httpStatus = status;
      
      if (status >= 400) {
        result.status = 'error';
        result.message = `HTTP ${status}`;
      } else {
        const body = await page.textContent('body');
        try {
          const json = JSON.parse(body || '{}');
          result.details.hasData = Object.keys(json).length > 0;
          if (json.error) {
            result.status = 'warning';
            result.message = `API retorna error: ${json.error}`;
          }
        } catch {
          result.details.isJson = false;
        }
      }
      
      await log(`  ${result.status === 'success' ? '✅' : '❌'} ${api.name}: HTTP ${status}`);
      
    } catch (error: any) {
      result.status = 'error';
      result.message = error.message;
      await log(`  ❌ ${api.name}: ${error.message}`);
    }
    
    apiResults.push(result);
  }
  
  return apiResults;
}

async function main() {
  console.log('═'.repeat(70));
  console.log('🔍 VERIFICACIÓN VISUAL COMPLETA DE CAMBIOS - SUPERADMINISTRADOR');
  console.log('═'.repeat(70));
  console.log(`📍 URL Base: ${BASE_URL}`);
  console.log(`📧 Usuario: ${TEST_EMAIL}`);
  console.log('═'.repeat(70));
  
  // Crear directorio de screenshots
  const { execSync } = require('child_process');
  execSync('mkdir -p /workspace/screenshots-verification');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'es-ES'
  });
  const page = await context.newPage();
  
  // Capturar errores de consola
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    // Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.log('❌ No se pudo iniciar sesión. Abortando verificación.');
      await browser.close();
      return;
    }
    
    console.log('\n' + '─'.repeat(70));
    console.log('📋 VERIFICACIÓN DE PÁGINAS PRINCIPALES DEL ADMIN');
    console.log('─'.repeat(70));
    
    // Páginas principales del admin a verificar
    const adminPages = [
      { url: '/admin/dashboard', name: 'Admin Dashboard', checks: { checkCards: true, checkButtons: true } },
      { url: '/admin/clientes', name: 'Clientes', checks: { checkTables: true, checkButtons: true } },
      { url: '/admin/planes', name: 'Planes', checks: { checkCards: true, checkButtons: true } },
      { url: '/admin/addons', name: 'Addons', checks: { checkCards: true, checkButtons: true } },
      { url: '/admin/marketplace/categorias', name: 'Marketplace Categorías', checks: { checkTables: true, checkButtons: true } },
      { url: '/admin/marketplace/proveedores', name: 'Marketplace Proveedores', checks: { checkTables: true, checkButtons: true } },
      { url: '/admin/marketplace/reservas', name: 'Marketplace Reservas', checks: { checkTables: true } },
      { url: '/admin/marketplace/comisiones', name: 'Marketplace Comisiones', checks: { checkTables: true } },
      { url: '/admin/partners/invitaciones', name: 'Partners Invitaciones', checks: { checkTables: true, checkButtons: true } },
      { url: '/admin/ewoorker-planes', name: 'eWoorker Planes', checks: { checkCards: true, checkButtons: true } },
      { url: '/admin/integraciones', name: 'Integraciones', checks: { checkCards: true } },
      { url: '/admin/cupones', name: 'Cupones Promocionales', checks: { checkTables: true, checkButtons: true } },
    ];
    
    for (const pageInfo of adminPages) {
      const result = await verifyPage(page, pageInfo.url, pageInfo.name, pageInfo.checks);
      results.push(result);
    }
    
    console.log('\n' + '─'.repeat(70));
    console.log('📋 VERIFICACIÓN DE DASHBOARD PRINCIPAL');
    console.log('─'.repeat(70));
    
    // Verificar dashboard principal
    const dashboardResult = await verifyPage(page, '/dashboard', 'Dashboard Principal', {
      checkCards: true,
      checkButtons: true,
      expectText: ['Dashboard', 'KPI']
    });
    results.push(dashboardResult);
    
    console.log('\n' + '─'.repeat(70));
    console.log('🔄 VERIFICACIÓN DE FUNCIONALIDAD DE TOGGLES');
    console.log('─'.repeat(70));
    
    // Verificar toggles (corrección de roles)
    const toggleResult = await verifyToggleFunctionality(page);
    results.push(toggleResult);
    
    console.log('\n' + '─'.repeat(70));
    console.log('🔌 VERIFICACIÓN DE APIs');
    console.log('─'.repeat(70));
    
    // Verificar APIs
    const apiResults = await verifyAPIResponses(page);
    results.push(...apiResults);
    
    console.log('\n' + '─'.repeat(70));
    console.log('📋 VERIFICACIÓN DE PÁGINAS ADICIONALES');
    console.log('─'.repeat(70));
    
    // Páginas adicionales modificadas hoy
    const additionalPages = [
      { url: '/admin/zucchetti', name: 'Integración Zucchetti', checks: { checkForms: true } },
      { url: '/admin/alertas', name: 'Alertas', checks: { checkCards: true } },
      { url: '/admin/onboarding', name: 'Onboarding', checks: { checkForms: true } },
      { url: '/admin/firma-digital', name: 'Firma Digital', checks: { checkButtons: true } },
    ];
    
    for (const pageInfo of additionalPages) {
      const result = await verifyPage(page, pageInfo.url, pageInfo.name, pageInfo.checks);
      results.push(result);
    }
    
    // Resumen final
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('═'.repeat(70));
    
    const successCount = results.filter(r => r.status === 'success').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Éxitos: ${successCount}`);
    console.log(`⚠️ Advertencias: ${warningCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📸 Total páginas verificadas: ${results.length}`);
    
    if (consoleErrors.length > 0) {
      console.log(`\n🔴 Errores de consola detectados: ${consoleErrors.length}`);
      consoleErrors.slice(0, 5).forEach(e => console.log(`  - ${e.substring(0, 100)}`));
    }
    
    // Mostrar errores y advertencias
    if (errorCount > 0 || warningCount > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log('⚠️ DETALLES DE PROBLEMAS DETECTADOS:');
      console.log('─'.repeat(70));
      
      results.filter(r => r.status !== 'success').forEach(r => {
        const icon = r.status === 'error' ? '❌' : '⚠️';
        console.log(`${icon} ${r.page}: ${r.message}`);
        if (r.details) {
          console.log(`   Detalles: ${JSON.stringify(r.details)}`);
        }
      });
    }
    
    // Guardar resultados en JSON
    const fs = require('fs');
    fs.writeFileSync('/workspace/screenshots-verification/results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: { success: successCount, warning: warningCount, error: errorCount },
      results,
      consoleErrors: consoleErrors.slice(0, 20)
    }, null, 2));
    
    console.log('\n📁 Resultados guardados en: /workspace/screenshots-verification/');
    console.log('═'.repeat(70));
    
  } catch (error: any) {
    console.error('❌ Error general:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
