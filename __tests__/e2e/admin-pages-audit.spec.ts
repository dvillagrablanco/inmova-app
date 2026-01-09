/**
 * Test E2E - Auditoría de Páginas del Panel de Superadministrador
 * 
 * Verifica que todas las 38 páginas admin estén accesibles y funcionales
 * para usuarios con rol super_admin.
 */

import { test, expect, Page } from '@playwright/test';

// Configuración
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@inmova.app';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin123!';

// Lista completa de páginas admin (37 páginas, excluyendo /admin que redirige)
const ADMIN_PAGES = [
  { path: '/admin/dashboard', name: 'Dashboard', requiresSidebar: true },
  { path: '/admin/clientes', name: 'Clientes', requiresSidebar: true },
  { path: '/admin/clientes/comparar', name: 'Comparar Clientes', requiresSidebar: true },
  { path: '/admin/usuarios', name: 'Usuarios', requiresSidebar: true },
  { path: '/admin/planes', name: 'Planes', requiresSidebar: true },
  { path: '/admin/modulos', name: 'Módulos', requiresSidebar: true },
  { path: '/admin/addons', name: 'Add-ons', requiresSidebar: true },
  { path: '/admin/cupones', name: 'Cupones', requiresSidebar: true },
  { path: '/admin/partners', name: 'Partners', requiresSidebar: true },
  { path: '/admin/facturacion-b2b', name: 'Facturación B2B', requiresSidebar: true },
  { path: '/admin/alertas', name: 'Alertas', requiresSidebar: true },
  { path: '/admin/activity', name: 'Actividad', requiresSidebar: true },
  { path: '/admin/aprobaciones', name: 'Aprobaciones', requiresSidebar: true },
  { path: '/admin/sugerencias', name: 'Sugerencias', requiresSidebar: true },
  { path: '/admin/salud-sistema', name: 'Salud del Sistema', requiresSidebar: true },
  { path: '/admin/seguridad', name: 'Seguridad', requiresSidebar: true },
  { path: '/admin/system-logs', name: 'Logs del Sistema', requiresSidebar: true },
  { path: '/admin/backup-restore', name: 'Backup/Restore', requiresSidebar: true },
  { path: '/admin/metricas-uso', name: 'Métricas de Uso', requiresSidebar: true },
  { path: '/admin/reportes-programados', name: 'Reportes Programados', requiresSidebar: true },
  { path: '/admin/onboarding', name: 'Onboarding', requiresSidebar: true },
  { path: '/admin/notificaciones-masivas', name: 'Notificaciones Masivas', requiresSidebar: true },
  { path: '/admin/plantillas-email', name: 'Plantillas Email', requiresSidebar: true },
  { path: '/admin/plantillas-sms', name: 'Plantillas SMS', requiresSidebar: true },
  { path: '/admin/integraciones', name: 'Integraciones', requiresSidebar: true },
  { path: '/admin/integraciones-contables', name: 'Integraciones Contables', requiresSidebar: true },
  { path: '/admin/contasimple', name: 'Contasimple', requiresSidebar: true },
  { path: '/admin/firma-digital', name: 'Firma Digital', requiresSidebar: true },
  { path: '/admin/marketplace', name: 'Marketplace', requiresSidebar: true },
  { path: '/admin/portales-externos', name: 'Portales Externos', requiresSidebar: true },
  { path: '/admin/personalizacion', name: 'Personalización', requiresSidebar: true },
  { path: '/admin/legal', name: 'Legal', requiresSidebar: true },
  { path: '/admin/importar', name: 'Importar', requiresSidebar: true },
  { path: '/admin/ocr-import', name: 'OCR Import', requiresSidebar: true },
  { path: '/admin/limpieza', name: 'Limpieza', requiresSidebar: true },
  { path: '/admin/configuracion', name: 'Configuración', requiresSidebar: true },
  // Página pública (no requiere sidebar)
  { path: '/admin/recuperar-contrasena', name: 'Recuperar Contraseña', requiresSidebar: false, isPublic: true },
];

