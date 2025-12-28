import { test, expect } from '@playwright/test';

test('Quick login test with screenshot', async ({ page }) => {
  test.setTimeout(45000);

  console.log('\n🔍 Prueba rápida de login\n');

  // 1. Ir a la página de login
  console.log('Navegando a /login...');
  await page.goto('https://inmovaapp.com/login');
  await page.waitForLoadState('networkidle');
  
  // Screenshot inicial
  await page.screenshot({ path: 'test-results/quick-1-initial.png', fullPage: true });
  console.log('✅ Screenshot inicial guardado');

  // 2. Llenar formulario
  const email = 'admin@inmova.app';
  const password = 'Admin2025!';
  
  console.log(`Intentando login con: ${email}`);
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Screenshot con datos llenados
  await page.screenshot({ path: 'test-results/quick-2-filled.png', fullPage: true });
  console.log('✅ Screenshot con formulario llenado');

  // 3. Submit
  console.log('Enviando formulario...');
  await page.click('button[type="submit"]');
  
  // Esperar navegación o error
  await page.waitForTimeout(5000);
  
  // Screenshot después del submit
  await page.screenshot({ path: 'test-results/quick-3-after-submit.png', fullPage: true });
  console.log('✅ Screenshot después de submit');

  // 4. Verificar resultado
  const url = page.url();
  console.log(`URL actual: ${url}`);
  
  if (url.includes('/login')) {
    console.log('❌ Aún en página de login - FALLÓ');
    
    // Buscar mensaje de error
    const body = await page.textContent('body');
    console.log('\nContenido de la página:');
    console.log(body?.substring(0, 500));
  } else {
    console.log('✅ Salió de /login - ÉXITO');
  }
});
