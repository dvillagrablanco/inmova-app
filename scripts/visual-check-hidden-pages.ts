/**
 * Verificación visual de páginas ocultas - toma screenshots
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'https://inmovaapp.com';
const SCREENSHOTS_DIR = '/tmp/admin-screenshots';

const HIDDEN_PAGES = [
  '/admin/plantillas-sms',
  '/admin/firma-digital',
  '/admin/legal',
  '/admin/salud-sistema',
  '/admin/alertas',
  '/admin/backup-restore',
  '/admin/addons',
];

async function main() {
  // Crear directorio de screenshots
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Login
  console.log('🔐 Iniciando sesión...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"], input[type="email"]', 'admin@inmova.app');
  await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
  console.log('✅ Sesión iniciada\n');

  for (const pagePath of HIDDEN_PAGES) {
    console.log(`📸 Capturando ${pagePath}...`);
    await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const filename = pagePath.replace(/\//g, '_').substring(1) + '.png';
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/${filename}`, fullPage: true });
    
    // Verificar contenido
    const title = await page.title();
    const h1 = await page.$('h1');
    const h1Text = h1 ? await h1.textContent() : 'N/A';
    console.log(`   Título: ${title}`);
    console.log(`   H1: ${h1Text}\n`);
  }

  await browser.close();
  console.log(`\n📁 Screenshots guardados en: ${SCREENSHOTS_DIR}/`);
}

main().catch(console.error);
