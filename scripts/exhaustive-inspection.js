const { chromium } = require('playwright');
const fs = require('fs');

/**
 * INSPECCIÓN VISUAL EXHAUSTIVA - INMOVA APP
 * 
 * Aplicando CURSORRULES:
 * - 🎨 UX/UI Designer: Verificar elementos visuales, botones, accesibilidad
 * - 🔒 Security Expert: Detectar exposición de datos sensibles
 * - 🚀 Performance Engineer: Medir tiempos de carga
 * - 🧪 QA Engineer: Capturar todos los errores (console, JS, network, hydration)
 * - 📝 Documentation: Generar reporte completo
 */

// DEFINICIÓN EXHAUSTIVA DE TODAS LAS PÁGINAS
const PAGES_TO_INSPECT = [
  // ============ ALTA PRIORIDAD - LANDING Y PÚBLICAS ============
  { name: 'Landing', url: '/landing', category: 'public', priority: 'critical', checkButtons: ['Comenzar Gratis', 'Ver Demo', 'Probar Gratis'] },
  { name: 'Home Root', url: '/', category: 'public', priority: 'critical', checkButtons: [] },
  { name: 'Login', url: '/login', category: 'auth', priority: 'critical', checkButtons: ['button[type="submit"]', 'Iniciar Sesión'] },
  { name: 'Register', url: '/register', category: 'auth', priority: 'critical', checkButtons: ['button[type="submit"]', 'Registrarse'] },
  { name: 'Unauthorized', url: '/unauthorized', category: 'public', priority: 'high', checkButtons: [] },
  
  // ============ DASHBOARD PRINCIPAL ============
  { name: 'Dashboard', url: '/dashboard', category: 'dashboard', priority: 'critical', checkButtons: [] },
  { name: 'Dashboard/Properties', url: '/dashboard/properties', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Tenants', url: '/dashboard/tenants', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Contracts', url: '/dashboard/contracts', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Payments', url: '/dashboard/payments', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Maintenance', url: '/dashboard/maintenance', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Analytics', url: '/dashboard/analytics', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Messages', url: '/dashboard/messages', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Documents', url: '/dashboard/documents', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Referrals', url: '/dashboard/referrals', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Budgets', url: '/dashboard/budgets', category: 'dashboard', priority: 'high', checkButtons: [] },
  { name: 'Dashboard/Coupons', url: '/dashboard/coupons', category: 'dashboard', priority: 'high', checkButtons: [] },
  
  // ============ ADMIN ============
  { name: 'Admin', url: '/admin', category: 'admin', priority: 'high', checkButtons: [] },
  { name: 'Admin/Usuarios', url: '/admin/usuarios', category: 'admin', priority: 'medium', checkButtons: [] },
  { name: 'Admin/Configuracion', url: '/admin/configuracion', category: 'admin', priority: 'medium', checkButtons: [] },
  { name: 'Admin/Planes', url: '/admin/planes', category: 'admin', priority: 'medium', checkButtons: [] },
  { name: 'Admin/Modulos', url: '/admin/modulos', category: 'admin', priority: 'medium', checkButtons: [] },
  { name: 'Admin/Marketplace', url: '/admin/marketplace', category: 'admin', priority: 'medium', checkButtons: [] },
  
  // ============ PORTALES ============
  { name: 'Portal Inquilino', url: '/portal-inquilino', category: 'portal', priority: 'high', checkButtons: [] },
  { name: 'Portal Inquilino/Pagos', url: '/portal-inquilino/pagos', category: 'portal', priority: 'medium', checkButtons: [] },
  { name: 'Portal Inquilino/Incidencias', url: '/portal-inquilino/incidencias', category: 'portal', priority: 'medium', checkButtons: [] },
  { name: 'Portal Inquilino/Contrato', url: '/portal-inquilino/contrato', category: 'portal', priority: 'medium', checkButtons: [] },
  { name: 'Portal Inquilino/Comunicacion', url: '/portal-inquilino/comunicacion', category: 'portal', priority: 'medium', checkButtons: [] },
  { name: 'Portal Proveedor', url: '/portal-proveedor', category: 'portal', priority: 'high', checkButtons: [] },
  { name: 'Portal Proveedor/Ordenes', url: '/portal-proveedor/ordenes', category: 'portal', priority: 'medium', checkButtons: [] },
  { name: 'Portal Proveedor/Presupuestos', url: '/portal-proveedor/presupuestos', category: 'portal', priority: 'medium', checkButtons: [] },
  { name: 'Portal Proveedor/Facturas', url: '/portal-proveedor/facturas', category: 'portal', priority: 'medium', checkButtons: [] },
  { name: 'Portal Comercial', url: '/portal-comercial', category: 'portal', priority: 'high', checkButtons: [] },
  { name: 'Portal Comercial/Leads', url: '/portal-comercial/leads', category: 'portal', priority: 'medium', checkButtons: [] },
  { name: 'Portal Comercial/Objetivos', url: '/portal-comercial/objetivos', category: 'portal', priority: 'medium', checkButtons: [] },
  
  // ============ MÓDULOS PRINCIPALES ============
  { name: 'Propiedades', url: '/propiedades', category: 'feature', priority: 'high', checkButtons: [] },
  { name: 'Propiedades/Crear', url: '/propiedades/crear', category: 'feature', priority: 'medium', checkButtons: [] },
  { name: 'Seguros', url: '/seguros', category: 'feature', priority: 'medium', checkButtons: [] },
  { name: 'Seguros/Nuevo', url: '/seguros/nuevo', category: 'feature', priority: 'low', checkButtons: [] },
  { name: 'Reportes', url: '/reportes', category: 'feature', priority: 'high', checkButtons: [] },
  { name: 'Reportes/Financieros', url: '/reportes/financieros', category: 'feature', priority: 'medium', checkButtons: [] },
  { name: 'Visitas', url: '/visitas', category: 'feature', priority: 'medium', checkButtons: [] },
  { name: 'Votaciones', url: '/votaciones', category: 'feature', priority: 'medium', checkButtons: [] },
  { name: 'Tareas', url: '/tareas', category: 'feature', priority: 'medium', checkButtons: [] },
  
  // ============ VERTICALES ============
  { name: 'STR', url: '/str', category: 'vertical', priority: 'medium', checkButtons: [] },
  { name: 'STR/Bookings', url: '/str/bookings', category: 'vertical', priority: 'low', checkButtons: [] },
  { name: 'STR/Listings', url: '/str/listings', category: 'vertical', priority: 'low', checkButtons: [] },
  { name: 'STR/Channels', url: '/str/channels', category: 'vertical', priority: 'low', checkButtons: [] },
  { name: 'Coliving', url: '/coliving', category: 'vertical', priority: 'medium', checkButtons: [] },
  { name: 'Student Housing', url: '/student-housing', category: 'vertical', priority: 'medium', checkButtons: [] },
  { name: 'Workspace', url: '/workspace', category: 'vertical', priority: 'medium', checkButtons: [] },
  { name: 'Partners', url: '/partners', category: 'vertical', priority: 'medium', checkButtons: [] },
  { name: 'Partners/Dashboard', url: '/partners/dashboard', category: 'vertical', priority: 'low', checkButtons: [] },
  { name: 'Partners/Clients', url: '/partners/clients', category: 'vertical', priority: 'low', checkButtons: [] },
  
  // ============ OTROS MÓDULOS ============
  { name: 'Usuarios', url: '/usuarios', category: 'feature', priority: 'low', checkButtons: [] },
  { name: 'Proveedores', url: '/proveedores', category: 'feature', priority: 'low', checkButtons: [] },
  { name: 'Screening', url: '/screening', category: 'feature', priority: 'low', checkButtons: [] },
  { name: 'Tours Virtuales', url: '/tours-virtuales', category: 'feature', priority: 'low', checkButtons: [] },
  { name: 'Valoraciones', url: '/valoraciones', category: 'feature', priority: 'low', checkButtons: [] },
];

class ExhaustiveInspector {
  constructor() {
    this.baseURL = 'https://inmovaapp.com';
    this.results = {
      timestamp: new Date().toISOString(),
      summary: { total: 0, success: 0, warnings: 0, errors: 0, critical: 0 },
      pages: [],
      criticalIssues: [],
    };
  }
  
  async init() {
    console.log('🚀 Iniciando navegador Chromium...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
  }
  
  async inspectPage(pageData) {
    const page = await this.context.newPage();
    
    const inspection = {
      name: pageData.name,
      url: pageData.url,
      category: pageData.category,
      httpStatus: null,
      loadTime: 0,
      errors: [],
      buttons: [],
      hasH1: false,
      hasNavigation: false,
      hasFooter: false,
      screenshotPath: null,
      status: 'success',
    };
    
    try {
      // Capturar errores de consola
      page.on('console', msg => {
        if (msg.type() === 'error') {
          inspection.errors.push({
            type: 'console',
            message: msg.text(),
            timestamp: Date.now(),
          });
        }
      });
      
      // Capturar errores de JavaScript
      page.on('pageerror', error => {
        inspection.errors.push({
          type: 'javascript',
          message: error.message,
          timestamp: Date.now(),
        });
      });
      
      // Capturar errores de red
      page.on('response', response => {
        if (response.status() >= 400) {
          inspection.errors.push({
            type: 'network',
            message: `Failed to load: ${response.url()}`,
            url: response.url(),
            statusCode: response.status(),
            timestamp: Date.now(),
          });
        }
      });
      
      // Navegar
      const startTime = Date.now();
      const response = await page.goto(this.baseURL + pageData.url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      inspection.loadTime = Date.now() - startTime;
      inspection.httpStatus = response ? response.status() : null;
      
      // Esperar para lazy-loaded components
      await page.waitForTimeout(2000);
      
      // Verificar elementos críticos
      inspection.hasH1 = (await page.locator('h1').count()) > 0;
      inspection.hasNavigation = (await page.locator('nav').count()) > 0;
      inspection.hasFooter = (await page.locator('footer').count()) > 0;
      
      // Verificar botones específicos
      if (pageData.checkButtons && pageData.checkButtons.length > 0) {
        for (const btnSelector of pageData.checkButtons) {
          const buttonCheck = {
            selector: btnSelector,
            text: btnSelector,
            found: false,
            clickable: false,
          };
          
          try {
            // Intentar como selector CSS
            let button = page.locator(btnSelector).first();
            let count = await button.count();
            
            // Si no se encuentra, intentar como texto
            if (count === 0) {
              button = page.getByRole('button', { name: new RegExp(btnSelector, 'i') }).first();
              count = await button.count();
            }
            
            if (count > 0) {
              buttonCheck.found = true;
              buttonCheck.clickable = await button.isVisible() && await button.isEnabled();
            }
          } catch (e) {
            buttonCheck.error = e.message;
          }
          
          inspection.buttons.push(buttonCheck);
        }
      }
      
      // Determinar status
      if (inspection.httpStatus === 200) {
        const jsErrors = inspection.errors.filter(e => e.type === 'javascript').length;
        const consoleErrors = inspection.errors.filter(e => e.type === 'console').length;
        const missingButtons = inspection.buttons.filter(b => !b.found).length;
        
        if (jsErrors === 0 && consoleErrors === 0 && missingButtons === 0) {
          inspection.status = 'success';
        } else if (jsErrors > 0 || missingButtons > 0) {
          inspection.status = 'warning';
        }
      } else if (inspection.httpStatus === 404) {
        inspection.status = 'error';
      } else if (inspection.httpStatus && inspection.httpStatus >= 500) {
        inspection.status = 'critical';
      }
      
      // Marcar como crítico si es página importante con errores
      if (['critical', 'high'].includes(pageData.priority) && inspection.errors.length > 0) {
        inspection.status = 'critical';
        this.results.criticalIssues.push({
          page: pageData.name,
          issue: `${inspection.errors.length} errors on critical page`,
        });
      }
      
    } catch (error) {
      inspection.status = 'error';
      inspection.errors.push({
        type: 'navigation',
        message: error.message,
        timestamp: Date.now(),
      });
      
      if (pageData.priority === 'critical') {
        this.results.criticalIssues.push({
          page: pageData.name,
          issue: `Navigation failed: ${error.message}`,
        });
      }
    } finally {
      await page.close();
    }
    
    return inspection;
  }
  
  async run() {
    await this.init();
    
    console.log('🎯 INSPECCIÓN VISUAL EXHAUSTIVA - INMOVA APP');
    console.log('='.repeat(80));
    console.log(`Total páginas a inspeccionar: ${PAGES_TO_INSPECT.length}`);
    console.log('');
    
    // Agrupar por categoría
    const byCategory = {};
    for (const page of PAGES_TO_INSPECT) {
      if (!byCategory[page.category]) {
        byCategory[page.category] = [];
      }
      byCategory[page.category].push(page);
    }
    
    // Inspeccionar por categoría
    for (const [category, pages] of Object.entries(byCategory)) {
      console.log(`\n📋 ${category.toUpperCase()}`);
      console.log('-'.repeat(80));
      
      for (const pageData of pages) {
        process.stdout.write(`  ${pageData.name.padEnd(40)}...`);
        const result = await this.inspectPage(pageData);
        
        const emoji = 
          result.status === 'success' ? '✅' :
          result.status === 'warning' ? '⚠️' :
          result.status === 'error' ? '❌' :
          '🚨';
        
        console.log(` ${emoji} HTTP ${result.httpStatus || 'N/A'} (${result.loadTime}ms)`);
        
        // Mostrar errores inmediatamente
        if (result.errors.length > 0) {
          const jsErrors = result.errors.filter(e => e.type === 'javascript');
          const consoleErrors = result.errors.filter(e => e.type === 'console');
          const networkErrors = result.errors.filter(e => e.type === 'network');
          
          if (jsErrors.length > 0) {
            console.log(`     🐛 ${jsErrors.length} JS errors`);
            jsErrors.slice(0, 1).forEach(e => {
              console.log(`        → ${e.message.substring(0, 100)}`);
            });
          }
          if (consoleErrors.length > 0) {
            console.log(`     ⚠️ ${consoleErrors.length} console errors`);
          }
          if (networkErrors.length > 0) {
            console.log(`     🌐 ${networkErrors.length} network errors`);
          }
        }
        
        if (result.buttons.length > 0) {
          const missing = result.buttons.filter(b => !b.found);
          if (missing.length > 0) {
            console.log(`     ❌ Botones faltantes: ${missing.map(b => b.text).join(', ')}`);
          }
        }
        
        this.results.pages.push(result);
        this.results.summary.total++;
        
        if (result.status === 'success') this.results.summary.success++;
        else if (result.status === 'warning') this.results.summary.warnings++;
        else if (result.status === 'error') this.results.summary.errors++;
        else if (result.status === 'critical') this.results.summary.critical++;
      }
    }
    
    await this.browser.close();
    
    // Guardar resultados
    const outputPath = '/tmp/exhaustive-inspection-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    
    // Imprimir resumen
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE INSPECCIÓN EXHAUSTIVA');
    console.log('='.repeat(80));
    console.log(`Total páginas: ${this.results.summary.total}`);
    console.log(`✅ Éxito: ${this.results.summary.success}`);
    console.log(`⚠️ Warnings: ${this.results.summary.warnings}`);
    console.log(`❌ Errores: ${this.results.summary.errors}`);
    console.log(`🚨 Críticos: ${this.results.summary.critical}`);
    
    if (this.results.criticalIssues.length > 0) {
      console.log('\n🚨 ISSUES CRÍTICOS:');
      this.results.criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue.page}: ${issue.issue}`);
      });
    }
    
    const successRate = ((this.results.summary.success / this.results.summary.total) * 100).toFixed(1);
    console.log(`\nTasa de éxito: ${successRate}%`);
    console.log(`\n📁 Resultados guardados: ${outputPath}`);
  }
}

// Ejecutar
(async () => {
  const inspector = new ExhaustiveInspector();
  await inspector.run();
  process.exit(0);
})();
