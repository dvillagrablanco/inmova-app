import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

/**
 * Test visual final para verificar login con screenshots
 */

test.describe('Verificación Visual Final de Login', () => {
  
  test('Login completo con screenshots paso a paso', async ({ page }) => {
    // Timeout generoso
    test.setTimeout(90000);

    console.log('\n' + '═'.repeat(70));
    console.log('🔐 VERIFICACIÓN VISUAL COMPLETA DE LOGIN');
    console.log('═'.repeat(70) + '\n');

    try {
      // PASO 1: Navegar a login
      console.log('📍 PASO 1: Navegando a la página de login...');
      await page.goto('https://inmovaapp.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      console.log('   ✅ Página cargada');

      await page.waitForTimeout(2000);

      // Guardar screenshot
      await page.screenshot({ 
        path: 'test-results/visual-1-pagina-inicial.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot guardado: visual-1-pagina-inicial.png\n');

      // PASO 2: Verificar formulario
      console.log('📍 PASO 2: Verificando campos del formulario...');
      
      const emailField = await page.locator('input[type="email"]').count();
      const passwordField = await page.locator('input[type="password"]').count();
      const submitButton = await page.locator('button[type="submit"]').count();

      console.log(`   ${emailField > 0 ? '✅' : '❌'} Campo de email: ${emailField} encontrado(s)`);
      console.log(`   ${passwordField > 0 ? '✅' : '❌'} Campo de password: ${passwordField} encontrado(s)`);
      console.log(`   ${submitButton > 0 ? '✅' : '❌'} Botón submit: ${submitButton} encontrado(s)\n`);

      // PASO 3: Llenar formulario
      console.log('📍 PASO 3: Llenando formulario con credenciales...');
      console.log('   📧 Email: admin@inmova.app');
      console.log('   🔑 Password: Test1234!');

      await page.fill('input[type="email"]', 'admin@inmova.app');
      await page.fill('input[type="password"]', 'Test1234!');
      console.log('   ✅ Formulario llenado');

      await page.waitForTimeout(1000);

      // Guardar screenshot
      await page.screenshot({ 
        path: 'test-results/visual-2-formulario-llenado.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot guardado: visual-2-formulario-llenado.png\n');

      // PASO 4: Submit
      console.log('📍 PASO 4: Enviando formulario...');
      await page.click('button[type="submit"]');
      console.log('   ✅ Click en submit realizado');

      // Esperar navegación o mensaje
      console.log('   ⏳ Esperando respuesta del servidor...');
      await page.waitForTimeout(6000);

      // Guardar screenshot
      await page.screenshot({ 
        path: 'test-results/visual-3-despues-submit.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot guardado: visual-3-despues-submit.png\n');

      // PASO 5: Verificar resultado
      console.log('📍 PASO 5: Verificando resultado...');
      const currentUrl = page.url();
      console.log(`   📍 URL actual: ${currentUrl}`);

      // Buscar mensajes de error
      const errorMessages = await page.locator('text=/incorrect|invalid|wrong|error|incorrecto|inválido/i').allTextContents();
      
      if (errorMessages.length > 0) {
        console.log('   ⚠️  Mensajes de error encontrados:');
        errorMessages.slice(0, 3).forEach(msg => {
          console.log(`      - ${msg.substring(0, 100)}`);
        });
      } else {
        console.log('   ✅ No se encontraron mensajes de error');
      }

      // Verificar si salimos de /login
      if (currentUrl.includes('/login')) {
        console.log('   ⚠️  Aún en página de login');
        
        // Capturar el contenido para debugging
        const pageText = await page.textContent('body');
        console.log('\n   📄 Contenido de la página (primeros 300 caracteres):');
        console.log('   ' + pageText?.substring(0, 300).replace(/\n/g, ' '));
      } else {
        console.log('   ✅ ¡Salimos de /login! Login exitoso');
      }

      // PASO 6: Screenshot final
      await page.screenshot({ 
        path: 'test-results/visual-4-resultado-final.png',
        fullPage: true 
      });
      console.log('\n   📸 Screenshot guardado: visual-4-resultado-final.png');

      console.log('\n' + '═'.repeat(70));
      console.log('📁 SCREENSHOTS GENERADOS:');
      console.log('   1. test-results/visual-1-pagina-inicial.png');
      console.log('   2. test-results/visual-2-formulario-llenado.png');
      console.log('   3. test-results/visual-3-despues-submit.png');
      console.log('   4. test-results/visual-4-resultado-final.png');
      console.log('═'.repeat(70) + '\n');

      // Assertion
      expect(currentUrl).not.toContain('/login');
      console.log('✅ TEST PASADO: Login exitoso confirmado\n');

    } catch (error) {
      console.error('\n❌ ERROR DURANTE EL TEST:', error);
      
      // Screenshot de error
      await page.screenshot({ 
        path: 'test-results/visual-error.png',
        fullPage: true 
      });
      console.log('📸 Screenshot de error guardado: visual-error.png\n');
      
      throw error;
    }
  });
});
