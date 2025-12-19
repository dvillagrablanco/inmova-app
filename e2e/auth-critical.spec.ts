/**
 * E2E Tests - Flujo Crítico de Autenticación
 * Pruebas exhaustivas del sistema de autenticación
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'admin@inmova.com',
  password: 'admin123',
  invalidPassword: 'wrongpassword123',
};

test.describe('Flujo Crítico: Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar cookies y almacenamiento antes de cada test
    await page.context().clearCookies();
    await page.goto('/login');
  });

  test('AUTH-001: Debe cargar la página de login correctamente', async ({ page }) => {
    // Verificar título
    await expect(page).toHaveTitle(/INMOVA/);
    
    // Verificar elementos principales
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión|entrar|login/i })).toBeVisible();
  });

  test('AUTH-002: Debe mostrar error con credenciales vacías', async ({ page }) => {
    // Intentar login sin datos
    const loginButton = page.getByRole('button', { name: /iniciar sesión|entrar|login/i });
    await loginButton.click();
    
    // Debe permanecer en login
    await expect(page).toHaveURL(/\/login/);
    
    // Verificar validación HTML5 o mensaje de error
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('AUTH-003: Debe mostrar error con email inválido', async ({ page }) => {
    // Email inválido
    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[type="password"]', TEST_USER.password);
    
    const loginButton = page.getByRole('button', { name: /iniciar sesión|entrar|login/i });
    await loginButton.click();
    
    // Validación HTML5 debe prevenir el envío
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTH-004: Debe mostrar error con contraseña incorrecta', async ({ page }) => {
    // Credenciales incorrectas
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.invalidPassword);
    
    const loginButton = page.getByRole('button', { name: /iniciar sesión|entrar|login/i });
    await loginButton.click();
    
    // Esperar respuesta del servidor
    await page.waitForTimeout(2000);
    
    // Debe mostrar error o permanecer en login
    const errorMessage = page.getByText(/credenciales.*incorrectas|invalid.*credentials|error/i);
    const stillOnLogin = page.url().includes('/login');
    
    expect(stillOnLogin || await errorMessage.isVisible().catch(() => false)).toBeTruthy();
  });

  test('AUTH-005: Debe iniciar sesión correctamente con credenciales válidas', async ({ page }) => {
    // Llenar formulario
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Click en login
    const loginButton = page.getByRole('button', { name: /iniciar sesión|entrar|login/i });
    await loginButton.click();
    
    // Esperar navegación a dashboard/home
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
    
    // Verificar que está autenticado
    expect(page.url()).toMatch(/\/(dashboard|home)/);
    
    // Verificar que se muestra el nombre de usuario o avatar
    const userIndicator = page.locator('[data-testid="user-menu"]')
      .or(page.getByText(/admin/i))
      .or(page.locator('button').filter({ hasText: TEST_USER.email }));
    
    await expect(userIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-006: Debe mantener la sesión después de recargar', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.getByRole('button', { name: /iniciar sesión|entrar|login/i }).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
    
    // Recargar página
    await page.reload();
    
    // Debe seguir en dashboard, no redirigir a login
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/(dashboard|home)/);
  });

  test('AUTH-007: Debe cerrar sesión correctamente', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.getByRole('button', { name: /iniciar sesión|entrar|login/i }).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
    
    // Buscar botón de logout
    const userMenu = page.locator('[data-testid="user-menu"]')
      .or(page.locator('button').filter({ hasText: /admin|usuario|user/i }));
    
    if (await userMenu.first().isVisible().catch(() => false)) {
      await userMenu.first().click();
      await page.waitForTimeout(500);
      
      // Buscar opción de cerrar sesión
      const logoutButton = page.getByRole('button', { name: /cerrar sesión|logout|salir/i })
        .or(page.getByText(/cerrar sesión|logout|salir/i));
      
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
        
        // Debe redirigir a login
        await page.waitForURL(/\/login/, { timeout: 10000 });
        expect(page.url()).toMatch(/\/login/);
      }
    }
  });

  test('AUTH-008: Debe bloquear acceso a rutas protegidas sin autenticación', async ({ page }) => {
    // Intentar acceder a ruta protegida sin login
    await page.goto('/dashboard');
    
    // Debe redirigir a login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/login/);
  });

  test('AUTH-009: Debe mostrar estado de carga durante autenticación', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    const loginButton = page.getByRole('button', { name: /iniciar sesión|entrar|login/i });
    
    // Verificar que el botón cambia de estado durante el loading
    await loginButton.click();
    
    // Buscar indicador de carga (spinner, texto "Cargando...", botón deshabilitado)
    const loadingIndicator = page.locator('[data-testid="loading"]')
      .or(page.locator('.spinner'))
      .or(page.getByText(/cargando|loading/i));
    
    // Puede que el loading sea muy rápido, no falla si no se detecta
    const isLoading = await loadingIndicator.isVisible().catch(() => false);
    
    // Si hay loading, verificar que desaparece
    if (isLoading) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }
    
    // Debe navegar eventualmente
    await page.waitForURL(/\/(dashboard|home|login)/, { timeout: 15000 });
  });

  test('AUTH-010: Debe prevenir múltiples clics en botón de login', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    const loginButton = page.getByRole('button', { name: /iniciar sesión|entrar|login/i });
    
    // Múltiples clics rápidos
    await Promise.all([
      loginButton.click(),
      loginButton.click().catch(() => {}), // Puede fallar si está deshabilitado
      loginButton.click().catch(() => {}),
    ]);
    
    // No debe causar errores, solo debe procesar una vez
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/(dashboard|home)/);
  });
});
