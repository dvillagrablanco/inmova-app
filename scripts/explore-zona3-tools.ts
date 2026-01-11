import { chromium, Page } from 'playwright';
import * as fs from 'fs';

const LOGIN_URL = 'https://campus.zona3.club/login';
const EMAIL = 'dvillagra@vidaroinversiones.com';
const PASSWORD = 'Pucela00';

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page: Page): Promise<boolean> {
  console.log('📍 Login...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await delay(2000);
  
  try {
    await page.locator('input[name="member[email]"]').first().fill(EMAIL);
    await delay(500);
    await page.locator('input[name="member[password]"]').first().fill(PASSWORD);
    await delay(500);
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    
    await page.waitForURL(/.*library.*/, { timeout: 20000 });
    await delay(3000);
    console.log('✅ Login OK');
    return true;
  } catch (error) {
    console.error('❌ Error login:', error);
    return false;
  }
}

async function clickOnResourceSection(page: Page, sectionName: string): Promise<boolean> {
  console.log(`\n🔍 Buscando sección: ${sectionName}`);
  
  try {
    // Primero ir a la página de recursos
    await page.goto('https://campus.zona3.club/library', { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);
    
    // Click en "Ver contenido" de Recursos (índice 3)
    const buttons = await page.locator('text=Ver contenido').all();
    if (buttons[3]) {
      await buttons[3].click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });
      await delay(2000);
    }
    
    // Ahora buscar la subsección específica
    const sectionButton = page.locator(`text=${sectionName}`).first();
    if (await sectionButton.count() > 0) {
      await sectionButton.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });
      await delay(2000);
      console.log(`   ✅ Entró en ${sectionName}`);
      return true;
    } else {
      console.log(`   ⚠️ No encontró ${sectionName}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message?.substring(0, 80)}`);
  }
  
  return false;
}

async function extractContent(page: Page): Promise<any> {
  const content: any = {
    url: page.url(),
    title: '',
    items: [],
    fullText: ''
  };
  
  // Título de la página
  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  content.title = h1?.trim() || '';
  
  // Texto completo
  content.fullText = await page.locator('body').innerText().catch(() => '');
  
  // Buscar items (lessons, posts, etc.)
  const lessonLinks = await page.locator('a[href*="/posts/"], a[href*="/lessons/"]').all();
  
  for (const link of lessonLinks.slice(0, 50)) {
    try {
      const text = await link.textContent({ timeout: 500 });
      const href = await link.getAttribute('href');
      if (text?.trim() && text.length > 5 && !text.includes('Sketch')) {
        content.items.push({
          name: text.trim().substring(0, 100),
          url: href
        });
      }
    } catch (e) {}
  }
  
  // También buscar por estructura de lista
  const listItems = await page.locator('li, .lesson, .post, .resource-item').all();
  for (const item of listItems.slice(0, 50)) {
    try {
      const text = await item.textContent({ timeout: 500 });
      if (text?.trim() && text.length > 10 && text.length < 200 && !text.includes('Sketch')) {
        const existing = content.items.find((i: any) => i.name === text.trim());
        if (!existing) {
          content.items.push({ name: text.trim() });
        }
      }
    } catch (e) {}
  }
  
  return content;
}

async function main() {
  if (!fs.existsSync('/workspace/screenshots-zona3')) {
    fs.mkdirSync('/workspace/screenshots-zona3', { recursive: true });
  }
  
  console.log('🚀 Explorando HERRAMIENTAS de ZONA3...\n');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const tools: any = {
    timestamp: new Date().toISOString(),
    calculadoras: null,
    contratos: null,
    guias: null,
    baseDatosContactos: null,
    baseDatosHipotecas: null,
    directorio: null,
    informes: null
  };
  
  try {
    const loginOk = await login(page);
    if (!loginOk) return;
    
    // Explorar cada sección de recursos
    const sections = [
      { key: 'calculadoras', name: 'Calculadoras' },
      { key: 'contratos', name: 'Contratos' },
      { key: 'guias', name: 'Guías' },
      { key: 'baseDatosContactos', name: 'Base de datos de contactos' },
      { key: 'baseDatosHipotecas', name: 'Base de datos de hipotecas bancarias' },
      { key: 'directorio', name: 'Directorio de servicios' },
      { key: 'informes', name: 'Informes' }
    ];
    
    for (const section of sections) {
      const success = await clickOnResourceSection(page, section.name);
      
      if (success) {
        // Screenshot
        const filename = `tool-${section.key}.png`;
        await page.screenshot({ path: `/workspace/screenshots-zona3/${filename}`, fullPage: true });
        console.log(`   📸 ${filename}`);
        
        // Extraer contenido
        const content = await extractContent(page);
        tools[section.key] = content;
        
        console.log(`   📋 Items encontrados: ${content.items.length}`);
        for (const item of content.items.slice(0, 8)) {
          console.log(`      • ${item.name.substring(0, 60)}`);
        }
      }
    }
    
    // Guardar análisis
    fs.writeFileSync(
      '/workspace/screenshots-zona3/tools-analysis.json',
      JSON.stringify(tools, null, 2)
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ANÁLISIS DE HERRAMIENTAS COMPLETADO');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
