import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const SCREENSHOTS_DIR = '/workspace/screenshots-media-estancia';

const SUPERADMIN_EMAIL = 'admin@inmova.app';
const SUPERADMIN_PASSWORD = 'Admin123!';

const PAGES = [
  { path: '/media-estancia', name: '01-Dashboard Principal' },
  { path: '/media-estancia/calendario', name: '02-Calendario' },
  { path: '/media-estancia/analytics', name: '03-Analytics' },
  { path: '/media-estancia/configuracion', name: '04-Configuracion' },
  { path: '/media-estancia/scoring', name: '05-Scoring' },
  { path: '/landing/media-estancia', name: '06-Landing Publica' },
];

async function main() {
  console.log('\n🔍 VERIFICACIÓN VISUAL COMPLETA - MEDIA ESTANCIA\n');

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
    console.log('🔐 Login como superadmin...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"], input[type="email"]', SUPERADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', SUPERADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
      console.log('✅ Login exitoso\n');
    } catch {
      console.log('⚠️ Login puede haber fallado, continuando...\n');
    }

    // Verificar páginas
    console.log('📄 VERIFICANDO PÁGINAS:\n');
    
    for (const pageInfo of PAGES) {
      const fileName = `${pageInfo.name.replace(/\s+/g, '-')}.png`;
      console.log(`   📍 ${pageInfo.path}`);
      
      try {
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        
        await page.waitForTimeout(3000); // Esperar renderizado
        
        const status = response?.status() || 0;
        const title = await page.title();
        
        // Verificar contenido principal
        const hasContent = await page.evaluate(() => {
          const main = document.querySelector('main') || document.body;
          return main.textContent?.length || 0;
        });
        
        if (status === 200 && hasContent > 100) {
          console.log(`      ✅ Status: ${status} | Título: ${title.substring(0, 40)}...`);
          console.log(`      📄 Contenido: ${hasContent} caracteres`);
        } else if (status === 200) {
          console.log(`      ⚠️ Status: ${status} pero poco contenido`);
        } else {
          console.log(`      ❌ Status: ${status}`);
        }
        
        // Screenshot
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, fileName),
          fullPage: true 
        });
        console.log(`      📸 ${fileName}\n`);
        
      } catch (error: any) {
        console.log(`      ❌ Error: ${error.message.substring(0, 50)}...\n`);
      }
    }

    console.log('='.repeat(60));
    console.log('📁 SCREENSHOTS GUARDADOS');
    console.log('='.repeat(60) + '\n');
    
    const files = fs.readdirSync(SCREENSHOTS_DIR).sort();
    files.forEach(f => {
      const stats = fs.statSync(path.join(SCREENSHOTS_DIR, f));
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   ${f} (${sizeKB} KB)`);
    });

  } finally {
    await browser.close();
    console.log('\n✅ Verificación completada\n');
  }
}

main().catch(console.error);
