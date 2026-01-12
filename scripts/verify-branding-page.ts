/**
 * Script para verificar la nueva página de branding
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Verificando nueva página de branding...\n');
  
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
  
  // Navegar a branding
  await page.goto(`${BASE_URL}/admin/personalizacion`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  console.log('═'.repeat(60));
  console.log('📋 VERIFICACIÓN DE PÁGINA DE BRANDING');
  console.log('═'.repeat(60));
  
  // Verificar elementos clave
  const elements = {
    'Título "Personalización de Marca"': await page.locator('text=Personalización de Marca').count() > 0,
    'Indicador de progreso': await page.locator('text=Progreso de configuración').count() > 0,
    'Botón "Vista Previa"': await page.locator('text=Vista Previa').count() > 0,
    'Botón "Guardar Cambios"': await page.locator('text=Guardar Cambios').count() > 0,
    'Tabs (Identidad, Colores, etc.)': await page.locator('[role="tab"]').count() >= 4,
    'Presets de colores': await page.locator('text=Presets de Colores').count() > 0,
    'Vista previa en vivo': await page.locator('text=Vista Previa en Vivo').count() > 0,
    'Paleta actual': await page.locator('text=Paleta Actual').count() > 0,
  };
  
  for (const [name, found] of Object.entries(elements)) {
    console.log(`${found ? '✅' : '❌'} ${name}`);
  }
  
  // Tomar screenshot de la página completa
  await page.screenshot({ 
    path: '/workspace/screenshots-verification/branding-page-new.png',
    fullPage: true 
  });
  console.log('\n📸 Screenshot guardado: branding-page-new.png');
  
  // Verificar tabs
  console.log('\n📑 Verificando tabs...');
  const tabs = ['Identidad', 'Colores', 'Interfaz', 'SEO'];
  for (const tab of tabs) {
    const tabButton = page.locator(`[role="tab"]:has-text("${tab}")`);
    if (await tabButton.count() > 0) {
      await tabButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `/workspace/screenshots-verification/branding-tab-${tab.toLowerCase()}.png`,
        fullPage: true 
      });
      console.log(`  ✅ Tab "${tab}" funciona`);
    } else {
      console.log(`  ⚠️ Tab "${tab}" no encontrado`);
    }
  }
  
  // Verificar presets de colores
  console.log('\n🎨 Verificando presets de colores...');
  await page.locator('[role="tab"]:has-text("Colores")').click();
  await page.waitForTimeout(500);
  
  const presets = ['Profesional', 'Moderno', 'Natural', 'Cálido', 'Minimalista', 'Premium'];
  let presetsFound = 0;
  for (const preset of presets) {
    if (await page.locator(`text=${preset}`).count() > 0) {
      presetsFound++;
    }
  }
  console.log(`  ✅ ${presetsFound}/${presets.length} presets encontrados`);
  
  await browser.close();
  console.log('\n✅ Verificación completada');
}

main().catch(console.error);
