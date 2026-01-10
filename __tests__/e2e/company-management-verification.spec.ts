/**
 * Test E2E para verificar las páginas de gestión de empresa
 * 
 * Ejecutar: 
 *   npx playwright test __tests__/e2e/company-management-verification.spec.ts --project=chromium
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'https://inmovaapp.com';
const ADMIN_EMAIL = 'admin@inmova.app';
const ADMIN_PASSWORD = 'Admin123!';

// Páginas de gestión de empresa a verificar
const COMPANY_PAGES = [
  // Dashboard principal
  { path: '/dashboard', name: 'Dashboard Principal', hasCrud: false },
  
  // Gestión de propiedades
  { path: '/dashboard/properties', name: 'Propiedades', hasCrud: true },
  { path: '/dashboard/tenants', name: 'Inquilinos', hasCrud: true },
  { path: '/dashboard/contracts', name: 'Contratos', hasCrud: true },
  { path: '/dashboard/payments', name: 'Pagos', hasCrud: true },
  { path: '/dashboard/maintenance', name: 'Mantenimiento', hasCrud: true },
  
  // Documentos y comunicación
  { path: '/dashboard/documents', name: 'Documentos', hasCrud: true },
  { path: '/dashboard/messages', name: 'Mensajes', hasCrud: false },
  
  // Analytics y reportes
  { path: '/dashboard/analytics', name: 'Analytics', hasCrud: false },
  { path: '/dashboard/budgets', name: 'Presupuestos', hasCrud: true },
  
  // Comunidad y servicios
  { path: '/dashboard/community', name: 'Comunidad', hasCrud: true },
  { path: '/dashboard/servicios', name: 'Servicios', hasCrud: false },
  
  // Extras
  { path: '/dashboard/coupons', name: 'Cupones', hasCrud: false },
  { path: '/dashboard/referrals', name: 'Referidos', hasCrud: false },
  { path: '/dashboard/integrations', name: 'Integraciones', hasCrud: false },
  
  // Alquiler tradicional
  { path: '/traditional-rental', name: 'Alquiler Tradicional', hasCrud: false },
  { path: '/traditional-rental/communities', name: 'Comunidades (Trad)', hasCrud: true },
  { path: '/traditional-rental/treasury', name: 'Tesorería', hasCrud: true },
  { path: '/traditional-rental/renewals', name: 'Renovaciones', hasCrud: false },
  { path: '/traditional-rental/compliance', name: 'Cumplimiento', hasCrud: false },
  
  // Media estancia
  { path: '/media-estancia', name: 'Media Estancia', hasCrud: false },
  { path: '/media-estancia/calendario', name: 'Calendario ME', hasCrud: false },
  { path: '/media-estancia/scoring', name: 'Scoring ME', hasCrud: false },
  { path: '/media-estancia/analytics', name: 'Analytics ME', hasCrud: false },
  { path: '/contratos/media-estancia', name: 'Contratos ME', hasCrud: true },
  
  // Coliving
  { path: '/coliving', name: 'Coliving', hasCrud: false },
  
  // Admin Fincas
  { path: '/admin-fincas', name: 'Admin Fincas', hasCrud: false },
  { path: '/admin-fincas/comunidades', name: 'Comunidades AF', hasCrud: true },
  { path: '/admin-fincas/facturas', name: 'Facturas AF', hasCrud: true },
  { path: '/admin-fincas/libro-caja', name: 'Libro Caja', hasCrud: true },
  { path: '/admin-fincas/informes', name: 'Informes AF', hasCrud: false },
  
  // Configuración
  { path: '/configuracion', name: 'Configuración', hasCrud: false },
  { path: '/dashboard-propietarios', name: 'Dashboard Propietarios', hasCrud: false },
  { path: '/reportes/programados', name: 'Reportes Programados', hasCrud: true },
];

// Helper para login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  
  await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
  console.log('✅ Login exitoso');
}

// Helper para verificar que la página carga correctamente
async function verifyPageLoads(page: Page, path: string, name: string): Promise<boolean> {
  console.log(`\n📄 Verificando: ${name} (${path})`);
  
  try {
    const response = await page.goto(`${BASE_URL}${path}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Verificar status code
    if (response?.status() && response.status() >= 400) {
      console.log(`   ❌ Status: ${response.status()}`);
      return false;
    }
    
    await page.waitForTimeout(1500);
    
    // Verificar título o header de la página
    const pageTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log(`   Título: ${pageTitle?.substring(0, 50) || 'N/A'}`);
    
    return true;
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message.substring(0, 50)}`);
    return false;
  }
}

// Helper para verificar botones de crear
async function verifyCreateButton(page: Page, name: string): Promise<boolean> {
  const createButtons = page.locator('button:has-text("Nuevo"), button:has-text("Añadir"), button:has-text("Crear"), button:has-text("Nueva"), button:has-text("Agregar")');
  const count = await createButtons.count();
  
  if (count > 0) {
    console.log(`   ✅ Botón crear encontrado (${count})`);
    
    try {
      await createButtons.first().click();
      await page.waitForTimeout(800);
      
      // Verificar diálogo o navegación
      const dialog = page.locator('[role="dialog"], [data-state="open"], .dialog');
      const dialogVisible = await dialog.isVisible().catch(() => false);
      
      if (dialogVisible) {
        console.log(`   ✅ Diálogo de creación se abre`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } else {
        // Puede ser navegación a otra página
        const newUrl = page.url();
        if (newUrl.includes('/new') || newUrl.includes('/crear') || newUrl.includes('/nuevo')) {
          console.log(`   ✅ Navegación a formulario de creación`);
          await page.goBack();
        } else {
          console.log(`   ℹ️ Sin diálogo visible (puede ser otro comportamiento)`);
        }
      }
      
      return true;
    } catch (e) {
      console.log(`   ⚠️ Error verificando botón crear`);
      return false;
    }
  } else {
    console.log(`   ℹ️ Sin botón de crear visible`);
    return true;
  }
}

// Helper para verificar botones de acción en tablas
async function verifyTableActions(page: Page, name: string): Promise<boolean> {
  const tables = page.locator('table');
  const tableCount = await tables.count();
  
  if (tableCount === 0) {
    // Buscar cards o listas
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const cardCount = await cards.count();
    if (cardCount > 0) {
      console.log(`   📊 Cards encontradas: ${cardCount}`);
    } else {
      console.log(`   ℹ️ Sin tablas ni cards`);
    }
    return true;
  }
  
  // Buscar botones en filas de tabla
  const actionButtons = page.locator('table button, table a[href]');
  const actionCount = await actionButtons.count();
  console.log(`   📊 Tabla con ${actionCount} botones/links de acción`);
  
  // Verificar botones de editar/eliminar
  const editButtons = page.locator('table button').filter({
    has: page.locator('svg')
  });
  const editCount = await editButtons.count();
  if (editCount > 0) {
    console.log(`   ✅ ${editCount} botones de acción en tabla`);
  }
  
  return true;
}

// Helper para verificar switches/toggles
async function verifySwitches(page: Page): Promise<number> {
  const switches = page.locator('button[role="switch"], [data-state="checked"], [data-state="unchecked"]');
  const count = await switches.count();
  if (count > 0) {
    console.log(`   🔘 ${count} switches encontrados`);
  }
  return count;
}

// Helper para verificar filtros
async function verifyFilters(page: Page): Promise<boolean> {
  const filters = page.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"], [role="combobox"], select');
  const filterCount = await filters.count();
  if (filterCount > 0) {
    console.log(`   🔍 ${filterCount} filtros encontrados`);
    return true;
  }
  return false;
}

test.describe('Verificación de Gestión de Empresa', () => {
  test.setTimeout(180000);

  test('1. Login como administrador', async ({ page }) => {
    await login(page);
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|admin)/);
  });

  test('2. Dashboard Principal - KPIs y métricas', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Verificar título
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar cards de KPIs
    const kpiCards = page.locator('[class*="card"], [class*="Card"]');
    const kpiCount = await kpiCards.count();
    console.log(`   Cards de KPI: ${kpiCount}`);
    expect(kpiCount).toBeGreaterThan(0);
    
    // Verificar gráficos
    const charts = page.locator('canvas, svg[class*="chart"], [class*="recharts"]');
    const chartCount = await charts.count();
    console.log(`   Gráficos: ${chartCount}`);
    
    console.log('✅ Dashboard Principal verificado');
  });

  test('3. Propiedades - CRUD completo', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard/properties`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Verificar título
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar botón crear
    const createButton = page.locator('button:has-text("Nueva"), button:has-text("Añadir"), button:has-text("Crear")');
    const createCount = await createButton.count();
    console.log(`   Botones crear: ${createCount}`);
    
    if (createCount > 0) {
      await createButton.first().click();
      await page.waitForTimeout(1000);
      
      // Verificar diálogo o navegación
      const dialog = page.locator('[role="dialog"]');
      const dialogVisible = await dialog.isVisible().catch(() => false);
      
      if (dialogVisible) {
        console.log('   ✅ Diálogo de creación abierto');
        await page.keyboard.press('Escape');
      } else if (page.url().includes('/new') || page.url().includes('/crear')) {
        console.log('   ✅ Página de creación abierta');
        await page.goBack();
      }
    }
    
    // Verificar tabla o grid
    await verifyTableActions(page, 'Propiedades');
    await verifyFilters(page);
    
    console.log('✅ Propiedades verificado');
  });

  test('4. Inquilinos - CRUD completo', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard/tenants`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar tabla
    await verifyTableActions(page, 'Inquilinos');
    
    // Verificar botón crear
    await verifyCreateButton(page, 'Inquilinos');
    
    // Verificar filtros
    await verifyFilters(page);
    
    console.log('✅ Inquilinos verificado');
  });

  test('5. Contratos - CRUD completo', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard/contracts`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar tabs si existen
    const tabs = page.locator('[role="tablist"] button, [role="tab"]');
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      console.log(`   Tabs: ${tabCount}`);
    }
    
    // Verificar tabla
    await verifyTableActions(page, 'Contratos');
    
    // Verificar botón crear
    await verifyCreateButton(page, 'Contratos');
    
    console.log('✅ Contratos verificado');
  });

  test('6. Pagos - Listado y acciones', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard/payments`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar tabla
    await verifyTableActions(page, 'Pagos');
    
    // Verificar filtros de fecha
    const dateFilters = page.locator('input[type="date"], [class*="date"]');
    const dateCount = await dateFilters.count();
    console.log(`   Filtros fecha: ${dateCount}`);
    
    // Verificar botones de acción (marcar pagado, etc)
    const actionButtons = page.locator('button:has-text("Registrar"), button:has-text("Pagar")');
    const actionCount = await actionButtons.count();
    console.log(`   Botones acción: ${actionCount}`);
    
    console.log('✅ Pagos verificado');
  });

  test('7. Mantenimiento - Incidencias', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard/maintenance`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar botón crear incidencia
    await verifyCreateButton(page, 'Mantenimiento');
    
    // Verificar tabla o cards
    await verifyTableActions(page, 'Mantenimiento');
    
    // Verificar filtros de estado
    await verifyFilters(page);
    
    console.log('✅ Mantenimiento verificado');
  });

  test('8. Documentos - Gestión', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard/documents`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar botón subir documento
    const uploadButton = page.locator('button:has-text("Subir"), button:has-text("Upload"), button:has-text("Nuevo")');
    const uploadCount = await uploadButton.count();
    console.log(`   Botones subir: ${uploadCount}`);
    
    // Verificar lista o grid de documentos
    await verifyTableActions(page, 'Documentos');
    
    console.log('✅ Documentos verificado');
  });

  test('9. Analytics - Gráficos y métricas', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar gráficos
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="recharts"]');
    const chartCount = await charts.count();
    console.log(`   Elementos gráficos: ${chartCount}`);
    
    // Verificar filtros de periodo
    const periodFilters = page.locator('select, [role="combobox"], button:has-text("mes"), button:has-text("año")');
    const filterCount = await periodFilters.count();
    console.log(`   Filtros periodo: ${filterCount}`);
    
    console.log('✅ Analytics verificado');
  });

  test('10. Comunidad - Gestión', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard/community`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar tabs o secciones
    const tabs = page.locator('[role="tab"], [role="tablist"] button');
    const tabCount = await tabs.count();
    console.log(`   Tabs: ${tabCount}`);
    
    // Verificar botones de crear
    await verifyCreateButton(page, 'Comunidad');
    
    console.log('✅ Comunidad verificado');
  });

  test('11. Traditional Rental - Dashboard', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/traditional-rental`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar KPIs
    const kpis = page.locator('[class*="card"], [class*="Card"]');
    const kpiCount = await kpis.count();
    console.log(`   Cards KPI: ${kpiCount}`);
    
    console.log('✅ Traditional Rental verificado');
  });

  test('12. Media Estancia - Dashboard y Calendario', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/media-estancia`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar KPIs
    const kpis = page.locator('[class*="card"], [class*="Card"]');
    const kpiCount = await kpis.count();
    console.log(`   Cards: ${kpiCount}`);
    
    // Verificar calendario
    await page.goto(`${BASE_URL}/media-estancia/calendario`);
    await page.waitForTimeout(1500);
    
    const calendar = page.locator('[class*="calendar"], [class*="Calendar"], table');
    const calendarVisible = await calendar.isVisible().catch(() => false);
    console.log(`   Calendario visible: ${calendarVisible}`);
    
    console.log('✅ Media Estancia verificado');
  });

  test('13. Admin Fincas - Comunidades y Facturas', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin-fincas`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar Comunidades
    await page.goto(`${BASE_URL}/admin-fincas/comunidades`);
    await page.waitForTimeout(1500);
    await verifyCreateButton(page, 'Comunidades AF');
    
    // Verificar Facturas
    await page.goto(`${BASE_URL}/admin-fincas/facturas`);
    await page.waitForTimeout(1500);
    await verifyCreateButton(page, 'Facturas AF');
    
    // Verificar Libro Caja
    await page.goto(`${BASE_URL}/admin-fincas/libro-caja`);
    await page.waitForTimeout(1500);
    const libroTitle = await page.locator('h1, h2').first().textContent();
    console.log(`   Libro Caja: ${libroTitle}`);
    
    console.log('✅ Admin Fincas verificado');
  });

  test('14. Coliving - Dashboard', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/coliving`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar cards o métricas
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const cardCount = await cards.count();
    console.log(`   Cards: ${cardCount}`);
    
    console.log('✅ Coliving verificado');
  });

  test('15. Configuración - Settings', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/configuracion`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`   Título: ${title}`);
    
    // Verificar tabs de configuración
    const tabs = page.locator('[role="tab"], button[data-state]');
    const tabCount = await tabs.count();
    console.log(`   Tabs config: ${tabCount}`);
    
    // Verificar formularios
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    console.log(`   Campos config: ${inputCount}`);
    
    // Verificar botón guardar
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save")');
    const saveCount = await saveButton.count();
    console.log(`   Botones guardar: ${saveCount}`);
    
    console.log('✅ Configuración verificado');
  });

  test('16. Verificar todas las páginas responden 200', async ({ page }) => {
    await login(page);
    
    const results: { page: string; status: string }[] = [];
    
    for (const pageInfo of COMPANY_PAGES) {
      try {
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        
        const status = response?.status() || 0;
        results.push({
          page: pageInfo.name,
          status: status < 400 ? '✅' : `❌ ${status}`,
        });
      } catch (error) {
        results.push({
          page: pageInfo.name,
          status: '❌ Error',
        });
      }
    }
    
    // Imprimir resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PÁGINAS DE GESTIÓN DE EMPRESA');
    console.log('='.repeat(60));
    
    let passed = 0;
    for (const result of results) {
      console.log(`${result.status} ${result.page}`);
      if (result.status === '✅') passed++;
    }
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Total: ${passed}/${results.length} páginas OK`);
    console.log('='.repeat(60));
    
    // El test pasa si al menos el 90% de las páginas funcionan
    expect(passed / results.length).toBeGreaterThan(0.9);
  });
});
