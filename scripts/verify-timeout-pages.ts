/**
 * Script para verificar páginas que tuvieron timeout
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Verificando páginas con timeout...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('✅ Login exitoso\n');
  
  const pagesToCheck = [
    { url: '/admin/clientes', name: 'Clientes' },
    { url: '/admin/partners/invitaciones', name: 'Partners Invitaciones' },
    { url: '/dashboard', name: 'Dashboard Principal' },
    { url: '/admin/onboarding', name: 'Onboarding' },
  ];
  
  for (const pageInfo of pagesToCheck) {
    console.log(`📄 Verificando ${pageInfo.name}...`);
    try {
      // Usar domcontentloaded en lugar de networkidle
      const response = await page.goto(`${BASE_URL}${pageInfo.url}`, { 
        waitUntil: 'domcontentloaded', 
        timeout: 20000 
      });
      
      const status = response?.status() || 0;
      console.log(`   HTTP Status: ${status}`);
      
      // Esperar un poco para que cargue el contenido
      await page.waitForTimeout(3000);
      
      // Verificar contenido
      const title = await page.title();
      const h1 = await page.locator('h1').first().textContent().catch(() => 'No H1');
      const cards = await page.locator('[class*="card"], [class*="Card"]').count();
      const tables = await page.locator('table').count();
      const buttons = await page.locator('button').count();
      const errorVisible = await page.locator('text=/error|Error|no autorizado/i').count();
      
      // Tomar screenshot
      await page.screenshot({ 
        path: `/workspace/screenshots-verification/timeout-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
      
      console.log(`   Title: ${title}`);
      console.log(`   H1: ${h1}`);
      console.log(`   Cards: ${cards}, Tables: ${tables}, Buttons: ${buttons}`);
      console.log(`   Error visible: ${errorVisible > 0 ? '⚠️ Sí' : '✅ No'}`);
      console.log('');
      
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message.split('\n')[0]}\n`);
    }
  }
  
  await browser.close();
  console.log('📁 Screenshots guardados en /workspace/screenshots-verification/');
}

main().catch(console.error);
