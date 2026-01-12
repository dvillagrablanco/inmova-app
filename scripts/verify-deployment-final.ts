/**
 * Verificación final del deployment
 * Verifica que todas las páginas críticas funcionan correctamente
 */
import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';

interface TestResult {
  page: string;
  status: 'OK' | 'FAIL';
  httpCode?: number;
  error?: string;
  time?: number;
}

async function testPage(page: Page, path: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await page.goto(`${BASE_URL}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    const status = response?.status() || 0;
    const time = Date.now() - start;
    
    if (status >= 200 && status < 400) {
      return { page: path, status: 'OK', httpCode: status, time };
    } else {
      return { page: path, status: 'FAIL', httpCode: status, time };
    }
  } catch (error: any) {
    return { page: path, status: 'FAIL', error: error.message, time: Date.now() - start };
  }
}

async function main() {
  console.log('=' .repeat(60));
  console.log('🔍 VERIFICACIÓN FINAL DE DEPLOYMENT');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const pagesToTest = [
    '/login',
    '/landing',
    '/dashboard',
    '/admin',
    '/admin/clientes',
    '/admin/personalizacion',
    '/construccion/proyectos',
    '/api/health',
  ];
  
  const results: TestResult[] = [];
  
  for (const path of pagesToTest) {
    const result = await testPage(page, path);
    results.push(result);
    
    const emoji = result.status === 'OK' ? '✅' : '❌';
    const info = result.httpCode ? `HTTP ${result.httpCode}` : result.error;
    console.log(`${emoji} ${path.padEnd(35)} ${info} (${result.time}ms)`);
  }
  
  await browser.close();
  
  // Resumen
  const passed = results.filter(r => r.status === 'OK').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 RESUMEN: ${passed} OK, ${failed} FAIL de ${results.length} páginas`);
  
  if (failed > 0) {
    console.log('\n❌ Páginas con errores:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.page}: ${r.httpCode || r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ DEPLOYMENT VERIFICADO CORRECTAMENTE');
    process.exit(0);
  }
}

main().catch(console.error);
