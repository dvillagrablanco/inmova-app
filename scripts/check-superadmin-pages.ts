/**
 * Script para verificar todas las páginas del Super Admin
 * Detecta errores 500, 404, y problemas de renderizado
 */
import { chromium, Browser, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';

// Credenciales de Super Admin
const SUPER_ADMIN_EMAIL = 'admin@inmova.app';
const SUPER_ADMIN_PASSWORD = 'Admin123!';

// Rutas del Super Admin - Gestión de Plataforma
const PLATFORM_ROUTES = [
  { path: '/admin/dashboard', name: 'Dashboard Admin' },
  { path: '/admin/clientes', name: 'Clientes B2B' },
  { path: '/admin/planes', name: 'Billing/Planes' },
  { path: '/admin/cupones', name: 'Cupones' },
  { path: '/admin/partners', name: 'Partners' },
  { path: '/dashboard/integrations', name: 'Integraciones' },
  { path: '/admin/marketplace', name: 'Marketplace' },
  { path: '/admin/activity', name: 'Monitoreo/Actividad' },
  { path: '/admin/portales-externos', name: 'Portales Externos' },
  { path: '/admin/seguridad', name: 'Seguridad' },
  { path: '/api-docs', name: 'API Docs' },
];

// Rutas de Gestión de Empresa (también accesibles para Super Admin)
const COMPANY_ROUTES = [
  { path: '/admin/configuracion', name: 'Configuración Empresa' },
  { path: '/admin/usuarios', name: 'Usuarios' },
  { path: '/admin/modulos', name: 'Módulos' },
  { path: '/admin/personalizacion', name: 'Branding/Personalización' },
  { path: '/admin/aprobaciones', name: 'Aprobaciones' },
  { path: '/admin/importar', name: 'Importar Datos' },
  { path: '/admin/sugerencias', name: 'Sugerencias' },
];

// Otras rutas administrativas que podrían existir
const OTHER_ADMIN_ROUTES = [
  { path: '/admin/facturacion-b2b', name: 'Facturación B2B' },
  { path: '/admin/alertas', name: 'Alertas' },
  { path: '/admin/reportes-programados', name: 'Reportes Programados' },
  { path: '/admin/ocr-import', name: 'OCR Import' },
  { path: '/admin/sales-team', name: 'Sales Team' },
];

interface PageResult {
  path: string;
  name: string;
  status: 'ok' | 'error' | '404' | '500' | 'redirect' | 'timeout';
  httpStatus?: number;
  errorMessage?: string;
  redirectedTo?: string;
  loadTime?: number;
  hasContent?: boolean;
}

class SuperAdminPageChecker {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: PageResult[] = [];

  async init() {
    console.log('🚀 Iniciando navegador...');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    this.page = await context.newPage();
    
    // Configurar timeout
    this.page.setDefaultTimeout(30000);
  }

  async login(): Promise<boolean> {
    if (!this.page) return false;
    
    console.log('🔐 Iniciando sesión como Super Admin...');
    
    try {
      await this.page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      
      // Esperar el formulario
      await this.page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
      
      // Llenar credenciales
      await this.page.fill('input[name="email"], input[type="email"]', SUPER_ADMIN_EMAIL);
      await this.page.fill('input[name="password"], input[type="password"]', SUPER_ADMIN_PASSWORD);
      
      // Click en submit
      await this.page.click('button[type="submit"]');
      
      // Esperar navegación
      await this.page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
      
      console.log('✅ Sesión iniciada correctamente');
      return true;
    } catch (error: any) {
      console.error('❌ Error en login:', error.message);
      return false;
    }
  }

  async checkPage(route: { path: string; name: string }): Promise<PageResult> {
    if (!this.page) {
      return { 
        path: route.path, 
        name: route.name, 
        status: 'error', 
        errorMessage: 'Page not initialized' 
      };
    }

    const result: PageResult = {
      path: route.path,
      name: route.name,
      status: 'ok'
    };

    const startTime = Date.now();

    try {
      // Interceptar respuestas HTTP
      let httpStatus = 200;
      this.page.once('response', (response) => {
        if (response.url().includes(route.path)) {
          httpStatus = response.status();
        }
      });

      // Navegar a la página
      const response = await this.page.goto(`${BASE_URL}${route.path}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      result.loadTime = Date.now() - startTime;
      result.httpStatus = response?.status() || httpStatus;

      // Verificar redirección
      const currentUrl = this.page.url();
      if (!currentUrl.includes(route.path)) {
        result.status = 'redirect';
        result.redirectedTo = currentUrl;
        
        // Si redirige a login, es un problema de permisos
        if (currentUrl.includes('/login')) {
          result.status = 'error';
          result.errorMessage = 'Redirigido a login - posible problema de permisos';
        }
        return result;
      }

      // Verificar status HTTP
      if (result.httpStatus === 404) {
        result.status = '404';
        result.errorMessage = 'Página no encontrada';
        return result;
      }

      if (result.httpStatus >= 500) {
        result.status = '500';
        result.errorMessage = 'Error del servidor';
        return result;
      }

      // Esperar un poco para que cargue el contenido
      await this.page.waitForTimeout(2000);

      // Verificar errores en la página
      const pageContent = await this.page.content();
      
      // Buscar mensajes de error comunes
      const errorPatterns = [
        /error/i,
        /500/,
        /internal server error/i,
        /something went wrong/i,
        /application error/i,
        /unhandled runtime error/i,
        /failed to load/i,
      ];

      // Verificar el título y contenido
      const title = await this.page.title();
      const bodyText = await this.page.textContent('body') || '';
      
      // Verificar si hay contenido visible (no solo errores)
      const hasMainContent = await this.page.$('main, [role="main"], .container, .content, h1, h2');
      result.hasContent = !!hasMainContent;

      // Buscar elementos de error específicos
      const errorElement = await this.page.$('[class*="error"], [class*="Error"], .error-boundary');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        if (errorText && errorText.length > 0) {
          result.status = 'error';
          result.errorMessage = errorText.substring(0, 200);
          return result;
        }
      }

      // Verificar si la página está básicamente vacía
      if (bodyText.length < 100 && !result.hasContent) {
        result.status = 'error';
        result.errorMessage = 'Página sin contenido visible';
        return result;
      }

      // Verificar si hay errores en consola
      const consoleErrors: string[] = [];
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      if (consoleErrors.length > 0) {
        result.errorMessage = `Console errors: ${consoleErrors.slice(0, 3).join('; ')}`;
      }

      return result;

    } catch (error: any) {
      result.loadTime = Date.now() - startTime;
      
      if (error.message.includes('timeout')) {
        result.status = 'timeout';
        result.errorMessage = 'Tiempo de espera agotado';
      } else {
        result.status = 'error';
        result.errorMessage = error.message.substring(0, 200);
      }
      
      return result;
    }
  }

  async checkAllPages() {
    console.log('\n📋 Verificando páginas de Gestión de Plataforma...\n');
    
    for (const route of PLATFORM_ROUTES) {
      process.stdout.write(`  Checking ${route.name}... `);
      const result = await this.checkPage(route);
      this.results.push(result);
      this.printResult(result);
    }

    console.log('\n📋 Verificando páginas de Gestión de Empresa...\n');
    
    for (const route of COMPANY_ROUTES) {
      process.stdout.write(`  Checking ${route.name}... `);
      const result = await this.checkPage(route);
      this.results.push(result);
      this.printResult(result);
    }

    console.log('\n📋 Verificando otras rutas administrativas...\n');
    
    for (const route of OTHER_ADMIN_ROUTES) {
      process.stdout.write(`  Checking ${route.name}... `);
      const result = await this.checkPage(route);
      this.results.push(result);
      this.printResult(result);
    }
  }

  printResult(result: PageResult) {
    const statusIcons: Record<string, string> = {
      'ok': '✅',
      'error': '❌',
      '404': '🔍',
      '500': '💥',
      'redirect': '↪️',
      'timeout': '⏱️'
    };

    const icon = statusIcons[result.status] || '❓';
    let message = `${icon} ${result.status.toUpperCase()}`;
    
    if (result.loadTime) {
      message += ` (${result.loadTime}ms)`;
    }
    
    if (result.errorMessage) {
      message += ` - ${result.errorMessage.substring(0, 50)}`;
    }
    
    if (result.redirectedTo) {
      message += ` → ${result.redirectedTo}`;
    }
    
    console.log(message);
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(70) + '\n');

    const okPages = this.results.filter(r => r.status === 'ok');
    const errorPages = this.results.filter(r => r.status === 'error');
    const notFoundPages = this.results.filter(r => r.status === '404');
    const serverErrorPages = this.results.filter(r => r.status === '500');
    const redirectPages = this.results.filter(r => r.status === 'redirect');
    const timeoutPages = this.results.filter(r => r.status === 'timeout');

    console.log(`✅ Páginas OK: ${okPages.length}`);
    console.log(`❌ Páginas con errores: ${errorPages.length}`);
    console.log(`🔍 Páginas no encontradas (404): ${notFoundPages.length}`);
    console.log(`💥 Errores de servidor (500): ${serverErrorPages.length}`);
    console.log(`↪️ Redirecciones: ${redirectPages.length}`);
    console.log(`⏱️ Timeouts: ${timeoutPages.length}`);

    if (errorPages.length > 0 || serverErrorPages.length > 0 || notFoundPages.length > 0) {
      console.log('\n🔴 PÁGINAS CON PROBLEMAS:\n');
      
      [...errorPages, ...serverErrorPages, ...notFoundPages, ...timeoutPages].forEach(page => {
        console.log(`  • ${page.name} (${page.path})`);
        console.log(`    Status: ${page.status}`);
        if (page.errorMessage) {
          console.log(`    Error: ${page.errorMessage}`);
        }
        console.log();
      });
    }

    if (redirectPages.length > 0) {
      console.log('\n⚠️ PÁGINAS CON REDIRECCIÓN:\n');
      redirectPages.forEach(page => {
        console.log(`  • ${page.name} (${page.path}) → ${page.redirectedTo}`);
      });
    }

    // Generar JSON con resultados
    console.log('\n📄 Resultados guardados en: /tmp/superadmin-pages-check.json\n');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  getResults() {
    return this.results;
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN DE PÁGINAS SUPER ADMIN');
  console.log('='.repeat(70));
  console.log(`\nURL Base: ${BASE_URL}`);
  console.log(`Usuario: ${SUPER_ADMIN_EMAIL}\n`);

  const checker = new SuperAdminPageChecker();
  
  try {
    await checker.init();
    
    const loginSuccess = await checker.login();
    if (!loginSuccess) {
      console.error('\n❌ No se pudo iniciar sesión. Abortando verificación.\n');
      process.exit(1);
    }

    await checker.checkAllPages();
    checker.printSummary();

    // Guardar resultados en JSON
    const results = checker.getResults();
    const fs = await import('fs');
    fs.writeFileSync('/tmp/superadmin-pages-check.json', JSON.stringify(results, null, 2));

    // Retornar código de error si hay páginas con problemas
    const hasErrors = results.some(r => 
      r.status === 'error' || r.status === '500' || r.status === '404'
    );
    
    process.exit(hasErrors ? 1 : 0);

  } catch (error) {
    console.error('Error fatal:', error);
    process.exit(1);
  } finally {
    await checker.close();
  }
}

main();
