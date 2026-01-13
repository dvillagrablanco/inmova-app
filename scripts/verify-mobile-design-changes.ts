/**
 * Script para verificar visualmente los cambios de diseño móvil en producción
 * Ejecuta: npx playwright test scripts/verify-mobile-design-changes.ts --headed
 */

import { chromium, devices } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const SUPERADMIN_EMAIL = 'admin@inmova.app';
const SUPERADMIN_PASSWORD = 'Admin123!';

// Páginas a verificar con los nuevos cambios de diseño
const PAGES_TO_CHECK = [
  { path: '/soporte', name: 'soporte' },
  { path: '/configuracion/notificaciones', name: 'config-notificaciones' },
  { path: '/configuracion/ui-mode', name: 'config-ui-mode' },
  { path: '/knowledge-base', name: 'knowledge-base' },
  { path: '/sugerencias', name: 'sugerencias' },
];

async function main() {
  console.log('🚀 Iniciando verificación visual de cambios de diseño móvil...\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Crear carpeta para screenshots
  const screenshotDir = 'screenshots-mobile-design';
  
  try {
    // ============ DESKTOP VIEW ============
    console.log('📱 Verificando vista DESKTOP (1280x720)...\n');
    
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
    const desktopPage = await desktopContext.newPage();

    // Login desktop
    console.log('🔐 Iniciando sesión como superadministrador (desktop)...');
    await desktopPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForSelector('#email', { timeout: 10000 });
    await desktopPage.fill('#email', SUPERADMIN_EMAIL);
    await desktopPage.fill('#password', SUPERADMIN_PASSWORD);
    await desktopPage.click('button[type="submit"]');
    
    // Esperar redirección al dashboard
    await desktopPage.waitForURL(/\/(dashboard|admin)/, { timeout: 20000 });
    console.log('✅ Login exitoso (desktop)\n');

    // Capturar páginas en desktop
    for (const pageInfo of PAGES_TO_CHECK) {
      console.log(`📸 Capturando ${pageInfo.name} (desktop)...`);
      try {
        await desktopPage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 20000 });
        await desktopPage.waitForTimeout(1500); // Esperar renderizado
        await desktopPage.screenshot({ 
          path: `${screenshotDir}/${pageInfo.name}-desktop.png`,
          fullPage: true 
        });
        console.log(`   ✅ ${pageInfo.name}-desktop.png guardado`);
      } catch (error: any) {
        console.log(`   ❌ Error en ${pageInfo.name}: ${error.message}`);
      }
    }

    await desktopContext.close();

    // ============ MOBILE VIEW ============
    console.log('\n📱 Verificando vista MÓVIL (iPhone 12)...\n');
    
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const mobilePage = await mobileContext.newPage();

    // Login móvil
    console.log('🔐 Iniciando sesión como superadministrador (móvil)...');
    await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForSelector('#email', { timeout: 10000 });
    await mobilePage.fill('#email', SUPERADMIN_EMAIL);
    await mobilePage.fill('#password', SUPERADMIN_PASSWORD);
    await mobilePage.click('button[type="submit"]');
    
    // Esperar redirección al dashboard
    await mobilePage.waitForURL(/\/(dashboard|admin)/, { timeout: 20000 });
    console.log('✅ Login exitoso (móvil)\n');

    // Capturar páginas en móvil
    for (const pageInfo of PAGES_TO_CHECK) {
      console.log(`📸 Capturando ${pageInfo.name} (móvil)...`);
      try {
        await mobilePage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 20000 });
        await mobilePage.waitForTimeout(1500); // Esperar renderizado
        await mobilePage.screenshot({ 
          path: `${screenshotDir}/${pageInfo.name}-mobile.png`,
          fullPage: true 
        });
        console.log(`   ✅ ${pageInfo.name}-mobile.png guardado`);
      } catch (error: any) {
        console.log(`   ❌ Error en ${pageInfo.name}: ${error.message}`);
      }
    }

    await mobileContext.close();

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log(`\n📁 Screenshots guardados en: ${screenshotDir}/`);
    console.log('\nArchivos generados:');
    for (const pageInfo of PAGES_TO_CHECK) {
      console.log(`   - ${pageInfo.name}-desktop.png`);
      console.log(`   - ${pageInfo.name}-mobile.png`);
    }

  } catch (error: any) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    await browser.close();
  }
}

main();
