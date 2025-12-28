/**
 * Script de Verificación Visual Avanzado con Captura de Logs
 *
 * Este script usa Playwright para:
 * - Navegar visualmente por todas las páginas de la app
 * - Capturar logs de consola (info, warn, error)
 * - Capturar errores de JavaScript
 * - Capturar errores de red (404, 500, etc)
 * - Tomar screenshots de cada página
 * - Generar un reporte JSON y HTML con todos los problemas
 *
 * Uso: tsx scripts/visual-verification-with-logs.ts
 */

import { chromium, Browser, Page, ConsoleMessage, Request, Response } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Configuración
const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';
const OUTPUT_DIR = path.join(process.cwd(), 'visual-verification-results');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const TIMEOUT = 45000; // 45 segundos por página (más tiempo para cargas lentas)

interface PageError {
  url: string;
  type: 'console-error' | 'js-error' | 'network-error' | 'timeout' | 'page-crash';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  details?: any;
  timestamp: string;
}

interface PageResult {
  url: string;
  path: string;
  status: 'success' | 'error' | 'warning';
  statusCode?: number;
  loadTime: number;
  screenshotPath?: string;
  errors: PageError[];
  warnings: PageError[];
  consoleMessages: {
    type: string;
    text: string;
    timestamp: string;
  }[];
}

interface VerificationReport {
  timestamp: string;
  totalPages: number;
  successfulPages: number;
  pagesWithErrors: number;
  pagesWithWarnings: number;
  criticalErrors: number;
  results: PageResult[];
  summary: {
    criticalIssues: PageError[];
    commonErrors: { [key: string]: number };
  };
}

// Cargar rutas desde el archivo JSON generado
let ROUTES_TO_CHECK: string[] = [];
try {
  const routesFile = path.join(__dirname, 'routes-to-verify.json');
  ROUTES_TO_CHECK = JSON.parse(fs.readFileSync(routesFile, 'utf-8'));
  console.log(`📋 Cargadas ${ROUTES_TO_CHECK.length} rutas desde routes-to-verify.json`);
} catch (error) {
  console.warn('⚠️  No se pudo cargar routes-to-verify.json, usando rutas por defecto');
  // Lista de rutas por defecto (las más importantes primero)
  ROUTES_TO_CHECK = [
    // Rutas críticas de autenticación
    '/',
    '/login',
    '/api/auth/signin',

    // Dashboard principal
    '/dashboard',
    '/home',

    // Módulos principales
    '/edificios',
    '/unidades',
    '/inquilinos',
    '/contratos',
    '/pagos',
    '/mantenimiento',
    '/documentos',
    '/reportes',

    // Módulos administrativos
    '/admin/dashboard',
    '/admin/usuarios',
    '/admin/configuracion',
    '/admin/seguridad',
    '/admin/salud-sistema',

    // Módulos financieros
    '/gastos',
    '/facturacion',
    '/comunidades/finanzas',

    // Módulos de negocio
    '/str/bookings',
    '/str/listings',
    '/flipping/projects',
    '/professional/projects',

    // Otros módulos
    '/calendario',
    '/chat',
    '/notificaciones',
    '/analytics',
    '/bi',

    // Configuración
    '/perfil',
    '/configuracion/notificaciones',
    '/configuracion/integraciones/stripe',
  ];
}

