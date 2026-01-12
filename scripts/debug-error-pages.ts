/**
 * Script para depurar páginas con errores visibles
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Depurando páginas con errores...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Capturar requests/responses de API
  const apiResponses: any[] = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') && response.status() >= 400) {
      try {
        const body = await response.text();
        apiResponses.push({
          url: url.replace(BASE_URL, ''),
          status: response.status(),
          body: body.substring(0, 200)
        });
      } catch {}
    }
  });
  
  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('✅ Login exitoso\n');
  
  // Verificar página de Clientes
  console.log('═'.repeat(60));
  console.log('📄 /admin/clientes');
  console.log('═'.repeat(60));
  
  apiResponses.length = 0;
  await page.goto(`${BASE_URL}/admin/clientes`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Buscar textos de error específicos - usando locators separados
  const errorClass = await page.locator('[class*="error"]').allTextContents();
  const alertTexts = await page.locator('[role="alert"]').allTextContents();
  const errorText = await page.locator(':text("error")').allTextContents();
  
  console.log('Errores encontrados en UI:');
  errorClass.filter(t => t.length > 0 && t.length < 200).forEach(t => console.log(`  - [class] ${t.substring(0, 100)}`));
  alertTexts.filter(t => t.length > 0 && t.length < 200).forEach(t => console.log(`  - [alert] ${t.substring(0, 100)}`));
  errorText.filter(t => t.length > 0 && t.length < 200).forEach(t => console.log(`  - [text] ${t.substring(0, 100)}`));
  
  console.log('\nRespuestas API con error:');
  apiResponses.forEach(r => console.log(`  - ${r.status} ${r.url}: ${r.body.substring(0, 100)}`));
  
  // Screenshot
  await page.screenshot({ path: '/workspace/screenshots-verification/debug-clientes.png', fullPage: true });
  
  // Verificar página de Onboarding
  console.log('\n' + '═'.repeat(60));
  console.log('📄 /admin/onboarding');
  console.log('═'.repeat(60));
  
  apiResponses.length = 0;
  await page.goto(`${BASE_URL}/admin/onboarding`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const errorClass2 = await page.locator('[class*="error"]').allTextContents();
  const alertTexts2 = await page.locator('[role="alert"]').allTextContents();
  const errorText2 = await page.locator(':text("error")').allTextContents();
  
  console.log('Errores encontrados en UI:');
  errorClass2.filter(t => t.length > 0 && t.length < 200).forEach(t => console.log(`  - [class] ${t.substring(0, 100)}`));
  alertTexts2.filter(t => t.length > 0 && t.length < 200).forEach(t => console.log(`  - [alert] ${t.substring(0, 100)}`));
  errorText2.filter(t => t.length > 0 && t.length < 200).forEach(t => console.log(`  - [text] ${t.substring(0, 100)}`));
  
  console.log('\nRespuestas API con error:');
  apiResponses.forEach(r => console.log(`  - ${r.status} ${r.url}: ${r.body.substring(0, 100)}`));
  
  // Screenshot
  await page.screenshot({ path: '/workspace/screenshots-verification/debug-onboarding.png', fullPage: true });
  
  await browser.close();
  console.log('\n📁 Screenshots guardados');
}

main().catch(console.error);