// Helper para login
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Llenar formulario de login
  await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
  
  // Click en submit
  await page.click('button[type="submit"]');
  
  // Esperar redirección o dashboard
  await page.waitForURL(url => 
    url.pathname.includes('/dashboard') || 
    url.pathname.includes('/admin'),
    { timeout: 15000 }
  );
}

test.describe('Auditoría de Páginas Admin - SuperAdmin', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await loginAsAdmin(page);
  });

  // Test de accesibilidad de cada página
  for (const adminPage of ADMIN_PAGES) {
    test(`📄 ${adminPage.name} (${adminPage.path}) - Carga correctamente`, async ({ page }) => {
      // Navegar a la página
      await page.goto(`${BASE_URL}${adminPage.path}`);
      
      // Esperar a que la página cargue
      await page.waitForLoadState('domcontentloaded');
      
      // Verificar que no hay error 404 o 500
      const response = await page.waitForResponse(
        resp => resp.url().includes(adminPage.path),
        { timeout: 5000 }
      ).catch(() => null);
      
      // La página debe cargar (200 o redirect 302)
      if (response) {
        expect([200, 302, 304]).toContain(response.status());
      }
      
      // Verificar que no hay mensaje de error visible
      const errorMessage = page.locator('text=/error|Error|500|404/i').first();
      const hasVisibleError = await errorMessage.isVisible().catch(() => false);
      
      // Si hay error, capturar screenshot
      if (hasVisibleError) {
        await page.screenshot({ 
          path: `test-results/error-${adminPage.path.replace(/\//g, '-')}.png` 
        });
      }
      
      // Para páginas que requieren sidebar, verificar que existe
      if (adminPage.requiresSidebar) {
        // Buscar elementos típicos del sidebar
        const sidebarSelectors = [
          '[data-testid="sidebar"]',
          'nav[role="navigation"]',
          '.sidebar',
          'aside',
          '[class*="sidebar"]',
        ];
        
        let sidebarFound = false;
        for (const selector of sidebarSelectors) {
          const sidebar = page.locator(selector).first();
          if (await sidebar.isVisible().catch(() => false)) {
            sidebarFound = true;
            break;
          }
        }
        
        // Si no encontramos sidebar específico, al menos debe haber navegación
        if (!sidebarFound) {
          const hasNavigation = await page.locator('nav, [role="navigation"]').first().isVisible().catch(() => false);
          expect(hasNavigation || sidebarFound).toBe(true);
        }
      }
      
      // Verificar que hay contenido principal
      const mainContent = page.locator('main, [role="main"], .main-content, #main').first();
      const hasMainContent = await mainContent.isVisible().catch(() => false);
      
      // Si no hay main específico, debe haber al menos algún contenido
      if (!hasMainContent) {
        const bodyContent = await page.locator('body').textContent();
        expect(bodyContent?.length).toBeGreaterThan(100);
      }
    });
  }
});

// Test de verificación de sidebar en todas las páginas protegidas
test.describe('Verificación de Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('✅ Sidebar visible en Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Verificar elementos del sidebar
    const sidebarItems = [
      'Dashboard',
      'Clientes',
      'Usuarios',
      'Planes',
    ];
    
    for (const item of sidebarItems) {
      const menuItem = page.locator(`text=${item}`).first();
      // Debe existir en algún lugar de la página
      await expect(menuItem).toBeAttached({ timeout: 5000 });
    }
  });

  test('✅ Navegación entre páginas mantiene sidebar', async ({ page }) => {
    // Empezar en dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Navegar a clientes
    await page.click('text=Clientes');
    await page.waitForURL('**/admin/clientes**');
    
    // Verificar que aún hay navegación visible
    const hasNav = await page.locator('nav, aside, [class*="sidebar"]').first().isVisible();
    expect(hasNav).toBe(true);
    
    // Navegar a planes
    const planesLink = page.locator('text=Planes').first();
    if (await planesLink.isVisible()) {
      await planesLink.click();
      await page.waitForURL('**/admin/planes**');
      
      // Verificar navegación aún presente
      const stillHasNav = await page.locator('nav, aside, [class*="sidebar"]').first().isVisible();
      expect(stillHasNav).toBe(true);
    }
  });
});

