import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';

const LOGIN_URL = 'https://campus.zona3.club/login';
const EMAIL = 'dvillagra@vidaroinversiones.com';
const PASSWORD = 'Pucela00';

interface CourseInfo {
  title: string;
  description?: string;
  modules?: string[];
  url?: string;
}

interface PlatformContent {
  courses: CourseInfo[];
  mainSections: string[];
  features: string[];
  screenshots: string[];
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page: Page): Promise<boolean> {
  console.log('📍 Navegando a:', LOGIN_URL);
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Captura de pantalla del login
  await page.screenshot({ path: '/workspace/screenshots-zona3/01-login-page.png', fullPage: true });
  console.log('📸 Screenshot: login page');
  
  // Buscar campos de login (zona3 usa member[email] y member[password])
  const emailInput = page.locator('input[name="member[email]"], input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[name="member[password]"], input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar"), button:has-text("Acceder"), input[value*="Iniciar"], input[value*="Log"]').first();
  
  // Verificar que existen los campos
  if (await emailInput.count() === 0) {
    console.log('⚠️ No se encontró campo de email, buscando alternativas...');
    // Intentar con otros selectores
    const inputs = await page.locator('input').all();
    console.log(`  Encontrados ${inputs.length} inputs en la página`);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const placeholder = await inputs[i].getAttribute('placeholder');
      console.log(`  Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}`);
    }
  }
  
  try {
    console.log('📝 Rellenando credenciales...');
    await emailInput.fill(EMAIL);
    await delay(500);
    await passwordInput.fill(PASSWORD);
    await delay(500);
    
    // Screenshot antes de submit
    await page.screenshot({ path: '/workspace/screenshots-zona3/02-credentials-filled.png', fullPage: true });
    
    console.log('🔐 Enviando login...');
    await submitButton.click();
    
    // Esperar navegación o cambio de página
    await Promise.race([
      page.waitForNavigation({ timeout: 15000 }),
      page.waitForURL(/.*(?!login).*/, { timeout: 15000 }),
      delay(10000)
    ]);
    
    await delay(2000);
    
    // Verificar si login fue exitoso
    const currentUrl = page.url();
    console.log('📍 URL actual:', currentUrl);
    
    // Screenshot después de login
    await page.screenshot({ path: '/workspace/screenshots-zona3/03-after-login.png', fullPage: true });
    
    if (!currentUrl.includes('login')) {
      console.log('✅ Login exitoso!');
      return true;
    } else {
      // Verificar si hay mensaje de error
      const errorText = await page.locator('.error, .alert-danger, [class*="error"], [class*="alert"]').textContent().catch(() => '');
      if (errorText) {
        console.log('❌ Error de login:', errorText);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error durante login:', error);
    await page.screenshot({ path: '/workspace/screenshots-zona3/error-login.png', fullPage: true });
    return false;
  }
}

async function explorePlatform(page: Page): Promise<PlatformContent> {
  const content: PlatformContent = {
    courses: [],
    mainSections: [],
    features: [],
    screenshots: []
  };
  
  console.log('\n📚 Explorando plataforma...');
  
  // Obtener estructura principal de navegación
  const navLinks = await page.locator('nav a, .sidebar a, .menu a, [class*="nav"] a').all();
  console.log(`\n🔗 Enlaces de navegación encontrados: ${navLinks.length}`);
  
  const visitedUrls = new Set<string>();
  const sectionsToVisit: { name: string; url: string }[] = [];
  
  for (const link of navLinks) {
    try {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href && text && !visitedUrls.has(href)) {
        const cleanText = text.trim();
        if (cleanText && href.startsWith('/') || href.includes('zona3')) {
          sectionsToVisit.push({ name: cleanText, url: href });
          content.mainSections.push(cleanText);
          console.log(`  - ${cleanText}: ${href}`);
        }
      }
    } catch (e) {}
  }
  
  // Screenshot del dashboard/home
  await page.screenshot({ path: '/workspace/screenshots-zona3/04-dashboard.png', fullPage: true });
  content.screenshots.push('04-dashboard.png');
  
  // Extraer contenido visible en la página principal
  const pageText = await page.locator('body').textContent();
  console.log('\n📄 Contenido de la página principal (primeros 2000 caracteres):');
  console.log(pageText?.substring(0, 2000));
  
  // Buscar cursos/módulos
  const courseCards = await page.locator('[class*="course"], [class*="curso"], [class*="module"], [class*="card"], .lesson, .lección').all();
  console.log(`\n📚 Tarjetas de cursos/módulos encontradas: ${courseCards.length}`);
  
  for (let i = 0; i < Math.min(courseCards.length, 10); i++) {
    try {
      const card = courseCards[i];
      const title = await card.locator('h1, h2, h3, h4, .title, [class*="title"]').first().textContent().catch(() => '');
      const desc = await card.locator('p, .description, [class*="desc"]').first().textContent().catch(() => '');
      
      if (title?.trim()) {
        content.courses.push({
          title: title.trim(),
          description: desc?.trim() || undefined
        });
        console.log(`  📖 ${title.trim()}`);
      }
    } catch (e) {}
  }
  
  // Navegar a secciones principales y extraer contenido
  let screenshotIndex = 5;
  for (const section of sectionsToVisit.slice(0, 8)) {
    try {
      const fullUrl = section.url.startsWith('http') ? section.url : `https://campus.zona3.club${section.url}`;
      
      if (visitedUrls.has(fullUrl)) continue;
      visitedUrls.add(fullUrl);
      
      console.log(`\n➡️ Visitando: ${section.name} (${fullUrl})`);
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 20000 });
      await delay(1500);
      
      // Screenshot de la sección
      const screenshotName = `${screenshotIndex.toString().padStart(2, '0')}-${section.name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)}.png`;
      await page.screenshot({ path: `/workspace/screenshots-zona3/${screenshotName}`, fullPage: true });
      content.screenshots.push(screenshotName);
      screenshotIndex++;
      
      // Extraer contenido de la sección
      const sectionContent = await page.locator('main, .content, [class*="content"], article').first().textContent().catch(() => '');
      if (sectionContent) {
        console.log(`  📝 Contenido (primeros 500 chars): ${sectionContent.substring(0, 500)}`);
      }
      
      // Buscar cursos en esta sección
      const sectionCourses = await page.locator('[class*="course"], [class*="curso"], [class*="lesson"], [class*="leccion"]').all();
      for (const course of sectionCourses.slice(0, 5)) {
        const title = await course.locator('h1, h2, h3, h4, .title').first().textContent().catch(() => '');
        if (title?.trim() && !content.courses.find(c => c.title === title.trim())) {
          content.courses.push({ title: title.trim() });
          console.log(`    📖 Curso encontrado: ${title.trim()}`);
        }
      }
      
    } catch (error) {
      console.log(`  ⚠️ Error visitando ${section.name}:`, error);
    }
  }
  
  return content;
}

