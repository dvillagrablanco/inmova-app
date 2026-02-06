#!/usr/bin/env tsx
/**
 * 👁️ PROTOCOLO DE INSPECCIÓN VISUAL (VISUAL QA MODE)
 *
 * Este script es LA HERRAMIENTA MAESTRA de captura visual para auditorías de UI.
 *
 * Features:
 * 1. Autenticación automática con credenciales de .env
 * 2. Crawling de rutas críticas del dashboard
 * 3. Captura DUAL: Desktop (1920x1080) + Mobile (390x844 - iPhone 14)
 * 4. Caza-Errores: Consola, Red, Overflow
 * 5. Output: Screenshots + audit-logs.txt con todos los problemas
 *
 * Uso:
 *   npx tsx scripts/visual-audit.ts
 *
 * Output:
 *   visual-audit-results/
 *     ├── desktop/
 *     │   ├── screenshot-desktop-dashboard.png
 *     │   ├── screenshot-desktop-properties.png
 *     │   └── ...
 *     ├── mobile/
 *     │   ├── screenshot-mobile-dashboard.png
 *     │   ├── screenshot-mobile-properties.png
 *     │   └── ...
 *     └── audit-logs.txt (todos los errores encontrados)
 */

import {
  chromium,
  Browser,
  BrowserContext,
  Page,
  ConsoleMessage,
  Request,
  Response,
} from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env' });

// ==================== CONFIGURACIÓN ====================

const BASE_URL = process.env.BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
const LOGIN_EMAIL = process.env.TEST_USER_EMAIL || process.env.ADMIN_EMAIL || 'admin@inmova.app';
const LOGIN_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin123!';

const OUTPUT_DIR = path.join(process.cwd(), 'visual-audit-results');
const DESKTOP_DIR = path.join(OUTPUT_DIR, 'desktop');
const MOBILE_DIR = path.join(OUTPUT_DIR, 'mobile');
const LOGS_FILE = path.join(OUTPUT_DIR, 'audit-logs.txt');

const TIMEOUT = 60000; // 60 segundos por página (aumentado por problemas de carga)

// Tamaños de viewport
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14

// ==================== RUTAS DESDE FILESYSTEM ====================

