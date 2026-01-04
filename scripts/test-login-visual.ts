import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots', 'login-test');

async function testLoginVisual() {
  console.log('🎭 Iniciando test visual de Login...\n');
  
  // Crear directorio de screenshots
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    // 1. Navegar a login
    console.log(`📍 Navegando a ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);

    // 2. Screenshot inicial
    console.log('📸 Capturando screenshot inicial...');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-login-initial.png'),
      fullPage: true,
    });

    // 3. Verificar elementos visuales
    console.log('\n🔍 Verificando elementos visuales...');
    
    const checks: Array<{ name: string; result: boolean; details?: string }> = [];

    // Check: Título INMOVA visible
    const titleVisible = await page.locator('text=INMOVA').isVisible();
    checks.push({ name: 'Título INMOVA visible', result: titleVisible });

    // Check: Formulario visible
    const formVisible = await page.locator('form').isVisible();
    checks.push({ name: 'Formulario visible', result: formVisible });

    // Check: Input de email
    const emailInput = page.locator('input[type="email"]');
    const emailVisible = await emailInput.isVisible();
    const emailBgColor = await emailInput.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    checks.push({ 
      name: 'Input email visible', 
      result: emailVisible,
      details: `Background: ${emailBgColor}`
    });

    // Check: Input de password
    const passwordInput = page.locator('input[type="password"]');
    const passwordVisible = await passwordInput.isVisible();
    const passwordBgColor = await passwordInput.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    checks.push({ 
      name: 'Input password visible', 
      result: passwordVisible,
      details: `Background: ${passwordBgColor}`
    });

    // Check: Botón de submit
    const submitButton = page.locator('button[type="submit"]');
    const buttonVisible = await submitButton.isVisible();
    const buttonText = await submitButton.textContent();
    const buttonBgColor = await submitButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    checks.push({ 
      name: 'Botón submit visible', 
      result: buttonVisible,
      details: `Texto: "${buttonText?.trim()}", Background: ${buttonBgColor}`
    });

    // Check: Contraste de texto en inputs
    const emailColor = await emailInput.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const emailPlaceholderColor = await emailInput.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('::placeholder');
    });
    checks.push({ 
      name: 'Color de texto en email', 
      result: true,
      details: `Color: ${emailColor}`
    });

    // Check: Labels
    const emailLabel = page.locator('label[for="email"]');
    const emailLabelVisible = await emailLabel.isVisible();
    const emailLabelText = await emailLabel.textContent();
    const emailLabelColor = await emailLabel.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    checks.push({ 
      name: 'Label de email visible', 
      result: emailLabelVisible,
      details: `Texto: "${emailLabelText}", Color: ${emailLabelColor}`
    });

    // Imprimir resultados
    console.log('\n📊 Resultados de verificación visual:');
    checks.forEach((check, index) => {
      const icon = check.result ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
      if (check.details) {
        console.log(`   └─ ${check.details}`);
      }
    });

    // 4. Screenshot con focus en email
    console.log('\n📸 Capturando screenshot con focus en email...');
    await emailInput.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-login-email-focused.png'),
      fullPage: true,
    });

    // 5. Llenar formulario
    console.log('\n✍️  Llenando formulario con credenciales de prueba...');
    await emailInput.fill('admin@inmova.app');
    await passwordInput.fill('Admin123!');
    await page.waitForTimeout(500);

    // Screenshot con formulario lleno
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-login-form-filled.png'),
      fullPage: true,
    });

    // 6. Intentar login
    console.log('\n🔐 Intentando login...');
    
    // Capturar console logs y errores
    const consoleLogs: string[] = [];
    const errors: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', (err) => {
      errors.push(`[Page Error] ${err.message}`);
    });

    // Capturar respuestas de red
    const networkResponses: Array<{ url: string; status: number; statusText: string }> = [];
    page.on('response', (response) => {
      if (response.url().includes('api/auth')) {
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    await submitButton.click();
    
    // Esperar navegación o error
    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => null),
      page.waitForSelector('[role="alert"]', { timeout: 10000 }).catch(() => null),
      page.waitForTimeout(5000),
    ]);

    // Screenshot después de submit
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-login-after-submit.png'),
      fullPage: true,
    });

    // 7. Verificar resultado
    console.log('\n📊 Resultado del login:');
    
    const currentUrl = page.url();
    console.log(`URL actual: ${currentUrl}`);

    if (currentUrl.includes('dashboard')) {
      console.log('✅ Login exitoso - Redirigido a dashboard');
    } else {
      console.log('❌ Login falló - No redirigió a dashboard');
      
      // Buscar mensaje de error
      const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);
      if (errorMsg) {
        console.log(`   Error mostrado: "${errorMsg.trim()}"`);
      }
    }

    // 8. Mostrar logs de red
    if (networkResponses.length > 0) {
      console.log('\n🌐 Respuestas de API de autenticación:');
      networkResponses.forEach((resp) => {
        const icon = resp.status === 200 ? '✅' : '❌';
        console.log(`${icon} ${resp.status} ${resp.statusText} - ${resp.url}`);
      });
    }

    // 9. Mostrar errores
    if (errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      errors.forEach((err) => console.log(`   ${err}`));
    }

    // 10. Resumen final
    console.log('\n📁 Screenshots guardados en:', SCREENSHOTS_DIR);
    console.log('\n✨ Test visual completado');

    // Retornar resumen
    return {
      success: currentUrl.includes('dashboard'),
      checks,
      errors,
      networkResponses,
    };

  } catch (error: any) {
    console.error('❌ Error en test visual:', error.message);
    
    // Screenshot de error
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '99-error.png'),
      fullPage: true,
    });

    throw error;
  } finally {
    await browser.close();
  }
}

// Ejecutar
testLoginVisual()
  .then((result) => {
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