async function main() {
  // Crear directorio para screenshots
  if (!fs.existsSync('/workspace/screenshots-zona3')) {
    fs.mkdirSync('/workspace/screenshots-zona3', { recursive: true });
  }
  
  console.log('🚀 Iniciando exploración de campus.zona3.club...\n');
  
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Login
    const loginSuccess = await login(page);
    
    if (!loginSuccess) {
      console.log('\n❌ No se pudo iniciar sesión. Abortando...');
      // Guardar HTML para debug
      const html = await page.content();
      fs.writeFileSync('/workspace/screenshots-zona3/login-page.html', html);
      return;
    }
    
    // 2. Explorar plataforma
    const content = await explorePlatform(page);
    
    // 3. Guardar resultados
    const report = {
      timestamp: new Date().toISOString(),
      platform: 'campus.zona3.club',
      ...content
    };
    
    fs.writeFileSync('/workspace/screenshots-zona3/platform-analysis.json', JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE LA EXPLORACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Secciones principales: ${content.mainSections.length}`);
    console.log(`✅ Cursos encontrados: ${content.courses.length}`);
    console.log(`✅ Screenshots capturados: ${content.screenshots.length}`);
    console.log('\n📁 Resultados guardados en /workspace/screenshots-zona3/');
    
  } catch (error) {
    console.error('❌ Error general:', error);
    await page.screenshot({ path: '/workspace/screenshots-zona3/error-general.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
