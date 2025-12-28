/**
 * Script GUI para navegar por TODAS las páginas y detectar errores
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const RESULTS_DIR = path.join(process.cwd(), 'all-pages-test');
const BASE_URL = 'https://inmovaapp.com';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Test1234!';

interface PageTestResult {
  url: string;
  status: 'success' | 'error' | 'warning';
  screenshot?: string;
  errors: string[];
  warnings: string[];
  loadTime?: number;
  timestamp: string;
}

const PAGES_TO_TEST = [
  '/dashboard',
  '/inicio',
  '/edificios',
  '/unidades',
  '/garages-trasteros',
  '/inquilinos',
  '/contratos',
  '/candidatos',
  '/screening-inquilinos',
  '/valoraciones-propiedades',
  '/inspecciones',
  '/certificaciones',
  '/seguros',
  '/reportes',
  '/analytics',
  '/facturacion',
  '/pagos',
  '/gastos',
  '/contabilidad',
  '/integraciones',
  '/notificaciones',
  '/configuracion',
  '/perfil',
  '/empresa',
  '/usuarios',
  '/roles',
  '/modulos',
  '/ayuda',
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveScreenshot(page: Page, name: string): Promise<string> {
  const filepath = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function login(page: Page): Promise<boolean> {
  try {
    console.log('\n🔐 Iniciando sesión...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', EMAIL, { delay: 50 });
    await page.type('input[type="password"]', PASSWORD, { delay: 50 });
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {}),
    ]);
    
    await sleep(3000);
    
    const cookies = await page.cookies();
    const hasSession = cookies.some(c => c.name.includes('next-auth') && c.name.includes('session'));
    
    if (hasSession) {
      console.log('   ✅ Login exitoso');
      return true;
    } else {
      console.log('   ❌ Login falló - no hay cookie de sesión');
      return false;
    }
  } catch (error: any) {
    console.log(`   ❌ Error en login: ${error.message}`);
    return false;
  }
}

async function testPage(page: Page, url: string): Promise<PageTestResult> {
  const result: PageTestResult = {
    url,
    status: 'success',
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString(),
  };
  
  const fullUrl = `${BASE_URL}${url}`;
  const pageName = url.replace(/\//g, '_') || '_root';
  
  console.log(`\n📄 Probando: ${url}`);
  
  // Capturar errores de consola
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      consoleErrors.push(text);
    } else if (type === 'warning') {
      consoleWarnings.push(text);
    }
  });
  
  // Capturar errores de página
  page.on('pageerror', error => {
    result.errors.push(`PAGE ERROR: ${error.message}`);
  });
  
  // Capturar requests fallidos
  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();
    if (!url.includes('cloudflareinsights') && !url.includes('beacon')) {
      failedRequests.push(`${url} - ${failure?.errorText}`);
    }
  });
  
  try {
    const startTime = Date.now();
    
    // Navegar a la página
    const response = await page.goto(fullUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    }).catch(async () => {
      // Si networkidle0 falla, intentar con domcontentloaded
      return await page.goto(fullUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    });
    
    const loadTime = Date.now() - startTime;
    result.loadTime = loadTime;
    
    const status = response?.status() || 0;
    
    if (status >= 400) {
      result.status = 'error';
      result.errors.push(`HTTP ${status}`);
      console.log(`   ❌ HTTP ${status}`);
    } else {
      console.log(`   ✅ HTTP ${status} (${loadTime}ms)`);
    }
    
    // Esperar un poco para que se cargue completamente
    await sleep(2000);
    
    // Tomar screenshot
    const screenshotPath = await saveScreenshot(page, `page${pageName}`);
    result.screenshot = screenshotPath;
    console.log(`   📸 Screenshot guardado`);
    
    // Verificar si hay error 404 o similar en el contenido
    const pageContent = await page.evaluate(() => document.body.innerText);
    if (pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Page not found')) {
      result.status = 'error';
      result.errors.push('Página 404 - No encontrada');
      console.log(`   ❌ Página no encontrada (404)`);
    }
    
    // Verificar si hay mensaje de error visible
    const hasErrorMessage = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .bg-red-');
      return errorElements.length > 0;
    });
    
    if (hasErrorMessage) {
      const errorText = await page.evaluate(() => {
        const errorEl = document.querySelector('[role="alert"], .error');
        return errorEl?.textContent || '';
      });
      result.warnings.push(`Mensaje de error visible: ${errorText}`);
      console.log(`   ⚠️  Hay mensaje de error visible`);
    }
    
    // Agregar errores de consola
    result.errors.push(...consoleErrors.filter(e => 
      !e.includes('defaultProps') && 
      !e.includes('Warning:')
    ));
    
    result.warnings.push(...consoleWarnings.filter(w =>
      !w.includes('defaultProps')
    ));
    
    // Agregar requests fallidos
    if (failedRequests.length > 0) {
      result.warnings.push(...failedRequests.map(r => `Request failed: ${r}`));
      console.log(`   ⚠️  ${failedRequests.length} requests fallidos`);
    }
    
    // Determinar status final
    if (result.errors.length > 0) {
      result.status = 'error';
      console.log(`   ❌ ${result.errors.length} errores encontrados`);
    } else if (result.warnings.length > 0) {
      result.status = 'warning';
      console.log(`   ⚠️  ${result.warnings.length} advertencias`);
    } else {
      console.log(`   ✅ Página OK`);
    }
    
  } catch (error: any) {
    result.status = 'error';
    result.errors.push(`EXCEPTION: ${error.message}`);
    console.log(`   ❌ Excepción: ${error.message}`);
    
    // Intentar tomar screenshot del error
    try {
      await saveScreenshot(page, `error${pageName}`);
    } catch {}
  }
  
  return result;
}

async function testAllPages() {
  console.log('\n' + '═'.repeat(80));
  console.log('🔍 TEST COMPLETO DE TODAS LAS PÁGINAS');
  console.log('═'.repeat(80) + '\n');
  
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  
  let browser: Browser | null = null;
  const results: PageTestResult[] = [];
  
  try {
    console.log('🚀 Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
      ],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Login primero
    const loginSuccess = await login(page);
    
    if (!loginSuccess) {
      console.log('\n❌ No se pudo hacer login, abortando tests');
      return;
    }
    
    // Probar cada página
    console.log(`\n📋 Probando ${PAGES_TO_TEST.length} páginas...`);
    
    for (const pageUrl of PAGES_TO_TEST) {
      const result = await testPage(page, pageUrl);
      results.push(result);
      
      // Pequeña pausa entre páginas
      await sleep(1000);
    }
    
    // Generar reporte
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESUMEN DE RESULTADOS');
    console.log('═'.repeat(80));
    
    const successful = results.filter(r => r.status === 'success').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`\n✅ Exitosas: ${successful}`);
    console.log(`⚠️  Con advertencias: ${warnings}`);
    console.log(`❌ Con errores: ${errors}`);
    
    console.log('\n📋 PÁGINAS CON ERRORES:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`\n   ❌ ${r.url}`);
      r.errors.forEach(e => console.log(`      - ${e}`));
    });
    
    console.log('\n📋 PÁGINAS CON ADVERTENCIAS:');
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`\n   ⚠️  ${r.url}`);
      r.warnings.slice(0, 3).forEach(w => console.log(`      - ${w}`));
    });
    
    // Guardar reporte JSON
    const reportPath = path.join(RESULTS_DIR, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Reporte completo guardado en: ${reportPath}`);
    
    // Guardar reporte de texto
    const textReport = generateTextReport(results);
    const textReportPath = path.join(RESULTS_DIR, 'test-report.txt');
    fs.writeFileSync(textReportPath, textReport);
    console.log(`📄 Reporte de texto: ${textReportPath}`);
    
  } catch (error: any) {
    console.error('\n💥 Error fatal:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return results;
}

function generateTextReport(results: PageTestResult[]): string {
  let report = '═'.repeat(80) + '\n';
  report += 'REPORTE DE TEST DE TODAS LAS PÁGINAS\n';
  report += 'Fecha: ' + new Date().toLocaleString() + '\n';
  report += '═'.repeat(80) + '\n\n';
  
  const successful = results.filter(r => r.status === 'success');
  const warnings = results.filter(r => r.status === 'warning');
  const errors = results.filter(r => r.status === 'error');
  
  report += `RESUMEN:\n`;
  report += `  ✅ Exitosas: ${successful.length}\n`;
  report += `  ⚠️  Con advertencias: ${warnings.length}\n`;
  report += `  ❌ Con errores: ${errors.length}\n`;
  report += `  📊 Total: ${results.length}\n\n`;
  
  report += '═'.repeat(80) + '\n';
  report += 'PÁGINAS CON ERRORES\n';
  report += '═'.repeat(80) + '\n\n';
  
  errors.forEach(r => {
    report += `❌ ${r.url}\n`;
    report += `   Tiempo de carga: ${r.loadTime}ms\n`;
    report += `   Errores:\n`;
    r.errors.forEach(e => report += `     - ${e}\n`);
    report += '\n';
  });
  
  report += '═'.repeat(80) + '\n';
  report += 'PÁGINAS CON ADVERTENCIAS\n';
  report += '═'.repeat(80) + '\n\n';
  
  warnings.forEach(r => {
    report += `⚠️  ${r.url}\n`;
    report += `   Tiempo de carga: ${r.loadTime}ms\n`;
    report += `   Advertencias (primeras 5):\n`;
    r.warnings.slice(0, 5).forEach(w => report += `     - ${w}\n`);
    report += '\n';
  });
  
  report += '═'.repeat(80) + '\n';
  report += 'PÁGINAS EXITOSAS\n';
  report += '═'.repeat(80) + '\n\n';
  
  successful.forEach(r => {
    report += `✅ ${r.url} (${r.loadTime}ms)\n`;
  });
  
  return report;
}

// Ejecutar
testAllPages()
  .then(() => {
    console.log('\n✅ Test completado\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
