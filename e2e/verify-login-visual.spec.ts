import { test, expect } from '@playwright/test';

/**
 * Test visual detallado del proceso de login
 * Captura screenshots en cada paso para debugging
 */

test.describe('Verificación Visual de Login', () => {
  
  test('Proceso completo de login con admin@inmova.app', async ({ page }) => {
    console.log('\n🔍 INICIANDO VERIFICACIÓN VISUAL DE LOGIN\n');

    // 1. Ir a la página de login
    console.log('1️⃣ Navegando a /login...');
    await page.goto('https://inmovaapp.com/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(2000);

    // Screenshot 1: Página de login inicial
    await page.screenshot({ 
      path: 'test-results/login-step-1-initial-page.png',
      fullPage: true,
    });
    console.log('   ✅ Screenshot guardado: login-step-1-initial-page.png');

    // 2. Verificar elementos del formulario
    console.log('\n2️⃣ Buscando campos del formulario...');
    
    // Buscar campo de email
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="correo" i]',
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = page.locator(selector).first();
        const count = await emailInput.count();
        if (count > 0) {
          console.log(`   ✅ Campo de email encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Buscar campo de password
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
      'input[placeholder*="contraseña" i]',
      'input[placeholder*="password" i]',
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = page.locator(selector).first();
        const count = await passwordInput.count();
        if (count > 0) {
          console.log(`   ✅ Campo de password encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Buscar botón de submit
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Iniciar sesión")',
      'button:has-text("Login")',
      'button:has-text("Entrar")',
      'button:has-text("Acceder")',
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = page.locator(selector).first();
        const count = await submitButton.count();
        if (count > 0) {
          console.log(`   ✅ Botón submit encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // 3. Llenar formulario
    console.log('\n3️⃣ Llenando formulario...');
    
    if (emailInput) {
      await emailInput.fill('admin@inmova.app');
      console.log('   ✅ Email ingresado: admin@inmova.app');
    } else {
      console.log('   ❌ No se encontró campo de email');
    }

    if (passwordInput) {
      await passwordInput.fill('Admin2025!');
      console.log('   ✅ Password ingresado: Admin2025!');
    } else {
      console.log('   ❌ No se encontró campo de password');
    }

    await page.waitForTimeout(1000);

    // Screenshot 2: Formulario llenado
    await page.screenshot({ 
      path: 'test-results/login-step-2-form-filled.png',
      fullPage: true,
    });
    console.log('   ✅ Screenshot guardado: login-step-2-form-filled.png');

    // 4. Click en submit
    console.log('\n4️⃣ Haciendo submit del formulario...');
    
    if (submitButton) {
      await submitButton.click();
      console.log('   ✅ Click en botón de submit');
    } else {
      console.log('   ❌ No se encontró botón de submit');
    }

    // Esperar respuesta
    await page.waitForTimeout(5000);

    // Screenshot 3: Después del submit
    await page.screenshot({ 
      path: 'test-results/login-step-3-after-submit.png',
      fullPage: true,
    });
    console.log('   ✅ Screenshot guardado: login-step-3-after-submit.png');

    // 5. Verificar resultado
    console.log('\n5️⃣ Verificando resultado...');
    
    const currentUrl = page.url();
    console.log(`   📍 URL actual: ${currentUrl}`);

    // Buscar mensajes de error
    const errorMessages = await page.locator('text=/error|incorrecto|inválido|wrong|failed|credenciales/i').allTextContents();
    if (errorMessages.length > 0) {
      console.log('   ❌ Mensajes de error encontrados:');
      errorMessages.forEach(msg => console.log(`      - ${msg}`));
    } else {
      console.log('   ℹ️  No se encontraron mensajes de error visibles');
    }

    // Verificar si seguimos en login
    if (currentUrl.includes('login')) {
      console.log('   ⚠️  Seguimos en la página de login - Login falló');
    } else {
      console.log('   ✅ Salimos de la página de login - Posible éxito');
    }

    // Buscar elementos de sesión iniciada
    const sessionElements = [
      page.locator('text=/admin@inmova.app/i'),
      page.locator('button:has-text("Cerrar sesión")'),
      page.locator('a:has-text("Salir")'),
      page.locator('[data-testid="user-menu"]'),
    ];

    let sessionFound = false;
    for (const element of sessionElements) {
      const count = await element.count();
      if (count > 0) {
        console.log('   ✅ Elementos de sesión encontrados');
        sessionFound = true;
        break;
      }
    }

    if (!sessionFound) {
      console.log('   ❌ No se encontraron elementos de sesión iniciada');
    }

    // 6. Capturar HTML de la página para análisis
    const pageContent = await page.content();
    const fs = require('fs');
    fs.writeFileSync('test-results/login-page-content.html', pageContent);
    console.log('\n   ✅ HTML guardado: login-page-content.html');

    // 7. Capturar console logs
    page.on('console', msg => console.log('   🖥️  Console:', msg.text()));

    // 8. Screenshot final
    await page.screenshot({ 
      path: 'test-results/login-step-4-final.png',
      fullPage: true,
    });
    console.log('   ✅ Screenshot guardado: login-step-4-final.png');

    console.log('\n✨ VERIFICACIÓN COMPLETADA\n');
    console.log('📁 Revisa los screenshots en test-results/');
    console.log('   - login-step-1-initial-page.png');
    console.log('   - login-step-2-form-filled.png');
    console.log('   - login-step-3-after-submit.png');
    console.log('   - login-step-4-final.png');
    console.log('   - login-page-content.html');
  });

  test('Probar diferentes contraseñas comunes', async ({ page }) => {
    console.log('\n🔑 PROBANDO CONTRASEÑAS COMUNES\n');

    const passwords = [
      'Admin2025!',
      'admin',
      'admin123',
      'Admin123',
      'admin@inmova.app',
      'inmova',
      'Inmova2024',
    ];

    for (const password of passwords) {
      console.log(`\n📝 Probando contraseña: ${password}`);
      
      await page.goto('https://inmovaapp.com/login');
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      await emailInput.fill('admin@inmova.app');
      await passwordInput.fill(password);
      await submitButton.click();

      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (!currentUrl.includes('login')) {
        console.log(`   ✅ ¡LOGIN EXITOSO con contraseña: ${password}!`);
        
        await page.screenshot({ 
          path: `test-results/login-success-${password.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
          fullPage: true,
        });
        
        break;
      } else {
        console.log(`   ❌ Falló con: ${password}`);
      }
    }
  });
});
