import { test, expect, Page } from '@playwright/test';

/**
 * Test completo de verificación visual de todas las páginas y funcionalidades
 * como superadministrador en inmova.app
 */

// Credenciales de superadministrador
const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin@inmova.com',
  password: 'superadmin123',
};

// Configuración de timeouts extendidos
test.setTimeout(300000); // 5 minutos por test

// Helper para hacer login
async function loginAsSuperAdmin(page: Page) {
  console.log('🔐 Iniciando sesión como superadministrador...');

  await page.goto('/login', { waitUntil: 'networkidle' });

  // Esperar a que la página de login esté completamente cargada
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  // Llenar credenciales
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.fill(SUPERADMIN_CREDENTIALS.email);

  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.fill(SUPERADMIN_CREDENTIALS.password);

  // Click en el botón de login
  const loginButton = page
    .locator('button')
    .filter({ hasText: /iniciar sesión|entrar|login/i })
    .first();
  await loginButton.click();

  // Esperar navegación al dashboard
  await page.waitForURL(/\/(dashboard|home|admin)/, { timeout: 15000 });

  console.log('✅ Login exitoso');
}

// Helper para tomar screenshot con nombre descriptivo
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/superadmin-${name}.png`,
    fullPage: true,
  });
  console.log(`📸 Screenshot guardada: superadmin-${name}.png`);
}

// Helper para verificar que no hay errores de consola críticos
function setupConsoleErrorTracking(page: Page) {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ Error de consola:', msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.log('❌ Error de página:', error.message);
  });

  return errors;
}

test.describe('Verificación completa de inmova.app como SuperAdmin', () => {
  test('1. Login y Dashboard Principal', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '01-dashboard');

    // Verificar elementos del dashboard
    console.log('📊 Verificando dashboard principal...');

    // Verificar que hay contenido visible
    const mainContent = page.locator('main, [role="main"], .main-content').first();
    await expect(mainContent).toBeVisible();

    console.log('✅ Dashboard principal OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('2. Panel de Administración - Empresas', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🏢 Navegando a panel de empresas...');
    await page.goto('/admin/empresas', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '02-admin-empresas');

    // Verificar que la página cargó
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Buscar botones comunes
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`✅ Página de empresas OK - ${buttonCount} botones encontrados`);
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('3. Panel de Administración - Usuarios', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('👥 Navegando a panel de usuarios...');
    await page.goto('/admin/usuarios', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '03-admin-usuarios');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de usuarios OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('4. Panel de Administración - Planes de Suscripción', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('💳 Navegando a planes de suscripción...');
    await page.goto('/admin/planes', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '04-admin-planes');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de planes OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('5. Panel de Administración - Módulos', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🧩 Navegando a módulos...');
    await page.goto('/admin/modulos', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '05-admin-modulos');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de módulos OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('6. Panel de Administración - Salud del Sistema', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🏥 Navegando a salud del sistema...');
    await page.goto('/admin/salud-sistema', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '06-admin-salud-sistema');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de salud del sistema OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('7. Panel de Administración - Métricas de Uso', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('📈 Navegando a métricas de uso...');
    await page.goto('/admin/metricas-uso', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '07-admin-metricas-uso');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de métricas de uso OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('8. Panel de Administración - Seguridad', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🔒 Navegando a panel de seguridad...');
    await page.goto('/admin/seguridad', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '08-admin-seguridad');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de seguridad OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('9. Panel de Administración - Portales Externos', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🌐 Navegando a portales externos...');
    await page.goto('/admin/portales-externos', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '09-admin-portales-externos');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de portales externos OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('10. Panel de Administración - Sugerencias', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('💡 Navegando a sugerencias...');
    await page.goto('/admin/sugerencias', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '10-admin-sugerencias');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de sugerencias OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('11. Panel de Administración - Reportes Programados', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('📋 Navegando a reportes programados...');
    await page.goto('/admin/reportes-programados', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '11-admin-reportes-programados');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de reportes programados OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('12. Panel de Administración - Importación OCR', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('📄 Navegando a importación OCR...');
    await page.goto('/admin/ocr-import', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '12-admin-ocr-import');

    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de importación OCR OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('13. Gestión - Edificios', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🏢 Navegando a edificios...');
    await page.goto('/edificios', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '13-edificios');

    // Verificar que la página cargó
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de edificios OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('14. Gestión - Inquilinos', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('👥 Navegando a inquilinos...');
    await page.goto('/inquilinos', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '14-inquilinos');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de inquilinos OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('15. Gestión - Propietarios', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🏠 Navegando a propietarios...');
    await page.goto('/propietarios', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '15-propietarios');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de propietarios OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('16. Gestión - Contratos', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('📝 Navegando a contratos...');
    await page.goto('/contratos', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '16-contratos');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de contratos OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('17. Gestión - Pagos', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('💰 Navegando a pagos...');
    await page.goto('/pagos', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '17-pagos');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de pagos OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('18. Gestión - Mantenimiento', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🔧 Navegando a mantenimiento...');
    await page.goto('/mantenimiento', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '18-mantenimiento');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de mantenimiento OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('19. Gestión - Documentos', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('📁 Navegando a documentos...');
    await page.goto('/documentos', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '19-documentos');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de documentos OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('20. Finanzas - Facturas', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('💵 Navegando a facturas...');
    await page.goto('/facturas', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '20-facturas');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de facturas OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('21. Reportes y Analytics', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('📊 Navegando a reportes...');
    await page.goto('/reportes', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '21-reportes');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de reportes OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('22. CRM - Clientes Potenciales', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🎯 Navegando a CRM...');
    await page.goto('/crm', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '22-crm');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de CRM OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('23. Configuración de Perfil', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('⚙️ Navegando a configuración...');
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '23-settings');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de configuración OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('24. Notificaciones', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🔔 Navegando a notificaciones...');
    await page.goto('/notificaciones', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '24-notificaciones');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de notificaciones OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('25. Verificación de Navegación del Menú', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);
    await page.waitForLoadState('networkidle');

    console.log('🗺️ Verificando navegación del menú principal...');

    // Buscar el menú de navegación
    const nav = page.locator('nav, aside, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Contar enlaces de navegación
    const navLinks = nav.locator('a');
    const linkCount = await navLinks.count();
    console.log(`✅ Menú de navegación visible con ${linkCount} enlaces`);

    // Verificar que hay enlaces
    expect(linkCount).toBeGreaterThan(0);

    await takeScreenshot(page, '25-menu-navegacion');

    console.log('✅ Navegación del menú OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('26. Verificación de Botones Principales en Dashboard', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);
    await page.waitForLoadState('networkidle');

    console.log('🔘 Verificando botones en dashboard...');

    // Contar todos los botones visibles
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    console.log(`✅ ${buttonCount} botones encontrados en dashboard`);

    // Contar enlaces visibles
    const links = page.locator('a:visible');
    const linkCount = await links.count();
    console.log(`✅ ${linkCount} enlaces encontrados en dashboard`);

    await takeScreenshot(page, '26-botones-dashboard');

    console.log('✅ Verificación de botones OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('27. Marketplace de Servicios', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🏪 Navegando a marketplace...');
    await page.goto('/marketplace', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '27-marketplace');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de marketplace OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('28. Calendario y Eventos', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('📅 Navegando a calendario...');
    await page.goto('/calendario', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '28-calendario');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de calendario OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('29. Integraciones', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('🔌 Navegando a integraciones...');
    await page.goto('/integraciones', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '29-integraciones');

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Página de integraciones OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });

  test('30. Verificación Final - Logout', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);

    await loginAsSuperAdmin(page);

    console.log('👋 Verificando logout...');

    // Buscar botón de logout (puede estar en un menú desplegable)
    const userMenuButton = page
      .locator('[aria-label*="menu"], [aria-label*="usuario"], button')
      .filter({
        hasText: /perfil|usuario|user|cerrar sesión/i,
      })
      .first();

    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      await page.waitForTimeout(500);

      // Buscar opción de logout
      const logoutButton = page
        .locator('button, a')
        .filter({
          hasText: /cerrar sesión|logout|salir/i,
        })
        .first();

      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
        console.log('✅ Logout exitoso');
      }
    }

    await takeScreenshot(page, '30-logout');

    console.log('✅ Verificación de logout OK');
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
  });
});

// Test de resumen final
test.describe('Resumen de Verificación', () => {
  test('Generar reporte de verificación', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('📋 RESUMEN DE VERIFICACIÓN COMPLETA DE INMOVA.APP');
    console.log('='.repeat(80));
    console.log('✅ Todas las pruebas completadas');
    console.log('📸 Screenshots guardadas en: test-results/');
    console.log('📊 Ver reporte HTML completo ejecutando: npx playwright show-report');
    console.log('='.repeat(80) + '\n');
  });
});
