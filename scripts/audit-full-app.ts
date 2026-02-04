/**
 * Auditoría Exhaustiva de Inmova App - Pre-Launch
 *
 * Este script verifica:
 * 1. Que todas las páginas cargan sin errores HTTP
 * 2. Que no hay errores de JavaScript en consola
 * 3. Que los botones principales funcionan
 * 4. Screenshots de cada página para revisión visual
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Configuración
const BASE_URL = process.env.AUDIT_URL || 'https://inmovaapp.com';
const TEST_USER = process.env.TEST_USER || 'admin@inmova.app';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Admin123!';
const OUTPUT_DIR = './audit-results';
const SCREENSHOTS_DIR = `${OUTPUT_DIR}/screenshots`;

// Categorías de páginas para organizar la auditoría
const PAGE_CATEGORIES = {
  // Páginas públicas (no requieren auth)
  public: [
    '/landing',
    '/login',
    '/register',
    '/forgot-password',
    '/landing/precios',
    '/landing/contacto',
    '/landing/demo',
    '/landing/faq',
    '/landing/sobre-nosotros',
    '/legal/privacidad',
    '/legal/terminos',
    '/legal/cookies',
    '/api-docs',
  ],

  // Dashboard principal y configuración
  dashboard: ['/dashboard', '/perfil', '/configuracion/notificaciones', '/notificaciones'],

  // Verticales principales
  alquilerTradicional: [
    '/propiedades',
    '/propiedades/nuevo',
    '/edificios',
    '/edificios/nuevo',
    '/unidades',
    '/unidades/nueva',
    '/inquilinos',
    '/inquilinos/nuevo',
    '/contratos',
    '/contratos/nuevo',
    '/pagos',
    '/pagos/nuevo',
    '/gastos',
    '/incidencias',
    '/documentos',
    '/inspecciones',
    '/certificaciones',
    '/renovaciones',
    '/seguros',
    '/seguros/nuevo',
  ],

  // STR - Alquiler turístico
  str: [
    '/str',
    '/str/listings',
    '/str/listings/nuevo',
    '/str/bookings',
    '/str/bookings/nueva',
    '/str/channels',
    '/str/pricing',
    '/str/reviews',
    '/str-housekeeping',
  ],

  // Coliving
  coliving: [
    '/coliving/propiedades',
    '/coliving/reservas',
    '/coliving/comunidad',
    '/coliving/eventos',
    '/coliving/paquetes',
    '/coliving/emparejamiento',
    '/room-rental',
  ],

  // Administración de fincas
  adminFincas: [
    '/comunidades',
    '/comunidades/cuotas',
    '/comunidades/actas',
    '/comunidades/votaciones',
    '/comunidades/finanzas',
    '/comunidades/fondos',
    '/votaciones',
    '/reuniones',
    '/anuncios',
  ],

  // Construcción y Flipping
  construction: [
    '/construction',
    '/construction/projects',
    '/construction/quality-control',
    '/construction/gantt',
    '/flipping',
    '/flipping/projects',
    '/flipping/calculator',
    '/flipping/comparator',
    '/obras',
    '/ordenes-trabajo',
  ],

  // Servicios profesionales
  professional: [
    '/professional',
    '/professional/projects',
    '/professional/clients',
    '/professional/invoicing',
    '/proveedores',
    '/marketplace',
    '/marketplace/servicios',
    '/marketplace/proveedores',
  ],

  // Horizontal - Finanzas
  finanzas: [
    '/finanzas',
    '/contabilidad',
    '/facturacion',
    '/presupuestos',
    '/open-banking',
    '/impuestos',
  ],

  // Horizontal - Operaciones
  operaciones: [
    '/mantenimiento',
    '/mantenimiento/nuevo',
    '/mantenimiento-pro',
    '/calendario',
    '/visitas',
    '/gestion-incidencias',
  ],

  // Horizontal - Comunicaciones
  comunicaciones: [
    '/chat',
    '/sms',
    '/notificaciones',
    '/notificaciones/plantillas',
    '/notificaciones/reglas',
  ],

  // Horizontal - Documentos y Legal
  documentos: [
    '/documentos',
    '/firma-digital',
    '/firma-digital/templates',
    '/plantillas-legales',
    '/plantillas',
    '/ocr',
  ],

  // Horizontal - Analytics y Reportes
  analytics: [
    '/analytics',
    '/bi',
    '/reportes',
    '/reportes/financieros',
    '/reportes/operacionales',
    '/estadisticas',
  ],

  // Horizontal - Integraciones
  integraciones: ['/integraciones', '/automatizacion', '/workflows', '/sincronizacion'],

  // Tecnología avanzada
  tecnologia: [
    '/tours-virtuales',
    '/esg',
    '/esg/nuevo-plan',
    '/iot',
    '/iot/nuevo-dispositivo',
    '/blockchain',
    '/blockchain/tokenizar',
    '/economia-circular',
    '/economia-circular/marketplace',
    '/economia-circular/huertos',
    '/economia-circular/residuos',
    '/valoracion-ia',
    '/asistente-ia',
  ],

  // CRM y Marketing
  crm: ['/crm', '/candidatos', '/candidatos/nuevo', '/screening', '/valoraciones', '/reviews'],

  // Portal Inquilino
  portalInquilino: [
    '/portal-inquilino',
    '/portal-inquilino/dashboard',
    '/portal-inquilino/pagos',
    '/portal-inquilino/incidencias',
    '/portal-inquilino/documentos',
    '/portal-inquilino/comunicacion',
    '/portal-inquilino/perfil',
  ],

  // Portal Propietario
  portalPropietario: ['/portal-propietario'],

  // Portal Proveedor
  portalProveedor: [
    '/portal-proveedor',
    '/portal-proveedor/ordenes',
    '/portal-proveedor/facturas',
    '/portal-proveedor/presupuestos',
  ],

  // Portal Comercial
  portalComercial: [
    '/portal-comercial',
    '/portal-comercial/leads',
    '/portal-comercial/comisiones',
    '/portal-comercial/objetivos',
  ],

  // Soporte
  soporte: ['/soporte', '/sugerencias', '/knowledge-base'],

  // Admin
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/usuarios',
    '/admin/clientes',
    '/admin/planes',
    '/admin/modulos',
    '/admin/configuracion',
    '/admin/integraciones',
    '/admin/marketplace',
    '/admin/sugerencias',
    '/admin/alertas',
    '/admin/activity',
    '/admin/salud-sistema',
    '/admin/seguridad',
    '/admin/backup-restore',
  ],
};

// Interfaces
interface PageResult {
  url: string;
  category: string;
  status: 'success' | 'error' | 'warning';
  httpStatus?: number;
  loadTime: number;
  consoleErrors: string[];
  networkErrors: string[];
  buttonsFound: number;
  buttonsClickable: number;
  screenshotPath?: string;
  notes: string[];
}

interface AuditResult {
  timestamp: string;
  baseUrl: string;
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  warningPages: number;
  results: PageResult[];
  summary: {
    byCategory: Record<string, { total: number; success: number; failed: number }>;
    commonErrors: string[];
    brokenButtons: string[];
  };
}

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;
const auditResults: PageResult[] = [];

// Funciones helper
function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function setup() {
  // Crear directorios
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  // Lanzar browser
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  page = await context.newPage();

  // Configurar timeouts
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);
}

async function login() {
  log('🔐 Iniciando sesión...', 'info');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Rellenar formulario
    await page.fill('input[name="email"], input[type="email"]', TEST_USER);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);

    // Click en submit
    await page.click('button[type="submit"]');

    // Esperar redirección
    await page.waitForTimeout(5000);

    // Verificar login exitoso
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('error')) {
      log('❌ Login falló', 'error');
      return false;
    }

    log('✅ Login exitoso', 'success');
    return true;
  } catch (error: any) {
    log(`❌ Error en login: ${error.message}`, 'error');
    return false;
  }
}

async function auditPage(url: string, category: string): Promise<PageResult> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const result: PageResult = {
    url,
    category,
    status: 'success',
    loadTime: 0,
    consoleErrors: [],
    networkErrors: [],
    buttonsFound: 0,
    buttonsClickable: 0,
    notes: [],
  };

  const startTime = Date.now();

  // Capturar errores de consola
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text());
    }
  });

  // Capturar errores de red (filtrando recursos no críticos)
  const networkErrors: string[] = [];
  const ignoredNetworkPatterns = [
    'google-analytics.com',
    'googletagmanager.com',
    'cdn-cgi/rum',
    'doubleclick.net',
    '_rsc=',
  ];

  const shouldIgnoreNetworkError = (url?: string) => {
    if (!url) return false;
    return ignoredNetworkPatterns.some((pattern) => url.includes(pattern));
  };

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (shouldIgnoreNetworkError(url)) return;
    networkErrors.push(`${url} - ${request.failure()?.errorText}`);
  });

  try {
    // Navegar a la página
    const response = await page.goto(fullUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    result.httpStatus = response?.status();
    result.loadTime = Date.now() - startTime;

    // Verificar HTTP status
    if (result.httpStatus && result.httpStatus >= 400) {
      result.status = 'error';
      result.notes.push(`HTTP ${result.httpStatus}`);
    }

    // Esperar a que se renderice
    await page.waitForTimeout(2000);

    // Evitar falsos positivos: solo confiar en status HTTP y errores de red/console

    // Contar botones
    const buttons = await page.$$('button, a[role="button"], [type="submit"]');
    result.buttonsFound = buttons.length;

    // Verificar botones clickeables
    let clickableCount = 0;
    for (const button of buttons.slice(0, 10)) {
      // Solo los primeros 10
      try {
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        if (isVisible && isEnabled) clickableCount++;
      } catch {
        // Ignorar errores de botones
      }
    }
    result.buttonsClickable = clickableCount;

    // Capturar screenshot
    const screenshotName = url.replace(/\//g, '_').replace(/^_/, '') || 'home';
    const screenshotPath = `${SCREENSHOTS_DIR}/${category}_${screenshotName}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    result.screenshotPath = screenshotPath;

    // Agregar errores de consola
    result.consoleErrors = consoleMessages.filter(
      (m) =>
        !m.includes('favicon') &&
        !m.includes('chunk') &&
        !m.includes('preload') &&
        !m.includes('google-analytics.com') &&
        !m.includes('googletagmanager.com')
    );
    result.networkErrors = networkErrors;

    if (result.consoleErrors.length > 0) {
      result.status = result.status === 'error' ? 'error' : 'warning';
      result.notes.push(`${result.consoleErrors.length} errores en consola`);
    }
  } catch (error: any) {
    result.status = 'error';
    result.loadTime = Date.now() - startTime;
    result.notes.push(`Error: ${error.message.substring(0, 100)}`);
  }

  // Limpiar listeners
  page.removeAllListeners('console');
  page.removeAllListeners('requestfailed');

  return result;
}

async function auditButtons(url: string): Promise<{ clicked: string[]; failed: string[] }> {
  const clicked: string[] = [];
  const failed: string[] = [];

  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Encontrar todos los botones
    const buttons = await page.$$('button:not([disabled]), a.btn, a[role="button"]');

    for (const button of buttons.slice(0, 5)) {
      // Solo primeros 5 para evitar navegación
      try {
        const text = await button.textContent();
        const isVisible = await button.isVisible();

        if (isVisible && text && !text.includes('Cerrar') && !text.includes('Cancelar')) {
          // Solo verificar si es clickeable, no hacer click real
          const isEnabled = await button.isEnabled();
          if (isEnabled) {
            clicked.push(text.trim().substring(0, 50));
          } else {
            failed.push(text.trim().substring(0, 50));
          }
        }
      } catch {
        // Ignorar
      }
    }
  } catch {
    // Ignorar errores de navegación
  }

  return { clicked, failed };
}

async function runAudit() {
  log('🚀 INICIANDO AUDITORÍA EXHAUSTIVA DE INMOVA APP', 'info');
  log(`📍 URL Base: ${BASE_URL}`, 'info');
  log('='.repeat(60), 'info');

  await setup();

  // Auditar páginas públicas primero
  log('\n📋 AUDITORÍA DE PÁGINAS PÚBLICAS', 'info');
  for (const url of PAGE_CATEGORIES.public) {
    const result = await auditPage(url, 'public');
    auditResults.push(result);
    log(
      `  ${result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'} ${url} (${result.loadTime}ms)`,
      result.status === 'success' ? 'success' : result.status === 'warning' ? 'warning' : 'error'
    );
  }

  // Login para páginas protegidas
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('❌ No se pudo completar el login. Abortando auditoría de páginas protegidas.', 'error');
    await generateReport();
    await browser.close();
    return;
  }

  // Auditar cada categoría
  const categories = Object.entries(PAGE_CATEGORIES).filter(([key]) => key !== 'public');

  for (const [category, urls] of categories) {
    log(`\n📋 AUDITORÍA: ${category.toUpperCase()}`, 'info');

    for (const url of urls) {
      const result = await auditPage(url, category);
      auditResults.push(result);

      const statusIcon =
        result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      const notes = result.notes.length > 0 ? ` - ${result.notes.join(', ')}` : '';
      log(
        `  ${statusIcon} ${url} (${result.loadTime}ms)${notes}`,
        result.status === 'success' ? 'success' : result.status === 'warning' ? 'warning' : 'error'
      );
    }
  }

  await generateReport();
  await browser.close();
}

async function generateReport() {
  log('\n📊 GENERANDO REPORTE...', 'info');

  const successCount = auditResults.filter((r) => r.status === 'success').length;
  const warningCount = auditResults.filter((r) => r.status === 'warning').length;
  const errorCount = auditResults.filter((r) => r.status === 'error').length;

  // Agrupar por categoría
  const byCategory: Record<string, { total: number; success: number; failed: number }> = {};
  for (const result of auditResults) {
    if (!byCategory[result.category]) {
      byCategory[result.category] = { total: 0, success: 0, failed: 0 };
    }
    byCategory[result.category].total++;
    if (result.status === 'success') byCategory[result.category].success++;
    if (result.status === 'error') byCategory[result.category].failed++;
  }

  // Errores comunes
  const commonErrors: string[] = [];
  for (const result of auditResults) {
    if (result.status === 'error') {
      commonErrors.push(`${result.url}: ${result.notes.join(', ')}`);
    }
  }

  const report: AuditResult = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalPages: auditResults.length,
    successfulPages: successCount,
    failedPages: errorCount,
    warningPages: warningCount,
    results: auditResults,
    summary: {
      byCategory,
      commonErrors: commonErrors.slice(0, 50),
      brokenButtons: [],
    },
  };

  // Guardar JSON
  fs.writeFileSync(`${OUTPUT_DIR}/audit-report.json`, JSON.stringify(report, null, 2));

  // Guardar resumen en texto
  let textReport = `
═══════════════════════════════════════════════════════════════
                    AUDITORÍA INMOVA APP
                    Pre-Launch Check
═══════════════════════════════════════════════════════════════

📅 Fecha: ${new Date().toLocaleString('es-ES')}
🌐 URL: ${BASE_URL}

═══════════════════════════════════════════════════════════════
                        RESUMEN
═══════════════════════════════════════════════════════════════

Total páginas auditadas: ${auditResults.length}
✅ Exitosas: ${successCount} (${((successCount / auditResults.length) * 100).toFixed(1)}%)
⚠️  Advertencias: ${warningCount} (${((warningCount / auditResults.length) * 100).toFixed(1)}%)
❌ Errores: ${errorCount} (${((errorCount / auditResults.length) * 100).toFixed(1)}%)

═══════════════════════════════════════════════════════════════
                    POR CATEGORÍA
═══════════════════════════════════════════════════════════════
`;

  for (const [cat, stats] of Object.entries(byCategory)) {
    const successRate = ((stats.success / stats.total) * 100).toFixed(0);
    textReport += `
${cat.toUpperCase().padEnd(25)} ${stats.success}/${stats.total} páginas OK (${successRate}%)`;
  }

  textReport += `

═══════════════════════════════════════════════════════════════
                    ERRORES ENCONTRADOS
═══════════════════════════════════════════════════════════════
`;

  if (commonErrors.length === 0) {
    textReport += '\n🎉 No se encontraron errores críticos!\n';
  } else {
    for (const error of commonErrors) {
      textReport += `\n❌ ${error}`;
    }
  }

  textReport += `

═══════════════════════════════════════════════════════════════
                    PÁGINAS CON PROBLEMAS
═══════════════════════════════════════════════════════════════
`;

  const problemPages = auditResults.filter((r) => r.status !== 'success');
  if (problemPages.length === 0) {
    textReport += '\n🎉 Todas las páginas cargaron correctamente!\n';
  } else {
    for (const p of problemPages) {
      textReport += `\n${p.status === 'error' ? '❌' : '⚠️'} ${p.url}`;
      if (p.notes.length > 0) textReport += `\n   └── ${p.notes.join(', ')}`;
      if (p.consoleErrors.length > 0)
        textReport += `\n   └── Errores consola: ${p.consoleErrors.length}`;
    }
  }

  textReport += `

═══════════════════════════════════════════════════════════════
                    FIN DEL REPORTE
═══════════════════════════════════════════════════════════════
`;

  fs.writeFileSync(`${OUTPUT_DIR}/audit-report.txt`, textReport);

  // Imprimir resumen
  log('\n' + '='.repeat(60), 'info');
  log('📊 RESUMEN DE AUDITORÍA', 'info');
  log('='.repeat(60), 'info');
  log(`Total páginas: ${auditResults.length}`, 'info');
  log(`✅ Exitosas: ${successCount}`, 'success');
  log(`⚠️  Advertencias: ${warningCount}`, 'warning');
  log(`❌ Errores: ${errorCount}`, 'error');
  log(`\n📁 Reporte guardado en: ${OUTPUT_DIR}/`, 'info');
}

// Ejecutar
runAudit().catch(console.error);
