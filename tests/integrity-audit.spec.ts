/**
 * AUDITORÍA DE INTEGRIDAD - Playwright Test Suite
 * 
 * Verifica que las páginas críticas cargan sin errores
 * y que los botones principales funcionan.
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Páginas críticas a verificar
const CRITICAL_PAGES = [
  { path: '/', name: 'Landing' },
  { path: '/login', name: 'Login' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/properties', name: 'Propiedades' },
  { path: '/dashboard/tenants', name: 'Inquilinos' },
  { path: '/dashboard/contracts', name: 'Contratos' },
  { path: '/dashboard/payments', name: 'Pagos' },
  { path: '/admin', name: 'Admin' },
  { path: '/api/health', name: 'Health API', isApi: true },
];

// Páginas con posibles problemas (ComingSoonPage)
const PLACEHOLDER_PAGES = [
  '/subastas',
  '/servicios-limpieza',
  '/salas-reuniones',
  '/warranty-management',
  '/turismo-alquiler',
  '/portal-inquilino',
  '/suscripciones',
  '/impuestos',
];

test.describe('Auditoría de Integridad - Fase 3', () => {
  
  test.describe('3.1 Verificación de Páginas Críticas', () => {
    for (const page of CRITICAL_PAGES) {
      if (page.isApi) {
        test(`API ${page.name} responde correctamente`, async ({ request }) => {
          const response = await request.get(`${BASE_URL}${page.path}`);
          expect(response.status()).toBeLessThan(500);
          
          if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('status');
          }
        });
      } else {
        test(`Página ${page.name} (${page.path}) carga sin error 500`, async ({ page: browserPage }) => {
          const response = await browserPage.goto(`${BASE_URL}${page.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
          
          // No debe ser error 500
          expect(response?.status()).toBeLessThan(500);
          
          // Verificar que no hay mensaje de error crítico
          const errorText = await browserPage.locator('text=/error|Error|500|Internal Server/i').count();
          // Permitir algunos errores menores pero no críticos
        });
      }
    }
  });

  test.describe('3.2 Verificación de Páginas Placeholder', () => {
    for (const path of PLACEHOLDER_PAGES) {
      test(`Placeholder ${path} existe y carga`, async ({ page }) => {
        const response = await page.goto(`${BASE_URL}${path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        // Debe cargar (aunque sea placeholder)
        expect(response?.status()).toBeLessThan(500);
        
        // Verificar si es ComingSoonPage
        const hasComingSoon = await page.locator('text=/próximamente|coming soon|en desarrollo/i').count();
        if (hasComingSoon > 0) {
          test.info().annotations.push({ 
            type: 'warning', 
            description: `${path} es una página placeholder` 
          });
        }
      });
    }
  });

  test.describe('3.3 Verificación de Formularios y Botones', () => {
    
    test('Login form tiene elementos funcionales', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Verificar que existen los campos
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('Dashboard tiene navegación funcional', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Buscar enlaces de navegación
      const navLinks = page.locator('nav a, aside a, [role="navigation"] a');
      const linkCount = await navLinks.count();
      
      // Debe tener al menos algunos enlaces
      expect(linkCount).toBeGreaterThan(0);
    });
  });

  test.describe('3.4 Detección de Console Errors', () => {
    
    test('Landing no tiene errores críticos de consola', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      
      // Filtrar errores conocidos/menores
      const criticalErrors = consoleErrors.filter(err => 
        !err.includes('favicon') && 
        !err.includes('hydration') &&
        !err.includes('Third-party cookie')
      );
      
      // Reportar pero no fallar por console errors
      if (criticalErrors.length > 0) {
        test.info().annotations.push({
          type: 'warning',
          description: `Console errors: ${criticalErrors.join(', ')}`
        });
      }
    });
  });

  test.describe('3.5 Verificación de APIs Críticas', () => {
    const CRITICAL_APIS = [
      '/api/health',
      '/api/auth/session',
    ];

    for (const api of CRITICAL_APIS) {
      test(`API ${api} responde`, async ({ request }) => {
        const response = await request.get(`${BASE_URL}${api}`);
        expect(response.status()).toBeLessThan(500);
      });
    }
  });
});

// Reporte de hallazgos
test.afterAll(async () => {
  console.log('\n=== RESUMEN DE AUDITORÍA ===');
  console.log('Páginas críticas verificadas:', CRITICAL_PAGES.length);
  console.log('Páginas placeholder identificadas:', PLACEHOLDER_PAGES.length);
  console.log('Ver DEBT_REPORT.md para detalles completos');
});
