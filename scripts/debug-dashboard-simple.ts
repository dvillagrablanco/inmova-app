#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const TEST_USER = { email: 'admin@inmova.app', password: 'Admin123!' };

async function main() {
  console.log('🔍 Debuggeando Dashboard...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capturar APIs y errores
  const apiCalls: Array<{ url: string; status: number; body?: any }> = [];
  const consoleErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      const call: any = {
        url: url.replace(BASE_URL, ''),
        status: response.status(),
      };
      
      try {
        if (response.headers()['content-type']?.includes('json')) {
          call.body = await response.json();
        }
      } catch (e) {}
      
      apiCalls.push(call);
      
      // Log en tiempo real
      console.log(`  API: ${call.status} ${call.url}`);
    }
  });

  try {
    // Login
    console.log('[1] Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 30000 });
    console.log('✅ Login OK\n');

    // Esperar que cargue
    await page.waitForTimeout(5000);

    // Buscar mensaje "no hay datos"
    console.log('[2] Buscando mensaje "no hay datos"...');
    const noDataMsg = await page.locator('text=/no hay datos/i').first();
    const visible = await noDataMsg.isVisible().catch(() => false);
    
    if (visible) {
      const text = await noDataMsg.textContent();
      console.log(`⚠️  ENCONTRADO: "${text}"\n`);
      
      // Obtener contexto HTML
      const parent = await noDataMsg.evaluate(el => {
        let current = el.parentElement;
        let depth = 0;
        while (current && depth < 3) {
          if (current.className || current.id) {
            return {
              tag: current.tagName,
              class: current.className,
              id: current.id,
              text: current.textContent?.substring(0, 200),
            };
          }
          current = current.parentElement;
          depth++;
        }
        return null;
      });
      
      console.log('Contexto:');
      console.log(JSON.stringify(parent, null, 2));
      console.log();
    } else {
      console.log('✅ NO encontrado\n');
    }

    // Verificar APIs
    console.log('[3] API Calls:');
    console.log(`Total: ${apiCalls.length}\n`);
    
    const failedCalls = apiCalls.filter(c => c.status >= 400);
    if (failedCalls.length > 0) {
      console.log(`❌ APIs fallidas: ${failedCalls.length}`);
      failedCalls.forEach(call => {
        console.log(`  - ${call.status} ${call.url}`);
        if (call.body) {
          console.log(`    ${JSON.stringify(call.body).substring(0, 100)}`);
        }
      });
      console.log();
    }

    // APIs del dashboard
    const dashboardCalls = apiCalls.filter(c => c.url.includes('/api/dashboard'));
    if (dashboardCalls.length > 0) {
      console.log('API Dashboard:');
      dashboardCalls.forEach(call => {
        console.log(`  - ${call.status} ${call.url}`);
        if (call.body) {
          const keys = Object.keys(call.body);
          console.log(`    Keys: ${keys.join(', ')}`);
          
          // Si hay KPIs, mostrar valores
          if (call.body.kpis) {
            console.log('    KPIs:');
            Object.entries(call.body.kpis).forEach(([key, value]) => {
              console.log(`      ${key}: ${value}`);
            });
          }
        }
      });
      console.log();
    } else {
      console.log('⚠️  NO se encontró llamada a /api/dashboard\n');
    }

    // Errores de consola
    console.log('[4] Errores de Console:');
    if (consoleErrors.length > 0) {
      console.log(`❌ Total: ${consoleErrors.length}`);
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 150)}`);
      });
    } else {
      console.log('✅ Sin errores');
    }
    console.log();

    // Screenshot
    await page.screenshot({ path: '/tmp/dashboard-debug.png', fullPage: true });
    console.log('📸 Screenshot: /tmp/dashboard-debug.png\n');

    // Obtener HTML del mensaje
    if (visible) {
      const html = await page.evaluate(() => {
        const el = document.evaluate(
          "//text()[contains(translate(., 'NO HAY DATOS', 'no hay datos'), 'no hay datos')]",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        
        if (el && el.parentElement) {
          return el.parentElement.outerHTML;
        }
        return null;
      });
      
      console.log('[5] HTML del mensaje:');
      console.log(html?.substring(0, 500));
      console.log();
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
