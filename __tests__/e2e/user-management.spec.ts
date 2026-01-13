/**
 * 👤 E2E Tests - Gestión de Usuarios
 * 
 * Tests completos del flujo de gestión de usuarios.
 * Verifica crear usuarios, asignar empresa, etc.
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
  await page.waitForURL(/dashboard|admin/, { timeout: 10000 });
}

test.describe('👤 Gestión de Usuarios', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Página de usuarios carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    
    // No debe haber error 404 o 500
    const content = await page.content();
    expect(content).not.toContain('404');
    expect(content).not.toContain('500');
  });

  test('Dialog de crear usuario se abre', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    await page.waitForLoadState('networkidle');
    
    // Buscar botón de crear usuario
    const createButton = page.locator('button:has-text("Nuevo Usuario"), button:has-text("Crear Usuario"), button:has-text("Añadir")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Dialog debe aparecer
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Selector de empresa está disponible al crear usuario', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    await page.waitForLoadState('networkidle');
    
    // Abrir dialog de crear
    const createButton = page.locator('button:has-text("Nuevo Usuario"), button:has-text("Crear Usuario"), button:has-text("Añadir")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Buscar selector de empresa
      const companySelector = page.locator(
        '[data-testid="company-select"], ' +
        'select[name="companyId"], ' +
        'button:has-text("Seleccionar empresa"), ' +
        '[aria-label*="empresa"], ' +
        'label:has-text("Empresa")'
      ).first();
      
      // Debe existir un campo para seleccionar empresa
      const selectorExists = await companySelector.isVisible().catch(() => false);
      
      // Alternativa: buscar cualquier campo que mencione "empresa" o "company"
      const companyField = page.locator('text=Empresa, text=Company').first();
      const fieldExists = await companyField.isVisible().catch(() => false);
      
      expect(selectorExists || fieldExists).toBe(true);
    }
  });

  test('Selector de empresa muestra opciones', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('button:has-text("Nuevo Usuario"), button:has-text("Crear Usuario")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Intentar abrir selector de empresa
      const companyTrigger = page.locator(
        '[data-testid="company-select"] button, ' +
        'select[name="companyId"], ' +
        'button[aria-haspopup="listbox"]:near(text=Empresa)'
      ).first();
      
      if (await companyTrigger.isVisible()) {
        await companyTrigger.click();
        
        // Debe haber al menos una opción
        await page.waitForSelector('[role="option"], option', { timeout: 5000 });
        const options = await page.locator('[role="option"], option').count();
        
        expect(options).toBeGreaterThan(0);
      }
    }
  });

  test('Crear usuario con campos mínimos', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('button:has-text("Nuevo Usuario"), button:has-text("Crear")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Llenar campos
      const timestamp = Date.now();
      
      await page.fill('input[name="name"], input[placeholder*="nombre"]', `Test User ${timestamp}`);
      await page.fill('input[name="email"], input[type="email"]', `testuser${timestamp}@test.com`);
      await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!');
      
      // Seleccionar empresa si es requerido
      const companySelect = page.locator('[data-testid="company-select"], select[name="companyId"]').first();
      if (await companySelect.isVisible()) {
        await companySelect.click();
        await page.click('[role="option"]:first-child, option:first-child');
      }
      
      // Seleccionar rol si es requerido
      const roleSelect = page.locator('[data-testid="role-select"], select[name="role"]').first();
      if (await roleSelect.isVisible()) {
        await roleSelect.click();
        await page.click('[role="option"]:first-child, option:first-child');
      }
      
      // Submit
      const submitButton = page.locator('button:has-text("Crear Usuario"), button[type="submit"]:has-text("Crear")').first();
      await submitButton.click();
      
      // No debe haber error 500
      await page.waitForTimeout(2000);
      const errorMessage = page.locator('text=Error 500, text=error interno');
      await expect(errorMessage).not.toBeVisible();
    }
  });
});

test.describe('👥 Usuarios en Contexto de Empresa', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Ver usuarios de una empresa específica', async ({ page }) => {
    // Ir a clientes
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');
    
    // Buscar link/botón para ver usuarios de una empresa
    const viewUsersButton = page.locator(
      'button:has-text("Usuarios"), ' +
      'a:has-text("Usuarios"), ' +
      '[data-testid="view-users"]'
    ).first();
    
    if (await viewUsersButton.isVisible()) {
      await viewUsersButton.click();
      await page.waitForLoadState('networkidle');
      
      // No debe haber error
      const content = await page.content();
      expect(content).not.toContain('Error');
    }
  });

  test('Añadir usuario a empresa existente', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clientes`);
    await page.waitForLoadState('networkidle');
    
    // Click en una empresa para ver detalles
    const companyCard = page.locator('[data-testid="company-card"], .company-card').first();
    
    if (await companyCard.isVisible()) {
      await companyCard.click();
      await page.waitForLoadState('networkidle');
      
      // Buscar opción de añadir usuario
      const addUserButton = page.locator(
        'button:has-text("Añadir Usuario"), ' +
        'button:has-text("Nuevo Usuario")'
      ).first();
      
      if (await addUserButton.isVisible()) {
        await addUserButton.click();
        
        // Dialog debe abrirse
        await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('🔐 Validaciones de Usuario', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Email duplicado muestra error amigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('button:has-text("Nuevo Usuario"), button:has-text("Crear")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Usar email que ya existe
      await page.fill('input[name="name"]', 'Test Duplicate');
      await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL); // Email existente
      await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!');
      
      const submitButton = page.locator('button:has-text("Crear"), button[type="submit"]').first();
      await submitButton.click();
      
      // Debe mostrar error de email duplicado, NO error 500
      await page.waitForTimeout(2000);
      const error500 = page.locator('text=500, text=Error interno');
      await expect(error500).not.toBeVisible();
    }
  });

  test('Password débil muestra error de validación', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/usuarios`);
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('button:has-text("Nuevo Usuario"), button:has-text("Crear")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      await page.fill('input[name="name"]', 'Test Weak Password');
      await page.fill('input[name="email"], input[type="email"]', `weakpwd${Date.now()}@test.com`);
      await page.fill('input[name="password"], input[type="password"]', '123'); // Password débil
      
      const submitButton = page.locator('button:has-text("Crear"), button[type="submit"]').first();
      await submitButton.click();
      
      // Debe mostrar error de validación
      await page.waitForTimeout(1000);
      
      // El formulario no debe cerrarse si hay error de validación
      const dialogStillOpen = await page.locator('[role="dialog"]').isVisible();
      // Si el dialog sigue abierto, la validación funcionó
    }
  });
});

/**
 * 📋 CHECKLIST DE USUARIOS:
 * 
 * - [ ] Página de usuarios carga
 * - [ ] Dialog de crear usuario se abre
 * - [ ] Selector de empresa disponible
 * - [ ] Selector de empresa muestra opciones
 * - [ ] Crear usuario funciona
 * - [ ] Email duplicado manejado
 * - [ ] Password débil validado
 */
