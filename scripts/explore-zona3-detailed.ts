import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';

const LOGIN_URL = 'https://campus.zona3.club/login';
const EMAIL = 'dvillagra@vidaroinversiones.com';
const PASSWORD = 'Pucela00';

const SECTIONS_TO_EXPLORE = [
  { name: 'Empieza aquí', selector: 'text=Empieza aquí' },
  { name: 'Itinerarios', selector: 'text=Itinerarios' },
  { name: 'Formación', selector: 'text=Formación' },
  { name: 'Recursos', selector: 'text=Recursos' },
  { name: 'Comunidad', selector: 'text=Comunidad' },
  { name: 'Próximos Directos', selector: 'text=Próximos Directos' },
  { name: 'Academy', selector: 'text=Academy' },
];

interface ContentItem {
  title: string;
  description?: string;
  type: string;
  url?: string;
}

interface SectionContent {
  name: string;
  url: string;
  items: ContentItem[];
  rawText: string;
}

interface PlatformAnalysis {
  platform: string;
  timestamp: string;
  sections: SectionContent[];
  navigation: string[];
  features: string[];
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page: Page): Promise<boolean> {
  console.log('📍 Navegando a:', LOGIN_URL);
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  
  const emailInput = page.locator('input[name="member[email]"]').first();
  const passwordInput = page.locator('input[name="member[password]"]').first();
  const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
  
  try {
    console.log('📝 Rellenando credenciales...');
    await emailInput.fill(EMAIL);
    await delay(300);
    await passwordInput.fill(PASSWORD);
    await delay(300);
    
    console.log('🔐 Enviando login...');
    await submitButton.click();
    
    await page.waitForURL(/.*library.*/, { timeout: 15000 });
    await delay(2000);
    
    console.log('✅ Login exitoso! URL:', page.url());
    return true;
  } catch (error) {
    console.error('❌ Error durante login:', error);
    return false;
  }
}

