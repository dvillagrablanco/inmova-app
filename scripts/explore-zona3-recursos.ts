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

async function exploreSection(page: Page, sectionName: string, buttonIndex: number): Promise<any> {
  console.log(`\n➡️ Explorando: ${sectionName}`);
  
  try {
    // Ir a la página principal
    await page.goto('https://campus.zona3.club/library', { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);
    
    // Encontrar y hacer clic en el botón correspondiente
    const buttons = await page.locator('text=Ver contenido').all();
    console.log(`   Encontrados ${buttons.length} botones "Ver contenido"`);
    
    if (buttons[buttonIndex]) {
      await buttons[buttonIndex].click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });
      await delay(3000);
      
      const currentUrl = page.url();
      console.log(`   URL: ${currentUrl}`);
      
      // Screenshot
      const filename = `recursos-${sectionName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      await page.screenshot({ path: `/workspace/screenshots-zona3/${filename}`, fullPage: true });
      console.log(`   📸 ${filename}`);
      
      // Extraer contenido
      const pageText = await page.locator('body').innerText();
      
      // Buscar títulos y descripciones
      const items: any[] = [];
      const headings = await page.locator('h1, h2, h3, h4').all();
      
      for (const heading of headings.slice(0, 30)) {
        try {
          const text = await heading.textContent({ timeout: 1000 });
          if (text?.trim() && text.length > 2 && text.length < 200) {
            items.push({ title: text.trim() });
          }
        } catch (e) {}
      }
      
      // Buscar enlaces de descarga
      const downloadLinks = await page.locator('a[href*="download"], a[href*=".pdf"], a[href*=".xlsx"], a[href*=".docx"], a:has-text("Descargar"), a:has-text("Download")').all();
      console.log(`   📥 Enlaces de descarga encontrados: ${downloadLinks.length}`);
      
      for (const link of downloadLinks.slice(0, 20)) {
        try {
          const text = await link.textContent({ timeout: 1000 });
          const href = await link.getAttribute('href');
          if (text?.trim()) {
            items.push({ title: text.trim(), url: href, type: 'download' });
            console.log(`      - ${text.trim()}`);
          }
        } catch (e) {}
      }
      
      return {
        name: sectionName,
        url: currentUrl,
        items,
        content: pageText.substring(0, 5000)
      };
    }
  } catch (error: any) {
    console.log(`   ⚠️ Error: ${error.message?.substring(0, 100)}`);
  }
  
  return null;
}

async function exploreSubpages(page: Page, baseUrl: string): Promise<any[]> {
  const subpages: any[] = [];
  
  // Buscar enlaces internos que parecen ser recursos o cursos
  const links = await page.locator('a[href*="/products/"], a[href*="/posts/"], a[href*="/courses/"]').all();
  console.log(`\n🔗 Enlaces internos encontrados: ${links.length}`);
  
  const visited = new Set<string>();
  
  for (const link of links.slice(0, 15)) {
    try {
      const href = await link.getAttribute('href');
      const text = await link.textContent({ timeout: 1000 });
      
      if (href && !visited.has(href)) {
        visited.add(href);
        const fullUrl = href.startsWith('http') ? href : `https://campus.zona3.club${href}`;
        
        console.log(`\n   📄 Visitando: ${text?.trim()?.substring(0, 50) || href}`);
        
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 20000 });
        await delay(2000);
        
        // Screenshot de la subpágina
        const safeName = (text?.trim() || href).replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
        await page.screenshot({ 
          path: `/workspace/screenshots-zona3/subpage-${safeName}.png`, 
          fullPage: true 
        });
        
        // Extraer contenido
        const content = await page.locator('body').innerText();
        
        // Buscar recursos descargables
        const downloads = await page.locator('a[href*="download"], a[href*=".pdf"], a[href*=".xlsx"]').all();
        const downloadItems: any[] = [];
        
        for (const dl of downloads) {
          try {
            const dlText = await dl.textContent({ timeout: 500 });
            const dlHref = await dl.getAttribute('href');
            if (dlText?.trim()) {
              downloadItems.push({ name: dlText.trim(), url: dlHref });
            }
          } catch (e) {}
        }
        
        subpages.push({
          title: text?.trim(),
          url: fullUrl,
          content: content.substring(0, 3000),
          downloads: downloadItems
        });
      }
    } catch (e) {}
  }
  
  return subpages;
}

async function main() {
  if (!fs.existsSync('/workspace/screenshots-zona3')) {
    fs.mkdirSync('/workspace/screenshots-zona3', { recursive: true });
  }
  
  console.log('🚀 Explorando RECURSOS de ZONA3...\n');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  const analysis: any = {
    timestamp: new Date().toISOString(),
    sections: [],
    resources: [],
    tools: []
  };
  
  try {
    const loginOk = await login(page);
    if (!loginOk) {
      console.log('❌ Login fallido');
      return;
    }
    
    // Los índices de botones según la imagen:
    // 0: Empieza aquí
    // 1: Itinerarios
    // 2: Formación
    // 3: Recursos <-- Este nos interesa
    // 4: Comunidad
    // 5: Próximos Directos
    // 6: Academy
    
    // Explorar sección RECURSOS (índice 3)
    const recursos = await exploreSection(page, 'Recursos', 3);
    if (recursos) {
      analysis.sections.push(recursos);
      
      // Explorar subpáginas dentro de recursos
      const subpages = await exploreSubpages(page, recursos.url);
      analysis.resources = subpages;
    }
    
    // También explorar Formación (índice 2) para ver qué cursos hay
    const formacion = await exploreSection(page, 'Formación', 2);
    if (formacion) {
      analysis.sections.push(formacion);
      
      const formacionSubpages = await exploreSubpages(page, formacion.url);
      analysis.tools = formacionSubpages;
    }
    
    // Explorar Academy (índice 6)
    const academy = await exploreSection(page, 'Academy', 6);
    if (academy) {
      analysis.sections.push(academy);
    }
    
    // Guardar análisis
    fs.writeFileSync(
      '/workspace/screenshots-zona3/recursos-analysis.json',
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ANÁLISIS DE RECURSOS COMPLETADO');
    console.log('='.repeat(60));
    console.log(`\n📁 Secciones exploradas: ${analysis.sections.length}`);
    console.log(`📥 Recursos encontrados: ${analysis.resources.length}`);
    console.log(`🛠️ Herramientas/Cursos: ${analysis.tools.length}`);
    console.log('\n📁 Resultados en: /workspace/screenshots-zona3/');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
