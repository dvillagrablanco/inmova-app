import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const SCREENSHOTS_DIR = '/workspace/screenshots-media-estancia';

// Credenciales superadmin
const SUPERADMIN_EMAIL = 'admin@inmova.app';
const SUPERADMIN_PASSWORD = 'Admin123!';

// Páginas a verificar
const PAGES_TO_CHECK = [
  { path: '/media-estancia', name: 'Dashboard Media Estancia' },
  { path: '/media-estancia/calendario', name: 'Calendario' },
  { path: '/media-estancia/analytics', name: 'Analytics' },
  { path: '/media-estancia/configuracion', name: 'Configuración' },
  { path: '/media-estancia/scoring', name: 'Scoring Inquilinos' },
  { path: '/landing/media-estancia', name: 'Landing Media Estancia (público)' },
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN VISUAL - PÁGINAS MEDIA ESTANCIA');
  console.log('='.repeat(70) + '\n');

  // Crear directorio de screenshots
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();

  try {
    // 1. Login como superadmin
    console.log('🔐 Iniciando sesión como superadministrador...');
    console.log(`   Email: ${SUPERADMIN_EMAIL}`);
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // Tomar screenshot del login
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '00-login-page.png'),
      fullPage: true 
    });
    console.log('   📸 Screenshot: login-page.png');

    // Llenar formulario de login
    await page.fill('input[name="email"], input[type="email"]', SUPERADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', SUPERADMIN_PASSWORD);
    
    // Screenshot con credenciales
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '01-login-filled.png'),
      fullPage: true 
    });

    // Click en submit
    await page.click('button[type="submit"]');
    
    // Esperar navegación
    console.log('   ⏳ Esperando autenticación...');
    
    try {
      await page.waitForURL(
        url => !url.toString().includes('/login'),
        { timeout: 15000 }
      );
      console.log('   ✅ Login exitoso');
    } catch (e) {
      // Verificar si hay error
      const errorText = await page.locator('.text-red-500, .text-destructive, [role="alert"]').textContent().catch(() => null);
      if (errorText) {
        console.log(`   ⚠️ Error de login: ${errorText}`);
      }
      
      // Tomar screenshot del error
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, '01-login-error.png'),
        fullPage: true 
      });
      console.log('   📸 Screenshot: login-error.png');
      
      // Continuar de todas formas para verificar páginas públicas
      console.log('   ℹ️ Continuando con verificación de páginas públicas...\n');
    }

    // 2. Verificar cada página
    console.log('\n📄 VERIFICANDO PÁGINAS DE MEDIA ESTANCIA\n');
    
    const results: { page: string; status: string; screenshot: string }[] = [];
    
    for (let i = 0; i < PAGES_TO_CHECK.length; i++) {
      const pageInfo = PAGES_TO_CHECK[i];
      const screenshotName = `${String(i + 2).padStart(2, '0')}-${pageInfo.path.replace(/\//g, '-').slice(1) || 'root'}.png`;
      
      console.log(`   ${i + 1}/${PAGES_TO_CHECK.length} ${pageInfo.name}`);
      console.log(`      URL: ${BASE_URL}${pageInfo.path}`);
      
      try {
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        await sleep(2000); // Esperar renderizado
        
        const status = response?.status() || 0;
        const currentUrl = page.url();
        
        // Verificar si redirigió a login (no autenticado)
        if (currentUrl.includes('/login')) {
          console.log(`      ⚠️ Redirigido a login (requiere autenticación)`);
          results.push({ page: pageInfo.name, status: 'Requiere login', screenshot: screenshotName });
        } else if (status === 200) {
          console.log(`      ✅ Status: ${status} OK`);
          results.push({ page: pageInfo.name, status: '✅ 200 OK', screenshot: screenshotName });
        } else if (status === 404) {
          console.log(`      ❌ Status: 404 NOT FOUND`);
          results.push({ page: pageInfo.name, status: '❌ 404', screenshot: screenshotName });
        } else {
          console.log(`      ⚠️ Status: ${status}`);
          results.push({ page: pageInfo.name, status: `⚠️ ${status}`, screenshot: screenshotName });
        }
        
        // Tomar screenshot
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, screenshotName),
          fullPage: true 
        });
        console.log(`      📸 Screenshot guardado\n`);
        
      } catch (error: any) {
        console.log(`      ❌ Error: ${error.message}\n`);
        results.push({ page: pageInfo.name, status: `❌ Error`, screenshot: screenshotName });
      }
    }

    // 3. Resumen
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(70) + '\n');
    
    console.log('| Página                          | Estado           |');
    console.log('|' + '-'.repeat(33) + '|' + '-'.repeat(18) + '|');
    
    for (const result of results) {
      const pageName = result.page.padEnd(31);
      const status = result.status.padEnd(16);
      console.log(`| ${pageName} | ${status} |`);
    }
    
    console.log('\n📁 Screenshots guardados en: ' + SCREENSHOTS_DIR);
    console.log('\nArchivos:');
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    files.forEach(f => console.log(`   - ${f}`));

  } catch (error: any) {
    console.error('❌ Error general:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Verificación completada\n');
  }
}

main().catch(console.error);
