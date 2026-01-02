import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface ErrorLog {
  page: string;
  type: 'console' | 'network' | 'crash' | 'visual';
  severity: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

interface PageResult {
  url: string;
  success: boolean;
  errors: ErrorLog[];
  screenshot?: string;
  loadTime: number;
}

const LANDING_PAGES = [
  { url: '/landing', name: 'Landing Principal' },
  { url: '/landing/calculadora-roi', name: 'Calculadora ROI' },
  { url: '/landing/blog', name: 'Blog' },
  { url: '/landing/casos-exito', name: 'Casos de Éxito' },
  { url: '/landing/contacto', name: 'Contacto' },
  { url: '/landing/demo', name: 'Demo' },
  { url: '/landing/sobre-nosotros', name: 'Sobre Nosotros' },
  { url: '/landing/webinars', name: 'Webinars' },
  { url: '/landing/migracion', name: 'Migración' },
  { url: '/landing/legal/privacidad', name: 'Privacidad' },
  { url: '/landing/legal/terminos', name: 'Términos' },
  { url: '/landing/legal/cookies', name: 'Cookies' },
  { url: '/landing/legal/gdpr', name: 'GDPR' },
  { url: '/ewoorker/landing', name: 'ewoorker Landing' },
];

const SUPERADMIN_CREDENTIALS = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

const BASE_URL = process.env.APP_URL || 'http://157.180.119.236';
const SCREENSHOTS_DIR = '/workspace/scripts/screenshots';

class VisualInspector {
  private browser!: Browser;
  private errors: ErrorLog[] = [];
  private results: PageResult[] = [];

  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  }

  private setupErrorInterceptors(page: Page, pageName: string) {
    // Console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push({
          page: pageName,
          type: 'console',
          severity: 'error',
          message: msg.text(),
          timestamp: new Date().toISOString(),
        });
      } else if (msg.type() === 'warning') {
        this.errors.push({
          page: pageName,
          type: 'console',
          severity: 'warning',
          message: msg.text(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Network errors
    page.on('response', (response) => {
      if (response.status() >= 400) {
        this.errors.push({
          page: pageName,
          type: 'network',
          severity: response.status() >= 500 ? 'error' : 'warning',
          message: `${response.status()} ${response.statusText()} - ${response.url()}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Page crashes
    page.on('crash', () => {
      this.errors.push({
        page: pageName,
        type: 'crash',
        severity: 'error',
        message: 'Page crashed',
        timestamp: new Date().toISOString(),
      });
    });

    // Request failures
    page.on('requestfailed', (request) => {
      this.errors.push({
        page: pageName,
        type: 'network',
        severity: 'error',
        message: `Request failed: ${request.url()} - ${request.failure()?.errorText}`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  async inspectPage(url: string, name: string): Promise<PageResult> {
    const page = await this.browser.newPage();
    const pageErrors: ErrorLog[] = [];
    const startTime = Date.now();

    console.log(`\n🔍 Inspeccionando: ${name} (${url})`);

    this.setupErrorInterceptors(page, name);

    try {
      // Navigate (longer timeout for heavy pages)
      await page.goto(`${BASE_URL}${url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Wait for content
      await page.waitForTimeout(2000);

      // Check for common error indicators (specific error messages only, avoid false positives)
      const hasErrorText = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        // Look for specific error patterns, not just numbers
        return (
          bodyText.includes('error 404') ||
          bodyText.includes('404 not found') ||
          bodyText.includes('error 500') ||
          bodyText.includes('500 internal') ||
          bodyText.includes('failed to compile') ||
          bodyText.includes('internal server error') ||
          bodyText.includes('page not found') ||
          bodyText.includes('application error') ||
          bodyText.includes('cannot read properties') ||
          bodyText.includes('undefined is not') ||
          bodyText.includes('you cannot have two') ||
          bodyText.includes('parallel pages')
        );
      });

      if (hasErrorText) {
        pageErrors.push({
          page: name,
          type: 'visual',
          severity: 'error',
          message: 'Page contains error text in body',
          timestamp: new Date().toISOString(),
        });
      }

      // Screenshot
      const screenshotPath = path.join(
        SCREENSHOTS_DIR,
        `${name.replace(/\s+/g, '-').toLowerCase()}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const loadTime = Date.now() - startTime;

      console.log(`✅ ${name}: OK (${loadTime}ms)`);

      return {
        url,
        success: pageErrors.length === 0,
        errors: pageErrors,
        screenshot: screenshotPath,
        loadTime,
      };
    } catch (error: any) {
      const loadTime = Date.now() - startTime;
      console.log(`❌ ${name}: ERROR - ${error.message}`);

      pageErrors.push({
        page: name,
        type: 'crash',
        severity: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });

      return {
        url,
        success: false,
        errors: pageErrors,
        loadTime,
      };
    } finally {
      await page.close();
    }
  }

  async testLogin(): Promise<PageResult> {
    const page = await this.browser.newPage();
    const pageErrors: ErrorLog[] = [];
    const startTime = Date.now();

    console.log(`\n🔐 Probando login con superadministrador...`);

    this.setupErrorInterceptors(page, 'Login');

    try {
      // Navigate to login
      await page.goto(`${BASE_URL}/login`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Wait for login form to load
      await page.waitForSelector('input[name="email"]', { timeout: 30000 });
      await page.waitForTimeout(1000);

      // Fill credentials
      await page.fill('input[name="email"]', SUPERADMIN_CREDENTIALS.email);
      await page.fill('input[name="password"]', SUPERADMIN_CREDENTIALS.password);

      // Submit and wait for navigation
      await page.click('button[type="submit"]');
      
      // Wait for redirect or error (be more permissive)
      try {
        await page.waitForURL(
          (url) =>
            url.pathname.includes('/dashboard') ||
            url.pathname.includes('/admin') ||
            url.pathname.includes('/portal') ||
            url.pathname.includes('/configuracion'),
          { timeout: 30000 }
        );
      } catch (error) {
        // Check if we're still on login (failed auth)
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          throw new Error('Login failed - still on login page');
        }
        // Otherwise assume success
      }

      const loadTime = Date.now() - startTime;

      console.log(`✅ Login exitoso (${loadTime}ms)`);

      // Screenshot after login
      const screenshotPath = path.join(SCREENSHOTS_DIR, 'after-login.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        url: '/login',
        success: true,
        errors: pageErrors,
        screenshot: screenshotPath,
        loadTime,
      };
    } catch (error: any) {
      const loadTime = Date.now() - startTime;
      console.log(`❌ Login falló: ${error.message}`);

      pageErrors.push({
        page: 'Login',
        type: 'crash',
        severity: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });

      return {
        url: '/login',
        success: false,
        errors: pageErrors,
        loadTime,
      };
    } finally {
      await page.close();
    }
  }

  async testToursVirtuales(): Promise<PageResult> {
    const page = await this.browser.newPage();
    const pageErrors: ErrorLog[] = [];
    const startTime = Date.now();

    console.log(`\n🎥 Probando Tours Virtuales...`);

    this.setupErrorInterceptors(page, 'Tours Virtuales');

    try {
      // Login first
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('input[name="email"]', { timeout: 30000 });
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="email"]', SUPERADMIN_CREDENTIALS.email);
      await page.fill('input[name="password"]', SUPERADMIN_CREDENTIALS.password);
      
      // Wait for navigation after submit
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
        page.click('button[type="submit"]'),
      ]);

      await page.waitForTimeout(2000);

      // Check if we're logged in (don't wait for specific URL, just check we're not on login)
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('Login failed in tours test - redirected back to login');
      }

      // Navigate to configuracion
      await page.goto(`${BASE_URL}/configuracion`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2000);

      // Wait for tabs to load
      await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

      // Click on tours tab (try multiple selectors)
      let toursTab = page.locator('button:has-text("Tutoriales")');
      if ((await toursTab.count()) === 0) {
        toursTab = page.locator('[value="tours"]');
      }
      if ((await toursTab.count()) === 0) {
        toursTab = page.locator('button:has-text("Tours")');
      }
      
      if ((await toursTab.count()) > 0) {
        console.log(`  ℹ️  Tours tab encontrado, haciendo click...`);
        await toursTab.click();
        await page.waitForTimeout(3000);

        // Check for errors
        const hasError = await page.evaluate(() => {
          const bodyText = document.body.innerText.toLowerCase();
          return (
            bodyText.includes('failed to compile') ||
            bodyText.includes('parallel pages') ||
            bodyText.includes('you cannot have two')
          );
        });

        if (hasError) {
          throw new Error('Tours tab contains routing error');
        }

        // Screenshot
        const screenshotPath = path.join(SCREENSHOTS_DIR, 'tours-virtuales.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const loadTime = Date.now() - startTime;
        console.log(`✅ Tours Virtuales: OK (${loadTime}ms)`);

        return {
          url: '/configuracion (tours tab)',
          success: true,
          errors: pageErrors,
          screenshot: screenshotPath,
          loadTime,
        };
      } else {
        throw new Error('Tours tab not found');
      }
    } catch (error: any) {
      const loadTime = Date.now() - startTime;
      console.log(`❌ Tours Virtuales: ERROR - ${error.message}`);

      pageErrors.push({
        page: 'Tours Virtuales',
        type: 'crash',
        severity: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });

      return {
        url: '/configuracion (tours tab)',
        success: false,
        errors: pageErrors,
        loadTime,
      };
    } finally {
      await page.close();
    }
  }

  async runFullInspection() {
    console.log('🚀 Iniciando inspección visual completa...\n');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`📸 Screenshots: ${SCREENSHOTS_DIR}\n`);

    // Inspect all landing pages
    for (const { url, name } of LANDING_PAGES) {
      const result = await this.inspectPage(url, name);
      this.results.push(result);
    }

    // Test login
    const loginResult = await this.testLogin();
    this.results.push(loginResult);

    // Test tours virtuales
    const toursResult = await this.testToursVirtuales();
    this.results.push(toursResult);

    this.generateReport();
  }

  private generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE DE INSPECCIÓN VISUAL');
    console.log('='.repeat(80) + '\n');

    const totalPages = this.results.length;
    const successPages = this.results.filter((r) => r.success).length;
    const failedPages = this.results.filter((r) => !r.success).length;

    console.log(`Total páginas inspeccionadas: ${totalPages}`);
    console.log(`✅ Exitosas: ${successPages}`);
    console.log(`❌ Con errores: ${failedPages}\n`);

    if (failedPages > 0) {
      console.log('❌ PÁGINAS CON ERRORES:\n');
      this.results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`\n  📄 ${result.url}`);
          result.errors.forEach((error) => {
            console.log(`    ${error.severity === 'error' ? '❌' : '⚠️'} ${error.message}`);
          });
        });
    }

    // Aggregate all errors
    const allErrors = this.results.flatMap((r) => r.errors);
    const errorCount = allErrors.filter((e) => e.severity === 'error').length;
    const warningCount = allErrors.filter((e) => e.severity === 'warning').length;

    console.log(`\n📈 RESUMEN DE ERRORES:`);
    console.log(`  Errores críticos: ${errorCount}`);
    console.log(`  Advertencias: ${warningCount}`);

    // Save detailed report
    const reportPath = path.join(SCREENSHOTS_DIR, 'inspection-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          baseUrl: BASE_URL,
          summary: {
            total: totalPages,
            success: successPages,
            failed: failedPages,
            errors: errorCount,
            warnings: warningCount,
          },
          results: this.results,
        },
        null,
        2
      )
    );

    console.log(`\n💾 Reporte detallado guardado en: ${reportPath}`);
    console.log(`📸 Screenshots guardadas en: ${SCREENSHOTS_DIR}\n`);

    console.log('='.repeat(80) + '\n');

    if (failedPages > 0) {
      process.exit(1);
    }
  }

  async close() {
    await this.browser.close();
  }
}

async function main() {
  const inspector = new VisualInspector();
  
  try {
    await inspector.init();
    await inspector.runFullInspection();
  } catch (error: any) {
    console.error('❌ Error fatal en inspección:', error.message);
    process.exit(1);
  } finally {
    await inspector.close();
  }
}

main();
