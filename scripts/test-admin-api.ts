/**
 * Script para probar APIs del admin con autenticación
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Probando APIs del admin...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Capturar TODAS las peticiones de API
  const apiCalls: any[] = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      let body = '';
      try {
        body = await response.text();
        if (body.length > 500) body = body.substring(0, 500) + '...';
      } catch {}
      apiCalls.push({
        url: url.replace(BASE_URL, ''),
        status,
        body
      });
    }
  });
  
  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('✅ Login exitoso\n');
  
  // Navegar a la página de clientes y esperar
  console.log('📄 Navegando a /admin/clientes...\n');
  apiCalls.length = 0;
  await page.goto(`${BASE_URL}/admin/clientes`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  // Mostrar todas las llamadas API
  console.log('═'.repeat(70));
  console.log('📡 LLAMADAS API REALIZADAS:');
  console.log('═'.repeat(70));
  
  for (const call of apiCalls) {
    const statusIcon = call.status >= 400 ? '❌' : '✅';
    console.log(`\n${statusIcon} ${call.status} ${call.url}`);
    if (call.status >= 400) {
      console.log(`   Body: ${call.body}`);
    }
  }
  
  // Verificar específicamente /api/admin/companies
  console.log('\n' + '═'.repeat(70));
  console.log('🔍 VERIFICANDO API CRÍTICAS:');
  console.log('═'.repeat(70));
  
  const companiesCall = apiCalls.find(c => c.url.includes('/api/admin/companies') && !c.url.includes('/'));
  if (companiesCall) {
    console.log(`\n/api/admin/companies: ${companiesCall.status}`);
    if (companiesCall.status >= 400) {
      console.log(`   Error: ${companiesCall.body}`);
    }
  } else {
    console.log('\n⚠️ No se encontró llamada a /api/admin/companies');
  }
  
  // Probar endpoint directamente
  console.log('\n📡 Probando /api/admin/companies directamente...');
  const response = await page.goto(`${BASE_URL}/api/admin/companies`);
  console.log(`   Status: ${response?.status()}`);
  const body = await page.textContent('body');
  console.log(`   Body: ${body?.substring(0, 300)}`);
  
  await browser.close();
}

main().catch(console.error);
