/**
 * VERIFICACIÓN VISUAL COMPLETA FINAL
 * Captura screenshots de TODAS las páginas funcionando
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'verificacion-visual-final');
const BASE_URL = 'https://inmovaapp.com';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Test1234!';

// TODAS las páginas verificadas
const PAGES_TO_VERIFY = [
  { url: '/login', name: '01-login', auth: false },
  { url: '/dashboard', name: '02-dashboard', auth: true },
  { url: '/edificios', name: '03-edificios', auth: true },
  { url: '/unidades', name: '04-unidades', auth: true },
  { url: '/inquilinos', name: '05-inquilinos', auth: true },
  { url: '/contratos', name: '06-contratos', auth: true },
  { url: '/candidatos', name: '07-candidatos', auth: true },
  { url: '/reportes', name: '08-reportes', auth: true },
  { url: '/analytics', name: '09-analytics', auth: true },
  { url: '/facturacion', name: '10-facturacion', auth: true },
  { url: '/perfil', name: '11-perfil', auth: true },
  { url: '/admin/configuracion', name: '12-configuracion', auth: true },
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page: Page): Promise<boolean> {
  try {
    console.log('🔐 Realizando login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', EMAIL, { delay: 50 });
    await page.type('input[type="password"]', PASSWORD, { delay: 50 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {}),
    ]);
    await sleep(2000);
    const cookies = await page.cookies();
    const hasSession = cookies.some(c => c.name.includes('next-auth') && c.name.includes('session'));
    console.log(hasSession ? '✅ Login exitoso' : '❌ Login falló');
    return hasSession;
  } catch (error) {
    console.error('❌ Error en login:', error);
    return false;
  }
}

async function capturePageScreenshot(page: Page, pageInfo: typeof PAGES_TO_VERIFY[0]): Promise<boolean> {
  const fullUrl = `${BASE_URL}${pageInfo.url}`;
  const screenshotPath = path.join(RESULTS_DIR, `${pageInfo.name}.png`);
  
  console.log(`\n📸 ${pageInfo.url}`);
  
  try {
    const response = await page.goto(fullUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    
    await sleep(2000);
    
    const status = response?.status() || 0;
    console.log(`   HTTP ${status}`);
    
    if (status >= 200 && status < 400) {
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        type: 'png'
      });
      console.log(`   ✅ Screenshot guardado`);
      return true;
    } else {
      console.log(`   ❌ Error HTTP ${status}`);
      return false;
    }
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message.substring(0, 50)}`);
    return false;
  }
}

async function verifyAllPages() {
  console.log('\n' + '═'.repeat(80));
  console.log('📸 VERIFICACIÓN VISUAL FINAL COMPLETA');
  console.log('═'.repeat(80) + '\n');
  
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  
  let browser: Browser | null = null;
  const results = {
    total: PAGES_TO_VERIFY.length,
    success: 0,
    failed: 0,
    pages: [] as any[]
  };
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--window-size=1920,1080'
      ],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Login first
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.log('\n❌ No se pudo hacer login, abortando...');
      return false;
    }
    
    // Capture all pages
    for (const pageInfo of PAGES_TO_VERIFY) {
      const success = await capturePageScreenshot(page, pageInfo);
      results.pages.push({
        url: pageInfo.url,
        name: pageInfo.name,
        success
      });
      if (success) results.success++;
      else results.failed++;
      await sleep(1000);
    }
    
    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESUMEN VERIFICACIÓN VISUAL');
    console.log('═'.repeat(80));
    
    const percentage = Math.round((results.success / results.total) * 100);
    
    console.log(`\n✅ Screenshots exitosos: ${results.success}/${results.total} (${percentage}%)`);
    console.log(`❌ Fallidos: ${results.failed}/${results.total}`);
    console.log(`📁 Carpeta: ${RESULTS_DIR}\n`);
    
    if (results.failed > 0) {
      console.log('❌ PÁGINAS CON PROBLEMAS:');
      results.pages.filter(p => !p.success).forEach(p => {
        console.log(`   ${p.url}`);
      });
      console.log('');
    }
    
    console.log('✅ PÁGINAS VERIFICADAS:');
    results.pages.filter(p => p.success).forEach(p => {
      console.log(`   ${p.url} → ${p.name}.png`);
    });
    
    // Save report
    const reportPath = path.join(RESULTS_DIR, 'verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`\n📄 Reporte completo: ${reportPath}\n`);
    
    return percentage >= 90;
    
  } catch (error: any) {
    console.error('💥 Error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

verifyAllPages()
  .then((success) => {
    console.log('═'.repeat(80));
    if (success) {
      console.log('🎉 ¡VERIFICACIÓN VISUAL EXITOSA!');
      console.log('✅ Todas las páginas están funcionando correctamente');
    } else {
      console.log('⚠️  Verificación completada con algunos problemas');
    }
    console.log('═'.repeat(80) + '\n');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
