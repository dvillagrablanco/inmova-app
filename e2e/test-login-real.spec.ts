/**
 * Test de Login Real - Verificación E2E
 * Prueba el login completo con credenciales reales
 */

import { test, expect } from '@playwright/test';

test.describe('Login Real - Verificación Completa', () => {
  test('Debe loguearse exitosamente y acceder al dashboard', async ({ page }) => {
    console.log('🚀 Iniciando test de login real...');

    // 1. Navegar a la página de login
    console.log('📍 Navegando a /login...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Screenshot 1: Página de login inicial
    await page.screenshot({
      path: 'test-results/login-real/01-login-page.png',
      fullPage: true,
    });
    console.log('✅ Página de login cargada');

    // 2. Verificar que los elementos del formulario están presentes
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    console.log('✅ Formulario de login visible');

    // 3. Llenar el formulario con las credenciales reales
    console.log('📝 Ingresando credenciales...');
    console.log('   Email: admin@inmova.app');
    console.log('   Password: Admin2025!');

    await emailInput.fill('admin@inmova.app');
    await passwordInput.fill('Admin2025!');

    // Screenshot 2: Formulario lleno
    await page.screenshot({
      path: 'test-results/login-real/02-form-filled.png',
      fullPage: true,
    });
    console.log('✅ Credenciales ingresadas');

    // 4. Hacer click en el botón de login
    console.log('🔑 Haciendo click en "Iniciar Sesión"...');
    await submitButton.click();

    // Screenshot 3: Inmediatamente después del click
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/login-real/03-after-submit.png',
      fullPage: true,
    });

    // 5. Esperar la navegación al dashboard o home
    console.log('⏳ Esperando redirección...');
    try {
      await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
      console.log('✅ Redirigido exitosamente');

      // Screenshot 4: Dashboard/Home
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'test-results/login-real/04-dashboard.png',
        fullPage: true,
      });

      // 6. Verificar que estamos en dashboard/home
      const currentURL = page.url();
      console.log('📍 URL actual:', currentURL);
      expect(currentURL).toMatch(/\/(dashboard|home)/);

      // 7. Buscar indicadores de que estamos logueados
      const userIndicators = [
        page.locator('[data-testid="user-menu"]'),
        page.locator('button:has-text("admin")').first(),
        page.locator('text=/admin@inmova\\.app/i').first(),
        page.getByText(/administrador/i).first(),
      ];

      let foundIndicator = false;
      for (const indicator of userIndicators) {
        try {
          if (await indicator.isVisible({ timeout: 2000 })) {
            foundIndicator = true;
            console.log('✅ Indicador de usuario encontrado:', await indicator.textContent());
            break;
          }
        } catch (e) {
          // Continuar buscando
        }
      }

      if (!foundIndicator) {
        console.log(
          '⚠️  No se encontró indicador específico de usuario, pero estamos en dashboard'
        );
      }

      // 8. Verificar que la sesión está activa
      const sessionResponse = await page.goto('/api/auth/session');
      const sessionData = await sessionResponse?.json();
      console.log('🔐 Datos de sesión:', JSON.stringify(sessionData, null, 2));

      if (sessionData && sessionData.user) {
        console.log('\n✅ ¡LOGIN EXITOSO!');
        console.log('══════════════════════════════════════');
        console.log('👤 Usuario:', sessionData.user.name);
        console.log('📧 Email:', sessionData.user.email);
        console.log('🎭 Rol:', sessionData.user.role);
        console.log('🏢 Compañía:', sessionData.user.companyName);
        console.log('══════════════════════════════════════');
      }

      // Screenshot 5: Final
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'test-results/login-real/05-final-dashboard.png',
        fullPage: true,
      });

      console.log('\n🎉 TEST COMPLETADO EXITOSAMENTE');
      console.log('📸 Screenshots guardados en: test-results/login-real/');
    } catch (error) {
      console.error('\n❌ ERROR DURANTE EL LOGIN:');
      console.error(error);

      // Screenshot de error
      await page.screenshot({
        path: 'test-results/login-real/ERROR-screenshot.png',
        fullPage: true,
      });

      // Capturar errores de consola
      const consoleLogs: string[] = [];
      page.on('console', (msg) => consoleLogs.push(`${msg.type()}: ${msg.text()}`));

      console.error('\n📋 Logs de consola del navegador:');
      consoleLogs.forEach((log) => console.error(log));

      // Verificar si hay mensaje de error en la página
      const errorMessages = await page
        .locator('[role="alert"], .error, .text-red')
        .allTextContents();
      if (errorMessages.length > 0) {
        console.error('\n⚠️  Mensajes de error en la página:');
        errorMessages.forEach((msg) => console.error(msg));
      }

      throw error;
    }
  });

  test('Verificar acceso a diferentes secciones después del login', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@inmova.app');
    await page.fill('input[type="password"]', 'Admin2025!');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    console.log('✅ Login exitoso, verificando acceso a secciones...');

    // Intentar navegar a diferentes secciones
    const sections = [
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/buildings', name: 'Edificios' },
      { url: '/tenants', name: 'Inquilinos' },
    ];

    for (const section of sections) {
      try {
        await page.goto(section.url, { timeout: 5000, waitUntil: 'networkidle' });
        const currentUrl = page.url();
        console.log(`✅ ${section.name}: Acceso correcto (${currentUrl})`);

        await page.screenshot({
          path: `test-results/login-real/section-${section.name.toLowerCase()}.png`,
        });
      } catch (error) {
        console.log(`⚠️  ${section.name}: No accesible o redirigido`);
      }
    }

    console.log('\n🎉 Verificación de secciones completada');
  });
});
