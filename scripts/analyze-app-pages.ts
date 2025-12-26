/**
 * Script de Análisis Automatizado de la Aplicación
 * 
 * Usa Puppeteer para navegar por todas las páginas y detectar:
 * - Errores de consola
 * - Errores HTTP (404, 500, etc.)
 * - Botones rotos
 * - Enlaces rotos
 * - Problemas de sidebar
 * - Funcionalidades faltantes
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  headless: false, // false para ver el navegador
  timeout: 30000,
  screenshotsDir: './test-results/screenshots',
  reportsDir: './test-results/reports',
  users: {
    admin: {
      email: 'admin@inmova.com',
      password: 'admin123',
      role: 'super_admin'
    },
    gestor: {
      email: 'gestor@inmova.com', 
      password: 'gestor123',
      role: 'gestor'
    },
    operador: {
      email: 'operador@inmova.com',
      password: 'operador123',
      role: 'operador'
    },
    tenant: {
      email: 'tenant@inmova.com',
      password: 'tenant123',
      role: 'tenant'
    }
  }
};

// ============================================================================
// TIPOS
// ============================================================================

interface PageIssue {
  type: 'error' | 'warning' | 'info';
  category: 'console' | 'http' | 'button' | 'link' | 'sidebar' | 'functionality' | 'accessibility';
  page: string;
  message: string;
  details?: any;
  screenshot?: string;
}

interface AnalysisReport {
  timestamp: Date;
  totalPages: number;
  pagesAnalyzed: number;
  errors: PageIssue[];
  warnings: PageIssue[];
  info: PageIssue[];
  summary: {
    consoleErrors: number;
    httpErrors: number;
    brokenButtons: number;
    brokenLinks: number;
    sidebarIssues: number;
    missingFunctionality: number;
  };
}

// ============================================================================
// CLASE PRINCIPAL DE ANÁLISIS
// ============================================================================

class AppAnalyzer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private issues: PageIssue[] = [];
  private pagesVisited: Set<string> = new Set();
  private consoleMessages: any[] = [];

  constructor() {
    // Crear directorios si no existen
    if (!fs.existsSync(CONFIG.screenshotsDir)) {
      fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
    }
    if (!fs.existsSync(CONFIG.reportsDir)) {
      fs.mkdirSync(CONFIG.reportsDir, { recursive: true });
    }
  }

  /**
   * Inicializar navegador
   */
  async init() {
    console.log('🚀 Inicializando navegador...');
    
    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    this.page = await this.browser.newPage();

    // Capturar errores de consola
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      this.consoleMessages.push({
        type,
        text,
        timestamp: new Date()
      });

      if (type === 'error') {
        console.error(`❌ Console Error: ${text}`);
      }
    });

    // Capturar errores de página
    this.page.on('pageerror', (error) => {
      console.error(`❌ Page Error: ${error.message}`);
      this.addIssue({
        type: 'error',
        category: 'console',
        page: this.page?.url() || 'unknown',
        message: `Page Error: ${error.message}`,
        details: error.stack
      });
    });

    // Capturar respuestas HTTP
    this.page.on('response', (response) => {
      const status = response.status();
      const url = response.url();

      if (status >= 400) {
        console.warn(`⚠️ HTTP ${status}: ${url}`);
        this.addIssue({
          type: status >= 500 ? 'error' : 'warning',
          category: 'http',
          page: this.page?.url() || 'unknown',
          message: `HTTP ${status} error`,
          details: { url, status }
        });
      }
    });

    console.log('✅ Navegador iniciado');
  }

  /**
   * Login con diferentes roles
   */
  async login(role: keyof typeof CONFIG.users = 'admin') {
    if (!this.page) throw new Error('Page not initialized');

    const user = CONFIG.users[role];
    console.log(`🔐 Iniciando sesión como ${role}...`);

    try {
      await this.page.goto(`${CONFIG.baseUrl}/login`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
      });

      // Esperar y llenar formulario
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
      await this.page.type('input[type="email"], input[name="email"]', user.email);
      await this.page.type('input[type="password"], input[name="password"]', user.password);

      // Click en submit
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
        this.page.click('button[type="submit"]')
      ]);

      console.log(`✅ Sesión iniciada como ${role}`);
      
      // Screenshot del dashboard
      await this.takeScreenshot(`login-${role}-success`);

    } catch (error: any) {
      console.error(`❌ Error en login como ${role}:`, error.message);
      await this.takeScreenshot(`login-${role}-error`);
      throw error;
    }
  }

  /**
   * Analizar sidebar
   */
  async analyzeSidebar() {
    if (!this.page) return;

    console.log('🔍 Analizando sidebar...');

    try {
      // Buscar sidebar
      const sidebar = await this.page.$('nav, aside, [role="navigation"]');
      
      if (!sidebar) {
        this.addIssue({
          type: 'error',
          category: 'sidebar',
          page: this.page.url(),
          message: 'Sidebar no encontrado en la página'
        });
        return;
      }

      // Extraer todos los links del sidebar
      const links = await this.page.$$eval(
        'nav a, aside a, [role="navigation"] a',
        (anchors) => anchors.map(a => ({
          text: a.textContent?.trim() || '',
          href: a.getAttribute('href') || '',
          visible: (a as HTMLElement).offsetParent !== null
        }))
      );

      console.log(`📊 Encontrados ${links.length} enlaces en sidebar`);

      // Verificar enlaces rotos o vacíos
      const brokenLinks = links.filter(link => !link.href || link.href === '#');
      if (brokenLinks.length > 0) {
        this.addIssue({
          type: 'warning',
          category: 'sidebar',
          page: this.page.url(),
          message: `${brokenLinks.length} enlaces rotos o vacíos en sidebar`,
          details: brokenLinks
        });
      }

      // Verificar enlaces no visibles
      const hiddenLinks = links.filter(link => !link.visible);
      if (hiddenLinks.length > 0) {
        this.addIssue({
          type: 'info',
          category: 'sidebar',
          page: this.page.url(),
          message: `${hiddenLinks.length} enlaces ocultos en sidebar`,
          details: hiddenLinks
        });
      }

      await this.takeScreenshot('sidebar-analysis');

    } catch (error: any) {
      this.addIssue({
        type: 'error',
        category: 'sidebar',
        page: this.page.url(),
        message: `Error analizando sidebar: ${error.message}`
      });
    }
  }

  /**
   * Analizar una página específica
   */
  async analyzePage(url: string) {
    if (!this.page) return;

    const fullUrl = url.startsWith('http') ? url : `${CONFIG.baseUrl}${url}`;
    
    if (this.pagesVisited.has(fullUrl)) {
      console.log(`⏭️ Página ya visitada: ${url}`);
      return;
    }

    console.log(`📄 Analizando: ${url}`);
    this.pagesVisited.add(fullUrl);

    try {
      // Limpiar mensajes de consola previos
      this.consoleMessages = [];

      // Navegar a la página
      const response = await this.page.goto(fullUrl, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
      });

      // Verificar respuesta HTTP
      if (response && response.status() >= 400) {
        this.addIssue({
          type: 'error',
          category: 'http',
          page: url,
          message: `Página retorna HTTP ${response.status()}`,
          details: { status: response.status(), url: fullUrl }
        });
      }

      // Esperar a que cargue
      await this.page.waitForTimeout(2000);

      // Capturar errores de consola acumulados
      const consoleErrors = this.consoleMessages.filter(m => m.type === 'error');
      if (consoleErrors.length > 0) {
        this.addIssue({
          type: 'error',
          category: 'console',
          page: url,
          message: `${consoleErrors.length} errores de consola`,
          details: consoleErrors.map(e => e.text)
        });
      }

      // Analizar botones
      await this.analyzeButtons(url);

      // Analizar enlaces
      await this.analyzeLinks(url);

      // Analizar formularios
      await this.analyzeForms(url);

      // Analizar accesibilidad básica
      await this.analyzeAccessibility(url);

      // Screenshot de la página
      await this.takeScreenshot(`page-${url.replace(/\//g, '-')}`);

    } catch (error: any) {
      console.error(`❌ Error analizando ${url}:`, error.message);
      this.addIssue({
        type: 'error',
        category: 'console',
        page: url,
        message: `Error al cargar página: ${error.message}`,
        details: error.stack
      });
      await this.takeScreenshot(`error-${url.replace(/\//g, '-')}`);
    }
  }

  /**
   * Analizar botones
   */
  async analyzeButtons(url: string) {
    if (!this.page) return;

    try {
      const buttons = await this.page.$$eval('button, [role="button"]', (btns) =>
        btns.map((btn) => ({
          text: btn.textContent?.trim() || '',
          disabled: (btn as HTMLButtonElement).disabled,
          visible: (btn as HTMLElement).offsetParent !== null,
          hasOnClick: !!(btn as any).onclick || btn.hasAttribute('onClick'),
          type: (btn as HTMLButtonElement).type || 'button'
        }))
      );

      // Botones sin texto
      const noTextButtons = buttons.filter(b => !b.text && b.visible);
      if (noTextButtons.length > 0) {
        this.addIssue({
          type: 'warning',
          category: 'button',
          page: url,
          message: `${noTextButtons.length} botones sin texto (problemas de accesibilidad)`,
          details: noTextButtons
        });
      }

      // Botones submit sin acción aparente
      const suspiciousButtons = buttons.filter(
        b => b.type === 'submit' && !b.hasOnClick && b.visible
      );
      if (suspiciousButtons.length > 0) {
        this.addIssue({
          type: 'info',
          category: 'button',
          page: url,
          message: `${suspiciousButtons.length} botones submit potencialmente sin handler`
        });
      }

    } catch (error: any) {
      console.error('Error analizando botones:', error.message);
    }
  }

  /**
   * Analizar enlaces
   */
  async analyzeLinks(url: string) {
    if (!this.page) return;

    try {
      const links = await this.page.$$eval('a', (anchors) =>
        anchors.map(a => ({
          text: a.textContent?.trim() || '',
          href: a.getAttribute('href') || '',
          target: a.getAttribute('target') || '',
          visible: (a as HTMLElement).offsetParent !== null
        }))
      );

      // Enlaces rotos
      const brokenLinks = links.filter(l => l.visible && (!l.href || l.href === '#' || l.href === ''));
      if (brokenLinks.length > 0) {
        this.addIssue({
          type: 'warning',
          category: 'link',
          page: url,
          message: `${brokenLinks.length} enlaces rotos o vacíos`,
          details: brokenLinks.slice(0, 10) // Solo primeros 10
        });
      }

      // Enlaces externos sin target="_blank"
      const externalLinks = links.filter(
        l => l.href.startsWith('http') && !l.href.includes(CONFIG.baseUrl) && l.target !== '_blank'
      );
      if (externalLinks.length > 0) {
        this.addIssue({
          type: 'info',
          category: 'link',
          page: url,
          message: `${externalLinks.length} enlaces externos sin target="_blank"`,
          details: externalLinks.slice(0, 5)
        });
      }

    } catch (error: any) {
      console.error('Error analizando enlaces:', error.message);
    }
  }

  /**
   * Analizar formularios
   */
  async analyzeForms(url: string) {
    if (!this.page) return;

    try {
      const forms = await this.page.$$eval('form', (formElements) =>
        formElements.map(form => ({
          action: form.getAttribute('action') || '',
          method: form.getAttribute('method') || 'GET',
          inputs: form.querySelectorAll('input, textarea, select').length,
          hasSubmit: !!form.querySelector('button[type="submit"], input[type="submit"]')
        }))
      );

      // Formularios sin botón submit
      const noSubmitForms = forms.filter(f => !f.hasSubmit && f.inputs > 0);
      if (noSubmitForms.length > 0) {
        this.addIssue({
          type: 'warning',
          category: 'functionality',
          page: url,
          message: `${noSubmitForms.length} formularios sin botón submit`,
          details: noSubmitForms
        });
      }

    } catch (error: any) {
      console.error('Error analizando formularios:', error.message);
    }
  }

  /**
   * Analizar accesibilidad básica
   */
  async analyzeAccessibility(url: string) {
    if (!this.page) return;

    try {
      // Imágenes sin alt
      const imagesWithoutAlt = await this.page.$$eval(
        'img',
        (imgs) => imgs.filter(img => !img.alt).length
      );

      if (imagesWithoutAlt > 0) {
        this.addIssue({
          type: 'warning',
          category: 'accessibility',
          page: url,
          message: `${imagesWithoutAlt} imágenes sin atributo alt`
        });
      }

      // Inputs sin label
      const inputsWithoutLabel = await this.page.$$eval(
        'input:not([type="hidden"])',
        (inputs) => inputs.filter(input => {
          const id = input.id;
          return !id || !document.querySelector(`label[for="${id}"]`);
        }).length
      );

      if (inputsWithoutLabel > 0) {
        this.addIssue({
          type: 'warning',
          category: 'accessibility',
          page: url,
          message: `${inputsWithoutLabel} inputs sin label asociado`
        });
      }

    } catch (error: any) {
      console.error('Error analizando accesibilidad:', error.message);
    }
  }

  /**
   * Descubrir todas las rutas de la app
   */
  async discoverRoutes(): Promise<string[]> {
    console.log('🔍 Descubriendo rutas de la aplicación...');
    
    // Buscar archivos page.tsx
    const pageFiles = await glob('app/**/page.tsx', { 
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/.next/**']
    });

    const routes = pageFiles.map(file => {
      // Convertir path de archivo a ruta URL
      let route = file
        .replace('app/', '/')
        .replace('/page.tsx', '')
        .replace(/\(.*?\)/g, '') // Eliminar grupos de rutas
        .replace(/\[.*?\]/g, ':id'); // Convertir parámetros dinámicos

      // Limpiar ruta
      if (route === '/') route = '/';
      else route = route.replace(/\/$/, '');

      return route;
    });

    // Filtrar rutas duplicadas y ordenar
    const uniqueRoutes = [...new Set(routes)].sort();

    console.log(`📊 Encontradas ${uniqueRoutes.length} rutas`);
    
    return uniqueRoutes;
  }

  /**
   * Tomar screenshot
   */
  async takeScreenshot(name: string) {
    if (!this.page) return;

    try {
      const filename = `${name}-${Date.now()}.png`;
      const filepath = path.join(CONFIG.screenshotsDir, filename);
      await this.page.screenshot({ path: filepath, fullPage: false });
      console.log(`📸 Screenshot: ${filename}`);
      return filename;
    } catch (error) {
      console.error('Error tomando screenshot:', error);
    }
  }

  /**
   * Agregar issue
   */
  addIssue(issue: PageIssue) {
    this.issues.push(issue);
  }

  /**
   * Generar reporte
   */
  async generateReport(): Promise<AnalysisReport> {
    const errors = this.issues.filter(i => i.type === 'error');
    const warnings = this.issues.filter(i => i.type === 'warning');
    const info = this.issues.filter(i => i.type === 'info');

    const report: AnalysisReport = {
      timestamp: new Date(),
      totalPages: this.pagesVisited.size,
      pagesAnalyzed: this.pagesVisited.size,
      errors,
      warnings,
      info,
      summary: {
        consoleErrors: this.issues.filter(i => i.category === 'console' && i.type === 'error').length,
        httpErrors: this.issues.filter(i => i.category === 'http' && i.type === 'error').length,
        brokenButtons: this.issues.filter(i => i.category === 'button').length,
        brokenLinks: this.issues.filter(i => i.category === 'link').length,
        sidebarIssues: this.issues.filter(i => i.category === 'sidebar').length,
        missingFunctionality: this.issues.filter(i => i.category === 'functionality').length
      }
    };

    // Guardar reporte JSON
    const reportPath = path.join(
      CONFIG.reportsDir,
      `analysis-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generar reporte HTML
    await this.generateHTMLReport(report);

    console.log(`\n📊 REPORTE GENERADO:`);
    console.log(`- Total páginas analizadas: ${report.pagesAnalyzed}`);
    console.log(`- ❌ Errores: ${errors.length}`);
    console.log(`- ⚠️ Advertencias: ${warnings.length}`);
    console.log(`- ℹ️ Info: ${info.length}`);
    console.log(`\n📁 Reporte guardado en: ${reportPath}`);

    return report;
  }

  /**
   * Generar reporte HTML
   */
  async generateHTMLReport(report: AnalysisReport) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte de Análisis - INMOVA</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
    .stat-value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
    .issue { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 6px; }
    .issue.error { border-left: 4px solid #dc2626; }
    .issue.warning { border-left: 4px solid #f59e0b; }
    .issue.info { border-left: 4px solid #3b82f6; }
    .issue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .issue-type { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white; }
    .issue-type.error { background: #dc2626; }
    .issue-type.warning { background: #f59e0b; }
    .issue-type.info { background: #3b82f6; }
    .issue-category { background: #e5e7eb; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
    .issue-page { color: #666; font-size: 13px; margin-bottom: 5px; }
    .issue-message { color: #333; font-weight: 500; margin: 10px 0; }
    .issue-details { background: #f9fafb; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; overflow-x: auto; }
    .timestamp { color: #999; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Reporte de Análisis - INMOVA</h1>
    <p class="timestamp">Generado: ${report.timestamp.toLocaleString('es-ES')}</p>
    
    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${report.pagesAnalyzed}</div>
        <div class="stat-label">Páginas Analizadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #dc2626;">${report.errors.length}</div>
        <div class="stat-label">Errores</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #f59e0b;">${report.warnings.length}</div>
        <div class="stat-label">Advertencias</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #3b82f6;">${report.info.length}</div>
        <div class="stat-label">Información</div>
      </div>
    </div>

    <h2>Resumen por Categoría</h2>
    <ul>
      <li>Errores de Consola: ${report.summary.consoleErrors}</li>
      <li>Errores HTTP: ${report.summary.httpErrors}</li>
      <li>Problemas de Botones: ${report.summary.brokenButtons}</li>
      <li>Enlaces Rotos: ${report.summary.brokenLinks}</li>
      <li>Problemas de Sidebar: ${report.summary.sidebarIssues}</li>
      <li>Funcionalidades Faltantes: ${report.summary.missingFunctionality}</li>
    </ul>

    ${report.errors.length > 0 ? `
    <h2>❌ Errores (${report.errors.length})</h2>
    ${report.errors.map(issue => `
      <div class="issue error">
        <div class="issue-header">
          <span class="issue-type error">ERROR</span>
          <span class="issue-category">${issue.category}</span>
        </div>
        <div class="issue-page">📄 ${issue.page}</div>
        <div class="issue-message">${issue.message}</div>
        ${issue.details ? `<pre class="issue-details">${JSON.stringify(issue.details, null, 2)}</pre>` : ''}
      </div>
    `).join('')}
    ` : ''}

    ${report.warnings.length > 0 ? `
    <h2>⚠️ Advertencias (${report.warnings.length})</h2>
    ${report.warnings.map(issue => `
      <div class="issue warning">
        <div class="issue-header">
          <span class="issue-type warning">WARNING</span>
          <span class="issue-category">${issue.category}</span>
        </div>
        <div class="issue-page">📄 ${issue.page}</div>
        <div class="issue-message">${issue.message}</div>
        ${issue.details ? `<pre class="issue-details">${JSON.stringify(issue.details, null, 2)}</pre>` : ''}
      </div>
    `).join('')}
    ` : ''}

    ${report.info.length > 0 ? `
    <h2>ℹ️ Información (${report.info.length})</h2>
    ${report.info.slice(0, 20).map(issue => `
      <div class="issue info">
        <div class="issue-header">
          <span class="issue-type info">INFO</span>
          <span class="issue-category">${issue.category}</span>
        </div>
        <div class="issue-page">📄 ${issue.page}</div>
        <div class="issue-message">${issue.message}</div>
      </div>
    `).join('')}
    ${report.info.length > 20 ? `<p>... y ${report.info.length - 20} más</p>` : ''}
    ` : ''}
  </div>
</body>
</html>
    `;

    const htmlPath = path.join(
      CONFIG.reportsDir,
      `analysis-report-${Date.now()}.html`
    );
    fs.writeFileSync(htmlPath, html);
    console.log(`📁 Reporte HTML: ${htmlPath}`);
  }

  /**
   * Cerrar navegador
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Navegador cerrado');
    }
  }

  /**
   * Ejecutar análisis completo
   */
  async runCompleteAnalysis() {
    console.log('🚀 Iniciando análisis completo de la aplicación...\n');

    try {
      await this.init();

      // Login como admin
      await this.login('admin');

      // Analizar sidebar en dashboard principal
      await this.page?.goto(`${CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
      await this.analyzeSidebar();

      // Descubrir rutas
      const routes = await this.discoverRoutes();

      // Analizar páginas principales y más importantes
      const priorityRoutes = routes.filter(route => 
        !route.includes(':id') && // Excluir rutas dinámicas por ahora
        !route.includes('api') &&
        !route.includes('_') &&
        route.length < 50 // Excluir rutas muy largas
      ).slice(0, 50); // Limitar a primeras 50 páginas

      console.log(`\n📋 Analizando ${priorityRoutes.length} páginas prioritarias...\n`);

      for (const route of priorityRoutes) {
        await this.analyzePage(route);
        await this.page?.waitForTimeout(1000); // Pausa entre páginas
      }

      // Generar reporte
      const report = await this.generateReport();

      return report;

    } catch (error) {
      console.error('❌ Error en análisis:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// ============================================================================
// EJECUCIÓN
// ============================================================================

async function main() {
  const analyzer = new AppAnalyzer();
  
  try {
    const report = await analyzer.runCompleteAnalysis();
    
    console.log('\n✅ Análisis completado!');
    console.log('\n📊 Resumen:');
    console.log(`- Páginas analizadas: ${report.pagesAnalyzed}`);
    console.log(`- Errores: ${report.errors.length}`);
    console.log(`- Advertencias: ${report.warnings.length}`);
    console.log(`- Info: ${report.info.length}`);
    
    // Exit code basado en errores
    process.exit(report.errors.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { AppAnalyzer, CONFIG };
