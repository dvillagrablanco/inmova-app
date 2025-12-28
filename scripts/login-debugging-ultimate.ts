/**
 * Script de debugging completo - Intentará login de TODAS las formas posibles
 * No se detiene hasta conseguir acceso
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'login-debug-ultimate');
const LOGIN_URL = 'https://inmovaapp.com/login';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Test1234!';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveScreenshot(page: Page, name: string) {
  const filepath = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`   📸 ${name}.png`);
  return filepath;
}

async function ultimateLoginAttempt() {
  console.log('\n' + '═'.repeat(80));
  console.log('🔥 INTENTO DEFINITIVO DE LOGIN - NO PARARÉ HASTA ENTRAR');
  console.log('═'.repeat(80) + '\n');

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  let browser: Browser | null = null;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Interceptar requests
    const requests: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/')) {
        requests.push({ method: request.method(), url: request.url() });
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/auth/callback/credentials')) {
        const status = response.status();
        const headers = response.headers();
        console.log(`\n   🔥 AUTH CALLBACK: ${status}`);
        console.log(`   🍪 Cookies:`, headers['set-cookie']);
      }
    });

    // ==========================================
    // MÉTODO 1: Login tradicional con formulario
    // ==========================================
    console.log('\n🔵 MÉTODO 1: Login con formulario tradicional\n');
    
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await saveScreenshot(page, '01-pagina-inicial');

    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', EMAIL, { delay: 100 });
    await page.type('input[type="password"]', PASSWORD, { delay: 100 });
    await sleep(1000);
    await saveScreenshot(page, '02-formulario-lleno');

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => null),
    ]);

    await sleep(3000);
    await saveScreenshot(page, '03-despues-submit');

    let currentUrl = page.url();
    console.log(`   📍 URL: ${currentUrl}`);

    if (!currentUrl.includes('/login')) {
      console.log('   ✅ ¡Salimos de /login!');
      await saveScreenshot(page, '04-posible-exito');
      
      // Verificar sesión
      const cookies = await page.cookies();
      const authCookie = cookies.find(c => c.name.includes('next-auth'));
      if (authCookie) {
        console.log('   ✅ ¡Cookie de sesión encontrada!');
        console.log('\n🎉 LOGIN EXITOSO - Método 1\n');
        await saveScreenshot(page, '05-dashboard-final');
        return true;
      }
    }

    console.log('   ❌ Método 1 falló\n');

    // ==========================================
    // MÉTODO 2: Login con evaluateHandle (inyección directa)
    // ==========================================
    console.log('\n🟡 MÉTODO 2: Inyección directa de formulario\n');

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Obtener CSRF token del DOM
    const csrfToken = await page.evaluate(() => {
      const input = document.querySelector('input[name="csrfToken"]') as HTMLInputElement;
      return input?.value || '';
    });

    console.log(`   🎫 CSRF: ${csrfToken.substring(0, 20)}...`);

    // Submit programáticamente
    await page.evaluate((email, password, csrf) => {
      const form = document.querySelector('form');
      if (form) {
        const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
        const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
        
        if (emailInput && passwordInput) {
          emailInput.value = email;
          passwordInput.value = password;
          
          // Disparar eventos
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          form.submit();
        }
      }
    }, EMAIL, PASSWORD, csrfToken);

    await sleep(5000);
    await saveScreenshot(page, '06-metodo2-resultado');

    currentUrl = page.url();
    console.log(`   📍 URL: ${currentUrl}`);

    if (!currentUrl.includes('/login')) {
      console.log('   ✅ ¡Salimos de /login!');
      const cookies = await page.cookies();
      const authCookie = cookies.find(c => c.name.includes('next-auth'));
      if (authCookie) {
        console.log('   ✅ ¡Cookie de sesión encontrada!');
        console.log('\n🎉 LOGIN EXITOSO - Método 2\n');
        await saveScreenshot(page, '07-dashboard-metodo2');
        return true;
      }
    }

    console.log('   ❌ Método 2 falló\n');

    // ==========================================
    // MÉTODO 3: API directa con cookies
    // ==========================================
    console.log('\n🟢 MÉTODO 3: Login directo via API con cookies\n');

    await page.goto('https://inmovaapp.com/api/auth/csrf');
    const csrfData = await page.evaluate(() => document.body.textContent);
    const csrf = JSON.parse(csrfData || '{}').csrfToken;
    
    console.log(`   🎫 CSRF obtenido: ${csrf?.substring(0, 20)}...`);

    // Hacer POST con fetch desde el contexto del navegador
    const loginResult = await page.evaluate(async (email, password, csrfToken) => {
      try {
        const response = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: email,
            password: password,
            csrfToken: csrfToken,
            callbackUrl: '/',
            json: 'true',
          }).toString(),
          redirect: 'manual',
        });

        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    }, EMAIL, PASSWORD, csrf);

    console.log('   📊 Resultado:', JSON.stringify(loginResult, null, 2));

    await sleep(2000);
    
    // Navegar a dashboard
    await page.goto('https://inmovaapp.com/dashboard', { waitUntil: 'networkidle2' }).catch(() => null);
    await sleep(3000);
    await saveScreenshot(page, '08-metodo3-dashboard');

    currentUrl = page.url();
    console.log(`   📍 URL final: ${currentUrl}`);

    if (!currentUrl.includes('/login')) {
      console.log('   ✅ ¡No estamos en /login!');
      const cookies = await page.cookies();
      const authCookie = cookies.find(c => c.name.includes('next-auth'));
      if (authCookie) {
        console.log('   ✅ ¡Cookie de sesión encontrada!');
        console.log('\n🎉 LOGIN EXITOSO - Método 3\n');
        await saveScreenshot(page, '09-dashboard-metodo3-final');
        return true;
      }
    }

    console.log('   ❌ Método 3 falló\n');

    // ==========================================
    // MÉTODO 4: Set cookies manualmente
    // ==========================================
    console.log('\n🔴 MÉTODO 4: Intentando setear cookies manualmente\n');

    // Intentar crear una sesión válida directamente
    await page.goto('https://inmovaapp.com');
    
    // Hacer login por API primero
    const apiLogin = await page.evaluate(async (email, password) => {
      const csrfRes = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfRes.json();
      
      const loginRes = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          email,
          password,
          csrfToken,
          callbackUrl: '/dashboard',
          json: 'true',
        }).toString(),
        credentials: 'include',
      });
      
      return {
        status: loginRes.status,
        ok: loginRes.ok,
      };
    }, EMAIL, PASSWORD);

    console.log('   📊 API Login result:', apiLogin);

    await sleep(2000);
    await page.goto('https://inmovaapp.com/dashboard', { waitUntil: 'networkidle2' }).catch(() => null);
    await sleep(3000);
    await saveScreenshot(page, '10-metodo4-resultado');

    currentUrl = page.url();
    console.log(`   📍 URL final: ${currentUrl}`);

    const finalCookies = await page.cookies();
    console.log(`   🍪 Cookies totales: ${finalCookies.length}`);
    finalCookies.forEach(c => {
      if (c.name.includes('auth')) {
        console.log(`      - ${c.name}: ${c.value.substring(0, 30)}...`);
      }
    });

    if (!currentUrl.includes('/login')) {
      console.log('\n🎉 ¡ÉXITO! Estamos dentro de la app');
      await saveScreenshot(page, '11-EXITO-FINAL');
      return true;
    }

    console.log('\n❌ Todos los métodos fallaron');
    return false;

  } catch (error) {
    console.error('\n💥 ERROR:', error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

ultimateLoginAttempt()
  .then(success => {
    if (success) {
      console.log('\n✅✅✅ LOGIN CONFIRMADO VISUALMENTE ✅✅✅\n');
      process.exit(0);
    } else {
      console.log('\n❌ No se pudo acceder\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
