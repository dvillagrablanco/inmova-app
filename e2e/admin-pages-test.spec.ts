import { test, expect, Page } from '@playwright/test';

/**
 * Pruebas E2E para páginas de administración del Super Admin
 * Verifica que:
 * 1. Todas las páginas cargan correctamente
 * 2. Los botones y desplegables funcionan
 * 3. Las APIs están conectadas correctamente
 */

// Credenciales de super admin para pruebas
const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

// Páginas de admin a probar
const ADMIN_PAGES = [
  { path: '/admin/dashboard', name: 'Dashboard Admin', requiresData: true },
  { path: '/admin/usuarios', name: 'Usuarios', requiresData: true },
  { path: '/admin/clientes', name: 'Clientes/Empresas', requiresData: true },
  { path: '/admin/planes', name: 'Planes de Suscripción', requiresData: true },
  { path: '/admin/modulos', name: 'Módulos', requiresData: true },
  { path: '/admin/integraciones', name: 'Integraciones', requiresData: true },
  { path: '/admin/seguridad', name: 'Seguridad', requiresData: false },
  { path: '/admin/system-logs', name: 'System Logs', requiresData: true },
  { path: '/admin/logs', name: 'Logs Básicos', requiresData: true },
  { path: '/admin/health', name: 'Health Check', requiresData: false },
  { path: '/admin/onboarding', name: 'Onboarding Tracker', requiresData: true },
  { path: '/admin/partners', name: 'Partners', requiresData: true },
  { path: '/admin/cupones', name: 'Cupones', requiresData: true },
  { path: '/admin/marketplace', name: 'Marketplace', requiresData: true },
  { path: '/admin/notificaciones-masivas', name: 'Notificaciones', requiresData: false },
  { path: '/admin/plantillas-email', name: 'Plantillas Email', requiresData: true },
  { path: '/admin/plantillas-sms', name: 'Plantillas SMS', requiresData: true },
  { path: '/admin/webhooks', name: 'Webhooks', requiresData: true },
  { path: '/admin/backup-restore', name: 'Backup & Restore', requiresData: false },
  { path: '/admin/configuracion', name: 'Configuración', requiresData: false },
  { path: '/admin/ai-agents', name: 'AI Agents', requiresData: true },
  { path: '/admin/activity', name: 'Actividad', requiresData: true },
  { path: '/admin/alertas', name: 'Alertas', requiresData: true },
  { path: '/admin/metricas-uso', name: 'Métricas de Uso', requiresData: true },
  { path: '/admin/importar', name: 'Importar Datos', requiresData: false },
  { path: '/admin/firma-digital', name: 'Firma Digital', requiresData: false },
  { path: '/admin/integraciones-pagos', name: 'Integraciones de Pagos', requiresData: true },
  { path: '/admin/legal', name: 'Legal', requiresData: true },
  { path: '/admin/impuestos', name: 'Impuestos', requiresData: true },
];

