import { chromium } from 'playwright';

const BASE_URL = 'http://157.180.119.236';
const CREDENTIALS = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

async function testLoginManual() {
  console.log('🔐 Test manual de login\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Interceptar todas las requests/responses
  page.on('request', (request) => {
    if (request.url().includes('/api/auth')) {
      console.log(`📤 Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async (response) => {
    if (response.url().includes('/api/auth')) {
      console.log(`📥 Response: ${response.status()} ${response.url()}`);
      try {
        const body = await response.text();
        console.log(`   Body: ${body.substring(0, 200)}`);
      } catch (e) {
        console.log(`   (no body)`);
      }
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`🔴 Console error: ${msg.text()}`);
    }
  });

  try {
    console.log('1️⃣  Navegando a login...');
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    console.log('   ✓ Página cargada\n');

    console.log('2️⃣  Esperando formulario...');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    console.log('   ✓ Formulario encontrado\n');

    // Screenshot before
    await page.screenshot({ path: '/workspace/scripts/screenshots/login-before.png' });
    console.log('   📸 Screenshot guardado: login-before.png\n');

    console.log('3️⃣  Llenando credenciales...');
    await page.fill('input[name="email"]', CREDENTIALS.email);
    await page.fill('input[name="password"]', CREDENTIALS.password);
    console.log(`   ✓ Email: ${CREDENTIALS.email}\n`);

    console.log('4️⃣  Enviando formulario...');
    await Promise.all([
      page.waitForNavigation({ timeout: 30000 }).catch(() => console.log('   (No navigation detected)')),
      page.click('button[type="submit"]'),
    ]);

    // Wait a bit
    await page.waitForTimeout(3000);

    // Screenshot after
    await page.screenshot({ path: '/workspace/scripts/screenshots/login-after.png', fullPage: true });
    console.log('   📸 Screenshot guardado: login-after.png\n');

    console.log('5️⃣  Verificando resultado...');
    const currentUrl = page.url();
    console.log(`   URL actual: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('\n❌ LOGIN FALLÓ - Todavía en página de login\n');

      // Check for error messages
      const errorMessages = await page.evaluate(() => {
        const texts: string[] = [];
        document.querySelectorAll('*').forEach((el) => {
          const text = el.textContent?.toLowerCase() || '';
          if (text.includes('error') || text.includes('incorrecto') || text.includes('inválido')) {
            texts.push(el.textContent || '');
          }
        });
        return texts;
      });

      if (errorMessages.length > 0) {
        console.log('   Mensajes de error encontrados:');
        errorMessages.forEach((msg) => console.log(`   - ${msg.substring(0, 100)}`));
      }

      return false;
    } else {
      console.log(`\n✅ LOGIN EXITOSO - Redirigido a: ${currentUrl}\n`);
      return true;
    }
  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}\n`);
    return false;
  } finally {
    await browser.close();
  }
}

testLoginManual().then((success) => {
  process.exit(success ? 0 : 1);
});
