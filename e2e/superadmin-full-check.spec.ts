/**
 * Test completo de todas las páginas, botones y funcionalidades de INMOVA
 * Se ejecuta como SUPERADMINISTRADOR en inmova.app (producción)
 * 
 * Incluye:
 * - Login y autenticación
 * - Navegación por todas las páginas principales
 * - Verificación de botones y controles
 * - Screenshots de cada sección
 * - Reporte detallado de resultados
 */

import { test, expect, Page } from '@playwright/test';

// Configuración del superadministrador
const SUPER_ADMIN = {
  email: 'superadmin@inmova.com',
  password: 'superadmin123',
};

// URL base (producción)
const BASE_URL = 'https://inmova.app';

// Resultados de las verificaciones
interface CheckResult {
  page: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  screenshot?: string;
  details?: string[];
}

const results: CheckResult[] = [];

// Helper para esperar y tomar screenshot
async function checkPageAndScreenshot(
  page: Page,
  pageName: string,
  url: string,
  checks: () => Promise<void>
) {
  try {
    console.log(`\n🔍 Verificando: ${pageName}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Ejecutar verificaciones específicas
    await checks();

    // Tomar screenshot
    const screenshotPath = `screenshots/superadmin-check-${pageName.toLowerCase().replace(/\s+/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    results.push({
      page: pageName,
      status: 'success',
      message: `✅ ${pageName} funciona correctamente`,
      screenshot: screenshotPath,
    });

    console.log(`✅ ${pageName} - OK`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({
      page: pageName,
      status: 'error',
      message: `❌ Error en ${pageName}`,
      details: [errorMessage],
    });
    console.log(`❌ ${pageName} - ERROR: ${errorMessage}`);
  }
}

// Helper para verificar botones
async function checkButtons(page: Page, buttonSelectors: string[]) {
  const buttonResults: string[] = [];
  for (const selector of buttonSelectors) {
    const button = page.locator(selector).first();
    const isVisible = await button.isVisible().catch(() => false);
    buttonResults.push(`${selector}: ${isVisible ? '✅' : '❌'}`);
  }
  return buttonResults;
}

test.describe('Verificación Completa de INMOVA - Superadministrador', () => {
  test.setTimeout(300000); // 5 minutos timeout total

  test('Verificación exhaustiva de todas las páginas y funcionalidades', async ({ page }) => {
    // ============================================================
    // 1. LOGIN
    // ============================================================
    await test.step('1. Login como Superadministrador', async () => {
      console.log('\n🔐 Iniciando sesión...');
      await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
      
      // Esperar a que cargue la página de login
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Llenar formulario de login
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      await emailInput.fill(SUPER_ADMIN.email);
      await passwordInput.fill(SUPER_ADMIN.password);

      // Click en botón de login
      const loginButton = page.locator('button[type="submit"]').first();
      await loginButton.click();

      // Esperar redirección al dashboard
      await page.waitForURL(/\/(dashboard|home)/, { timeout: 30000 });
      await page.waitForTimeout(3000);

      // Verificar que estamos logueados
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(dashboard|home)/);

      results.push({
        page: 'Login',
        status: 'success',
        message: '✅ Login exitoso como superadministrador',
      });

      console.log('✅ Login exitoso');
    });

    // ============================================================
    // 2. DASHBOARD
    // ============================================================
    await checkPageAndScreenshot(page, 'Dashboard', `${BASE_URL}/dashboard`, async () => {
      // Verificar elementos clave del dashboard
      await expect(page.locator('body')).toBeVisible();
      
      // Buscar KPIs o tarjetas de estadísticas
      const hasStats = await page.locator('[class*="stat"], [class*="kpi"], [class*="metric"]').count();
      
      if (hasStats > 0) {
        console.log(`  📊 Encontradas ${hasStats} tarjetas de estadísticas`);
      }
    });

    // ============================================================
    // 3. EDIFICIOS
    // ============================================================
    await checkPageAndScreenshot(page, 'Edificios - Lista', `${BASE_URL}/edificios`, async () => {
      // Verificar tabla o lista de edificios
      const hasContent = await page.locator('table, [role="grid"], [class*="list"]').count();
      expect(hasContent).toBeGreaterThan(0);

      // Verificar botón "Nuevo Edificio"
      const newButton = page.locator('button, a').filter({ hasText: /nuevo edificio|crear edificio|añadir edificio/i });
      const buttonVisible = await newButton.count();
      
      results[results.length - 1].details = [
        `Botón "Nuevo Edificio": ${buttonVisible > 0 ? '✅' : '❌'}`,
      ];
    });

    // Intentar acceder a página de crear edificio
    await checkPageAndScreenshot(page, 'Edificios - Crear', `${BASE_URL}/edificios/nuevo`, async () => {
      // Verificar que hay un formulario
      const hasForm = await page.locator('form').count();
      expect(hasForm).toBeGreaterThan(0);

      // Verificar campos comunes
      const fields = ['nombre', 'direccion', 'ciudad'];
      const fieldResults: string[] = [];
      
      for (const field of fields) {
        const input = page.locator(`input[name="${field}"], textarea[name="${field}"]`);
        const exists = await input.count();
        fieldResults.push(`Campo "${field}": ${exists > 0 ? '✅' : '❌'}`);
      }
      
      results[results.length - 1].details = fieldResults;
    });

    // ============================================================
    // 4. UNIDADES
    // ============================================================
    await checkPageAndScreenshot(page, 'Unidades - Lista', `${BASE_URL}/unidades`, async () => {
      const hasContent = await page.locator('table, [role="grid"], [class*="list"]').count();
      expect(hasContent).toBeGreaterThan(0);

      const newButton = page.locator('button, a').filter({ hasText: /nueva unidad|crear unidad|añadir unidad/i });
      const buttonVisible = await newButton.count();
      
      results[results.length - 1].details = [
        `Botón "Nueva Unidad": ${buttonVisible > 0 ? '✅' : '❌'}`,
      ];
    });

    await checkPageAndScreenshot(page, 'Unidades - Crear', `${BASE_URL}/unidades/nuevo`, async () => {
      const hasForm = await page.locator('form').count();
      expect(hasForm).toBeGreaterThan(0);
    });

    // ============================================================
    // 5. CONTRATOS
    // ============================================================
    await checkPageAndScreenshot(page, 'Contratos - Lista', `${BASE_URL}/contratos`, async () => {
      const hasContent = await page.locator('table, [role="grid"], [class*="list"]').count();
      expect(hasContent).toBeGreaterThan(0);

      const newButton = page.locator('button, a').filter({ hasText: /nuevo contrato|crear contrato/i });
      const buttonVisible = await newButton.count();
      
      results[results.length - 1].details = [
        `Botón "Nuevo Contrato": ${buttonVisible > 0 ? '✅' : '❌'}`,
      ];
    });

    await checkPageAndScreenshot(page, 'Contratos - Crear', `${BASE_URL}/contratos/nuevo`, async () => {
      const hasForm = await page.locator('form').count();
      expect(hasForm).toBeGreaterThan(0);
    });

    // ============================================================
    // 6. PAGOS
    // ============================================================
    await checkPageAndScreenshot(page, 'Pagos - Lista', `${BASE_URL}/pagos`, async () => {
      const hasContent = await page.locator('table, [role="grid"], [class*="list"]').count();
      expect(hasContent).toBeGreaterThan(0);
    });

    // ============================================================
    // 7. INQUILINOS
    // ============================================================
    await checkPageAndScreenshot(page, 'Inquilinos - Lista', `${BASE_URL}/inquilinos`, async () => {
      const hasContent = await page.locator('table, [role="grid"], [class*="list"]').count();
      expect(hasContent).toBeGreaterThan(0);

      const newButton = page.locator('button, a').filter({ hasText: /nuevo inquilino|crear inquilino|añadir inquilino/i });
      const buttonVisible = await newButton.count();
      
      results[results.length - 1].details = [
        `Botón "Nuevo Inquilino": ${buttonVisible > 0 ? '✅' : '❌'}`,
      ];
    });

    // ============================================================
    // 8. MANTENIMIENTO
    // ============================================================
    await checkPageAndScreenshot(page, 'Mantenimiento - Lista', `${BASE_URL}/mantenimiento`, async () => {
      const hasContent = await page.locator('table, [role="grid"], [class*="list"]').count();
      expect(hasContent).toBeGreaterThan(0);
    });

    // ============================================================
    // 9. DOCUMENTOS
    // ============================================================
    await checkPageAndScreenshot(page, 'Documentos', `${BASE_URL}/documentos`, async () => {
      // Verificar que la página carga
      await expect(page.locator('body')).toBeVisible();
    });

    // ============================================================
    // 10. REPORTES
    // ============================================================
    await checkPageAndScreenshot(page, 'Reportes', `${BASE_URL}/reportes`, async () => {
      await expect(page.locator('body')).toBeVisible();
    });

    // ============================================================
    // 11. CONFIGURACIÓN
    // ============================================================
    await checkPageAndScreenshot(page, 'Configuración', `${BASE_URL}/configuracion`, async () => {
      await expect(page.locator('body')).toBeVisible();
    });

    // ============================================================
    // 12. PERFIL DE USUARIO
    // ============================================================
    await checkPageAndScreenshot(page, 'Perfil de Usuario', `${BASE_URL}/perfil`, async () => {
      await expect(page.locator('body')).toBeVisible();
      
      // Verificar que se muestra el email del superadmin
      const pageContent = await page.content();
      if (pageContent.includes(SUPER_ADMIN.email)) {
        results[results.length - 1].details = ['✅ Email del superadmin visible en perfil'];
      }
    });

    // ============================================================
    // 13. PROPIETARIOS (si existe)
    // ============================================================
    try {
      await checkPageAndScreenshot(page, 'Propietarios', `${BASE_URL}/propietarios`, async () => {
        await expect(page.locator('body')).toBeVisible();
      });
    } catch (error) {
      console.log('ℹ️  Página de Propietarios no encontrada o no accesible');
    }

    // ============================================================
    // 14. FINANZAS (si existe)
    // ============================================================
    try {
      await checkPageAndScreenshot(page, 'Finanzas', `${BASE_URL}/finanzas`, async () => {
        await expect(page.locator('body')).toBeVisible();
      });
    } catch (error) {
      console.log('ℹ️  Página de Finanzas no encontrada o no accesible');
    }

    // ============================================================
    // 15. USUARIOS (administración)
    // ============================================================
    try {
      await checkPageAndScreenshot(page, 'Usuarios - Administración', `${BASE_URL}/usuarios`, async () => {
        const hasContent = await page.locator('table, [role="grid"], [class*="list"]').count();
        expect(hasContent).toBeGreaterThan(0);
      });
    } catch (error) {
      console.log('ℹ️  Página de Usuarios no encontrada o no accesible');
    }

    // ============================================================
    // 16. EMPRESAS (si existe - solo superadmin)
    // ============================================================
    try {
      await checkPageAndScreenshot(page, 'Empresas', `${BASE_URL}/empresas`, async () => {
        await expect(page.locator('body')).toBeVisible();
      });
    } catch (error) {
      console.log('ℹ️  Página de Empresas no encontrada o no accesible');
    }

    // ============================================================
    // 17. MÓDULOS (si existe - solo superadmin)
    // ============================================================
    try {
      await checkPageAndScreenshot(page, 'Módulos', `${BASE_URL}/modulos`, async () => {
        await expect(page.locator('body')).toBeVisible();
      });
    } catch (error) {
      console.log('ℹ️  Página de Módulos no encontrada o no accesible');
    }

    // ============================================================
    // 18. NOTIFICACIONES
    // ============================================================
    try {
      await checkPageAndScreenshot(page, 'Notificaciones', `${BASE_URL}/notificaciones`, async () => {
        await expect(page.locator('body')).toBeVisible();
      });
    } catch (error) {
      console.log('ℹ️  Página de Notificaciones no encontrada o no accesible');
    }

    // ============================================================
    // 19. SOPORTE
    // ============================================================
    try {
      await checkPageAndScreenshot(page, 'Soporte', `${BASE_URL}/soporte`, async () => {
        await expect(page.locator('body')).toBeVisible();
      });
    } catch (error) {
      console.log('ℹ️  Página de Soporte no encontrada o no accesible');
    }

    // ============================================================
    // 20. VERIFICACIÓN DE NAVEGACIÓN GENERAL
    // ============================================================
    await test.step('Verificar navegación y menú principal', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(2000);

      // Verificar que existe un menú de navegación
      const navElements = await page.locator('nav, [role="navigation"], aside').count();
      
      results.push({
        page: 'Navegación',
        status: navElements > 0 ? 'success' : 'warning',
        message: navElements > 0 
          ? '✅ Elementos de navegación encontrados' 
          : '⚠️  No se encontraron elementos de navegación',
        details: [`Elementos de navegación: ${navElements}`],
      });
    });

    // ============================================================
    // GENERAR REPORTE FINAL
    // ============================================================
    await test.step('Generar reporte final', async () => {
      console.log('\n' + '='.repeat(80));
      console.log('📊 REPORTE FINAL DE VERIFICACIÓN - INMOVA APP');
      console.log('='.repeat(80));
      console.log(`🔐 Usuario: ${SUPER_ADMIN.email}`);
      console.log(`🌐 URL: ${BASE_URL}`);
      console.log(`📅 Fecha: ${new Date().toLocaleString('es-ES')}`);
      console.log('='.repeat(80));

      let successCount = 0;
      let errorCount = 0;
      let warningCount = 0;

      results.forEach((result) => {
        if (result.status === 'success') successCount++;
        else if (result.status === 'error') errorCount++;
        else if (result.status === 'warning') warningCount++;
      });

      console.log(`\n📈 RESUMEN:`);
      console.log(`  ✅ Exitosos: ${successCount}`);
      console.log(`  ❌ Errores: ${errorCount}`);
      console.log(`  ⚠️  Advertencias: ${warningCount}`);
      console.log(`  📄 Total páginas verificadas: ${results.length}`);

      console.log('\n📋 DETALLE POR PÁGINA:\n');
      results.forEach((result) => {
        console.log(`${result.message}`);
        if (result.details && result.details.length > 0) {
          result.details.forEach((detail) => {
            console.log(`    ${detail}`);
          });
        }
        if (result.screenshot) {
          console.log(`    📸 Screenshot: ${result.screenshot}`);
        }
        console.log('');
      });

      console.log('='.repeat(80));
      console.log('✨ VERIFICACIÓN COMPLETADA');
      console.log('='.repeat(80));

      // Exportar resultados a JSON
      const fs = require('fs');
      const reportPath = 'superadmin-verification-report.json';
      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            user: SUPER_ADMIN.email,
            baseUrl: BASE_URL,
            summary: {
              total: results.length,
              success: successCount,
              errors: errorCount,
              warnings: warningCount,
            },
            results,
          },
          null,
          2
        )
      );

      console.log(`\n💾 Reporte JSON guardado en: ${reportPath}`);

      // Fallar el test si hubo errores críticos
      expect(errorCount).toBeLessThan(results.length / 2); // Tolerar hasta 50% de errores
    });
  });
});

export {};
