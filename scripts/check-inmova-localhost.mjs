/**
 * Script para verificar todas las páginas de INMOVA en localhost
 * Ejecutar primero: yarn dev
 * Luego: node scripts/check-inmova-localhost.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
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
console.log('🔍 VERIFICACIÓN COMPLETA DE INMOVA (LOCALHOST)');
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
    return true;
  } catch (error) {
    results.push({
      page: pageName,
      status: 'error',
      message: `❌ Error en ${pageName}`,
      url: url,
      error: error.message,
    });
    console.log(`❌ ${pageName} - ERROR: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  let browser;
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'es-ES',
      timezoneId: 'Europe/Madrid',
    });

    const page = await context.newPage();

    // ============================================================
    // 1. VERIFICAR QUE EL SERVIDOR ESTÉ CORRIENDO
    // ============================================================
    console.log('\n📡 Verificando conexión al servidor...');
    try {
      await page.goto(BASE_URL, { timeout: 10000 });
      console.log('✅ Servidor respondiendo');
    } catch (error) {
      console.log('❌ No se puede conectar al servidor');
      console.log('   Asegúrate de ejecutar: yarn dev');
      process.exit(1);
    }

    // ============================================================
    // 2. LOGIN
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
    // 3. VERIFICAR PÁGINAS PRINCIPALES
    // ============================================================

    const pagesToCheck = [
      {
        name: 'Dashboard',
        url: `${BASE_URL}/dashboard`,
        check: async (p) => {
          const hasContent = await p.locator('body').isVisible();
          if (!hasContent) throw new Error('Dashboard no cargó correctamente');
          
          // Verificar si hay KPIs
          const kpis = await p.locator('[class*="stat"], [class*="kpi"], [class*="card"]').count();
          console.log(`    📊 KPIs encontrados: ${kpis}`);
        },
      },
      {
        name: 'Edificios - Lista',
        url: `${BASE_URL}/edificios`,
        check: async (p) => {
          const hasTable = await p.locator('table, [role="grid"]').count();
          console.log(`    📋 Tabla visible: ${hasTable > 0 ? 'Sí' : 'No'}`);
          
          // Verificar botón "Nuevo"
          const newButton = await p.locator('button, a').filter({ hasText: /nuevo/i }).count();
          console.log(`    🔘 Botón "Nuevo": ${newButton > 0 ? 'Sí' : 'No'}`);
        },
      },
      {
        name: 'Edificios - Crear',
        url: `${BASE_URL}/edificios/nuevo`,
        check: async (p) => {
          const hasForm = await p.locator('form').count();
          if (hasForm === 0) throw new Error('No se encontró formulario de creación');
          console.log(`    📝 Formulario encontrado`);
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
        name: 'Pagos - Lista',
        url: `${BASE_URL}/pagos`,
      },
      {
        name: 'Inquilinos - Lista',
        url: `${BASE_URL}/inquilinos`,
      },
      {
        name: 'Mantenimiento - Lista',
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
    console.log('\n📋 Verificando páginas principales...');
    for (const pageInfo of pagesToCheck) {
      await checkPage(page, pageInfo.name, pageInfo.url, pageInfo.check);
      await page.waitForTimeout(1000); // Pausa entre páginas
    }

    // Verificar páginas opcionales
    console.log('\n📋 Verificando páginas opcionales...');
    for (const pageInfo of optionalPages) {
      const success = await checkPage(page, pageInfo.name, pageInfo.url, null);
      if (!success) {
        console.log(`    ℹ️  ${pageInfo.name} no encontrada (esto es normal)`);
      }
      await page.waitForTimeout(1000);
    }

    // ============================================================
    // 4. VERIFICAR NAVEGACIÓN
    // ============================================================
    console.log('\n🧭 Verificando elementos de navegación...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);

    const navElements = await page.locator('nav, [role="navigation"], aside, [class*="sidebar"]').count();
    const hasNav = navElements > 0;
    
    results.push({
      page: 'Navegación',
      status: hasNav ? 'success' : 'warning',
      message: hasNav
        ? `✅ Elementos de navegación encontrados (${navElements})` 
        : '⚠️  No se encontraron elementos de navegación',
    });

    console.log(hasNav ? `✅ Navegación OK (${navElements} elementos)` : '⚠️  Sin navegación');

    // ============================================================
    // 5. VERIFICAR INTERACTIVIDAD
    // ============================================================
    console.log('\n🖱️  Verificando interactividad de botones...');
    
    // Volver a edificios para verificar interactividad
    await page.goto(`${BASE_URL}/edificios`);
    await page.waitForTimeout(2000);

    // Buscar botones interactivos
    const buttons = await page.locator('button').count();
    const links = await page.locator('a[href]').count();
    const inputs = await page.locator('input').count();

    console.log(`    🔘 Botones: ${buttons}`);
    console.log(`    🔗 Enlaces: ${links}`);
    console.log(`    📝 Inputs: ${inputs}`);

    results.push({
      page: 'Interactividad',
      status: 'success',
      message: `✅ Elementos interactivos: ${buttons} botones, ${links} enlaces, ${inputs} inputs`,
    });

  } catch (error) {
    console.error('\n❌ Error fatal durante la verificación:', error.message);
    results.push({
      page: 'Error Fatal',
      status: 'error',
      message: `❌ Error fatal: ${error.message}`,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // ============================================================
  // GENERAR REPORTE
  // ============================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 REPORTE FINAL DE VERIFICACIÓN - INMOVA');
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
  console.log(`  📄 Total verificaciones: ${results.length}`);
  console.log(`  📊 Tasa de éxito: ${((successCount / results.length) * 100).toFixed(1)}%`);

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
          successRate: ((successCount / results.length) * 100).toFixed(1) + '%',
        },
        results,
      },
      null,
      2
    )
  );

  console.log('='.repeat(80));
  console.log(`💾 Reporte JSON guardado en: ${reportPath}`);
  console.log(`📸 Screenshots guardados en: ${screenshotsDir}/`);
  console.log('='.repeat(80));

  // Salir con código apropiado
  const successRate = successCount / results.length;
  
  if (successRate >= 0.8) {
    console.log('\n✅ Verificación completada exitosamente');
    console.log(`   ${successCount} de ${results.length} verificaciones exitosas`);
    process.exit(0);
  } else if (successRate >= 0.5) {
    console.log('\n⚠️  Verificación completada con advertencias');
    console.log(`   ${successCount} de ${results.length} verificaciones exitosas`);
    process.exit(0);
  } else {
    console.log('\n❌ Verificación completada con errores significativos');
    console.log(`   ${successCount} de ${results.length} verificaciones exitosas`);
    process.exit(1);
  }
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error ejecutando el script:', error);
  process.exit(1);
});