class VisualVerifier {
  private browser?: Browser;
  private report: VerificationReport;
  private startTime: number;

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      totalPages: 0,
      successfulPages: 0,
      pagesWithErrors: 0,
      pagesWithWarnings: 0,
      criticalErrors: 0,
      results: [],
      summary: {
        criticalIssues: [],
        commonErrors: {},
      },
    };
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🚀 Inicializando navegador...');

    // Crear directorios de salida
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    // Inicializar navegador
    this.browser = await chromium.launch({
      headless: true, // Cambiar a false para ver el navegador
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('✅ Navegador inicializado');
  }

  async verifyPage(route: string): Promise<PageResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const url = `${BASE_URL}${route}`;
    console.log(`\n📄 Verificando: ${url}`);

    const result: PageResult = {
      url,
      path: route,
      status: 'success',
      loadTime: 0,
      errors: [],
      warnings: [],
      consoleMessages: [],
    };

    const page = await this.browser.newPage();
    const startTime = Date.now();

    try {
      // Configurar listeners para capturar eventos
      this.setupPageListeners(page, result);

      // Navegar a la página
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: TIMEOUT,
      });

      result.statusCode = response?.status();
      result.loadTime = Date.now() - startTime;

      // Verificar si la página cargó correctamente
      if (!response || response.status() >= 400) {
        result.errors.push({
          url,
          type: 'network-error',
          severity: 'critical',
          message: `HTTP ${response?.status() || 'unknown'} error`,
          timestamp: new Date().toISOString(),
        });
        result.status = 'error';
      }

      // Esperar un poco más para que JavaScript se ejecute
      await page.waitForTimeout(2000);

      // Tomar screenshot
      const screenshotName = `${route.replace(/\//g, '_') || 'home'}.png`;
      const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      result.screenshotPath = screenshotPath;

      // Verificar errores comunes en el DOM
      await this.checkCommonDOMErrors(page, result);

      console.log(`  ⏱️  Tiempo de carga: ${result.loadTime}ms`);
      console.log(`  📸 Screenshot guardado: ${screenshotName}`);
      console.log(`  ⚠️  Errores: ${result.errors.length}`);
      console.log(`  ⚡ Warnings: ${result.warnings.length}`);
    } catch (error: any) {
      result.status = 'error';
      result.loadTime = Date.now() - startTime;

      const errorType = error.name === 'TimeoutError' ? 'timeout' : 'page-crash';

      result.errors.push({
        url,
        type: errorType,
        severity: 'critical',
        message: error.message || 'Unknown error',
        details: error.stack,
        timestamp: new Date().toISOString(),
      });

      console.log(`  ❌ Error: ${error.message}`);
    } finally {
      await page.close();
    }

    // Actualizar estado basado en errores
    if (result.errors.length > 0) {
      result.status = 'error';
    } else if (result.warnings.length > 0) {
      result.status = 'warning';
    }

    return result;
  }

  private setupPageListeners(page: Page, result: PageResult) {
    // Capturar logs de consola
    page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();

      result.consoleMessages.push({
        type,
        text,
        timestamp: new Date().toISOString(),
      });

      // Clasificar errores
      if (type === 'error') {
        result.errors.push({
          url: result.url,
          type: 'console-error',
          severity: 'high',
          message: text,
          timestamp: new Date().toISOString(),
        });
      } else if (type === 'warning') {
        result.warnings.push({
          url: result.url,
          type: 'console-error',
          severity: 'low',
          message: text,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Capturar errores de JavaScript
    page.on('pageerror', (error: Error) => {
      result.errors.push({
        url: result.url,
        type: 'js-error',
        severity: 'critical',
        message: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
      });
    });

    // Capturar errores de red
    page.on('response', (response: Response) => {
      if (response.status() >= 400) {
        const severity = response.status() >= 500 ? 'critical' : 'high';

        result.errors.push({
          url: result.url,
          type: 'network-error',
          severity,
          message: `${response.url()} - HTTP ${response.status()}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Capturar requests fallidos
    page.on('requestfailed', (request: Request) => {
      result.errors.push({
        url: result.url,
        type: 'network-error',
        severity: 'high',
        message: `Request failed: ${request.url()} - ${request.failure()?.errorText}`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private async checkCommonDOMErrors(page: Page, result: PageResult) {
    try {
      // Verificar si hay elementos con texto de error común
      const errorPatterns = [
        'Error',
        'undefined',
        'null',
        'NaN',
        'Something went wrong',
        'Page not found',
        '404',
        '500',
        'Internal Server Error',
      ];

      for (const pattern of errorPatterns) {
        const elements = await page.locator(`text="${pattern}"`).count();
        if (elements > 0) {
          result.warnings.push({
            url: result.url,
            type: 'console-error',
            severity: 'medium',
            message: `Found "${pattern}" text in page (${elements} occurrences)`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Verificar si hay imágenes rotas
      const brokenImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter((img) => !img.complete || img.naturalHeight === 0).length;
      });

      if (brokenImages > 0) {
        result.warnings.push({
          url: result.url,
          type: 'network-error',
          severity: 'low',
          message: `Found ${brokenImages} broken images`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      // Ignorar errores en verificación de DOM
    }
  }

  async login() {
    console.log('\n🔐 Intentando login automático...');

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      // Ir a la página de login
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: TIMEOUT });

      // Llenar formulario de login
      await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);

      // Click en botón de login
      await page.click('button[type="submit"]');

      // Esperar navegación (puede ir a dashboard o home)
      await page.waitForNavigation({ timeout: 30000 }).catch(() => {
        console.log('  ⚠️  No navigation after login, might be already on dashboard');
      });

      // Guardar cookies de sesión
      const cookies = await page.context().cookies();
      await page.context().addCookies(cookies);

      console.log('  ✅ Login exitoso - Sesión guardada');

      await page.close();
      return true;
    } catch (error: any) {
      console.log(`  ⚠️  Login falló: ${error.message}`);
      console.log('  ℹ️  Continuando verificación sin autenticación...');
      await page.close();
      return false;
    }
  }

  async verifyAll() {
    console.log(`\n🔍 Verificando ${ROUTES_TO_CHECK.length} rutas en ${BASE_URL}...\n`);
    console.log('='.repeat(60));

    // Intentar login primero
    await this.login();

    for (const route of ROUTES_TO_CHECK) {
      const result = await this.verifyPage(route);
      this.report.results.push(result);
      this.updateStats(result);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Verificación completada!\n');
  }

  private updateStats(result: PageResult) {
    this.report.totalPages++;

    if (result.status === 'success') {
      this.report.successfulPages++;
    } else if (result.status === 'error') {
      this.report.pagesWithErrors++;
    } else if (result.status === 'warning') {
      this.report.pagesWithWarnings++;
    }

    // Contar errores críticos
    const criticalErrors = result.errors.filter((e) => e.severity === 'critical');
    this.report.criticalErrors += criticalErrors.length;
    this.report.summary.criticalIssues.push(...criticalErrors);

    // Contar errores comunes
    for (const error of result.errors) {
      const key = error.message.substring(0, 100); // Primeros 100 caracteres
      this.report.summary.commonErrors[key] = (this.report.summary.commonErrors[key] || 0) + 1;
    }
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));
    console.log(`⏱️  Tiempo total: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📄 Total de páginas: ${this.report.totalPages}`);
    console.log(`✅ Exitosas: ${this.report.successfulPages}`);
    console.log(`⚠️  Con warnings: ${this.report.pagesWithWarnings}`);
    console.log(`❌ Con errores: ${this.report.pagesWithErrors}`);
    console.log(`🔥 Errores críticos: ${this.report.criticalErrors}`);
    console.log('='.repeat(60));

    // Mostrar errores más comunes
    if (Object.keys(this.report.summary.commonErrors).length > 0) {
      console.log('\n🔥 ERRORES MÁS COMUNES:');
      const sortedErrors = Object.entries(this.report.summary.commonErrors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      sortedErrors.forEach(([error, count]) => {
        console.log(`  [${count}x] ${error}`);
      });
    }

    // Guardar reporte JSON
    const reportPath = path.join(OUTPUT_DIR, 'verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n💾 Reporte JSON guardado: ${reportPath}`);

    // Generar reporte HTML
    this.generateHTMLReport();

    // Guardar resumen de errores críticos
    if (this.report.summary.criticalIssues.length > 0) {
      const criticalPath = path.join(OUTPUT_DIR, 'critical-errors.json');
      fs.writeFileSync(criticalPath, JSON.stringify(this.report.summary.criticalIssues, null, 2));
      console.log(`🚨 Errores críticos guardados: ${criticalPath}`);
    }
  }

  private generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Verificación Visual - INMOVA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 16px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-card .number {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .stat-card .label {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-card.success .number { color: #10b981; }
    .stat-card.warning .number { color: #f59e0b; }
    .stat-card.error .number { color: #ef4444; }
    .stat-card.critical .number { color: #dc2626; }
    
    .section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #333;
    }
    
    .page-result {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      transition: all 0.2s;
    }
    .page-result:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .page-result.success { border-left: 4px solid #10b981; }
    .page-result.warning { border-left: 4px solid #f59e0b; }
    .page-result.error { border-left: 4px solid #ef4444; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .page-url {
      font-weight: 600;
      font-size: 16px;
      color: #333;
    }
    .page-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .page-status.success { background: #d1fae5; color: #065f46; }
    .page-status.warning { background: #fef3c7; color: #92400e; }
    .page-status.error { background: #fee2e2; color: #991b1b; }
    
    .page-meta {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
      font-size: 14px;
      color: #666;
    }
    
    .error-list, .warning-list {
      margin-top: 15px;
    }
    .error-item, .warning-item {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 4px;
      font-size: 14px;
    }
    .warning-item {
      background: #fffbeb;
      border-left-color: #f59e0b;
    }
    .error-item .type {
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 4px;
    }
    .warning-item .type {
      font-weight: 600;
      color: #d97706;
      margin-bottom: 4px;
    }
    
    .screenshot {
      margin-top: 15px;
    }
    .screenshot img {
      max-width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .screenshot img:hover {
      transform: scale(1.02);
    }
    
    .common-errors {
      list-style: none;
    }
    .common-errors li {
      background: #f9fafb;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .common-errors .count {
      background: #ef4444;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 12px;
    }
    
    .filter-buttons {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    .filter-btn {
      padding: 8px 16px;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .filter-btn:hover {
      background: #f9fafb;
    }
    .filter-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Reporte de Verificación Visual</h1>
      <p>Generado el ${new Date(this.report.timestamp).toLocaleString('es-ES')}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="number">${this.report.totalPages}</div>
        <div class="label">Total Páginas</div>
      </div>
      <div class="stat-card success">
        <div class="number">${this.report.successfulPages}</div>
        <div class="label">Exitosas</div>
      </div>
      <div class="stat-card warning">
        <div class="number">${this.report.pagesWithWarnings}</div>
        <div class="label">Con Warnings</div>
      </div>
      <div class="stat-card error">
        <div class="number">${this.report.pagesWithErrors}</div>
        <div class="label">Con Errores</div>
      </div>
      <div class="stat-card critical">
        <div class="number">${this.report.criticalErrors}</div>
        <div class="label">Críticos</div>
      </div>
    </div>
    
    ${this.generateCommonErrorsSection()}
    
    <div class="section">
      <h2>📄 Resultados por Página</h2>
      
      <div class="filter-buttons">
        <button class="filter-btn active" onclick="filterPages('all')">Todas</button>
        <button class="filter-btn" onclick="filterPages('success')">Exitosas</button>
        <button class="filter-btn" onclick="filterPages('warning')">Con Warnings</button>
        <button class="filter-btn" onclick="filterPages('error')">Con Errores</button>
      </div>
      
      <div id="pages">
        ${this.report.results.map((result) => this.generatePageHTML(result)).join('')}
      </div>
    </div>
  </div>
  
  <script>
    function filterPages(type) {
      // Update active button
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');
      
      // Filter pages
      const pages = document.querySelectorAll('.page-result');
      pages.forEach(page => {
        if (type === 'all') {
          page.style.display = 'block';
        } else {
          page.style.display = page.classList.contains(type) ? 'block' : 'none';
        }
      });
    }
  </script>
</body>
</html>
    `;

    const htmlPath = path.join(OUTPUT_DIR, 'verification-report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 Reporte HTML guardado: ${htmlPath}`);
  }

  private generateCommonErrorsSection(): string {
    if (Object.keys(this.report.summary.commonErrors).length === 0) {
      return '';
    }

    const sortedErrors = Object.entries(this.report.summary.commonErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return `
      <div class="section">
        <h2>🔥 Errores Más Comunes</h2>
        <ul class="common-errors">
          ${sortedErrors
            .map(
              ([error, count]) => `
            <li>
              <span>${this.escapeHtml(error)}</span>
              <span class="count">${count}x</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;
  }

  private generatePageHTML(result: PageResult): string {
    return `
      <div class="page-result ${result.status}">
        <div class="page-header">
          <div class="page-url">${this.escapeHtml(result.path)}</div>
          <div class="page-status ${result.status}">${result.status}</div>
        </div>
        
        <div class="page-meta">
          <span>⏱️ ${result.loadTime}ms</span>
          ${result.statusCode ? `<span>📡 HTTP ${result.statusCode}</span>` : ''}
          <span>❌ ${result.errors.length} errores</span>
          <span>⚠️ ${result.warnings.length} warnings</span>
        </div>
        
        ${
          result.errors.length > 0
            ? `
          <div class="error-list">
            <strong>Errores:</strong>
            ${result.errors
              .map(
                (error) => `
              <div class="error-item">
                <div class="type">[${error.type}] ${error.severity}</div>
                <div>${this.escapeHtml(error.message)}</div>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
        
        ${
          result.warnings.length > 0
            ? `
          <div class="warning-list">
            <strong>Warnings:</strong>
            ${result.warnings
              .map(
                (warning) => `
              <div class="warning-item">
                <div class="type">[${warning.type}]</div>
                <div>${this.escapeHtml(warning.message)}</div>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
        
        ${
          result.screenshotPath
            ? `
          <div class="screenshot">
            <details>
              <summary style="cursor: pointer; font-weight: 600; margin-bottom: 10px;">📸 Ver Screenshot</summary>
              <img src="screenshots/${path.basename(result.screenshotPath)}" alt="Screenshot de ${result.path}">
            </details>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('\n👋 Navegador cerrado');
    }
  }
}

// Ejecutar verificación
async function main() {
  const verifier = new VisualVerifier();

  try {
    await verifier.initialize();
    await verifier.verifyAll();
    verifier.generateReport();
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    process.exit(1);
  } finally {
    await verifier.cleanup();
  }
}

main();
