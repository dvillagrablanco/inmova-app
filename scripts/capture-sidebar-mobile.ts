/**
 * Script para capturar el sidebar móvil del superadministrador
 */

import { chromium, devices } from 'playwright';

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
  console.log('🚀 Capturando sidebar móvil del superadministrador...\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenshotDir = 'screenshots-mobile-design';

  try {
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const mobilePage = await mobileContext.newPage();

    // Login
    console.log('🔐 Login...');
    await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 60000 });
    await acceptCookies(mobilePage);
    await destroyCrisp(mobilePage);
    await mobilePage.waitForSelector('#email', { timeout: 15000 });
    await mobilePage.fill('#email', SUPERADMIN_EMAIL);
    await mobilePage.fill('#password', SUPERADMIN_PASSWORD);
    await mobilePage.click('button[type="submit"]');
    
    try {
      await mobilePage.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
    } catch {}
    
    await acceptCookies(mobilePage);
    await destroyCrisp(mobilePage);
    console.log('✅ Login OK\n');

    // Ir al dashboard
    await mobilePage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load', timeout: 60000 });
    await mobilePage.waitForTimeout(2000);
    await destroyCrisp(mobilePage);

    // Abrir menú móvil - usando el botón hamburguesa de la esquina superior izquierda
    console.log('📸 Abriendo menú móvil...');
    
    // El botón hamburguesa está en la parte superior izquierda (tiene el icono Menu)
    // Buscar por posición o por estructura
    const hamburgerButton = mobilePage.locator('button:has(svg)').first();
    
    await hamburgerButton.click();
    await mobilePage.waitForTimeout(2000);
    await destroyCrisp(mobilePage);
    
    // Capturar
    await mobilePage.screenshot({ 
      path: `${screenshotDir}/sidebar-mobile-superadmin.png`,
      fullPage: false
    });
    console.log('   ✅ sidebar-mobile-superadmin.png');

    // Scroll dentro del sidebar abierto
    const scrollPositions = [400, 800, 1200, 1600, 2000, 2400];
    
    for (let i = 0; i < scrollPositions.length; i++) {
      await mobilePage.evaluate((scrollTop: number) => {
        // Buscar todos los contenedores scrollables y hacer scroll
        const scrollContainers = document.querySelectorAll('.overflow-y-auto, [data-radix-scroll-area-viewport], nav');
        scrollContainers.forEach(container => {
          if ((container as HTMLElement).scrollHeight > container.clientHeight) {
            container.scrollTop = scrollTop;
          }
        });
      }, scrollPositions[i]);
      await mobilePage.waitForTimeout(500);
      await mobilePage.screenshot({ 
        path: `${screenshotDir}/sidebar-mobile-superadmin-${i + 2}.png`,
        fullPage: false
      });
      console.log(`   ✅ sidebar-mobile-superadmin-${i + 2}.png`);
    }

    await mobileContext.close();

    console.log('\n✅ CAPTURAS COMPLETADAS');
    console.log(`📁 Ver en: ${screenshotDir}/`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
