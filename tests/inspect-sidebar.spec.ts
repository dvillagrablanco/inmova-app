import { test, expect } from '@playwright/test';

test('Inspect Sidebar for Admin', async ({ page }) => {
  console.log('🌍 Navegando a https://inmovaapp.com/login...');
  await page.goto('https://inmovaapp.com/login');

  console.log('🔑 Intentando login...');
  await page.fill('input[type="email"]', 'admin@inmova.app');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');

  // Esperar navegación o error
  try {
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    console.log('✅ Login exitoso, redirigido a dashboard.');
  } catch (e) {
    console.log('⚠️ No se redirigió a dashboard, posible error o ruta diferente.');
    console.log('URL actual:', page.url());
  }

  // Esperar renderizado del sidebar
  try {
    await page.waitForSelector('aside', { timeout: 5000 });

    const sidebar = page.locator('aside');
    const links = await sidebar.locator('a').allInnerTexts();

    console.log('\n📋 ITEMS EN SIDEBAR ACTUAL:');
    links.forEach((link) => console.log(` - ${link}`));

    if (links.length < 5) {
      console.log('\n❌ DIAGNÓSTICO: El sidebar está incompleto/vacío.');
    } else {
      console.log(`\nℹ️  Se detectaron ${links.length} items.`);
    }
  } catch (e) {
    console.log('❌ No se encontró el elemento <aside> del sidebar.');
  }
});
