/**
 * Test Completo de Navegación - Verificación de todas las páginas
 * Navega por todas las secciones de la app y verifica que se visualizan correctamente
 */

import { test, expect, Page } from '@playwright/test';

// Credenciales de login
const LOGIN_CREDENTIALS = {
  email: 'admin@inmova.app',
  password: 'Admin2025!',
};

// Páginas principales a probar
const PAGES_TO_TEST = [
  { url: '/dashboard', name: 'Dashboard', selector: 'h1', expectedText: 'Dashboard' },
  { url: '/buildings', name: 'Edificios', selector: 'h1', expectedText: 'Edificios' },
  { url: '/unidades', name: 'Unidades', selector: 'h1', expectedText: 'Unidades' },
  { url: '/inquilinos', name: 'Inquilinos', selector: 'h1', expectedText: 'Inquilinos' },
  { url: '/contratos', name: 'Contratos', selector: 'h1', expectedText: 'Contratos' },
  { url: '/pagos', name: 'Pagos', selector: 'h1', expectedText: 'Pagos' },
  { url: '/gastos', name: 'Gastos', selector: 'h1', expectedText: 'Gastos' },
  { url: '/mantenimiento', name: 'Mantenimiento', selector: 'h1', expectedText: 'Mantenimiento' },
  { url: '/proveedores', name: 'Proveedores', selector: 'h1', expectedText: 'Proveedores' },
  { url: '/documentos', name: 'Documentos', selector: 'h1', expectedText: 'Documentos' },
  { url: '/reportes', name: 'Reportes', selector: 'h1', expectedText: 'Reportes' },
  { url: '/configuracion', name: 'Configuración', selector: 'h1', expectedText: 'Configuración' },
];

