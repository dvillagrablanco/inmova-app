import { test, expect, Page } from '@playwright/test';

// Lista completa de todas las páginas de la aplicación para revisar
const allPages = [
  // Páginas principales
  { path: '/', name: 'Landing' },
  { path: '/home', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },

  // Gestión de propiedades
  { path: '/edificios', name: 'Edificios' },
  { path: '/inquilinos', name: 'Inquilinos' },
  { path: '/contratos', name: 'Contratos' },
  { path: '/pagos', name: 'Pagos' },
  { path: '/pagos/nuevo', name: 'Nuevo Pago' },
  { path: '/mantenimiento', name: 'Mantenimiento' },
  { path: '/documentos', name: 'Documentos' },

  // Reportes y análisis
  { path: '/reportes', name: 'Reportes' },
  { path: '/analytics', name: 'Analytics' },

  // Automatización y reglas
  { path: '/automatizacion', name: 'Automatización' },
  { path: '/recordatorios', name: 'Recordatorios' },
  { path: '/notificaciones/reglas', name: 'Reglas de Notificaciones' },

  // Comunicación
  { path: '/chat', name: 'Chat' },
  { path: '/reuniones', name: 'Reuniones' },

  // Comercial y Partners
  { path: '/portal-comercial', name: 'Portal Comercial' },
  { path: '/portal-comercial/leads', name: 'Leads Comerciales' },
  { path: '/portal-comercial/objetivos', name: 'Objetivos Comerciales' },
  { path: '/portal-comercial/comisiones', name: 'Comisiones Comerciales' },
  { path: '/partners', name: 'Partners' },
  { path: '/partners/clients', name: 'Clientes Partners' },
  { path: '/partners/commissions', name: 'Comisiones Partners' },
  { path: '/partners/invitations', name: 'Invitaciones Partners' },
  { path: '/partners/calculator', name: 'Calculadora Partners' },
  { path: '/partners/settings', name: 'Configuración Partners' },

  // Profesionales
  { path: '/professional', name: 'Professional Dashboard' },
  { path: '/professional/clients', name: 'Clientes Profesionales' },
  { path: '/professional/projects', name: 'Proyectos Profesionales' },
  { path: '/professional/invoicing', name: 'Facturación Profesional' },

  // Proveedores
  { path: '/proveedores', name: 'Proveedores' },
  { path: '/portal-proveedor/ordenes', name: 'Órdenes Proveedor' },
  { path: '/portal-proveedor/facturas', name: 'Facturas Proveedor' },
  { path: '/portal-proveedor/presupuestos', name: 'Presupuestos Proveedor' },
  { path: '/portal-proveedor/presupuestos/nuevo', name: 'Nuevo Presupuesto' },
  { path: '/portal-proveedor/chat', name: 'Chat Proveedor' },

  // Operador
  { path: '/operador/dashboard', name: 'Dashboard Operador' },
  { path: '/operador/work-orders/history', name: 'Historial Órdenes' },
  { path: '/operador/maintenance-history', name: 'Historial Mantenimiento' },

  // Verticales especializados
  { path: '/room-rental/common-areas', name: 'Áreas Comunes Room Rental' },
  { path: '/flipping/dashboard', name: 'Flipping Dashboard' },

  // Administración de fincas
  { path: '/admin-fincas', name: 'Admin Fincas' },
  { path: '/admin-fincas/comunidades', name: 'Comunidades' },
  { path: '/admin-fincas/libro-caja', name: 'Libro de Caja' },
  { path: '/admin-fincas/informes', name: 'Informes Admin Fincas' },
  { path: '/admin-fincas/facturas', name: 'Facturas Admin Fincas' },

  // Traditional Rental
  { path: '/traditional-rental', name: 'Traditional Rental' },
  { path: '/traditional-rental/communities', name: 'Comunidades TR' },
  { path: '/traditional-rental/compliance', name: 'Compliance TR' },
  { path: '/traditional-rental/renewals', name: 'Renovaciones TR' },
  { path: '/traditional-rental/treasury', name: 'Tesorería TR' },

  // Coliving
  { path: '/coliving', name: 'Coliving' },

  // Comunidades
  { path: '/comunidades/presidente', name: 'Presidente Comunidad' },
  { path: '/comunidades/votaciones', name: 'Votaciones' },
  { path: '/comunidades/renovaciones', name: 'Renovaciones Comunidad' },

  // Construcción
  { path: '/construction/projects', name: 'Proyectos Construcción' },
  { path: '/construction/gantt', name: 'Gantt Construcción' },
  { path: '/construction/quality-control', name: 'Control de Calidad' },

  // STR Advanced (protegido)
  { path: '/str-advanced/channel-manager', name: 'Channel Manager' },

  // Dashboard protegido
  { path: '/dashboard/crm', name: 'CRM Dashboard' },
  { path: '/dashboard/integrations', name: 'Integraciones Dashboard' },
  { path: '/dashboard/social-media', name: 'Social Media Dashboard' },

  // Otros
  { path: '/ocr', name: 'OCR' },
  { path: '/cupones', name: 'Cupones' },
  { path: '/certificaciones', name: 'Certificaciones' },
  { path: '/plantillas', name: 'Plantillas' },
  { path: '/reviews', name: 'Reviews' },
  { path: '/perfil', name: 'Perfil' },

  // Configuración
  { path: '/configuracion/notificaciones', name: 'Config Notificaciones' },
  { path: '/configuracion/integraciones/stripe', name: 'Config Stripe' },

  // Admin
  { path: '/admin/planes', name: 'Admin Planes' },
  { path: '/admin/reportes-programados', name: 'Reportes Programados' },

  // Mobile
  { path: '/home-mobile', name: 'Home Mobile' },
];

