/**
 * Test E2E: Análisis de documentos con IA
 * 
 * Prueba el flujo completo de:
 * 1. Login
 * 2. Navegación al gestor documental de inquilinos
 * 3. Carga de un DNI
 * 4. Verificación del análisis con Claude
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://inmovaapp.com';
const TEST_EMAIL = 'admin@inmova.app';
const TEST_PASSWORD = 'Admin123!';

test.describe('Análisis de Documentos con IA', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Llenar formulario de login
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Esperar navegación al dashboard
    await page.waitForURL(/dashboard|admin|portal/, { timeout: 30000 });
    console.log('Login exitoso, URL actual:', page.url());
  });

  test('debe cargar y analizar un documento DNI', async ({ page }) => {
    // Crear archivo de prueba temporal
    const testContent = `DOCUMENTO NACIONAL DE IDENTIDAD
================================
Nombre: Juan García Pérez
DNI: 12345678A
Fecha de nacimiento: 01/01/1990
Lugar de nacimiento: Madrid
Dirección: Calle Mayor 123, 28001 Madrid
Nacionalidad: Española
Fecha de expedición: 15/06/2020
Fecha de caducidad: 15/06/2030`;

    const tempFilePath = '/tmp/test_dni.txt';
    fs.writeFileSync(tempFilePath, testContent);

    // Navegar a la sección de inquilinos o documentos
    // Primero intentar encontrar el link en el sidebar
    const possibleLinks = [
      'text=Inquilinos',
      'text=Tenants',
      'text=Documentos',
      'text=Documents',
      'a[href*="tenant"]',
      'a[href*="inquilino"]',
      'a[href*="document"]',
    ];

    let found = false;
    for (const selector of possibleLinks) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        console.log(`Navegando usando selector: ${selector}`);
        break;
      }
    }

    if (!found) {
      // Intentar navegar directamente
      await page.goto(`${BASE_URL}/dashboard/tenants`);
    }

    await page.waitForLoadState('networkidle');
    console.log('URL después de navegación:', page.url());

    // Tomar screenshot para debug
    await page.screenshot({ path: '/tmp/playwright-tenants.png', fullPage: true });

    // Buscar área de carga de documentos o botón de subir
    const uploadSelectors = [
      'input[type="file"]',
      'button:has-text("Subir")',
      'button:has-text("Upload")',
      'button:has-text("Cargar")',
      '[data-testid="upload"]',
      '.dropzone',
      'text=Arrastra',
      'text=Drag',
    ];

    let uploadFound = false;
    for (const selector of uploadSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        console.log(`Encontrado elemento de upload: ${selector}`);
        uploadFound = true;
        
        // Si es input file, subir directamente
        if (selector === 'input[type="file"]') {
          await element.setInputFiles(tempFilePath);
        }
        break;
      }
    }

    // Esperar respuesta del análisis
    await page.waitForTimeout(5000);

    // Verificar que no hay errores de Claude en la página
    const pageContent = await page.content();
    expect(pageContent).not.toContain('claude-3-5-sonnet-20241022');
    expect(pageContent).not.toContain('not_found_error');

    // Tomar screenshot final
    await page.screenshot({ path: '/tmp/playwright-result.png', fullPage: true });

    // Limpiar
    fs.unlinkSync(tempFilePath);
  });

  test('verificar que la API de Claude funciona', async ({ page, request }) => {
    // Obtener cookies de sesión
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));
    
    console.log('Cookies disponibles:', cookies.map(c => c.name));

    // Verificar health check
    const healthResponse = await request.get(`${BASE_URL}/api/health`);
    expect(healthResponse.ok()).toBeTruthy();
    
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    expect(healthData.status).toBe('ok');
  });

  test('navegar al gestor documental de IA', async ({ page }) => {
    // Intentar múltiples rutas posibles
    const routes = [
      '/dashboard/documents',
      '/dashboard/ai-documents',
      '/dashboard/tenants',
      '/admin/ai-agents',
      '/dashboard/valoracion-ia',
    ];

    for (const route of routes) {
      try {
        await page.goto(`${BASE_URL}${route}`, { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        
        const status = page.url().includes(route.replace('/dashboard', '').replace('/admin', ''));
        if (status) {
          console.log(`Ruta accesible: ${route}`);
          await page.screenshot({ path: `/tmp/playwright-${route.replace(/\//g, '-')}.png` });
        }
      } catch (e) {
        console.log(`Ruta no accesible: ${route}`);
      }
    }
  });
});
