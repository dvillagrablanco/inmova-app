import { chromium } from 'playwright';

const BASE_URL = 'http://157.180.119.236';
const CREDENTIALS = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

async function testLoginAvanzado() {
  console.log('🔐 Test avanzado de login\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let authCallMade = false;
  let authResponse: any = null;

  // Interceptar auth calls
  page.on('request', (request) => {
    if (request.url().includes('/api/auth') && request.method() === 'POST') {
      authCallMade = true;
      console.log(`📤 POST Auth: ${request.url()}`);
    }
  });

  page.on('response', async (response) => {
    if (response.url().includes('/api/auth') && response.request().method() === 'POST') {
      authResponse = response;
      console.log(`📥 Response Auth: ${response.status()}`);
      try {
        const body = await response.json();
        console.log(`   Body: ${JSON.stringify(body).substring(0, 200)}`);
      } catch (e) {
        console.log(`   (no JSON body)`);
      }
    }
  });

  try {
    console.log('1️⃣  Navegando a login y esperando JS...');
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // Extra wait for hydration
    await page.waitForTimeout(3000);
    console.log('   ✓ Página hidratada\n');

    console.log('2️⃣  Verificando que NextAuth está disponible...');
    const nextAuthReady = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             'next' in window && 
             typeof (window as any).__NEXT_DATA__ !== 'undefined';
    });
    console.log(`   NextAuth ready: ${nextAuthReady}\n`);

    console.log('3️⃣  Llenando formulario...');
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 10000 });
    
    // Type slowly to simulate real user
    await page.type('input[name="email"]', CREDENTIALS.email, { delay: 50 });
    await page.type('input[name="password"]', CREDENTIALS.password, { delay: 50 });
    await page.waitForTimeout(500);
    console.log('   ✓ Credenciales llenadas\n');

    console.log('4️⃣  Haciendo click en submit...');
    await page.click('button[type="submit"]');
    
    console.log('5️⃣  Esperando auth call...');
    await page.waitForTimeout(5000);
    
    if (!authCallMade) {
      console.log('   ⚠️  No se detectó llamada POST a auth API\n');
      console.log('   Verificando si el form tiene action...');
      const formAction = await page.evaluate(() => {
        const form = document.querySelector('form');
        return {
          action: form?.getAttribute('action'),
          method: form?.getAttribute('method'),
          onsubmit: form?.onsubmit ? 'defined' : 'not defined',
        };
      });
      console.log(`   Form: ${JSON.stringify(formAction)}\n`);
    } else {
      console.log('   ✓ Auth call detectada\n');
    }

    console.log('6️⃣  Verificando resultado...');
    const currentUrl = page.url();
    console.log(`   URL final: ${currentUrl}`);

    await page.screenshot({ path: '/workspace/scripts/screenshots/login-final.png', fullPage: true });

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || currentUrl.includes('/portal')) {
      console.log('\n✅ LOGIN EXITOSO\n');
      return true;
    } else if (currentUrl.includes('/login')) {
      console.log('\n❌ LOGIN FALLÓ - Sin redirección\n');
      
      // Check error message on page
      const errorVisible = await page.locator('text=/error|incorrecto|inválid/i').isVisible().catch(() => false);
      if (errorVisible) {
        const errorText = await page.locator('text=/error|incorrecto|inválid/i').first().textContent();
        console.log(`   Error mostrado: ${errorText}\n`);
      }
      
      return false;
    } else {
      console.log(`\n⚠️  Redirigido a: ${currentUrl}\n`);
      return false;
    }
  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}\n`);
    return false;
  } finally {
    await browser.close();
  }
}

testLoginAvanzado().then((success) => {
  process.exit(success ? 0 : 1);
});
