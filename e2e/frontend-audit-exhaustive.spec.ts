/**
 * 🎭 AUDITORÍA FRONTEND EXHAUSTIVA - TODAS LAS RUTAS
 * 
 * Test completo que audita las 233 rutas de la aplicación
 * 
 * Características:
 * - Login automático como superadmin
 * - Audita TODAS las páginas de la app
 * - Detecta 5 tipos de errores
 * - Genera reporte HTML interactivo
 * - Paralelizable por categorías
 * - Screenshots automáticos
 * 
 * Uso:
 *   # Todas las rutas
 *   yarn playwright test e2e/frontend-audit-exhaustive.spec.ts
 * 
 *   # Solo alta prioridad (6 rutas)
 *   yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --grep "@high-priority"
 * 
 *   # Por categoría
 *   yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --grep "@admin"
 */

import { test, expect, Page } from '@playwright/test';
import { ALL_ROUTES, ROUTES_BY_PRIORITY, RouteConfig } from './routes-config';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SUPERADMIN_EMAIL = 'superadmin@inmova.com';
const SUPERADMIN_PASSWORD = 'superadmin123';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const REPORT_DIR = path.join(process.cwd(), 'frontend-audit-exhaustive-report');
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');

// Configuración de test
const TEST_CONFIG = {
  // Timeout por página (aumentado para servidor remoto)
  pageTimeout: 60000,
  // Espera después de cargar página
  stabilizationTime: 1000,
  // Screenshots
  captureScreenshots: false, // Desactivado para velocidad
  // Modo de ejecución
  mode: process.env.AUDIT_MODE || 'all', // 'all' | 'high' | 'medium'
};

// ============================================================================
// TIPOS
// ============================================================================

interface ErrorReport {
  route: string;
  url: string;
  category: string;
  priority: string;
  consoleErrors: Array<{ type: string; message: string }>;
  networkErrors: Array<{ url: string; status: number }>;
  hydrationErrors: boolean;
  accessibilityIssues: string[];
  missingElements: string[];
  brokenImages: string[];
  loadTime?: number;
  screenshot?: string;
  status: 'ok' | 'warning' | 'error' | 'skipped';
}

const allReports: ErrorReport[] = [];

// ============================================================================
// HELPERS
// ============================================================================

function setupReportDirectories() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

function setupConsoleListeners(page: Page, errors: Array<{ type: string; message: string }>) {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      errors.push({
        type,
        message: msg.text(),
      });
    }
  });

  page.on('pageerror', (error) => {
    errors.push({
      type: 'pageerror',
      message: error.message,
    });
  });
}

function setupNetworkListeners(
  page: Page,
  errors: Array<{ url: string; status: number }>
) {
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400 && !response.url().includes('_next/static')) {
      errors.push({
        url: response.url(),
        status,
      });
    }
  });
}

async function detectHydrationErrors(page: Page): Promise<boolean> {
  const pageContent = await page.content();
  const hydrationPatterns = [
    'Hydration failed',
    'hydration mismatch',
    'server HTML',
    'client-side exception',
    'Text content does not match',
  ];
  return hydrationPatterns.some((pattern) =>
    pageContent.toLowerCase().includes(pattern.toLowerCase())
  );
}

