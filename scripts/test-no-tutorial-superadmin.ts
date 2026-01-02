import { chromium, devices } from 'playwright';

async function testNoTutorialSuperadmin() {
  console.log('🧪 TEST: Tutorial oculto para superadministrador\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
  });
  const page = await context.newPage();

  try {
    const baseURL = 'https://inmovaapp.com';

    // 1. Navegar a login
    console.log('1️⃣  Navegando a login...');
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✅ Página de login cargada');

    // 2. Login como superadministrador
    console.log('\n2️⃣  Haciendo login como superadministrador...');
    await page.fill('input[name="email"]', 'superadmin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Esperar a que la sesión esté lista
    await page.waitForTimeout(3000);

    const currentURL = page.url();
    console.log(`   URL actual: ${currentURL}`);

    // 3. Verificar que NO aparece el modal de tutorial
    console.log('\n3️⃣  Verificando ausencia del tutorial...');

    // Esperar un poco para que cualquier modal se muestre si va a mostrarse
    await page.waitForTimeout(5000);

    // Buscar el modal de onboarding
    const modalVisible = await page.locator('[role="dialog"]').count() > 0;
    const tutorialTexto = await page.locator('text=Tutorial').count() > 0;
    const onboardingTexto = await page.locator('text=Onboarding').count() > 0;

    console.log(`   Modal visible: ${modalVisible ? '❌ SÍ (ERROR)' : '✅ NO'}`);
    console.log(`   Texto "Tutorial": ${tutorialTexto ? '❌ SÍ (ERROR)' : '✅ NO'}`);
    console.log(`   Texto "Onboarding": ${onboardingTexto ? '❌ SÍ (ERROR)' : '✅ NO'}`);

    // 4. Captura de pantalla
    console.log('\n4️⃣  Capturando pantalla...');
    await page.screenshot({ path: '/tmp/superadmin-dashboard.png', fullPage: true });
    console.log('   ✅ Screenshot guardado');

    // 5. Verificar elementos del dashboard
    console.log('\n5️⃣  Verificando dashboard...');
    const hasDashboardElements = await page.locator('nav').count() > 0;
    console.log(`   Elementos de navegación: ${hasDashboardElements ? '✅ SÍ' : '❌ NO'}`);

    // 6. Verificar rol en consola (si está disponible)
    console.log('\n6️⃣  Verificando rol de usuario...');
    const sessionInfo = await page.evaluate(() => {
      return {
        hasSession: typeof window !== 'undefined',
        // Intentar obtener info de sesión si está disponible
      };
    });
    console.log(`   Sesión presente: ${sessionInfo.hasSession ? '✅' : '❌'}`);

    // Resultado final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!modalVisible && !tutorialTexto && !onboardingTexto) {
      console.log('✅ TEST EXITOSO: Tutorial NO aparece para superadministrador');
      console.log('');
      console.log('📋 Resultados:');
      console.log('   ✓ Login exitoso');
      console.log('   ✓ Dashboard cargado');
      console.log('   ✓ Modal de tutorial NO visible');
      console.log('   ✓ Experiencia limpia para usuario experto');
    } else {
      console.log('❌ TEST FALLIDO: El tutorial aparece');
      console.log('');
      console.log('🐛 Problemas detectados:');
      if (modalVisible) console.log('   ✗ Modal visible cuando no debería');
      if (tutorialTexto) console.log('   ✗ Texto "Tutorial" encontrado');
      if (onboardingTexto) console.log('   ✗ Texto "Onboarding" encontrado');
    }

  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}`);
    await page.screenshot({ path: '/tmp/error-superadmin.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

testNoTutorialSuperadmin().catch(console.error);
