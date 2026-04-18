/**
 * Auditoría visual exhaustiva con usuario Vidaro (dvillagra@vidaroinversiones.com)
 *
 * - Login en producción
 * - Captura todas las páginas accesibles para el usuario
 * - Captura errores de consola, requests fallidos, errores 4xx/5xx
 * - Genera screenshots y reporte JSON consolidado
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.AUDIT_URL || 'https://inmovaapp.com';
const TEST_USER = process.env.TEST_USER || 'dvillagra@vidaroinversiones.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Pucela00#';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './audit-vidaro';
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

// Páginas a auditar (alineadas con módulos de inmova - usuario gestión inmobiliaria)
const PAGE_CATEGORIES = {
  public: ['/landing', '/login', '/register', '/forgot-password'],
  dashboard: ['/dashboard', '/perfil', '/notificaciones', '/configuracion/notificaciones'],
  alquiler: [
    '/propiedades',
    '/propiedades/nuevo',
    '/edificios',
    '/edificios/nuevo',
    '/unidades',
    '/inquilinos',
    '/inquilinos/nuevo',
    '/contratos',
    '/contratos/nuevo',
    '/pagos',
    '/gastos',
    '/incidencias',
    '/documentos',
    '/inspecciones',
    '/certificaciones',
    '/renovaciones',
    '/seguros',
    '/seguros/nuevo',
  ],
  inversiones: ['/inversiones/oportunidades', '/valoracion-ia'],
  finanzas: [
    '/finanzas',
    '/contabilidad',
    '/facturacion',
    '/presupuestos',
    '/impuestos',
    '/open-banking',
  ],
  comunidades: [
    '/comunidades',
    '/comunidades/cuotas',
    '/comunidades/actas',
    '/comunidades/votaciones',
    '/comunidades/finanzas',
    '/votaciones',
    '/reuniones',
    '/anuncios',
  ],
  operaciones: ['/mantenimiento', '/calendario', '/visitas', '/proveedores'],
  comunicaciones: ['/chat', '/sms', '/notificaciones/plantillas', '/notificaciones/reglas'],
  documentos: ['/firma-digital', '/firma-digital/templates', '/plantillas-legales', '/plantillas'],
  analytics: ['/analytics', '/bi', '/reportes', '/reportes/financieros', '/estadisticas'],
  crm: ['/crm', '/candidatos', '/screening', '/valoraciones'],
  portales: ['/portal-inquilino/dashboard', '/portal-propietario'],
  soporte: ['/soporte', '/sugerencias', '/knowledge-base'],
};

const log = (msg, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  const t = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[type]}[${t}] ${msg}${colors.reset}`);
};

const sanitize = (s) => s.replace(/[\/?]/g, '_').replace(/^_/, '') || 'home';

async function setupBrowser() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 AuditBot Vidaro (Playwright Chromium)',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(45000);
  return { browser, context, page };
}

async function login(page) {
  log('🔐 Login Vidaro...', 'info');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"], input[name="email"]', TEST_USER);
  await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(4000);
  const url = page.url();
  if (url.includes('/login') || url.includes('error')) {
    log(`❌ Login falló. URL final: ${url}`, 'error');
    return false;
  }
  log(`✅ Login OK. URL: ${url}`, 'success');
  return true;
}

async function auditPage(page, url, category) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const result = {
    url,
    category,
    fullUrl,
    status: 'success',
    httpStatus: null,
    loadTime: 0,
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    networkErrors: [],
    failedRequests: [],
    buttonsFound: 0,
    inputsFound: 0,
    formsFound: 0,
    visibleErrorTexts: [],
    title: '',
    finalUrl: '',
    notes: [],
  };

  const consoleMessages = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];

  const onConsole = (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') consoleMessages.push(text);
    else if (msg.type() === 'warning') consoleWarnings.push(text);
  };
  const onPageError = (err) => pageErrors.push(err.message || String(err));
  const onResponse = (resp) => {
    const status = resp.status();
    if (status >= 400) failedRequests.push(`${status} ${resp.url()}`);
  };
  const onRequestFailed = (req) => {
    failedRequests.push(`FAIL ${req.url()} - ${req.failure()?.errorText || 'unknown'}`);
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('response', onResponse);
  page.on('requestfailed', onRequestFailed);

  const startTime = Date.now();
  try {
    const response = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    result.httpStatus = response?.status() || null;
    result.loadTime = Date.now() - startTime;
    result.finalUrl = page.url();

    await page.waitForTimeout(2500);

    // Detect redirects to login (= sin permiso)
    if (result.finalUrl.includes('/login') && !url.includes('/login')) {
      result.status = 'warning';
      result.notes.push('Redirige a /login (sin permiso o sesión)');
    }

    if (result.httpStatus && result.httpStatus >= 400) {
      result.status = 'error';
      result.notes.push(`HTTP ${result.httpStatus}`);
    }

    result.title = (await page.title()) || '';

    // Buscar mensajes de error visibles
    const errorTexts = await page
      .$$eval(
        '[role="alert"], .error, .error-message, [class*="error"], [data-testid*="error"]',
        (els) =>
          els
            .map((e) => (e.textContent || '').trim())
            .filter(Boolean)
            .slice(0, 5)
      )
      .catch(() => []);
    result.visibleErrorTexts = errorTexts;

    // Detect server error messages in body
    const bodyText = (await page.textContent('body').catch(() => '')) || '';
    if (
      /Application error|Internal Server Error|500|Error 500|Server Error|TypeError:|ReferenceError:/.test(
        bodyText
      )
    ) {
      // limit detection to short body or visible top-level
      if (bodyText.length < 5000 || /Application error/i.test(bodyText.slice(0, 500))) {
        result.status = 'error';
        result.notes.push('Error de servidor detectado en body');
      }
    }
    if (
      /404|Página no encontrada|Page not found|Not Found/i.test(bodyText.slice(0, 1000)) &&
      !bodyText.includes('dashboard')
    ) {
      // posible 404 page
      if (result.httpStatus === 404 || bodyText.length < 3000) {
        result.status = 'error';
        result.notes.push('Posible página 404');
      }
    }

    // Conteo elementos
    result.buttonsFound = await page
      .$$eval('button, a[role="button"]', (els) => els.length)
      .catch(() => 0);
    result.inputsFound = await page
      .$$eval('input, select, textarea', (els) => els.length)
      .catch(() => 0);
    result.formsFound = await page.$$eval('form', (els) => els.length).catch(() => 0);

    // Screenshot
    const fname = `${category}__${sanitize(url)}.png`;
    const fpath = path.join(SCREENSHOTS_DIR, fname);
    await page.screenshot({ path: fpath, fullPage: false }).catch(() => {});
    result.screenshot = fname;

    // Filtrado de console errors irrelevantes
    result.consoleErrors = consoleMessages.filter((m) => {
      const t = m.toLowerCase();
      if (t.includes('favicon')) return false;
      if (t.includes('chunk-')) return false;
      if (t.includes('preload')) return false;
      if (t.includes('cookie') && t.includes('partitioned')) return false;
      if (t.includes('crisp')) return false;
      if (t.includes('translate.googleapis')) return false;
      return true;
    });
    result.consoleWarnings = consoleWarnings.slice(0, 10);
    result.pageErrors = pageErrors;
    result.failedRequests = failedRequests.filter((r) => {
      const t = r.toLowerCase();
      // Filter out third-party noise
      if (t.includes('crisp.chat')) return false;
      if (t.includes('googletagmanager')) return false;
      if (t.includes('google-analytics')) return false;
      if (t.includes('cloudflareinsights')) return false;
      if (t.includes('translate.googleapis')) return false;
      return true;
    });

    if (
      result.pageErrors.length > 0 ||
      result.consoleErrors.length > 0 ||
      result.failedRequests.length > 0
    ) {
      if (result.status === 'success') result.status = 'warning';
    }
  } catch (e) {
    result.status = 'error';
    result.loadTime = Date.now() - startTime;
    result.notes.push(`Excepción: ${(e.message || String(e)).substring(0, 200)}`);
  } finally {
    page.removeListener('console', onConsole);
    page.removeListener('pageerror', onPageError);
    page.removeListener('response', onResponse);
    page.removeListener('requestfailed', onRequestFailed);
  }

  return result;
}

async function main() {
  log('🚀 AUDITORÍA VIDARO - INMOVA APP', 'info');
  log(`📍 BASE: ${BASE_URL} | USER: ${TEST_USER}`, 'info');

  const { browser, context, page } = await setupBrowser();
  const results = [];

  try {
    // Audit públicas
    log('\n=== PÚBLICAS ===', 'info');
    for (const url of PAGE_CATEGORIES.public) {
      const r = await auditPage(page, url, 'public');
      results.push(r);
      const icon = r.status === 'success' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
      log(
        `  ${icon} ${url} (${r.loadTime}ms) ${r.notes.join('; ')}`,
        r.status === 'success' ? 'success' : r.status === 'warning' ? 'warning' : 'error'
      );
    }

    // Login
    const ok = await login(page);
    if (!ok) {
      log('Login falló, abortando privadas', 'error');
    } else {
      const cats = Object.entries(PAGE_CATEGORIES).filter(([k]) => k !== 'public');
      for (const [cat, urls] of cats) {
        log(`\n=== ${cat.toUpperCase()} ===`, 'info');
        for (const url of urls) {
          const r = await auditPage(page, url, cat);
          results.push(r);
          const icon = r.status === 'success' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
          const noteStr = r.notes.length ? ` - ${r.notes.join('; ')}` : '';
          log(
            `  ${icon} ${url} (${r.loadTime}ms)${noteStr}`,
            r.status === 'success' ? 'success' : r.status === 'warning' ? 'warning' : 'error'
          );

          // Mostrar errores brevemente
          if (r.consoleErrors.length)
            log(`     console: ${r.consoleErrors[0].substring(0, 150)}`, 'error');
          if (r.failedRequests.length)
            log(`     net: ${r.failedRequests[0].substring(0, 150)}`, 'error');
          if (r.pageErrors.length) log(`     page: ${r.pageErrors[0].substring(0, 150)}`, 'error');
        }
      }
    }
  } catch (e) {
    log(`Excepción global: ${e.message}`, 'error');
  } finally {
    await browser.close();
  }

  // Reporte
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    user: TEST_USER,
    total: results.length,
    success: results.filter((r) => r.status === 'success').length,
    warnings: results.filter((r) => r.status === 'warning').length,
    errors: results.filter((r) => r.status === 'error').length,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'report.json'),
    JSON.stringify({ summary, results }, null, 2)
  );

  // Reporte texto
  let txt = `\n=== RESUMEN AUDITORÍA VIDARO ===\n${JSON.stringify(summary, null, 2)}\n\n`;
  txt += '=== PROBLEMAS DETECTADOS ===\n';
  for (const r of results.filter((r) => r.status !== 'success')) {
    txt += `\n[${r.status.toUpperCase()}] ${r.url} (${r.category})`;
    if (r.httpStatus) txt += ` HTTP=${r.httpStatus}`;
    if (r.notes.length) txt += `\n  notes: ${r.notes.join(' | ')}`;
    if (r.consoleErrors.length)
      txt += `\n  console (${r.consoleErrors.length}):\n    - ${r.consoleErrors.slice(0, 5).join('\n    - ').substring(0, 800)}`;
    if (r.pageErrors.length)
      txt += `\n  pageErrors:\n    - ${r.pageErrors.slice(0, 5).join('\n    - ').substring(0, 800)}`;
    if (r.failedRequests.length)
      txt += `\n  failedRequests (${r.failedRequests.length}):\n    - ${r.failedRequests.slice(0, 8).join('\n    - ').substring(0, 1500)}`;
    if (r.visibleErrorTexts.length)
      txt += `\n  visibleErrors:\n    - ${r.visibleErrorTexts.slice(0, 3).join('\n    - ').substring(0, 600)}`;
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'report.txt'), txt);

  log('\n=========== RESUMEN ===========', 'info');
  log(
    `Total: ${summary.total} | OK: ${summary.success} | WARN: ${summary.warnings} | ERROR: ${summary.errors}`,
    'info'
  );
  log(`Reporte: ${OUTPUT_DIR}/report.json y report.txt`, 'info');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
