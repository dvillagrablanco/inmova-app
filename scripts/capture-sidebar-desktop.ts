/**
 * Script para capturar el sidebar desktop del superadministrador
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const SUPERADMIN_EMAIL = 'admin@inmova.app';
const SUPERADMIN_PASSWORD = 'Admin123!';

async function acceptCookies(page: any) {
  try {
    const acceptButton = page.locator('button:has-text("Aceptar todas")');
    if (await acceptButton.isVisible({ timeout: 2000 })) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
  } catch {}
}

async function destroyCrisp(page: any) {
  try {
    await page.evaluate(() => {
      const crisp = document.querySelector('.crisp-client');
      if (crisp) {
        crisp.remove();
      }
      (window as any).$crisp = undefined;
      (window as any).CRISP_WEBSITE_ID = undefined;
    });
  } catch {}
}

async function main() {
  console.log('🚀 Capturando sidebar desktop del superadministrador...\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenshotDir = 'screenshots-mobile-design';

  try {
    // Desktop context (1920x1080)
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await desktopContext.newPage();

    // Login
    console.log('🔐 Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 60000 });
    await acceptCookies(page);
    await destroyCrisp(page);
    await page.waitForSelector('#email', { timeout: 15000 });
    await page.fill('#email', SUPERADMIN_EMAIL);
    await page.fill('#password', SUPERADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
    } catch {}
    
    await acceptCookies(page);
    await destroyCrisp(page);
    console.log('✅ Login OK\n');

    // Ir al dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);
    await destroyCrisp(page);

    console.log('📸 Capturando sidebar desktop...');
    
    // Captura inicial del sidebar
    await page.screenshot({ 
      path: `${screenshotDir}/sidebar-desktop-superadmin.png`,
      fullPage: false
    });
    console.log('   ✅ sidebar-desktop-superadmin.png');

    // Hacer scroll en el sidebar para ver más contenido
    await page.evaluate(() => {
      const sidebar = document.querySelector('aside nav, aside .overflow-y-auto');
      if (sidebar) {
        sidebar.scrollTop = 400;
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: `${screenshotDir}/sidebar-desktop-superadmin-2.png`,
      fullPage: false
    });
    console.log('   ✅ sidebar-desktop-superadmin-2.png');

    await page.evaluate(() => {
      const sidebar = document.querySelector('aside nav, aside .overflow-y-auto');
      if (sidebar) {
        sidebar.scrollTop = 800;
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: `${screenshotDir}/sidebar-desktop-superadmin-3.png`,
      fullPage: false
    });
    console.log('   ✅ sidebar-desktop-superadmin-3.png');

    await page.evaluate(() => {
      const sidebar = document.querySelector('aside nav, aside .overflow-y-auto');
      if (sidebar) {
        sidebar.scrollTop = 1200;
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: `${screenshotDir}/sidebar-desktop-superadmin-4.png`,
      fullPage: false
    });
    console.log('   ✅ sidebar-desktop-superadmin-4.png');

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
