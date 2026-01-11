import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';

const LOGIN_URL = 'https://campus.zona3.club/login';
const EMAIL = 'dvillagra@vidaroinversiones.com';
const PASSWORD = 'Pucela00';

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page: Page): Promise<boolean> {
  console.log('📍 Login...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  
  await page.locator('input[name="member[email]"]').first().fill(EMAIL);
  await page.locator('input[name="member[password]"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  
  await page.waitForURL(/.*library.*/, { timeout: 15000 });
  await delay(2000);
  console.log('✅ Login OK');
  return true;
}

async function getAllLinks(page: Page): Promise<{text: string, href: string}[]> {
  const links: {text: string, href: string}[] = [];
  const allLinks = await page.locator('a').all();
  
  for (const link of allLinks) {
    try {
      const text = await link.textContent({ timeout: 500 });
      const href = await link.getAttribute('href');
      if (text?.trim() && href) {
        links.push({ text: text.trim(), href });
      }
    } catch (e) {}
  }
  
  return links;
}

async function main() {
  if (!fs.existsSync('/workspace/screenshots-zona3')) {
    fs.mkdirSync('/workspace/screenshots-zona3', { recursive: true });
  }
  
  console.log('🚀 Exploración simple de ZONA3...\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const allContent: any = { sections: [], courses: [], resources: [] };
  
  try {
    await login(page);
    
    // 1. Página principal - Mi Campus
    console.log('\n📸 Capturando página principal...');
    await page.screenshot({ path: '/workspace/screenshots-zona3/main-library.png', fullPage: true });
    
    // Obtener todos los enlaces de la página principal
    const mainLinks = await getAllLinks(page);
    console.log(`   Encontrados ${mainLinks.length} enlaces`);
    
    // Buscar los botones "Ver contenido"
    const verContenidoButtons = await page.locator('text=Ver contenido').all();
    console.log(`   Botones "Ver contenido": ${verContenidoButtons.length}`);
    
    // 2. Click en cada sección de Mi Campus
    const sectionNames = ['Empieza aquí', 'Itinerarios', 'Formación', 'Recursos', 'Comunidad', 'Próximos Directos', 'Academy'];
    
    for (let i = 0; i < verContenidoButtons.length && i < sectionNames.length; i++) {
      const sectionName = sectionNames[i] || `Sección ${i + 1}`;
      console.log(`\n➡️ Explorando: ${sectionName}`);
      
      try {
        // Volver a la página principal
        await page.goto('https://campus.zona3.club/library', { waitUntil: 'networkidle', timeout: 20000 });
        await delay(1500);
        
        // Obtener todos los botones de nuevo (se regeneran)
        const buttons = await page.locator('text=Ver contenido').all();
        
        if (buttons[i]) {
          await buttons[i].click();
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          await delay(2000);
          
          // Screenshot
          const filename = `section-${(i + 1).toString().padStart(2, '0')}-${sectionName.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
          await page.screenshot({ path: `/workspace/screenshots-zona3/${filename}`, fullPage: true });
          console.log(`   📸 ${filename}`);
          
          // Extraer contenido de la página
          const pageContent = await page.locator('body').innerText();
          const pageUrl = page.url();
          
          allContent.sections.push({
            name: sectionName,
            url: pageUrl,
            content: pageContent.substring(0, 3000)
          });
          
          // Buscar cursos/lecciones en esta sección
          const items = await page.locator('h2, h3, h4').all();
          for (const item of items.slice(0, 15)) {
            try {
              const text = await item.textContent({ timeout: 500 });
              if (text?.trim() && text.length > 3 && text.length < 200) {
                console.log(`     📖 ${text.trim()}`);
              }
            } catch (e) {}
          }
        }
      } catch (error: any) {
        console.log(`   ⚠️ Error: ${error.message?.substring(0, 100)}`);
      }
    }
    
    // 3. Explorar secciones del menú superior
    const menuSections = [
      { name: 'Directos', url: '/events' },
      { name: 'Quedadas', url: '/quedadas' },
      { name: 'Miembros', url: '/members' }
    ];
    
    for (const section of menuSections) {
      console.log(`\n➡️ Menú: ${section.name}`);
      
      try {
        // Buscar link en el header
        const menuLink = page.locator(`header a:has-text("${section.name}")`).first();
        
        if (await menuLink.count() > 0) {
          await menuLink.click();
        } else {
          // Intentar navegación directa
          await page.goto(`https://campus.zona3.club${section.url}`, { timeout: 15000 });
        }
        
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await delay(1500);
        
        const filename = `menu-${section.name.toLowerCase()}.png`;
        await page.screenshot({ path: `/workspace/screenshots-zona3/${filename}`, fullPage: true });
        console.log(`   📸 ${filename}`);
        
        // Contenido
        const content = await page.locator('body').innerText();
        allContent.sections.push({
          name: `Menú - ${section.name}`,
          url: page.url(),
          content: content.substring(0, 3000)
        });
        
      } catch (error: any) {
        console.log(`   ⚠️ Error: ${error.message?.substring(0, 100)}`);
      }
    }
    
    // 4. Guardar todo el análisis
    fs.writeFileSync(
      '/workspace/screenshots-zona3/full-analysis.json',
      JSON.stringify(allContent, null, 2)
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ EXPLORACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log(`📁 Screenshots en: /workspace/screenshots-zona3/`);
    console.log(`📊 Análisis en: /workspace/screenshots-zona3/full-analysis.json`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
