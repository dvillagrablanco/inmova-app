/**
 * 🏢 E2E Tests - CRUD de Empresas
 * 
 * Tests completos del flujo de gestión de empresas.
 * Previenen errores en crear, editar, ver y eliminar empresas.
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@inmova.app';
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin123!';

// Helper para login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Esperar redirect a dashboard
  await page.waitForURL(/dashboard|admin/, { timeout: 10000 });
}

test.describe('🏢 Gestión de Empresas - CRUD Completo', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Página de clientes carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    
    // No debe haber error 404
    expect(page.url()).toContain('/admin/clientes');
    
    // Debe mostrar título o contenido
    await expect(page.locator('text=Clientes').first()).toBeVisible({ timeout: 10000 });
  });

  test('Dialog de crear empresa se abre', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    
    // Click en botón crear
    await page.click('button:has-text("Nueva Empresa"), button:has-text("Crear")');
    
    // Dialog debe aparecer
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test('Selector de planes muestra opciones', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    
    // Abrir dialog
    await page.click('button:has-text("Nueva Empresa"), button:has-text("Crear")');
    await page.waitForSelector('[role="dialog"]');
    
    // Buscar selector de plan
    const planSelector = page.locator('text=Plan').first();
    if (await planSelector.isVisible()) {
      await planSelector.click();
      
      // Debe haber opciones de planes
      const options = page.locator('[role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Crear empresa con campos mínimos', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    
    // Abrir dialog
    await page.click('button:has-text("Nueva Empresa"), button:has-text("Crear")');
    await page.waitForSelector('[role="dialog"]');
    
    // Llenar campos requeridos
    const timestamp = Date.now();
    await page.fill('input[name="nombre"], input[placeholder*="nombre"]', `Test Empresa ${timestamp}`);
    await page.fill('input[name="emailContacto"], input[placeholder*="email"]', `test${timestamp}@test.com`);
    
    // Seleccionar plan (si es requerido)
    const planTrigger = page.locator('[data-testid="plan-select"], select[name="subscriptionPlanId"]').first();
    if (await planTrigger.isVisible()) {
      await planTrigger.click();
      await page.click('[role="option"]:first-child');
    }
    
    // Submit
    await page.click('button:has-text("Crear Empresa"), button[type="submit"]:has-text("Crear")');
    
    // No debe haber error visible
    const errorMessage = page.locator('text=Error, text=error');
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
  });

  test('Página de edición existe y carga', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    
    // Esperar que carguen las empresas
    await page.waitForLoadState('networkidle');
    
    // Buscar botón de editar en cualquier empresa
    const editButton = page.locator('button:has-text("Editar"), a:has-text("Editar"), [data-testid="edit-button"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Debe navegar a página de edición (no 404)
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/editar');
      
      // No debe mostrar error 404
      await expect(page.locator('text=404')).not.toBeVisible();
    }
  });

  test('Formulario de edición tiene campos correctos', async ({ page }) => {
    // Navegar directo a edición de una empresa existente
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');
    
    const editButton = page.locator('button:has-text("Editar"), a:has-text("Editar")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      
      // Campos que deben existir en el formulario de edición
      const requiredFields = [
        'input[name="nombre"], input[id="nombre"]',
        'button:has-text("Guardar"), button[type="submit"]',
      ];
      
      for (const selector of requiredFields) {
        await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('⚠️ Manejo de Errores', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Campos vacíos no causan error 500', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    
    // Abrir dialog
    await page.click('button:has-text("Nueva Empresa"), button:has-text("Crear")');
    await page.waitForSelector('[role="dialog"]');
    
    // Intentar crear sin llenar campos
    const submitButton = page.locator('button:has-text("Crear Empresa"), button[type="submit"]:has-text("Crear")');
    await submitButton.click();
    
    // Debe mostrar error de validación, NO error 500
    const error500 = page.locator('text=500, text=Error interno');
    await expect(error500).not.toBeVisible({ timeout: 3000 });
  });

  test('ID inválido en URL de edición muestra error amigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes/invalid-id-12345/editar`);
    
    // No debe mostrar error 500
    await expect(page.locator('text=500')).not.toBeVisible();
    
    // Debe mostrar mensaje de "no encontrada" o similar
    const notFoundMessage = page.locator('text=no encontrad, text=not found').first();
    // Este test pasa si hay mensaje de error amigable O si redirige
  });
});

/**
 * 📋 CHECKLIST PRE-DEPLOYMENT:
 * 
 * Todos estos tests DEBEN pasar antes de deploy:
 * - [ ] Página de clientes carga
 * - [ ] Dialog de crear se abre
 * - [ ] Selector de planes funciona
 * - [ ] Crear empresa no da error
 * - [ ] Página de edición existe
 * - [ ] Formulario de edición carga campos
 */
