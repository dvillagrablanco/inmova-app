/**
 * Script para verificar el sidebar expandiendo todas las secciones
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Verificando sidebar expandido...\n');
  
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
  
  // Navegar al dashboard
  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Buscar y hacer click en todos los elementos colapsables del sidebar para expandirlos
  console.log('📂 Expandiendo secciones del sidebar...');
  
  // Buscar botones/triggers que puedan expandir secciones
  const collapsibleButtons = await page.locator('button[aria-expanded], [data-state="closed"], nav button').all();
  console.log(`   Encontrados ${collapsibleButtons.length} elementos colapsables`);
  
  for (const button of collapsibleButtons) {
    try {
      await button.click({ timeout: 1000 });
      await page.waitForTimeout(200);
    } catch {}
  }
  
  // Esperar a que el sidebar se actualice
  await page.waitForTimeout(1000);
  
  // Tomar screenshot del sidebar expandido
  await page.screenshot({ 
    path: '/workspace/screenshots-verification/sidebar-expanded.png',
    fullPage: true 
  });
  
  // Obtener todos los links del sidebar
  console.log('\n═'.repeat(60));
  console.log('📋 LINKS EN EL SIDEBAR');
  console.log('═'.repeat(60));
  
  const allLinks = await page.locator('nav a, aside a, [role="navigation"] a').all();
  const linkTexts: string[] = [];
  
  for (const link of allLinks) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    if (text && href) {
      linkTexts.push(`${text.trim()} → ${href}`);
    }
  }
  
  // Filtrar links únicos y mostrar
  const uniqueLinks = [...new Set(linkTexts)].slice(0, 50);
  uniqueLinks.forEach(link => console.log(`  • ${link}`));
  
  // Verificar específicamente
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 VERIFICACIÓN ESPECÍFICA');
  console.log('═'.repeat(60));
  
  const hasPlantillasInAdmin = linkTexts.some(l => 
    l.toLowerCase().includes('plantillas') && l.includes('/admin/')
  );
  const hasPlantillasInDocs = linkTexts.some(l => 
    l.toLowerCase().includes('plantillas') && l.includes('/plantillas-legales')
  );
  
  console.log(`\n✅ "Plantillas Legales" en rutas /admin/: ${hasPlantillasInAdmin ? '⚠️ SÍ (ERROR)' : 'NO (correcto)'}`);
  console.log(`✅ "Plantillas Legales" en /plantillas-legales: ${hasPlantillasInDocs ? 'SÍ (correcto)' : 'No visible'}`);
  
  // Verificar items de Gestión de Empresa
  const adminLinks = linkTexts.filter(l => l.includes('/admin/'));
  console.log(`\n📊 Links de /admin/ encontrados: ${adminLinks.length}`);
  
  // Buscar elementos específicos que deberían o no estar
  const gestionEmpresaExpected = ['Configuración', 'Usuarios', 'Módulos', 'OCR Import', 'Impuestos'];
  const gestionEmpresaRemoved = ['Plantillas Legales'];
  
  console.log('\n✅ Items que DEBEN estar en Gestión de Empresa:');
  for (const item of gestionEmpresaExpected) {
    const found = adminLinks.some(l => l.toLowerCase().includes(item.toLowerCase()));
    console.log(`   ${found ? '✅' : '⚠️'} ${item}: ${found ? 'Presente' : 'No visible'}`);
  }
  
  console.log('\n❌ Items que NO deben estar en Gestión de Empresa (/admin/):');
  for (const item of gestionEmpresaRemoved) {
    const found = adminLinks.some(l => l.toLowerCase().includes(item.toLowerCase()));
    console.log(`   ${found ? '❌ ERROR' : '✅ OK'} ${item}: ${found ? 'Presente (DEBERÍA HABERSE ELIMINADO)' : 'No presente (correcto)'}`);
  }
  
  await browser.close();
  console.log('\n📁 Screenshot guardado');
}

main().catch(console.error);
