/**
 * Script para verificar visualmente el login y dashboard
 */
import { chromium } from '@playwright/test';

const BASE_URL = 'https://inmovaapp.com';
const ADMIN_EMAIL = 'admin@inmova.app';
const ADMIN_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Iniciando verificación visual...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // 1. Ir al login
    console.log('1️⃣ Navegando a login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots-debug/01-login-page.png', fullPage: true });
    console.log('   ✅ Screenshot: 01-login-page.png');
    
    // 2. Llenar credenciales
    console.log('2️⃣ Llenando credenciales...');
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
    await page.screenshot({ path: 'screenshots-debug/02-credentials-filled.png', fullPage: true });
    console.log('   ✅ Screenshot: 02-credentials-filled.png');
    
    // 3. Hacer login
    console.log('3️⃣ Haciendo login...');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue la página después del login
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots-debug/03-after-login.png', fullPage: true });
    console.log('   ✅ Screenshot: 03-after-login.png');
    console.log(`   URL actual: ${page.url()}`);
    
    // 4. Verificar el contenido de la página
    const pageContent = await page.content();
    const pageTitle = await page.title();
    console.log(`   Título de página: ${pageTitle}`);
    
    // 5. Buscar elementos visibles
    const h1Text = await page.locator('h1').first().textContent().catch(() => 'No h1');
    const h2Text = await page.locator('h2').first().textContent().catch(() => 'No h2');
    console.log(`   H1: ${h1Text}`);
    console.log(`   H2: ${h2Text}`);
    
    // 6. Verificar si hay datos o mensajes de error
    const errorMessages = await page.locator('[class*="error"], [class*="alert"], .text-red-500, .text-destructive').allTextContents();
    if (errorMessages.length > 0) {
      console.log('   ⚠️ Mensajes de error encontrados:', errorMessages);
    }
    
    // 7. Verificar si hay cards/estadísticas
    const cards = await page.locator('[class*="card"], [class*="Card"]').count();
    console.log(`   Cards encontradas: ${cards}`);
    
    // 8. Verificar si hay tablas con datos
    const tables = await page.locator('table').count();
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`   Tablas: ${tables}, Filas: ${tableRows}`);
    
    // 9. Esperar más y tomar otro screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots-debug/04-after-wait.png', fullPage: true });
    console.log('   ✅ Screenshot: 04-after-wait.png');
    
    // 10. Si estamos en dashboard, navegar al admin dashboard
    if (!page.url().includes('/admin')) {
      console.log('\n4️⃣ Navegando a /admin/dashboard...');
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots-debug/05-admin-dashboard.png', fullPage: true });
      console.log('   ✅ Screenshot: 05-admin-dashboard.png');
      console.log(`   URL: ${page.url()}`);
      
      // Verificar contenido del admin dashboard
      const adminH1 = await page.locator('h1').first().textContent().catch(() => 'No h1');
      console.log(`   H1 Admin: ${adminH1}`);
      
      const adminCards = await page.locator('[class*="card"], [class*="Card"]').count();
      console.log(`   Cards en admin: ${adminCards}`);
    }
    
    // 11. Verificar consola del navegador
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   ❌ Error en consola: ${msg.text()}`);
      }
    });
    
    // 12. Verificar peticiones fallidas
    const failedRequests: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    
    // Recargar para capturar errores
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    if (failedRequests.length > 0) {
      console.log('\n   ❌ Peticiones fallidas:');
      failedRequests.forEach(req => console.log(`      - ${req}`));
    }
    
    await page.screenshot({ path: 'screenshots-debug/06-final.png', fullPage: true });
    console.log('   ✅ Screenshot: 06-final.png');
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'screenshots-debug/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
