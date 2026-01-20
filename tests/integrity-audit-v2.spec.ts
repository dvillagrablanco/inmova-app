/**
 * AUDITORÍA DE INTEGRIDAD V2 - Playwright Test Suite
 * 
 * Verifica que las páginas críticas cargan sin errores
 * Fecha: 20 Enero 2026
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Páginas críticas del sistema
const CRITICAL_PAGES = [
  { path: '/', name: 'Landing' },
  { path: '/login', name: 'Login' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/properties', name: 'Propiedades' },
  { path: '/dashboard/tenants', name: 'Inquilinos' },
  { path: '/dashboard/contracts', name: 'Contratos' },
  { path: '/dashboard/payments', name: 'Pagos' },
  { path: '/finanzas/conciliacion', name: 'Conciliación Bancaria' },
  { path: '/estadisticas', name: 'Estadísticas' },
  { path: '/planificacion', name: 'Planificación' },
];

// APIs críticas
const CRITICAL_APIS = [
  '/api/health',
  '/api/auth/session',
  '/api/finanzas/conciliacion',
  '/api/estadisticas',
  '/api/planificacion',
];

// Páginas placeholder conocidas (no deberían dar error 500)
const PLACEHOLDER_PAGES = [
  '/subastas',
  '/servicios-limpieza',
  '/salas-reuniones',
  '/warranty-management',
  '/portal-inquilino',
  '/suscripciones',
  '/impuestos',
];

test.describe('Auditoría de Integridad V2 - 20 Enero 2026', () => {
  
  test.describe('FASE 1: Páginas Críticas No Dan Error 500', () => {
    for (const page of CRITICAL_PAGES) {
      test(`${page.name} (${page.path}) carga correctamente`, async ({ page: browserPage }) => {
        const response = await browserPage.goto(`${BASE_URL}${page.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        // No debe ser error 500
        expect(response?.status()).toBeLessThan(500);
      });
    }
  });

  test.describe('FASE 2: APIs Críticas Responden', () => {
    for (const api of CRITICAL_APIS) {
      test(`API ${api} responde`, async ({ request }) => {
        const response = await request.get(`${BASE_URL}${api}`);
        expect(response.status()).toBeLessThan(500);
      });
    }
  });

  test.describe('FASE 3: Páginas Placeholder No Crashean', () => {
    for (const path of PLACEHOLDER_PAGES) {
      test(`Placeholder ${path} no da error 500`, async ({ page }) => {
        const response = await page.goto(`${BASE_URL}${path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        expect(response?.status()).toBeLessThan(500);
      });
    }
  });

  test.describe('FASE 4: Formularios Básicos', () => {
    
    test('Login tiene campos funcionales', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('FASE 5: Health Check Completo', () => {
    
    test('Health API retorna status healthy', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`);
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.status).toBe('healthy');
    });
  });
});
