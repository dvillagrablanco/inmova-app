import { test, expect, Page } from '@playwright/test';

/**
 * Suite de Tests: Detección y Prevención de Pantalla Blanca
 * 
 * Estos tests verifican que la aplicación NO muestre pantalla blanca
 * bajo diversos escenarios de error.
 */

test.describe('Detección de Pantalla Blanca', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar interceptores de errores
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.error(`❌ Page Error: ${error.message}`);
    });
  });

  test('debe cargar la landing page sin pantalla blanca', async ({ page }) => {
    // Navegar a landing
    await page.goto('/landing');

    // Esperar a que cargue el contenido
    await page.waitForLoadState('networkidle');

    // Verificar que hay contenido visible
    const isVisible = await checkForWhiteScreen(page);
    expect(isVisible).toBe(false);

    // Verificar elementos específicos de la landing
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button')).toHaveCount(1, { timeout: 5000 });

    // Tomar screenshot
    await page.screenshot({ path: 'screenshots/landing-loaded.png', fullPage: true });
  });

  test('debe mantener contenido visible después de 500ms', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    // Verificar contenido inmediatamente
    let isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    // Esperar 500ms (punto crítico donde suele fallar)
    await page.waitForTimeout(500);

    // Verificar que sigue habiendo contenido
    isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    // Esperar 2 segundos adicionales
    await page.waitForTimeout(2000);

    // Verificar de nuevo
    isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    // Screenshot final
    await page.screenshot({ path: 'screenshots/landing-after-2500ms.png', fullPage: true });
  });

  test('debe mostrar error boundary en lugar de pantalla blanca cuando hay error', async ({ page }) => {
    // Inyectar un error después de cargar
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    // Simular error de JavaScript
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('Test Error: Simulated crash');
      }, 100);
    });

    // Esperar a que el error se procese
    await page.waitForTimeout(1000);

    // Verificar que NO hay pantalla blanca
    const isWhite = await checkForWhiteScreen(page);
    
    if (isWhite) {
      // Si hay pantalla blanca, el error boundary no funcionó
      await page.screenshot({ path: 'screenshots/white-screen-error.png', fullPage: true });
      throw new Error('Pantalla blanca detectada después de error. Error Boundary NO funcionó.');
    }

    // Debería mostrar error boundary O seguir mostrando contenido
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('debe recuperarse de errores de hidratación', async ({ page }) => {
    // Navegar a una página con componentes client-side
    await page.goto('/dashboard');

    // Esperar hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verificar contenido visible
    const isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    // Buscar warnings de hidratación en consola
    const hydrationWarnings: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.toLowerCase().includes('hydration') || text.toLowerCase().includes('did not match')) {
        hydrationWarnings.push(text);
      }
    });

    // Si hay warnings, loguearlos pero no fallar (a menos que cause pantalla blanca)
    if (hydrationWarnings.length > 0) {
      console.warn('⚠️ Hydration warnings detectados:', hydrationWarnings);
    }

    await page.screenshot({ path: 'screenshots/dashboard-hydrated.png', fullPage: true });
  });

  test('debe manejar navegación sin pantalla blanca', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    // Verificar landing
    let isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    // Navegar a login
    await page.click('text=/.*Login.*|.*Iniciar sesión.*/i');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verificar login
    isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    await page.screenshot({ path: 'screenshots/login-page.png', fullPage: true });
  });

  test('debe detectar y reportar pantalla blanca si ocurre', async ({ page }) => {
    // Este test ESPERA que falle si hay pantalla blanca
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    // Simular un crash severo que podría causar pantalla blanca
    await page.evaluate(() => {
      // Remover todo el contenido del DOM
      document.body.innerHTML = '';
      document.body.style.background = 'white';
    });

    await page.waitForTimeout(500);

    // Verificar que se detecta la pantalla blanca
    const isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(true); // Este DEBE detectarse

    // El detector debería mostrar UI de recuperación
    const recoveryUI = await page.$('#white-screen-recovery');
    
    if (!recoveryUI) {
      console.warn('⚠️ White Screen Detector no mostró UI de recuperación');
    }

    await page.screenshot({ path: 'screenshots/white-screen-simulated.png', fullPage: true });
  });

  test('debe monitorear continuamente y detectar cambios', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    // Verificar estado inicial
    let isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    // Simular interacción del usuario
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);

    // Verificar después de interacción
    isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    // Simular scroll
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Verificar después de scroll
    isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);

    await page.screenshot({ path: 'screenshots/after-interactions.png', fullPage: true });
  });
});

/**
 * Función helper para detectar pantalla blanca
 */
async function checkForWhiteScreen(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    // Check 1: Verificar contenido visible
    const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0';
    });

    // Check 2: Verificar texto visible
    const bodyText = document.body.innerText?.trim() || '';

    // Check 3: Verificar altura del body
    const bodyHeight = document.body.offsetHeight;

    // Check 4: Verificar color de fondo
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const isWhiteBg = bodyBg === 'rgb(255, 255, 255)' || 
                      bodyBg === 'rgba(255, 255, 255, 1)' || 
                      bodyBg === 'white' ||
                      bodyBg === '';

    // Criterios de pantalla blanca:
    // - Fondo blanco Y
    // - Pocos elementos visibles Y
    // - Poco texto Y
    // - Altura baja
    const isWhiteScreen = isWhiteBg && (
      visibleElements.length < 10 ||
      bodyText.length < 20 ||
      bodyHeight < 100
    );

    // Log para debugging
    if (isWhiteScreen) {
      console.error('🔴 Pantalla blanca detectada:', {
        visibleElements: visibleElements.length,
        textLength: bodyText.length,
        bodyHeight,
        background: bodyBg,
      });
    }

    return isWhiteScreen;
  });
}

/**
 * Test de carga de performance
 */
test.describe('Performance y Tiempo de Carga', () => {
  test('debe cargar en menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Tiempo de carga: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);

    // Verificar que no hay pantalla blanca
    const isWhite = await checkForWhiteScreen(page);
    expect(isWhite).toBe(false);
  });

  test('debe mostrar contenido progresivamente (no blanco mientras carga)', async ({ page }) => {
    await page.goto('/landing');

    // Verificar cada 200ms durante 2 segundos
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(200);
      
      const isWhite = await checkForWhiteScreen(page);
      
      if (isWhite) {
        await page.screenshot({ 
          path: `screenshots/white-during-load-${i * 200}ms.png`, 
          fullPage: true 
        });
        throw new Error(`Pantalla blanca detectada durante carga (${i * 200}ms)`);
      }
    }
  });
});