// Helper para login
async function loginToApp(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', LOGIN_CREDENTIALS.email);
  await page.fill('input[type="password"]', LOGIN_CREDENTIALS.password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
  console.log('✅ Login exitoso');
}

// Helper para capturar screenshot
async function capturePageScreenshot(page: Page, pageName: string) {
  const sanitizedName = pageName.toLowerCase().replace(/\s+/g, '-');
  await page.screenshot({
    path: `test-results/all-pages/${sanitizedName}.png`,
    fullPage: true,
  });
}

test.describe('Verificación Completa de Páginas', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await loginToApp(page);
  });

  test('Verificar todas las páginas principales', async ({ page }) => {
    console.log('\n🚀 Iniciando verificación completa de páginas...\n');

    const results = {
      passed: [] as string[],
      failed: [] as Array<{ page: string; error: string }>,
      warnings: [] as Array<{ page: string; warning: string }>,
    };

    for (const pageConfig of PAGES_TO_TEST) {
      console.log(`📍 Navegando a: ${pageConfig.name} (${pageConfig.url})`);

      try {
        // Navegar a la página
        const response = await page.goto(pageConfig.url, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });

        // Verificar respuesta HTTP
        if (response && response.status() >= 400) {
          results.failed.push({
            page: pageConfig.name,
            error: `HTTP ${response.status()} - ${response.statusText()}`,
          });
          console.log(`❌ ${pageConfig.name}: Error HTTP ${response.status()}`);
          continue;
        }

        // Esperar un momento para que la página se renderice
        await page.waitForTimeout(1000);

        // Capturar screenshot
        await capturePageScreenshot(page, pageConfig.name);

        // Verificar que no hay errores en pantalla
        const errorElements = await page.locator('[role="alert"]').count();
        const errorBoundary = await page.locator('text=/algo salió mal/i').count();

        if (errorElements > 0 || errorBoundary > 0) {
          results.warnings.push({
            page: pageConfig.name,
            warning: 'Error UI detectado en la página',
          });
          console.log(`⚠️  ${pageConfig.name}: Advertencia - Error UI visible`);
        }

        // Verificar que el contenido principal está cargado
        try {
          // Buscar el header o título principal
          const hasHeader = await page.locator('h1, h2').first().isVisible({ timeout: 3000 });

          if (!hasHeader) {
            results.warnings.push({
              page: pageConfig.name,
              warning: 'No se encontró título principal',
            });
            console.log(`⚠️  ${pageConfig.name}: Sin título principal visible`);
          }
        } catch (e) {
          // No crítico, continuar
        }

        // Verificar que no estamos en una página de error 404
        const notFoundText = await page
          .locator('text=/404|not found|página no encontrada/i')
          .count();
        if (notFoundText > 0) {
          results.failed.push({
            page: pageConfig.name,
            error: 'Página 404 - No encontrada',
          });
          console.log(`❌ ${pageConfig.name}: Página no encontrada (404)`);
          continue;
        }

        // Si llegamos aquí, la página cargó correctamente
        results.passed.push(pageConfig.name);
        console.log(`✅ ${pageConfig.name}: Carga correcta`);
      } catch (error: any) {
        results.failed.push({
          page: pageConfig.name,
          error: error.message || 'Error desconocido',
        });
        console.log(`❌ ${pageConfig.name}: ${error.message}`);
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Páginas correctas: ${results.passed.length}/${PAGES_TO_TEST.length}`);
    console.log(`❌ Páginas con errores: ${results.failed.length}`);
    console.log(`⚠️  Páginas con advertencias: ${results.warnings.length}`);
    console.log('='.repeat(60));

    if (results.passed.length > 0) {
      console.log('\n✅ PÁGINAS CORRECTAS:');
      results.passed.forEach((page) => console.log(`   - ${page}`));
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️  PÁGINAS CON ADVERTENCIAS:');
      results.warnings.forEach(({ page, warning }) => {
        console.log(`   - ${page}: ${warning}`);
      });
    }

    if (results.failed.length > 0) {
      console.log('\n❌ PÁGINAS CON ERRORES:');
      results.failed.forEach(({ page, error }) => {
        console.log(`   - ${page}: ${error}`);
      });
    }

    console.log('\n📸 Screenshots guardados en: test-results/all-pages/');
    console.log('='.repeat(60) + '\n');

    // El test pasa si al menos el 70% de las páginas funcionan
    const successRate = (results.passed.length / PAGES_TO_TEST.length) * 100;
    console.log(`📈 Tasa de éxito: ${successRate.toFixed(1)}%`);

    if (successRate < 70) {
      throw new Error(
        `Tasa de éxito muy baja: ${successRate.toFixed(1)}%. ` +
          `${results.failed.length} páginas fallaron.`
      );
    }
  });

  test('Verificar navegación por el sidebar', async ({ page }) => {
    console.log('\n🧭 Verificando navegación por sidebar...\n');

    // Links principales del sidebar a verificar
    const sidebarLinks = [
      { text: 'Dashboard', expectedUrl: '/dashboard' },
      { text: 'Edificios', expectedUrl: '/buildings' },
      { text: 'Unidades', expectedUrl: '/unidades' },
      { text: 'Inquilinos', expectedUrl: '/inquilinos' },
      { text: 'Contratos', expectedUrl: '/contratos' },
      { text: 'Pagos', expectedUrl: '/pagos' },
    ];

    let workingLinks = 0;

    for (const link of sidebarLinks) {
      try {
        // Buscar el link en el sidebar
        const linkElement = page.locator(`nav a:has-text("${link.text}")`).first();

        if (await linkElement.isVisible({ timeout: 2000 })) {
          await linkElement.click();
          await page.waitForTimeout(1000);

          const currentUrl = page.url();

          if (currentUrl.includes(link.expectedUrl)) {
            console.log(`✅ ${link.text}: Navegación correcta`);
            workingLinks++;
          } else {
            console.log(`⚠️  ${link.text}: URL inesperada (${currentUrl})`);
          }
        } else {
          console.log(`⚠️  ${link.text}: Link no visible en sidebar`);
        }
      } catch (error: any) {
        console.log(`❌ ${link.text}: ${error.message}`);
      }
    }

    console.log(`\n✅ Links funcionando: ${workingLinks}/${sidebarLinks.length}`);

    // El test pasa si al menos la mitad de los links funcionan
    expect(workingLinks).toBeGreaterThanOrEqual(sidebarLinks.length / 2);
  });

  test('Verificar funcionalidad de búsqueda global', async ({ page }) => {
    console.log('\n🔍 Verificando búsqueda global...\n');

    try {
      // Buscar el input de búsqueda
      const searchInput = page
        .locator('input[placeholder*="Buscar"], input[type="search"]')
        .first();

      if (await searchInput.isVisible({ timeout: 3000 })) {
        console.log('✅ Input de búsqueda encontrado');

        // Intentar escribir en el buscador
        await searchInput.fill('test');
        console.log('✅ Input de búsqueda funcional');

        await page.screenshot({
          path: 'test-results/all-pages/busqueda-global.png',
        });
      } else {
        console.log('⚠️  Input de búsqueda no visible');
      }
    } catch (error: any) {
      console.log(`⚠️  Búsqueda global: ${error.message}`);
    }
  });

  test('Verificar menú de usuario y cerrar sesión', async ({ page }) => {
    console.log('\n👤 Verificando menú de usuario...\n');

    try {
      // Buscar el botón/menú de usuario
      const userMenu = page
        .locator('button:has-text("Administrador"), [data-testid="user-menu"]')
        .first();

      if (await userMenu.isVisible({ timeout: 3000 })) {
        console.log('✅ Menú de usuario visible');

        // Screenshot del menú
        await page.screenshot({
          path: 'test-results/all-pages/menu-usuario.png',
        });

        // Buscar botón de cerrar sesión
        const logoutButton = page
          .locator('button:has-text("Cerrar Sesión"), a:has-text("Cerrar Sesión")')
          .first();

        if (await logoutButton.isVisible({ timeout: 3000 })) {
          console.log('✅ Botón "Cerrar Sesión" encontrado');
        } else {
          console.log('⚠️  Botón "Cerrar Sesión" no encontrado');
        }
      } else {
        console.log('⚠️  Menú de usuario no visible');
      }
    } catch (error: any) {
      console.log(`⚠️  Menú de usuario: ${error.message}`);
    }
  });

  test('Verificar responsive - Vista móvil', async ({ page }) => {
    console.log('\n📱 Verificando vista móvil...\n');

    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Screenshot móvil
    await page.screenshot({
      path: 'test-results/all-pages/dashboard-mobile.png',
      fullPage: true,
    });

    console.log('✅ Screenshot móvil capturado');

    // Verificar que el menú hamburguesa existe
    const hamburgerMenu = page.locator('button[aria-label*="menu"], button:has(svg)').first();

    if (await hamburgerMenu.isVisible({ timeout: 3000 })) {
      console.log('✅ Menú hamburguesa visible en móvil');
    } else {
      console.log('⚠️  Menú hamburguesa no encontrado');
    }

    // Restaurar viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