async function extractSectionContent(page: Page, sectionName: string): Promise<SectionContent> {
  const content: SectionContent = {
    name: sectionName,
    url: page.url(),
    items: [],
    rawText: ''
  };
  
  // Esperar a que cargue el contenido
  await delay(2000);
  
  // Capturar texto completo de la página
  const bodyText = await page.locator('body').innerText();
  content.rawText = bodyText.substring(0, 5000); // Primeros 5000 caracteres
  
  // Buscar items de contenido (cursos, lecciones, recursos)
  const itemSelectors = [
    '.card', '[class*="card"]',
    '.course', '[class*="course"]',
    '.lesson', '[class*="lesson"]',
    '.module', '[class*="module"]',
    '.item', '[class*="item"]',
    'article',
    '.resource', '[class*="resource"]'
  ];
  
  for (const selector of itemSelectors) {
    try {
      const items = await page.locator(selector).all();
      for (const item of items.slice(0, 20)) {
        try {
          const title = await item.locator('h1, h2, h3, h4, h5, .title, [class*="title"]').first().textContent({ timeout: 1000 }).catch(() => null);
          const desc = await item.locator('p, .description, [class*="desc"]').first().textContent({ timeout: 1000 }).catch(() => null);
          
          if (title?.trim() && title.length > 3) {
            const existing = content.items.find(i => i.title === title.trim());
            if (!existing) {
              content.items.push({
                title: title.trim(),
                description: desc?.trim() || undefined,
                type: selector.replace(/[\[\].*"=]/g, '').substring(0, 20)
              });
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }
  
  // También buscar enlaces que parecen ser cursos
  const links = await page.locator('a[href*="/courses/"], a[href*="/lessons/"], a[href*="/products/"]').all();
  for (const link of links.slice(0, 30)) {
    try {
      const text = await link.textContent({ timeout: 1000 });
      const href = await link.getAttribute('href');
      if (text?.trim() && text.length > 3 && !content.items.find(i => i.title === text.trim())) {
        content.items.push({
          title: text.trim(),
          url: href || undefined,
          type: 'link'
        });
      }
    } catch (e) {}
  }
  
  return content;
}

async function exploreSection(page: Page, section: typeof SECTIONS_TO_EXPLORE[0], screenshotIndex: number): Promise<SectionContent | null> {
  console.log(`\n➡️ Explorando: ${section.name}`);
  
  try {
    // Primero ir a la página principal para encontrar el botón
    await page.goto('https://campus.zona3.club/library', { waitUntil: 'networkidle', timeout: 20000 });
    await delay(1500);
    
    // Buscar el botón "Ver contenido" de la sección específica
    // La estructura es: card con título -> botón "Ver contenido"
    const sectionCard = page.locator(`text=${section.name}`).first();
    
    if (await sectionCard.count() > 0) {
      // Buscar el botón cercano
      const parent = page.locator(`div:has(>> text="${section.name}")`).first();
      const viewButton = parent.locator('text=Ver contenido').first();
      
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await delay(2000);
      } else {
        // Intentar click directo en el título
        await sectionCard.click();
        await delay(2000);
      }
    } else {
      console.log(`  ⚠️ No se encontró la sección ${section.name}`);
      return null;
    }
    
    // Capturar screenshot
    const screenshotPath = `/workspace/screenshots-zona3/detail-${screenshotIndex.toString().padStart(2, '0')}-${section.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  📸 Screenshot: ${screenshotPath}`);
    
    // Extraer contenido
    const content = await extractSectionContent(page, section.name);
    console.log(`  📚 Items encontrados: ${content.items.length}`);
    
    // Mostrar items encontrados
    for (const item of content.items.slice(0, 10)) {
      console.log(`     - ${item.title}`);
    }
    
    return content;
    
  } catch (error) {
    console.error(`  ❌ Error explorando ${section.name}:`, error);
    return null;
  }
}

async function exploreDirectos(page: Page): Promise<SectionContent> {
  console.log('\n➡️ Explorando: Directos (desde menú)');
  
  await page.goto('https://campus.zona3.club/directos', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await delay(2000);
  
  await page.screenshot({ path: '/workspace/screenshots-zona3/detail-directos.png', fullPage: true });
  
  return await extractSectionContent(page, 'Directos');
}

async function exploreQuedadas(page: Page): Promise<SectionContent> {
  console.log('\n➡️ Explorando: Quedadas (desde menú)');
  
  await page.goto('https://campus.zona3.club/quedadas', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await delay(2000);
  
  await page.screenshot({ path: '/workspace/screenshots-zona3/detail-quedadas.png', fullPage: true });
  
  return await extractSectionContent(page, 'Quedadas');
}

async function exploreMiembros(page: Page): Promise<SectionContent> {
  console.log('\n➡️ Explorando: Miembros (desde menú)');
  
  await page.goto('https://campus.zona3.club/members', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await delay(2000);
  
  await page.screenshot({ path: '/workspace/screenshots-zona3/detail-miembros.png', fullPage: true });
  
  return await extractSectionContent(page, 'Miembros');
}

async function main() {
  // Crear directorio
  if (!fs.existsSync('/workspace/screenshots-zona3')) {
    fs.mkdirSync('/workspace/screenshots-zona3', { recursive: true });
  }
  
  console.log('🚀 Exploración detallada de ZONA3 Campus...\n');
  console.log('=' .repeat(60));
  
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const analysis: PlatformAnalysis = {
    platform: 'ZONA3 - El Club privado de los Inversores Inmobiliarios',
    timestamp: new Date().toISOString(),
    sections: [],
    navigation: ['Mi Campus', 'Directos', 'Quedadas', 'Miembros', 'Buscar'],
    features: []
  };
  
  try {
    // 1. Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.log('\n❌ No se pudo iniciar sesión. Abortando...');
      return;
    }
    
    // Screenshot inicial
    await page.screenshot({ path: '/workspace/screenshots-zona3/00-main-campus.png', fullPage: true });
    
    // 2. Explorar cada sección del campus
    let screenshotIndex = 1;
    for (const section of SECTIONS_TO_EXPLORE) {
      const content = await exploreSection(page, section, screenshotIndex);
      if (content) {
        analysis.sections.push(content);
      }
      screenshotIndex++;
    }
    
    // 3. Explorar secciones del menú superior
    const directosContent = await exploreDirectos(page);
    analysis.sections.push(directosContent);
    
    const quedadasContent = await exploreQuedadas(page);
    analysis.sections.push(quedadasContent);
    
    const miembrosContent = await exploreMiembros(page);
    analysis.sections.push(miembrosContent);
    
    // 4. Guardar análisis completo
    fs.writeFileSync(
      '/workspace/screenshots-zona3/detailed-analysis.json',
      JSON.stringify(analysis, null, 2)
    );
    
    // 5. Generar reporte
    console.log('\n' + '='.repeat(60));
    console.log('📊 ANÁLISIS COMPLETO DE ZONA3 CAMPUS');
    console.log('='.repeat(60));
    console.log(`\n🏢 Plataforma: ${analysis.platform}`);
    console.log(`📅 Fecha: ${analysis.timestamp}`);
    console.log(`\n📚 SECCIONES ENCONTRADAS:`);
    
    for (const section of analysis.sections) {
      console.log(`\n  📁 ${section.name}`);
      console.log(`     URL: ${section.url}`);
      console.log(`     Items: ${section.items.length}`);
      if (section.items.length > 0) {
        console.log('     Contenido:');
        for (const item of section.items.slice(0, 5)) {
          console.log(`       • ${item.title}`);
        }
        if (section.items.length > 5) {
          console.log(`       ... y ${section.items.length - 5} más`);
        }
      }
    }
    
    console.log('\n📁 Resultados guardados en /workspace/screenshots-zona3/');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
