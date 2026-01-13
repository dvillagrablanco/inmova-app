/**
 * Script para capturar screenshots aceptando cookies primero
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

async function acceptCookies(page: any) {
  try {
    // Intentar aceptar cookies si el banner existe
    const acceptButton = page.locator('button:has-text("Aceptar todas")');
    if (await acceptButton.isVisible({ timeout: 2000 })) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // No hay banner de cookies, continuar
  }
}

async function closeCookieBanner(page: any) {
  try {
    // Intentar cerrar el banner con la X
    const closeButton = page.locator('button:has-text("×"), button[aria-label="Cerrar"]');
    if (await closeButton.first().isVisible({ timeout: 1000 })) {
      await closeButton.first().click();
      await page.waitForTimeout(500);
    }
  } catch {
    // No hay botón cerrar
  }
}

async function main() {
  console.log('🚀 Capturando screenshots (sin banner de cookies)...\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenshotDir = 'screenshots-mobile-design';

  try {
    // ============ MOBILE VIEW ============
    console.log('📱 Vista MÓVIL (iPhone 12)...\n');
    
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const mobilePage = await mobileContext.newPage();

    // Login
    console.log('🔐 Login...');
    await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 60000 });
    
    // Aceptar/cerrar cookies en login
    await acceptCookies(mobilePage);
    await closeCookieBanner(mobilePage);
    
    await mobilePage.waitForSelector('#email', { timeout: 15000 });
    await mobilePage.fill('#email', SUPERADMIN_EMAIL);
    await mobilePage.fill('#password', SUPERADMIN_PASSWORD);
    await mobilePage.click('button[type="submit"]');
    
    try {
      await mobilePage.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
    } catch {}
    
    // Aceptar cookies después de login
    await acceptCookies(mobilePage);
    console.log('✅ Login OK\n');

    // Capturar páginas
    for (const pageInfo of PAGES) {
      console.log(`📸 ${pageInfo.name} (móvil)...`);
      try {
        await mobilePage.goto(`${BASE_URL}${pageInfo.path}`, { 
          waitUntil: 'load', 
          timeout: 60000 
        });
        await mobilePage.waitForTimeout(1000);
        
        // Aceptar/cerrar cookies
        await acceptCookies(mobilePage);
        await closeCookieBanner(mobilePage);
        
        await mobilePage.waitForTimeout(1500);
        await mobilePage.screenshot({ 
          path: `${screenshotDir}/${pageInfo.name}-mobile-clean.png`,
          fullPage: true 
        });
        console.log(`   ✅ ${pageInfo.name}-mobile-clean.png`);
      } catch (error: any) {
        console.log(`   ❌ ${error.message?.slice(0, 50)}`);
      }
    }

    await mobileContext.close();

    // ============ DESKTOP VIEW ============
    console.log('\n🖥️ Vista DESKTOP...\n');
    
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const desktopPage = await desktopContext.newPage();

    // Login
    console.log('🔐 Login...');
    await desktopPage.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 60000 });
    await acceptCookies(desktopPage);
    await desktopPage.waitForSelector('#email', { timeout: 15000 });
    await desktopPage.fill('#email', SUPERADMIN_EMAIL);
    await desktopPage.fill('#password', SUPERADMIN_PASSWORD);
    await desktopPage.click('button[type="submit"]');
    
    try {
      await desktopPage.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
    } catch {}
    
    await acceptCookies(desktopPage);
    console.log('✅ Login OK\n');

    // Capturar páginas
    for (const pageInfo of PAGES) {
      console.log(`📸 ${pageInfo.name} (desktop)...`);
      try {
        await desktopPage.goto(`${BASE_URL}${pageInfo.path}`, { 
          waitUntil: 'load', 
          timeout: 60000 
        });
        await desktopPage.waitForTimeout(1000);
        await acceptCookies(desktopPage);
        await desktopPage.waitForTimeout(1500);
        await desktopPage.screenshot({ 
          path: `${screenshotDir}/${pageInfo.name}-desktop-clean.png`,
          fullPage: true 
        });
        console.log(`   ✅ ${pageInfo.name}-desktop-clean.png`);
      } catch (error: any) {
        console.log(`   ❌ ${error.message?.slice(0, 50)}`);
      }
    }

    await desktopContext.close();

    console.log('\n✅ CAPTURAS COMPLETADAS');
    console.log(`📁 Ver en: ${screenshotDir}/`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
