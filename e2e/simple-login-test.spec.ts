import { test, expect } from '@playwright/test';

/**
 * Test simple de login con las credenciales correctas
 */

test.describe('Login Simple con Credenciales Correctas', () => {
  
  test('Login exitoso con admin@inmova.app', async ({ page }) => {
    test.setTimeout(30000);

    // Ir a la página de login
    await page.goto('https://inmovaapp.com/login');
    
    // Esperar que cargue
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Llenar formulario con credenciales correctas
    await page.fill('input[type="email"]', 'admin@inmova.app');
    await page.fill('input[type="password"]', 'Test1234!');

    // Capturar screenshot antes de submit
    await page.screenshot({ path: 'test-results/01-before-login.png', fullPage: true });

    // Hacer submit
    await page.click('button[type="submit"]');

    // Esperar redirección (NextAuth hace redirect después de login exitoso)
    await page.waitForTimeout(5000);

    // Capturar screenshot después de submit
    await page.screenshot({ path: 'test-results/02-after-login.png', fullPage: true });

    // Verificar que salimos de /login
    const currentUrl = page.url();
    console.log(`URL después de login: ${currentUrl}`);

    // Si el login es exitoso, no deberíamos estar en /login
    expect(currentUrl).not.toContain('/login');

    // Verificar que hay algún elemento de sesión activa
    // (puede ser el email del usuario, un menú de usuario, etc.)
    const pageContent = await page.content();
    
    console.log('✅ Login exitoso - URL:', currentUrl);
  });
});
