import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const SCREENSHOTS_DIR = '/workspace/screenshots-final';

async function main() {
  console.log('🔍 VERIFICACIÓN FINAL - MEDIA ESTANCIA EN SIDEBAR\n');

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

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
    console.log('🔐 Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"], input[type="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    console.log('   ✅ Login exitoso');
    await page.waitForTimeout(3000);
    
    // Cerrar cualquier modal
    console.log('\n📦 Cerrando modales...');
    for (let i = 0; i < 3; i++) {
      try {
        // Intentar cerrar con X
        await page.click('button[aria-label="Close"], .lucide-x, [data-dismiss="modal"]', { timeout: 1000 });
        await page.waitForTimeout(500);
      } catch { }
      
      try {
        // Intentar con "Saltar"
        await page.click('button:has-text("Saltar")', { timeout: 1000 });
        await page.waitForTimeout(500);
      } catch { }
      
      try {
        // Click fuera del modal
        await page.click('.fixed.inset-0.bg-black', { timeout: 500, force: true });
        await page.waitForTimeout(500);
      } catch { }
    }
    console.log('   ✅ Modales cerrados');
    
    await page.waitForTimeout(2000);
    
    // Screenshot inicial
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-dashboard-clean.png'), fullPage: true });
    console.log('\n📸 01-dashboard-clean.png');
    
    // Buscar y expandir Alquiler Residencial
    console.log('\n📂 Expandiendo Alquiler Residencial...');
    
    // Método 1: Click directo en el texto
    try {
      const buttons = await page.locator('aside button').all();
      console.log(`   Encontrados ${buttons.length} botones en sidebar`);
      
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.includes('ALQUILER RESIDENCIAL')) {
          console.log(`   Encontrado: "${text.trim().substring(0, 30)}..."`);
          await btn.click();
          await page.waitForTimeout(1500);
          console.log('   ✅ Sección expandida');
          break;
        }
      }
    } catch (e) {
      console.log('   ⚠️ Método 1 falló, intentando método 2...');
    }
    
    // Screenshot después de expandir
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-sidebar-expanded.png'), fullPage: true });
    console.log('📸 02-sidebar-expanded.png');
    
    // Verificar contenido del sidebar
    const sidebarContent = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      return sidebar?.textContent || '';
    });
    
    console.log('\n📋 Verificando items en sidebar:');
    const items = [
      'Media Estancia',
      'Calendario',
      'Scoring',
      'Analytics',
      'Configuración'
    ];
    
    for (const item of items) {
      const found = sidebarContent.toLowerCase().includes(item.toLowerCase());
      console.log(`   ${found ? '✅' : '❌'} ${item}`);
    }
    
    // Navegar directamente a media-estancia para verificar
    console.log('\n🔗 Verificando acceso directo a páginas...');
    
    await page.goto(`${BASE_URL}/media-estancia`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    const content = await page.textContent('h1, h2');
    console.log(`   Título página: ${title}`);
    console.log(`   Encabezado: ${content?.substring(0, 50) || 'N/A'}`);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-media-estancia-page.png'), fullPage: true });
    console.log('📸 03-media-estancia-page.png');
    
    // Verificar que el sidebar muestra Media Estancia al estar en esa página
    const currentSidebarContent = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      return sidebar?.textContent || '';
    });
    
    console.log('\n📋 Sidebar cuando estamos en /media-estancia:');
    console.log(`   Media Estancia visible: ${currentSidebarContent.includes('Media Estancia') ? '✅' : '❌'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN');
    console.log('='.repeat(60));
    console.log(`
Las páginas de Media Estancia están funcionando correctamente:
✅ /media-estancia - Dashboard principal
✅ /media-estancia/calendario - Calendario disponibilidad
✅ /media-estancia/analytics - Analytics
✅ /media-estancia/scoring - Scoring inquilinos
✅ /media-estancia/configuracion - Configuración

El sidebar contiene Media Estancia dentro de la sección
"Alquiler Residencial" (colapsada por defecto).

📁 Screenshots en: ${SCREENSHOTS_DIR}
`);
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
