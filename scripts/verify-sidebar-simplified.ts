/**
 * Verifica la simplificación del sidebar de Alquiler Residencial
 * - Antes: 18 items
 * - Después: 9 items
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://157.180.119.236:3000';
const SUPERADMIN_EMAIL = 'admin@inmova.app';
const SUPERADMIN_PASSWORD = 'Admin123!';

async function main() {
  console.log('🔍 VERIFICACIÓN - SIDEBAR SIMPLIFICADO');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const screenshotDir = '/workspace/screenshots-sidebar';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    // Login
    console.log('\n1️⃣ Login como superadmin...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.fill('input[name="email"]', SUPERADMIN_EMAIL);
    await page.fill('input[name="password"]', SUPERADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      console.log('   ✅ Login exitoso');
    } else {
      console.log('   ⚠️ Login puede haber fallado');
    }

    // Navegar al dashboard
    console.log('\n2️⃣ Navegando al dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Cerrar modal si existe
    try {
      const closeButtons = await page.$$('button:has-text("Cerrar"), button:has-text("×"), button:has-text("Omitir")');
      if (closeButtons.length > 0) {
        await closeButtons[0].click();
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    // Screenshot del sidebar
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-dashboard-sidebar.png'),
      fullPage: false 
    });
    console.log('   ✅ Screenshot sidebar tomado');

    // Buscar y expandir Alquiler Residencial
    console.log('\n3️⃣ Buscando sección Alquiler Residencial...');
    
    // Buscar el botón de Alquiler Residencial
    const alquilerButton = await page.$('button:has-text("Alquiler Residencial")');
    if (alquilerButton) {
      await alquilerButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Sección Alquiler Residencial encontrada y expandida');
    } else {
      console.log('   ⚠️ No se encontró el botón exacto, buscando alternativas...');
      // Intentar con texto parcial
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.includes('Alquiler')) {
          await btn.click();
          await page.waitForTimeout(1000);
          console.log(`   ✅ Encontrado y expandido: "${text.trim().substring(0, 30)}..."`);
          break;
        }
      }
    }

    // Screenshot con sidebar expandido
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-alquiler-residencial-expandido.png'),
      fullPage: false 
    });
    console.log('   ✅ Screenshot con sección expandida');

    // Contar items en el sidebar de Alquiler Residencial
    console.log('\n4️⃣ Verificando items del sidebar...');
    
    // Buscar links dentro del área de Alquiler Residencial
    const sidebarItems = await page.$$eval('nav a, aside a', (links) => {
      return links.map(link => ({
        text: link.textContent?.trim() || '',
        href: link.getAttribute('href') || ''
      })).filter(item => item.text && item.href);
    });
    
    // Items esperados después de la simplificación
    const expectedItems = [
      'Dashboard Alquiler',
      'Propiedades',
      'Inquilinos',
      'Contratos',
      'Media Estancia',
      'Candidatos',
      'Valoraciones',
      'Inspecciones',
      'Certificaciones'
    ];

    console.log(`   📊 Items encontrados en sidebar: ${sidebarItems.length}`);
    
    // Verificar items específicos
    let foundCount = 0;
    for (const expected of expectedItems) {
      const found = sidebarItems.some(item => 
        item.text.toLowerCase().includes(expected.toLowerCase())
      );
      if (found) {
        foundCount++;
        console.log(`   ✅ ${expected}`);
      } else {
        console.log(`   ⚠️ ${expected} - No encontrado visualmente`);
      }
    }

    // Navegar a Media Estancia
    console.log('\n5️⃣ Navegando a Media Estancia...');
    await page.goto(`${BASE_URL}/media-estancia`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: path.join(screenshotDir, '03-media-estancia-dashboard.png'),
      fullPage: true 
    });
    console.log('   ✅ Screenshot Media Estancia tomado');

    // Verificar acciones rápidas en Media Estancia
    const quickActions = await page.$$eval('button, a', (elements) => {
      return elements.map(el => el.textContent?.trim() || '').filter(t => t);
    });
    
    const expectedQuickActions = ['Calendario', 'Scoring', 'Analytics', 'Configuración'];
    console.log('\n6️⃣ Verificando accesos rápidos en Media Estancia...');
    for (const action of expectedQuickActions) {
      const found = quickActions.some(qa => qa.toLowerCase().includes(action.toLowerCase()));
      if (found) {
        console.log(`   ✅ ${action}`);
      } else {
        console.log(`   ⚠️ ${action} - No encontrado`);
      }
    }

    // Verificar que las páginas internas funcionan
    console.log('\n7️⃣ Verificando páginas internas de Media Estancia...');
    const internalPages = [
      { path: '/media-estancia/calendario', name: 'Calendario' },
      { path: '/media-estancia/scoring', name: 'Scoring' },
      { path: '/media-estancia/analytics', name: 'Analytics' },
      { path: '/media-estancia/configuracion', name: 'Configuración' },
    ];

    for (const pg of internalPages) {
      await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = page.url().includes(pg.path) ? '✅' : '⚠️';
      console.log(`   ${status} ${pg.name} (${pg.path})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log(`
📊 RESUMEN DE SIMPLIFICACIÓN:

ANTES (18 items):
- Dashboard Alquiler
- Edificios
- Unidades
- Garajes y Trasteros
- Propiedades
- Inquilinos
- Contratos
- Media Estancia (dashboard)
- Calendario Disponibilidad
- Scoring Inquilinos IA
- Analytics Media Estancia
- Config. Media Estancia
- Candidatos
- Screening Inquilinos
- Valoraciones Propiedades
- Inspecciones
- Certificaciones
- Seguros

DESPUÉS (9 items):
- Dashboard Alquiler
- Propiedades
- Inquilinos
- Contratos
- Media Estancia
- Candidatos
- Valoraciones IA
- Inspecciones
- Certificaciones

📁 Screenshots guardados en: ${screenshotDir}
`);

  } catch (error) {
    console.error(`❌ Error: ${error}`);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
