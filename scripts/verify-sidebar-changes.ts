/**
 * Script para verificar cambios en el sidebar
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Verificando sidebar del superadministrador...\n');
  
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
  
  // Navegar al dashboard para ver el sidebar
  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Tomar screenshot del sidebar
  await page.screenshot({ 
    path: '/workspace/screenshots-verification/sidebar-admin.png',
    fullPage: true 
  });
  
  // Buscar "Plantillas Legales" en la página
  const plantillasLegales = await page.locator('text=Plantillas Legales').count();
  console.log(`📋 Elementos "Plantillas Legales" encontrados: ${plantillasLegales}`);
  
  // Buscar secciones del sidebar
  const sidebarContent = await page.locator('nav, aside, [role="navigation"]').allTextContents();
  const fullText = sidebarContent.join('\n');
  
  // Verificar si "Gestión de Empresa" tiene "Plantillas Legales"
  console.log('\n═'.repeat(60));
  console.log('🔍 VERIFICACIÓN DE SIDEBAR');
  console.log('═'.repeat(60));
  
  // Buscar el texto del sidebar
  const allText = await page.locator('body').textContent() || '';
  
  // Verificar presencia de elementos clave
  const checks = [
    { name: 'Gestión de Empresa', found: allText.includes('Gestión de Empresa') },
    { name: 'Documentos y Legal', found: allText.includes('Documentos') || allText.includes('Legal') },
    { name: 'Plantillas Legales', found: allText.includes('Plantillas Legales') },
    { name: 'OCR Import', found: allText.includes('OCR') },
    { name: 'Impuestos', found: allText.includes('Impuestos') },
    { name: 'Configuración', found: allText.includes('Configuración') },
    { name: 'Usuarios', found: allText.includes('Usuarios') },
  ];
  
  for (const check of checks) {
    const icon = check.found ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.found ? 'Presente' : 'No encontrado'}`);
  }
  
  // Expandir "Gestión de Empresa" si está colapsado y verificar sus items
  console.log('\n📂 Buscando items en bloques del sidebar...');
  
  // Buscar links específicos
  const gestionEmpresaItems = await page.locator('a[href*="/admin/"]').allTextContents();
  const hasPlantillasInGestion = gestionEmpresaItems.some(item => 
    item.toLowerCase().includes('plantillas') && item.toLowerCase().includes('legal')
  );
  
  console.log(`\n🔍 "Plantillas Legales" en links de admin: ${hasPlantillasInGestion ? '⚠️ SÍ (debería haberse eliminado)' : '✅ NO (correcto)'}`);
  
  // Verificar que existe en documentos
  const documentosItems = await page.locator('a[href="/plantillas-legales"]').count();
  console.log(`📄 Link a /plantillas-legales existente: ${documentosItems > 0 ? '✅ SÍ' : '⚠️ NO'}`);
  
  // Screenshot final
  await page.screenshot({ 
    path: '/workspace/screenshots-verification/sidebar-final.png',
    fullPage: true 
  });
  
  await browser.close();
  console.log('\n📁 Screenshots guardados en /workspace/screenshots-verification/');
}

main().catch(console.error);
