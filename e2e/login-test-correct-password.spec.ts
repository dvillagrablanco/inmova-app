import { test, expect } from '@playwright/test';

test.describe('Login con contraseña correcta', () => {
  
  test('Login con Test1234!', async ({ page }) => {
    test.setTimeout(30000);
    
    console.log('\n🔐 Probando login con contraseña correcta: Test1234!\n');

    await page.goto('https://inmovaapp.com/login', {
      waitUntil: 'load',
      timeout: 15000
    });

    // Llenar formulario
    await page.fill('input[type="email"]', 'admin@inmova.app');
    await page.fill('input[type="password"]', 'Test1234!');
    
    console.log('✅ Formulario llenado con:');
    console.log('   Email: admin@inmova.app');
    console.log('   Password: Test1234!');

    // Screenshot antes de submit
    await page.screenshot({ path: 'login-before-submit.png', fullPage: true });

    // Submit
    await page.click('button[type="submit"]');
    console.log('📤 Formulario enviado');

    // Esperar navegación
    await page.waitForTimeout(4000);

    // Screenshot después de submit
    await page.screenshot({ path: 'login-after-submit.png', fullPage: true });

    const url = page.url();
    console.log(`\n📍 URL final: ${url}`);

    if (!url.includes('/login')) {
      console.log('✅ ¡LOGIN EXITOSO! Salió de la página de login');
      
      // Buscar indicadores de sesión
      const pageText = await page.textContent('body');
      if (pageText?.includes('admin@inmova.app') || pageText?.includes('Admin')) {
        console.log('✅ Usuario visible en la página');
      }
    } else {
      console.log('❌ Login falló - sigue en /login');
      
      // Buscar mensajes de error
      const errorText = await page.locator('text=/incorrect|invalid|error|wrong/i').allTextContents();
      if (errorText.length > 0) {
        console.log('❌ Errores encontrados:');
        errorText.forEach(err => console.log(`   - ${err}`));
      }
    }

    // Verificación final
    expect(url).not.toContain('/login');
  });
});
