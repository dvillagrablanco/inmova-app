/**
 * Verificación visual: sidebar respeta módulos desactivados
 * 
 * 1. Login como admin
 * 2. Screenshot del sidebar con todos los módulos
 * 3. Desactivar un módulo via API
 * 4. Recargar y screenshot del sidebar sin ese módulo
 * 5. Reactivar el módulo
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const EMAIL = 'admin@inmova.app';
const PASSWORD = 'Admin123!';

async function run() {
  console.log('=== VERIFICACIÓN SIDEBAR + MÓDULOS ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('1. Navegando a login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');

    // Esperar a que redirija al dashboard
    try {
      await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
    } catch {
      console.log('  Timeout esperando redirect. URL actual:', page.url());
    }

    await page.waitForTimeout(3000);
    console.log('  URL actual:', page.url());

    // 2. Screenshot del sidebar completo
    console.log('\n2. Capturando sidebar ANTES de desactivar módulos...');
    await page.screenshot({ path: '/workspace/test-results/sidebar-before.png', fullPage: false });
    console.log('  Screenshot guardado: test-results/sidebar-before.png');

    // 3. Expandir todas las secciones del sidebar para ver todos los items
    const sectionButtons = await page.$$('nav button[aria-expanded]');
    for (const btn of sectionButtons) {
      const expanded = await btn.getAttribute('aria-expanded');
      if (expanded === 'false') {
        await btn.click();
        await page.waitForTimeout(200);
      }
    }
    await page.waitForTimeout(1000);

    const sidebarItems = await page.$$eval('nav a[href]', (els) =>
      els.map((el) => ({
        text: el.textContent?.trim() || '',
        href: el.getAttribute('href') || '',
      })).filter(item => item.text && item.href)
    );

    console.log(`\n3. Items visibles en sidebar: ${sidebarItems.length}`);
    sidebarItems.slice(0, 30).forEach(item => {
      console.log(`   - ${item.text} (${item.href})`);
    });
    if (sidebarItems.length > 30) {
      console.log(`   ... y ${sidebarItems.length - 30} más`);
    }

    // 4. Verificar API de módulos activos
    console.log('\n4. Consultando módulos activos via API...');
    const modulesResponse = await page.evaluate(async () => {
      const res = await fetch('/api/modules/active');
      return res.json();
    });
    console.log(`  Módulos activos: ${(modulesResponse.activeModules || []).length}`);
    console.log(`  CompanyId: ${modulesResponse.companyId || 'N/A'}`);
    
    const activeModules = modulesResponse.activeModules || [];
    if (activeModules.length > 0) {
      console.log(`  Primeros 15: ${activeModules.slice(0, 15).join(', ')}`);
    }

    // 5. Intentar desactivar un módulo no-core (ej: "reportes" o "gastos")
    const moduleToTest = 'gastos';
    console.log(`\n5. Desactivando módulo "${moduleToTest}" via API...`);

    const toggleResult = await page.evaluate(async (mod: string) => {
      const res = await fetch('/api/modules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduloCodigo: mod, activo: false }),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    }, moduleToTest);

    console.log(`  Resultado: status=${toggleResult.status}`);
    if (toggleResult.body) {
      console.log(`  Body: ${JSON.stringify(toggleResult.body).substring(0, 200)}`);
    }

    // 6. Recargar página y verificar que el item desapareció
    console.log('\n6. Recargando página...');
    await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // Screenshot del sidebar después
    await page.screenshot({ path: '/workspace/test-results/sidebar-after-disable.png', fullPage: false });
    console.log('  Screenshot guardado: test-results/sidebar-after-disable.png');

    // Expand sections again after reload
    const sectionBtns2 = await page.$$('nav button[aria-expanded="false"]');
    for (const btn of sectionBtns2) { await btn.click(); await page.waitForTimeout(200); }
    await page.waitForTimeout(1000);

    const sidebarItemsAfter = await page.$$eval('nav a[href]', (els) =>
      els.map((el) => ({
        text: el.textContent?.trim() || '',
        href: el.getAttribute('href') || '',
      })).filter(item => item.text && item.href)
    );

    console.log(`  Items visibles DESPUÉS: ${sidebarItemsAfter.length}`);

    // Buscar si "Gastos" sigue visible
    const gastosVisible = sidebarItemsAfter.some(item =>
      item.text.toLowerCase().includes('gasto') || item.href.includes('/gastos')
    );
    
    if (gastosVisible) {
      console.log(`  ⚠ "Gastos" SIGUE visible en el sidebar (posible problema)`);
    } else {
      console.log(`  ✅ "Gastos" ya NO aparece en el sidebar`);
    }

    // 7. Reactivar el módulo
    console.log(`\n7. Reactivando módulo "${moduleToTest}"...`);
    await page.evaluate(async (mod: string) => {
      await fetch('/api/modules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduloCodigo: mod, activo: true }),
      });
    }, moduleToTest);
    console.log('  Módulo reactivado');

    // Screenshot final
    await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/workspace/test-results/sidebar-after-reenable.png', fullPage: false });
    console.log('  Screenshot guardado: test-results/sidebar-after-reenable.png');

    const sectionBtns3 = await page.$$('nav button[aria-expanded="false"]');
    for (const btn of sectionBtns3) { await btn.click(); await page.waitForTimeout(200); }
    await page.waitForTimeout(1000);

    const sidebarItemsFinal = await page.$$eval('nav a[href]', (els) =>
      els.map((el) => ({
        text: el.textContent?.trim() || '',
        href: el.getAttribute('href') || '',
      })).filter(item => item.text && item.href)
    );

    const gastosVisibleFinal = sidebarItemsFinal.some(item =>
      item.text.toLowerCase().includes('gasto') || item.href.includes('/gastos')
    );
    
    if (gastosVisibleFinal) {
      console.log(`  ✅ "Gastos" aparece de nuevo en el sidebar tras reactivar`);
    } else {
      console.log(`  ⚠ "Gastos" NO aparece después de reactivar`);
    }

    console.log('\n=== VERIFICACIÓN COMPLETADA ===');

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: '/workspace/test-results/sidebar-error.png' });
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
