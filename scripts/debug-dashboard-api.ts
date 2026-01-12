/**
 * Script para verificar API dashboard directamente después de login
 */
import { chromium } from '@playwright/test';

const BASE_URL = 'https://inmovaapp.com';
const ADMIN_EMAIL = 'admin@inmova.app';
const ADMIN_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 Verificando API dashboard específicamente...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capturar TODAS las requests que van a /api/dashboard
  page.on('request', (request) => {
    if (request.url().includes('/api/dashboard')) {
      console.log(`📤 Request: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/dashboard')) {
      console.log(`📥 Response: ${response.status()} ${response.url()}`);
      try {
        const body = await response.text();
        console.log(`   Body: ${body.substring(0, 1000)}`);
      } catch (e) {
        console.log(`   Body: [error reading body]`);
      }
    }
  });
  
  // Capturar errores de consola
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().toLowerCase().includes('error')) {
      console.log(`🔴 Console ${msg.type()}: ${msg.text()}`);
    }
  });
  
  try {
    // Login
    console.log('1️⃣ Haciendo login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Esperar redirección
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
    console.log(`\n2️⃣ Redirigido a: ${page.url()}`);
    
    // Esperar a que carguen las APIs
    console.log('\n3️⃣ Esperando llamadas a API...');
    await page.waitForTimeout(10000);
    
    // Llamar a la API directamente desde el contexto del navegador
    console.log('\n4️⃣ Llamando a /api/dashboard directamente...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dashboard');
        const status = response.status;
        const data = await response.json();
        return { status, data };
      } catch (e: any) {
        return { error: e.message };
      }
    });
    
    console.log('   Respuesta directa:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // También probar analytics
    console.log('\n5️⃣ Llamando a /api/dashboard/analytics...');
    const analyticsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dashboard/analytics');
        const status = response.status;
        const data = await response.json();
        return { status, data };
      } catch (e: any) {
        return { error: e.message };
      }
    });
    
    console.log('   Respuesta analytics:');
    console.log(JSON.stringify(analyticsResponse, null, 2).substring(0, 1000));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
