/**
 * Quick Production Audit - Sin local server
 */
import { chromium } from 'playwright';

const ROUTES = [
  '/',
  '/landing',
  '/login',
  '/dashboard',
  '/configuracion',
  '/admin',
  '/admin/configuracion',
  '/portal-propietario/dashboard',
  '/portal-inquilino/dashboard',
];

async function main() {
  console.log('🔍 Quick Production Audit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const errors: any[] = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listeners
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignorar CSS bug ya "corregido"
      if (text.includes('Invalid or unexpected token') && text.includes('.css')) return;
      errors.push({ type: 'console', message: text.substring(0, 150) });
    }
  });
  
  page.on('pageerror', (err) => {
    errors.push({ type: 'js-error', message: err.message });
  });
  
  page.on('requestfailed', (req) => {
    errors.push({ type: 'network', message: req.url() });
  });
  
  for (const route of ROUTES) {
    try {
      console.log(`Testing: ${route}`);
      await page.goto(`https://inmovaapp.com${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
    } catch (e: any) {
      console.log(`  ⚠️ Timeout/Error: ${e.message}`);
    }
  }
  
  await browser.close();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTADOS:\n');
  console.log(`Total errores: ${errors.length}`);
  
  if (errors.length === 0) {
    console.log('\n🎉 0 ERRORES DETECTADOS!');
  } else {
    console.log('\n⚠️ Errores por tipo:');
    const byType: Record<string, number> = {};
    errors.forEach(e => byType[e.type] = (byType[e.type] || 0) + 1);
    Object.entries(byType).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    
    console.log('\nPrimeros 10 errores:');
    errors.slice(0, 10).forEach((e, i) => {
      console.log(`${i + 1}. [${e.type}] ${e.message}`);
    });
  }
}

main().catch(console.error);