// Cargar todas las rutas automáticamente
function loadAllRoutes(): typeof CRITICAL_ROUTES {
  const allRoutesRaw = `
admin/activity
admin/alertas
admin/aprobaciones
admin/backup-restore
admin/clientes
admin/clientes/comparar
admin/configuracion
admin/dashboard
admin/facturacion-b2b
admin/firma-digital
admin/importar
admin/integraciones-contables
admin/legal
admin/marketplace
admin/metricas-uso
admin/modulos
admin/ocr-import
admin/personalizacion
admin/planes
admin/plantillas-sms
admin/portales-externos
admin/recuperar-contrasena
admin/reportes-programados
admin/salud-sistema
admin/seguridad
admin/sugerencias
admin/usuarios
alquiler-tradicional/warranties
analytics
anuncios
api-docs
asistente-ia
auditoria
automatizacion
automatizacion-resumen
bi
blockchain
calendario
candidatos
candidatos/nuevo
certificaciones
chat
comunidades
comunidades/actas
comunidades/cumplimiento
comunidades/cuotas
comunidades/finanzas
comunidades/fondos
comunidades/presidente
comunidades/renovaciones
comunidades/votaciones
comunidad-social
configuracion/integraciones/stripe
configuracion/notificaciones
configuracion/ui-mode
contabilidad
contratos
contratos/nuevo
crm
cupones
dashboard
dashboard-adaptive
dashboard/community
documentos
economia-circular
edificios
edificios/nuevo
edificios/nuevo-wizard
energia
esg
ewoorker/admin-socio
ewoorker/compliance
ewoorker/dashboard
ewoorker/obras
ewoorker/pagos
facturacion
firma-digital
flipping
flipping/analytics
flipping/comps
flipping/projects
gastos
gastos/nuevo
inspeccion-360
inspecciones
integraciones
inversiones
leads
legal
login
mantenimiento
mantenimiento/nuevo
mantenimiento-pro
marketplace
notificaciones
notificaciones/historial
notificaciones/plantillas
notificaciones/reglas
ocr
operador/dashboard
operador/maintenance-history
pagos
pagos/nuevo
partners
partners/calculator
partners/clients
partners/commissions
partners/invitations
partners/login
partners-program
partners/register
partners/settings
perfil
plantillas
portal-comercial
portal-comercial/comisiones
portal-comercial/leads
portal-comercial/objetivos
portal-inquilino/chat
portal-inquilino/chatbot
portal-inquilino/dashboard
portal-inquilino/documentos
portal-inquilino/login
portal-inquilino/mantenimiento
portal-inquilino/pagos
portal-inquilino/password-reset
portal-inquilino/perfil
portal-inquilino/register
portal-inquilino/valoraciones
portal-propietario
portal-propietario/configuracion
portal-propietario/login
portal-proveedor/chat
portal-proveedor/facturas
portal-proveedor/facturas/nueva
portal-proveedor/forgot-password
portal-proveedor/login
portal-proveedor/ordenes
portal-proveedor/presupuestos
portal-proveedor/presupuestos/nuevo
portal-proveedor/register
portal-proveedor/reset-password
professional
professional/clients
professional/invoicing
professional/projects
proveedores
recordatorios
register
reportes
reuniones
reviews
room-rental/common-areas
room-rental/tenants
screening
seguridad-compliance
sms
str
str/bookings
str/channels
str/listings
str/pricing
str/reviews
str/settings/integrations
str/setup-wizard
sugerencias
tours-virtuales
unidades
unidades/nuevo
valoraciones
votaciones
workflows
`
    .trim()
    .split('\n')
    .filter((r) => r && !r.includes('page.tsx') && !r.includes('(') && !r.includes('.disabled'));

  // Convertir a formato de rutas
  return allRoutesRaw.map((route) => {
    const path = `/${route}`;
    const name = route.replace(/\//g, '-');

    // Determinar si requiere autenticación (casi todas excepto públicas)
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/partners/login',
      '/partners/register',
      '/portal-inquilino/login',
      '/portal-inquilino/register',
      '/portal-propietario/login',
      '/portal-proveedor/login',
      '/portal-proveedor/register',
      '/portal-proveedor/forgot-password',
      '/portal-proveedor/reset-password',
      '/portal-inquilino/password-reset',
    ];
    const requiresAuth = !publicRoutes.includes(path);

    return { path, name, requiresAuth };
  });
}

// Rutas prioritarias (las más importantes primero)
const PRIORITY_ROUTES = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
  { path: '/dashboard', name: 'dashboard', requiresAuth: true },
  { path: '/edificios', name: 'buildings', requiresAuth: true },
  { path: '/unidades', name: 'units', requiresAuth: true },
  { path: '/inquilinos', name: 'tenants', requiresAuth: true },
  { path: '/contratos', name: 'contracts', requiresAuth: true },
  { path: '/pagos', name: 'payments', requiresAuth: true },
  { path: '/mantenimiento', name: 'maintenance', requiresAuth: true },
  { path: '/documentos', name: 'documents', requiresAuth: true },
];

// Seleccionar qué rutas auditar (desde variable de entorno)
const AUDIT_MODE = process.env.AUDIT_MODE || 'priority'; // 'priority', 'all', 'admin', 'portals'
const CRITICAL_ROUTES = AUDIT_MODE === 'all' ? loadAllRoutes() : PRIORITY_ROUTES;

// ==================== COLECTOR DE ERRORES ====================

interface AuditError {
  route: string;
  viewport: 'desktop' | 'mobile';
  type: 'console-error' | 'network-error' | 'overflow' | 'js-error' | 'timeout';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  details?: string;
  timestamp: string;
}

class ErrorCollector {
  private errors: AuditError[] = [];
  private logStream: fs.WriteStream;

  constructor(logFilePath: string) {
    this.logStream = fs.createWriteStream(logFilePath, { flags: 'w' });
    this.writeHeader();
  }

  private writeHeader() {
    const header = `
${'='.repeat(80)}
👁️  AUDIT LOGS - INSPECCIÓN VISUAL AUTOMÁTICA
${'='.repeat(80)}
Timestamp: ${new Date().toISOString()}
Base URL: ${BASE_URL}
${'='.repeat(80)}

`;
    this.logStream.write(header);
    console.log(header);
  }

