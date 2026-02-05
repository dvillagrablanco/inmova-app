import { chromium, Browser, Page } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env' });

const BASE_URL = process.env.BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
const LOGIN_EMAIL = process.env.TEST_USER_EMAIL || process.env.ADMIN_EMAIL || 'admin@inmova.app';
const LOGIN_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin123!';

const normalizedBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

async function runVisualTest() {
  console.log('\nINICIANDO PRUEBA VISUAL CON PLAYWRIGHT\n');
  console.log('='.repeat(80) + '\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // 1. Lanzar navegador (headless mode - sin GUI)
    console.log('1. Lanzando navegador (headless mode)...');
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    page = await context.newPage();
    console.log('   OK - Navegador lanzado\n');

    // 2. Ir a la landing pública
    console.log(`2. Navegando a ${normalizedBaseUrl}...`);
    await page.goto(normalizedBaseUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const pageTitle = await page.title();
    console.log('   Titulo:', pageTitle);

    if (pageTitle.includes('INMOVA') || pageTitle.includes('PropTech')) {
      console.log('   OK - Landing NUEVA detectada\n');
    } else {
      console.log('   WARNING - Landing antigua o diferente\n');
    }

    // 3. Screenshot de la landing
    console.log('3. Capturando screenshot de la landing...');
    await page.screenshot({
      path: 'visual-verification-results/playwright-landing.png',
      fullPage: true,
    });
    console.log('   OK - Screenshot guardado: playwright-landing.png\n');

    // 4. Verificar contenido de la landing
    console.log('4. Verificando contenido de la landing...');
    const bodyText = await page.textContent('body');
    const hasPropTech = bodyText?.includes('PropTech') || false;
    const hasINMOVA = bodyText?.includes('INMOVA') || false;
    console.log('   Contiene "PropTech":', hasPropTech ? 'SI' : 'NO');
    console.log('   Contiene "INMOVA":', hasINMOVA ? 'SI' : 'NO');
    console.log('   OK - Verificacion completada\n');

    // 5. Buscar y clickear botón de login
    console.log('5. Buscando boton de login/acceso...');

    try {
      const loginButton = await page
        .locator(
          'a[href*="/login"], button:has-text("Iniciar sesión"), a:has-text("Acceder"), a:has-text("Login")'
        )
        .first();

      if (await loginButton.isVisible()) {
        console.log('   OK - Boton de login encontrado, clickeando...');
        await loginButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle' });
        console.log('   OK - Navegacion completada\n');
      } else {
        throw new Error('Boton no visible');
      }
    } catch (error) {
      console.log(
        '   WARNING - No se encontro boton de login, navegando directamente a /login...\n'
      );
      await page.goto(`${normalizedBaseUrl}/login`, {
        waitUntil: 'networkidle',
      });
    }

    // 6. Página de login
    console.log('6. Esperando pagina de login...');
    await page.waitForTimeout(3000);

    const loginTitle = await page.title();
    console.log('   Titulo:', loginTitle);
    console.log('   OK - Pagina de login cargada\n');

    // 7. Screenshot del login
    console.log('7. Capturando screenshot del login...');
    await page.screenshot({
      path: 'visual-verification-results/playwright-login.png',
      fullPage: true,
    });
    console.log('   OK - Screenshot guardado: playwright-login.png\n');

    // 8. Intentar login
    console.log('8. Intentando login...');
    console.log(`   Credenciales: ${LOGIN_EMAIL} / ${LOGIN_PASSWORD}\n`);

    try {
      const emailField = await page
        .locator(
          'input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="correo" i]'
        )
        .first();

      if (await emailField.isVisible()) {
        console.log('   OK - Campo email encontrado');
        await emailField.fill(LOGIN_EMAIL);
        await page.waitForTimeout(500);
      }

      const passwordField = await page
        .locator('input[type="password"], input[name="password"]')
        .first();

      if (await passwordField.isVisible()) {
        console.log('   OK - Campo password encontrado');
        await passwordField.fill(LOGIN_PASSWORD);
        await page.waitForTimeout(500);
      }

      const submitButton = await page
        .locator(
          'button[type="submit"], button:has-text("Entrar"), button:has-text("Iniciar sesión"), button:has-text("Login")'
        )
        .first();

      if (await submitButton.isVisible()) {
        console.log('   OK - Boton de submit encontrado, clickeando...');
        await submitButton.click();
        await page.waitForTimeout(5000);
      }

      const currentUrl = page.url();
      console.log('\n   URL actual:', currentUrl);

      if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
        console.log('   OK - Login exitoso - Redirigió al dashboard\n');
      } else if (currentUrl.includes('/login')) {
        console.log('   WARNING - Login fallo - Permanece en /login\n');
      } else {
        console.log('   INFO - Redirigió a:', currentUrl, '\n');
      }

      console.log('9. Capturando screenshot post-login...');
      await page.screenshot({
        path: 'visual-verification-results/playwright-post-login.png',
        fullPage: true,
      });
      console.log('   OK - Screenshot guardado: playwright-post-login.png\n');
    } catch (error: any) {
      console.log('   ERROR durante login:', error.message, '\n');
    }

    // 10. Resumen final
    console.log('10. Prueba completada!');

    console.log('='.repeat(80));
    console.log('PRUEBA VISUAL COMPLETADA');
    console.log('='.repeat(80));
    console.log('\nScreenshots guardados en: visual-verification-results/');
    console.log('   - playwright-landing.png');
    console.log('   - playwright-login.png');
    console.log('   - playwright-post-login.png');
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error: any) {
    console.error('\nERROR durante la prueba:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      console.log('\nCerrando navegador...');
      await browser.close();
      console.log('Navegador cerrado\n');
    }
  }
}

runVisualTest().catch(console.error);
