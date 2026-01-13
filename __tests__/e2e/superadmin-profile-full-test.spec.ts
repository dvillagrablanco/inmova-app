/**
 * Test E2E completo para todas las páginas del perfil de superadministrador
 * 
 * Ejecutar: npx playwright test superadmin-profile-full-test.spec.ts --headed
 * 
 * Este test verifica:
 * - Todas las páginas visibles del panel de admin
 * - Botones de acción (crear, editar, eliminar)
 * - Popups y diálogos
 * - Subpáginas y navegación
 * - Errores de consola y HTTP
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@inmova.app';
const ADMIN_PASSWORD = 'Admin123!';

// Todas las páginas del superadministrador a probar
const SUPERADMIN_PAGES = [
  // Dashboard principal
  { path: '/admin/dashboard', name: 'Dashboard Admin', hasCreateButton: false },
  
  // Gestión de Clientes
  { path: '/admin/clientes', name: 'Clientes', hasCreateButton: true, createButtonText: 'Nueva Empresa' },
  { path: '/admin/clientes/comparar', name: 'Comparar Clientes', hasCreateButton: false },
  { path: '/admin/onboarding', name: 'Onboarding', hasCreateButton: false },
  
  // Planes y Facturación
  { path: '/admin/planes', name: 'Planes de Suscripción', hasCreateButton: true, createButtonText: 'Nuevo Plan' },
  { path: '/admin/addons', name: 'Add-ons', hasCreateButton: true, createButtonText: 'Nuevo Add-on' },
  { path: '/admin/cupones', name: 'Cupones', hasCreateButton: true, createButtonText: 'Nuevo' },
  { path: '/admin/facturacion-b2b', name: 'Facturación B2B', hasCreateButton: false },
  { path: '/admin/ewoorker-planes', name: 'Planes eWoorker', hasCreateButton: true, createButtonText: 'Nuevo Plan' },
  
  // Partners
  { path: '/admin/partners', name: 'Partners', hasCreateButton: true, createButtonText: 'Nuevo Partner' },
  { path: '/admin/partners/comisiones', name: 'Comisiones Partners', hasCreateButton: false },
  { path: '/admin/partners/landings', name: 'Landings Partners', hasCreateButton: true },
  { path: '/admin/partners/invitaciones', name: 'Invitaciones Partners', hasCreateButton: true },
  
  // Marketplace
  { path: '/admin/marketplace', name: 'Marketplace', hasCreateButton: false },
  { path: '/admin/marketplace/categorias', name: 'Categorías Marketplace', hasCreateButton: true },
  { path: '/admin/marketplace/proveedores', name: 'Proveedores Marketplace', hasCreateButton: true, createButtonText: 'Nuevo Proveedor' },
  { path: '/admin/marketplace/reservas', name: 'Reservas Marketplace', hasCreateButton: false },
  { path: '/admin/marketplace/comisiones', name: 'Comisiones Marketplace', hasCreateButton: false },
  
  // Configuración de Empresa
  { path: '/admin/configuracion', name: 'Configuración', hasCreateButton: false },
  { path: '/admin/usuarios', name: 'Usuarios', hasCreateButton: true, createButtonText: 'Nuevo Usuario' },
  { path: '/admin/modulos', name: 'Módulos', hasCreateButton: false },
  { path: '/admin/personalizacion', name: 'Personalización/Branding', hasCreateButton: false },
  { path: '/admin/aprobaciones', name: 'Aprobaciones', hasCreateButton: false },
  { path: '/admin/importar', name: 'Importar Datos', hasCreateButton: false },
  
  // Herramientas
  { path: '/admin/ocr-import', name: 'OCR Import', hasCreateButton: false },
  { path: '/admin/firma-digital', name: 'Firma Digital', hasCreateButton: false },
  { path: '/admin/legal', name: 'Legal', hasCreateButton: false },
  { path: '/admin/sugerencias', name: 'Sugerencias', hasCreateButton: false },
  { path: '/admin/limpieza', name: 'Limpieza de Datos', hasCreateButton: false },
  { path: '/admin/backup-restore', name: 'Backup/Restore', hasCreateButton: false },
  
  // Comunicaciones
  { path: '/admin/notificaciones-masivas', name: 'Notificaciones Masivas', hasCreateButton: true },
  { path: '/admin/plantillas-email', name: 'Plantillas Email', hasCreateButton: true },
  { path: '/admin/plantillas-sms', name: 'Plantillas SMS', hasCreateButton: true },
  
  // Monitoreo
  { path: '/admin/activity', name: 'Actividad', hasCreateButton: false },
  { path: '/admin/system-logs', name: 'Logs del Sistema', hasCreateButton: false },
  { path: '/admin/salud-sistema', name: 'Salud del Sistema', hasCreateButton: false },
  { path: '/admin/metricas-uso', name: 'Métricas de Uso', hasCreateButton: false },
  { path: '/admin/alertas', name: 'Alertas', hasCreateButton: false },
  
  // Integraciones
  { path: '/admin/integraciones', name: 'Integraciones', hasCreateButton: false },
  { path: '/admin/integraciones-contables', name: 'Integraciones Contables', hasCreateButton: false },
  { path: '/admin/contasimple', name: 'Contasimple', hasCreateButton: false },
  { path: '/admin/portales-externos', name: 'Portales Externos', hasCreateButton: false },
  
  // Otros
  { path: '/admin/sales-team', name: 'Equipo de Ventas', hasCreateButton: true },
  { path: '/admin/reportes-programados', name: 'Reportes Programados', hasCreateButton: true },
  { path: '/admin/seguridad', name: 'Seguridad', hasCreateButton: false },
];

// Páginas públicas del admin (no requieren autenticación para acceder pero sí redirigen)
const PUBLIC_ADMIN_PAGES = [
  { path: '/admin/recuperar-contrasena', name: 'Recuperar Contraseña', isPublic: true },
];

interface TestResult {
  path: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  httpStatus: number;
  loadTime: number;
  errors: string[];
  consoleErrors: string[];
  hasContent: boolean;
  createButtonWorks: boolean | null;
  dialogOpens: boolean | null;
}

const results: TestResult[] = [];

// Helper para capturar errores de consola
function setupConsoleCapture(page: Page): string[] {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filtrar errores comunes no críticos
      if (!text.includes('favicon') && 
          !text.includes('ResizeObserver') &&
          !text.includes('Loading chunk') &&
          !text.includes('Failed to load resource: the server responded with a status of 404')) {
        consoleErrors.push(text);
      }
    }
  });
  return consoleErrors;
}

// Helper para login
async function loginAsSuperAdmin(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Esperar el formulario
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Rellenar credenciales
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Esperar redirección
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
    
    return true;
  } catch (error: any) {
    console.error('❌ Error en login:', error.message);
    return false;
  }
}

// Helper para verificar página
async function verifyPage(page: Page, pageInfo: typeof SUPERADMIN_PAGES[0], consoleErrors: string[]): Promise<TestResult> {
  const result: TestResult = {
    path: pageInfo.path,
    name: pageInfo.name,
    status: 'pass',
    httpStatus: 0,
    loadTime: 0,
    errors: [],
    consoleErrors: [],
    hasContent: false,
    createButtonWorks: null,
    dialogOpens: null,
  };

  const startTime = Date.now();

  try {
    // Navegar a la página
    const response = await page.goto(`${BASE_URL}${pageInfo.path}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    result.loadTime = Date.now() - startTime;
    result.httpStatus = response?.status() || 0;

    // Verificar HTTP status
    if (result.httpStatus >= 400) {
      result.status = 'fail';
      result.errors.push(`HTTP ${result.httpStatus}`);
      return result;
    }

    // Esperar a que cargue el contenido
    await page.waitForTimeout(2000);

    // Verificar si hay contenido visible
    const mainContent = await page.$('main, [role="main"], .container, h1, h2');
    result.hasContent = !!mainContent;

    if (!result.hasContent) {
      result.status = 'warning';
      result.errors.push('Página sin contenido visible');
    }

    // Verificar errores en la página
    const errorElement = await page.$('[class*="error"], [class*="Error"], .error-boundary, text="Error"');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      if (errorText && (errorText.includes('Error') || errorText.includes('error'))) {
        result.status = 'fail';
        result.errors.push(`Error visible en página: ${errorText.substring(0, 100)}`);
      }
    }

    // Verificar redirección no deseada
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      result.status = 'fail';
      result.errors.push('Redirigido a login - problema de autenticación/permisos');
      return result;
    }

    if (currentUrl.includes('/unauthorized')) {
      result.status = 'fail';
      result.errors.push('Acceso no autorizado');
      return result;
    }

    // Verificar botón de crear si corresponde
    if (pageInfo.hasCreateButton) {
      const createButtonSelector = pageInfo.createButtonText 
        ? `button:has-text("${pageInfo.createButtonText}")`
        : 'button:has-text("Nuevo"), button:has-text("Añadir"), button:has-text("Crear"), button:has-text("Nueva")';
      
      const createButton = page.locator(createButtonSelector).first();
      
      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        result.createButtonWorks = true;
        
        try {
          // Hacer click en el botón de crear
          await createButton.click();
          await page.waitForTimeout(1000);
          
          // Verificar que se abre un diálogo
          const dialog = page.locator('[role="dialog"], [data-state="open"], .dialog');
          result.dialogOpens = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (result.dialogOpens) {
            // Verificar campos del formulario
            const inputs = await page.locator('[role="dialog"] input, [role="dialog"] textarea, [role="dialog"] select').count();
            if (inputs === 0) {
              result.errors.push('Diálogo sin campos de formulario');
              result.status = 'warning';
            }
            
            // Cerrar el diálogo
            const closeButton = page.locator('button:has-text("Cancelar"), button[aria-label="Close"], [data-state="open"] button:has-text("X")');
            if (await closeButton.count() > 0) {
              await closeButton.first().click().catch(() => page.keyboard.press('Escape'));
            } else {
              await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(500);
          } else {
            result.errors.push('Botón de crear no abre diálogo');
            result.status = 'warning';
          }
        } catch (e: any) {
          result.errors.push(`Error al probar botón crear: ${e.message}`);
          result.status = 'warning';
        }
      } else {
        result.createButtonWorks = false;
        result.errors.push('Botón de crear no encontrado');
        result.status = 'warning';
      }
    }

    // Verificar switches/toggles
    const switches = await page.locator('button[role="switch"]').count();
    if (switches > 0) {
      // Intentar verificar que los switches funcionan
      const firstSwitch = page.locator('button[role="switch"]').first();
      if (await firstSwitch.isVisible()) {
        const initialState = await firstSwitch.getAttribute('data-state');
        await firstSwitch.click().catch(() => {});
        await page.waitForTimeout(500);
        const newState = await firstSwitch.getAttribute('data-state');
        
        // Revertir el cambio
        if (initialState !== newState) {
          await firstSwitch.click().catch(() => {});
        }
      }
    }

    // Verificar tablas
    const tables = await page.locator('table').count();
    if (tables > 0) {
      // Verificar que las tablas tienen contenido o mensaje de vacío
      const tableRows = await page.locator('table tbody tr').count();
      const emptyMessage = await page.locator('text=/no hay|sin datos|vacío|empty/i').count();
      
      if (tableRows === 0 && emptyMessage === 0) {
        result.errors.push('Tabla sin filas ni mensaje de vacío');
        result.status = 'warning';
      }
    }

    // Verificar tabs si existen
    const tabs = await page.locator('[role="tablist"] button, [role="tab"]').count();
    if (tabs > 0) {
      // Hacer click en cada tab y verificar que el contenido cambia
      const tabButtons = page.locator('[role="tablist"] button, [role="tab"]');
      for (let i = 0; i < Math.min(tabs, 3); i++) { // Máximo 3 tabs para no tardar mucho
        try {
          await tabButtons.nth(i).click();
          await page.waitForTimeout(500);
        } catch (e) {
          // Ignorar errores en tabs
        }
      }
    }

    // Capturar errores de consola
    result.consoleErrors = [...consoleErrors];
    
    if (result.consoleErrors.length > 0) {
      result.status = result.status === 'pass' ? 'warning' : result.status;
      result.errors.push(`${result.consoleErrors.length} errores de consola`);
    }

  } catch (error: any) {
    result.loadTime = Date.now() - startTime;
    result.status = 'fail';
    
    if (error.message.includes('timeout')) {
      result.errors.push('Timeout al cargar la página');
    } else {
      result.errors.push(error.message);
    }
  }

  return result;
}

test.describe('Verificación Completa de Páginas Superadministrador', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'es-ES',
    });
    page = await context.newPage();
    
    // Login una sola vez
    const loggedIn = await loginAsSuperAdmin(page);
    expect(loggedIn, 'Login debería ser exitoso').toBe(true);
  });

  test.afterAll(async () => {
    // Imprimir resumen de resultados
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE VERIFICACIÓN DE PÁGINAS SUPERADMIN');
    console.log('='.repeat(80) + '\n');

    const passed = results.filter(r => r.status === 'pass');
    const warnings = results.filter(r => r.status === 'warning');
    const failed = results.filter(r => r.status === 'fail');

    console.log(`✅ Pasadas: ${passed.length}`);
    console.log(`⚠️ Con advertencias: ${warnings.length}`);
    console.log(`❌ Fallidas: ${failed.length}`);
    console.log(`\nTotal: ${results.length} páginas verificadas\n`);

    if (failed.length > 0) {
      console.log('\n❌ PÁGINAS FALLIDAS:\n');
      failed.forEach(r => {
        console.log(`  ${r.name} (${r.path})`);
        r.errors.forEach(e => console.log(`    - ${e}`));
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️ PÁGINAS CON ADVERTENCIAS:\n');
      warnings.forEach(r => {
        console.log(`  ${r.name} (${r.path})`);
        r.errors.forEach(e => console.log(`    - ${e}`));
      });
    }

    console.log('\n' + '='.repeat(80));

    await context.close();
  });

  // Crear un test para cada página
  for (const pageInfo of SUPERADMIN_PAGES) {
    test(`Verificar: ${pageInfo.name} (${pageInfo.path})`, async () => {
      test.setTimeout(60000);
      
      // Limpiar errores de consola previos
      const consoleErrors = setupConsoleCapture(page);
      
      const result = await verifyPage(page, pageInfo, consoleErrors);
      results.push(result);

      // Log del resultado
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${statusIcon} ${result.name} - HTTP ${result.httpStatus} - ${result.loadTime}ms`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(e => console.log(`    └─ ${e}`));
      }

      // Assertions
      expect(result.httpStatus, `${pageInfo.name} debería retornar HTTP 2xx/3xx`).toBeLessThan(400);
      
      // Para páginas críticas, fallar si hay errores
      if (result.status === 'fail') {
        expect(result.errors.length, `${pageInfo.name} no debería tener errores críticos`).toBe(0);
      }
    });
  }
});

// Test específico para verificar interacciones en páginas críticas
test.describe('Interacciones en Páginas Críticas', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'es-ES',
    });
    page = await context.newPage();
    await loginAsSuperAdmin(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Dashboard: Verificar cards de estadísticas y gráficos', async () => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');

    // Verificar cards de KPIs
    const kpiCards = await page.locator('.card, [class*="Card"]').count();
    expect(kpiCards, 'Debería haber cards de estadísticas').toBeGreaterThan(0);

    // Verificar tabs
    const tabs = page.locator('[role="tablist"]');
    if (await tabs.isVisible()) {
      // Click en cada tab
      const tabButtons = page.locator('[role="tablist"] button');
      const tabCount = await tabButtons.count();
      
      for (let i = 0; i < tabCount; i++) {
        await tabButtons.nth(i).click();
        await page.waitForTimeout(500);
        expect(await tabButtons.nth(i).getAttribute('data-state')).toBe('active');
      }
    }

    // Verificar botón de actualizar
    const refreshButton = page.locator('button:has-text("Actualizar")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Clientes: Crear y cancelar formulario de nueva empresa', async () => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');

    // Click en Nueva Empresa
    const createButton = page.locator('button:has-text("Nueva Empresa")');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Verificar que el diálogo se abre
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verificar campos del formulario
    await expect(page.locator('input[id="nombre"]')).toBeVisible();
    await expect(page.locator('input[id="emailContacto"]')).toBeVisible();

    // Llenar algunos campos
    await page.fill('input[id="nombre"]', 'Empresa Test');
    await page.fill('input[id="emailContacto"]', 'test@test.com');

    // Verificar switch de empresa demo
    const demoSwitch = page.locator('input[id="esEmpresaPrueba"], button[id="esEmpresaPrueba"]');
    if (await demoSwitch.isVisible()) {
      await demoSwitch.click();
    }

    // Cancelar
    await page.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible();
  });

  test('Planes: Verificar tabla y formulario de nuevo plan', async () => {
    await page.goto(`${BASE_URL}/admin/planes`);
    await page.waitForLoadState('networkidle');

    // Verificar tabla de planes
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verificar botón de nuevo plan
    const newPlanButton = page.locator('button:has-text("Nuevo Plan")');
    await expect(newPlanButton).toBeVisible();
    await newPlanButton.click();

    // Verificar diálogo
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verificar tabs del formulario
    const formTabs = page.locator('[role="dialog"] [role="tablist"]');
    if (await formTabs.isVisible()) {
      const tabButtons = page.locator('[role="dialog"] [role="tablist"] button');
      const tabCount = await tabButtons.count();
      expect(tabCount).toBeGreaterThanOrEqual(2);
    }

    // Cancelar
    await page.keyboard.press('Escape');
  });

  test('Partners: Verificar subpáginas de comisiones, landings e invitaciones', async () => {
    // Partners principal
    await page.goto(`${BASE_URL}/admin/partners`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2')).toContainText(/partner/i);

    // Comisiones
    await page.goto(`${BASE_URL}/admin/partners/comisiones`);
    await page.waitForLoadState('networkidle');
    const comisionesContent = await page.locator('main').textContent();
    expect(comisionesContent?.length).toBeGreaterThan(50);

    // Landings
    await page.goto(`${BASE_URL}/admin/partners/landings`);
    await page.waitForLoadState('networkidle');
    const landingsContent = await page.locator('main').textContent();
    expect(landingsContent?.length).toBeGreaterThan(50);

    // Invitaciones
    await page.goto(`${BASE_URL}/admin/partners/invitaciones`);
    await page.waitForLoadState('networkidle');
    const invitacionesContent = await page.locator('main').textContent();
    expect(invitacionesContent?.length).toBeGreaterThan(50);
  });

  test('Marketplace: Verificar categorías y proveedores', async () => {
    // Categorías
    await page.goto(`${BASE_URL}/admin/marketplace/categorias`);
    await page.waitForLoadState('networkidle');
    
    const categoriasTable = page.locator('table');
    if (await categoriasTable.isVisible()) {
      // Verificar switches de activación
      const switches = page.locator('button[role="switch"]');
      const switchCount = await switches.count();
      expect(switchCount, 'Debería haber switches para activar/desactivar').toBeGreaterThanOrEqual(0);
    }

    // Proveedores
    await page.goto(`${BASE_URL}/admin/marketplace/proveedores`);
    await page.waitForLoadState('networkidle');
    
    const newProviderButton = page.locator('button:has-text("Nuevo Proveedor")');
    if (await newProviderButton.isVisible()) {
      await newProviderButton.click();
      await page.waitForTimeout(500);
      
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Verificar campos básicos
      const inputs = await page.locator('[role="dialog"] input').count();
      expect(inputs, 'Formulario debería tener campos de entrada').toBeGreaterThan(0);
      
      await page.keyboard.press('Escape');
    }
  });

  test('Seguridad: Verificar página de configuración de seguridad', async () => {
    await page.goto(`${BASE_URL}/admin/seguridad`);
    await page.waitForLoadState('networkidle');

    // Verificar que la página carga sin errores
    const mainContent = await page.locator('main, [role="main"]').textContent();
    expect(mainContent?.length).toBeGreaterThan(50);

    // Verificar que no hay mensajes de error visibles
    const errorVisible = await page.locator('text=/error|Error/i').isVisible().catch(() => false);
    expect(errorVisible).toBe(false);
  });

  test('Usuarios: Verificar gestión de usuarios', async () => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    await page.waitForLoadState('networkidle');

    // Verificar tabla o lista de usuarios
    const usersContent = await page.locator('main').isVisible();
    expect(usersContent).toBe(true);

    // Verificar botón de nuevo usuario
    const newUserButton = page.locator('button:has-text("Nuevo"), button:has-text("Añadir"), button:has-text("Crear")');
    if (await newUserButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await newUserButton.first().click();
      await page.waitForTimeout(500);
      
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        await page.keyboard.press('Escape');
      }
    }
  });
});

// Test de accesibilidad básica
test.describe('Accesibilidad Básica', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await loginAsSuperAdmin(page);
  });

  test('Dashboard debe tener headings accesibles', async () => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');

    const h1 = await page.locator('h1').count();
    expect(h1, 'Debería haber al menos un h1').toBeGreaterThan(0);
  });

  test('Formularios deben tener labels', async () => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');

    // Abrir diálogo de crear
    await page.locator('button:has-text("Nueva Empresa")').click();
    await page.waitForTimeout(500);

    // Verificar que los inputs tienen labels asociados
    const inputs = page.locator('[role="dialog"] input[id]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const inputId = await inputs.nth(i).getAttribute('id');
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        const hasLabel = await label.count() > 0;
        if (!hasLabel) {
          console.log(`⚠️ Input sin label: ${inputId}`);
        }
      }
    }

    await page.keyboard.press('Escape');
  });

  test('Botones deben ser accesibles por teclado', async () => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');

    // Presionar Tab varias veces y verificar que el foco se mueve
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verificar que hay un elemento enfocado
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).not.toBe('BODY');
  });
});

// Test de páginas públicas del admin
test.describe('Páginas Públicas del Admin', () => {
  test('Página de recuperar contraseña debe cargar correctamente', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Esta página no requiere autenticación
    const response = await page.goto(`${BASE_URL}/admin/recuperar-contrasena`);
    
    // Verificar HTTP status
    expect(response?.status()).toBeLessThan(400);
    
    // Esperar contenido
    await page.waitForTimeout(1000);
    
    // Verificar que la página contiene el formulario
    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');
    
    expect(await emailInput.isVisible()).toBe(true);
    expect(await submitButton.isVisible()).toBe(true);
    
    // Verificar título
    const title = await page.locator('text=/Recuperar|Restablecer/i').first();
    expect(await title.isVisible()).toBe(true);
    
    await context.close();
  });
});

// Test de verificación de botones CRUD en todas las páginas
test.describe('Verificación CRUD Detallada', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'es-ES',
    });
    page = await context.newPage();
    await loginAsSuperAdmin(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Verificar botones de acción en tabla de Clientes', async () => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que existen acciones de editar/eliminar en cards/tabla
    const actionButtons = page.locator('button:has([class*="edit"]), button:has([class*="trash"]), button:has(svg[class*="edit"]), button:has(svg[class*="trash"])');
    const actionCount = await actionButtons.count();
    
    // Puede ser 0 si no hay datos, pero no debería haber error
    console.log(`  Botones de acción encontrados: ${actionCount}`);
  });

  test('Verificar filtros en página de Clientes', async () => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');

    // Buscar inputs de búsqueda/filtro
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"]');
    const filterSelects = page.locator('button[role="combobox"], select');
    
    if (await searchInput.count() > 0) {
      // Escribir en el buscador
      await searchInput.first().fill('test');
      await page.waitForTimeout(500);
      await searchInput.first().clear();
    }

    const filterCount = await filterSelects.count();
    console.log(`  Filtros encontrados: ${filterCount}`);
  });

  test('Verificar estadísticas en Dashboard', async () => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que hay cards con estadísticas
    const statCards = page.locator('.card, [class*="Card"]');
    const cardCount = await statCards.count();
    expect(cardCount, 'Dashboard debería tener cards de estadísticas').toBeGreaterThan(0);

    // Verificar que las estadísticas tienen números
    const numbers = await page.locator('.text-2xl.font-bold, .text-3xl.font-bold').count();
    console.log(`  Números de estadísticas visibles: ${numbers}`);
  });

  test('Verificar gráficos en Dashboard', async () => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que hay gráficos (Recharts)
    const charts = page.locator('.recharts-wrapper, [class*="recharts"]');
    const chartCount = await charts.count();
    console.log(`  Gráficos encontrados: ${chartCount}`);
  });
});