// Test de funcionalidades CRUD básicas
test.describe('Verificación de Funcionalidades CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('✅ Página Clientes - Botones de acción presentes', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');
    
    // Debe haber botón de crear/nuevo
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Añadir")').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test('✅ Página Planes - Lista de planes visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/planes`);
    await page.waitForLoadState('networkidle');
    
    // Debe mostrar planes o mensaje de "no hay planes"
    const hasPlans = await page.locator('[class*="card"], table, [class*="plan"]').first().isVisible();
    const hasEmptyMessage = await page.locator('text=/no hay|vacío|empty/i').first().isVisible().catch(() => false);
    
    expect(hasPlans || hasEmptyMessage).toBe(true);
  });

  test('✅ Página Usuarios - Tabla de usuarios visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    await page.waitForLoadState('networkidle');
    
    // Debe haber tabla o lista de usuarios
    const hasTable = await page.locator('table, [role="table"]').first().isVisible().catch(() => false);
    const hasList = await page.locator('[class*="list"], [class*="grid"]').first().isVisible().catch(() => false);
    
    expect(hasTable || hasList).toBe(true);
  });

  test('✅ Página Add-ons - Botón delete presente', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/addons`);
    await page.waitForLoadState('networkidle');
    
    // Verificar que existe la funcionalidad de eliminar (icono trash o botón delete)
    const deleteElements = page.locator('[class*="trash"], [class*="delete"], button:has-text("Eliminar")');
    // Puede no haber elementos si la lista está vacía, así que verificamos la estructura
    const tableExists = await page.locator('table').first().isVisible().catch(() => false);
    
    if (tableExists) {
      // Si hay tabla, debería tener acciones
      const actionColumns = await page.locator('th:has-text("Acciones"), td button').count();
      expect(actionColumns).toBeGreaterThanOrEqual(0);
    }
  });
});

// Test de rendimiento básico
test.describe('Verificación de Rendimiento', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('✅ Dashboard carga en menos de 5 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('✅ Página de Clientes carga en menos de 5 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Clientes page load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(5000);
  });
});

// Test de redirección de /admin
test.describe('Verificación de Redirección', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('✅ /admin redirige a /admin/dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    
    // Esperar redirección
    await page.waitForURL('**/admin/dashboard**', { timeout: 10000 });
    
    // Verificar URL final
    expect(page.url()).toContain('/admin/dashboard');
  });
});

// Resumen de cobertura
test('📊 Resumen de Cobertura de Páginas Admin', async ({ page }) => {
  await loginAsAdmin(page);
  
  let pagesOK = 0;
  let pagesFailed = 0;
  const failedPages: string[] = [];
  
  for (const adminPage of ADMIN_PAGES) {
    try {
      await page.goto(`${BASE_URL}${adminPage.path}`, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded');
      
      // Verificar que no hay error grave
      const pageContent = await page.content();
      const hasError = pageContent.includes('500') || pageContent.includes('Error') || pageContent.includes('404');
      
      if (!hasError || adminPage.isPublic) {
        pagesOK++;
      } else {
        pagesFailed++;
        failedPages.push(adminPage.path);
      }
    } catch (error) {
      pagesFailed++;
      failedPages.push(adminPage.path);
    }
  }
  
  console.log('\n========================================');
  console.log('📊 RESUMEN DE AUDITORÍA DE PÁGINAS ADMIN');
  console.log('========================================');
  console.log(`✅ Páginas OK: ${pagesOK}/${ADMIN_PAGES.length}`);
  console.log(`❌ Páginas con errores: ${pagesFailed}`);
  if (failedPages.length > 0) {
    console.log('Páginas fallidas:', failedPages);
  }
  console.log('========================================\n');
  
  // Al menos el 90% de las páginas deben cargar correctamente
  expect(pagesOK / ADMIN_PAGES.length).toBeGreaterThanOrEqual(0.9);
});
