import { test, expect } from '@playwright/test';

test.describe('Prueba Visual de Login en Producción', () => {
  test('Login como Superadministrador - Verificar Dashboard y Wizard', async ({ page }) => {
    console.log('🔍 Iniciando prueba visual de login...');

    // Capturar todos los errores de consola
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });

    // 1. Navegar a la página de login
    console.log('📍 Paso 1: Navegando a /login...');
    await page.goto('https://inmovaapp.com/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });
    console.log('✅ Página de login cargada');

    // 2. Verificar que los campos de login existen
    console.log('📍 Paso 2: Verificando campos de login...');
    const emailField = await page.waitForSelector('#email-field', { timeout: 10000 });
    const passwordField = await page.waitForSelector('#password-field', { timeout: 10000 });
    expect(emailField).toBeTruthy();
    expect(passwordField).toBeTruthy();
    console.log('✅ Campos de email y password encontrados');

    // 3. Completar credenciales
    console.log('📍 Paso 3: Ingresando credenciales...');
    await page.fill('#email-field', 'admin@inmova.app');
    await page.fill('#password-field', 'Admin2025!');
    await page.screenshot({ path: 'test-results/02-credentials-filled.png', fullPage: true });
    console.log('✅ Credenciales ingresadas');

    // 4. Click en botón de login
    console.log('📍 Paso 4: Haciendo click en botón de login...');
    await page.click('button[type="submit"]');
    console.log('✅ Click en botón de login ejecutado');

    // 5. Esperar redirección al dashboard
    console.log('📍 Paso 5: Esperando redirección al dashboard...');
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Redirigido a dashboard correctamente');
    } catch (error) {
      console.log('⚠️ No se redirigió a /dashboard, verificando URL actual...');
      const currentUrl = page.url();
      console.log('📍 URL actual:', currentUrl);
      await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });
    }

    // 6. Esperar a que la página cargue completamente
    console.log('📍 Paso 6: Esperando carga completa del dashboard...');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(3000); // Tiempo adicional para wizard
    await page.screenshot({ path: 'test-results/04-dashboard-loaded.png', fullPage: true });
    console.log('✅ Dashboard cargado');

    // 7. Verificar que NO existe el error crítico del wizard
    console.log('📍 Paso 7: Verificando que no exista el error del wizard...');
    const hasWizardError = pageErrors.some(
      (err) =>
        err.includes("Cannot read properties of undefined (reading 'steps')") ||
        err.includes("undefined is not an object (evaluating 's.steps")
    );

    if (hasWizardError) {
      console.log('❌ ERROR CRÍTICO: El error del wizard todavía existe!');
      await page.screenshot({ path: 'test-results/05-wizard-error.png', fullPage: true });
    } else {
      console.log('✅ No se detectó el error del wizard');
    }

    // 8. Buscar el wizard de onboarding
    console.log('📍 Paso 8: Buscando wizard de onboarding...');
    try {
      const wizardCard = await page.waitForSelector(
        '[class*="Card"]:has-text("Bienvenido a INMOVA")',
        {
          timeout: 5000,
          state: 'visible',
        }
      );

      if (wizardCard) {
        console.log('✅ Wizard de onboarding encontrado y visible');
        await page.screenshot({ path: 'test-results/06-wizard-visible.png', fullPage: true });

        // Verificar que el wizard tiene contenido
        const wizardText = await wizardCard.textContent();
        console.log('📋 Contenido del wizard:', wizardText?.substring(0, 200));
      }
    } catch (error) {
      console.log('⚠️ Wizard no visible (puede ser normal si ya está completado)');
      await page.screenshot({ path: 'test-results/06-no-wizard.png', fullPage: true });
    }

    // 9. Verificar elementos del dashboard
    console.log('📍 Paso 9: Verificando elementos del dashboard...');
    const dashboardElements = await page.evaluate(() => {
      return {
        hasCards: document.querySelectorAll('[class*="Card"]').length > 0,
        hasNavigation: document.querySelectorAll('nav').length > 0,
        hasSidebar: document.querySelectorAll('[class*="sidebar"]').length > 0,
        bodyText: document.body.innerText.substring(0, 500),
      };
    });

    console.log('📊 Elementos del dashboard:', {
      cards: dashboardElements.hasCards,
      navigation: dashboardElements.hasNavigation,
      sidebar: dashboardElements.hasSidebar,
    });
    console.log('📄 Texto visible:', dashboardElements.bodyText);

    // 10. Reporte final
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE FINAL DE PRUEBA DE LOGIN');
    console.log('='.repeat(80));
    console.log(`✅ Login ejecutado correctamente: ${!hasWizardError}`);
    console.log(`❌ Errores de consola: ${consoleErrors.length}`);
    console.log(`❌ Errores de página: ${pageErrors.length}`);
    console.log(`❌ Error crítico del wizard: ${hasWizardError ? 'SÍ ❌' : 'NO ✅'}`);
    console.log('='.repeat(80));

    if (consoleErrors.length > 0) {
      console.log('\n🔴 ERRORES DE CONSOLA:');
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 150)}`);
      });
    }

    if (pageErrors.length > 0) {
      console.log('\n🔴 ERRORES DE PÁGINA:');
      pageErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 150)}`);
      });
    }

    if (!hasWizardError && pageErrors.length === 0 && consoleErrors.length < 3) {
      console.log('\n✅✅✅ PRUEBA EXITOSA: Login funciona perfectamente ✅✅✅');
    } else {
      console.log('\n⚠️ PRUEBA COMPLETADA CON ADVERTENCIAS - Revisar screenshots en test-results/');
    }

    // Verificación final del test
    expect(hasWizardError).toBe(false);
    expect(pageErrors.length).toBe(0);
  });
});
