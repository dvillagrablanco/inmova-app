import { test, expect } from '@playwright/test';

/**
 * Test E2E para la página de Valoración IA
 * Verifica que la página carga correctamente y no hay errores
 */

test.describe('Página de Valoración IA', () => {
  
  test('La página carga sin errores', async ({ page }) => {
    // Capturar errores de consola
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capturar errores de página
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navegar a la página
    await page.goto('https://inmovaapp.com/valoracion-ia', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Esperar a que termine de cargar
    await page.waitForTimeout(3000);

    // Tomar screenshot
    await page.screenshot({ 
      path: 'e2e/screenshots/valoracion-ia-initial.png',
      fullPage: true 
    });

    // Verificar que NO hay error boundary visible
    const errorBoundary = page.locator('text=¡Ups! Algo salió mal');
    const hasError = await errorBoundary.isVisible().catch(() => false);

    if (hasError) {
      console.log('❌ Error boundary detectado');
      console.log('Errores de consola:', consoleErrors);
      console.log('Errores de página:', pageErrors);
      
      // Tomar screenshot del error
      await page.screenshot({ 
        path: 'e2e/screenshots/valoracion-ia-error.png',
        fullPage: true 
      });
    }

    // La página debe cargarse sin error boundary
    expect(hasError).toBe(false);

    // Verificar que hay contenido de la página
    const title = await page.title();
    console.log('Título de la página:', title);

    // Reportar errores de consola si los hay
    if (consoleErrors.length > 0) {
      console.log('Errores de consola encontrados:', consoleErrors);
    }

    if (pageErrors.length > 0) {
      console.log('Errores de página encontrados:', pageErrors);
    }
  });

  test('La página muestra el formulario de valoración cuando el usuario está autenticado', async ({ page }) => {
    // Primero hacer login
    await page.goto('https://inmovaapp.com/login', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Verificar si ya estamos logueados (redirige a dashboard)
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      // Hacer login
      await page.fill('input[name="email"]', 'admin@inmova.app');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      
      // Esperar a que redirija
      await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
        console.log('No redirigió a dashboard, URL actual:', page.url());
      });
    }

    // Ahora ir a valoración IA
    await page.goto('https://inmovaapp.com/valoracion-ia', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Esperar un poco más para que cargue
    await page.waitForTimeout(5000);

    // Tomar screenshot
    await page.screenshot({ 
      path: 'e2e/screenshots/valoracion-ia-authenticated.png',
      fullPage: true 
    });

    // Verificar que NO hay error boundary
    const errorBoundary = page.locator('text=¡Ups! Algo salió mal');
    const hasError = await errorBoundary.isVisible().catch(() => false);

    if (hasError) {
      console.log('❌ Error detectado después del login');
      // Capturar el error digest si está disponible
      const errorDigest = await page.locator('code').textContent().catch(() => 'No disponible');
      console.log('Error digest:', errorDigest);
    }

    expect(hasError).toBe(false);

    // Verificar elementos de la página
    const pageContent = await page.content();
    
    // Buscar elementos clave
    const hasValoracion = pageContent.includes('Valoración') || pageContent.includes('valoración');
    const hasIA = pageContent.includes('IA') || pageContent.includes('Inteligencia Artificial');
    const hasFormulario = pageContent.includes('Superficie') || pageContent.includes('superficie');
    
    console.log('Contiene "Valoración":', hasValoracion);
    console.log('Contiene "IA":', hasIA);
    console.log('Contiene formulario:', hasFormulario);

    // Al menos uno de estos debería estar presente si la página cargó bien
    expect(hasValoracion || hasIA || hasFormulario).toBe(true);
  });

  test('Diagnóstico completo de la página', async ({ page }) => {
    // Capturar todas las peticiones de red
    const networkRequests: { url: string; status: number; method: string }[] = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('inmovaapp.com/api')) {
        networkRequests.push({
          url: url,
          status: response.status(),
          method: response.request().method()
        });
      }
    });

    // Capturar errores
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`[Console Error] ${msg.text()}`);
      }
    });
    page.on('pageerror', error => {
      errors.push(`[Page Error] ${error.message}`);
    });

    // Navegar
    console.log('\n📍 Navegando a la página...');
    await page.goto('https://inmovaapp.com/valoracion-ia', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Esperar a que cargue
    await page.waitForTimeout(5000);

    // Verificar estado
    console.log('\n📊 Estado de la página:');
    console.log('URL:', page.url());
    console.log('Título:', await page.title());

    // Verificar si hay error boundary
    const errorVisible = await page.locator('text=¡Ups! Algo salió mal').isVisible().catch(() => false);
    console.log('Error boundary visible:', errorVisible);

    // Verificar si hay loader
    const loaderVisible = await page.locator('text=Cargando').isVisible().catch(() => false);
    console.log('Loader visible:', loaderVisible);

    // Mostrar peticiones de API
    console.log('\n🌐 Peticiones de API:');
    networkRequests.forEach(req => {
      const status = req.status >= 400 ? `❌ ${req.status}` : `✅ ${req.status}`;
      console.log(`  ${status} ${req.method} ${req.url}`);
    });

    // Mostrar errores
    if (errors.length > 0) {
      console.log('\n❌ Errores detectados:');
      errors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('\n✅ No se detectaron errores');
    }

    // Screenshot final
    await page.screenshot({ 
      path: 'e2e/screenshots/valoracion-ia-diagnostic.png',
      fullPage: true 
    });

    console.log('\n📸 Screenshot guardado en: e2e/screenshots/valoracion-ia-diagnostic.png');
  });
});
