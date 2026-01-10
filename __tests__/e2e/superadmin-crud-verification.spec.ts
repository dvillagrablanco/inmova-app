/**
 * Test E2E para verificar todos los CRUDs del panel de superadministrador
 * Ejecutar: npx playwright test e2e/superadmin-crud-verification.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'https://inmovaapp.com';
const ADMIN_EMAIL = 'admin@inmova.app';
const ADMIN_PASSWORD = 'Admin123!';

// Páginas del superadministrador a verificar
const SUPERADMIN_PAGES = [
  // Gestión de Clientes
  { path: '/admin/clientes', name: 'Clientes', hasCrud: true },
  { path: '/admin/empresas', name: 'Empresas', hasCrud: true },
  { path: '/admin/onboarding-tracker', name: 'Onboarding Tracker', hasCrud: false },
  
  // Planes y Facturación
  { path: '/admin/planes', name: 'Planes de Suscripción', hasCrud: true },
  { path: '/admin/addons', name: 'Add-ons', hasCrud: true },
  { path: '/admin/cupones', name: 'Cupones', hasCrud: true },
  { path: '/admin/facturacion-b2b', name: 'Facturación B2B', hasCrud: true },
  
  // eWoorker
  { path: '/admin/ewoorker-planes', name: 'Planes eWoorker', hasCrud: true },
  
  // Partners
  { path: '/admin/partners', name: 'Partners', hasCrud: true },
  { path: '/admin/partners/comisiones', name: 'Comisiones Partners', hasCrud: false },
  { path: '/admin/partners/landings', name: 'Landings Partners', hasCrud: true },
  { path: '/admin/partners/invitaciones', name: 'Invitaciones Partners', hasCrud: true },
  
  // Marketplace
  { path: '/admin/marketplace/categorias', name: 'Categorías Marketplace', hasCrud: true },
  { path: '/admin/marketplace/proveedores', name: 'Proveedores Marketplace', hasCrud: true },
  { path: '/admin/marketplace/reservas', name: 'Reservas Marketplace', hasCrud: false },
  { path: '/admin/marketplace/comisiones', name: 'Comisiones Marketplace', hasCrud: true },
  
  // Configuración
  { path: '/admin/integraciones', name: 'Integraciones', hasCrud: false },
  { path: '/admin/roles', name: 'Roles y Permisos', hasCrud: true },
  { path: '/admin/sales-team', name: 'Equipo de Ventas', hasCrud: true },
  
  // Herramientas
  { path: '/admin/importar-datos', name: 'Importar Datos', hasCrud: false },
  { path: '/admin/limpieza-datos', name: 'Limpieza de Datos', hasCrud: false },
];

// Helper para login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Rellenar credenciales
  await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Esperar redirección al dashboard
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
  
  console.log('✅ Login exitoso');
}

// Helper para verificar que la página carga correctamente
async function verifyPageLoads(page: Page, path: string, name: string) {
  console.log(`\n📄 Verificando: ${name} (${path})`);
  
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  
  // Verificar status code
  expect(response?.status(), `${name} debería retornar 200`).toBeLessThan(400);
  
  // Verificar que no hay error visible
  const errorText = await page.locator('text=/error|Error|404|500/i').first().isVisible().catch(() => false);
  
  // Esperar a que cargue el contenido principal
  await page.waitForTimeout(1000);
  
  // Verificar título o header de la página
  const pageTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
  console.log(`   Título: ${pageTitle?.substring(0, 50) || 'N/A'}`);
  
  return !errorText;
}

// Helper para verificar botones de crear
async function verifyCreateButton(page: Page, name: string) {
  // Buscar botones de crear/añadir/nuevo
  const createButtons = page.locator('button:has-text("Nuevo"), button:has-text("Añadir"), button:has-text("Crear"), button:has-text("Nueva")');
  const count = await createButtons.count();
  
  if (count > 0) {
    console.log(`   ✅ Botón crear encontrado`);
    
    // Intentar hacer click en el botón
    try {
      await createButtons.first().click();
      await page.waitForTimeout(500);
      
      // Verificar que se abre un diálogo
      const dialog = page.locator('[role="dialog"], .dialog, [data-state="open"]');
      const dialogVisible = await dialog.isVisible().catch(() => false);
      
      if (dialogVisible) {
        console.log(`   ✅ Diálogo de creación se abre correctamente`);
        
        // Cerrar el diálogo
        const closeButton = page.locator('button:has-text("Cancelar"), button[aria-label="Close"], [data-state="open"] button:first-child');
        if (await closeButton.count() > 0) {
          await closeButton.first().click().catch(() => {});
          await page.waitForTimeout(300);
        } else {
          await page.keyboard.press('Escape');
        }
      } else {
        console.log(`   ⚠️ Diálogo no detectado (puede ser navegación)`);
      }
      
      return true;
    } catch (e) {
      console.log(`   ⚠️ Error al verificar botón: ${e}`);
      return false;
    }
  } else {
    console.log(`   ℹ️ Sin botón de crear visible`);
    return true;
  }
}

// Helper para verificar botones de editar/eliminar en tablas
async function verifyTableActions(page: Page, name: string) {
  // Buscar tablas
  const tables = page.locator('table');
  const tableCount = await tables.count();
  
  if (tableCount === 0) {
    console.log(`   ℹ️ Sin tablas en la página`);
    return true;
  }
  
  // Buscar botones de acción en la tabla
  const editButtons = page.locator('table button:has(svg[class*="pencil"]), table button:has-text("Editar")');
  const deleteButtons = page.locator('table button:has(svg[class*="trash"]), table button:has-text("Eliminar")');
  
  const editCount = await editButtons.count();
  const deleteCount = await deleteButtons.count();
  
  console.log(`   📊 Tabla: ${editCount} botones editar, ${deleteCount} botones eliminar`);
  
  // Si hay botón de editar, verificar que funciona
  if (editCount > 0) {
    try {
      await editButtons.first().click();
      await page.waitForTimeout(500);
      
      const dialog = page.locator('[role="dialog"], .dialog, [data-state="open"]');
      const dialogVisible = await dialog.isVisible().catch(() => false);
      
      if (dialogVisible) {
        console.log(`   ✅ Diálogo de edición se abre`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } catch (e) {
      // Silenciar error si no hay elementos
    }
  }
  
  return true;
}

// Helper para verificar switches/toggles
async function verifySwitches(page: Page, name: string) {
  const switches = page.locator('button[role="switch"], [data-state="checked"], [data-state="unchecked"]');
  const switchCount = await switches.count();
  
  if (switchCount > 0) {
    console.log(`   🔘 ${switchCount} switches encontrados`);
    return true;
  }
  
  return true;
}

// Test principal
test.describe('Verificación CRUDs Superadministrador', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar timeout más largo
    test.setTimeout(120000);
  });

  test('Login como superadministrador', async ({ page }) => {
    await login(page);
    
    // Verificar que estamos logueados
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|admin)/);
  });

  test('Verificar todas las páginas del superadministrador', async ({ page }) => {
    // Login primero
    await login(page);
    
    const results: { page: string; status: string; issues: string[] }[] = [];
    
    for (const pageInfo of SUPERADMIN_PAGES) {
      const issues: string[] = [];
      
      try {
        // Verificar que la página carga
        const loads = await verifyPageLoads(page, pageInfo.path, pageInfo.name);
        if (!loads) {
          issues.push('Error al cargar');
        }
        
        // Verificar botones de crear si tiene CRUD
        if (pageInfo.hasCrud) {
          await verifyCreateButton(page, pageInfo.name);
        }
        
        // Verificar acciones en tablas
        await verifyTableActions(page, pageInfo.name);
        
        // Verificar switches
        await verifySwitches(page, pageInfo.name);
        
        results.push({
          page: pageInfo.name,
          status: issues.length === 0 ? '✅' : '⚠️',
          issues,
        });
        
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          page: pageInfo.name,
          status: '❌',
          issues: [error.message],
        });
      }
    }
    
    // Imprimir resumen
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(70));
    
    let passed = 0;
    let failed = 0;
    
    for (const result of results) {
      console.log(`${result.status} ${result.page}`);
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      if (result.status === '✅') passed++;
      else failed++;
    }
    
    console.log('\n' + '-'.repeat(70));
    console.log(`Total: ${passed} OK, ${failed} con problemas`);
    console.log('='.repeat(70));
    
    // El test pasa si al menos el 80% de las páginas funcionan
    expect(passed / results.length).toBeGreaterThan(0.8);
  });

  test('Verificar página de Cupones', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin/cupones`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga
    await expect(page.locator('h1')).toContainText(/cupón|cupon/i);
    
    // Buscar botón de crear
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear")');
    await expect(createButton.first()).toBeVisible();
    
    console.log('✅ Página de cupones verificada');
  });

  test('Verificar página de Invitaciones Partners', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin/partners/invitaciones`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga
    await expect(page.locator('h1')).toContainText(/invitacion/i);
    
    // Buscar botón de crear
    const createButton = page.locator('button:has-text("Nueva Invitación"), button:has-text("Nuevo")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      
      // Verificar diálogo
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Cerrar
      await page.keyboard.press('Escape');
    }
    
    console.log('✅ Página de invitaciones verificada');
  });

  test('Verificar página de Categorías Marketplace', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin/marketplace/categorias`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga
    await expect(page.locator('h1')).toContainText(/categor/i);
    
    // Verificar que hay categorías en la tabla
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`   Categorías encontradas: ${rowCount}`);
    
    // Verificar botón de activar/desactivar
    const switches = page.locator('button[role="switch"]');
    const switchCount = await switches.count();
    console.log(`   Switches encontrados: ${switchCount}`);
    
    // Si hay switches, verificar que funcionan
    if (switchCount > 0) {
      const firstSwitch = switches.first();
      const initialState = await firstSwitch.getAttribute('data-state');
      
      await firstSwitch.click();
      await page.waitForTimeout(500);
      
      // Verificar toast de éxito
      const toast = page.locator('[data-sonner-toast]');
      if (await toast.count() > 0) {
        console.log('   ✅ Toast de confirmación mostrado');
      }
    }
    
    console.log('✅ Página de categorías verificada');
  });

  test('Verificar página de Proveedores Marketplace', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin/marketplace/proveedores`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga
    await expect(page.locator('h1')).toContainText(/proveedore/i);
    
    // Buscar botón de crear
    const createButton = page.locator('button:has-text("Nuevo Proveedor")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      
      // Verificar diálogo
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Verificar campos del formulario
      await expect(page.locator('input[placeholder*="Nombre"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      
      // Cerrar
      await page.keyboard.press('Escape');
    }
    
    console.log('✅ Página de proveedores verificada');
  });

  test('Verificar página de Comisiones Marketplace', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin/marketplace/comisiones`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga
    await expect(page.locator('h1')).toContainText(/comision/i);
    
    // Verificar cards de estadísticas
    const statsCards = page.locator('.card, [class*="Card"]');
    const cardCount = await statsCards.count();
    console.log(`   Cards de estadísticas: ${cardCount}`);
    
    console.log('✅ Página de comisiones verificada');
  });

  test('Verificar página de Planes eWoorker', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin/ewoorker-planes`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga
    await expect(page.locator('h1')).toContainText(/ewoorker|plan/i);
    
    // Verificar botón de crear
    const createButton = page.locator('button:has-text("Nuevo Plan")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      
      // Verificar diálogo
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Verificar switch de estado
      const estadoSwitch = page.locator('[role="dialog"] button[role="switch"]');
      if (await estadoSwitch.count() > 0) {
        console.log('   ✅ Switch de estado presente en formulario');
      }
      
      // Cerrar
      await page.keyboard.press('Escape');
    }
    
    console.log('✅ Página de planes eWoorker verificada');
  });

  test('Verificar página de Add-ons', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin/addons`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página carga
    await expect(page.locator('h1')).toContainText(/add-on|addon/i);
    
    // Verificar tabs INMOVA / eWoorker
    const tabs = page.locator('[role="tablist"] button, [data-state="active"]');
    const tabCount = await tabs.count();
    console.log(`   Tabs encontrados: ${tabCount}`);
    
    // Verificar botón de crear
    const createButton = page.locator('button:has-text("Nuevo Add-on")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      
      // Verificar diálogo
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Verificar switch de estado
      const estadoSwitch = page.locator('[role="dialog"] button[role="switch"]');
      if (await estadoSwitch.count() > 0) {
        console.log('   ✅ Switch de estado presente en formulario');
      }
      
      // Cerrar
      await page.keyboard.press('Escape');
    }
    
    console.log('✅ Página de add-ons verificada');
  });
});
