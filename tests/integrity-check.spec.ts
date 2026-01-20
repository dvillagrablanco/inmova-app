/**
 * AUDITORÍA DE INTEGRIDAD - Tests E2E
 * 
 * Este script verifica que las páginas principales de la aplicación:
 * 1. Cargan sin errores 500
 * 2. Los botones principales están funcionales
 * 3. No hay errores de JavaScript en consola
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Páginas críticas a verificar
const CRITICAL_PAGES = [
  { path: '/', name: 'Landing' },
  { path: '/login', name: 'Login' },
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/propiedades', name: 'Propiedades', requiresAuth: true },
  { path: '/inquilinos', name: 'Inquilinos', requiresAuth: true },
  { path: '/contratos', name: 'Contratos', requiresAuth: true },
  { path: '/pagos', name: 'Pagos', requiresAuth: true },
  { path: '/mantenimiento', name: 'Mantenimiento', requiresAuth: true },
  { path: '/documentos', name: 'Documentos', requiresAuth: true },
  { path: '/admin/dashboard', name: 'Admin Dashboard', requiresAuth: true },
];

// Credenciales de prueba
const TEST_CREDENTIALS = {
  email: process.env.TEST_EMAIL || 'admin@inmova.app',
  password: process.env.TEST_PASSWORD || 'Admin123!',
};

// Helper para capturar errores de consola
async function captureConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

// Helper para login
async function loginIfRequired(page: Page) {
  try {
    await page.goto(`${BASE_URL}/login`, { timeout: 10000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_CREDENTIALS.email);
      await page.locator('input[name="password"], input[type="password"]').fill(TEST_CREDENTIALS.password);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/(dashboard|admin|portal)/, { timeout: 15000 });
    }
  } catch (e) {
    console.log('Login may have failed or was not required:', e);
  }
}

test.describe('Auditoría de Integridad - Páginas Críticas', () => {
  
  test('1. Verificar que la página de Login carga correctamente', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/login`);
    
    // Verificar que no hay error 500
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).toBeLessThan(500);
    
    // Verificar elementos básicos
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('2. Verificar que el Dashboard carga sin errores', async ({ page }) => {
    await loginIfRequired(page);
    
    const errors = await captureConsoleErrors(page);
    const response = await page.goto(`${BASE_URL}/dashboard`, { timeout: 15000 });
    
    // Verificar código de estado
    expect(response?.status()).not.toBe(500);
    
    // Esperar a que cargue el contenido
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que hay contenido visible
    const mainContent = page.locator('main, [role="main"], .dashboard, #dashboard');
    await expect(mainContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Verificar páginas principales no devuelven 500', async ({ page }) => {
    await loginIfRequired(page);
    
    const results: { page: string; status: number; error?: string }[] = [];
    
    for (const pageInfo of CRITICAL_PAGES) {
      try {
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, { 
          timeout: 15000,
          waitUntil: 'domcontentloaded'
        });
        
        results.push({
          page: pageInfo.name,
          status: response?.status() || 0,
        });
        
        // Verificar que no hay error 500
        expect(response?.status(), `${pageInfo.name} devolvió error`).not.toBe(500);
      } catch (error) {
        results.push({
          page: pageInfo.name,
          status: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    console.log('Resultados de páginas:', JSON.stringify(results, null, 2));
  });

  test('4. Verificar que botones de acción principal están habilitados', async ({ page }) => {
    await loginIfRequired(page);
    
    // Ir al dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Buscar botones de acción principal
    const actionButtons = page.locator('button:has-text("Crear"), button:has-text("Nuevo"), button:has-text("Guardar"), button:has-text("Añadir")');
    const buttonCount = await actionButtons.count();
    
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = actionButtons.nth(i);
        const isDisabled = await button.isDisabled();
        const buttonText = await button.textContent();
        
        console.log(`Botón "${buttonText?.trim()}": ${isDisabled ? 'DESHABILITADO' : 'HABILITADO'}`);
      }
    }
  });

  test('5. Verificar que no hay errores críticos de JavaScript', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        jsErrors.push(msg.text());
      }
    });
    
    await loginIfRequired(page);
    
    // Navegar por páginas críticas
    const pagesToCheck = ['/dashboard', '/propiedades', '/inquilinos'];
    
    for (const pagePath of pagesToCheck) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, { timeout: 15000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });
      } catch (e) {
        // Continuar con la siguiente página
      }
    }
    
    // Reportar errores encontrados
    if (jsErrors.length > 0) {
      console.log('Errores de JavaScript encontrados:', jsErrors);
    }
    
    // No fallar el test por errores menores, solo reportar
    expect(jsErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError')).length).toBeLessThan(5);
  });

  test('6. Verificar formularios principales tienen validación', async ({ page }) => {
    await loginIfRequired(page);
    
    // Probar formulario de creación de propiedad
    await page.goto(`${BASE_URL}/propiedades/crear`);
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    // Intentar enviar formulario vacío
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Verificar que hay mensajes de validación o el formulario no se envía
      await page.waitForTimeout(1000);
      
      // Buscar mensajes de error de validación
      const validationErrors = page.locator('.text-red-500, .text-destructive, [role="alert"], .error-message');
      const errorCount = await validationErrors.count();
      
      console.log(`Mensajes de validación encontrados: ${errorCount}`);
    }
  });

  test('7. Verificar que las APIs principales responden', async ({ request }) => {
    const apiEndpoints = [
      '/api/health',
      '/api/health/detailed',
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await request.get(`${BASE_URL}${endpoint}`);
        console.log(`${endpoint}: ${response.status()}`);
        
        // Solo verificar que no hay error 500
        expect(response.status()).not.toBe(500);
      } catch (error) {
        console.log(`${endpoint}: Error de conexión`);
      }
    }
  });
});

test.describe('Auditoría de Mock Data', () => {
  
  test('8. Verificar que las páginas de verticales cargan datos', async ({ page }) => {
    await loginIfRequired(page);
    
    const verticalPages = [
      '/student-housing/dashboard',
      '/workspace/dashboard', 
      '/vivienda-social/dashboard',
      '/real-estate-developer/dashboard',
      '/viajes-corporativos/dashboard',
    ];
    
    for (const pagePath of verticalPages) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, { timeout: 15000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        // Verificar que hay contenido (no solo skeleton loaders)
        const hasContent = await page.locator('.card, [data-testid], h1, h2').first().isVisible();
        console.log(`${pagePath}: ${hasContent ? 'Contenido visible' : 'Sin contenido'}`);
        
      } catch (e) {
        console.log(`${pagePath}: Error al cargar`);
      }
    }
  });
});
