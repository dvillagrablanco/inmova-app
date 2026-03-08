/**
 * Test del Demo Tour navegable — verifica que fluye correctamente
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const EMAIL = 'demo@vidaroinversiones.com';
const PASSWORD = 'VidaroDemo2026!';

async function main() {
  console.log('🎭 Iniciando test del Demo Tour...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('1. Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[name="email"], input[type="email"]', EMAIL);
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
      console.log('   ⚠️ No redirigió a /dashboard, URL actual:', page.url());
    });
    console.log('   ✅ Login OK → URL:', page.url());

    // 2. Wait for the demo tour to appear
    console.log('\n2. Esperando que aparezca el tour...');
    await page.waitForTimeout(3000);

    // Check for tour overlay
    const overlay = await page.locator('[class*="fixed"][class*="inset-0"][class*="z-"]').first();
    const overlayVisible = await overlay.isVisible().catch(() => false);
    console.log(`   Tour overlay visible: ${overlayVisible}`);

    // Look for the step counter "PASO 1 / 12"
    const stepCounter = await page.locator('text=/PASO \\d+ \\/ \\d+/').first();
    const counterVisible = await stepCounter.isVisible().catch(() => false);
    console.log(`   Step counter visible: ${counterVisible}`);
    if (counterVisible) {
      const counterText = await stepCounter.textContent();
      console.log(`   Step counter text: "${counterText}"`);
    }

    // Look for "Grupo Vidaro" text
    const vidaro = await page.locator('text=Grupo Vidaro').first();
    const vidaroVisible = await vidaro.isVisible().catch(() => false);
    console.log(`   "Grupo Vidaro" visible: ${vidaroVisible}`);

    // Look for "Siguiente" button
    const nextBtn = await page.locator('button:has-text("Siguiente")').first();
    const nextVisible = await nextBtn.isVisible().catch(() => false);
    console.log(`   Botón "Siguiente" visible: ${nextVisible}`);

    if (!nextVisible) {
      console.log('\n   ❌ Tour no apareció. Buscando elementos de onboarding...');
      // Check what onboarding elements ARE showing
      const aiChat = await page.locator('text=Configuración con IA').isVisible().catch(() => false);
      console.log(`   AIOnboardingChat visible: ${aiChat}`);
      const wizard = await page.locator('text=Continuar configuración').isVisible().catch(() => false);
      console.log(`   SmartOnboardingWizard visible: ${wizard}`);
      
      // Take screenshot to see what's there
      await page.screenshot({ path: '/opt/cursor/artifacts/demo-tour-state.png', fullPage: false });
      console.log('   📸 Screenshot guardado en /opt/cursor/artifacts/demo-tour-state.png');
      
      // Check page content
      const bodyText = await page.locator('body').textContent();
      const hasPortal = bodyText?.includes('Portal') || false;
      const hasBienvenido = bodyText?.includes('Bienvenido') || false;
      const hasInmova = bodyText?.includes('INMOVA') || false;
      console.log(`   Body contains: Portal=${hasPortal}, Bienvenido=${hasBienvenido}, INMOVA=${hasInmova}`);
      
      await browser.close();
      return;
    }

    // 3. Click through all 12 steps
    console.log('\n3. Recorriendo los 12 pasos del tour...');
    
    const expectedRoutes = [
      '/dashboard',       // 1. Welcome
      '/dashboard',       // 2. Dashboard
      '/propiedades',     // 3. Properties
      '/portal-inquilino',// 4. Tenant Portal
      '/contratos',       // 5. Contracts
      '/family-office',   // 6. Family Office
      '/valoracion-ia',   // 7. AI
      '/mantenimiento',   // 8. Maintenance
      '/configuracion',   // 9. Automation
      '/dashboard',       // 10. Before/After
      '/dashboard',       // 11. Closing
    ];

    for (let i = 0; i < 12; i++) {
      const stepNum = i + 1;
      
      // Wait for step to be visible
      await page.waitForTimeout(1500);
      
      // Check current URL
      const currentUrl = page.url();
      const currentPath = new URL(currentUrl).pathname;
      
      // Check step counter
      const counter = await page.locator('text=/PASO \\d+ \\/ \\d+/').first().textContent().catch(() => '?');
      
      // Check if overlay is visible
      const isOverlayUp = await page.locator('button:has-text("Siguiente"), button:has-text("Explorar")').first().isVisible().catch(() => false);
      
      const expectedRoute = expectedRoutes[i] || '?';
      const routeMatch = currentPath.startsWith(expectedRoute) ? '✅' : `⚠️ (expected ${expectedRoute})`;
      
      console.log(`   Paso ${stepNum}: ${counter} | URL: ${currentPath} ${routeMatch} | Overlay: ${isOverlayUp ? '✅' : '❌'}`);

      if (!isOverlayUp) {
        console.log(`   ❌ Overlay no visible en paso ${stepNum}. Deteniendo.`);
        await page.screenshot({ path: `/opt/cursor/artifacts/demo-tour-step${stepNum}.png`, fullPage: false });
        console.log(`   📸 Screenshot: demo-tour-step${stepNum}.png`);
        break;
      }

      // Click "Siguiente" (or "Explorar" on last step)
      if (stepNum < 12) {
        await page.locator('button:has-text("Siguiente")').first().click();
      } else {
        // Last step — click "Explorar ✨"
        const exploreBtn = await page.locator('button:has-text("Explorar")').first();
        if (await exploreBtn.isVisible()) {
          await exploreBtn.click();
          console.log('   ✅ Tour completado — click en "Explorar"');
        }
      }
      
      // Wait for navigation
      await page.waitForTimeout(1500);
    }

    // 4. Check controls after tour
    console.log('\n4. Verificando controles post-tour...');
    await page.waitForTimeout(1000);
    const presentBtn = await page.locator('button:has-text("Presentar Demo")').first();
    const presentVisible = await presentBtn.isVisible().catch(() => false);
    console.log(`   Botón "Presentar Demo" visible: ${presentVisible}`);

    // 5. Take final screenshot
    await page.screenshot({ path: '/opt/cursor/artifacts/demo-tour-final.png', fullPage: false });
    console.log('   📸 Screenshot final guardado');

    console.log('\n✅ Test completado');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: '/opt/cursor/artifacts/demo-tour-error.png', fullPage: false }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
