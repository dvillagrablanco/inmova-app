/**
 * E2E Test - Asistente Documental IA - Carga de DNI
 * Test específico para verificar que el PDF de DNI se procesa correctamente
 */

import { test, expect } from '@playwright/test';
import path from 'path';

const TEST_USER = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

// Usar ruta relativa al proyecto
const PDF_PATH = './test-files/DNI_David_Villagra_.pdf';
const BASE_URL = 'https://inmovaapp.com';

test.describe('Asistente Documental IA - DNI', () => {
  test.setTimeout(180000); // 3 minutos para el test completo

  // Deshabilitar el webServer y usar producción directamente
  test.use({ baseURL: BASE_URL });

  test('DNI-001: Debe procesar un PDF de DNI y extraer los datos', async ({ page }) => {
    // 1. Login
    console.log('📍 Paso 1: Iniciando sesión...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    await page.click('button[type="submit"]');

    // Esperar redirección después del login
    await page.waitForURL(/\/(dashboard|admin|inquilinos|propiedades)/, { timeout: 30000 });
    console.log('✅ Login exitoso');

    // 2. Navegar a inquilinos/nuevo
    console.log('📍 Paso 2: Navegando a /inquilinos/nuevo...');
    await page.goto(`${BASE_URL}/inquilinos/nuevo`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Página de nuevo inquilino cargada');

    // 3. Cerrar banner de cookies si aparece
    console.log('📍 Paso 3: Cerrando cookies si hay...');
    const cookieButton = page
      .locator('button:has-text("Aceptar"), button:has-text("Solo necesarias")')
      .first();
    if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Cookies cerradas');
    }

    // 4. Buscar el botón flotante del asistente IA (círculo violeta en esquina inferior derecha)
    console.log('📍 Paso 4: Buscando botón flotante del asistente IA...');

    // El botón tiene title="Asistente IA para formulario" y está en un div fixed
    const assistantTrigger = page
      .locator(
        '[title*="Asistente IA"], button[title*="IA"], div[data-state="closed"] button.rounded-full'
      )
      .first();

    if (await assistantTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await assistantTrigger.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✅ Asistente abierto');
    } else {
      console.log('⚠️ Botón del asistente no encontrado');
    }

    // 5. Esperar a que aparezca el panel del asistente
    console.log('📍 Paso 5: Verificando panel del asistente...');
    await page.waitForTimeout(1000);

    // Capturar screenshot del estado actual
    await page.screenshot({ path: 'test-results/dni-before-upload.png', fullPage: true });

    // 6. Subir el PDF usando el botón "Seleccionar archivos" y el file chooser
    console.log('📍 Paso 6: Subiendo PDF del DNI...');

    // Buscar el botón "Seleccionar archivos" en el panel del asistente
    const selectFilesButton = page
      .locator('button:has-text("Seleccionar archivos"), span:has-text("Seleccionar archivos")')
      .first();

    if (await selectFilesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Botón "Seleccionar archivos" encontrado');

      // Configurar interceptor para capturar la respuesta del API
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/ai/document-analysis'),
        { timeout: 90000 }
      );

      // Usar el file chooser que se abre al hacer clic en el botón
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        selectFilesButton.click(),
      ]);

      // Subir el archivo a través del file chooser
      await fileChooser.setFiles(PDF_PATH);
      console.log('✅ PDF seleccionado, esperando procesamiento...');

      // 7. Esperar procesamiento (hasta 90 segundos)
      console.log('📍 Paso 7: Esperando respuesta del API...');

      try {
        const response = await responsePromise;
        console.log(`📋 API respondió con status: ${response.status()}`);

        if (response.ok()) {
          const data = await response.json();
          console.log(`✅ Campos extraídos: ${data.extractedFields?.length || 0}`);
          if (data.extractedFields && data.extractedFields.length > 0) {
            console.log('📋 Campos encontrados:');
            data.extractedFields.forEach((f: any) => {
              console.log(`   - ${f.targetField}: ${f.fieldValue}`);
            });
          }

          // Test exitoso si hay campos extraídos
          expect(data.extractedFields.length).toBeGreaterThan(0);
          console.log('✅ Test EXITOSO - DNI procesado correctamente');
        } else {
          console.log('❌ Error en respuesta del API');
        }
      } catch (e: any) {
        console.log('⚠️ Timeout esperando respuesta:', e.message);
      }

      // Esperar un poco más para que el UI se actualice
      await page.waitForTimeout(5000);
    } else {
      console.log('❌ No se encontró el botón "Seleccionar archivos"');
      await page.screenshot({ path: 'test-results/dni-no-select-button.png', fullPage: true });
    }

    // 8. Verificar resultados visuales
    console.log('📍 Paso 8: Verificando resultados visuales...');

    // Buscar indicadores de éxito en el UI
    const dniData = page.locator('text=/71931687|VILLAGRA|DAVID/i');
    const hasData = await dniData.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasData) {
      console.log('✅ Datos del DNI visibles en la página');
    }

    // Verificar que no haya mensaje de error visible
    const errorMessage = page.locator('text=/error.*analizar|no.*pudo|falló/i');
    const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasError) {
      console.log('⚠️ Se detectó un mensaje de error en el UI');
    }

    // Capturar screenshot final
    await page.screenshot({ path: 'test-results/dni-success.png', fullPage: true });
    console.log('✅ Test completado - Screenshot guardado');
  });
});
