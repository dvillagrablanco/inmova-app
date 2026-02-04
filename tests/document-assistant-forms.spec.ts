import { test, expect } from '@playwright/test';

const BASE_URL = 'https://inmovaapp.com';
const PDF_PATH = './test-files/DNI_David_Villagra_.pdf';

const ROUTES = [
  { name: 'Inquilinos', path: '/inquilinos/nuevo' },
  { name: 'Contratos', path: '/contratos/nuevo' },
  { name: 'Pagos', path: '/pagos/nuevo' },
  { name: 'Propiedades', path: '/propiedades/crear' },
  { name: 'Edificios', path: '/edificios/nuevo' },
  { name: 'Unidades', path: '/unidades/nuevo' },
  { name: 'Garajes/Trasteros', path: '/garajes-trasteros/nuevo' },
  { name: 'Seguros', path: '/seguros/nuevo' },
  { name: 'Mantenimiento', path: '/mantenimiento/nuevo' },
  { name: 'Candidatos', path: '/candidatos/nuevo' },
  { name: 'Proveedores', path: '/proveedores' },
  { name: 'Actas', path: '/comunidades/actas' },
];

test.describe('IA documental - validación de aplicación en formularios', () => {
  test.setTimeout(240000);

  test('aplica datos y no muestra error de guardado', async ({ page }) => {
    console.log('📍 Login...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const acceptCookies = page.locator(
      'button:has-text("Aceptar todas"), button:has-text("Aceptar"), button:has-text("Accept")'
    );
    if (await acceptCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(500);
    }

    await page.fill('input[type="email"]', 'admin@inmova.app');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|admin|inquilinos|propiedades)/, { timeout: 30000 });
    console.log('✅ Login OK');

    const closeCookiesIfNeeded = async () => {
      const cookieButton = page.locator(
        'button:has-text("Aceptar todas"), button:has-text("Aceptar"), button:has-text("Solo necesarias"), button:has-text("Accept")'
      );
      if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cookieButton.click();
        await page.waitForTimeout(500);
      }
    };

    page.on('pageerror', (error) => {
      console.log(`🧨 Page error: ${error.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`🛑 Console error: ${msg.text()}`);
      }
    });

    for (const route of ROUTES) {
      console.log(`\n📍 Validando ${route.name} -> ${route.path}`);
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await closeCookiesIfNeeded();

      const inlineTrigger = page.getByTestId('ai-assistant-trigger').first();
      try {
        await inlineTrigger.scrollIntoViewIfNeeded({ timeout: 10000 });
        await inlineTrigger.click({ force: true, timeout: 5000 });
      } catch {
        const fallbackTrigger = page
          .getByRole('button', { name: /Escanear DNI|Documento con IA/i })
          .first();
        await fallbackTrigger.scrollIntoViewIfNeeded({ timeout: 10000 });
        await fallbackTrigger.click({ force: true, timeout: 5000 });
      }

      const openPanel = page.getByTestId('ai-assistant-panel').first();
      await openPanel.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

      const fileInput = page.getByTestId('ai-file-upload').first();
      await expect(fileInput).toBeAttached({ timeout: 10000 });

      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/ai/document-analysis'),
        { timeout: 120000 }
      );

      await fileInput.setInputFiles(PDF_PATH);
      await responsePromise;

      const reviewDialog = page
        .locator('[role="dialog"]')
        .filter({ hasText: /Revisar Datos|Datos Extraídos/i })
        .first();
      await reviewDialog.waitFor({ state: 'visible', timeout: 60000 });

      const applyButton = reviewDialog.locator('button:has-text("Aplicar")').first();
      await applyButton.click({ force: true, timeout: 10000 });

      const saveErrorToast = page.locator('text=/hubo un problema guardando el documento/i');
      await expect(saveErrorToast).toBeHidden({ timeout: 5000 });

      await page.keyboard.press('Escape').catch(() => {});
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(500);

      console.log(`✅ ${route.name} validado`);
    }
  });
});