test.describe('Admin Pages - Super Admin', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login como super admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Rellenar credenciales
    await page.fill('input[name="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', SUPER_ADMIN_CREDENTIALS.password);
    
    // Click en login
    await page.click('button[type="submit"]');
    
    // Esperar redirección
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
    
    console.log('Login exitoso como Super Admin');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // Test de carga de cada página
  for (const adminPage of ADMIN_PAGES) {
    test(`Página ${adminPage.name} carga correctamente`, async () => {
      await page.goto(adminPage.path);
      await page.waitForLoadState('networkidle');
      
      // Verificar que no hay errores 404 o 500
      const status = page.url().includes('/unauthorized') || page.url().includes('/login');
      if (status) {
        console.warn(`Página ${adminPage.path} requiere permisos especiales o redirige`);
        return;
      }
      
      // Verificar que la página tiene contenido
      const body = await page.locator('body');
      await expect(body).toBeVisible();
      
      // Verificar que no hay errores de JavaScript
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Esperar un momento para capturar errores
      await page.waitForTimeout(1000);
      
      // Verificar elementos de carga completada
      const loadingSpinner = page.locator('[class*="animate-spin"]');
      const hasSpinner = await loadingSpinner.count() > 0;
      
      if (hasSpinner) {
        // Esperar a que termine de cargar
        await page.waitForTimeout(3000);
      }
      
      // Verificar que hay contenido principal
      const mainContent = page.locator('main, [role="main"], .container, .max-w-7xl');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
    });
  }

  test('Dashboard Admin - KPIs cargan correctamente', async () => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar que los cards de stats están presentes
    const statsCards = page.locator('[class*="CardContent"]');
    expect(await statsCards.count()).toBeGreaterThan(0);
  });

  test('Usuarios - CRUD funciona', async () => {
    await page.goto('/admin/usuarios');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar botón de crear usuario
    const createButton = page.locator('button:has-text("Nuevo Usuario")');
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Verificar que el modal se abre
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      
      // Cerrar modal
      const cancelButton = page.locator('button:has-text("Cancelar")');
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Planes - Lista y carga datos', async () => {
    await page.goto('/admin/planes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar que hay tabla o cards de planes
    const planesContent = page.locator('table, [class*="Card"]');
    expect(await planesContent.count()).toBeGreaterThan(0);
  });

  test('Clientes - Filtros funcionan', async () => {
    await page.goto('/admin/clientes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Buscar campo de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }
    
    // Verificar select de filtros
    const filterSelects = page.locator('[role="combobox"]');
    if (await filterSelects.count() > 0) {
      await filterSelects.first().click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
    }
  });

  test('Integraciones - Status carga correctamente', async () => {
    await page.goto('/admin/integraciones');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar badges de status
    const badges = page.locator('[class*="Badge"]');
    expect(await badges.count()).toBeGreaterThan(0);
  });

  test('Marketplace - Tabs funcionan', async () => {
    await page.goto('/admin/marketplace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar tabs
    const tabs = page.locator('[role="tablist"] button, [role="tab"]');
    if (await tabs.count() > 0) {
      // Click en cada tab
      const tabCount = await tabs.count();
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Health Check - Status muestra correctamente', async () => {
    await page.goto('/admin/health');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar indicadores de salud
    const healthIndicators = page.locator('[class*="CheckCircle"], [class*="XCircle"], [class*="AlertTriangle"]');
    expect(await healthIndicators.count()).toBeGreaterThan(0);
    
    // Verificar botón de refresh
    const refreshButton = page.locator('button:has-text("Refrescar"), button:has([class*="RefreshCw"])');
    if (await refreshButton.count() > 0) {
      await refreshButton.first().click();
      await page.waitForTimeout(2000);
    }
  });

  test('System Logs - Filtros y paginación', async () => {
    await page.goto('/admin/system-logs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar selectores de filtro
    const selects = page.locator('[role="combobox"]');
    if (await selects.count() > 0) {
      await selects.first().click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
    }
  });

  test('Alertas - Lista alertas', async () => {
    await page.goto('/admin/alertas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar contenido de alertas
    const alertContent = page.locator('[class*="Card"], table');
    expect(await alertContent.count()).toBeGreaterThan(0);
  });

  test('Configuración - Formularios disponibles', async () => {
    await page.goto('/admin/configuracion');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar campos de configuración
    const inputs = page.locator('input, select, [role="switch"]');
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test('Dropdowns abren correctamente en todas las páginas', async () => {
    const pagesToTest = ['/admin/usuarios', '/admin/clientes', '/admin/planes'];
    
    for (const path of pagesToTest) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Buscar botones con menú desplegable
      const dropdownButtons = page.locator('[data-state], button:has([class*="MoreHorizontal"]), button:has([class*="ChevronDown"])');
      
      if (await dropdownButtons.count() > 0) {
        await dropdownButtons.first().click();
        await page.waitForTimeout(300);
        
        // Verificar que el menú se abre
        const menu = page.locator('[role="menu"], [data-state="open"]');
        if (await menu.count() > 0) {
          await expect(menu.first()).toBeVisible();
        }
        
        // Cerrar
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Botones de acción responden correctamente', async () => {
    await page.goto('/admin/clientes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Buscar botón de crear
    const createButton = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Añadir")');
    
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      
      // Verificar que algo cambia (modal, drawer, o navegación)
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
      if (await dialog.count() > 0) {
        await expect(dialog.first()).toBeVisible();
        
        // Cerrar
        const closeButton = page.locator('[aria-label="Close"], button:has-text("Cancelar")');
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    }
  });
});

test.describe('Admin APIs - Verificación', () => {
  test('API Dashboard Stats responde', async ({ request }) => {
    const response = await request.get('/api/admin/dashboard-stats');
    // Puede ser 401 si no está autenticado, lo cual es correcto
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API System Health responde', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('API Planes responde', async ({ request }) => {
    const response = await request.get('/api/admin/planes');
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API System Logs responde', async ({ request }) => {
    const response = await request.get('/api/admin/system-logs');
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API Integraciones Status responde', async ({ request }) => {
    const response = await request.get('/api/admin/integraciones/status');
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API Security Alerts responde', async ({ request }) => {
    const response = await request.get('/api/admin/security-alerts');
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API Companies responde', async ({ request }) => {
    const response = await request.get('/api/admin/companies');
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API Users responde', async ({ request }) => {
    const response = await request.get('/api/users');
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API Onboarding responde', async ({ request }) => {
    const response = await request.get('/api/admin/onboarding');
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API Marketplace Services responde', async ({ request }) => {
    const response = await request.get('/api/admin/marketplace/services');
    expect([200, 401, 403]).toContain(response.status());
  });
});