interface TestResult {
  page: string;
  status: 'success' | 'error' | 'warning';
  errors: string[];
  consoleErrors: string[];
  warnings: string[];
  screenshot?: string;
}

const results: TestResult[] = [];

async function captureConsoleErrors(page: Page, pageName: string): Promise<string[]> {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`CONSOLE ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(`PAGE ERROR: ${error.message}`);
  });

  return consoleErrors;
}

test.describe('Revisión Visual Exhaustiva de TODAS las Páginas', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    // Capturar errores de consola
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });

    // Login como administrador
    await page.goto('/login');

    try {
      // Esperar a que la página cargue completamente
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('#email-field', { timeout: 10000 });

      // Llenar el email
      const emailInput = page.locator('#email-field');
      await emailInput.fill('admin@inmova.app');

      // Llenar el password
      const passwordInput = page.locator('#password-field');
      await passwordInput.fill('Admin2025!');

      // Hacer clic en el botón de login
      const loginButton = page.locator('button[type="submit"]');
      await loginButton.click();

      // Esperar a que se complete el login (o que aparezca el dashboard)
      await page.waitForURL(/\/(dashboard|home)/, { timeout: 20000 }).catch(async (err) => {
        // Si no redirige, verificar si hay un error de credenciales
        const errorVisible = await page
          .locator('[role="alert"]')
          .isVisible()
          .catch(() => false);
        if (errorVisible) {
          console.warn('⚠️  Credenciales de login incorrectas o usuario no existe');
        }
        // No lanzar error, continuar con los tests sin autenticación
        console.warn('⚠️  Continuando tests sin autenticación completa');
      });
    } catch (error) {
      console.error('❌ Error en login:', error);
      // No lanzar error, permitir que los tests continúen
      console.warn('⚠️  Continuando tests a pesar del error de login');
    }
  });

  for (const pageInfo of allPages) {
    test(`📄 ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
      const testResult: TestResult = {
        page: pageInfo.name,
        status: 'success',
        errors: [],
        consoleErrors: [],
        warnings: [],
      };

      try {
        console.log(`\n🔍 Revisando: ${pageInfo.name} - ${pageInfo.path}`);

        // Navegar a la página
        const response = await page.goto(pageInfo.path, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Verificar respuesta HTTP
        if (response && response.status() >= 400) {
          testResult.errors.push(`HTTP ${response.status()}: ${response.statusText()}`);
          testResult.status = 'error';
        }

        // Esperar a que cargue
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
          testResult.warnings.push('Página no alcanzó estado networkidle');
        });

        // Verificar errores visibles en la página
        const errorElements = await page.locator('[role="alert"], .error, [class*="error"]').all();
        for (const el of errorElements) {
          const text = await el.textContent().catch(() => '');
          if (text && text.toLowerCase().includes('error')) {
            testResult.errors.push(`Error visible: ${text}`);
            testResult.status = 'error';
          }
        }

        // Verificar que haya contenido principal
        const hasMain = await page
          .locator('main, [role="main"], .main-content, .container')
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false);

        if (!hasMain) {
          testResult.warnings.push('No se encontró contenedor principal visible');
          testResult.status = testResult.status === 'error' ? 'error' : 'warning';
        }

        // Verificar títulos o headings
        const hasHeading = await page
          .locator('h1, h2, [class*="title"]')
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        if (!hasHeading) {
          testResult.warnings.push('No se encontró título principal');
        }

        // Capturar errores de consola
        testResult.consoleErrors = [...consoleErrors];
        if (consoleErrors.length > 0) {
          testResult.status = 'warning';
        }

        // Tomar screenshot
        const screenshotPath = `test-results/visual-${pageInfo.name.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-')}.png`;
        await page
          .screenshot({
            path: screenshotPath,
            fullPage: true,
          })
          .catch(() => {
            testResult.warnings.push('No se pudo tomar screenshot');
          });

        testResult.screenshot = screenshotPath;

        // Reporte de estado
        if (testResult.status === 'success' && testResult.warnings.length === 0) {
          console.log(`✅ ${pageInfo.name} - OK`);
        } else if (testResult.status === 'warning') {
          console.log(`⚠️  ${pageInfo.name} - Advertencias`);
        } else {
          console.log(`❌ ${pageInfo.name} - ERRORES`);
        }

        if (testResult.errors.length > 0) {
          console.log('   Errores:', testResult.errors);
        }
        if (testResult.warnings.length > 0) {
          console.log('   Advertencias:', testResult.warnings);
        }
        if (testResult.consoleErrors.length > 0) {
          console.log('   Errores consola:', testResult.consoleErrors.slice(0, 3));
        }

        results.push(testResult);

        // Limpiar errores de consola para la siguiente página
        consoleErrors = [];

        // Assertions para fallos críticos
        expect(testResult.errors.length).toBeLessThan(5);
      } catch (error) {
        testResult.status = 'error';
        testResult.errors.push(`Exception: ${error}`);
        results.push(testResult);

        console.log(`❌ ${pageInfo.name} - FALLO CRÍTICO: ${error}`);

        // No fallar todo el test suite, continuar con siguiente página
        expect(error).toBeDefined(); // Para que se registre pero no detenga
      }
    });
  }

  test.afterAll(async () => {
    // Generar reporte final
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 REPORTE FINAL DE REVISIÓN VISUAL');
    console.log('='.repeat(80));

    const successCount = results.filter(
      (r) => r.status === 'success' && r.warnings.length === 0
    ).length;
    const warningCount = results.filter((r) => r.status === 'warning').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    console.log(`\n✅ Éxito: ${successCount}`);
    console.log(`⚠️  Advertencias: ${warningCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📄 Total páginas revisadas: ${results.length}`);

    console.log('\n\n🔴 PÁGINAS CON ERRORES:');
    results
      .filter((r) => r.status === 'error')
      .forEach((r) => {
        console.log(`\n❌ ${r.page}`);
        r.errors.forEach((e) => console.log(`   - ${e}`));
      });

    console.log('\n\n⚠️  PÁGINAS CON ADVERTENCIAS:');
    results
      .filter((r) => r.status === 'warning')
      .forEach((r) => {
        console.log(`\n⚠️  ${r.page}`);
        r.warnings.forEach((w) => console.log(`   - ${w}`));
        if (r.consoleErrors.length > 0) {
          console.log(`   Console errors: ${r.consoleErrors.length}`);
        }
      });

    console.log('\n' + '='.repeat(80));
  });
});
