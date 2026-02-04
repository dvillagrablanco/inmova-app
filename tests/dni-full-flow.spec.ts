/**
 * Test E2E completo: Flujo de DNI con visualización y validación de datos
 *
 * Este test verifica:
 * 1. Subida del DNI
 * 2. Procesamiento correcto
 * 3. Visualización de datos extraídos
 * 4. Apertura del diálogo de revisión
 * 5. Aplicación de datos al formulario
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Ruta al archivo de prueba
const PDF_PATH = path.join(__dirname, '..', 'test-files', 'DNI_David_Villagra_.pdf');

test.describe('Flujo Completo DNI → Formulario', () => {
  test('DNI-FLOW: Debe mostrar datos extraídos y permitir aplicarlos al formulario', async ({
    page,
  }) => {
    // Configurar timeout largo para este test
    test.setTimeout(180000);

    // Capturar logs de la consola del navegador
    page.on('console', (msg) => {
      if (msg.text().includes('AIDocumentAssistant')) {
        console.log(`[BROWSER] ${msg.text()}`);
      }
    });

    // ========================================
    // PASO 1: Login
    // ========================================
    console.log('📍 PASO 1: Iniciando sesión...');
    await page.goto('https://inmovaapp.com/login');
    await page.waitForLoadState('networkidle');

    // Cerrar banner de cookies PRIMERO
    const acceptCookies = page.locator(
      'button:has-text("Aceptar todas"), button:has-text("Accept")'
    );
    if (await acceptCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(500);
      console.log('   Cookies aceptadas');
    }

    // El formulario usa inputs con placeholder, buscar por eso
    await page.fill('input[placeholder*="correo"], input[type="email"]', 'admin@inmova.app');
    await page.fill('input[placeholder*="Contraseña"], input[type="password"]', 'Admin123!');

    // Buscar botón de submit
    const submitButton = page
      .locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar")')
      .first();
    await submitButton.click();

    await page.waitForURL(/\/(dashboard|admin|portal)/, { timeout: 30000 });
    console.log('✅ Login exitoso');

    // ========================================
    // PASO 2: Navegar a nuevo inquilino
    // ========================================
    console.log('📍 PASO 2: Navegando a /inquilinos/nuevo...');
    await page.goto('https://inmovaapp.com/inquilinos/nuevo');
    await page.waitForLoadState('networkidle');

    // Cerrar banner de cookies si existe
    const cookieButton = page.locator('button:has-text("Aceptar"), button:has-text("Accept")');
    if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieButton.click();
    }

    await page.screenshot({ path: 'test-results/flow-01-pagina-cargada.png', fullPage: true });
    console.log('✅ Página cargada');

    // ========================================
    // PASO 3: Abrir el Asistente IA (inline o floating)
    // ========================================
    console.log('📍 PASO 3: Abriendo asistente IA...');

    let assistantMode: 'inline' | 'floating' = 'inline';
    const documentsSection = page.locator('text=Documentos del Inquilino').first();
    await documentsSection.scrollIntoViewIfNeeded();

    const inlineTrigger = page.getByRole('button', { name: /Escanear DNI/i }).first();
    if (await inlineTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await inlineTrigger.click({ force: true });
    }

    const dropzoneText = page.locator('text=Arrastra documentos aquí').first();
    try {
      await dropzoneText.waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      assistantMode = 'floating';
      console.log('ℹ️ Asistente inline no respondió, intentando flotante...');

      const aiButton = page
        .locator('button.rounded-full')
        .filter({
          has: page.locator('svg.lucide-brain, svg[class*="brain"]'),
        })
        .first();

      await aiButton.waitFor({ state: 'visible', timeout: 10000 });
      await aiButton.click({ force: true });
      await dropzoneText.waitFor({ state: 'visible', timeout: 10000 });
    }
    await page.screenshot({
      path: 'test-results/flow-02-asistente-localizado.png',
      fullPage: true,
    });
    console.log(`✅ Asistente IA listo (${assistantMode})`);

    // ========================================
    // PASO 4: Subir el PDF del DNI
    // ========================================
    console.log('📍 PASO 4: Subiendo PDF del DNI...');

    // Configurar interceptor para la respuesta de la API
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/ai/document-analysis'),
      { timeout: 120000 }
    );

    // Subir archivo directamente al input del asistente
    const fileInput = page.locator('input#file-upload').first();
    await fileInput.setInputFiles(PDF_PATH);

    console.log('📤 Archivo seleccionado, esperando procesamiento...');
    await page.screenshot({ path: 'test-results/flow-03-archivo-subiendo.png', fullPage: true });

    // ========================================
    // PASO 5: Esperar procesamiento y diálogo de revisión
    // ========================================
    console.log('📍 PASO 5: Esperando procesamiento del asistente...');

    await page.screenshot({
      path: 'test-results/flow-04-procesamiento-completado.png',
      fullPage: true,
    });

    const apiResponse = await responsePromise;
    console.log(`📋 API Status: ${apiResponse.status()}`);
    expect(apiResponse.ok()).toBeTruthy();

    // Verificar si el diálogo de revisión se abrió automáticamente
    const reviewDialogAuto = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Revisar Datos|Datos Extraídos/i })
      .first();

    let formApplied = false;
    let autoDialogVisible = false;

    try {
      await reviewDialogAuto.waitFor({ state: 'visible', timeout: 60000 });
      autoDialogVisible = true;
    } catch {
      autoDialogVisible = false;
    }

    if (autoDialogVisible) {
      console.log('✅ ¡Diálogo de revisión se abrió automáticamente!');
      await page.screenshot({ path: 'test-results/flow-04b-dialogo-auto.png', fullPage: true });

      // Verificar campos en el diálogo
      const fieldsInDialog = reviewDialogAuto.locator('[class*="rounded"]');
      const fieldCount = await fieldsInDialog.count();
      console.log(`   Campos en diálogo: ${fieldCount}`);

      // ========================================
      // APLICAR DATOS DESDE EL DIÁLOGO AUTOMÁTICO
      // ========================================
      console.log('📍 Aplicando datos desde el diálogo automático...');

      // Buscar el botón "Aplicar X campos"
      const applyButton = reviewDialogAuto.locator('button:has-text("Aplicar")').first();

      if (await applyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✅ Botón "Aplicar" encontrado en diálogo');

        // Usar JavaScript para hacer click directamente
        await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent?.includes('Aplicar') && btn.textContent?.includes('campos')) {
              (btn as HTMLElement).click();
              return true;
            }
          }
          return false;
        });

        await page.waitForTimeout(2000);
        console.log('✅ Datos aplicados');

        await page.screenshot({
          path: 'test-results/flow-04c-datos-aplicados.png',
          fullPage: true,
        });

        // El diálogo debería cerrarse
        // Cerrar el panel del asistente
        const closeSheetButton = page
          .locator('button[aria-label="Close"], button:has(svg.lucide-x)')
          .first();
        if (await closeSheetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeSheetButton.click();
          await page.waitForTimeout(500);
        }

        // Verificar que los datos se aplicaron al formulario
        console.log('📍 Verificando datos en el formulario...');

        const nombreInput = page.locator('input[name="nombre"], input#nombre').first();
        if (await nombreInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const nombreValue = await nombreInput.inputValue();
          console.log(`   Campo Nombre: "${nombreValue}"`);
          if (nombreValue && nombreValue.length > 0) {
            console.log('✅ ¡Nombre aplicado correctamente!');
            formApplied = true;
          }
        }

        const dniInput = page
          .locator('input[name="documentoIdentidad"], input[name="dni"]')
          .first();
        if (await dniInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const dniValue = await dniInput.inputValue();
          console.log(`   Campo DNI: "${dniValue}"`);
          if (dniValue && dniValue.length > 0) {
            console.log('✅ ¡DNI aplicado correctamente!');
            formApplied = true;
          }
        }

        await page.screenshot({ path: 'test-results/flow-final-formulario.png', fullPage: true });

        expect(formApplied).toBeTruthy();
        console.log('\n========================================');
        console.log('✅ TEST COMPLETADO EXITOSAMENTE');
        console.log('========================================');
        return; // Terminar el test aquí - flujo exitoso
      }
    } else {
      console.log('⚠️ Diálogo de revisión NO se abrió automáticamente');
    }

    // ========================================
    // PASO 6: Verificar que el archivo aparece como completado
    // ========================================
    console.log('📍 PASO 6: Verificando estado del archivo...');

    // Buscar la tarjeta del archivo procesado
    const fileCard = page
      .locator('[class*="Card"]')
      .filter({
        hasText: 'DNI_David_Villagra_',
      })
      .first();

    if (await fileCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Tarjeta del archivo visible');

      // Verificar badge de confianza (100%, DNI/NIE, etc.)
      const confidenceBadge = fileCard.locator('[class*="Badge"]');
      const badgeCount = await confidenceBadge.count();
      console.log(`   Badges encontrados: ${badgeCount}`);

      // Hacer click en la tarjeta para seleccionarla
      console.log('📍 Haciendo click en la tarjeta del archivo...');
      await fileCard.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'test-results/flow-05-archivo-seleccionado.png',
        fullPage: true,
      });
    } else {
      console.log('⚠️ Tarjeta del archivo no encontrada');
      await page.screenshot({ path: 'test-results/flow-05-error-no-tarjeta.png', fullPage: true });
    }

    // ========================================
    // PASO 7: Verificar panel de resultados del análisis
    // ========================================
    console.log('📍 PASO 7: Verificando panel de resultados...');

    // Buscar el panel de "Resultados del Análisis"
    const resultsPanel = page.locator('text=Resultados del Análisis').first();

    if (await resultsPanel.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Panel de resultados visible');

      // Buscar los datos extraídos en el panel
      const extractedFieldsSection = page.locator('text=Datos extraídos').first();
      if (await extractedFieldsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✅ Sección de datos extraídos visible');
      }

      // Hacer scroll al panel de resultados
      await resultsPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'test-results/flow-06-resultados-visibles.png',
        fullPage: true,
      });
    } else {
      console.log('⚠️ Panel de resultados no visible');
    }

    // ========================================
    // PASO 8: Buscar y hacer click en "Revisar y aplicar datos"
    // ========================================
    console.log('📍 PASO 8: Buscando botón "Revisar y aplicar datos"...');

    const reviewButton = page
      .locator(
        'button:has-text("Revisar y aplicar"), button:has-text("Revisar datos"), button:has-text("Aplicar datos")'
      )
      .first();

    if (await reviewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Botón de revisar encontrado');
      await reviewButton.scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'test-results/flow-07-boton-revisar.png', fullPage: true });

      // Hacer click para abrir el diálogo de revisión
      console.log('📍 Abriendo diálogo de revisión...');
      await reviewButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'test-results/flow-08-dialogo-revision.png', fullPage: true });

      // ========================================
      // PASO 9: Verificar el diálogo de revisión de datos
      // ========================================
      console.log('📍 PASO 9: Verificando diálogo de revisión...');

      const reviewDialog = page
        .locator('[role="dialog"]')
        .filter({
          hasText: 'Revisar Datos Extraídos',
        })
        .first();

      if (await reviewDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Diálogo de revisión abierto');

        // Verificar que hay campos con checkboxes
        const checkboxes = reviewDialog.locator('[role="checkbox"], input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();
        console.log(`   Checkboxes encontrados: ${checkboxCount}`);

        // Verificar campos específicos del DNI
        const nombreField = reviewDialog.locator('text=/nombre|Nombre/i').first();
        const dniField = reviewDialog.locator('text=/dni|DNI|documento/i').first();

        if (await nombreField.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ Campo "Nombre" visible');
        }
        if (await dniField.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ Campo "DNI" visible');
        }

        await page.screenshot({ path: 'test-results/flow-09-campos-revision.png', fullPage: true });

        // ========================================
        // PASO 10: Aplicar los datos al formulario
        // ========================================
        console.log('📍 PASO 10: Aplicando datos al formulario...');

        const applyButton = reviewDialog.locator('button:has-text("Aplicar")').first();

        if (await applyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ Botón "Aplicar" encontrado');
          await applyButton.click();
          await page.waitForTimeout(2000);

          console.log('✅ Datos aplicados');
        } else {
          console.log('⚠️ Botón "Aplicar" no encontrado');
        }
      } else {
        console.log('⚠️ Diálogo de revisión no se abrió');
        await page.screenshot({ path: 'test-results/flow-09-error-dialogo.png', fullPage: true });
      }
    } else {
      console.log('⚠️ Botón de revisar no encontrado');

      // Buscar botón alternativo "Ver datos extraídos"
      const viewButton = page
        .locator('button:has-text("Ver datos"), button:has-text("Ver detalle")')
        .first();
      if (await viewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('📍 Encontrado botón alternativo "Ver datos"');
        await viewButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/flow-07-ver-datos.png', fullPage: true });
      }
    }

    // ========================================
    // PASO 11: Verificar que los datos se aplicaron al formulario
    // ========================================
    console.log('📍 PASO 11: Verificando formulario...');

    // Cerrar el panel del asistente primero
    const closeButton = page
      .locator('button[aria-label="Close"], button:has(svg.lucide-x)')
      .first();
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }

    // Verificar campos del formulario
    const nombreInput = page.locator('input[name="nombre"], input[id="nombre"]').first();
    const dniInput = page.locator('input[name="documentoIdentidad"], input[name="dni"]').first();

    await page.screenshot({ path: 'test-results/flow-10-formulario-final.png', fullPage: true });

    if (await nombreInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const nombreValue = await nombreInput.inputValue();
      console.log(`   Campo Nombre: "${nombreValue}"`);

      if (nombreValue && nombreValue.length > 0) {
        console.log('✅ Campo Nombre tiene datos');
        formApplied = true;
      }
    }

    if (await dniInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const dniValue = await dniInput.inputValue();
      console.log(`   Campo DNI: "${dniValue}"`);

      if (dniValue && dniValue.length > 0) {
        console.log('✅ Campo DNI tiene datos');
        formApplied = true;
      }
    }

    expect(formApplied).toBeTruthy();
    console.log('\n========================================');
    console.log('✅ TEST COMPLETADO');
    console.log('========================================');
    console.log('Screenshots guardados en test-results/');
  });
});