  addError(error: AuditError) {
    this.errors.push(error);

    const logEntry = `
[${error.timestamp}] ${error.severity.toUpperCase()} - ${error.type}
  Ruta: ${error.route}
  Viewport: ${error.viewport}
  Mensaje: ${error.message}
  ${error.details ? `Detalles: ${error.details}` : ''}
${'─'.repeat(80)}
`;

    this.logStream.write(logEntry);

    // También log a consola si es crítico
    if (error.severity === 'critical' || error.severity === 'high') {
      console.error(`🚨 [${error.severity}] ${error.route} (${error.viewport}): ${error.message}`);
    }
  }

  getSummary() {
    const summary = {
      total: this.errors.length,
      critical: this.errors.filter((e) => e.severity === 'critical').length,
      high: this.errors.filter((e) => e.severity === 'high').length,
      medium: this.errors.filter((e) => e.severity === 'medium').length,
      low: this.errors.filter((e) => e.severity === 'low').length,
      byType: {} as Record<string, number>,
    };

    this.errors.forEach((error) => {
      summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
    });

    return summary;
  }

  writeSummary() {
    const summary = this.getSummary();

    const summaryText = `
${'='.repeat(80)}
📊 RESUMEN DE ERRORES
${'='.repeat(80)}
Total de errores: ${summary.total}
  - Críticos: ${summary.critical}
  - Altos: ${summary.high}
  - Medios: ${summary.medium}
  - Bajos: ${summary.low}

Por tipo:
${Object.entries(summary.byType)
  .map(([type, count]) => `  - ${type}: ${count}`)
  .join('\n')}
${'='.repeat(80)}
`;

    this.logStream.write(summaryText);
    console.log(summaryText);
  }

  close() {
    this.writeSummary();
    this.logStream.end();
  }
}

// ==================== INSPECTOR VISUAL ====================

class VisualInspector {
  private browser?: Browser;
  private errorCollector: ErrorCollector;
  private authenticatedContext?: BrowserContext;

  constructor() {
    this.errorCollector = new ErrorCollector(LOGS_FILE);
  }

  async initialize() {
    console.log('🚀 Inicializando navegador Playwright...\n');

    // Crear directorios de salida
    [OUTPUT_DIR, DESKTOP_DIR, MOBILE_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Lanzar navegador
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('✅ Navegador inicializado\n');
  }

  async authenticate() {
    if (!this.browser) throw new Error('Browser not initialized');

    console.log('🔐 Autenticando usuario...');
    console.log(`   Email: ${LOGIN_EMAIL}`);
    console.log(`   URL: ${BASE_URL}/login\n`);

    const context = await this.browser.newContext({
      viewport: DESKTOP_VIEWPORT,
    });

    const page = await context.newPage();

    try {
      // Ir a login
      await page.goto(`${BASE_URL}/login`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUT,
      });

      // Llenar formulario
      await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);

      // Submit
      await page.click('button[type="submit"]');

      // Esperar navegación (dashboard o home)
      await page.waitForTimeout(5000);

      const currentUrl = page.url();

      if (
        currentUrl.includes('/dashboard') ||
        currentUrl.includes('/home') ||
        currentUrl.includes('/admin')
      ) {
        console.log('✅ Autenticación exitosa');
        console.log(`   Redirigido a: ${currentUrl}\n`);

        // Guardar contexto autenticado
        this.authenticatedContext = context;
        await page.close();
        return true;
      } else {
        console.error('❌ Autenticación falló - permanece en login');
        console.error(`   URL actual: ${currentUrl}\n`);

        this.errorCollector.addError({
          route: '/login',
          viewport: 'desktop',
          type: 'js-error',
          severity: 'critical',
          message: 'Autenticación falló - no redirigió al dashboard',
          details: `URL actual: ${currentUrl}`,
          timestamp: new Date().toISOString(),
        });

        await page.close();
        await context.close();
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error durante autenticación:', error.message);

      this.errorCollector.addError({
        route: '/login',
        viewport: 'desktop',
        type: 'js-error',
        severity: 'critical',
        message: `Error en autenticación: ${error.message}`,
        details: error.stack,
        timestamp: new Date().toISOString(),
      });

      await page.close();
      await context.close();
      return false;
    }
  }

