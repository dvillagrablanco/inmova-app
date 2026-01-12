/**
 * Script para verificar respuesta de API dashboard
 */
import { chromium } from '@playwright/test';

const BASE_URL = 'https://inmovaapp.com';
const ADMIN_EMAIL = 'admin@inmova.app';
const ADMIN_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Verificando API dashboard...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capturar requests y responses
  const apiResponses: any[] = [];
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      let body = '';
      try {
        body = await response.text();
        if (body.length > 500) {
          body = body.substring(0, 500) + '...';
        }
      } catch (e) {
        body = '[no body]';
      }
      apiResponses.push({ url, status, body });
    }
  });
  
  try {
    // Login
    console.log('1️⃣ Haciendo login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Esperar a cargar dashboard
    await page.waitForTimeout(5000);
    console.log(`   URL actual: ${page.url()}`);
    
    console.log('\n2️⃣ Respuestas de API capturadas:\n');
    
    for (const resp of apiResponses) {
      console.log(`📡 ${resp.status} ${resp.url}`);
      if (resp.body && resp.body !== '[no body]') {
        try {
          const json = JSON.parse(resp.body);
          console.log('   Response:', JSON.stringify(json, null, 2).substring(0, 300));
        } catch {
          console.log('   Response:', resp.body.substring(0, 200));
        }
      }
      console.log('');
    }
    
    // Verificar contenido de la página
    const pageContent = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      return main.innerText?.substring(0, 1000) || 'No content';
    });
    
    console.log('\n3️⃣ Contenido visible de la página:');
    console.log(pageContent);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
