import { test, expect } from '@playwright/test';

/**
 * Tests de login para todos los perfiles de usuario
 * Verifica acceso y funcionalidad básica de cada rol
 */

const BASE_URL = 'https://inmovaapp.com';

// Credenciales de prueba
const TEST_CREDENTIALS = [
  {
    role: 'Super Admin',
    email: 'admin@inmova.app',
    password: 'Test1234!',
    expectedDashboard: /dashboard|inicio|admin/i,
  },
];

test.describe('Login y Acceso por Perfil', () => {
  
  // Test para cada tipo de usuario
  for (const user of TEST_CREDENTIALS) {
    test(`${user.role} - debe poder hacer login correctamente`, async ({ page }) => {
      console.log(`\n🔐 Probando login para: ${user.role}`);
      console.log(`   Email: ${user.email}`);

      // 1. Ir a la página de login
      await page.goto(`${BASE_URL}/auth/signin`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // 2. Verificar que estamos en la página de login
      await expect(page).toHaveURL(/signin|login/i);

      // 3. Llenar formulario de login
      // Buscar campo de email
      const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
      await emailInput.fill(user.email);

      // Buscar campo de password
      const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first();
      await passwordInput.fill(user.password);

      // 4. Tomar screenshot antes de submit
      await page.screenshot({ 
        path: `test-results/login-${user.role.toLowerCase().replace(/\s+/g, '-')}-before.png`,
        fullPage: false,
      });

      // 5. Click en botón de login
      const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar sesión"), button:has-text("Login"), button:has-text("Entrar")').first();
      await submitButton.click();

      // 6. Esperar navegación o redirección
      await page.waitForLoadState('networkidle', { timeout: 15000 });

      // 7. Verificar que NO estamos en login (login exitoso)
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log(`   ✅ Login exitoso - URL: ${currentUrl}`);

      // 8. Verificar que llegamos a un dashboard o página interna
      expect(currentUrl).not.toContain('signin');
      expect(currentUrl).not.toContain('login');

      // 9. Buscar elementos comunes de dashboards autenticados
      const authenticatedElements = [
        page.locator('nav'), // Navegación
        page.locator('[role="navigation"]'),
        page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), a:has-text("Salir")'),
        page.locator('text=/dashboard|inicio|panel/i'),
      ];

      let elementFound = false;
      for (const element of authenticatedElements) {
        try {
          await element.waitFor({ timeout: 5000, state: 'visible' });
          elementFound = true;
          break;
        } catch (e) {
          // Continue checking other elements
        }
      }

      expect(elementFound).toBeTruthy();

      // 10. Tomar screenshot del dashboard
      await page.screenshot({ 
        path: `test-results/login-${user.role.toLowerCase().replace(/\s+/g, '-')}-dashboard.png`,
        fullPage: true,
      });

      console.log(`   ✅ Dashboard cargado correctamente`);
    });

    test(`${user.role} - debe mostrar información del usuario autenticado`, async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.locator('input[type="email"]').first().fill(user.email);
      await page.locator('input[type="password"]').first().fill(user.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Buscar nombre del usuario o email en la página
      const userInfoLocators = [
        page.locator(`text=${user.email}`),
        page.locator(`text=/perfil|cuenta|usuario/i`),
        page.locator('[data-testid="user-menu"], [aria-label="User menu"]'),
      ];

      let userInfoVisible = false;
      for (const locator of userInfoLocators) {
        try {
          await locator.waitFor({ timeout: 3000, state: 'visible' });
          userInfoVisible = true;
          console.log(`   ✅ Información de usuario visible`);
          break;
        } catch (e) {
          // Continue
        }
      }

      // Al menos uno debe ser visible
      expect(userInfoVisible || currentUrl.includes('dashboard')).toBeTruthy();
    });

    test(`${user.role} - debe poder navegar en el sistema`, async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.locator('input[type="email"]').first().fill(user.email);
      await page.locator('input[type="password"]').first().fill(user.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Verificar que hay navegación disponible
      const navElements = await page.locator('nav, [role="navigation"], a[href*="dashboard"]').count();
      expect(navElements).toBeGreaterThan(0);

      console.log(`   ✅ Sistema de navegación disponible (${navElements} elementos)`);

      // Tomar screenshot de la navegación
      await page.screenshot({ 
        path: `test-results/login-${user.role.toLowerCase().replace(/\s+/g, '-')}-navigation.png`,
        fullPage: false,
      });
    });
  }

  test('Debe rechazar credenciales inválidas', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

    // Intentar login con credenciales incorrectas
    await page.locator('input[type="email"]').first().fill('invalid@test.com');
    await page.locator('input[type="password"]').first().fill('WrongPassword123');
    await page.locator('button[type="submit"]').first().click();

    // Esperar un momento
    await page.waitForTimeout(3000);

    // Debe seguir en la página de login o mostrar error
    const url = page.url();
    const hasError = await page.locator('text=/error|incorrecto|inválido|wrong/i').count() > 0;
    
    const stillOnLogin = url.includes('signin') || url.includes('login');

    expect(stillOnLogin || hasError).toBeTruthy();
    console.log('   ✅ Credenciales inválidas rechazadas correctamente');
  });

  test('Formulario de login - validación de campos', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

    // Verificar que los campos existen
    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('   ✅ Formulario de login renderizado correctamente');
  });
});

test.describe('Verificación de Acceso por Rol', () => {
  
  test('Super Admin - debe tener acceso a administración', async ({ page }) => {
    const user = TEST_CREDENTIALS[0];
    
    // Login
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.locator('input[type="email"]').first().fill(user.email);
    await page.locator('input[type="password"]').first().fill(user.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar indicadores de panel de administración
    const adminIndicators = [
      page.locator('text=/administr|admin|panel|configuración/i'),
      page.locator('a[href*="admin"], a[href*="settings"]'),
    ];

    let hasAdminAccess = false;
    for (const indicator of adminIndicators) {
      const count = await indicator.count();
      if (count > 0) {
        hasAdminAccess = true;
        console.log(`   ✅ Elementos de administración encontrados: ${count}`);
        break;
      }
    }

    // Para super admin, debe tener acceso o estar en dashboard
    expect(hasAdminAccess || page.url().includes('dashboard')).toBeTruthy();
  });
});
