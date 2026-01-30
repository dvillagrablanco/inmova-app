/**
 * Test API de Análisis de Documentos IA
 * Verificación directa del endpoint /api/ai/document-analysis
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const PDF_PATH = './test-files/DNI_David_Villagra_.pdf';

const TEST_USER = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

test.describe('API Document Analysis', () => {
  test.setTimeout(120000);

  test('API-001: Debe analizar un PDF de DNI correctamente', async ({ page, context }) => {
    // Primero hacer login para obtener cookies
    console.log('📍 Paso 0: Iniciando sesión...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|admin|inquilinos)/, { timeout: 30000 });
    console.log('✅ Login exitoso');

    // Obtener cookies de la sesión
    const cookies = await context.cookies();
    console.log(`✅ Cookies obtenidas: ${cookies.length}`);

    console.log('📍 Paso 1: Leyendo archivo PDF...');

    // Leer el archivo
    const absolutePath = path.resolve(PDF_PATH);
    const fileBuffer = fs.readFileSync(absolutePath);
    console.log(`✅ Archivo leído: ${fileBuffer.length} bytes`);

    // Crear request autenticado usando el contexto del navegador
    console.log('📍 Paso 2: Enviando al API...');

    // Usar page.evaluate para enviar con fetch (tiene las cookies de sesión)
    // Aumentar timeout ya que el procesamiento de IA tarda ~4-10 segundos
    const response = await page.evaluate(
      async ({ pdfBase64, filename }) => {
        return new Promise((resolve, reject) => {
          // Convertir base64 a Blob
          const byteCharacters = atob(pdfBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          // Crear FormData
          const formData = new FormData();
          formData.append('file', blob, filename);
          formData.append('context', 'inquilinos');

          // Enviar request con timeout largo
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

          fetch('/api/ai/document-analysis', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          })
            .then((res) => {
              clearTimeout(timeoutId);
              return res.json().then((data) => ({
                status: res.status,
                ok: res.ok,
                data,
              }));
            })
            .then(resolve)
            .catch((err) => reject(err.message));
        });
      },
      {
        pdfBase64: fileBuffer.toString('base64'),
        filename: 'DNI_David_Villagra_.pdf',
      }
    );

    console.log(`📋 Status: ${response.status}`);
    console.log('📋 Respuesta:', JSON.stringify(response.data, null, 2).substring(0, 800));

    // Verificar respuesta exitosa
    expect(response.ok).toBeTruthy();

    const data = response.data;

    // Verificar estructura de respuesta
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('classification');
    expect(data).toHaveProperty('extractedFields');

    // Verificar que hay campos extraídos
    expect(Array.isArray(data.extractedFields)).toBeTruthy();
    expect(data.extractedFields.length).toBeGreaterThan(0);

    console.log(`✅ Campos extraídos: ${data.extractedFields.length}`);

    // Verificar campos específicos del DNI
    const fieldNames = data.extractedFields.map((f: any) => f.targetField);
    console.log('📋 Campos encontrados:', fieldNames);

    // Al menos debería tener nombre o dni
    const hasNameOrDni = fieldNames.some((n: string) =>
      ['nombre', 'dni', 'fechaNacimiento'].includes(n)
    );
    expect(hasNameOrDni).toBeTruthy();

    console.log('✅ Test completado exitosamente');
  });
});
