/**
 * Script para probar las páginas restantes que dieron error
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'pages-retest');
const BASE_URL = 'https://inmovaapp.com';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Test1234!';

// Páginas que necesitan ser probadas/corregidas
const CRITICAL_PAGES = [
  '/edificios',  // Ya corregido, verificar
  '/dashboard',  // Verificar errores menores
  '/unidades',
  '/inquilinos',
  '/contratos',
  '/candidatos',
  '/reportes',
  '/analytics',
  '/facturacion',
  '/configuracion',
  '/perfil',
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
  const fullUrl = `${BASE_URL}${url}`;
  const pageName = url.replace(/\//g, '_') || '_root';
  const startTime = Date.now();
  
  const result: TestResult = {
    url,
    status: 0,
    success: false,
    loadTime: 0,
    errors: [],
  };
  
  console.log(`\n📄 Probando: ${url}`);
  
  try {
    const response = await page.goto(fullUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    
    result.status = response?.status() || 0;
    result.loadTime = Date.now() - startTime;
    
    await sleep(2000);
    
    // Tomar screenshot
    const screenshotPath = path.join(RESULTS_DIR, `${pageName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Verificar contenido
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    if (result.status >= 200 && result.status < 400) {
      if (pageContent.includes('404') || pageContent.includes('Not Found')) {
        result.errors.push('404 en contenido');
      } else if (pageContent.includes('Error') || pageContent.includes('error')) {
        result.errors.push('Mensaje de error en página');
      } else {
        result.success = true;
      }
    } else {
      result.errors.push(`HTTP ${result.status}`);
    }
    
    console.log(`   ${result.success ? '✅' : '❌'} HTTP ${result.status} (${result.loadTime}ms)`);
    if (result.errors.length > 0) {
      result.errors.forEach(e => console.log(`      - ${e}`));
    }
    
  } catch (error: any) {
    result.errors.push(error.message);
    result.loadTime = Date.now() - startTime;
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  return result;
}

async function testAllPages() {
  console.log('\n' + '═'.repeat(80));
  console.log('🔍 RE-TEST DE PÁGINAS CRÍTICAS');
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
    
    // Login
    console.log('🔐 Logging in...');
    const loginSuccess = await login(page);
    
    if (!loginSuccess) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Login successful\n');
    
    // Test pages
    for (const pageUrl of CRITICAL_PAGES) {
      const result = await testPage(page, pageUrl);
      results.push(result);
      await sleep(1000);
    }
    
    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESUMEN');
    console.log('═'.repeat(80));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n✅ Exitosas: ${successful}/${results.length}`);
    console.log(`❌ Fallidas: ${failed}/${results.length}`);
    
    console.log('\n❌ PÁGINAS CON ERRORES:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`\n   ${r.url}`);
      console.log(`      HTTP ${r.status} (${r.loadTime}ms)`);
      r.errors.forEach(e => console.log(`      - ${e}`));
    });
    
    // Save report
    const reportPath = path.join(RESULTS_DIR, 'retest-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Reporte: ${reportPath}\n`);
    
  } catch (error: any) {
    console.error('💥 Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return results;
}

testAllPages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
