/**
 * Script de prueba visual con Stagehand
 * Verifica la landing y hace login en la app
 */

import { Stagehand } from '@browserbasehq/stagehand';

async function runVisualTest() {
  console.log('\n🎭 INICIANDO PRUEBA VISUAL CON STAGEHAND\n');
  console.log('='.repeat(80) + '\n');

  // Inicializar Stagehand con navegador visible
  const stagehand = new Stagehand({
    env: 'LOCAL',
    headless: false, // Ver el navegador
    verbose: 1, // Nivel de logging
    debugDom: true, // Debug del DOM
  });

  try {
    // 1. Iniciar el navegador
    console.log('1️⃣  Iniciando navegador...');
    await stagehand.init();
    const page = stagehand.page;
    console.log('   ✅ Navegador iniciado\n');

    // 2. Ir a la landing pública
    console.log('2️⃣  Navegando a https://inmovaapp.com...');
    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
    });
    
    // Esperar a que cargue
    await page.waitForTimeout(3000);
    
    const pageTitle = await page.title();
    console.log(`   Título: ${pageTitle}`);
    
    if (pageTitle.includes('INMOVA') || pageTitle.includes('PropTech')) {
      console.log('   ✅ Landing NUEVA detectada\n');
    } else {
      console.log('   ⚠️  Landing antigua o diferente\n');
    }

    // 3. Tomar screenshot de la landing
    console.log('3️⃣  Capturando screenshot de la landing...');
    await page.screenshot({
      path: 'visual-verification-results/stagehand-landing.png',
      fullPage: true,
    });
    console.log('   ✅ Screenshot guardado: stagehand-landing.png\n');

    // 4. Esperar para ver la landing (10 segundos)
    console.log('4️⃣  Mostrando landing por 10 segundos para inspección visual...');
    await page.waitForTimeout(10000);
    console.log('   ✅ Inspección visual completada\n');

    // 5. Buscar botón de login/acceso usando Stagehand Act
    console.log('5️⃣  Buscando botón de login con Stagehand Act...');
    
    try {
      // Usar act() para encontrar y clickear el botón de login
      await stagehand.act({
        action: "click on the login or 'Iniciar sesión' or 'Acceder' button",
      });
      console.log('   ✅ Botón de login clickeado\n');
      
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('   ⚠️  No se encontró botón de login en landing, navegando directamente...\n');
      
      // Navegar directamente a /login
      await page.goto('https://inmovaapp.com/login', {
        waitUntil: 'networkidle',
      });
    }

    // 6. Esperar a que cargue la página de login
    console.log('6️⃣  Esperando página de login...');
    await page.waitForTimeout(3000);
    
    const loginTitle = await page.title();
    console.log(`   Título: ${loginTitle}`);
    console.log('   ✅ Página de login cargada\n');

    // 7. Tomar screenshot del login
    console.log('7️⃣  Capturando screenshot del login...');
    await page.screenshot({
      path: 'visual-verification-results/stagehand-login.png',
      fullPage: true,
    });
    console.log('   ✅ Screenshot guardado: stagehand-login.png\n');

    // 8. Intentar login con Stagehand Act (con credenciales de prueba)
    console.log('8️⃣  Intentando login con Stagehand Act...');
    console.log('   Credenciales: admin@example.com / password123\n');
    
    try {
      // Llenar email
      await stagehand.act({
        action: "type 'admin@example.com' in the email or username field",
      });
      console.log('   ✅ Email ingresado');
      
      await page.waitForTimeout(1000);
      
      // Llenar password
      await stagehand.act({
        action: "type 'password123' in the password field",
      });
      console.log('   ✅ Password ingresado');
      
      await page.waitForTimeout(1000);
      
      // Clickear botón de login
      await stagehand.act({
        action: "click the login or submit button",
      });
      console.log('   ✅ Botón de login clickeado');
      
      // Esperar respuesta
      await page.waitForTimeout(5000);
      
      // Verificar si redirigió al dashboard
      const currentUrl = page.url();
      console.log(`\n   URL actual: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
        console.log('   ✅ Login exitoso - Redirigió al dashboard\n');
      } else {
        console.log('   ⚠️  Login falló o credenciales incorrectas\n');
      }
      
      // Screenshot después del login
      console.log('9️⃣  Capturando screenshot post-login...');
      await page.screenshot({
        path: 'visual-verification-results/stagehand-post-login.png',
        fullPage: true,
      });
      console.log('   ✅ Screenshot guardado: stagehand-post-login.png\n');
      
    } catch (error) {
      console.log(`   ❌ Error durante login: ${error.message}\n`);
    }

    // 10. Mantener navegador abierto para inspección manual
    console.log('🔟 Manteniendo navegador abierto por 30 segundos para inspección manual...');
    console.log('   (Puedes interactuar con el navegador ahora)\n');
    await page.waitForTimeout(30000);

    console.log('='.repeat(80));
    console.log('✅ PRUEBA VISUAL COMPLETADA');
    console.log('='.repeat(80));
    console.log('\n📸 Screenshots guardados en: visual-verification-results/');
    console.log('   - stagehand-landing.png');
    console.log('   - stagehand-login.png');
    console.log('   - stagehand-post-login.png');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    console.error(error.stack);
  } finally {
    // Cerrar navegador
    console.log('\n🔚 Cerrando navegador...');
    await stagehand.close();
    console.log('✅ Navegador cerrado\n');
  }
}

// Ejecutar prueba
runVisualTest().catch(console.error);