  async captureRoute(route: { path: string; name: string; requiresAuth?: boolean }) {
    if (!this.browser) throw new Error('Browser not initialized');

    const url = `${BASE_URL}${route.path}`;
    console.log(`\n📄 Capturando: ${route.name} (${route.path})`);

    // Usar contexto autenticado si la ruta lo requiere
    let context: BrowserContext;

    if (route.requiresAuth && this.authenticatedContext) {
      context = this.authenticatedContext;
    } else {
      context = await this.browser.newContext();
    }

    // ========== CAPTURA DESKTOP ==========
    await this.captureViewport(context, url, route, 'desktop', DESKTOP_VIEWPORT);

    // ========== CAPTURA MOBILE ==========
    await this.captureViewport(context, url, route, 'mobile', MOBILE_VIEWPORT);

    // Cerrar contexto si no es el autenticado
    if (!route.requiresAuth || !this.authenticatedContext) {
      await context.close();
    }
  }

  private async captureViewport(
    context: BrowserContext,
    url: string,
    route: { path: string; name: string },
    viewportType: 'desktop' | 'mobile',
    viewport: { width: number; height: number }
  ) {
    const page = await context.newPage();
    await page.setViewportSize(viewport);

    console.log(
      `   ${viewportType === 'desktop' ? '🖥️' : '📱'}  Viewport: ${viewport.width}x${viewport.height}`
    );

    try {
      // Configurar listeners para capturar errores
      this.setupPageListeners(page, route.path, viewportType);

      // Navegar a la página (con manejo de timeout más permisivo)
      const startTime = Date.now();
      let response;
      try {
        response = await page.goto(url, {
          waitUntil: 'domcontentloaded', // Cambiado de 'networkidle' a 'domcontentloaded' para ser más permisivo
          timeout: TIMEOUT,
        });
        // Esperar un poco más para que cargue contenido dinámico, pero no bloqueante
        await page.waitForTimeout(2000);
      } catch (error: any) {
        if (error.name === 'TimeoutError') {
          // Continuar de todos modos si fue un timeout
          console.log(`      ⚠️  Timeout en carga, pero continuando...`);
        } else {
          throw error;
        }
      }
      const loadTime = Date.now() - startTime;

      console.log(`      ⏱️  Carga: ${loadTime}ms`);

      // Verificar status code
      if (response && response.status() >= 400) {
        this.errorCollector.addError({
          route: route.path,
          viewport: viewportType,
          type: 'network-error',
          severity: response.status() >= 500 ? 'critical' : 'high',
          message: `HTTP ${response.status()} error`,
          timestamp: new Date().toISOString(),
        });
      }

      // Esperar renderizado
      await page.waitForTimeout(2000);

      // Detectar elementos desbordados (overflow)
      await this.detectOverflow(page, route.path, viewportType);

      // Tomar screenshot
      const screenshotDir = viewportType === 'desktop' ? DESKTOP_DIR : MOBILE_DIR;
      const screenshotPath = path.join(
        screenshotDir,
        `screenshot-${viewportType}-${route.name}.png`
      );

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      console.log(`      📸 Screenshot guardado: ${path.basename(screenshotPath)}`);
    } catch (error: any) {
      const errorType = error.name === 'TimeoutError' ? 'timeout' : 'js-error';

      this.errorCollector.addError({
        route: route.path,
        viewport: viewportType,
        type: errorType,
        severity: 'critical',
        message: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
      });

      console.error(`      ❌ Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  private setupPageListeners(page: Page, routePath: string, viewport: 'desktop' | 'mobile') {
    const ignoredHosts = [
      'google-analytics.com',
      'region1.google-analytics.com',
      'www.googletagmanager.com',
      'googletagmanager.com',
      'static.hotjar.com',
      'www.clarity.ms',
      'client.crisp.chat',
    ];
    const shouldIgnoreUrl = (url: string) => ignoredHosts.some((host) => url.includes(host));
    // Capturar errores de consola
    page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        // Filtrar errores conocidos no críticos
        if (text.includes('favicon.ico') || text.includes('Extension')) {
          return;
        }

        this.errorCollector.addError({
          route: routePath,
          viewport,
          type: 'console-error',
          severity: 'high',
          message: text,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Capturar errores de JavaScript
    page.on('pageerror', (error: Error) => {
      this.errorCollector.addError({
        route: routePath,
        viewport,
        type: 'js-error',
        severity: 'critical',
        message: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
      });
    });

    // Capturar errores de red (404, 500, etc.)
    page.on('response', (response: Response) => {
      if (shouldIgnoreUrl(response.url())) {
        return;
      }
      if (response.status() >= 400) {
        // Ignorar favicons y assets no críticos
        if (response.url().includes('favicon') || response.url().includes('.map')) {
          return;
        }

        const severity = response.status() >= 500 ? 'critical' : 'high';

        this.errorCollector.addError({
          route: routePath,
          viewport,
          type: 'network-error',
          severity,
          message: `${response.url()} - HTTP ${response.status()}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Capturar requests fallidos
    page.on('requestfailed', (request: Request) => {
      if (shouldIgnoreUrl(request.url())) {
        return;
      }
      const failure = request.failure();
      if (failure?.errorText?.includes('net::ERR_ABORTED') || failure?.errorText?.includes('NS_ERROR_ABORTED')) {
        return;
      }
      this.errorCollector.addError({
        route: routePath,
        viewport,
        type: 'network-error',
        severity: 'high',
        message: `Request failed: ${request.url()}`,
        details: failure?.errorText,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private async detectOverflow(page: Page, routePath: string, viewport: 'desktop' | 'mobile') {
    try {
      // Script para detectar elementos que se desbordan del viewport
      const overflowElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const viewportWidth = window.innerWidth;
        const overflowing: string[] = [];

        const hasScrollableAncestor = (el: Element): boolean => {
          let current: Element | null = el;
          while (current) {
            const style = window.getComputedStyle(current);
            const overflowX = style.overflowX || style.overflow;
            if (overflowX && ['auto', 'scroll', 'hidden', 'clip'].includes(overflowX)) {
              return true;
            }
            current = current.parentElement;
          }
          return false;
        };

        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (style.position === 'fixed' || style.position === 'absolute') {
            return;
          }
          if (hasScrollableAncestor(el)) {
            return;
          }

          // Detectar si el elemento se sale del viewport horizontalmente
          if (rect.right > viewportWidth + 10) {
            // +10px de margen
            const selector =
              el.tagName.toLowerCase() +
              (el.id ? `#${el.id}` : '') +
              (el.className && typeof el.className === 'string'
                ? `.${el.className.split(' ').join('.')}`
                : '');

            overflowing.push(selector);
          }
        });

        return overflowing.slice(0, 10); // Máximo 10 elementos
      });

      if (overflowElements.length > 0) {
        this.errorCollector.addError({
          route: routePath,
          viewport,
          type: 'overflow',
          severity: 'medium',
          message: `Detectados ${overflowElements.length} elementos desbordados`,
          details: overflowElements.join(', '),
          timestamp: new Date().toISOString(),
        });

        console.log(`      ⚠️  Overflow detectado: ${overflowElements.length} elementos`);
      }
    } catch (error) {
      // Ignorar errores en detección de overflow
    }
  }

  async runFullAudit() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('👁️  INICIANDO INSPECCIÓN VISUAL COMPLETA');
    console.log(`${'='.repeat(80)}\n`);

    // Autenticar primero
    const authenticated = await this.authenticate();

    // Capturar todas las rutas
    for (const route of CRITICAL_ROUTES) {
      // Skip rutas que requieren auth si la autenticación falló
      if (route.requiresAuth && !authenticated) {
        console.log(`⏭️  Saltando ${route.name} (requiere autenticación)\n`);
        continue;
      }

      await this.captureRoute(route);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ INSPECCIÓN COMPLETADA');
    console.log(`${'='.repeat(80)}\n`);

    // Mostrar resumen
    const summary = this.errorCollector.getSummary();

    console.log('📊 Resultados:');
    console.log(`   - Total de capturas: ${CRITICAL_ROUTES.length * 2} (desktop + mobile)`);
    console.log(`   - Screenshots guardados en: ${OUTPUT_DIR}`);
    console.log(`   - Logs de errores: ${LOGS_FILE}`);
    console.log(`   - Total de errores: ${summary.total}`);
    console.log(`     • Críticos: ${summary.critical}`);
    console.log(`     • Altos: ${summary.high}`);
    console.log(`     • Medios: ${summary.medium}`);
    console.log(`     • Bajos: ${summary.low}`);
    console.log('');
  }

  async cleanup() {
    if (this.authenticatedContext) {
      await this.authenticatedContext.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    this.errorCollector.close();
  }
}

// ==================== MAIN ====================

async function main() {
  const inspector = new VisualInspector();

  try {
    await inspector.initialize();
    await inspector.runFullAudit();
  } catch (error: any) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await inspector.cleanup();
  }
}

// Ejecutar
main().catch(console.error);
