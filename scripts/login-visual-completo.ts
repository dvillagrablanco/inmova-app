/**
 * Script para hacer login visual COMPLETO
 * No se detiene hasta entrar exitosamente en el dashboard
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'login-visual-results');
const LOGIN_URL = 'https://inmovaapp.com/login';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Test1234!';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveScreenshot(page: Page, name: string) {
  const filepath = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`   📸 Screenshot: ${name}.png`);
  return filepath;
}

async function savePageHTML(page: Page, name: string) {
  const content = await page.content();
  const filepath = path.join(RESULTS_DIR, `${name}.html`);
  fs.writeFileSync(filepath, content);
  console.log(`   📄 HTML: ${name}.html`);
  return filepath;
}

async function loginVisualCompleto() {
  console.log('\n' + '═'.repeat(80));
  console.log('🔐 LOGIN VISUAL COMPLETO - INMOVAAPP.COM');
  console.log('═'.repeat(80) + '\n');

  // Crear directorio
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  let browser: Browser | null = null;
  
  try {
    // Iniciar browser
    console.log('🌐 Iniciando navegador...\n');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const page = await browser.newPage();
    
    // Viewport más grande
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Configurar user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Interceptar logs de consola
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`   🖥️  Console ${type}: ${msg.text()}`);
      }
    });

    // Interceptar respuestas de red
    const responses: any[] = [];
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/auth/')) {
        const status = response.status();
        console.log(`   🌐 API: ${status} ${url}`);
        responses.push({ url, status, statusText: response.statusText() });
      }
    });

    // ==========================================
    // PASO 1: Navegar a la página de login
    // ==========================================
    console.log('📍 PASO 1: Navegando a la página de login...');
    console.log(`   URL: ${LOGIN_URL}\n`);

    await page.goto(LOGIN_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await sleep(2000);
    await saveScreenshot(page, '01-pagina-login');
    await savePageHTML(page, '01-pagina-login');

    const currentUrl1 = page.url();
    console.log(`   ✅ Página cargada: ${currentUrl1}\n`);

    // ==========================================
    // PASO 2: Verificar formulario
    // ==========================================
    console.log('📍 PASO 2: Verificando campos del formulario...\n');

    // Esperar campos
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });

    console.log('   ✅ Campo email encontrado');
    console.log('   ✅ Campo password encontrado');
    console.log('   ✅ Botón submit encontrado\n');

    // ==========================================
    // PASO 3: Obtener CSRF Token
    // ==========================================
    console.log('📍 PASO 3: Obteniendo CSRF token...\n');

    // Navegar primero a /api/auth/csrf para obtener el token
    const csrfResponse = await page.goto('https://inmovaapp.com/api/auth/csrf');
    const csrfData = await csrfResponse?.json();
    console.log(`   ✅ CSRF Token: ${csrfData?.csrfToken?.substring(0, 30)}...\n`);

    // Volver a la página de login
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    await sleep(1000);

    // ==========================================
    // PASO 4: Llenar formulario
    // ==========================================
    console.log('📍 PASO 4: Llenando formulario...\n');
    console.log(`   📧 Email: ${EMAIL}`);
    console.log(`   🔑 Password: ${PASSWORD}`);
    console.log(`   🎫 CSRF: ${csrfData?.csrfToken?.substring(0, 20)}...\n`);

    // Limpiar campos primero
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');

    // Escribir valores
    await page.type('input[type="email"]', EMAIL, { delay: 50 });
    await page.type('input[type="password"]', PASSWORD, { delay: 50 });

    await sleep(1000);
    await saveScreenshot(page, '02-formulario-lleno');

    console.log('   ✅ Formulario llenado\n');

    // ==========================================
    // PASO 5: Submit del formulario
    // ==========================================
    console.log('📍 PASO 5: Enviando formulario...\n');

    // Esperar la navegación después del submit
    const submitPromise = Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ]);

    console.log('   ⏳ Esperando respuesta del servidor...');
    
    await submitPromise;
    await sleep(3000);

    await saveScreenshot(page, '03-despues-submit');
    await savePageHTML(page, '03-despues-submit');

    const currentUrl2 = page.url();
    console.log(`\n   📍 URL después de submit: ${currentUrl2}`);

    // ==========================================
    // PASO 6: Verificar resultado
    // ==========================================
    console.log('\n📍 PASO 6: Verificando resultado del login...\n');

    // Verificar si hay mensaje de error
    const errorMessages = await page.$$eval(
      '[role="alert"], .text-red-500, .text-red-700, .bg-red-50',
      elements => elements.map(el => el.textContent?.trim()).filter(Boolean)
    );

    if (errorMessages.length > 0) {
      console.log('   ❌ Mensajes de error encontrados:');
      errorMessages.forEach(msg => console.log(`      - ${msg}`));
      console.log('');
    }

    // Verificar si seguimos en login
    if (currentUrl2.includes('/login')) {
      console.log('   ⚠️  Seguimos en /login - Login puede haber fallado');
      
      // Mostrar contenido de la página
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('\n   📄 Contenido de la página (primeros 500 caracteres):');
      console.log('   ' + bodyText.substring(0, 500).replace(/\n/g, '\n   '));
      
      console.log('\n   🔍 Revisando respuestas de API:');
      responses.forEach(r => {
        console.log(`      ${r.status} ${r.url}`);
      });

      console.log('\n❌ LOGIN FALLÓ - No se pudo acceder\n');
      return false;
    }

    // ==========================================
    // PASO 7: Verificar acceso al dashboard
    // ==========================================
    console.log('\n📍 PASO 7: Verificando acceso al dashboard...\n');

    await sleep(2000);
    
    // Intentar navegar al dashboard si no estamos ahí
    if (!currentUrl2.includes('/dashboard')) {
      console.log('   ℹ️  No estamos en dashboard, navegando...');
      await page.goto('https://inmovaapp.com/dashboard', {
        waitUntil: 'networkidle2',
        timeout: 15000,
      }).catch(() => null);
      
      await sleep(2000);
    }

    await saveScreenshot(page, '04-dashboard');
    await savePageHTML(page, '04-dashboard');

    const finalUrl = page.url();
    console.log(`   📍 URL final: ${finalUrl}`);

    // Verificar que NO estamos en login
    if (finalUrl.includes('/login')) {
      console.log('\n   ❌ Fuimos redirigidos a /login - NO hay sesión\n');
      return false;
    }

    // Buscar elementos que indican sesión activa
    const sessionIndicators = await page.evaluate(() => {
      const indicators = {
        userEmail: false,
        logoutButton: false,
        dashboard: false,
        userMenu: false,
      };

      // Buscar email del usuario
      const bodyText = document.body.innerText;
      if (bodyText.includes('admin@inmova.app') || bodyText.includes('Admin')) {
        indicators.userEmail = true;
      }

      // Buscar botón de cerrar sesión
      if (bodyText.match(/cerrar sesión|salir|logout|sign out/i)) {
        indicators.logoutButton = true;
      }

      // Buscar palabra dashboard
      if (bodyText.match(/dashboard|panel|inicio/i)) {
        indicators.dashboard = true;
      }

      // Buscar menú de usuario
      if (document.querySelector('[data-testid="user-menu"]') || 
          document.querySelector('.user-menu') ||
          bodyText.includes('Mi Perfil')) {
        indicators.userMenu = true;
      }

      return indicators;
    });

    console.log('\n   🔍 Indicadores de sesión:');
    console.log(`      Email visible: ${sessionIndicators.userEmail ? '✅' : '❌'}`);
    console.log(`      Botón logout: ${sessionIndicators.logoutButton ? '✅' : '❌'}`);
    console.log(`      Dashboard: ${sessionIndicators.dashboard ? '✅' : '❌'}`);
    console.log(`      Menú usuario: ${sessionIndicators.userMenu ? '✅' : '❌'}`);

    const sessionActive = Object.values(sessionIndicators).some(v => v === true);

    await saveScreenshot(page, '05-verificacion-final');

    console.log('\n' + '═'.repeat(80));
    
    if (sessionActive && !finalUrl.includes('/login')) {
      console.log('✅ ¡LOGIN EXITOSO! - Sesión iniciada correctamente');
      console.log(`📍 Ubicación: ${finalUrl}`);
      console.log('═'.repeat(80) + '\n');
      
      console.log('📁 Screenshots guardados en:');
      console.log(`   ${RESULTS_DIR}/`);
      console.log('   - 01-pagina-login.png');
      console.log('   - 02-formulario-lleno.png');
      console.log('   - 03-despues-submit.png');
      console.log('   - 04-dashboard.png');
      console.log('   - 05-verificacion-final.png\n');
      
      return true;
    } else {
      console.log('❌ LOGIN FALLÓ - No se detectó sesión activa');
      console.log('═'.repeat(80) + '\n');
      
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL PROCESO:', error);
    
    if (browser) {
      const pages = await browser.pages();
      if (pages[0]) {
        await saveScreenshot(pages[0], 'error-screenshot');
        await savePageHTML(pages[0], 'error-page');
      }
    }
    
    return false;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Navegador cerrado\n');
    }
  }
}

// Ejecutar
loginVisualCompleto()
  .then(success => {
    if (success) {
      console.log('✅ PROCESO COMPLETADO EXITOSAMENTE\n');
      process.exit(0);
    } else {
      console.log('❌ PROCESO FALLÓ - Revisar logs y screenshots\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
