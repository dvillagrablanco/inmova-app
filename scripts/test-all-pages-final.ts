/**
 * Test FINAL de TODAS las páginas corregidas
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'test-final-all-pages');
const BASE_URL = 'https://inmovaapp.com';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Test1234!';

// TODAS las páginas críticas a probar
const ALL_PAGES = [
  '/login',
  '/dashboard',
  '/edificios',
  '/unidades',
  '/inquilinos',
  '/contratos',
  '/candidatos',
  '/reportes',
  '/analytics',
  '/facturacion',
  '/perfil',
  '/configuracion',
];

interface TestResult {
  url: string;
  status: number;
  success: boolean;
  loadTime: number;
  errors: string[];
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page: Page): Promise<boolean> {
  try {
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
    return cookies.some(c => c.name.includes('next-auth') && c.name.includes('session'));
  } catch (error) {
    return false;
  }
}

async function testPage(page: Page, url: string): Promise<TestResult> {
  const fullUrl = url === '/login' ? `${BASE_URL}/login` : `${BASE_URL}${url}`;
  const pageName = url.replace(/\//g, '_') || '_root';
  const startTime = Date.now();
  
  const result: TestResult = {
    url,
    status: 0,
    success: false,
    loadTime: 0,
    errors: [],
  };
  
  console.log(`\n📄 ${url}`);
  
  try {
    const response = await page.goto(fullUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    
    result.status = response?.status() || 0;
    result.loadTime = Date.now() - startTime;
    
    await sleep(2000);
    
    // Screenshot
    const screenshotPath = path.join(RESULTS_DIR, `${pageName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Verificar contenido
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    if (result.status >= 200 && result.status < 400) {
      if (pageContent.includes('404') || pageContent.includes('Not Found')) {
        result.errors.push('404 en contenido');
      } else if (pageContent.includes('Build Error') || pageContent.includes('Syntax Error')) {
        result.errors.push('Build/Syntax Error');
      } else {
        result.success = true;
      }
    } else {
      result.errors.push(`HTTP ${result.status}`);
    }
    
    const emoji = result.success ? '✅' : '❌';
    console.log(`   ${emoji} HTTP ${result.status} (${result.loadTime}ms)`);
    
  } catch (error: any) {
    result.errors.push(error.message);
    result.loadTime = Date.now() - startTime;
    console.log(`   ❌ Error: ${error.message.substring(0, 50)}`);
  }
  
  return result;
}

async function testAllPages() {
  console.log('\n' + '═'.repeat(80));
  console.log('🎯 TEST FINAL - TODAS LAS PÁGINAS CORREGIDAS');
  console.log('═'.repeat(80) + '\n');
  
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  
  let browser: Browser | null = null;
  const results: TestResult[] = [];
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test login primero
    console.log('🔐 Login...');
    const loginSuccess = await login(page);
    
    if (!loginSuccess) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Login OK\n');
    
    // Test todas las páginas
    for (const pageUrl of ALL_PAGES) {
      if (pageUrl === '/login') continue; // Ya probado
      const result = await testPage(page, pageUrl);
      results.push(result);
      await sleep(1000);
    }
    
    // Resumen
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESUMEN FINAL');
    console.log('═'.repeat(80));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;
    const percentage = Math.round((successful / total) * 100);
    
    console.log(`\n✅ Exitosas: ${successful}/${total} (${percentage}%)`);
    console.log(`❌ Fallidas: ${failed}/${total}`);
    
    if (failed > 0) {
      console.log('\n❌ PÁGINAS CON ERRORES:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   ${r.url} - HTTP ${r.status} - ${r.errors.join(', ')}`);
      });
    }
    
    console.log('\n✅ PÁGINAS FUNCIONANDO:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.url} - ${r.loadTime}ms`);
    });
    
    // Guardar reporte
    const reportPath = path.join(RESULTS_DIR, 'final-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Reporte: ${reportPath}\n`);
    
    // Determinar éxito
    if (percentage >= 90) {
      console.log('🎉 ¡ÉXITO! 90%+ de páginas funcionando');
      return true;
    } else if (percentage >= 70) {
      console.log('⚠️  ACEPTABLE - 70%+ funcionando pero necesita mejoras');
      return true;
    } else {
      console.log('❌ INSUFICIENTE - Menos del 70% funcionando');
      return false;
    }
    
  } catch (error: any) {
    console.error('💥 Error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testAllPages()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
