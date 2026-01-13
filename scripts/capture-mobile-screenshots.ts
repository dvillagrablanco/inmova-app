/**
 * Script simplificado para capturar screenshots de las páginas modificadas
 */

import { chromium, devices } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const SUPERADMIN_EMAIL = 'admin@inmova.app';
const SUPERADMIN_PASSWORD = 'Admin123!';

const PAGES = [
  { path: '/soporte', name: 'soporte' },
  { path: '/configuracion/notificaciones', name: 'config-notificaciones' },
  { path: '/configuracion/ui-mode', name: 'config-ui-mode' },
  { path: '/knowledge-base', name: 'knowledge-base' },
  { path: '/sugerencias', name: 'sugerencias' },
];

async function main() {
  console.log('🚀 Capturando screenshots de las páginas modificadas...\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenshotDir = 'screenshots-mobile-design';

  try {
    // ============ MOBILE VIEW ============
    console.log('📱 Capturando vista MÓVIL (iPhone 12)...\n');
    
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const mobilePage = await mobileContext.newPage();

    // Login
    console.log('🔐 Iniciando sesión...');
    await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 60000 });
    await mobilePage.waitForSelector('#email', { timeout: 15000 });
    await mobilePage.fill('#email', SUPERADMIN_EMAIL);
    await mobilePage.fill('#password', SUPERADMIN_PASSWORD);
    await mobilePage.click('button[type="submit"]');
    
    try {
      await mobilePage.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
      console.log('✅ Login exitoso\n');
    } catch {
      console.log('⚠️ Timeout en redirect, continuando...\n');
    }

    // Capturar páginas
    for (const pageInfo of PAGES) {
      console.log(`📸 ${pageInfo.name}...`);
      try {
        await mobilePage.goto(`${BASE_URL}${pageInfo.path}`, { 
          waitUntil: 'load', 
          timeout: 60000 
        });
        await mobilePage.waitForTimeout(3000); // Esperar renderizado completo
        await mobilePage.screenshot({ 
          path: `${screenshotDir}/${pageInfo.name}-mobile.png`,
          fullPage: true 
        });
        console.log(`   ✅ Guardado: ${pageInfo.name}-mobile.png`);
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message?.slice(0, 50)}`);
      }
    }

    await mobileContext.close();

    // ============ DESKTOP VIEW ============
    console.log('\n🖥️ Capturando vista DESKTOP (1280x720)...\n');
    
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const desktopPage = await desktopContext.newPage();

    // Login desktop
    console.log('🔐 Iniciando sesión...');
    await desktopPage.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 60000 });
    await desktopPage.waitForSelector('#email', { timeout: 15000 });
    await desktopPage.fill('#email', SUPERADMIN_EMAIL);
    await desktopPage.fill('#password', SUPERADMIN_PASSWORD);
    await desktopPage.click('button[type="submit"]');
    
    try {
      await desktopPage.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
      console.log('✅ Login exitoso\n');
    } catch {
      console.log('⚠️ Timeout en redirect, continuando...\n');
    }

    // Capturar páginas desktop
    for (const pageInfo of PAGES) {
      console.log(`📸 ${pageInfo.name}...`);
      try {
        await desktopPage.goto(`${BASE_URL}${pageInfo.path}`, { 
          waitUntil: 'load', 
          timeout: 60000 
        });
        await desktopPage.waitForTimeout(3000);
        await desktopPage.screenshot({ 
          path: `${screenshotDir}/${pageInfo.name}-desktop.png`,
          fullPage: true 
        });
        console.log(`   ✅ Guardado: ${pageInfo.name}-desktop.png`);
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message?.slice(0, 50)}`);
      }
    }

    await desktopContext.close();

    console.log('\n' + '='.repeat(50));
    console.log('✅ CAPTURAS COMPLETADAS');
    console.log('='.repeat(50));
    console.log(`\n📁 Ver screenshots en: ${screenshotDir}/`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
