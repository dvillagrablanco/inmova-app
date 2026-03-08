/**
 * Test del Demo Tour navegable — debug version
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const EMAIL = 'demo@vidaroinversiones.com';
const PASSWORD = 'VidaroDemo2026!';

async function main() {
  console.log('🎭 Test Demo Tour — Debug\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Collect console logs from the page
  page.on('console', msg => {
    if (msg.text().includes('demo') || msg.text().includes('Demo') || msg.text().includes('tour') || msg.text().includes('Tour') || msg.text().includes('DEMO')) {
      console.log(`   [BROWSER] ${msg.text()}`);
    }
  });

  try {
    // 1. Login
    console.log('1. Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Accept cookies if banner appears
    const cookieBtn = page.locator('button:has-text("Aceptar todas")');
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      console.log('   Cookies accepted');
    }
    
    await page.fill('input[name="email"], input[type="email"]', EMAIL);
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {});
    console.log('   ✅ URL:', page.url());

    // Accept cookies on dashboard too
    const cookieBtn2 = page.locator('button:has-text("Aceptar todas")');
    if (await cookieBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn2.click();
      console.log('   Cookies accepted on dashboard');
    }

    // 2. Wait longer for tour to appear
    console.log('\n2. Esperando tour (8 seg)...');
    await page.waitForTimeout(8000);

    // Check sessionStorage
    const storageState = await page.evaluate(() => {
      return sessionStorage.getItem('inmova-demo-tour');
    });
    console.log(`   sessionStorage['inmova-demo-tour']: ${storageState}`);

    // Check if user email is correct in session
    const sessionInfo = await page.evaluate(() => {
      // Look for next-auth session data
      const cookies = document.cookie;
      return cookies.substring(0, 100);
    });
    console.log(`   Cookies (first 100): ${sessionInfo}`);

    // Check the page for DemoShowcaseTour component
    const hasOverlay = await page.locator('.fixed.inset-0').count();
    console.log(`   Fixed inset-0 elements: ${hasOverlay}`);
    
    // Check for ANY modal or overlay
    const overlays = await page.locator('[class*="z-[9999]"], [class*="z-[999"]').count();
    console.log(`   High z-index elements: ${overlays}`);

    // Check for "PASO" text anywhere
    const pasoText = await page.locator('text=/PASO/').count();
    console.log(`   "PASO" text elements: ${pasoText}`);

    // Check for "Grupo Vidaro" text
    const vidaro = await page.locator('text=Grupo Vidaro').count();
    console.log(`   "Grupo Vidaro" elements: ${vidaro}`);
    
    // Check for "Presentar Demo" button
    const presentBtn = await page.locator('button:has-text("Presentar Demo")').count();
    console.log(`   "Presentar Demo" buttons: ${presentBtn}`);

    // Check for "Siguiente" button
    const nextBtn = await page.locator('button:has-text("Siguiente")').count();
    console.log(`   "Siguiente" buttons: ${nextBtn}`);

    // Screenshot
    await page.screenshot({ path: '/opt/cursor/artifacts/demo-debug.png', fullPage: false });
    console.log('   📸 Screenshot: demo-debug.png');

    // 3. If tour not visible, try setting sessionStorage and reloading
    if (nextBtn === 0 && presentBtn === 0) {
      console.log('\n3. Tour no visible. Forzando estado via sessionStorage...');
      
      await page.evaluate(() => {
        sessionStorage.removeItem('inmova-demo-tour');
        sessionStorage.removeItem('inmova-demo-tour-completed');
        sessionStorage.removeItem('inmova-demo-tour-state');
      });
      
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(5000);
      
      const nextBtn2 = await page.locator('button:has-text("Siguiente")').count();
      const pasoText2 = await page.locator('text=/PASO/').count();
      console.log(`   After reload — "Siguiente": ${nextBtn2}, "PASO": ${pasoText2}`);
      
      await page.screenshot({ path: '/opt/cursor/artifacts/demo-debug2.png', fullPage: false });
      console.log('   📸 Screenshot: demo-debug2.png');
    }

    // 4. If still not visible, try clicking "Presentar Demo" if it appears
    const presentBtnAfter = await page.locator('button:has-text("Presentar Demo")');
    if (await presentBtnAfter.isVisible().catch(() => false)) {
      console.log('\n4. Clickando "Presentar Demo"...');
      await presentBtnAfter.click();
      await page.waitForTimeout(2000);
      
      const nextBtnFinal = await page.locator('button:has-text("Siguiente")').count();
      console.log(`   "Siguiente" visible: ${nextBtnFinal > 0}`);
    }

    // 5. If tour IS visible now, click through steps
    const finalNext = page.locator('button:has-text("Siguiente")');
    if (await finalNext.isVisible().catch(() => false)) {
      console.log('\n5. Tour visible! Recorriendo pasos...');
      
      for (let i = 0; i < 11; i++) {
        const stepNum = i + 1;
        const counter = await page.locator('text=/PASO \\d+ \\/ \\d+/').first().textContent().catch(() => '?');
        const url = new URL(page.url()).pathname;
        
        const isLast = stepNum === 11;
        const btn = isLast
          ? page.locator('button:has-text("Explorar")')
          : page.locator('button:has-text("Siguiente")');
        const btnVisible = await btn.isVisible().catch(() => false);
        
        console.log(`   ${counter} | URL: ${url} | Btn: ${btnVisible ? '✅' : '❌'}`);
        
        if (!btnVisible) {
          await page.screenshot({ path: `/opt/cursor/artifacts/demo-step${stepNum}.png` });
          break;
        }
        
        await btn.click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('\n✅ Test completado');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: '/opt/cursor/artifacts/demo-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
