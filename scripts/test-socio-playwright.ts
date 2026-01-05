/**
 * Test de login del socio eWoorker con Playwright
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const SOCIO_EMAIL = 'socio@ewoorker.com';
const SOCIO_PASSWORD = 'Ewoorker2025!Socio';

async function testSocioLogin() {
  console.log('🎭 Iniciando test de login del socio eWoorker...\n');
  
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Paso 1: Ir a la página de login
    console.log('📍 Paso 1: Navegando a login...');
    await page.goto(`${BASE_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✓ Página de login cargada');
    console.log(`  URL: ${page.url()}`);
    
    // Verificar que existe el formulario
    const emailInput = await page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = await page.locator('input[name="password"], input[type="password"]').first();
    
    if (!await emailInput.isVisible()) {
      throw new Error('Campo de email no encontrado');
    }
    console.log('✓ Formulario de login visible');
    
    // Paso 2: Llenar credenciales
    console.log('\n📍 Paso 2: Llenando credenciales...');
    await emailInput.fill(SOCIO_EMAIL);
    await passwordInput.fill(SOCIO_PASSWORD);
    console.log(`✓ Email: ${SOCIO_EMAIL}`);
    console.log('✓ Password: ********');
    
    // Paso 3: Submit
    console.log('\n📍 Paso 3: Enviando formulario...');
    const submitButton = await page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Esperar navegación
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`✓ URL después de submit: ${currentUrl}`);
    
    // Paso 4: Verificar resultado
    console.log('\n📍 Paso 4: Verificando resultado...');
    
    if (currentUrl.includes('error')) {
      // Buscar mensaje de error
      const errorMessage = await page.locator('.text-red-500, .text-destructive, [role="alert"]').first().textContent().catch(() => null);
      console.log(`❌ ERROR DE LOGIN`);
      console.log(`  Mensaje: ${errorMessage || 'No visible'}`);
      
      // Capturar screenshot
      await page.screenshot({ path: '/tmp/login-error.png', fullPage: true });
      console.log('  Screenshot guardado en /tmp/login-error.png');
      
      return false;
    }
    
    if (currentUrl.includes('/login')) {
      console.log('❌ Redirigido de vuelta a login');
      
      // Buscar mensaje de error
      const errorMessage = await page.locator('.text-red-500, .text-destructive, [role="alert"], .error').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log(`  Error visible: ${errorMessage}`);
      }
      
      return false;
    }
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || currentUrl.includes('/ewoorker')) {
      console.log('✅ LOGIN EXITOSO');
      console.log(`  Redirigido a: ${currentUrl}`);
      
      // Verificar que podemos acceder al panel del socio
      console.log('\n📍 Paso 5: Navegando al panel del socio...');
      await page.goto(`${BASE_URL}/ewoorker/admin-socio`, { waitUntil: 'networkidle' });
      
      const panelUrl = page.url();
      console.log(`  URL panel: ${panelUrl}`);
      
      if (panelUrl.includes('/admin-socio')) {
        const title = await page.locator('h1').first().textContent().catch(() => null);
        console.log(`✅ ACCESO AL PANEL EXITOSO`);
        console.log(`  Título: ${title || 'Panel del Socio'}`);
        
        // Capturar screenshot
        await page.screenshot({ path: '/tmp/socio-panel.png', fullPage: true });
        console.log('  Screenshot guardado en /tmp/socio-panel.png');
        
        return true;
      } else {
        console.log('❌ No se pudo acceder al panel del socio');
        return false;
      }
    }
    
    console.log('⚠️ URL inesperada después del login');
    console.log(`  URL: ${currentUrl}`);
    return false;
    
  } catch (error: any) {
    console.log(`\n❌ ERROR: ${error.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar
testSocioLogin().then(success => {
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('✅ TEST PASSED - Login del socio funciona correctamente');
  } else {
    console.log('❌ TEST FAILED - Revisar los logs arriba');
  }
  console.log('='.repeat(60));
  process.exit(success ? 0 : 1);
});
