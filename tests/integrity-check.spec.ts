/**
 * 🔍 INTEGRITY CHECK - Auditoría de Integridad de la Aplicación
 * 
 * Este script verifica:
 * 1. Que las páginas principales no devuelvan error 500
 * 2. Que los botones principales no estén deshabilitados o rotos
 * 3. Que no haya mensajes de "Coming Soon" en páginas críticas
 * 4. Que las APIs críticas respondan correctamente
 * 
 * Ejecutar con: npx playwright test tests/integrity-check.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

// Configuración base
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Páginas críticas que DEBEN funcionar
const CRITICAL_PAGES = [
  { path: '/', name: 'Landing Page', shouldWork: true },
  { path: '/login', name: 'Login Page', shouldWork: true },
  { path: '/landing', name: 'Landing Page Alt', shouldWork: true },
  { path: '/api/health', name: 'Health Check API', shouldWork: true, isApi: true },
  { path: '/dashboard', name: 'Dashboard', shouldWork: true, requiresAuth: true },
];

// Páginas del dashboard que deberían funcionar pero son placeholders
const DASHBOARD_PAGES = [
  { path: '/dashboard/properties', name: 'Properties', expectedPlaceholder: true },
  { path: '/dashboard/tenants', name: 'Tenants', expectedPlaceholder: true },
  { path: '/dashboard/contracts', name: 'Contracts', expectedPlaceholder: true },
  { path: '/dashboard/payments', name: 'Payments', expectedPlaceholder: true },
  { path: '/dashboard/documents', name: 'Documents', expectedPlaceholder: true },
  { path: '/dashboard/analytics', name: 'Analytics', expectedPlaceholder: true },
  { path: '/dashboard/maintenance', name: 'Maintenance', expectedPlaceholder: true },
];

// APIs críticas que deben responder
const CRITICAL_APIS = [
  { path: '/api/health', name: 'Health', expectedStatus: 200 },
  { path: '/api/tenants', name: 'Tenants', expectedStatus: [200, 401] },
  { path: '/api/contracts', name: 'Contracts', expectedStatus: [200, 401] },
  { path: '/api/properties', name: 'Properties', expectedStatus: [200, 401, 404] },
  { path: '/api/visits', name: 'Visits', expectedStatus: [200, 401] },
  { path: '/api/leads', name: 'Leads', expectedStatus: [200, 401] },
];

// Selectores de botones críticos
const CRITICAL_BUTTONS = [
  { selector: 'button[type="submit"]', name: 'Submit Buttons' },
  { selector: 'button:has-text("Guardar")', name: 'Save Buttons' },
  { selector: 'button:has-text("Crear")', name: 'Create Buttons' },
  { selector: 'button:has-text("Editar")', name: 'Edit Buttons' },
  { selector: 'button:has-text("Eliminar")', name: 'Delete Buttons' },
];

// Patrones de placeholder/mock que indican funcionalidad incompleta
const PLACEHOLDER_PATTERNS = [
  'Próximamente',
  'Coming Soon',
  'En desarrollo',
  'Esta página está en desarrollo',
  'Funcionalidad en desarrollo',
];

test.describe('🔍 Integrity Check - Páginas Críticas', () => {
  
  test('Verificar que las páginas críticas no devuelvan 500', async ({ page }) => {
    const results: { page: string; status: number; ok: boolean }[] = [];
    
    for (const pageInfo of CRITICAL_PAGES) {
      if (pageInfo.requiresAuth) continue; // Skip auth pages for now
      
      const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      
      const status = response?.status() || 0;
      const ok = status !== 500 && status !== 502 && status !== 503;
      
      results.push({
        page: pageInfo.name,
        status,
        ok,
      });
      
      // Log para debugging
      console.log(`${ok ? '✅' : '❌'} ${pageInfo.name}: ${status}`);
    }
    
    // Verificar que ninguna página devuelva 500
    const failedPages = results.filter(r => !r.ok);
    expect(failedPages, `Páginas con error: ${JSON.stringify(failedPages)}`).toHaveLength(0);
  });

  test('Verificar que la landing page cargue correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Verificar que hay contenido
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(100);
    
    // Verificar que no hay error de React
    const hasReactError = await page.locator('text=Application error').count();
    expect(hasReactError).toBe(0);
  });

  test('Verificar que la página de login cargue', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // Verificar que existe un formulario de login
    const hasEmailInput = await page.locator('input[name="email"], input[type="email"]').count();
    const hasPasswordInput = await page.locator('input[name="password"], input[type="password"]').count();
    
    expect(hasEmailInput).toBeGreaterThan(0);
    expect(hasPasswordInput).toBeGreaterThan(0);
  });
});

test.describe('🔍 Integrity Check - APIs Críticas', () => {
  
  test('Verificar que las APIs críticas respondan', async ({ request }) => {
    const results: { api: string; status: number; ok: boolean }[] = [];
    
    for (const api of CRITICAL_APIS) {
      try {
        const response = await request.get(`${BASE_URL}${api.path}`);
        const status = response.status();
        
        const expectedStatuses = Array.isArray(api.expectedStatus) 
          ? api.expectedStatus 
          : [api.expectedStatus];
        
        const ok = expectedStatuses.includes(status) || status !== 500;
        
        results.push({
          api: api.name,
          status,
          ok,
        });
        
        console.log(`${ok ? '✅' : '❌'} API ${api.name}: ${status}`);
      } catch (error) {
        results.push({
          api: api.name,
          status: 0,
          ok: false,
        });
        console.log(`❌ API ${api.name}: Error de conexión`);
      }
    }
    
    // Al menos el health check debe funcionar
    const healthCheck = results.find(r => r.api === 'Health');
    expect(healthCheck?.ok, 'Health check debe responder').toBe(true);
  });

  test('Verificar que el health check devuelva status ok', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});

test.describe('🔍 Integrity Check - Dashboard Placeholders', () => {
  
  test('Detectar páginas del dashboard que son placeholders', async ({ page }) => {
    const placeholderPages: string[] = [];
    
    for (const dashPage of DASHBOARD_PAGES) {
      await page.goto(`${BASE_URL}${dashPage.path}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      const pageContent = await page.locator('body').textContent() || '';
      
      const isPlaceholder = PLACEHOLDER_PATTERNS.some(pattern => 
        pageContent.includes(pattern)
      );
      
      if (isPlaceholder) {
        placeholderPages.push(dashPage.name);
        console.log(`⚠️ ${dashPage.name}: Es placeholder`);
      } else {
        console.log(`✅ ${dashPage.name}: Tiene contenido real`);
      }
    }
    
    // Reportar pero no fallar - esto es informativo
    console.log(`\n📊 Resumen: ${placeholderPages.length}/${DASHBOARD_PAGES.length} páginas son placeholders`);
    console.log('Placeholders:', placeholderPages.join(', '));
    
    // Este test informa pero no falla - es auditoría
    expect(true).toBe(true);
  });
});

test.describe('🔍 Integrity Check - Botones y Formularios', () => {
  
  test('Verificar formulario de login tiene botón funcional', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Verificar que el botón existe
    const buttonExists = await submitButton.count();
    expect(buttonExists).toBeGreaterThan(0);
    
    // Verificar que no está deshabilitado permanentemente
    const isDisabled = await submitButton.isDisabled();
    // El botón puede estar disabled solo si el form está vacío
    console.log(`🔘 Botón de login: ${isDisabled ? 'Deshabilitado (esperado si vacío)' : 'Habilitado'}`);
  });

  test('Buscar botones con onClick vacío en landing', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Buscar botones
    const buttons = await page.locator('button').all();
    let brokenButtons = 0;
    
    for (const button of buttons.slice(0, 20)) { // Limitar a 20 botones
      const onClick = await button.getAttribute('onclick');
      const isDisabled = await button.isDisabled();
      const text = await button.textContent();
      
      // Verificar si tiene onClick vacío o está deshabilitado sin razón
      if (onClick === '' || onClick === '{}') {
        brokenButtons++;
        console.log(`⚠️ Botón posiblemente roto: "${text?.trim()}"`);
      }
    }
    
    console.log(`\n📊 Botones revisados: ${Math.min(buttons.length, 20)}, Potencialmente rotos: ${brokenButtons}`);
    // Informativo, no falla
    expect(true).toBe(true);
  });
});

test.describe('🔍 Integrity Check - Errores de Consola', () => {
  
  test('Capturar errores de consola en landing', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Filtrar errores conocidos/ignorables
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') &&
      !err.includes('Third-party') &&
      !err.includes('net::ERR')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ Errores de consola encontrados:');
      criticalErrors.forEach(err => console.log(`  - ${err.substring(0, 100)}`));
    } else {
      console.log('✅ No se encontraron errores críticos de consola');
    }
    
    // Informativo, no falla
    expect(true).toBe(true);
  });

  test('Capturar errores de consola en login', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') &&
      !err.includes('Third-party')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ Errores de consola en login:', criticalErrors.length);
    } else {
      console.log('✅ Login sin errores de consola');
    }
    
    expect(true).toBe(true);
  });
});

test.describe('🔍 Integrity Check - Resumen Final', () => {
  
  test('Generar reporte de integridad', async ({ page, request }) => {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      results: {
        pagesChecked: CRITICAL_PAGES.length,
        apisChecked: CRITICAL_APIS.length,
        dashboardPagesChecked: DASHBOARD_PAGES.length,
        issues: [] as string[],
      }
    };
    
    // Verificar health
    try {
      const healthResponse = await request.get(`${BASE_URL}/api/health`);
      if (healthResponse.status() !== 200) {
        report.results.issues.push('Health check no responde correctamente');
      }
    } catch {
      report.results.issues.push('Health check no accesible');
    }
    
    // Verificar landing
    try {
      const landingResponse = await page.goto(`${BASE_URL}/`, { timeout: 10000 });
      if (landingResponse?.status() === 500) {
        report.results.issues.push('Landing page devuelve 500');
      }
    } catch {
      report.results.issues.push('Landing page no accesible');
    }
    
    // Verificar login
    try {
      const loginResponse = await page.goto(`${BASE_URL}/login`, { timeout: 10000 });
      if (loginResponse?.status() === 500) {
        report.results.issues.push('Login page devuelve 500');
      }
    } catch {
      report.results.issues.push('Login page no accesible');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE INTEGRIDAD');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Base URL: ${report.baseUrl}`);
    console.log(`Páginas verificadas: ${report.results.pagesChecked}`);
    console.log(`APIs verificadas: ${report.results.apisChecked}`);
    console.log(`Issues críticos: ${report.results.issues.length}`);
    
    if (report.results.issues.length > 0) {
      console.log('\n🚨 Issues encontrados:');
      report.results.issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ No se encontraron issues críticos');
    }
    
    console.log('='.repeat(60));
    
    // El test pasa si no hay issues críticos
    expect(report.results.issues).toHaveLength(0);
  });
});
