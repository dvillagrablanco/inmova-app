/**
 * Auditoría Precisa de Inmova App
 * Verifica HTTP status codes reales y errores de JS
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';

const BASE_URL = process.env.AUDIT_URL || 'https://inmovaapp.com';
const TEST_USER = process.env.TEST_USER || 'admin@inmova.app';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Admin123!';

// Páginas críticas a auditar (subset representativo)
const CRITICAL_PAGES = [
  // Públicas
  { url: '/landing', name: 'Landing', requiresAuth: false },
  { url: '/login', name: 'Login', requiresAuth: false },
  { url: '/landing/precios', name: 'Precios', requiresAuth: false },
  
  // Dashboard
  { url: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { url: '/perfil', name: 'Perfil', requiresAuth: true },
  
  // Alquiler Tradicional
  { url: '/propiedades', name: 'Propiedades', requiresAuth: true },
  { url: '/inquilinos', name: 'Inquilinos', requiresAuth: true },
  { url: '/contratos', name: 'Contratos', requiresAuth: true },
  { url: '/pagos', name: 'Pagos', requiresAuth: true },
  
  // STR
  { url: '/str', name: 'STR Dashboard', requiresAuth: true },
  { url: '/str/listings', name: 'STR Listings', requiresAuth: true },
  { url: '/str/bookings', name: 'STR Bookings', requiresAuth: true },
  
  // Coliving
  { url: '/coliving/propiedades', name: 'Coliving Propiedades', requiresAuth: true },
  { url: '/coliving/eventos', name: 'Coliving Eventos', requiresAuth: true },
  
  // Finanzas
  { url: '/finanzas', name: 'Finanzas', requiresAuth: true },
  { url: '/contabilidad', name: 'Contabilidad', requiresAuth: true },
  
  // CRM
  { url: '/crm', name: 'CRM', requiresAuth: true },
  { url: '/candidatos', name: 'Candidatos', requiresAuth: true },
  
  // Tecnología
  { url: '/tours-virtuales', name: 'Tours Virtuales', requiresAuth: true },
  { url: '/blockchain', name: 'Blockchain', requiresAuth: true },
  { url: '/iot', name: 'IoT', requiresAuth: true },
  { url: '/esg', name: 'ESG', requiresAuth: true },
  
  // Admin
  { url: '/admin', name: 'Admin', requiresAuth: true },
  { url: '/admin/usuarios', name: 'Admin Usuarios', requiresAuth: true },
];

interface PageResult {
  url: string;
  name: string;
  httpStatus: number;
  loadTime: number;
  jsErrors: string[];
  apiErrors: string[];
  buttonsCount: number;
  status: 'OK' | 'WARNING' | 'ERROR';
  notes: string[];
}

let browser: Browser;
let context: BrowserContext;
let page: Page;
const results: PageResult[] = [];

async function setup() {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
}

async function login() {
  console.log('🔐 Iniciando sesión...');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"], input[type="email"]', TEST_USER);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      console.log('✅ Login exitoso');
      return true;
    }
    console.log('❌ Login falló');
    return false;
  } catch (error: any) {
    console.log(`❌ Error en login: ${error.message}`);
    return false;
  }
}

async function auditPage(pageInfo: typeof CRITICAL_PAGES[0]): Promise<PageResult> {
  const result: PageResult = {
    url: pageInfo.url,
    name: pageInfo.name,
    httpStatus: 0,
    loadTime: 0,
    jsErrors: [],
    apiErrors: [],
    buttonsCount: 0,
    status: 'OK',
    notes: [],
  };

  const jsErrors: string[] = [];
  const apiErrors: string[] = [];

  // Capturar errores de consola
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('preload')) {
        jsErrors.push(text.substring(0, 200));
      }
    }
  });

  // Capturar errores de API
  page.on('response', response => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      apiErrors.push(`${response.status()} ${response.url().split('/api/')[1]?.split('?')[0] || 'unknown'}`);
    }
  });

  const startTime = Date.now();

  try {
    const response = await page.goto(`${BASE_URL}${pageInfo.url}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    result.httpStatus = response?.status() || 0;
    result.loadTime = Date.now() - startTime;

    // Esperar a que se carguen componentes
    await page.waitForTimeout(3000);

    // Contar botones
    const buttons = await page.$$('button, a[role="button"]');
    result.buttonsCount = buttons.length;

    // Verificar si hay mensaje de error visible
    const errorText = await page.textContent('body');
    if (errorText?.includes('Error 500') || errorText?.includes('500 Error')) {
      result.notes.push('Mensaje de error 500 visible en página');
    }
    if (errorText?.includes('404') && errorText?.includes('not found')) {
      result.notes.push('Mensaje 404 visible en página');
    }

    // Asignar errores capturados
    result.jsErrors = jsErrors;
    result.apiErrors = apiErrors;

    // Determinar estado
    if (result.httpStatus >= 500) {
      result.status = 'ERROR';
      result.notes.push(`HTTP ${result.httpStatus}`);
    } else if (result.httpStatus >= 400) {
      result.status = 'ERROR';
      result.notes.push(`HTTP ${result.httpStatus}`);
    } else if (apiErrors.length > 0) {
      result.status = 'WARNING';
      result.notes.push(`${apiErrors.length} errores de API`);
    } else if (jsErrors.length > 0) {
      result.status = 'WARNING';
      result.notes.push(`${jsErrors.length} errores JS`);
    }

  } catch (error: any) {
    result.status = 'ERROR';
    result.loadTime = Date.now() - startTime;
    result.notes.push(error.message.substring(0, 100));
  }

  // Limpiar listeners
  page.removeAllListeners('console');
  page.removeAllListeners('response');

  return result;
}

async function runAudit() {
  console.log('🚀 AUDITORÍA PRECISA DE INMOVA APP');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log('=' .repeat(60));

  await setup();

  // Auditar páginas públicas
  console.log('\n📋 PÁGINAS PÚBLICAS');
  for (const pageInfo of CRITICAL_PAGES.filter(p => !p.requiresAuth)) {
    const result = await auditPage(pageInfo);
    results.push(result);
    const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${result.name} - HTTP ${result.httpStatus} (${result.loadTime}ms)`);
    if (result.notes.length > 0) {
      console.log(`     └── ${result.notes.join(', ')}`);
    }
  }

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('❌ No se pudo autenticar. Abortando páginas protegidas.');
    await generateReport();
    await browser.close();
    return;
  }

  // Auditar páginas protegidas
  console.log('\n📋 PÁGINAS PROTEGIDAS');
  for (const pageInfo of CRITICAL_PAGES.filter(p => p.requiresAuth)) {
    const result = await auditPage(pageInfo);
    results.push(result);
    const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${result.name} - HTTP ${result.httpStatus} (${result.loadTime}ms)`);
    if (result.notes.length > 0) {
      console.log(`     └── ${result.notes.join(', ')}`);
    }
    if (result.apiErrors.length > 0) {
      console.log(`     └── API: ${result.apiErrors.slice(0, 3).join(', ')}`);
    }
  }

  await generateReport();
  await browser.close();
}

async function generateReport() {
  const okCount = results.filter(r => r.status === 'OK').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;

  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMEN DE AUDITORÍA');
  console.log('=' .repeat(60));
  console.log(`Total páginas: ${results.length}`);
  console.log(`✅ OK: ${okCount} (${((okCount/results.length)*100).toFixed(0)}%)`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errores: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n❌ PÁGINAS CON ERROR:');
    for (const r of results.filter(r => r.status === 'ERROR')) {
      console.log(`   - ${r.name} (${r.url}): ${r.notes.join(', ')}`);
    }
  }

  if (warningCount > 0) {
    console.log('\n⚠️  PÁGINAS CON WARNINGS:');
    for (const r of results.filter(r => r.status === 'WARNING')) {
      console.log(`   - ${r.name} (${r.url}): ${r.notes.join(', ')}`);
      if (r.apiErrors.length > 0) {
        console.log(`     API Errors: ${r.apiErrors.slice(0, 5).join(', ')}`);
      }
    }
  }

  // Guardar JSON
  fs.writeFileSync('./audit-results/audit-precise.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: { ok: okCount, warnings: warningCount, errors: errorCount, total: results.length },
    results,
  }, null, 2));

  console.log('\n📁 Reporte guardado en: audit-results/audit-precise.json');
}

runAudit().catch(console.error);
