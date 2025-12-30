import { test, expect } from '@playwright/test';

/**
 * Test del Sidebar - Sección de Perfil
 * Verifica que no haya errores de JavaScript y que funcione correctamente
 */

test.describe('Sidebar - User Profile Section', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Capturar errores de consola
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', (error) => {
      console.log(`❌ Page Error: ${error.message}`);
    });
  });

  test('should load sidebar without JavaScript errors after login', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Capturar errores
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // 1. Navegar al login
    await page.goto('https://inmovaapp.com/login', { waitUntil: 'networkidle' });

    // 2. Login
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // 3. Esperar redirección
    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });

    // 4. Esperar a que cargue el sidebar
    await page.waitForTimeout(3000);

    // 5. Verificar que no hay errores
    expect(consoleErrors.length).toBe(0);
    expect(pageErrors.length).toBe(0);

    // 6. Verificar que el sidebar está visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // 7. Verificar sección de usuario
    const userMenu = page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();

    // 8. Verificar que muestra nombre
    const userName = await userMenu.innerText();
    expect(userName).toContain('Admin');

    console.log('✅ Sidebar cargado sin errores');
    console.log(`✅ Usuario detectado: ${userName}`);
  });

  test('should show user email and role in sidebar', async ({ page }) => {
    // Login
    await page.goto('https://inmovaapp.com/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });

    // Verificar información del usuario
    const userMenu = page.locator('[data-testid="user-menu"]');
    const userText = await userMenu.innerText();

    // Debe contener email
    expect(userText.toLowerCase()).toContain('admin@inmova.app');

    // Debe contener rol
    expect(userText.toLowerCase()).toContain('admin');

    console.log('✅ Email y rol mostrados correctamente');
  });

  test('should navigate to profile page when clicking user menu', async ({ page }) => {
    // Login
    await page.goto('https://inmovaapp.com/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });

    // Click en user menu
    await page.click('[data-testid="user-menu"]');

    // Verificar redirección a perfil
    await page.waitForURL(/perfil|profile/, { timeout: 10000 });

    const currentUrl = page.url();
    expect(currentUrl).toContain('perfil');

    console.log('✅ Navegación a perfil correcta');
  });

  test('should logout correctly', async ({ page }) => {
    // Login
    await page.goto('https://inmovaapp.com/login');
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });

    // Click en Cerrar Sesión
    await page.click('button:has-text("Cerrar Sesión")');

    // Verificar redirección al login
    await page.waitForURL(/login/, { timeout: 10000 });

    const currentUrl = page.url();
    expect(currentUrl).toContain('login');

    console.log('✅ Logout correcto');
  });

  test('should handle missing session gracefully', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navegar a dashboard sin login (debería redirigir o mostrar loading)
    await page.goto('https://inmovaapp.com/dashboard', { waitUntil: 'networkidle' });

    await page.waitForTimeout(3000);

    // No debe haber errores de JavaScript
    const jsErrors = consoleErrors.filter(e => 
      e.includes('undefined is not an object') ||
      e.includes('Cannot read property') ||
      e.includes('steps[')
    );

    expect(jsErrors.length).toBe(0);

    console.log('✅ Sidebar maneja sesión faltante sin errores');
  });
});