async function checkBasicAccessibility(page: Page): Promise<string[]> {
  const issues: string[] = [];

  try {
    // 1. H1
    const h1Count = await page.locator('h1').count();
    if (h1Count === 0) {
      issues.push('No se encontró ningún elemento <h1>');
    } else if (h1Count > 1) {
      issues.push(`Múltiples <h1> encontrados: ${h1Count}`);
    }

    // 2. Imágenes sin alt
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} imágenes sin atributo alt`);
    }

    // 3. Enlaces sin texto
    const emptyLinks = await page.locator('a:not([aria-label]):empty').count();
    if (emptyLinks > 0) {
      issues.push(`${emptyLinks} enlaces sin texto`);
    }
  } catch (error) {
    // Ignorar errores de accessibility check
  }

  return issues;
}

async function checkBrokenImages(page: Page): Promise<string[]> {
  const brokenImages: string[] = [];
  
  try {
    const images = await page.locator('img').all();
    for (const img of images.slice(0, 20)) { // Limitar a 20 para performance
      const src = await img.getAttribute('src');
      if (!src) continue;
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      if (naturalWidth === 0) {
        brokenImages.push(src);
      }
    }
  } catch (error) {
    // Ignorar errores
  }

  return brokenImages;
}

function generateHTMLReport(reports: ErrorReport[]) {
  const timestamp = new Date().toISOString();
  const okCount = reports.filter(r => r.status === 'ok').length;
  const warningCount = reports.filter(r => r.status === 'warning').length;
  const errorCount = reports.filter(r => r.status === 'error').length;
  const skippedCount = reports.filter(r => r.status === 'skipped').length;
  
  // Agrupar por categoría
  const byCategory: Record<string, ErrorReport[]> = {};
  reports.forEach(r => {
    if (!byCategory[r.category]) {
      byCategory[r.category] = [];
    }
    byCategory[r.category].push(r);
  });
  
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auditoría Frontend Exhaustiva - Inmova App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 {
      color: #1a1a1a;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .meta {
      color: #6b7280;
      margin-bottom: 30px;
      font-size: 0.95em;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid #3b82f6;
    }
    .summary-card.ok { border-left-color: #10b981; }
    .summary-card.warning { border-left-color: #f59e0b; }
    .summary-card.error { border-left-color: #ef4444; }
    .summary-card.skipped { border-left-color: #9ca3af; }
    .summary-value {
      font-size: 3em;
      font-weight: bold;
      line-height: 1;
      margin-bottom: 8px;
    }
    .summary-label {
      color: #6b7280;
      font-size: 0.95em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .filters {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .filters h3 {
      margin-bottom: 15px;
      color: #374151;
    }
    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .filter-btn {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover { background: #f3f4f6; }
    .filter-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .category-section {
      background: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
    }
    .category-title {
      font-size: 1.5em;
      color: #1a1a1a;
    }
    .category-stats {
      font-size: 0.9em;
      color: #6b7280;
    }
    .routes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 15px;
    }
    .route-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      transition: all 0.2s;
    }
    .route-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    .route-card.ok { border-left: 4px solid #10b981; }
    .route-card.warning { border-left: 4px solid #f59e0b; }
    .route-card.error { border-left: 4px solid #ef4444; }
    .route-card.skipped { border-left: 4px solid #9ca3af; }
    .route-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }
    .route-name {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 1.05em;
    }
    .route-url {
      color: #6b7280;
      font-size: 0.85em;
      font-family: monospace;
      margin-bottom: 10px;
    }
    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-ok { background: #d1fae5; color: #065f46; }
    .status-warning { background: #fef3c7; color: #92400e; }
    .status-error { background: #fee2e2; color: #991b1b; }
    .status-skipped { background: #f3f4f6; color: #4b5563; }
    .issue-list {
      font-size: 0.9em;
      color: #4b5563;
      margin-top: 10px;
    }
    .issue-item {
      padding: 6px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .issue-type {
      font-weight: 600;
      color: #dc2626;
      margin-right: 8px;
    }
    .timestamp {
      text-align: center;
      color: #9ca3af;
      padding: 30px 0;
      font-size: 0.9em;
    }
  </style>
  <script>
    function filterByStatus(status) {
      const cards = document.querySelectorAll('.route-card');
      const buttons = document.querySelectorAll('.filter-btn');
      
      buttons.forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      if (status === 'all') {
        cards.forEach(card => card.style.display = 'block');
      } else {
        cards.forEach(card => {
          card.style.display = card.classList.contains(status) ? 'block' : 'none';
        });
      }
    }
  </script>
</head>
<body>
  <div class="container">
    <h1>🎭 Auditoría Frontend Exhaustiva</h1>
    <div class="meta">
      Generado: ${timestamp}<br>
      Total de rutas: ${reports.length}
    </div>
    
    <div class="summary-grid">
      <div class="summary-card ok">
        <div class="summary-value">${okCount}</div>
        <div class="summary-label">✅ Sin Errores</div>
      </div>
      <div class="summary-card warning">
        <div class="summary-value">${warningCount}</div>
        <div class="summary-label">⚠️ Warnings</div>
      </div>
      <div class="summary-card error">
        <div class="summary-value">${errorCount}</div>
        <div class="summary-label">❌ Errores</div>
      </div>
      <div class="summary-card skipped">
        <div class="summary-value">${skippedCount}</div>
        <div class="summary-label">⏭️ Omitidos</div>
      </div>
    </div>
    
    <div class="filters">
      <h3>Filtrar por Estado</h3>
      <div class="filter-buttons">
        <button class="filter-btn active" onclick="filterByStatus('all')">Todos (${reports.length})</button>
        <button class="filter-btn" onclick="filterByStatus('ok')">✅ OK (${okCount})</button>
        <button class="filter-btn" onclick="filterByStatus('warning')">⚠️ Warnings (${warningCount})</button>
        <button class="filter-btn" onclick="filterByStatus('error')">❌ Errores (${errorCount})</button>
        <button class="filter-btn" onclick="filterByStatus('skipped')">⏭️ Omitidos (${skippedCount})</button>
      </div>
    </div>
`;

  // Generar secciones por categoría
  Object.entries(byCategory).forEach(([category, routes]) => {
    const categoryOk = routes.filter(r => r.status === 'ok').length;
    const categoryWarning = routes.filter(r => r.status === 'warning').length;
    const categoryError = routes.filter(r => r.status === 'error').length;
    
    html += `
    <div class="category-section">
      <div class="category-header">
        <div class="category-title">${category.replace(/_/g, ' ').toUpperCase()}</div>
        <div class="category-stats">
          ${routes.length} rutas | 
          ✅ ${categoryOk} | 
          ⚠️ ${categoryWarning} | 
          ❌ ${categoryError}
        </div>
      </div>
      <div class="routes-grid">
`;
    
    routes.forEach(report => {
      const hasIssues = report.consoleErrors.length > 0 || 
                       report.networkErrors.length > 0 || 
                       report.accessibilityIssues.length > 0 ||
                       report.brokenImages.length > 0;
      
      html += `
        <div class="route-card ${report.status}">
          <div class="route-header">
            <div>
              <div class="route-name">${report.route}</div>
              <div class="route-url">${report.url}</div>
            </div>
            <span class="status-badge status-${report.status}">
              ${report.status === 'ok' ? '✅ OK' : 
                report.status === 'warning' ? '⚠️ Warning' : 
                report.status === 'error' ? '❌ Error' : '⏭️ Skipped'}
            </span>
          </div>
`;
      
      if (hasIssues) {
        html += `<div class="issue-list">`;
        
        if (report.consoleErrors.length > 0) {
          html += `<div class="issue-item">
            <span class="issue-type">Console:</span>${report.consoleErrors.length} errores
          </div>`;
        }
        
        if (report.networkErrors.length > 0) {
          html += `<div class="issue-item">
            <span class="issue-type">Red:</span>${report.networkErrors.length} errores
          </div>`;
        }
        
        if (report.accessibilityIssues.length > 0) {
          html += `<div class="issue-item">
            <span class="issue-type">A11y:</span>${report.accessibilityIssues.length} issues
          </div>`;
        }
        
        if (report.brokenImages.length > 0) {
          html += `<div class="issue-item">
            <span class="issue-type">Imágenes:</span>${report.brokenImages.length} rotas
          </div>`;
        }
        
        html += `</div>`;
      }
      
      html += `
        </div>
`;
    });
    
    html += `
      </div>
    </div>
`;
  });

  html += `
    <div class="timestamp">
      Reporte generado el ${new Date().toLocaleString('es-ES')}
    </div>
  </div>
</body>
</html>
`;

  fs.writeFileSync(path.join(REPORT_DIR, 'index.html'), html);
  console.log(`\n📄 Reporte HTML generado en: ${path.join(REPORT_DIR, 'index.html')}`);
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('🎭 Auditoría Frontend Exhaustiva', () => {
  test.beforeAll(() => {
    setupReportDirectories();
  });

  // Filtrar rutas según modo
  let routesToTest = ALL_ROUTES;
  if (TEST_CONFIG.mode === 'high') {
    routesToTest = ROUTES_BY_PRIORITY.high;
  } else if (TEST_CONFIG.mode === 'medium') {
    routesToTest = [...ROUTES_BY_PRIORITY.high, ...ROUTES_BY_PRIORITY.medium];
  }

  test(`Login como superadmin @auth`, async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { 
      waitUntil: 'domcontentloaded',
      timeout: TEST_CONFIG.pageTimeout 
    });
    
    await page.fill('input[type="email"]', SUPERADMIN_EMAIL);
    await page.fill('input[type="password"]', SUPERADMIN_PASSWORD);
    
    const loginButton = page.locator('button').filter({ hasText: /iniciar sesión|entrar|login/i }).first();
    await loginButton.click();
    
    await page.waitForURL(/\/(dashboard|home)/, { timeout: TEST_CONFIG.pageTimeout });
    
    expect(page.url()).toMatch(/\/(dashboard|home)/);
    console.log('✅ Login exitoso como superadmin');
  });

  // Generar test para cada ruta
  routesToTest.forEach((route: RouteConfig) => {
    const tags = `@${route.category} @${route.priority}-priority`;
    
    test(`Auditar: ${route.name} ${tags}`, async ({ page }) => {
      const report: ErrorReport = {
        route: route.name,
        url: route.url,
        category: route.category,
        priority: route.priority,
        consoleErrors: [],
        networkErrors: [],
        hydrationErrors: false,
        accessibilityIssues: [],
        missingElements: [],
        brokenImages: [],
        status: 'ok',
      };

      // Setup listeners
      setupConsoleListeners(page, report.consoleErrors);
      setupNetworkListeners(page, report.networkErrors);

      try {
        const startTime = Date.now();
        
        // Navegar a la ruta (domcontentloaded es más rápido que networkidle)
        await page.goto(`${BASE_URL}${route.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: TEST_CONFIG.pageTimeout,
        });
        
        // Esperar estabilización
        await page.waitForTimeout(TEST_CONFIG.stabilizationTime);

        report.loadTime = Date.now() - startTime;

        // Detectar hydration errors
        report.hydrationErrors = await detectHydrationErrors(page);

        // Verificar accesibilidad
        report.accessibilityIssues = await checkBasicAccessibility(page);

        // Verificar imágenes rotas
        report.brokenImages = await checkBrokenImages(page);

        // Capturar screenshot si está habilitado
        if (TEST_CONFIG.captureScreenshots) {
          const screenshotPath = path.join(
            SCREENSHOTS_DIR,
            `${route.category}-${route.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: false });
          report.screenshot = screenshotPath;
        }

        // Determinar estado
        if (report.consoleErrors.some(e => e.type === 'error') ||
            report.networkErrors.some(e => e.status >= 500) ||
            report.hydrationErrors) {
          report.status = 'error';
        } else if (report.consoleErrors.length > 0 ||
                   report.networkErrors.length > 0 ||
                   report.accessibilityIssues.length > 0 ||
                   report.brokenImages.length > 0) {
          report.status = 'warning';
        }

        console.log(`${report.status === 'ok' ? '✅' : report.status === 'warning' ? '⚠️' : '❌'} ${route.name}`);
      } catch (error: any) {
        console.error(`❌ Error auditando ${route.name}:`, error.message);
        report.consoleErrors.push({
          type: 'error',
          message: `Error navegando a la ruta: ${error.message}`,
        });
        report.status = 'error';
      }

      allReports.push(report);
    });
  });

  test.afterAll(() => {
    // Generar reporte HTML
    generateHTMLReport(allReports);

    // Generar reporte JSON
    fs.writeFileSync(
      path.join(REPORT_DIR, 'report.json'),
      JSON.stringify({ routes: allReports }, null, 2)
    );

    // Log resumen en consola
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE AUDITORÍA EXHAUSTIVA');
    console.log('='.repeat(80));
    console.log(`Total de rutas auditadas: ${allReports.length}`);
    console.log(`✅ Sin errores: ${allReports.filter(r => r.status === 'ok').length}`);
    console.log(`⚠️ Con warnings: ${allReports.filter(r => r.status === 'warning').length}`);
    console.log(`❌ Con errores: ${allReports.filter(r => r.status === 'error').length}`);
    console.log(`⏭️ Omitidos: ${allReports.filter(r => r.status === 'skipped').length}`);
    console.log('='.repeat(80));
    console.log(`\n📄 Reporte completo: ${path.join(REPORT_DIR, 'index.html')}`);
  });
});
