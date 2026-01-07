import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const SCREENSHOTS_DIR = '/workspace/screenshots-verification';

async function main() {
  console.log('🔍 Verificando sidebar expandido...\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();

  try {
    // Login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"], input[type="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Cerrar modal de bienvenida si existe
    try {
      await page.click('button:has-text("Saltar")', { timeout: 3000 });
      await page.waitForTimeout(1000);
    } catch { /* No modal */ }
    
    // Expandir sección "Alquiler Residencial"
    console.log('📂 Expandiendo sección Alquiler Residencial...');
    
    try {
      // Buscar y hacer click en el botón de expandir
      const alquilerButton = await page.locator('button:has-text("Alquiler Residencial")').first();
      await alquilerButton.click();
      await page.waitForTimeout(1500);
      console.log('   ✅ Sección expandida');
    } catch (e) {
      console.log('   ⚠️ No se pudo expandir automáticamente');
    }
    
    // Screenshot del sidebar expandido
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '04-sidebar-expanded.png'), 
      fullPage: true 
    });
    console.log('   📸 04-sidebar-expanded.png');
    
    // Buscar "Media Estancia" en el DOM
    const hasMediaEstancia = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      const text = sidebar?.textContent || '';
      return {
        hasMediaEstancia: text.includes('Media Estancia'),
        hasCalendario: text.includes('Calendario Disponibilidad'),
        hasScoring: text.includes('Scoring Inquilinos'),
        hasAnalytics: text.includes('Analytics Media Estancia'),
        sidebarText: text.substring(0, 2000)
      };
    });
    
    console.log('\n📋 Contenido del sidebar:');
    console.log(`   - Media Estancia: ${hasMediaEstancia.hasMediaEstancia ? '✅' : '❌'}`);
    console.log(`   - Calendario Disponibilidad: ${hasMediaEstancia.hasCalendario ? '✅' : '❌'}`);
    console.log(`   - Scoring Inquilinos: ${hasMediaEstancia.hasScoring ? '✅' : '❌'}`);
    console.log(`   - Analytics Media Estancia: ${hasMediaEstancia.hasAnalytics ? '✅' : '❌'}`);
    
    // Navegar a Media Estancia desde el sidebar
    console.log('\n🔗 Navegando a Media Estancia desde sidebar...');
    
    try {
      await page.click('a:has-text("Media Estancia")');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log(`   URL actual: ${currentUrl}`);
      
      if (currentUrl.includes('media-estancia')) {
        console.log('   ✅ Navegación exitosa');
      }
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, '05-media-estancia-from-sidebar.png'), 
        fullPage: true 
      });
      console.log('   📸 05-media-estancia-from-sidebar.png');
      
    } catch (e) {
      console.log('   ⚠️ No se pudo navegar desde sidebar');
    }

    console.log('\n✅ Verificación completada');
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
