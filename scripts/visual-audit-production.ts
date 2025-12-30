/**
 * Auditoría Visual Completa - DIRECTO A PRODUCCIÓN
 * Evita problemas de middleware local
 */
import { chromium, Browser, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://inmovaapp.com';
const LOGIN_EMAIL = 'admin@inmova.app';
const LOGIN_PASSWORD = 'Admin123!';

const OUTPUT_DIR = join(process.cwd(), 'visual-audit-results');
const DESKTOP_DIR = join(OUTPUT_DIR, 'desktop');
const MOBILE_DIR = join(OUTPUT_DIR, 'mobile');
const LOGS_FILE = join(OUTPUT_DIR, 'audit-logs.txt');

const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

// Cargar rutas desde archivo
const routesFile = '/tmp/all-routes.txt';
let ROUTES: string[] = [];

if (existsSync(routesFile)) {
  const content = readFileSync(routesFile, 'utf-8');
  ROUTES = content.split('\n').filter(r => r.trim());
  console.log(`✅ Cargadas ${ROUTES.length} rutas desde ${routesFile}`);
} else {
  console.error(`❌ Archivo ${routesFile} no encontrado`);
  process.exit(1);
}

// Crear directorios
[OUTPUT_DIR, DESKTOP_DIR, MOBILE_DIR].forEach((dir) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

interface AuditLog {
  route: string;
  viewport: 'desktop' | 'mobile';
  timestamp: string;
  consoleErrors: string[];
  networkErrors: string[];
  cssError: boolean;
}

const logs: AuditLog[] = [];

async function login(page: Page) {
  console.log('  🔐 Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', LOGIN_EMAIL);
  await page.fill('input[name="password"]', LOGIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => url.pathname.includes('/dashboard') || url.pathname.includes('/admin'), { timeout: 15000 });
  console.log('  ✅ Logged in');
}

async function auditPage(browser: Browser, route: string, viewport: typeof DESKTOP_VIEWPORT, viewportName: 'desktop' | 'mobile') {
  const context = await browser.newContext({
    viewport,
    userAgent: viewportName === 'mobile' 
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      : undefined
  });
  
  const page = await context.newPage();
  
  const log: AuditLog = {
    route,
    viewport: viewportName,
    timestamp: new Date().toISOString(),
    consoleErrors: [],
    networkErrors: [],
    cssError: false
  };

  // Interceptar errores de consola
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      log.consoleErrors.push(text);
      
      // Detectar error CSS específico
      if (text.includes('Invalid or unexpected token') || text.includes('Unexpected token')) {
        log.cssError = true;
      }
    }
  });

  // Interceptar errores de red
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      log.networkErrors.push(`${status} ${response.url()}`);
    }
  });

  try {
    // Login si es la primera página
    if (route === ROUTES[0]) {
      await login(page);
    }

    // Navegar a la ruta
    await page.goto(`${BASE_URL}${route}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    }).catch(() => {
      log.networkErrors.push(`Timeout navigating to ${route}`);
    });

    await page.waitForTimeout(2000);

    // Capturar screenshot
    const filename = `screenshot-${viewportName}-${route.replace(/\//g, '-').substring(1) || 'home'}.png`;
    const filepath = join(viewportName === 'desktop' ? DESKTOP_DIR : MOBILE_DIR, filename);
    
    await page.screenshot({ path: filepath, fullPage: false });

  } catch (error: any) {
    log.networkErrors.push(`Error: ${error.message}`);
  } finally {
    logs.push(log);
    await context.close();
  }
}

async function main() {
  console.log('🎬 Iniciando Auditoría Visual de Producción');
  console.log(`📍 URL Base: ${BASE_URL}`);
  console.log(`📊 Total de rutas: ${ROUTES.length}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });

  let completed = 0;
  const total = ROUTES.length * 2; // desktop + mobile

  for (const route of ROUTES) {
    console.log(`\n[${++completed}/${total}] Auditando: ${route} (desktop)`);
    await auditPage(browser, route, DESKTOP_VIEWPORT, 'desktop');

    console.log(`[${++completed}/${total}] Auditando: ${route} (mobile)`);
    await auditPage(browser, route, MOBILE_VIEWPORT, 'mobile');
  }

  await browser.close();

  // Generar reporte
  const report = logs.map(log => {
    const errors = [
      ...log.consoleErrors.map(e => `[CONSOLE] ${e}`),
      ...log.networkErrors.map(e => `[NETWORK] ${e}`)
    ];
    
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route: ${log.route} (${log.viewport})
Time: ${log.timestamp}
CSS Error: ${log.cssError ? '❌ YES' : '✅ NO'}
Console Errors: ${log.consoleErrors.length}
Network Errors: ${log.networkErrors.length}
${errors.length > 0 ? '\nErrors:\n' + errors.join('\n') : ''}
`;
  }).join('\n');

  writeFileSync(LOGS_FILE, report);

  // Resumen
  const cssErrorCount = logs.filter(l => l.cssError).length;
  const totalErrors = logs.reduce((sum, l) => sum + l.consoleErrors.length + l.networkErrors.length, 0);

  console.log('\n\n📊 RESUMEN DE AUDITORÍA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Páginas auditadas: ${logs.length}`);
  console.log(`❌ Páginas con error CSS: ${cssErrorCount} (${(cssErrorCount/logs.length*100).toFixed(1)}%)`);
  console.log(`⚠️  Total de errores: ${totalErrors}`);
  console.log(`📁 Capturas: ${DESKTOP_DIR} y ${MOBILE_DIR}`);
  console.log(`📄 Logs: ${LOGS_FILE}`);
}

main().catch(console.error);
