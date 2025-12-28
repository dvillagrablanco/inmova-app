/**
 * Script GUI para login visual con monitoreo de logs en tiempo real
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const RESULTS_DIR = path.join(process.cwd(), 'gui-login-results');
const LOGIN_URL = 'https://inmovaapp.com/login';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Test1234!';

interface LoginResult {
  success: boolean;
  screenshot?: string;
  url?: string;
  cookies?: any[];
  logs?: string[];
  error?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveScreenshot(page: Page, name: string): Promise<string> {
  const filepath = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`   📸 Screenshot: ${name}.png`);
  return filepath;
}

async function getServerLogs(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker logs inmova 2>&1 | tail -50"`
    );
    return stdout;
  } catch (error: any) {
    return `Error getting logs: ${error.message}`;
  }
}

async function guiLoginAttempt(): Promise<LoginResult> {
  console.log('\n' + '═'.repeat(80));
  console.log('🖥️  GUI LOGIN - ACCESO VISUAL CON MONITOREO DE LOGS');
  console.log('═'.repeat(80) + '\n');

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  let browser: Browser | null = null;
  const result: LoginResult = {
    success: false,
    logs: [],
  };

  try {
    console.log('🚀 Iniciando navegador...');
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
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Capturar console logs de la página
    page.on('console', msg => {
      const text = msg.text();
      result.logs?.push(`[BROWSER] ${text}`);
      if (text.includes('error') || text.includes('Error')) {
        console.log(`   🔴 Console Error: ${text}`);
      }
    });

    // Capturar errores de página
    page.on('pageerror', error => {
      const errorMsg = error.toString();
      result.logs?.push(`[PAGE ERROR] ${errorMsg}`);
      console.log(`   💥 Page Error: ${errorMsg}`);
    });

    // Capturar errores de requests
    page.on('requestfailed', request => {
      const failure = request.failure();
      result.logs?.push(`[REQUEST FAILED] ${request.url()} - ${failure?.errorText}`);
      console.log(`   ❌ Request Failed: ${request.url()} - ${failure?.errorText}`);
    });

    console.log('\n📍 Paso 1: Navegando a la página de login...');
    console.log(`   URL: ${LOGIN_URL}`);
    
    try {
      await page.goto(LOGIN_URL, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
      console.log('   ✅ Página cargada');
    } catch (error: any) {
      console.log(`   ⚠️  Timeout en networkidle0, intentando con domcontentloaded...`);
      await page.goto(LOGIN_URL, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
    }

    await sleep(3000);
    const screenshot1 = await saveScreenshot(page, '01-pagina-login');

    // Obtener logs del servidor
    console.log('\n📊 Obteniendo logs del servidor...');
    const serverLogs1 = await getServerLogs();
    result.logs?.push('=== SERVER LOGS BEFORE LOGIN ===');
    result.logs?.push(serverLogs1);

    // Verificar si hay formulario
    console.log('\n📍 Paso 2: Buscando formulario de login...');
    const hasForm = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const form = document.querySelector('form');
      
      return {
        hasEmail: !!emailInput,
        hasPassword: !!passwordInput,
        hasForm: !!form,
        bodyText: document.body.innerText.substring(0, 200),
      };
    });

    console.log('   📋 Elementos encontrados:');
    console.log(`      - Email input: ${hasForm.hasEmail ? '✅' : '❌'}`);
    console.log(`      - Password input: ${hasForm.hasPassword ? '✅' : '❌'}`);
    console.log(`      - Formulario: ${hasForm.hasForm ? '✅' : '❌'}`);
    console.log(`      - Body text: ${hasForm.bodyText}`);

    if (!hasForm.hasEmail || !hasForm.hasPassword) {
      result.error = 'Formulario no encontrado en la página';
      result.screenshot = screenshot1;
      result.url = page.url();
      return result;
    }

    console.log('\n📍 Paso 3: Llenando formulario...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', EMAIL, { delay: 50 });
    console.log(`   ✅ Email ingresado: ${EMAIL}`);

    await page.type('input[type="password"]', PASSWORD, { delay: 50 });
    console.log(`   ✅ Password ingresado: ${'*'.repeat(PASSWORD.length)}`);

    await sleep(1000);
    await saveScreenshot(page, '02-formulario-completo');

    console.log('\n📍 Paso 4: Enviando formulario...');
    
    // Monitorear la respuesta del auth endpoint
    const authPromise = new Promise<number>((resolve) => {
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/auth/callback/credentials')) {
          const status = response.status();
          console.log(`   🔥 AUTH RESPONSE: ${status}`);
          resolve(status);
        }
      });
    });

    // Hacer click en submit
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {
        console.log('   ⚠️  Navigation timeout (puede ser normal si hay redirect)');
      }),
    ]);

    // Esperar respuesta de auth
    const authStatus = await Promise.race([
      authPromise,
      sleep(10000).then(() => 0),
    ]);

    console.log(`   📊 Status de autenticación: ${authStatus || 'No capturado'}`);

    await sleep(3000);
    await saveScreenshot(page, '03-despues-submit');

    // Obtener logs del servidor después del login
    console.log('\n📊 Obteniendo logs del servidor después del login...');
    const serverLogs2 = await getServerLogs();
    result.logs?.push('=== SERVER LOGS AFTER LOGIN ===');
    result.logs?.push(serverLogs2);

    // Analizar logs para encontrar errores
    const authErrors = serverLogs2.match(/AUTH.*?(?:error|Error|ERROR|❌|💥)/gi);
    if (authErrors && authErrors.length > 0) {
      console.log('\n🔴 Errores encontrados en logs de auth:');
      authErrors.forEach(err => console.log(`   - ${err}`));
    }

    const currentUrl = page.url();
    result.url = currentUrl;
    console.log(`\n📍 URL actual: ${currentUrl}`);

    // Verificar si salimos de la página de login
    if (!currentUrl.includes('/login')) {
      console.log('   ✅ ¡Salimos de /login!');
      
      // Verificar cookies
      const cookies = await page.cookies();
      result.cookies = cookies;
      const authCookie = cookies.find(c => c.name.includes('next-auth') && c.name.includes('session'));
      
      console.log(`\n🍪 Cookies encontradas: ${cookies.length}`);
      cookies.forEach(c => {
        if (c.name.includes('auth')) {
          console.log(`   - ${c.name}: ${c.value.substring(0, 30)}...`);
        }
      });

      if (authCookie) {
        console.log('\n✅✅✅ ¡LOGIN EXITOSO! - Cookie de sesión encontrada');
        result.success = true;
        await saveScreenshot(page, '04-EXITO-dashboard');
        return result;
      } else {
        console.log('\n⚠️  Salimos de login pero no hay cookie de sesión');
      }
    } else {
      console.log('   ❌ Seguimos en /login - Login falló');
      
      // Verificar si hay mensaje de error en la página
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('[role="alert"], .error, .text-red-500');
        return errorEl?.textContent || null;
      });
      
      if (errorMessage) {
        console.log(`   🔴 Mensaje de error: ${errorMessage}`);
        result.error = errorMessage;
      }
    }

    result.screenshot = screenshot1;
    return result;

  } catch (error: any) {
    console.error('\n💥 ERROR:', error.message);
    result.error = error.message;
    result.logs?.push(`ERROR: ${error.stack}`);
    return result;
  } finally {
    if (browser) {
      await browser.close();
    }

    // Guardar logs a archivo
    const logsFile = path.join(RESULTS_DIR, 'login-logs.txt');
    fs.writeFileSync(logsFile, result.logs?.join('\n') || '', 'utf8');
    console.log(`\n📄 Logs guardados en: ${logsFile}`);
  }
}

// Ejecutar
guiLoginAttempt()
  .then(result => {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESULTADO FINAL');
    console.log('═'.repeat(80));
    console.log(`✅ Éxito: ${result.success}`);
    console.log(`📍 URL: ${result.url}`);
    console.log(`🍪 Cookies: ${result.cookies?.length || 0}`);
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }
    console.log('═'.repeat(80) + '\n');
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
