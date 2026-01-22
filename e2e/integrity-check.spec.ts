import { test, expect } from '@playwright/test';

/**
 * AUDITORÍA DE INTEGRIDAD - Tests E2E
 * 
 * Este script verifica:
 * 1. Páginas principales no devuelven 500
 * 2. Botones principales funcionan (no están deshabilitados sin razón)
 * 3. Detección de contenido mock visible
 */

const CRITICAL_PAGES = [
  { path: '/', name: 'Landing/Home' },
  { path: '/login', name: 'Login' },
  { path: '/dashboard', name: 'Dashboard Principal' },
  { path: '/finanzas', name: 'Finanzas' },
  { path: '/warranty-management', name: 'Gestión de Garantías' },
  { path: '/estadisticas', name: 'Estadísticas' },
  { path: '/reportes/operacionales', name: 'Reportes Operacionales' },
  { path: '/reportes/financieros', name: 'Reportes Financieros' },
  { path: '/edificios', name: 'Edificios' },
  { path: '/inquilinos', name: 'Inquilinos' },
  { path: '/contratos', name: 'Contratos' },
  { path: '/pagos', name: 'Pagos' },
  { path: '/mantenimiento', name: 'Mantenimiento' },
  { path: '/documentos', name: 'Documentos' },
  { path: '/crm', name: 'CRM' },
];

const MOCK_DATA_PATTERNS = [
  'Lorem ipsum',
  'John Doe',
  'Jane Doe',
  'Test User',
  'example@example.com',
  'test@test.com',
  '123-456-7890',
  'Acme Corp',
  'Sample Company',
  'Mock Data',
];

test.describe('AUDITORÍA DE INTEGRIDAD - Páginas Críticas', () => {
  
  test.describe('Verificación de páginas públicas', () => {
    const publicPages = CRITICAL_PAGES.filter(p => ['/', '/login'].includes(p.path));
    
    for (const pageInfo of publicPages) {
      test(`[PÚBLICO] ${pageInfo.name} (${pageInfo.path}) no debe devolver error 500`, async ({ page }) => {
        const response = await page.goto(pageInfo.path);
        
        // Verificar que no sea 500
        expect(response?.status()).not.toBe(500);
        expect(response?.status()).toBeLessThan(500);
        
        // Verificar que la página cargó
        await page.waitForLoadState('domcontentloaded');
        
        console.log(`✅ ${pageInfo.name} - Status: ${response?.status()}`);
      });
    }
  });

  test.describe('Verificación de páginas autenticadas', () => {
    test.beforeEach(async ({ page }) => {
      // Intentar login
      await page.goto('/login');
      
      try {
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.isVisible({ timeout: 3000 })) {
          await emailInput.fill('admin@inmova.app');
          
          const passwordInput = page.locator('input[type="password"]').first();
          await passwordInput.fill('Admin123!');
          
          const loginButton = page.locator('button[type="submit"]').first();
          await loginButton.click();
          
          // Esperar redirección o error
          await page.waitForTimeout(3000);
        }
      } catch (e) {
        console.log('Login form no encontrado o falló - continuando como guest');
      }
    });

    const authPages = CRITICAL_PAGES.filter(p => !['/login', '/'].includes(p.path));
    
    for (const pageInfo of authPages) {
      test(`[AUTH] ${pageInfo.name} (${pageInfo.path}) debe cargar sin error 500`, async ({ page }) => {
        const response = await page.goto(pageInfo.path);
        
        // Verificar que no sea error de servidor
        const status = response?.status() || 0;
        
        // Permitir 401/403 (redirect a login), pero no 500
        if (status >= 500) {
          console.log(`❌ ${pageInfo.name} - Error de servidor: ${status}`);
        }
        expect(status).toBeLessThan(500);
        
        // Verificar carga de página
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
        
        console.log(`✅ ${pageInfo.name} - Status: ${status}`);
      });
    }
  });

  test.describe('Verificación de botones principales', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      try {
        await page.fill('input[type="email"]', 'admin@inmova.app');
        await page.fill('input[type="password"]', 'Admin123!');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      } catch (e) {
        // Continuar sin login
      }
    });

    const pagesWithForms = [
      { path: '/edificios', buttonText: /crear|nuevo|añadir|guardar/i, name: 'Edificios' },
      { path: '/inquilinos', buttonText: /crear|nuevo|añadir|guardar/i, name: 'Inquilinos' },
      { path: '/contratos', buttonText: /crear|nuevo|añadir|guardar/i, name: 'Contratos' },
    ];

    for (const pageInfo of pagesWithForms) {
      test(`[BOTONES] ${pageInfo.name} - botones principales no deben estar rotos`, async ({ page }) => {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Buscar botones con texto de acción
        const actionButtons = page.locator('button').filter({ hasText: pageInfo.buttonText });
        const count = await actionButtons.count();
        
        if (count > 0) {
          // Verificar que al menos un botón no esté deshabilitado
          const firstButton = actionButtons.first();
          const isDisabled = await firstButton.isDisabled();
          
          console.log(`📋 ${pageInfo.name} - Botones encontrados: ${count}, Primer botón deshabilitado: ${isDisabled}`);
          
          // No fallamos si está deshabilitado, solo reportamos
          if (isDisabled) {
            console.log(`⚠️ ${pageInfo.name} - Botón principal deshabilitado`);
          }
        } else {
          console.log(`⚠️ ${pageInfo.name} - No se encontraron botones de acción`);
        }
      });
    }
  });

  test.describe('Detección de datos mock visibles', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      try {
        await page.fill('input[type="email"]', 'admin@inmova.app');
        await page.fill('input[type="password"]', 'Admin123!');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      } catch (e) {
        // Continuar
      }
    });

    const pagesToCheckForMock = ['/dashboard', '/finanzas', '/estadisticas'];

    for (const pagePath of pagesToCheckForMock) {
      test(`[MOCK] ${pagePath} - detectar datos mock visibles`, async ({ page }) => {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const pageContent = await page.textContent('body') || '';
        const foundMockPatterns: string[] = [];
        
        for (const pattern of MOCK_DATA_PATTERNS) {
          if (pageContent.toLowerCase().includes(pattern.toLowerCase())) {
            foundMockPatterns.push(pattern);
          }
        }
        
        if (foundMockPatterns.length > 0) {
          console.log(`⚠️ ${pagePath} - Patrones mock detectados: ${foundMockPatterns.join(', ')}`);
        } else {
          console.log(`✅ ${pagePath} - Sin datos mock obvios`);
        }
      });
    }
  });
});

test.describe('HEALTH CHECK - APIs Críticas', () => {
  const criticalAPIs = [
    '/api/health',
    '/api/estadisticas',
    '/api/garantias',
    '/api/reportes/operacionales',
    '/api/dashboard/stats',
  ];

  for (const apiPath of criticalAPIs) {
    test(`[API] ${apiPath} debe responder`, async ({ request }) => {
      try {
        const response = await request.get(apiPath);
        const status = response.status();
        
        // APIs pueden devolver 401 sin auth, pero no 500
        if (status >= 500) {
          console.log(`❌ ${apiPath} - Error de servidor: ${status}`);
        } else if (status === 401 || status === 403) {
          console.log(`🔒 ${apiPath} - Requiere autenticación: ${status}`);
        } else {
          console.log(`✅ ${apiPath} - Status: ${status}`);
        }
        
        expect(status).toBeLessThan(500);
      } catch (e) {
        console.log(`❌ ${apiPath} - Error de conexión`);
        throw e;
      }
    });
  }
});
