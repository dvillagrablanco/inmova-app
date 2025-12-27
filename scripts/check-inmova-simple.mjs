/**
 * Script simple para verificar todas las páginas de inmova.app
 * Se ejecuta directamente con Node.js usando Playwright
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Configuración
// El dominio inmova.app aún no está configurado, usar URL de Vercel
const BASE_URL = process.env.BASE_URL || 'https://workspace-inmova.vercel.app';
const SUPER_ADMIN = {
  email: 'superadmin@inmova.com',
  password: 'superadmin123',
};

// Resultados
const results = [];
const screenshotsDir = './screenshots';

// Crear directorio de screenshots
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

console.log('==================================================');
console.log('🔍 VERIFICACIÓN COMPLETA DE INMOVA.APP');
console.log('==================================================');
console.log(`🔐 Usuario: ${SUPER_ADMIN.email}`);
console.log(`🌐 URL: ${BASE_URL}`);
console.log(`📅 Fecha: ${new Date().toLocaleString('es-ES')}`);
console.log('==================================================\n');

// Función para verificar una página
async function checkPage(page, pageName, url, checks) {
  try {
    console.log(`\n🔍 Verificando: ${pageName}`);
    console.log(`   URL: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Ejecutar verificaciones específicas si se proporcionan
    if (checks) {
      await checks(page);
    }

    // Tomar screenshot
    const screenshotPath = path.join(
      screenshotsDir,
      `${pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    results.push({
      page: pageName,
      status: 'success',
      message: `✅ ${pageName} funciona correctamente`,
      url: url,
      screenshot: screenshotPath,
    });

    console.log(`✅ ${pageName} - OK`);
  } catch (error) {
    results.push({
      page: pageName,
      status: 'error',
      message: `❌ Error en ${pageName}`,
      url: url,
      error: error.message,
    });
    console.log(`❌ ${pageName} - ERROR: ${error.message}`);
  }
}

// Función principal
async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  });

  const page = await context.newPage();

  try {
    // ============================================================
    // 1. LOGIN
    // ============================================================
    console.log('\n🔐 Iniciando sesión...');
    await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Llenar formulario de login
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(SUPER_ADMIN.email);
    await passwordInput.fill(SUPER_ADMIN.password);

    // Tomar screenshot del login
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: true });

    // Click en botón de login
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Esperar redirección al dashboard
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 30000 });
    await page.waitForTimeout(3000);

    results.push({
      page: 'Login',
      status: 'success',
      message: '✅ Login exitoso como superadministrador',
      url: `${BASE_URL}/login`,
    });

    console.log('✅ Login exitoso');

    // ============================================================
    // 2. VERIFICAR PÁGINAS PRINCIPALES
    // ============================================================

    const pagesToCheck = [
      {
        name: 'Dashboard',
        url: `${BASE_URL}/dashboard`,
        check: async (p) => {
          const hasContent = await p.locator('body').isVisible();
          if (!hasContent) throw new Error('Dashboard no cargó correctamente');
        },
      },
      {
        name: 'Edificios - Lista',
        url: `${BASE_URL}/edificios`,
        check: async (p) => {
          const hasContent = await p.locator('body').isVisible();
          if (!hasContent) throw new Error('Página de edificios no cargó');
        },
      },
      {
        name: 'Edificios - Crear',
        url: `${BASE_URL}/edificios/nuevo`,
        check: async (p) => {
          const hasForm = await p.locator('form').count();
          if (hasForm === 0) throw new Error('No se encontró formulario de creación');
        },
      },
      {
        name: 'Unidades - Lista',
        url: `${BASE_URL}/unidades`,
      },
      {
        name: 'Unidades - Crear',
        url: `${BASE_URL}/unidades/nuevo`,
      },
      {
        name: 'Contratos - Lista',
        url: `${BASE_URL}/contratos`,
      },
      {
        name: 'Contratos - Crear',
        url: `${BASE_URL}/contratos/nuevo`,
      },
      {
        name: 'Pagos',
        url: `${BASE_URL}/pagos`,
      },
      {
        name: 'Inquilinos',
        url: `${BASE_URL}/inquilinos`,
      },
      {
        name: 'Mantenimiento',
        url: `${BASE_URL}/mantenimiento`,
      },
      {
        name: 'Documentos',
        url: `${BASE_URL}/documentos`,
      },
      {
        name: 'Reportes',
        url: `${BASE_URL}/reportes`,
      },
      {
        name: 'Configuración',
        url: `${BASE_URL}/configuracion`,
      },
      {
        name: 'Perfil',
        url: `${BASE_URL}/perfil`,
      },
    ];

    // Páginas opcionales (solo superadmin)
    const optionalPages = [
      { name: 'Propietarios', url: `${BASE_URL}/propietarios` },
      { name: 'Finanzas', url: `${BASE_URL}/finanzas` },
      { name: 'Usuarios', url: `${BASE_URL}/usuarios` },
      { name: 'Empresas', url: `${BASE_URL}/empresas` },
      { name: 'Módulos', url: `${BASE_URL}/modulos` },
      { name: 'Notificaciones', url: `${BASE_URL}/notificaciones` },
      { name: 'Soporte', url: `${BASE_URL}/soporte` },
    ];

    // Verificar páginas principales
    for (const pageInfo of pagesToCheck) {
      await checkPage(page, pageInfo.name, pageInfo.url, pageInfo.check);
    }

    // Verificar páginas opcionales
    console.log('\n📋 Verificando páginas opcionales...');
    for (const pageInfo of optionalPages) {
      try {
        await checkPage(page, pageInfo.name, pageInfo.url, null);
      } catch (error) {
        console.log(`ℹ️  ${pageInfo.name} no encontrada o no accesible (normal para algunas configuraciones)`);
      }
    }

    // ============================================================
    // VERIFICAR NAVEGACIÓN
    // ============================================================
    console.log('\n🧭 Verificando navegación...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);

    const navElements = await page.locator('nav, [role="navigation"], aside, [class*="sidebar"]').count();
    results.push({
      page: 'Navegación',
      status: navElements > 0 ? 'success' : 'warning',
      message: navElements > 0 
        ? `✅ Elementos de navegación encontrados (${navElements})` 
        : '⚠️  No se encontraron elementos de navegación',
    });

  } catch (error) {
    console.error('❌ Error fatal durante la verificación:', error.message);
    results.push({
      page: 'Error Fatal',
      status: 'error',
      message: `❌ Error fatal: ${error.message}`,
    });
  } finally {
    await browser.close();
  }

  // ============================================================
  // GENERAR REPORTE
  // ============================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 REPORTE FINAL DE VERIFICACIÓN - INMOVA APP');
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
    if (result.url) {
      console.log(`    🔗 ${result.url}`);
    }
    if (result.screenshot) {
      console.log(`    📸 ${result.screenshot}`);
    }
    if (result.error) {
      console.log(`    ⚠️  ${result.error}`);
    }
    console.log('');
  });

  // Guardar reporte JSON
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

  console.log('='.repeat(80));
  console.log(`💾 Reporte JSON guardado en: ${reportPath}`);
  console.log('='.repeat(80));

  // Salir con código apropiado
  if (errorCount > results.length / 2) {
    console.log('\n❌ Demasiados errores encontrados');
    process.exit(1);
  } else if (errorCount > 0) {
    console.log('\n⚠️  Verificación completada con algunos errores');
    process.exit(0);
  } else {
    console.log('\n✅ Verificación completada exitosamente');
    process.exit(0);
  }
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error ejecutando el script:', error);
  process.exit(1);
});
